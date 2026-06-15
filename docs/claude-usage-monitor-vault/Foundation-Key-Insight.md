# Foundation-Key-Insight

O insight que justifica o projeto inteiro:

## Contexto = custo de cada mensagem

A cada turno, o modelo **relê o contexto inteiro** como input. Logo, o tamanho do contexto atual **é** o que cada mensagem nova vai custar de input. Por isso o medidor mostra `⛽ tok/msg` igual ao contexto: a 174k, cada mensagem "queima" ~174k; a 628k, custa 3,6× mais — **mesmo que a mensagem que você digitou seja curtinha**.

## Duas medidas que parecem iguais, mas não são

- **tok/msg (⛽)** = custo por mensagem. É o que importa pra economia. **Cai quando você compacta.**
- **% da janela** = quanto do tanque (ex.: 1M) está cheio. É capacidade.

Você pode estar com o tanque longe de cheio (17% de 1M) e ainda assim **gastando caro por mensagem** (174k). Por isso o ⛽ é o que se vigia, não a % da janela.

## Hodômetro vs velocímetro

- **`$` (custo acumulado)** = hodômetro. Só sobe, soma tudo da sessão. **Não cai com /compact** — o que já foi gasto não volta.
- **`⛽ tok/msg`** = velocímetro. Reage na hora ao tamanho do contexto.

Compactar economiza no **futuro**, não no passado: muda a *inclinação* da subida do `$`, derrubando o velocímetro. O `$` só zera com `/clear`.

## Consequência prática

A maior alavanca de economia é **gerenciar contexto** (`/compact` quando subir, `/clear` ao trocar de tarefa), não encurtar o que você digita — ver a discussão em Ideas-Input-Estimation.
