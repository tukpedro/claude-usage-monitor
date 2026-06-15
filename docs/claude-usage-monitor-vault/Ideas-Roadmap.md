# Ideas-Roadmap

Melhorias pensadas, ainda não implementadas. Sem ordem de prioridade rígida.

## Calibração e precisão

- **Auto-calibração** — ler o `/usage` (se algum dia vier num formato acessível) e ajustar os tetos sozinho, sem `--calibrate-*` manual.
- **Barra de semana ao vivo de verdade** — hoje a semana é só estimativa pontual; faltam reset e projeção como na sessão.

## Faixas e alertas

- **Faixas calibráveis pro perfil do usuário** — ex.: começar 🟡 em 120k, já que o normal aqui passa de 150k. Hoje os limites de `zone()` são fixos no código.
- **Alerta ao cruzar o vermelho** — notificação (som/desktop) quando o `tok/msg` entra em CARO, pra disparar o reflexo de `/compact`.

## Input

- **Estimador `--tokens`** — ver Ideas-Input-Estimation.

## Operação

- **Comando de update** — um aliasinho que faz `commit -am` + `push` do repo num passo só.
- **Suporte a múltiplas máquinas** — hoje o ccusage só vê os logs locais; sincronizar/mesclar logs de mais de um device daria um número mais perto do oficial.

## Empacotamento

- **Publicar como pacote** (`npx claude-usage-monitor`) com um `bin` que instala e configura, em vez do clone + `install.sh`.
