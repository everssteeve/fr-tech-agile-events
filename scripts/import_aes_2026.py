"""One-off: convert the Agile en Seine 2026 markdown synthesis into the edition schema."""

import json
import re
import sys
import unicodedata
from pathlib import Path

src = Path(sys.argv[1]).read_text()
root = Path(__file__).resolve().parent.parent
out_json = root / "content/editions/agile-en-seine/2026.json"

head, rest = src.split("## Partie 1", 1)
part1, rest = rest.split("## Partie 2 — Synthèse globale", 1)
part2, sources = rest.split("## Sources", 1)

corpus = re.search(r"\*\*Corpus\*\* : (.+)", head).group(1).strip()
limits = re.search(r"\*\*Limites\*\* : (.+)", head).group(1).strip()
theme_line = re.search(r"\*\*Événement\*\* : (.+)", head).group(1).strip()

TYPES = {"Keynote": "keynote", "Conf.": "talk", "Atelier": "workshop", "Ateliers": "workshop", "Formation": "training"}
DAYS = {"Jour 1": "2026-09-22", "Jour 2": "2026-09-23"}


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60]


sessions: list[dict] = []
day = None
without: list[str] = []
blocks = re.split(r"\n(?=###+ )", part1)
for b in blocks:
    first, _, body = b.partition("\n")
    if first.startswith("### "):
        if "sans retour" in first:
            without = [x.strip() for x in body.strip().rstrip(".").split("·") if x.strip()]
        for k, v in DAYS.items():
            if k in first:
                day = v
        continue
    if not first.startswith("#### "):
        continue
    h = first[5:]
    kind, _, rest_h = h.partition(" — ")
    m = re.match(r"(.*»)\s*(?:\((.*)\))?\s*(.*)$", rest_h)
    title_part = m.group(1) if m else rest_h
    speakers_raw = (m.group(2) or "") if m else ""
    extra = (m.group(3) or "").strip(" —") if m else ""
    title = re.sub(r"^«\s*|\s*»$", "", title_part.strip())
    title = title.replace(" » + atelier « ", " / ").replace(" » & « ", " / ")
    if extra:
        title += f" ({extra})"
    speakers = [s.strip() for s in re.split(r",|;", speakers_raw) if s.strip()] if speakers_raw else []
    fb = re.search(r"^\*Retours : (.+)\*$", body, re.M)
    feedback = [x.strip() for x in re.split(r",(?![^()]*\))", fb.group(1))] if fb else []
    summary = re.sub(r"^\*Retours : .+\*$\n?", "", body, flags=re.M).strip().rstrip("-").strip()
    sessions.append({
        "id": slug(title),
        "day": day,
        "type": TYPES.get(kind.split()[0], "other"),
        "title": title,
        "speakers": speakers,
        "feedbackFrom": feedback,
        "summary": summary,
        "summarySources": ["feedback"],
    })

tldr = re.search(r"### À retenir en une phrase\n(.+)", part2).group(1).strip()
actions = re.search(r"### Actions concrètes citées par les participants\n(.+?)(?:\n---|\Z)", part2, re.S).group(1)
takeaways = [re.sub(r"^\d+\.\s*", "", l).strip() for l in actions.strip().splitlines() if l.strip()]
global_md = re.split(r"\n### À retenir en une phrase", part2)[0].strip().strip("-").strip()

data = json.loads(out_json.read_text())
data.update({
    "title": "Agile en Seine & IA 2026",
    "edition": "10e édition",
    "programUrl": "https://www.agileenseine.com/programme-2026/",
    "theme": "Agilité & IA",
    "status": "synthesized",
    "synthesisUpdatedAt": "2026-09-25",
    "corpus": corpus,
    "limits": limits,
    "tldr": tldr,
    "keyTakeaways": takeaways,
    "sessions": sessions,
    "sessionsWithoutFeedback": without,
    "sources": [
        {"label": "Programme officiel", "url": "https://www.agileenseine.com/programme-2026/"},
        {"label": "Posts LinkedIn publics (22–25/09/2026) : " + sources.split("\n")[1].split(" de : ", 1)[-1].strip()},
    ],
})
data["note"] = theme_line
out_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
(out_json.with_suffix(".md")).write_text("---\n---\n\n" + global_md + "\n")
print(len(sessions), "sessions,", len(without), "without feedback,", len(takeaways), "takeaways")
