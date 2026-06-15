# Panel-Calibration

Como as % de sessão e semana são produzidas — e como alinhá-las ao /usage.

## A métrica e os tetos

A métrica é **custo-equivalente** (USD). Pra virar %, divide-se pelo **teto** da cota, guardado em `~/.claude/usage-ceilings.json`:

```json
{ "sessionCost": 40, "weekCost": 268.63 }
```

`% = custo_atual / teto * 100`. Por que custo e não tokens crus: ver Internals-Metric.

## Calibrar com o /usage

Como o teto real do plano não é exposto em lugar nenhum local, calibra-se a partir de um ponto: com o `/usage` aberto mostrando o %, rode

```bash
node ~/.claude/usage-core.js --calibrate-week 35      # ex.: /usage mostra semana 35%
node ~/.claude/usage-core.js --calibrate-session 80   # precisa sessão > 0%
```

O comando lê o custo atual (sessão ou semana) e resolve o teto: `teto = custo / (pct/100)`, salvando em `usage-ceilings.json`.

## Estado atual conhecido

- **Semana**: calibrada de 35% ↔ $94.02 (2026-06-15) → teto ≈ $268.63.
- **Sessão**: ainda no chute (`$40`). Calibrar na próxima vez que o /usage mostrar sessão > 0%.

## Caveat

A janela de semana do ccusage pode não casar 100% com a janela oficial da Anthropic, então a calibração absorve só parte da diferença. Continua sendo **estimativa**.
