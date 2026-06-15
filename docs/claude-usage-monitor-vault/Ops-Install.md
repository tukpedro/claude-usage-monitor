# Ops-Install

Instalação numa máquina que já tem o repositório clonado.

## Pré-requisito

```bash
npm i -g ccusage
```

## install.sh

Da raiz do repo:

```bash
./install.sh
```

O script é **idempotente** (pode rodar de novo) e faz:

1. **Symlinks** — `~/.claude/statusline.js` e `~/.claude/usage-core.js` apontando pros arquivos do repo. Assim o repo é a fonte da verdade: editar lá vale na hora, e o git sempre reflete o que está rodando.
2. **Config pessoal** — se `~/.claude/usage-ceilings.json` não existir, copia do `usage-ceilings.example.json`. Se já existir, **mantém** (não sobrescreve calibração).
3. **Alias `uso`** — adiciona `alias uso='node ~/.claude/usage-core.js --panel'` no `~/.zshrc` e no `~/.bashrc` (se não existir ainda).
4. **Checagem** — avisa se o ccusage não está no PATH.

## Passo manual restante

Adicionar o bloco `statusLine` no `~/.claude/settings.json` — ver Statusline-Config. O `install.sh` imprime o trecho a colar.

## Por que symlink e não cópia

Cópia geraria *drift* (editar num lugar e esquecer o outro). Symlink mantém uma única fonte. O preço é que mover o repo quebra os links — nesse caso, rode `install.sh` de novo do novo caminho.
