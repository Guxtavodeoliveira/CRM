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

Esta versão tem **duas tabelas novas** no banco. Antes de publicar, faça isto
uma vez (leva 30 segundos):

1. Entre em https://supabase.com e abra o seu projeto.
2. Menu da esquerda → **SQL Editor** → **New query**.
3. Abra o arquivo **`banco/atualizar-segmentos.sql`** (Bloco de Notas serve),
   copie tudo e cole na janela.
4. Clique em **Run**. Tem que aparecer *Success*.

Pode rodar de novo sem medo: nada é apagado. Se você publicar antes de rodar,
o CRM continua funcionando normalmente — só avisa que os segmentos ainda não
estão indo para a nuvem.

---

## Publicar

Dois cliques no **`publicar.bat`**. Ele pergunta uma descrição da mudança
(pode apertar Enter), envia para o GitHub e o Cloudflare republica sozinho em
cerca de 1 minuto.

Depois, no site, aperte **Ctrl+Shift+R** para o navegador largar a versão
antiga que ele guarda em cache.

---

## O que mudou nesta versão

**Segmentos do negócio.** Agora cada negócio pode receber um ou vários
segmentos coloridos (por exemplo: Sublimação, Esporte, Confecção), e o funil
ganhou um filtro.

**Cada funil tem a sua lista.** Os segmentos da PRICOREL não aparecem no funil
da NST Print, e vice-versa.

**Botão *Segmentos*, na barra, ao lado de *Relatórios*.** Abre a janela onde
você cadastra: escreve o nome, escolhe uma das **8 cores** e clica em
*Adicionar segmento*. Na lista de baixo dá para **editar** (lápis) ou
**excluir** (lixeira). Ao excluir um segmento que está em uso, ele avisa
quantos negócios usam; confirmando, o segmento só sai desses negócios —
nenhum negócio é apagado.

**No cartão do funil:**

- quem não tem segmento mostra **+ adicionar segmento** no rodapé;
- ao clicar, abre a listinha do funil e você **marca quantos quiser** (a
  janelinha não fecha a cada clique);
- quem já tem aparece com as etiquetas coloridas lado a lado, cada uma com um
  **x** para tirar aquela, e um **+** ao lado para acrescentar outra;
- negócio sem segmento continua funcionando igual — é opcional, e os negócios
  antigos não mudaram em nada.

**Filtro do funil** (barra nova, logo abaixo da busca):

- **Segmento** — marque um ou vários. Marcando vários, aparece quem tiver
  **pelo menos um** deles (não precisa ter todos).
- **Estado** — só os estados onde você realmente tem cliente.
- **Cidade** — só as cidades do estado escolhido; trocar de estado solta a
  cidade, igual ao relatório de clientes.
- Os três funcionam juntos. O filtro só **esconde cartões na tela**: nenhum
  dado é alterado. *Limpar filtros* devolve tudo.

---

## Ainda pendente do pacote anterior

Se você ainda não rodou o **`banco/atualizar-campos.sql`** no Supabase, rode
também: SQL Editor → New query → colar o conteúdo do arquivo → Run. Sem ele, a
inscrição estadual e os dados bancários do cliente não são salvos na nuvem.
São dois arquivos diferentes e um não substitui o outro.
