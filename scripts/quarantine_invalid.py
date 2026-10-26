# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Set aside content JSON files that don't parse, so the rest of the night's work can still be committed.

A tracked file is restored to its committed version (the edition goes back to its previous state and is
picked up again on a later night); an untracked one is moved to routine/state/quarantine/.
Prints one line per file handled; exit code is always 0.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUARANTINE = ROOT / "routine/state/quarantine"


def is_tracked(p: Path) -> bool:
    return (
        subprocess.run(
            ["git", "ls-files", "--error-unmatch", str(p)], cwd=ROOT, capture_output=True, check=False
        ).returncode
        == 0
    )


def main() -> None:
    for p in sorted((ROOT / "content").rglob("*.json")):
        try:
            json.loads(p.read_text())
            continue
        except json.JSONDecodeError as e:
            error = e
        rel = p.relative_to(ROOT)
        # Keep a copy of the broken file for diagnosis either way.
        QUARANTINE.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        shutil.copy(p, QUARANTINE / f"{stamp}-{str(rel).replace('/', '__')}")
        if is_tracked(rel):
            subprocess.run(["git", "checkout", "--", str(rel)], cwd=ROOT, check=True)
            print(f"QUARANTINE: {rel} invalid ({error}), restored committed version")
        else:
            p.unlink()
            print(f"QUARANTINE: {rel} invalid ({error}), new file removed")


if __name__ == "__main__":
    main()
