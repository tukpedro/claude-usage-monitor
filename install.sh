#!/usr/bin/env bash
# Instala o claude-usage-monitor: symlink do statusline em ~/.claude.
# Idempotente — pode rodar de novo sem problema.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE="$HOME/.claude"
mkdir -p "$CLAUDE"

# symlink (fonte da verdade = este repo)
ln -sf "$DIR/statusline.js" "$CLAUDE/statusline.js"
echo "✓ symlink: ~/.claude/statusline.js -> $DIR/statusline.js"

cat <<'EOF'

Falta 1 passo manual — adicione ao ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }

Depois: reinicie o Claude Code. Pronto.
EOF
