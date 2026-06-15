# Statusline-Config

Como ligar o statusline no Claude Code.

## settings.json

No `~/.claude/settings.json`, adicione a chave `statusLine`:

```json
"statusLine": {
  "type": "command",
  "command": "node ~/.claude/statusline.js"
}
```

O Claude Code roda esse comando a cada render, passando um JSON via stdin (modelo, custo, `transcript_path`, linhas etc.) e exibindo o stdout como a barra. Suporta **múltiplas linhas** — é assim que cabem o medidor e a linha de uso.

## Como aplica

Mudanças no `settings.json` valem **ao reiniciar** a sessão do Claude Code. Se o statusline não aparecer logo, saia e entre de novo.

## Caminho do script

O comando aponta pra `~/.claude/statusline.js`, que no setup padrão é um **symlink** pro arquivo no repositório (ver Ops-Install). Internamente o script resolve os outros caminhos (`usage-core.js`, cache, lock) via `$HOME`, então é portável entre máquinas.

## Custo

Zero token. O statusline é um processo local de shell/Node; nunca chama a API.
