# Statusline-Fuel-Gauge

O statusline — uma linha com o medidor de consumo por mensagem.

```
Opus 4.8 (1M context) · ⛽ 174k/msg ▕███░░░░░▏ 🟡 MÉDIO · 17% da janela · $693 · +40k/-5k
```

## Campos

| Trecho | Significado |
|---|---|
| `Opus 4.8 (1M context)` | modelo + janela (vem do JSON do Claude Code) |
| `⛽ 174k/msg` | tokens de input por mensagem = contexto atual |
| `▕███░░░░░▏` | barra de consumo contra um teto de **600k** |
| `🟡 MÉDIO` | faixa de economia (com dica `→ /compact` em PESADO/CARO) |
| `17% da janela` | capacidade ocupada (nível do tanque) |
| `$693` | custo acumulado da sessão |
| `+40k/-5k` | linhas adicionadas/removidas |

## Faixas de economia (por tok/msg)

| Faixa | Limite | Cor |
|---|---|---|
| ENXUTO | < 80k | verde |
| BOM | 80–180k | verde |
| MÉDIO | 180–320k | amarelo |
| PESADO | 320–500k | laranja (→ /compact) |
| CARO | ≥ 500k | vermelho (→ /compact) |

A barra enche contra **600k** de propósito: fica vermelha *antes* do limite de 1M, pra avisar cedo. As faixas vivem na função `zone()` em `statusline.js`.

## Após /compact

Logo depois de um `/compact`, o script detecta o `compact_boundary` no transcript e exibe `⛽ compactado ✓` até o próximo turno, quando o número real do contexto resumido aparece.

A detecção de janela 1M, o filtro de subagentes e o tratamento de `/compact` estão descritos em [[Internals-Context-Calc]].
