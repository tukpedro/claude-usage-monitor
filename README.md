# claude-usage-monitor

Tooling pessoal pra **acompanhar e economizar** consumo de tokens no [Claude Code](https://claude.com/claude-code).
Tudo **100% local** (lê os logs em `~/.claude/projects/**/*.jsonl` via [ccusage](https://github.com/ryoppippi/ccusage)) — **não gasta token**.

## O que faz

**1. Statusline (2 linhas, sempre à vista)** — `statusline.js`

```
Opus 4.8 (1M context) · ⛽ 174k/msg ▕███░░░░░▏ 🟡 MÉDIO · 17% da janela · $693 · +40k/-5k
uso≈ · sessão ▕█░░░░░░░▏ 🟢 19% $7.4 · semana ▕███░░░░░▏ 🟢 36% $96
```

- **Linha 1 — medidor de consumo:** `⛽ tok/msg` = quanto de *input* cada mensagem custa (= o contexto atual, pois o modelo relê tudo a cada turno). Faixas: `ENXUTO → BOM → MÉDIO → PESADO → CARO` (com dica `→ /compact`). Detecta janela de 1M, ignora subagentes (`isSidechain`) e corrige o contexto após `/compact` (via `compact_boundary`).
- **Linha 2 — uso de sessão/semana:** estimativa de % com as cores verde/amarelo/vermelho.

**2. Painel ao vivo (1s)** — `usage-core.js --panel`

```
 ⛽ USO AO VIVO    ≈ estimativa local · oficial: /usage

  SESSÃO 5h   ▕████░░░░░░░░░░░░░░░░░░░░▏ 19%
              $7.43 de ~$40    burn $12.7/h    projeção fim $61    bloco até 21:00

  SEMANA      ▕█████████░░░░░░░░░░░░░░░▏ 36%
              $95.61 de ~$268.63
```

Roda num terminal ao lado (tela alternativa, redesenha no lugar, Ctrl+C restaura).

## Instalação

```bash
npm i -g ccusage          # pré-requisito
git clone <este-repo>
cd claude-usage-monitor
./install.sh              # cria symlinks em ~/.claude + alias `uso`
```

Depois adicione ao `~/.claude/settings.json`:

```json
"statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }
```

Reinicie o Claude Code. Pra abrir o painel: `uso`.

## Métrica e calibração

A métrica é **custo-equivalente (USD)** — o melhor proxy local do limite oficial. As barras de % usam tetos em `usage-ceilings.json`. Pra alinhar com o número real do `/usage`:

```bash
# com o /usage aberto mostrando os %:
node ~/.claude/usage-core.js --calibrate-week <pct>      # ex.: 35
node ~/.claude/usage-core.js --calibrate-session <pct>   # ex.: 80 (precisa sessão > 0%)
```

## ⚠️ Caveats

- Tudo é **estimativa local**: o ccusage lê só os logs **desta máquina** e o bloco de 5h dele pode não casar 100% com a janela oficial da Anthropic.
- **A fonte canônica é sempre `/usage`.**

## Arquivos

| Arquivo | Papel |
|---|---|
| `statusline.js` | statusline do Claude Code (medidor + linha de uso) |
| `usage-core.js` | motor (ccusage), painel `--panel`, calibração, cache |
| `usage-ceilings.example.json` | tetos de exemplo (copie p/ `~/.claude/usage-ceilings.json`) |
| `install.sh` | symlinks + alias |
