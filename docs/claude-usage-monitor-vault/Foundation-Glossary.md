# Foundation-Glossary

Vocabulário usado no resto da vault.

- **Contexto** — tudo que o modelo "enxerga" num turno (histórico da conversa + arquivos lidos + system prompt). Medido em tokens.
- **tok/msg** — tokens de *input* que cada mensagem custa. Numericamente igual ao contexto atual, porque o modelo relê tudo a cada turno. É o "consumo instantâneo".
- **Janela** — capacidade máxima de contexto do modelo (ex.: 200k ou 1M tokens). O "tamanho do tanque".
- **Sessão / bloco 5h** — janela de cota de ~5 horas. No ccusage aparece como "bloco" (block). Reseta sozinha.
- **Semana** — a outra janela de cota; reseta semanalmente.
- **Burn rate** — velocidade de gasto (tokens/min ou $/h) no bloco ativo.
- **Projeção** — estimativa do ccusage de onde o bloco vai terminar se o ritmo continuar.
- **Custo-equivalente** — o "$" que o Claude Code mostra: o que aquilo custaria na API pay-as-you-go. Na assinatura **não é cobrança real**; é usado aqui como métrica ponderada (proxy do limite).
- **Teto (ceiling)** — valor em custo-equivalente que representa 100% de uma cota, guardado em `usage-ceilings.json`. Usado pra transformar custo em %.
- **Faixa de economia** — ENXUTO → BOM → MÉDIO → PESADO → CARO, derivada do tok/msg.
- **`/compact`** — resume a conversa, derrubando o contexto (e portanto o tok/msg). Não mexe no "$" acumulado.
- **`/clear`** — zera a sessão (contexto e contadores).
