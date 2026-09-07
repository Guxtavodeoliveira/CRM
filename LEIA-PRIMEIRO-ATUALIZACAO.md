# Leia isto antes de substituir a pasta

## ATENÇÃO: não apague a pasta antiga

Agora a sua pasta `crm` tem dentro dela uma pasta **oculta chamada `.git`**.
É ela que guarda a ligação com o GitHub e faz o `publicar.bat` funcionar.

Se você **apagar a pasta e extrair a nova no lugar**, essa ligação some, e o
`publicar.bat` vai dizer *"esta pasta ainda nao foi conectada ao GitHub"*.

### O jeito certo de substituir

1. Descompacte o zip novo em qualquer lugar (a Área de Trabalho serve).
2. Abra a pasta `crm` que saiu do zip e selecione **tudo** que está dentro
   dela (Ctrl+A) — os arquivos e as pastas `assets`, `banco`, `img`, `testes`.
3. Copie (Ctrl+C).
4. Abra a sua pasta `crm` de sempre, em
   `D:\TRABALHO\...\CRM_GUSTAVO_FINAL\CRM GUSTAVO FINAL\crm`, e cole (Ctrl+V).
5. Quando o Windows perguntar, escolha **Substituir os arquivos no destino**.

Assim os arquivos são trocados e o `.git` continua no lugar.

> Se mesmo assim der o erro de "não conectada ao GitHub", não tem problema:
> é só rodar de novo os comandos do `COMANDOS-GIT.md`.

---

## Desta vez NÃO tem SQL novo

Esta atualização mexe só na tela: é substituir os arquivos e publicar. Se você
ainda não rodou os SQL das versões anteriores, veja o fim deste arquivo.

---

## Publicar

Dois cliques no **`publicar.bat`**. Ele pergunta uma descrição da mudança
(pode apertar Enter), envia para o GitHub e o Cloudflare republica sozinho em
cerca de 1 minuto.

Depois, no site, aperte **Ctrl+Shift+R** para o navegador largar a versão
antiga que ele guarda em cache.

---

## O que mudou nesta versão

**Ordenar os cartões dentro de cada etapa.** Embaixo do nome de cada coluna do
funil apareceu um botãozinho **Ordenar**. Cada etapa tem a sua própria
ordenação, independente das outras.

Os critérios:

- **Estado** — A → Z ou Z → A; quem está sem estado vai para o fim.
- **Cidade** — mesma coisa.
- **Segmento em destaque** — você escolhe **qual** segmento quer em cima. Quem
  tem aquele segmento sobe, mesmo que o negócio tenha mais de um (marcando
  *DTF*, um cartão com *DTF + Confecção* também sobe).
- **Data de cadastro** — mais antigos ou mais novos primeiro.
- **Data do último pedido** — aparece só nas etapas que têm pedido lançado (na
  prática, a *Cliente Comprador*). Começa pelos **mais antigos**, que é o que
  serve para você ir chamando quem não compra há mais tempo.

**Os critérios somam.** Marque quantos quiser: eles valem **na ordem em que
você marcar**, e o número 1, 2, 3 aparece do lado de cada um. Exemplo: marcando
*Estado*, depois *Cidade* e depois *DTF*, a etapa fica agrupada por estado, as
cidades em ordem dentro de cada estado, e quem é DTF na frente no caso de
empate.

**A tirinha da etapa** mostra a ordenação que está valendo (por exemplo
*Estado · Cidade · DTF*) e tem um **x** para voltar à ordem manual — aquela que
você monta arrastando os cartões, que continua guardada o tempo todo. Se você
arrastar um cartão numa etapa ordenada, o CRM avisa que a posição foi guardada
mas não aparece enquanto a ordenação estiver ligada.

A escolha fica gravada no seu navegador, por funil e por etapa: ao reabrir o
CRM, a etapa continua ordenada do jeito que você deixou. Ordenação é só
visualização — **nenhum dado é alterado**, e ela convive com a busca e com o
filtro de segmento/estado/cidade que já existiam.

---

## Ainda pendente dos pacotes anteriores

São arquivos diferentes e um não substitui o outro. Se você ainda não rodou
algum deles, rode agora (SQL Editor → New query → colar → Run):

- **`banco/atualizar-campos.sql`** — inscrição estadual e dados bancários do
  cliente.
- **`banco/atualizar-segmentos.sql`** — os segmentos coloridos do negócio.
- **`banco/atualizar-produtos.sql`** — a tabela de preços desta versão.
