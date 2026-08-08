# Ligar o login: 3 ajustes no Supabase

As telas de login já estão prontas. Falta só configurar três coisas no painel do
Supabase para os e-mails funcionarem e os links voltarem para o lugar certo.

---

## 1. Autorizar o endereço do site

Sem isso, o link do e-mail leva para o lugar errado.

1. No Supabase, menu **Authentication** → **URL Configuration**.
2. Em **Site URL**, coloque:
   ```
   https://shaliach.pages.dev
   ```
3. Em **Redirect URLs**, clique em *Add URL* e adicione as duas:
   ```
   https://shaliach.pages.dev/**
   http://localhost/**
   ```
4. **Save**.

## 2. Conferir a confirmação por e-mail

1. **Authentication** → **Sign In / Providers** → **Email**.
2. Deixe **Confirm email** ligado. É o que faz o sistema exigir que a pessoa
   confirme o e-mail antes de entrar.
3. Em **Minimum password length**, coloque `8`.

## 3. Traduzir os e-mails (opcional, mas recomendado)

Por padrão as mensagens vão em inglês.

1. **Authentication** → **Emails** → aba **Templates**.
2. Em **Confirm signup**, troque o assunto para
   `Confirme seu cadastro no Shaliach` e o texto para algo como:

   ```html
   <h2>Bem-vindo ao Shaliach</h2>
   <p>Clique no botão abaixo para confirmar seu e-mail e ativar sua conta.</p>
   <p><a href="{{ .ConfirmationURL }}">Confirmar meu e-mail</a></p>
   <p>Se você não criou essa conta, pode ignorar esta mensagem.</p>
   ```

3. Em **Reset password**, assunto `Recuperar sua senha do Shaliach`:

   ```html
   <h2>Criar uma nova senha</h2>
   <p>Recebemos um pedido para trocar a senha da sua conta.</p>
   <p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>
   <p>Se não foi você, ignore esta mensagem — sua senha continua a mesma.</p>
   ```

> **Sobre o limite de e-mails:** o servidor de e-mail que vem junto com o
> Supabase é só para teste e tem um limite baixo por hora. Enquanto for você
> usando, está de bom tamanho. Quando entrarem os vendedores, vale ligar um
> serviço de e-mail próprio (Resend, SendGrid) em Authentication → Emails →
> SMTP Settings. Confira os limites atuais na documentação deles.

---

## Como testar

1. Abra `https://shaliach.pages.dev/login.html`.
2. Entre com o e-mail e a senha que você criou em Authentication → Users.
   (Aquele usuário foi criado já confirmado, então entra direto.)
3. Teste também: **Esqueci minha senha** → veja se o e-mail chega e se o link
   abre a tela de nova senha.
4. Crie uma conta nova de teste em **Criar conta** para ver o fluxo completo de
   confirmação por e-mail.

---

## O que já funciona

- Login com e-mail e senha, com mensagens de erro em português
- Criação de conta com confirmação por e-mail
- Esqueci minha senha → link por e-mail → criar nova senha
- Exigência de senha forte: 8 caracteres, maiúscula, minúscula, número e
  símbolo, com medidor visual enquanto digita
- Sessão mantida: você não precisa logar toda vez
- Menu do representante no topo, com Meus dados, Trocar senha e Sair
- Quem não está logado é mandado para o login automaticamente

## O que ainda falta

O sistema ainda **lê e grava no arquivo JSON**, não no banco. Ou seja: o login
já protege a entrada, mas os dados continuam vindo do arquivo. A troca do
arquivo pelas tabelas do Supabase é o próximo passo, e é a parte maior.
