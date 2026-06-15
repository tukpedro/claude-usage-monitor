# Internals-Metric

Por que a métrica de sessão/semana é **custo-equivalente** (USD), não tokens crus.

## O problema com tokens crus

O `totalTokens` do ccusage é dominado por **cache reads**. Num bloco real, por exemplo: 47k input + 2.0M cache read + 325k cache creation + 82k output. O cache read é >80% do total — mas no limite oficial ele pesa pouquíssimo (leitura de cache é ~10% do preço de input fresco). Usar `totalTokens` faria a % refletir quase só cache, descolando do real.

## Por que custo funciona melhor

O `costUSD` que o ccusage calcula **já pondera** cada tipo de token pelo preço real (input, output, cache read, cache creation). Ou seja, é uma soma normalizada por custo — o mesmo eixo que o limite de assinatura aproxima. Por isso a sessão e a semana usam `costUSD` / `totalCost`, não tokens.

> Lembrete: na assinatura esse "$" **não é cobrança**. É só a unidade ponderada usada como proxy do limite. Ver Foundation-Glossary.

## Tetos

Pra virar %, divide-se o custo pelo teto da cota (`usage-ceilings.json`). Como o teto real do plano não é público, calibra-se de um ponto do /usage (ver Panel-Calibration). É aproximação — assumida e sinalizada com `≈` em toda a UI.

## Onde isso vive

Na função `buildUsage()` de `usage-core.js`: lê o bloco ativo e a semana corrente, calcula `pct = cost / ceil * 100` e devolve `{ session, week }`.
