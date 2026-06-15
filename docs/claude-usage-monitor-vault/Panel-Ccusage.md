# Panel-Ccusage

## O que é

[ccusage](https://github.com/ryoppippi/ccusage) é uma CLI da comunidade que lê os logs locais do Claude Code (`~/.claude/projects/**/*.jsonl`) e reporta tokens/custo. É a **dependência** que alimenta as estimativas de sessão e semana. Instalação global:

```bash
npm i -g ccusage
```

## Comandos que usamos

- `ccusage blocks --json` → janelas de 5h. Pegamos o bloco com `isActive: true`.
- `ccusage weekly --json` → uso por semana. Pegamos a semana de maior `period`.

O motor (`usage-core.js`) chama o binário com o `PATH` ajustado pro bin do nvm (mesmo diretório do `node`), parseia o JSON e extrai custo, burn rate e projeção.

## Campos do JSON consumidos

- Do bloco ativo: `costUSD`, `burnRate.costPerHour`, `projection.totalCost`, `endTime`, `isActive`.
- Da semana: `totalCost`, `period`.

## Por que ccusage e não cálculo próprio

Somar a janela de 5h exige varrer **todas** as sessões da máquina e agrupar por tempo — exatamente o que o ccusage já faz bem e otimizado. Reimplementar isso seria frágil. O projeto fica só com a camada de apresentação (cores, faixas, %) e calibração.

## Limitação

ccusage lê só **esta máquina**. Se você usa Claude em outro device ou no claude.ai, os números ficam abaixo do oficial.
