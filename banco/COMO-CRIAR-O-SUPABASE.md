# Criar o Supabase e transferir seus dados

Tempo: uns 20 minutos. Não precisa saber programar.
Ao final, seus 42 clientes, negócios, atividades, comentários e pedidos estarão
no banco — sem redigitar nada.

Este roteiro já foi testado do começo ao fim com o seu `crm-dados.json` real.

---

## Passo 1 — Criar o projeto

1. Entre em https://supabase.com e clique em **Start your project**.
2. Crie a conta (pode entrar com o GitHub que você acabou de criar).
3. **New project**:
   - **Name:** `shaliach`
   - **Database Password:** clique em *Generate a password* e **guarde essa senha
     num lugar seguro**. Você vai precisar dela no Passo 3 e ela não aparece de novo.
   - **Region:** `South America (São Paulo)` — é a mais perto, fica mais rápido.
4. **Create new project** e espere uns 2 minutos.

## Passo 2 — Criar as tabelas

1. No menu lateral, clique em **SQL Editor** → **New query**.
2. Abra o arquivo `banco/schema.sql`, copie **tudo** e cole na caixa.
3. Clique em **Run** (ou Ctrl+Enter).
4. Deve aparecer *Success*. Em **Table Editor** você já vê as 12 tabelas.

Se precisar rodar de novo, pode: o arquivo é feito para não quebrar nada.

## Passo 3 — Trazer os seus dados

Você precisa de duas informações:

**A senha/URL do banco**
Ícone de engrenagem (**Project Settings**) → **Database** → em
*Connection string*, escolha a aba **URI** e copie. Vai ser parecido com:

```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

Troque `[YOUR-PASSWORD]` pela senha que você guardou no Passo 1.

**O seu ID de usuário**
Primeiro crie seu usuário: menu **Authentication** → **Users** → **Add user** →
*Create new user* → informe seu e-mail e uma senha → **Create user**.
Depois copie o **UID** que aparece na lista (um código tipo
`722d19e8-7d53-48fe-9c97-92495d6806bc`).

**Agora rode a migração.** Abra o Prompt de Comando na pasta `banco` e digite:

```
npm install pg
```

Depois, no Windows (PowerShell):

```powershell
$env:DATABASE_URL="cole-a-url-aqui"
$env:OWNER_ID="cole-o-uid-aqui"
$env:REPRESENTADA="NST Print"
node migrar.js C:\caminho\para\crm-dados.json
```

Deve aparecer:

```
Migração concluída.
  clientes ...... 42
  negócios ...... 42
  atividades .... 26
  pedidos ....... 1
```

## Passo 4 — Conferir

No **SQL Editor**, rode:

```sql
select * from v_funil_resumo order by posicao;
select * from v_pedidos;
select * from v_comissao_mensal order by mes desc;
```

Você deve ver seus negócios distribuídos nas etapas, com os nomes que você deu.

---

## Perguntas que costumam aparecer

**Deu errado no meio. E agora?**
A migração é feita em transação: se der erro, **nada** é gravado pela metade.
Corrija e rode de novo.

**Rodei duas vezes. Duplicou?**
Não. Cada linha guarda o id antigo, então rodar de novo atualiza em vez de
duplicar. Isso foi testado com 3 execuções seguidas: continuou com 42 clientes.

**Posso continuar usando o CRM em arquivo enquanto isso?**
Pode, e é o recomendado. Enquanto as telas de login não ficam prontas, siga
trabalhando normalmente. Quando estiver na hora, rodamos a migração de novo com
o arquivo atualizado e ele traz o que entrou nesse meio-tempo.

**Meus dados ficam visíveis para outras pessoas?**
Não. Cada tabela tem RLS ligada: mesmo que alguém tenha o endereço do banco, só
enxerga as linhas do próprio usuário. Isso também foi testado — um usuário
diferente enxerga 0 clientes.

---

## O que você me manda depois

Para eu fazer as telas de login, criação de conta e recuperação de senha,
preciso de dois valores que ficam em **Project Settings → API**:

- **Project URL** (ex.: `https://abcdefgh.supabase.co`)
- **anon public key** (uma chave longa começando com `eyJ...`)

Esses dois são feitos para ficar no navegador — é seguro me passar.

**Nunca compartilhe** a `service_role key` nem a senha do banco. Essas duas dão
acesso total e ignoram a RLS.
