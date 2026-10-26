#!/bin/zsh
# Daily routine, triggered by launchd at 03:00 Europe/Paris (see routine/launchd.plist).
set -euo pipefail

REPO="${0:A:h:h}"
cd "$REPO"
export PATH="$HOME/.local/bin:$HOME/.volta/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
mkdir -p routine/logs routine/state
LOG="routine/logs/$(date +%Y-%m-%d).log"
exec >>"$LOG" 2>&1

echo "=== $(date '+%F %T %Z') daily routine start"

# Only one run at a time.
LOCK=routine/state/lock
if ! mkdir "$LOCK" 2>/dev/null; then echo "already running, exit"; exit 0; fi

# Problems that don't stop the run but deserve a look (Claude step interrupted, files quarantined).
WARNINGS=()

notify() {
  osascript -e "display notification \"$1\" with title \"fr-tech-agile-events\" subtitle \"Routine du $(date +%F)\" sound name \"Basso\"" || true
}

on_exit() {
  local rc=$?
  rmdir "$LOCK" 2>/dev/null || true
  if (( rc != 0 )); then
    echo "=== $(date '+%F %T %Z') FAILED (exit $rc)"
    notify "Échec (code $rc). Voir $LOG"
  elif (( ${#WARNINGS} )); then
    notify "Terminée avec alertes : ${(j:, :)WARNINGS}"
  fi
}
trap on_exit EXIT

git pull --rebase --autostash --quiet
pnpm install --frozen-lockfile --silent

uv run scripts/plan.py
uv run scripts/youtube_scan.py

# Each run is a fresh Claude session with its own web-search budget.
export CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION="${CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION:-200}"
# claude -p stops background subagents 10 min after its last turn by default, cutting syntheses and the final steps short.
export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0

# An interrupted session (usage limit, crash) still leaves valid work behind: keep going and commit it.
claude -p "$(cat routine/daily-prompt.md)" \
  --permission-mode acceptEdits \
  --strict-mcp-config \
  --allowedTools "Read Write Edit Glob Grep WebSearch WebFetch Agent TodoWrite Bash(yt-dlp:*) Bash(uv run:*) Bash(pnpm validate) Bash(pnpm build) Bash(python3:*) Bash(ls:*) Bash(cat:*) Bash(jq:*) Bash(curl:*) Bash(node:*) Bash(grep:*) Bash(find:*) Bash(head:*) Bash(tail:*) Bash(wc:*) Bash(sort:*) Bash(mkdir:*) Bash(date:*) Bash(git status:*) Bash(git diff:*) Bash(git log:*)" \
  --output-format text \
  || { echo "claude exited with $?"; WARNINGS+=("session Claude interrompue"); }

QUARANTINED="$(uv run scripts/quarantine_invalid.py)"
if [[ -n "$QUARANTINED" ]]; then
  echo "$QUARANTINED"
  WARNINGS+=("$(echo "$QUARANTINED" | wc -l | tr -d ' ') JSON invalide(s) écarté(s)")
fi

pnpm validate
pnpm build >/dev/null

if [[ -n "$(git status --porcelain content)" ]]; then
  git add content
  git commit -q -m "chore(content): daily update $(date +%F)" -m "$(cat routine/state/last-report.md 2>/dev/null || true)"
  git push -q
  echo "pushed"
else
  echo "no content change"
fi
echo "=== $(date '+%F %T %Z') done"
