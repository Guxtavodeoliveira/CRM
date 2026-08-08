# Trazer seus dados para o Supabase

Você já fez: criou o projeto, rodou o `schema.sql`, criou seu usuário.
Falta só este passo. São 3 coisas.

---

## 1. Instalar o Node (se ainda não tiver)

Abra o CMD e digite:

```cmd
node --version
```

**Se aparecer um número** (tipo `v20.11.0`), pule para o passo 2.

**Se der erro**, baixe em https://nodejs.org — o botão da esquerda (LTS).
Instale clicando Next em tudo, e depois **feche e abra o CMD de novo**.

---

## 2. Pegar o endereço do banco

No Supabase, clique no botão verde **Connect** (lá em cima, ao lado do nome do projeto).

Procure a aba/opção **ORMs** ou **Direct connection** e copie a linha que começa
com `postgresql://`. Vai ser parecida com:

```
postgresql://postgres.gpjjfjcyypsgmhqcpuxh:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

**Copie exatamente como está.** Não precisa trocar o `[YOUR-PASSWORD]` —
a senha vai separada, e é de propósito: assim funciona mesmo se ela tiver
símbolos como `@`, `#`, `?` ou `/`.

Cole essa linha no seu bloco de notas.

---

## 3. Rodar

Abra o CMD **dentro da pasta `banco`**. (Abra a pasta no Explorer, clique na
barra de endereço, apague, digite `cmd` e Enter.)

**Primeiro, instale a peça que falta** (só na primeira vez):

```cmd
npm install pg
```

Espere terminar. Vai aparecer algo como "added 15 packages".

**Agora cole estas 4 linhas, uma de cada vez**, trocando o que está em MAIÚSCULAS:

```cmd
set DATABASE_URL=COLE-AQUI-A-LINHA-postgresql
```

```cmd
set DB_PASSWORD=COLE-AQUI-A-SENHA-DO-BANCO
```

```cmd
set OWNER_ID=COLE-AQUI-O-UID-DO-USUARIO
```

```cmd
node migrar.js "C:\caminho\completo\do\seu\crm-dados.json"
```

> Dica para o caminho do arquivo: no Explorer, segure **Shift**, clique com o
> botão direito no `crm-dados.json` e escolha **Copiar como caminho**. Ele já
> vem com as aspas.

---

## O que deve aparecer

```
Conectando em aws-0-sa-east-1.pooler.supabase.com ...

Migração concluída.
  representada .. NST Print
  funil ......... NST Print
  etapas ........ 6
  clientes ...... 42
  pessoas ....... 24
  negócios ...... 42
  atividades .... 26
  pedidos ....... 1
  comentários ... 4
```

---

## Conferir no Supabase

No **SQL Editor**, cole e rode:

```sql
select * from v_funil_resumo order by posicao;
```

Você deve ver suas 6 etapas com a contagem de negócios em cada uma.

---

## Se der errado

O script é **tudo ou nada**: se falhar, não grava nada pela metade. Corrija e
rode de novo — e rodar duas vezes **não duplica** nada.

| Mensagem | O que fazer |
|---|---|
| `'node' não é reconhecido` | Instale o Node (passo 1) e reabra o CMD |
| `Cannot find module 'pg'` | Rode `npm install pg` dentro da pasta `banco` |
| `password authentication failed` | A senha está errada. É a **Database Password** que você guardou ao criar o projeto — não é a senha do seu login do Supabase |
| `A senha do banco não foi informada` | Faltou a linha do `set DB_PASSWORD=` |
| `Não achei o arquivo` | O caminho do `crm-dados.json` está errado. Use o "Copiar como caminho" |
| `invalid input syntax for type uuid` | O `OWNER_ID` não é o UID. Pegue em Authentication > Users, clicando no seu usuário |
| `relation ... does not exist` | O `schema.sql` não rodou. Volte no SQL Editor e rode de novo |

**Importante:** os comandos `set` valem só enquanto aquela janela do CMD estiver
aberta. Se fechar e precisar rodar de novo, cole as 4 linhas outra vez.
