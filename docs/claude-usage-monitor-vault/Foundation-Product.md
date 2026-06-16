# Foundation-Product

## O que é

Um script local que mostra, a cada mensagem do Claude Code, **quanto de token aquela interação custa** — e sinaliza com faixas de cor se está na hora de compactar. O objetivo não é só observar: é **ensinar a ser econômico**, igual o medidor de consumo de um carro reage ao acelerador.

Um único artefato:

- **Statusline** (`statusline.js`) — uma linha na barra do Claude Code. Mostra modelo, ⛽ tok/msg, barra de consumo, faixa de economia, % da janela, custo acumulado e linhas adicionadas/removidas.

## O que NÃO é

- **Não é a fonte oficial.** A verdade canônica é o comando `/usage` do Claude Code.
- **Não mostra % de sessão/semana.** O JSON que o script recebe não traz esse dado, e somar a janela de 5h exigiria ler todas as sessões de todas as máquinas — o que o statusline deliberadamente não faz. Ele só mostra o que é confiável localmente: contexto, % da janela, custo e linhas.
- **Não cobra nem gasta token.** Tudo é leitura local de arquivos de log; nenhuma chamada à API da Anthropic.
- **Não mede outras máquinas.** Lê só os logs `~/.claude/projects/**/*.jsonl` desta máquina.

## Pra quem

Pro usuário de Claude Code em plano de assinatura que bate nos limites (sessões longas, muitos subagentes, contexto grande) e quer enxergar o consumo pra mudar o hábito.
