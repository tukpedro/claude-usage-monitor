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

## Caveat: por que não fica exatamente igual

A calibração faz o número **bater no instante** em que você roda. Mas "exatamente igual o tempo todo" não é possível localmente, por três motivos:

1. **É estimativa viva** — sessão/semana sobem conforme você usa. Calibrou em 35%; minutos depois (com mais uso) já está em 41%, e o /usage também subiu. A diferença momentânea é só tempo passando, não erro.
2. **A ponderação difere** — o custo-equivalente do ccusage não escala perfeitamente com o peso interno da Anthropic. Prova: a semana calibrada a 35%↔$94 deu teto $268; depois, a 38%↔$127, deu teto $334 — o teto "se moveu".
3. **ccusage só vê esta máquina** — uso em outro device ou no claude.ai entra no % oficial mas não no local.

Solução prática: rode `--calibrate-week/-session <pct>` sempre que olhar o /usage e quiser re-sincronizar. A fonte exata é sempre o /usage.
