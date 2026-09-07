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

## PRIMEIRO: rode o SQL novo no Supabase

Esta versão tem **duas tabelas novas** no banco (as dos produtos). Antes de
publicar, faça isto uma vez (leva 30 segundos):

1. Entre em https://supabase.com e abra o seu projeto.
2. Menu da esquerda → **SQL Editor** → **New query**.
3. Abra o arquivo **`banco/atualizar-produtos.sql`** (Bloco de Notas serve),
   copie tudo e cole na janela.
4. Clique em **Run**. Tem que aparecer *Success*.

Pode rodar de novo sem medo: nada é apagado, e os pedidos que você já lançou
continuam iguais. Se publicar antes de rodar, o CRM continua funcionando
normalmente — só avisa que os produtos ainda não estão indo para a nuvem.

---

## Publicar

Dois cliques no **`publicar.bat`**. Ele pergunta uma descrição da mudança
(pode apertar Enter), envia para o GitHub e o Cloudflare republica sozinho em
cerca de 1 minuto.

Depois, no site, aperte **Ctrl+Shift+R** para o navegador largar a versão
antiga que ele guarda em cache.

---

## O que mudou nesta versão

**Tabela de preços por funil.** Botão novo **Produtos**, na barra, ao lado de
*Segmentos*. Ali você monta a sua lista de produtos em três níveis:

```
Papel para sublimação          (linha)
  └ Fast Dry                   (sublinha)
      └ Bobina 90g 1,60m x 100m   mínimo · médio · máximo
```

- **Três preços por produto**, sempre **por unidade do que você vende** (a
  bobina, o galão, o pacote): **mínimo em vermelho**, **médio em marrom** e
  **máximo em verde**. O que a unidade contém (100 metros, 1 litro) entra no
  nome do produto.
- **Anotação — só para você**: um campo de texto livre em cada produto (prazo
  da fábrica, com quem falar, até onde dá para descer). Fica guardado ali e
  **não aparece** no pedido, na ficha em PDF, no relatório nem na planilha.
  Produto com anotação ganha um risquinho discreto do lado do nome.
- O **lápis** é editar, a **lixeira** é excluir. Excluindo uma linha, os
  produtos dela **não são apagados**: vão para "Sem linha", no topo, e você
  reorganiza quando quiser.
- A busca no topo do modal acha por produto, linha ou sublinha.
- Cada funil tem a sua tabela: a da PRICOREL não aparece na NST Print.

**Na hora do pedido.** O campo do produto agora tem duas formas de preencher:

- **digitando**, e a lista vai filtrando enquanto você escreve;
- **clicando na setinha** do lado do campo, que abre a lista inteira já
  separada por linha e sublinha, com a faixa de preço de cada um. No fim da
  lista continuam os nomes que você já digitou à mão em pedidos antigos.

Escolhido o produto, aparece embaixo a faixa dele. **A única coisa que você
digita é o preço que fechou.** Se esse preço ficar **abaixo do mínimo ou acima
do máximo**, a linha fica vermelha na hora e, ao salvar, aparece um aviso
dizendo qual item e quanto está fora. **É só um aviso**: confirmando, o pedido
salva com o preço que você fechou — cada cliente tem a sua negociação.

**Pedido e ficha em PDF.** Na aba *Pedidos* e na ficha em PDF, cada item passou
a mostrar embaixo do nome a **linha › sublinha** do produto. Na aba *Pedidos*
(que é só sua) o item fechado fora da faixa ganha uma marca vermelha
*abaixo do mín.* / *acima do máx.*; **na ficha em PDF isso não aparece** — ela
continua limpa para mandar para a fábrica.

**Relatório novo: Produtos.** Em *Relatórios* → *Produtos*. É a sua **tabela de
preços em papel**: lista os produtos cadastrados naquele funil, agrupados por
linha e sublinha, com mínimo, médio, máximo e a **margem** (quanto o máximo está
acima do mínimo, em reais e em %). Nada de venda entra aqui — é o cadastro puro,
para consultar e levar na visita. Dá para filtrar por linha, ordenar por nome ou
por preço, imprimir em PDF e baixar em Excel.

Nada do que já existia mudou: negócios, segmentos, clientes, agenda, comissões
e os pedidos antigos continuam iguais. Quem preferir digitar o produto na mão,
como sempre fez, continua podendo.

---

## Ainda pendente dos pacotes anteriores

São arquivos diferentes e um não substitui o outro. Se você ainda não rodou
algum deles, rode agora (SQL Editor → New query → colar → Run):

- **`banco/atualizar-campos.sql`** — inscrição estadual e dados bancários do
  cliente.
- **`banco/atualizar-segmentos.sql`** — os segmentos coloridos do negócio.
- **`banco/atualizar-produtos.sql`** — a tabela de preços desta versão.
