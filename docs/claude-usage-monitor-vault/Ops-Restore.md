# Ops-Restore

Reconstruir tudo do zero — depois de formatar a máquina ou num computador novo.

## Pré-requisitos da máquina

1. **Node.js** (qualquer versão recente; foi feito no v24 via nvm).
2. **git** e **gh** (GitHub CLI) autenticado: `gh auth login`.

## Passo a passo

```bash
# 1. ccusage (dependência dos números de sessão/semana)
npm i -g ccusage

# 2. clonar o repositório
mkdir -p ~/projects/tukpedro
git clone https://github.com/tukpedro/claude-usage-monitor.git ~/projects/tukpedro/claude-usage-monitor
cd ~/projects/tukpedro/claude-usage-monitor

# 3. instalar (symlinks em ~/.claude + alias `uso`)
./install.sh

# 4. ligar o statusline: editar ~/.claude/settings.json e adicionar
#    "statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }

# 5. recarregar o shell (pro alias) e reiniciar o Claude Code (pro statusline)
source ~/.zshrc
```

## Verificar

```bash
node ~/.claude/usage-core.js --line     # deve imprimir a linha de uso colorida
uso                                      # abre o painel ao vivo (Ctrl+C sai)
```

No Claude Code, o statusline de 2 linhas deve aparecer após reiniciar.

## Recalibrar

A calibração (`usage-ceilings.json`) é **local** e não vem no clone. Com o `/usage` aberto:

```bash
node ~/.claude/usage-core.js --calibrate-week <pct>
node ~/.claude/usage-core.js --calibrate-session <pct>
```

São só dois números (tetos em custo-equivalente); refazer leva 30 segundos. Detalhes em Panel-Calibration.

## O que NÃO precisa restaurar

Os arquivos de runtime (`.usage-cache.json`, `.usage-refresh.lock`) são recriados sozinhos. Não estão no repo (ver o `.gitignore`).
