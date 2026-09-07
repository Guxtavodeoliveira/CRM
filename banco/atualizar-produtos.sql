-- =========================================================
-- PRODUTOS E PREÇOS DO FUNIL  —  rode UMA vez, no Supabase
-- =========================================================
--
-- Para que serve: cada funil (cada representada) passa a ter a
-- sua própria tabela de produtos, organizada em linhas e
-- sublinhas — por exemplo, na PRICOREL:
--
--   Papel para sublimação        (linha)
--     └ Fast Dry                 (sublinha)
--         └ Bobina 90g 1,60x100m (produto: mín / médio / máx)
--
-- Cada produto guarda três preços em reais (mínimo, médio e
-- máximo, sempre POR UNIDADE do que você vende) e uma anotação
-- livre, que é só sua: ela não aparece no pedido, na ficha em
-- PDF nem em relatório nenhum.
--
-- São duas tabelas novas:
--   linhas_produto = as linhas e sublinhas de cada funil
--   produtos       = os produtos, com os três preços
--
-- Como rodar, em 30 segundos:
--   1. Entre em https://supabase.com e abra o seu projeto.
--   2. No menu da esquerda, clique em "SQL Editor".
--   3. Clique em "New query".
--   4. Copie TUDO deste arquivo e cole na janela.
--   5. Clique em "Run" (ou aperte Ctrl+Enter).
--   6. Tem que aparecer "Success". Pronto, acabou.
--
-- Pode rodar mais de uma vez sem medo: se as tabelas já
-- existirem, ele simplesmente pula. Nada é apagado, e os
-- pedidos que você já lançou continuam exatamente como estão.
-- =========================================================

-- ---------------------------------------------------------
-- LINHAS E SUBLINHAS
-- A sublinha é uma linha com "pai_id" preenchido. Assim os dois
-- níveis moram na mesma tabela, e o produto aponta para um só id.
-- ---------------------------------------------------------
create table if not exists linhas_produto (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  funil_id  uuid not null references funis(id) on delete cascade,
  pai_id    uuid references linhas_produto(id) on delete cascade,   -- nulo = linha; preenchido = sublinha
  nome      text not null,
  posicao   int  not null default 0,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------
-- PRODUTOS
-- Preços por unidade. "linha_id" nulo = produto sem linha:
-- apagar uma linha NUNCA apaga produto, ele só fica sem linha.
-- ---------------------------------------------------------
create table if not exists produtos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  funil_id      uuid not null references funis(id) on delete cascade,
  linha_id      uuid references linhas_produto(id) on delete set null,
  nome          text not null,
  preco_min     numeric(14,2) not null default 0,
  preco_med     numeric(14,2) not null default 0,
  preco_max     numeric(14,2) not null default 0,
  observacao    text default '',          -- anotação particular do representante
  posicao       int  not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists ix_linhas_prod_funil on linhas_produto (funil_id, posicao);
create index if not exists ix_linhas_prod_pai   on linhas_produto (pai_id);
create index if not exists ix_linhas_prod_owner on linhas_produto (owner_id);
create index if not exists ix_produtos_funil    on produtos (funil_id, posicao);
create index if not exists ix_produtos_linha    on produtos (linha_id);
create index if not exists ix_produtos_owner    on produtos (owner_id);

-- =========================================================
-- SEGURANÇA (RLS) — cada um só vê o que é seu
-- Mesma regra por owner_id que já vale nas outras tabelas.
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array['linhas_produto','produtos']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists p_sel on %I', t);
    execute format('drop policy if exists p_ins on %I', t);
    execute format('drop policy if exists p_upd on %I', t);
    execute format('drop policy if exists p_del on %I', t);
    execute format('create policy p_sel on %I for select using (owner_id = auth.uid())', t);
    execute format('create policy p_ins on %I for insert with check (owner_id = auth.uid())', t);
    execute format('create policy p_upd on %I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
    execute format('create policy p_del on %I for delete using (owner_id = auth.uid())', t);
  end loop;
end $$;

-- Confere o resultado (deve listar as 2 tabelas novas)
select table_name
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('linhas_produto','produtos')
 order by table_name;
