# Panel-Live

O painel de uso ao vivo, pra rodar num terminal ao lado.

```bash
node ~/.claude/usage-core.js --panel     # ou o alias: uso
```

```
 ⛽ USO AO VIVO    ≈ estimativa local · oficial: /usage

  SESSÃO 5h   ▕████░░░░░░░░░░░░░░░░░░░░▏ 19%
              $7.43 de ~$40    burn $12.7/h    projeção fim $61    bloco até 21:00

  SEMANA      ▕█████████░░░░░░░░░░░░░░░▏ 36%
              $95.61 de ~$268.63

  atualizado há 2s · refetch 5s · Ctrl+C sai
```

## Comportamento

- **Redesenha a cada 1s**; reconsulta o ccusage a cada **5s** (cada consulta leva ~1s, então consultar a cada segundo pesaria).
- Usa a **tela alternativa** do terminal (`\x1b[?1049h`) como o htop/less: redesenha no lugar, sem poluir o histórico, e **restaura o terminal no Ctrl+C**.
- A consulta ao ccusage é **assíncrona** (`exec`), pra não congelar o redraw de 1s.
- Enquanto a primeira leitura não volta, mostra `carregando ccusage…` (não "sem bloco ativo").

## Campos da sessão

- **`$X de ~$Y`** — custo-equivalente do bloco vs teto (ver Panel-Calibration).
- **burn** — ritmo de gasto ($/h).
- **projeção fim** — onde o bloco termina no ritmo atual (vem do ccusage).
- **bloco até HH:MM** — fim da janela de 5h **segundo o ccusage** (pode não casar exatamente com o reset oficial).
