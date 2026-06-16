# Ideas-Roadmap

Melhorias pensadas, ainda não implementadas. Sem ordem de prioridade rígida.

## Faixas e alertas

- **Faixas calibráveis pro perfil do usuário** — ex.: começar 🟡 em 120k, já que o normal aqui passa de 150k. Hoje os limites de `zone()` são fixos no código.
- **Alerta ao cruzar o vermelho** — notificação (som/desktop) quando o `tok/msg` entra em CARO, pra disparar o reflexo de `/compact`.

## Operação

- **Comando de update** — um aliasinho que faz `commit -am` + `push` do repo num passo só.

## Empacotamento

- **Publicar como pacote** (`npx claude-usage-monitor`) com um `bin` que instala e configura, em vez do clone + `install.sh`.
