# Ideas-Input-Estimation

> Pergunta: dá pra calcular dinamicamente o `tok/msg` levando em conta o texto que estou digitando no input, conforme o tamanho?

## Resposta curta

**Ao vivo, enquanto você digita: não dá.** Em formas aproximadas e úteis: **dá**.

## Por que o "ao vivo no statusline" é impossível

1. O statusline **não recebe o texto do input** — o JSON que ele recebe tem modelo, custo, `transcript_path` etc., mas não o rascunho que você está escrevendo.
2. O statusline **não redesenha por tecla** — ele só re-renderiza em eventos (mensagem enviada, troca de modelo…), não a cada caractere.

Logo, um número que sobe conforme você digita não é alcançável pelo mecanismo do statusline.

## A realidade da magnitude

O input quase sempre é uma **fração mínima** do custo por mensagem. Exemplo: contexto 174k; um prompt de 300 palavras ≈ 400 tokens = **0,2%**. Mesmo um colaço de 5000 palavras ≈ 6500 tokens ≈ **4%** de 174k. O contexto domina — por isso o medidor já mostra o número que importa.

**Porém**: o input **persiste no contexto** e é **repago a cada turno futuro**. Um colaço de 6500 tokens, em 50 turnos, vira 6500 × 50 de leituras. Per-message é pequeno; **acumulado importa**. A alavanca principal segue sendo `/compact` e `/clear` (ver Foundation-Key-Insight), mas evitar colaços enormes ajuda o total.

## O que É possível (formas aproximadas)

1. **O medidor já absorve seu input** — um turno depois de enviar. Ao mandar a mensagem, o contexto cresce com ela e o `⛽` sobe sozinho no próximo render.
2. **Estimador `--tokens` (CLI)** — `echo "texto" | node usage-core.js --tokens` imprimindo a estimativa de tokens e o impacto no custo/msg. Heurística `chars/4` (rápida, ~±20%) ou um tokenizer local pra mais precisão.
3. **Hook `UserPromptSubmit`** — o Claude Code expõe um hook que recebe o prompt **no envio**. Ele poderia estimar o tamanho e registrar/avisar "esse prompt ≈ N tokens". Roda no envio (não enquanto digita) e tem o custo de poluir contexto se jogar o aviso lá — melhor logar num arquivo.

## Precisão

`chars/4` é heurística (inglês ~4 chars/token; português parecido; código mais denso). Exato exigiria a API de contagem da Anthropic (uma chamada) ou um tokenizer local — overkill pro objetivo de "ter noção de tamanho".

## Status

Não implementado. Candidato mais provável: o estimador `--tokens` (barato, direto, sem tocar no statusline).
