#!/usr/bin/env bash
# auto-push.sh — safety net: commits & pushes any changes to GitHub on an interval,
# so your work is never lost even if your battery dies.
#
# Usage:
#   bash auto-push.sh            # every 120 seconds (default)
#   bash auto-push.sh 30         # every 30 seconds
#   bash auto-push.sh 60 stop    # stop a running auto-push
#
# It only commits when there are changes, and it never touches the server/database
# files (those are gitignored anyway).

set -u
INTERVAL="${1:-120}"
ACTION="${2:-run}"

cd "$(dirname "$0")"

PID_FILE=".auto-push.pid"

stop() {
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null && echo "Stopped auto-push (pid $(cat "$PID_FILE"))."
    rm -f "$PID_FILE"
  else
    echo "No auto-push running (no $PID_FILE)."
  fi
  exit 0
}

[ "$ACTION" = "stop" ] && stop

# Don't start twice
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "auto-push already running (pid $(cat "$PID_FILE")). Use: bash auto-push.sh 60 stop"
  exit 0
fi

echo "$$" > "$PID_FILE"
echo "auto-push started (pid $$) — committing & pushing every ${INTERVAL}s to github.com/Meet-hybrid/meet-apply"
echo "Stop with: bash auto-push.sh ${INTERVAL} stop"

while true; do
  if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git add -A
    git -c user.name='michael philip' -c user.email='philipmichaelonyekachi' \
      commit -m "auto-save: $(date '+%Y-%m-%d %H:%M')" --quiet
    git push --quiet origin main && echo "[$(date '+%H:%M:%S')] committed & pushed"
  fi
  sleep "$INTERVAL"
done
