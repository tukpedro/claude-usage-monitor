# Internals-Context-Calc

Como o `⛽ tok/msg` é extraído do transcript, em `statusline.js`.

## Fonte

O Claude Code passa `transcript_path` no JSON do statusline. O arquivo é JSONL: uma entrada por linha. Entradas de assistant carregam `message.usage` com contagens de token.

## Algoritmo

1. **Acha o último `compact_boundary`** (entrada `type: "system"`, `subtype: "compact_boundary"`). Marca onde a conversa foi resumida.
2. **Varre de trás pra frente**, só **depois** desse boundary, procurando a última entrada de assistant com `usage` — **pulando subagentes** (`isSidechain: true`).
3. **Soma** `input_tokens + cache_read_input_tokens + cache_creation_input_tokens`. Essas três partições somadas = o input total daquele turno = o contexto.

## Por que pular subagentes

Subagentes rodam em contexto próprio. O que importa pro "custo da SUA mensagem" é a thread principal. Sem o filtro, um subagente de 900k poluiria o medidor.

## Por que o boundary do compact

A própria chamada de `/compact` lê a conversa inteira (ex.: 628k) pra resumir, e vira a última entrada de `usage`. Sem o filtro, o medidor mostraria esse 628k logo após compactar — exatamente o oposto do esperado. Filtrando por entradas **após** o boundary, o número certo (resumido) aparece já no próximo turno. Antes disso, mostra `⛽ compactado ✓ (atualiza no próx. turno)`.

## Detecção da janela

`window = (/1m/.test(modelId) || ctxTokens > 190000) ? 1_000_000 : 200_000`. Cobre tanto modelos `[1m]` quanto contextos que já passaram de 190k, evitando % de janela falsa.
