# Foundation-Why

## O problema

O Claude Code de assinatura tem limites em janelas: **sessão (~5h)** e **semana**. O comando `/usage` mostra as barras, mas só sob demanda — você tem que parar e digitar. Sem um mostrador contínuo, é fácil estourar a cota sem perceber, especialmente nos padrões mais caros:

- sessões abertas por 8h+ (background/loop esquecidos);
- sessões "subagent-heavy" (cada subagente faz requests próprios);
- contexto grande (>150k), que encarece **toda** mensagem.

## A ideia

Trazer o consumo pra dentro do campo de visão, o tempo todo e de graça:

- **Sempre à vista**, no statusline — atualiza a cada mensagem.
- **Ao vivo**, num painel ao lado — atualiza a cada 1s.
- **Com cores** (verde/amarelo/vermelho) e **faixas de economia**, pra virar um reflexo: viu vermelho, compacta.

## Por que não dá pra usar só o /usage

O `/usage` é a fonte oficial, mas é pontual e não fica na tela. E a barra de % oficial **não chega** ao statusline: o JSON que o script recebe não traz esse dado, e somar a janela de 5h exigiria ler todas as sessões — que é o que o ccusage já faz. Daí a divisão: medidor de consumo (nativo, exato) + estimativa de cota (via ccusage).
