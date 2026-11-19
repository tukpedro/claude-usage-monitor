# Ops-Install

Instalação numa máquina que já tem o repositório clonado.

## Pré-requisito

Node.js, Claude Code instalado e autenticado, e `tmux` para o painel `uso` e a segunda linha da statusline.

- macOS com [Homebrew](https://brew.sh): `brew install tmux`.
- Debian/Ubuntu: `sudo apt install tmux`.

O instalador identifica o sistema e informa o comando quando o `tmux` está ausente.

## install.sh

Da raiz do repo:

```bash
./install.sh
```

O script é **idempotente** (pode rodar de novo) e faz:

1. **Symlink** — `~/.claude/statusline.js` apontando pro arquivo do repo. Assim o repo é a fonte da verdade: editar lá vale na hora, e o git sempre reflete o que está rodando.

## Passo manual restante

Adicionar o bloco `statusLine` no `~/.claude/settings.json` — ver [[Statusline-Config]]. O `install.sh` imprime o trecho a colar.

Depois, **reiniciar o Claude Code** para o statusline aparecer.

## Por que symlink e não cópia

Cópia geraria *drift* (editar num lugar e esquecer o outro). Symlink mantém uma única fonte. O preço é que mover o repo quebra o link — nesse caso, rode `install.sh` de novo do novo caminho.
