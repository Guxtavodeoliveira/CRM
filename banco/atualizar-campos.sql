-- =========================================================
-- ATUALIZAR CAMPOS DO CLIENTE  —  rode UMA vez, no Supabase
-- =========================================================
--
-- Para que serve: a ficha do cliente ganhou campos novos
-- (inscrição estadual, responsável da empresa e os dados
-- bancários). O banco precisa saber que eles existem.
--
-- Como rodar, em 30 segundos:
--   1. Entre em https://supabase.com e abra o seu projeto.
--   2. No menu da esquerda, clique em "SQL Editor".
--   3. Clique em "New query".
--   4. Copie TUDO deste arquivo e cole na janela.
--   5. Clique em "Run" (ou aperte Ctrl+Enter).
--   6. Tem que aparecer "Success". Pronto, acabou.
--
-- Pode rodar mais de uma vez sem medo: se a coluna já existir,
-- ele simplesmente pula. Nada é apagado, nada é perdido.
-- =========================================================

alter table clientes add column if not exists inscricao_estadual  text default '';
alter table clientes add column if not exists responsavel_empresa text default '';

alter table clientes add column if not exists banco          text default '';
alter table clientes add column if not exists agencia        text default '';
alter table clientes add column if not exists conta_corrente text default '';
alter table clientes add column if not exists conta_poupanca text default '';
alter table clientes add column if not exists pix            text default '';

-- Preenche com texto vazio as linhas antigas, para não ficar nulo
update clientes set
  inscricao_estadual  = coalesce(inscricao_estadual, ''),
  responsavel_empresa = coalesce(responsavel_empresa, ''),
  banco               = coalesce(banco, ''),
  agencia             = coalesce(agencia, ''),
  conta_corrente      = coalesce(conta_corrente, ''),
  conta_poupanca      = coalesce(conta_poupanca, ''),
  pix                 = coalesce(pix, '');

-- Confere o resultado (deve listar as 7 colunas novas)
select column_name
  from information_schema.columns
 where table_name = 'clientes'
   and column_name in ('inscricao_estadual','responsavel_empresa',
                       'banco','agencia','conta_corrente','conta_poupanca','pix')
 order by column_name;
