# Foundation-Product

## O que é

Um conjunto de scripts locais que mostram, em tempo real, **quanto de token cada interação com o Claude Code custa** — e estimam o quanto da cota de sessão/semana já foi consumida. O objetivo não é só observar: é **ensinar a ser econômico**, igual o medidor de consumo de um carro reage ao acelerador.

Dois artefatos:

1. **Statusline** (`statusline.js`) — a barra do Claude Code, em duas linhas. Linha 1 é o medidor de consumo por mensagem; linha 2 é o uso de sessão/semana.
2. **Painel ao vivo** (`usage-core.js --panel`) — um terminal ao lado que atualiza a cada 1s com sessão, semana, burn rate e projeção.

## O que NÃO é

- **Não é a fonte oficial.** Os números são estimativas locais. A verdade canônica é o comando `/usage` do Claude Code.
- **Não cobra nem gasta token.** Tudo é leitura local de arquivos de log; nenhuma chamada à API da Anthropic.
- **Não mede outras máquinas.** Lê só os logs `~/.claude/projects/**/*.jsonl` desta máquina (mesma limitação do /usage).

## Pra quem

Pro usuário de Claude Code em plano de assinatura que bate nos limites (sessões longas, muitos subagentes, contexto grande) e quer enxergar o consumo pra mudar o hábito.
