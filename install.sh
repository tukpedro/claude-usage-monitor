#!/usr/bin/env bash
# Instala o claude-usage-monitor em ~/.claude (symlinks) + alias `uso`.
# Idempotente — pode rodar de novo sem problema.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE="$HOME/.claude"
mkdir -p "$CLAUDE"

# 1) symlinks (fonte da verdade = este repo)
ln -sf "$DIR/statusline.js" "$CLAUDE/statusline.js"
ln -sf "$DIR/usage-real.js" "$CLAUDE/usage-real.js"
echo "✓ symlinks: ~/.claude/statusline.js, ~/.claude/usage-real.js -> $DIR"

# 2) alias `uso` (painel ao vivo do /usage oficial)
add_alias() {
  local rc="$1"; [ -f "$rc" ] || return 0
  if grep -q "alias uso=" "$rc" 2>/dev/null; then
    echo "• alias 'uso' já existe em $rc"
  else
    echo "alias uso='node ~/.claude/usage-real.js --panel'" >> "$rc"
    echo "✓ alias 'uso' adicionado em $rc"
  fi
}
add_alias "$HOME/.zshrc"
add_alias "$HOME/.bashrc"

# 3) tmux é pré-requisito do scraper do /usage
if ! command -v tmux >/dev/null 2>&1; then
  case "$(uname -s)" in
    Darwin)
      echo "⚠ tmux não encontrado — no macOS, instale com: brew install tmux"
      if ! command -v brew >/dev/null 2>&1; then
        echo "Instale primeiro o Homebrew: https://brew.sh"
      fi
      ;;
    Linux)
      echo "⚠ tmux não encontrado — instale pelo gerenciador da distribuição (Debian/Ubuntu: sudo apt install tmux)."
      ;;
    *)
      echo "⚠ tmux não encontrado — instale o tmux para usar a 2ª linha/painel."
      ;;
  esac
fi

cat <<'EOF'

Falta 1 passo manual — adicione ao ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }

Depois: recarregue o shell (alias) e reinicie o Claude Code (statusline).
Painel ao vivo do /usage oficial: digite  uso
EOF
