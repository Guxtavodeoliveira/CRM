-- =========================================================
--  CRM Funil — esquema do banco (Supabase / Postgres)
--
--  Como usar: Supabase > SQL Editor > cole este arquivo > Run.
--  Pode rodar de novo sem medo: tudo é "if not exists".
--
--  Regra de segurança: TODA tabela tem owner_id = dono da linha,
--  preenchido sozinho com o usuário logado, e a RLS só deixa
--  cada um enxergar o que é seu.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- PERFIL — o representante (1 por login)
-- ---------------------------------------------------------
create table if not exists perfis (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text not null default '',
  telefone    text default '',
  avatar_url  text default '',
  criado_em   timestamptz not null default now()
);

-- cria o perfil sozinho quando alguém se cadastra
create or replace function fn_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome',''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_novo_usuario on auth.users;
create trigger trg_novo_usuario after insert on auth.users
for each row execute function fn_novo_usuario();

-- ---------------------------------------------------------
-- REPRESENTADAS — as marcas que o usuário representa
-- ---------------------------------------------------------
create table if not exists representadas (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome           text not null,
  cnpj           text default '',
  logo_url       text default '',
  comissao_pct   numeric(6,3) default 0,      -- % sugerida ao lançar pedido
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  legacy_id      text
);

-- ---------------------------------------------------------
-- FUNIS e ETAPAS
-- O nome da etapa é editável a qualquer momento: os negócios
-- apontam para o id, não para o texto.
-- ---------------------------------------------------------
create table if not exists funis (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  representada_id uuid not null references representadas(id) on delete cascade,
  nome            text not null,
  criado_em       timestamptz not null default now(),
  legacy_id       text
);

create table if not exists etapas (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  funil_id   uuid not null references funis(id) on delete cascade,
  nome       text not null,
  posicao    int  not null default 0,
  legacy_id  text
);

-- ---------------------------------------------------------
-- CLIENTES — do usuário, não da representada.
-- Assim o mesmo cliente é reaproveitado em funis diferentes
-- sem nunca misturar os funis (quem pertence ao funil é o negócio).
-- ---------------------------------------------------------
create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome          text not null,
  cnpj          text default '',
  razao_social  text default '',
  categoria     text default '',
  origem        text default '',
  setor         text default '',
  descricao     text default '',
  email         text default '',
  whatsapp      text default '',
  telefone      text default '',
  celular       text default '',
  fax           text default '',
  ramal         text default '',
  website       text default '',
  cep           text default '',
  pais          text default 'Brasil',
  estado        text default '',
  cidade        text default '',
  bairro        text default '',
  rua           text default '',
  numero        text default '',
  complemento   text default '',
  redes         jsonb not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  legacy_id     text
);

create table if not exists pessoas (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  nome       text not null default '',
  cargo      text default '',
  email      text default '',
  whatsapp   text default '',
  celular    text default '',
  telefone   text default '',
  legacy_id  text
);

-- ---------------------------------------------------------
-- NEGÓCIOS — o que vive no funil
-- ---------------------------------------------------------
do $$ begin
  create type status_negocio as enum ('andamento','ganho','perdido');
exception when duplicate_object then null; end $$;

create table if not exists negocios (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  funil_id        uuid not null references funis(id) on delete cascade,
  etapa_id        uuid not null references etapas(id) on delete restrict,
  cliente_id      uuid not null references clientes(id) on delete cascade,
  numero          int  not null,
  codigo          text default '',
  valor           numeric(14,2) not null default 0,
  status          status_negocio not null default 'andamento',
  estrelas        smallint not null default 0 check (estrelas between 0 and 5),
  posicao         int not null default 0,          -- ordem dentro da etapa
  data_inicio     date,
  data_conclusao  date,
  descricao       text default '',
  motivo_perda    text default '',
  criado_em       timestamptz not null default now(),
  etapa_em        timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  legacy_id       text,
  unique (funil_id, numero)
);

-- ---------------------------------------------------------
-- ATIVIDADES
-- ---------------------------------------------------------
do $$ begin
  create type tipo_atividade as enum ('nota','email','ligacao','whatsapp','proposta','reuniao','visita');
exception when duplicate_object then null; end $$;

create table if not exists atividades (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  negocio_id  uuid not null references negocios(id) on delete cascade,
  tipo        tipo_atividade not null default 'nota',
  prazo       timestamptz,
  nota        text default '',
  concluido   boolean not null default false,
  criado_em   timestamptz not null default now(),
  legacy_id   text
);

-- ---------------------------------------------------------
-- PEDIDOS — 1 atual por negócio + histórico
-- ---------------------------------------------------------
create table if not exists pedidos (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  negocio_id      uuid not null references negocios(id) on delete cascade,
  numero          int not null,
  data            date,
  forma_pagamento text default '',
  comissao_pct    numeric(6,3) not null default 0,
  atual           boolean not null default false,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  legacy_id       text,
  unique (negocio_id, numero)
);

-- garante no banco que só existe UM pedido atual por negócio
create unique index if not exists ix_pedido_atual
  on pedidos (negocio_id) where atual;

create table if not exists pedido_itens (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pedido_id  uuid not null references pedidos(id) on delete cascade,
  produto    text not null,
  quantidade numeric(14,3) not null default 0,
  preco      numeric(14,2) not null default 0,
  posicao    int not null default 0,
  legacy_id  text
);

-- ---------------------------------------------------------
-- COMENTÁRIOS — servem para atividade OU para pedido
-- ---------------------------------------------------------
create table if not exists comentarios (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  atividade_id uuid references atividades(id) on delete cascade,
  pedido_id    uuid references pedidos(id) on delete cascade,
  texto        text not null,
  criado_em    timestamptz not null default now(),
  legacy_id    text,
  check (num_nonnulls(atividade_id, pedido_id) = 1)
);

-- ---------------------------------------------------------
-- OPÇÕES — categorias, origens, setores, produtos sugeridos
-- ---------------------------------------------------------
create table if not exists opcoes (
  id       uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo     text not null,      -- 'categoria' | 'origem' | 'setor' | 'produto'
  valor    text not null,
  unique (owner_id, tipo, valor)
);

-- =========================================================
-- ÍNDICES
-- =========================================================
create index if not exists ix_repr_owner    on representadas (owner_id);
create index if not exists ix_funis_repr    on funis (representada_id);
create index if not exists ix_etapas_funil  on etapas (funil_id, posicao);
create index if not exists ix_clientes_owner on clientes (owner_id);
create index if not exists ix_clientes_nome on clientes (owner_id, lower(nome));
create index if not exists ix_pessoas_cli   on pessoas (cliente_id);
create index if not exists ix_neg_funil     on negocios (funil_id, etapa_id, posicao);
create index if not exists ix_neg_cliente   on negocios (cliente_id);
create index if not exists ix_ativ_negocio  on atividades (negocio_id);
create index if not exists ix_ativ_agenda   on atividades (owner_id, prazo) where not concluido;
create index if not exists ix_pedidos_neg   on pedidos (negocio_id);
create index if not exists ix_itens_pedido  on pedido_itens (pedido_id);
create index if not exists ix_com_ativ      on comentarios (atividade_id);
create index if not exists ix_com_ped       on comentarios (pedido_id);

-- índice único do legacy_id: permite reimportar sem duplicar
create unique index if not exists ux_repr_legacy    on representadas (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_funis_legacy   on funis (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_clientes_legacy on clientes (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_negocios_legacy on negocios (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_etapas_legacy   on etapas   (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_ativ_legacy     on atividades (owner_id, legacy_id) where legacy_id is not null;
create unique index if not exists ux_pedidos_legacy  on pedidos  (owner_id, legacy_id) where legacy_id is not null;

-- =========================================================
-- SEGURANÇA (RLS) — cada um só vê o que é seu
-- =========================================================
do $$
declare t text;
begin
  foreach t in array array['representadas','funis','etapas','clientes','pessoas',
                           'negocios','atividades','pedidos','pedido_itens',
                           'comentarios','opcoes']
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

alter table perfis enable row level security;
drop policy if exists p_perfil_sel on perfis;
drop policy if exists p_perfil_upd on perfis;
create policy p_perfil_sel on perfis for select using (id = auth.uid());
create policy p_perfil_upd on perfis for update using (id = auth.uid()) with check (id = auth.uid());

-- =========================================================
-- VISÕES PARA RELATÓRIO
-- Herdam a RLS das tabelas de origem: cada um vê só o seu.
-- =========================================================

-- pedido com total e comissão já calculados
create or replace view v_pedidos as
select
  p.id, p.owner_id, p.negocio_id, p.numero, p.data, p.forma_pagamento,
  p.comissao_pct, p.atual,
  n.funil_id, f.representada_id, r.nome as representada,
  n.cliente_id, c.nome as cliente, c.cidade, c.estado,
  coalesce(i.total, 0) as total,
  round(coalesce(i.total, 0) * p.comissao_pct / 100, 2) as comissao
from pedidos p
join negocios n on n.id = p.negocio_id
join funis f    on f.id = n.funil_id
join representadas r on r.id = f.representada_id
join clientes c on c.id = n.cliente_id
left join lateral (
  select sum(pi.quantidade * pi.preco) as total
  from pedido_itens pi where pi.pedido_id = p.id
) i on true;

-- comissão por mês e por representada
create or replace view v_comissao_mensal as
select
  owner_id,
  representada_id,
  representada,
  date_trunc('month', coalesce(data, criado_em::date))::date as mes,
  count(*)      as pedidos,
  sum(total)    as faturado,
  sum(comissao) as comissao
from (
  select v.*, p.criado_em from v_pedidos v join pedidos p on p.id = v.id
) x
group by owner_id, representada_id, representada, mes;

-- funil: quantos negócios e quanto valor por etapa
create or replace view v_funil_resumo as
select
  n.owner_id, f.id as funil_id, f.nome as funil,
  e.id as etapa_id, e.nome as etapa, e.posicao,
  count(n.id) filter (where n.status = 'andamento') as em_andamento,
  count(n.id) filter (where n.status = 'ganho')     as ganhos,
  count(n.id) filter (where n.status = 'perdido')   as perdidos,
  coalesce(sum(n.valor) filter (where n.status = 'andamento'), 0) as valor_aberto
from etapas e
join funis f on f.id = e.funil_id
left join negocios n on n.etapa_id = e.id
group by n.owner_id, f.id, f.nome, e.id, e.nome, e.posicao;
