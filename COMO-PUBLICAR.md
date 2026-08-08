# Publicar o Shaliach no ar (GitHub + Cloudflare Pages)

Tempo total: uns 15 minutos. Tudo gratuito. Você não precisa saber programar.

---

## Antes de tudo: o que muda e o que não muda

Publicar deixa o sistema acessível por um endereço tipo `shaliach.pages.dev`,
de qualquer computador ou celular, sem precisar copiar a pasta.

**O que NÃO muda ainda:** os dados continuam no seu arquivo `crm-dados.json`, no
computador. Publicar o site não publica os dados. Isso só muda quando a gente
ligar o Supabase.

Ou seja: no PC do escritório você conecta o arquivo de lá; em outro computador,
precisa levar o arquivo. É o mesmo comportamento de hoje, só que sem carregar a
pasta do sistema junto.

---

## Passo 1 — Criar a conta no GitHub

1. Entre em https://github.com e clique em **Sign up**.
2. Informe e-mail, senha e um nome de usuário.
3. Confirme o e-mail que eles enviam.

## Passo 2 — Criar o repositório

1. Logado, clique no **+** no canto superior direito → **New repository**.
2. **Repository name:** `shaliach`
3. Deixe em **Private** (ninguém além de você vê o código).
4. Clique em **Create repository**.

## Passo 3 — Subir os arquivos

Na tela que aparece, clique em **uploading an existing file**.

1. Descompacte o zip no seu computador.
2. Arraste para o navegador **o conteúdo de dentro da pasta** `crm` —
   ou seja, o `index.html`, e as pastas `assets`, `img` e `banco`.

   Atenção: o `index.html` precisa ficar na **raiz** do repositório, não dentro
   de uma subpasta. Se você arrastar a pasta `crm` inteira, o endereço vai ficar
   errado.
3. Lá embaixo, clique em **Commit changes**.

## Passo 4 — Criar o Cloudflare Pages

1. Entre em https://dash.cloudflare.com e crie a conta (confirme o e-mail).
2. No menu lateral: **Compute (Workers & Pages)** → **Create** → aba **Pages** →
   **Connect to Git**.
3. Autorize o Cloudflare a acessar o GitHub e escolha o repositório `shaliach`.
4. Na tela de configuração:
   - **Framework preset:** `None`
   - **Build command:** deixe **vazio**
   - **Build output directory:** `/`
5. Clique em **Save and Deploy**.

Em um minuto ele mostra o endereço: `https://shaliach.pages.dev`.

## Passo 5 — Usar

Abra esse endereço no Chrome ou Edge, clique em **Abrir arquivo existente** e
aponte para o seu `crm-dados.json`. Pronto — funciona igual, agora pela internet.

---

## Como atualizar depois

Quando eu te mandar uma versão nova: no GitHub, **Add file → Upload files**,
arraste os arquivos alterados por cima e **Commit changes**. O Cloudflare
republica sozinho em cerca de um minuto.

## Domínio próprio (opcional)

Se você comprar algo como `shaliach.com.br`, dá para apontar para essa página em
**Custom domains**, dentro do projeto no Cloudflare.

---

## Sobre a pasta `banco`

Ela contém o `schema.sql` e o `migrar.js`, que só vão ser usados quando a gente
ligar o Supabase. Subir junto não atrapalha nada — são arquivos parados, não
executam no site. Se preferir, pode deixar de fora.
