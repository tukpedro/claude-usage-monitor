# Ops-Troubleshooting

## O statusline não aparece

- Confirme o bloco `statusLine` no `~/.claude/settings.json` (ver [[Statusline-Config]]).
- **Reinicie** o Claude Code — settings só recarrega ao reabrir.
- Teste o script direto: `printf '{}' | node ~/.claude/statusline.js` (deve imprimir algo).

## O tok/msg parece errado logo após /compact

- Normal: a própria chamada de compactação lê a conversa toda. O script detecta o `compact_boundary` e exibe `⛽ compactado ✓` até o próximo turno, quando o número real aparece. Ver [[Internals-Context-Calc]].

## Depois de mover o repo, o statusline sumiu

- O symlink em `~/.claude` aponta pro caminho antigo. Rode `./install.sh` de novo do novo local.
