# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""List YouTube videos published since the last run for every event with a known channel/playlist.

Uses the public RSS feeds (latest ~15 uploads per feed), downloads available subtitles with yt-dlp,
and writes routine/state/new-videos.json for the daily Claude step.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "routine/state"
TRANSCRIPTS = ROOT / "transcripts"
CACHE = STATE / "channel-ids.json"
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}


def feed_url(url: str, channel_ids: dict[str, str]) -> str | None:
    if m := re.search(r"[?&]list=([\w-]+)", url):
        return f"https://www.youtube.com/feeds/videos.xml?playlist_id={m.group(1)}"
    if m := re.search(r"/channel/(UC[\w-]{22})", url):
        return f"https://www.youtube.com/feeds/videos.xml?channel_id={m.group(1)}"
    if url not in channel_ids:
        out = subprocess.run(
            ["yt-dlp", "--no-update", "--flat-playlist", "--playlist-items", "1", "--print", "playlist_channel_id",
             url.rstrip("/") + "/videos"],
            capture_output=True, text=True, timeout=120,
        )
        cid = out.stdout.strip().splitlines()[0] if out.stdout.strip() else ""
        if not cid.startswith("UC"):
            print(f"  ! channel id not found for {url}", file=sys.stderr)
            return None
        channel_ids[url] = cid
    return f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_ids[url]}"


def fetch_feed(url: str) -> list[dict[str, str]]:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        root = ET.fromstring(r.read())
    return [
        {
            "videoId": e.findtext("yt:videoId", namespaces=NS) or "",
            "title": e.findtext("a:title", namespaces=NS) or "",
            "published": e.findtext("a:published", namespaces=NS) or "",
        }
        for e in root.findall("a:entry", NS)
    ]


def vtt_to_text(vtt: Path) -> str:
    lines: list[str] = []
    for line in vtt.read_text(errors="ignore").splitlines():
        line = re.sub(r"<[^>]+>", "", line).strip()
        if not line or "-->" in line or line.startswith(("WEBVTT", "Kind:", "Language:")) or line.isdigit():
            continue
        if not lines or lines[-1] != line:
            lines.append(line)
    return "\n".join(lines)


def transcript(video_id: str) -> str | None:
    txt = TRANSCRIPTS / f"{video_id}.txt"
    if txt.exists():
        return str(txt.relative_to(ROOT))
    subprocess.run(
        ["yt-dlp", "--no-update", "--skip-download", "--write-subs", "--write-auto-subs", "--sub-langs", "fr.*,en.*,fr,en",
         "--sub-format", "vtt", "-o", str(TRANSCRIPTS / "%(id)s"), f"https://www.youtube.com/watch?v={video_id}"],
        capture_output=True, text=True, timeout=300,
    )
    vtts = sorted(TRANSCRIPTS.glob(f"{video_id}*.vtt"), key=lambda p: (".fr" not in p.name, "orig" in p.name))
    if not vtts:
        return None
    txt.write_text(vtt_to_text(vtts[0]))
    return str(txt.relative_to(ROOT))


def main() -> None:
    STATE.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS.mkdir(exist_ok=True)
    last_run_file = STATE / "last-youtube-scan"
    since = (
        datetime.fromisoformat(last_run_file.read_text().strip())
        if last_run_file.exists()
        else datetime.now(UTC) - timedelta(days=1)
    )
    started = datetime.now(UTC)
    channel_ids: dict[str, str] = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    known = {
        s["video"]["youtubeId"]
        for p in (ROOT / "content/editions").glob("*/*.json")
        for s in json.loads(p.read_text()).get("sessions", [])
        if s.get("video") and s["video"].get("youtubeId")
    }

    found: list[dict[str, object]] = []
    for p in sorted((ROOT / "content/events").glob("*.json")):
        ev = json.loads(p.read_text())
        yt = ev.get("youtube") or {}
        urls = [u for u in [yt.get("channel"), *yt.get("playlists", [])] if u]
        seen: set[str] = set()
        for u in urls:
            try:
                f = feed_url(u, channel_ids)
                entries = fetch_feed(f) if f else []
            except Exception as exc:  # network hiccup on one feed must not stop the scan
                print(f"  ! {p.stem}: {u}: {exc}", file=sys.stderr)
                continue
            for e in entries:
                if e["videoId"] in seen or e["videoId"] in known:
                    continue
                seen.add(e["videoId"])
                if datetime.fromisoformat(e["published"]) < since:
                    continue
                found.append({"event": p.stem, **e, "transcript": transcript(e["videoId"])})
                print(f"  + {p.stem}: {e['title']}")

    CACHE.write_text(json.dumps(channel_ids, indent=2))
    (STATE / "new-videos.json").write_text(json.dumps(found, ensure_ascii=False, indent=2))
    last_run_file.write_text(started.isoformat())
    print(f"{len(found)} new video(s) since {since.isoformat()}")


if __name__ == "__main__":
    main()
