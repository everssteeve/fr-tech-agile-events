# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Compute today's synthesis work list and write routine/state/plan.json.

- to_synthesize: editions ended in the last 14 days (re-synthesized every day while feedback flows in),
  plus any past edition still "pending" (catch-up).
- started/scheduled editions whose end date passed are flipped to "pending".
"""

from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
WINDOW_DAYS = 14
REVISITS_PER_DAY = 3


def main() -> None:
    today = datetime.now(ZoneInfo("Europe/Paris")).date()
    todo: list[dict[str, str]] = []
    revisits: list[tuple[str, dict[str, str]]] = []
    for p in sorted((ROOT / "content/editions").glob("*/*.json")):
        d = json.loads(p.read_text())
        if len(d["start"]) != 10:
            continue
        end = date.fromisoformat(d.get("end") or d["start"])
        if end >= today:
            continue
        if d["status"] == "scheduled":
            d["status"] = "pending"
            p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
        recent = today - end <= timedelta(days=WINDOW_DAYS)
        item = {"file": str(p.relative_to(ROOT)), "title": d["title"], "end": end.isoformat()}
        if recent or d["status"] == "pending":
            todo.append({**item, "reason": "fenêtre de 14 jours" if recent else "rattrapage (synthèse manquante)"})
        elif d.get("revisit"):
            revisits.append((d.get("synthesisUpdatedAt", ""), {**item, "reason": f"à compléter : {d['revisit']}"}))
    todo += [r for _, r in sorted(revisits, key=lambda x: x[0])[:REVISITS_PER_DAY]]
    out = ROOT / "routine/state/plan.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"today": today.isoformat(), "to_synthesize": todo}, ensure_ascii=False, indent=2))
    print(f"{len(todo)} edition(s) to (re)synthesize")


if __name__ == "__main__":
    main()
