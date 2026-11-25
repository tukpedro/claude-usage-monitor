# claude-usage-monitor

Statusline pessoal pra **acompanhar e economizar** consumo de contexto no [Claude Code](https://claude.com/claude-code).
**100% local** (lê o transcript em `~/.claude/projects/**/*.jsonl`) — **não gasta token**.

> 📚 **Documentação completa** (formato vault-graph): [`docs/claude-usage-monitor-vault/`](docs/claude-usage-monitor-vault/README.md).
> Pra reconstruir do zero numa máquina nova, veja [`Ops-Restore`](docs/claude-usage-monitor-vault/Ops-Restore.md).

## O que faz

**Statusline (1 linha, sempre à vista)** — `statusline.js`

```
Opus 4.8 · ⛽ 174k/msg ▕███░░░░░▏ 🟡 MÉDIO · 17% da janela · $693 · +40k/-5k
```

- **Medidor de consumo:** `⛽ tok/msg` = quanto de *input* cada mensagem custa (= o contexto atual, pois o modelo relê tudo a cada turno). Faixas: `ENXUTO → BOM → MÉDIO → PESADO → CARO` (com dica `→ /compact`).
- Detecta janela de 1M, ignora subagentes (`isSidechain`) e corrige o contexto após `/compact` (via `compact_boundary`, mostra `⛽ compactado ✓`).
- Mostra só o que é **100% confiável** localmente: contexto, % da janela, custo e linhas. **Não** mostra % de sessão/semana — esse número só existe de verdade no `/usage` e não dá pra reproduzir localmente (ver a doc).

## Instalação

Requer Node.js, Claude Code instalado e autenticado, e `tmux` para o painel `uso` e a segunda linha da statusline.

No macOS, instale o `tmux` pelo [Homebrew](https://brew.sh):

```bash
brew install tmux
```

No Debian/Ubuntu:

```bash
sudo apt install tmux
```

```bash
git clone <este-repo>
cd claude-usage-monitor
./install.sh              # symlink ~/.claude/statusline.js -> este repo
```

Depois adicione ao `~/.claude/settings.json`:

```json
"statusLine": { "type": "command", "command": "node ~/.claude/statusline.js" }
```

Reinicie o Claude Code. Pronto.

## ⚠️ Caveat

Pra cota de sessão/semana, **a fonte é sempre `/usage`** — o número oficial não é exposto a ferramentas locais.

## Arquivos

| Arquivo | Papel |
|---|---|
| `statusline.js` | statusline do Claude Code (medidor de contexto/msg) |
| `install.sh` | cria o symlink em `~/.claude` |

## Autores

- [Pedro Pastuk](https://github.com/tukpedro)
- [Eduardo Lanzi](https://github.com/cadulanzi) — suporte à instalação no macOS

## Licença

[MIT](LICENSE)
