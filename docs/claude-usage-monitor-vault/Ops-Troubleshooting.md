# Ops-Troubleshooting

## O statusline não aparece

- Confirme o bloco `statusLine` no `~/.claude/settings.json` (ver Statusline-Config).
- **Reinicie** o Claude Code — settings só recarrega ao reabrir.
- Teste o script direto: `printf '{}' | node ~/.claude/statusline.js` (deve imprimir algo).

## A linha 2 fica em "carregando…" pra sempre

- O ccusage não está instalado ou não está no PATH: `npm i -g ccusage` e confira `which ccusage`.
- Aqueça o cache na mão: `node ~/.claude/usage-core.js --cache` e veja se cria `~/.claude/.usage-cache.json`.

## O painel mostra "sem bloco ativo"

- Significa que não há um bloco de 5h ativo agora (sem uso recente) — normal logo após um reset. Some quando você usar o Claude.

## As % não batem com o /usage

- Esperado: são **estimativas locais**. Calibre (ver Panel-Calibration). A sessão começa com teto chutado ($40).
- ccusage só vê esta máquina; outros devices não contam.

## O tok/msg dispara logo após /compact

- Era um bug já corrigido: a chamada de compactação lê a conversa toda. O script agora filtra pelo `compact_boundary` e mostra `compactado ✓` até o próximo turno (ver Internals-Context-Calc).

## Depois de mover o repo, o tooling sumiu

- Os symlinks em `~/.claude` apontam pro caminho antigo. Rode `./install.sh` de novo do novo local.

## O painel travou ou o terminal ficou estranho

- Saia com Ctrl+C (restaura a tela). Se ficou sem cursor, rode `reset` ou `printf '\033[?25h'`.
