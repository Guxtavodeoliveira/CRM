# Como pedir alterações e receber os arquivos

Guia prático para o dono. Se você está retomando o projeto numa conversa nova,
o arquivo a mandar é o **`DOCUMENTACAO.md`** (ou o zip inteiro).

---

## O ciclo, em 4 passos

```
1. Você pede a alteração no chat
2. A IA devolve um arquivo .ZIP
3. Você descompacta por cima da sua pasta
4. Dois cliques no publicar.bat  →  no ar em ~1 minuto
```

---

## 1. Como pedir

Funciona melhor assim:

- **Um print da tela** com o problema ou o lugar onde a mudança vai. Foi o que
  fez as alterações saírem certas até agora.
- **Diga o que quer, não como fazer.** "Quero baixar o pedido em PDF para mandar
  para a empresa" é melhor do que "coloque um botão que chame uma função".
- **Pode pedir várias coisas juntas**, em lista. Sai numa entrega só.
- Se for erro na tela: aperte **F12**, clique na aba **Console** e mande a foto
  da mensagem em vermelho. É o que resolve mais rápido.

## 2. O que você recebe

Sempre um **.zip** com a pasta do projeto inteira — nunca arquivos soltos, nunca
"cole esse código aqui". Se vier diferente disso, peça o zip.

## 3. Como instalar a versão nova

1. Baixe o zip.
2. Descompacte **por cima** da sua pasta do projeto, mandando substituir os
   arquivos quando o Windows perguntar.
3. Confira que o `index.html` continua na raiz da pasta, junto de `assets`,
   `img` e `banco`.

> **Guarde o `crm-dados.json` FORA da pasta do projeto** (ex.:
> `Documentos\CRM-Dados`). Assim descompactar por cima nunca alcança seus dados.
> Hoje os dados ficam no banco, mas o arquivo continua servindo de backup.

## 4. Como publicar

**Dois cliques em `publicar.bat`.** Ele pergunta uma descrição curta, envia para
o GitHub, e o Cloudflare republica sozinho em cerca de 1 minuto.

Se preferir digitar, abra o CMD na pasta:

```cmd
git add .
git commit -m "descricao da mudanca"
git push
```

## 5. Como conferir se subiu

1. Abra https://shaliach.pages.dev
2. Aperte **Ctrl + F5** (recarrega ignorando o que estava guardado no navegador).
   Sem isso o navegador pode continuar mostrando a versão antiga.
3. Veja se a mudança apareceu.

---

## Backup — o que fazer de vez em quando

| O quê | Como | Quando |
|---|---|---|
| Dados | botão **Exportar** no sistema; guarde o `.json` em outro lugar | uma vez por semana |
| Código | já está no GitHub | automático |
| Banco | Supabase → Database → Backups | o plano gratuito guarda pouco tempo; se os dados ficarem críticos, vale exportar você mesmo |

---

## Coisas que você nunca deve compartilhar

- A **senha do banco** (Database Password)
- A **service_role key** do Supabase

Essas duas dão acesso total e ignoram as proteções. A `Project URL` e a
`anon/publishable key` que estão no código do sistema são seguras — foram feitas
para ficar no navegador.

Se você já mandou a senha do banco para alguém em algum lugar, troque em
**Project Settings → Database → Reset database password**. Leva 10 segundos.

---

## Se algo der errado depois de publicar

**Reverter para a versão anterior** no Cloudflare:
Workers & Pages → seu projeto → **Deployments** → ache o deploy que funcionava →
**Rollback**. Volta no ar em segundos.

**Se a tela abrir em branco:** F12 → Console → me mande a foto. Quase sempre é
um arquivo que não subiu.

**Se pedir login em loop:** confira em Authentication → URL Configuration se o
*Site URL* está `https://shaliach.pages.dev` e o *Redirect URLs* tem
`https://shaliach.pages.dev/**`.
