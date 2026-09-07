-- =========================================================
-- SEGMENTOS DO NEGÓCIO  —  rode UMA vez, no Supabase
-- =========================================================
--
-- Para que serve: cada funil (cada representada) passa a ter a
-- sua própria lista de segmentos, com nome e cor — por exemplo,
-- no funil da PRICOREL: Sublimação, Esporte, Confecção. Um mesmo
-- negócio pode receber nenhum, um ou vários segmentos, e o funil
-- ganha um filtro por segmento, estado e cidade.
--
-- São duas tabelas novas:
--   segmentos           = a lista de segmentos de cada funil
--   negocio_segmentos   = quais segmentos cada negócio tem
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
-- existirem, ele simplesmente pula. Nada é apagado, nada é
-- perdido, e os negócios antigos continuam iguais (sem
-- segmento nenhum, que é o normal).
-- =========================================================

-- ---------------------------------------------------------
-- SEGMENTOS — a lista de cada funil
-- Os ids são uuid, iguais aos das outras tabelas do sistema:
-- o id que aparece na tela é o mesmo id da linha no banco.
-- ---------------------------------------------------------
create table if not exists segmentos (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  funil_id  uuid not null references funis(id) on delete cascade,
  nome      text not null,
  cor       text not null default '#3A6EA5',
  posicao   int  not null default 0,
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------
-- NEGÓCIO x SEGMENTO — um negócio pode ter vários segmentos
-- Apagou o negócio ou o segmento, o vínculo some junto.
-- ---------------------------------------------------------
create table if not exists negocio_segmentos (
  negocio_id  uuid not null references negocios(id)  on delete cascade,
  segmento_id uuid not null references segmentos(id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (negocio_id, segmento_id)
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists ix_segmentos_funil on segmentos (funil_id, posicao);
create index if not exists ix_segmentos_owner on segmentos (owner_id);
create index if not exists ix_negseg_negocio  on negocio_segmentos (negocio_id);
create index if not exists ix_negseg_segmento on negocio_segmentos (segmento_id);

-- =========================================================
-- SEGURANÇA (RLS) — cada um só vê o que é seu
-- Mesma regra por owner_id que já vale em negocios, clientes etc.
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array['segmentos','negocio_segmentos']
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
   and table_name in ('segmentos','negocio_segmentos')
 order by table_name;
