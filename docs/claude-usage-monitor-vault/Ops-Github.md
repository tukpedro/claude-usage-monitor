# Ops-Github

## Repositório

- **URL**: https://github.com/tukpedro/claude-usage-monitor (privado)
- **Branch**: `main`
- Criado com `gh repo create claude-usage-monitor --private --source=. --push`.
- Vive em `~/projects/tukpedro/claude-usage-monitor/`.

## O que é versionado

`statusline.js`, `usage-core.js`, `usage-ceilings.example.json`, `install.sh`, `README.md`, `.gitignore` e a vault em `docs/`. **Fora** do repo (via `.gitignore`): `usage-ceilings.json` (config pessoal) e os arquivos de runtime (cache/lock).

## Atualizar depois de mexer

Como `~/.claude/*.js` são symlinks pro repo, editar o tooling já edita os arquivos versionados. Pra subir:

```bash
git -C ~/projects/tukpedro/claude-usage-monitor commit -am "descrição"
git -C ~/projects/tukpedro/claude-usage-monitor push
```

## Nota sobre o token

A URL do remote no `.git/config` é **limpa** (`https://github.com/...`, sem token). A autenticação vem de uma regra `insteadOf` no `~/.gitconfig-personal` (carregada via `includeIf` pra projetos em `~/projects/tukpedro/`), que injeta o PAT na hora do push. Isso é configuração pessoal da máquina, **não** entra no repo — o token nunca é commitado.
