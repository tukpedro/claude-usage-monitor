# 04 — Internals

Como os números são calculados por dentro: leitura do transcript, métrica de custo e o cache que mantém o statusline rápido.

## Documents in this layer

- **[[Internals-Context-Calc]]** — como o tok/msg sai do transcript (sidechain, compact)
- **[[Internals-Metric]]** — por que a métrica é custo-equivalente, não tokens crus
- **[[Internals-Cache]]** — cache, lock e refresh em background a partir do statusline
