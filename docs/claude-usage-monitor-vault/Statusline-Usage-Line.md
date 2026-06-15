# Statusline-Usage-Line

A **linha 2** do statusline — uso estimado de sessão e semana.

```
uso≈ · sessão ▕█░░░░░░░▏ 🟢 19% $7.4 · semana ▕███░░░░░▏ 🟢 36% $96
```

- **sessão** — % do bloco de 5h ativo (custo-equivalente vs teto de sessão).
- **semana** — % da semana corrente (custo-equivalente vs teto de semana).
- Cores: verde < 50%, amarelo 50–80%, vermelho ≥ 80%.
- O prefixo `uso≈` lembra que é **estimativa** (a oficial é o /usage).

## Como ela se mantém viva

A linha 2 **não** roda o ccusage a cada render (seria lento). Em vez disso:

1. Lê um arquivo de cache (`~/.claude/.usage-cache.json`).
2. Se o cache estiver velho (>20s) e ninguém estiver atualizando, dispara um refresh **em background** (`usage-core.js --cache`, destacado) e renderiza com o valor atual.

Resultado: o statusline continua instantâneo e os números se atualizam a cada ~20s. Detalhes em Internals-Cache. Os tetos e a calibração ficam em Panel-Calibration.

## Estado "carregando"

Na primeira vez (sem cache ainda) aparece `uso≈ carregando…`. Depois do primeiro refresh, os valores aparecem e seguem se atualizando a cada mensagem.
