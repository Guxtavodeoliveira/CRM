# Leia isto antes de publicar — 2 passos

Esta versão mexeu na ficha do cliente. São só dois passos, uns 3 minutos.

---

## Passo 1 — Rodar um comando no Supabase (obrigatório)

A ficha ganhou campos novos (inscrição estadual, responsável e os dados
bancários). O banco de dados precisa saber que eles existem, senão esses campos
não são salvos na nuvem.

1. Entre em **https://supabase.com** e abra o seu projeto.
2. No menu da esquerda, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo **`banco/atualizar-campos.sql`** (está dentro desta pasta),
   copie **tudo** e cole na janela do Supabase.
5. Clique em **Run** (ou Ctrl+Enter).
6. Tem que aparecer **Success**. Pronto.

Pode rodar de novo sem medo se ficar na dúvida: se a coluna já existir, ele
pula. Nada é apagado.

> Se você publicar sem fazer isso, o sistema **não quebra**: ele avisa na tela
> e continua salvando o resto normalmente. Só os dados bancários e a inscrição
> estadual é que não vão para a nuvem enquanto o comando não for rodado.

---

## Passo 2 — Publicar os arquivos

Igual às outras vezes:

1. Entre no seu repositório no GitHub.
2. **Add file → Upload files**.
3. Arraste **o conteúdo de dentro da pasta `crm`** — o `index.html` e as pastas
   `assets`, `img` e `banco`. O `index.html` fica na **raiz**, não dentro de uma
   subpasta.
4. **Commit changes**.

O Cloudflare republica sozinho em cerca de 1 minuto.

Se você já usa o `publicar.bat`: é só dar dois cliques nele, que ele faz tudo.

---

## O que mudou na tela

**Ficha do cliente — Dados básicos**
- "Nome" agora se chama **Nome fantasia / Nome do cliente**
- Saíram: Categoria, Origem, Setor e o Responsável de vendedor
- Entraram: **Inscrição estadual** e **Responsável** (agora quer dizer quem
  responde pela empresa cliente)

**Nova seção: Dados bancários** — Banco, Agência, Conta corrente (C/C),
Conta poupança e Pix.

**Saiu por completo:** a seção "Negócio no funil" e a seção "Produtos e
serviços".
- A **etapa** do funil agora é decidida sozinha: o cliente entra na coluna em
  que você clicou no "+". Depois é só arrastar o cartão, como sempre.
- A **data de início** é preenchida com o dia do cadastro.
- Os **produtos** continuam no pedido, que é onde eles importam.

**Continuam iguais:** contato, endereço, pessoas da empresa e redes sociais.

**Ficha do pedido em PDF:** ganhou os dados bancários e a inscrição estadual.
Continua com contato, endereço de faturamento, itens, totais, forma de
pagamento, comentários e assinaturas.

---

## E os clientes que já estão cadastrados?

Continuam todos lá, nada se perde. O que você já tinha escrito no campo
"Responsável" antigo é aproveitado no Responsável novo. Categoria, Origem e
Setor deixam de aparecer na tela, mas o que estava escrito continua guardado no
banco — se um dia você quiser de volta, dá.
