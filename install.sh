#!/usr/bin/env bash
# Instala o claude-usage-monitor: symlinks em ~/.claude + alias `uso`.
# Idempotente — pode rodar de novo sem problema.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE="$HOME/.claude"
mkdir -p "$CLAUDE"

# 1) symlinks (fonte da verdade = este repo)
ln -sf "$DIR/statusline.js" "$CLAUDE/statusline.js"
ln -sf "$DIR/usage-core.js" "$CLAUDE/usage-core.js"
echo "✓ symlinks: ~/.claude/statusline.js, ~/.claude/usage-core.js -> $DIR"

# 2) config pessoal (não sobrescreve se já existir)
if [ ! -f "$CLAUDE/usage-ceilings.json" ]; then
  cp "$DIR/usage-ceilings.example.json" "$CLAUDE/usage-ceilings.json"
  echo "✓ ~/.claude/usage-ceilings.json criado (do exemplo) — calibre depois"
else
  echo "• ~/.claude/usage-ceilings.json já existe — mantido"
fi

# 3) alias `uso` (tenta zsh e bash)
add_alias() {
  local rc="$1"
  [ -f "$rc" ] || return 0
  if grep -q "alias uso=" "$rc" 2>/dev/null; then
    echo "• alias 'uso' já existe em $rc"
  else
    echo "alias uso='node ~/.claude/usage-core.js --panel'" >> "$rc"
    echo "✓ alias 'uso' adicionado em $rc"
  fi
}
add_alias "$HOME/.zshrc"
add_alias "$HOME/.bashrc"

# 4) checagem do ccusage
if ! command -v ccusage >/dev/null 2>&1; then
  echo "⚠ ccusage não encontrado — rode: npm i -g ccusage"
fi

cat <<'EOF'

Falta 1 passo manual — adicione ao ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }

Depois: reinicie o Claude Code. Painel ao vivo: digite  uso  (ou abra novo terminal).
EOF
