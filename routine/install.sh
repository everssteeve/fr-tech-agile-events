#!/bin/zsh
# Installs the daily launchd job (03:00 Europe/Paris) for this checkout.
set -euo pipefail
REPO="${0:A:h:h}"
LABEL=com.everssteeve.fr-tech-agile-events.daily
DEST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$REPO/routine/logs" "$HOME/Library/LaunchAgents"
sed "s|__REPO__|$REPO|g" "$REPO/routine/launchd.plist" > "$DEST"
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$DEST"
echo "Installed $DEST"
launchctl print "gui/$(id -u)/$LABEL" | grep -E "state|path" | head -5
echo "Tip: to wake the Mac for the run, 'sudo pmset repeat wakeorpoweron MTWRFSU 02:55:00'."
