# Foundation-Glossary

Vocabulário usado no resto da vault.

- **Contexto** — tudo que o modelo "enxerga" num turno (histórico da conversa + arquivos lidos + system prompt). Medido em tokens.
- **tok/msg** — tokens de *input* que cada mensagem custa. Numericamente igual ao contexto atual, porque o modelo relê tudo a cada turno. É o "consumo instantâneo".
- **Janela** — capacidade máxima de contexto do modelo (ex.: 200k ou 1M tokens). O "tamanho do tanque".
- **Custo acumulado (`$`)** — o que aquilo custaria na API pay-as-you-go. Na assinatura **não é cobrança real**; serve como hodômetro da sessão.
- **Faixa de economia** — ENXUTO → BOM → MÉDIO → PESADO → CARO, derivada do tok/msg.
- **`/compact`** — resume a conversa, derrubando o contexto (e portanto o tok/msg). Não mexe no `$` acumulado.
- **`/clear`** — zera a sessão (contexto e contadores).
