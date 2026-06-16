# Ops-Restore

Reconstruir tudo do zero — depois de formatar a máquina ou num computador novo.

## Pré-requisitos da máquina

1. **Node.js** (qualquer versão recente; foi feito no v24 via nvm).
2. **git** e **gh** (GitHub CLI) autenticado: `gh auth login`.

## Passo a passo

```bash
# 1. clonar o repositório
mkdir -p ~/projects/tukpedro
git clone https://github.com/tukpedro/claude-usage-monitor.git ~/projects/tukpedro/claude-usage-monitor
cd ~/projects/tukpedro/claude-usage-monitor

# 2. instalar (cria o symlink ~/.claude/statusline.js)
./install.sh

# 3. ligar o statusline: editar ~/.claude/settings.json e adicionar
#    "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }

# 4. reiniciar o Claude Code para o statusline aparecer
```

## Verificar

```bash
printf '{}' | node ~/.claude/statusline.js   # deve imprimir a linha do medidor
```

No Claude Code, o statusline deve aparecer após reiniciar.
