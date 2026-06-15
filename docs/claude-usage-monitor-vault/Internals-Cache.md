# Internals-Cache

Como o statusline mostra sessão/semana sem ficar lento.

## O dilema

Cada consulta ao ccusage leva ~1s (são dois comandos: `blocks` e `weekly`). Rodar isso a cada render do statusline travaria a barra. Solução: **cache + refresh em background**.

## Arquivos

- `~/.claude/.usage-cache.json` — último resultado calculado (`{ session, week, ceil, ts }`).
- `~/.claude/.usage-refresh.lock` — marca que um refresh está em andamento.

Ambos ficam em `~/.claude` (não no repo) e são recriáveis.

## Fluxo no statusline

1. Lê o cache e renderiza a linha 2 na hora (instantâneo).
2. Se o cache está velho (>20s) **e** não há lock recente (<15s), dispara `usage-core.js --cache` **destacado** (`spawn`, `detached`, `unref`) — não bloqueia o render.
3. Esse processo em background recalcula e reescreve o cache; o próximo render já pega fresco.

## writeCache() e o lock

`writeCache()` cria o lock, roda o cálculo **síncrono** (`execSync`), grava o cache e remove o lock. Se já houver lock recente, sai sem fazer nada — evita várias consultas ccusage empilhadas quando o statusline renderiza em rajada.

## O painel não usa esse cache

O painel (`--panel`) mantém seu próprio estado em memória e consulta de forma **assíncrona** a cada 5s — ele tem seu próprio loop, então não depende do arquivo de cache. Ver Panel-Live.
