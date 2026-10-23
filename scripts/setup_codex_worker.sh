#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
WORKER="$ROOT/scripts/codex_issue_worker.py"
LOGDIR="$HOME/.local/share/web-bien-s2-codex"
mkdir -p "$LOGDIR"
for binary in python3 git gh codex npm; do
  if ! command -v "$binary" >/dev/null 2>&1; then
    echo "Missing $binary in this WSL distro. Install it, then rerun." >&2
    exit 1
  fi
done
if ! gh auth status >/dev/null 2>&1; then
  echo "Log into GitHub: gh auth login" >&2
  exit 1
fi
if ! codex login status >/dev/null 2>&1; then
  echo "Log into Codex CLI in WSL: codex login" >&2
  exit 1
fi
if command -v systemctl >/dev/null 2>&1 && systemctl --user show-environment >/dev/null 2>&1; then
  mkdir -p "$HOME/.config/systemd/user"
  printf -v worker_quoted '%q' "$WORKER"
  cat > "$HOME/.config/systemd/user/web-bien-codex-worker.service" <<EOF
[Unit]
Description=WEB_BIEN_S2 GitHub Issue to Codex CLI worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/bin/bash -lc 'exec python3 $worker_quoted'
Restart=always
RestartSec=20

[Install]
WantedBy=default.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now web-bien-codex-worker.service
  echo "Worker enabled. Check: systemctl --user status web-bien-codex-worker"
  echo "Logs: journalctl --user -u web-bien-codex-worker -f"
else
  nohup python3 "$WORKER" >> "$LOGDIR/worker.log" 2>&1 < /dev/null &
  echo "Worker started (PID $!). Logs: $LOGDIR/worker.log"
  echo "Restart after WSL/Windows reboot if systemd user service is unavailable."
fi
