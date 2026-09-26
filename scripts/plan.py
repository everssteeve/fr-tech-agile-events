# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compute tonight's work list and write routine/state/plan.json.

Queues, each with a nightly budget so the backlog is worked through progressively:
- window:   editions ended in the last 14 days, re-synthesized every night while feedback flows in (no limit);
- backlog:  past editions still "pending" (e.g. discovered historical editions), most recent first;
- revisit:  synthesized editions flagged `revisit` (thin corpus), oldest update first;
- history:  events whose past editions (last 20 years) have not been looked up yet;
- months:   monthly syntheses older than one of their edition syntheses (computed before tonight's work;
            the Claude step re-checks after step 4).
Also flips "scheduled" editions whose end date has passed to "pending".
"""

from __future__ import annotations

import calendar
import json
import os
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
WINDOW_DAYS = 14
HISTORY_YEARS = 20
BACKLOG_PER_DAY = int(os.environ.get("BACKLOG_PER_DAY", 6))
REVISITS_PER_DAY = int(os.environ.get("REVISITS_PER_DAY", 3))
HISTORY_PER_DAY = int(os.environ.get("HISTORY_PER_DAY", 4))


def end_date(d: dict) -> date:
    """Last possible day of the edition, from YYYY-MM-DD, YYYY-MM or YYYY."""
    s = d.get("end") or d["start"]
    if len(s) == 4:
        return date(int(s), 12, 31)
    if len(s) == 7:
        y, m = int(s[:4]), int(s[5:7])
        return date(y, m, calendar.monthrange(y, m)[1])
    return date.fromisoformat(s)


def main() -> None:
    today = datetime.now(ZoneInfo("Europe/Paris")).date()
    window: list[dict] = []
    backlog: list[tuple[str, dict]] = []
    revisits: list[tuple[str, dict]] = []
    for p in sorted((ROOT / "content/editions").glob("*/*.json")):
        d = json.loads(p.read_text())
        end = end_date(d)
        if end >= today:
            continue
        if d["status"] == "scheduled":
            d["status"] = "pending"
            p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
        item = {"file": str(p.relative_to(ROOT)), "title": d["title"], "end": end.isoformat()}
        if today - end <= timedelta(days=WINDOW_DAYS):
            window.append({**item, "reason": "fenêtre de 14 jours"})
        elif d["status"] == "pending":
            backlog.append((end.isoformat(), {**item, "reason": "file d'attente : synthèse à rédiger"}))
        elif d.get("revisit"):
            revisits.append((d.get("synthesisUpdatedAt", ""), {**item, "reason": f"à compléter : {d['revisit']}"}))

    # Monthly syntheses to (re)write: a month with a synthesized edition updated after the month synthesis.
    month_updates: dict[str, str] = {}
    for p in (ROOT / "content/editions").glob("*/*.json"):
        d = json.loads(p.read_text())
        if d["status"] == "synthesized" and len(d["start"]) >= 7:
            m = d["start"][:7]
            month_updates[m] = max(month_updates.get(m, ""), d.get("synthesisUpdatedAt", ""))
    months_todo = []
    for m, last in sorted(month_updates.items()):
        f = ROOT / "content/months" / f"{m}.md"
        current = ""
        if f.exists():
            for line in f.read_text().splitlines():
                if line.startswith("updatedAt:"):
                    current = line.split(":", 1)[1].strip().strip('"')
        if not f.exists() or last > current:
            months_todo.append(m)

    history_todo = []
    for p in sorted((ROOT / "content/events").glob("*.json")):
        ev = json.loads(p.read_text())
        if not (ev.get("history") or {}).get("checkedAt"):
            known = sorted(int(f.stem) for f in (ROOT / "content/editions" / p.stem).glob("*.json"))
            history_todo.append({"event": p.stem, "name": ev["name"], "website": ev.get("website"), "knownYears": known})

    backlog.sort(key=lambda x: x[0], reverse=True)
    revisits.sort(key=lambda x: x[0])
    plan = {
        "today": today.isoformat(),
        "historyFromYear": today.year - HISTORY_YEARS,
        "to_synthesize": window
        + [b for _, b in backlog[:BACKLOG_PER_DAY]]
        + [r for _, r in revisits[:REVISITS_PER_DAY]],
        "history_discovery": history_todo[:HISTORY_PER_DAY],
        "months_to_update": months_todo,
        "queues": {
            "window": len(window),
            "backlog": len(backlog),
            "revisit": len(revisits),
            "history": len(history_todo),
            "months": len(months_todo),
        },
    }
    out = ROOT / "routine/state/plan.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(plan, ensure_ascii=False, indent=2))
    q = plan["queues"]
    print(
        f"tonight: {len(plan['to_synthesize'])} synthesis, {len(plan['history_discovery'])} history lookups | "
        f"queues: window={q['window']} backlog={q['backlog']} revisit={q['revisit']} history={q['history']} "
        f"months={q['months']}"
    )


if __name__ == "__main__":
    main()
