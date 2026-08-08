#!/usr/bin/env node
/* =========================================================
   migrar.js — joga o crm-dados.json dentro do banco.

   Pode rodar quantas vezes quiser: cada linha guarda o id
   antigo em legacy_id, então rodar de novo ATUALIZA em vez
   de duplicar. Dá para testar, apagar, rodar de novo, e
   continuar usando o CRM em arquivo enquanto isso.

   Uso:
     npm install pg
     node migrar.js ./crm-dados.json

   Variáveis de ambiente:
     DATABASE_URL   string de conexão do Supabase
                    (Project Settings > Database > Connection string > URI)
     OWNER_ID       uuid do usuário dono dos dados
                    (Authentication > Users > copiar o UUID)
     REPRESENTADA   nome da representada (padrão: "NST Print")
   ========================================================= */

const fs = require("fs");
const { Client } = require("pg");

const ARQ  = process.argv[2] || "./crm-dados.json";
const URL  = process.env.DATABASE_URL;
const DONO = process.env.OWNER_ID;
const REPR = process.env.REPRESENTADA || "NST Print";

if(!URL || !DONO){
  console.error("Faltou DATABASE_URL ou OWNER_ID. Veja o cabeçalho do arquivo.");
  process.exit(1);
}

// o Supabase exige SSL; um Postgres local normalmente não tem
const usaSSL = !/localhost|127\.0\.0\.1/.test(URL) && process.env.PGSSL !== "off";
const db = new Client({
  connectionString: URL,
  ssl: usaSSL ? { rejectUnauthorized:false } : false
});

/* upsert genérico usando legacy_id como chave */
async function up(tabela, legacy, campos){
  const cols = ["owner_id","legacy_id", ...Object.keys(campos)];
  const vals = [DONO, legacy, ...Object.values(campos)];
  const ph   = cols.map((_,i) => "$" + (i+1)).join(",");
  const set  = Object.keys(campos).map(c => `${c}=excluded.${c}`).join(",");
  // o índice de legacy_id é parcial (where legacy_id is not null); para o
  // ON CONFLICT enxergar esse índice, a mesma condição precisa ser repetida
  const sql  = `insert into ${tabela} (${cols.join(",")}) values (${ph})
                on conflict (owner_id, legacy_id) where legacy_id is not null
                do update set ${set}
                returning id`;
  const r = await db.query(sql, vals);
  return r.rows[0].id;
}

/* tabelas sem índice de legacy: apaga os filhos e reinsere */
async function repor(tabela, filtroCol, filtroVal, linhas){
  await db.query(`delete from ${tabela} where ${filtroCol} = $1`, [filtroVal]);
  for(const l of linhas){
    const cols = ["owner_id", filtroCol, ...Object.keys(l)];
    const vals = [DONO, filtroVal, ...Object.values(l)];
    const ph   = cols.map((_,i) => "$" + (i+1)).join(",");
    await db.query(`insert into ${tabela} (${cols.join(",")}) values (${ph})`, vals);
  }
}

const dt = v => (v && String(v).trim()) ? String(v).slice(0,10) : null;
const ts = v => v ? new Date(v).toISOString() : null;

(async () => {
  const dados = JSON.parse(fs.readFileSync(ARQ, "utf8"));
  await db.connect();
  await db.query("begin");

  try{
    // ---- representada + funil ----
    const repId = await up("representadas", "repr:" + REPR, { nome: REPR });
    const funilId = await up("funis", "funil:" + (dados.boardName || "funil"), {
      representada_id: repId,
      nome: dados.boardName || "Meu funil"
    });

    // ---- etapas (a ordem do array vira posicao) ----
    const etapaId = {};
    for(const [i, col] of (dados.columns || []).entries()){
      etapaId[col.id] = await up("etapas", col.id, {
        funil_id: funilId, nome: col.name, posicao: i
      });
    }

    // ---- opções ----
    const listas = dados.listas || {};
    const mapaTipo = { categorias:"categoria", origens:"origem", setores:"setor", produtos:"produto" };
    for(const [chave, tipo] of Object.entries(mapaTipo)){
      for(const valor of (listas[chave] || [])){
        await db.query(
          `insert into opcoes (owner_id, tipo, valor) values ($1,$2,$3)
           on conflict (owner_id, tipo, valor) do nothing`, [DONO, tipo, valor]);
      }
    }

    // ---- clientes + negócios ----
    let nCli = 0, nNeg = 0, nAtiv = 0, nPed = 0, nCom = 0, nPes = 0;

    for(const c of (dados.cards || [])){
      // o cadastro do cliente é do usuário, não do funil
      const cliId = await up("clientes", "cli:" + c.id, {
        nome: c.nome || "",
        cnpj: c.cnpj || "", razao_social: c.razaoSocial || "",
        categoria: c.categoria || "", origem: c.origem || "", setor: c.setor || "",
        descricao: c.descricao || "",
        email: c.email || "", whatsapp: c.whatsapp || "", telefone: c.telefone || "",
        celular: c.celular || "", fax: c.fax || "", ramal: c.ramal || "", website: c.website || "",
        cep: c.cep || "", pais: c.pais || "Brasil", estado: c.estado || "",
        cidade: c.cidade || "", bairro: c.bairro || "", rua: c.rua || "",
        numero: c.numero_end || "", complemento: c.complemento || "",
        redes: JSON.stringify(c.redes || {}),
        criado_em: ts(c.criadoEm) || new Date().toISOString(),
        atualizado_em: ts(c.atualizadoEm) || new Date().toISOString()
      });
      nCli++;

      await repor("pessoas", "cliente_id", cliId, (c.pessoas || []).map(p => ({
        nome: p.nome || "", cargo: p.cargo || "", email: p.email || "",
        whatsapp: p.whatsapp || "", celular: p.celular || "", telefone: p.telefone || ""
      })));
      nPes += (c.pessoas || []).length;

      const negId = await up("negocios", "neg:" + c.id, {
        funil_id: funilId,
        etapa_id: etapaId[c.columnId] || Object.values(etapaId)[0],
        cliente_id: cliId,
        numero: c.numero || 0,
        codigo: c.codigo || "",
        valor: Number(c.valor) || 0,
        status: c.status || "andamento",
        estrelas: Number(c.estrelas) || 0,
        posicao: Number(c.posicao) || 0,
        data_inicio: dt(c.dataInicio),
        data_conclusao: dt(c.dataConclusao),
        descricao: c.descricao || "",
        motivo_perda: c.motivoPerda || "",
        criado_em: ts(c.criadoEm) || new Date().toISOString(),
        etapa_em: ts(c.etapaEm) || new Date().toISOString(),
        atualizado_em: ts(c.atualizadoEm) || new Date().toISOString()
      });
      nNeg++;

      // ---- atividades + comentários ----
      for(const a of (c.agendamentos || [])){
        const ativId = await up("atividades", "ativ:" + a.id, {
          negocio_id: negId,
          tipo: a.tipo || "nota",
          prazo: a.data ? new Date(a.data).toISOString() : null,
          nota: a.nota || "",
          concluido: !!a.concluido,
          criado_em: ts(a.criadoEm) || new Date().toISOString()
        });
        nAtiv++;
        await repor("comentarios", "atividade_id", ativId, (a.comentarios || []).map(k => ({
          texto: k.texto || "", criado_em: ts(k.criadoEm) || new Date().toISOString()
        })));
        nCom += (a.comentarios || []).length;
      }

      // ---- pedidos, itens e comentários ----
      for(const p of (c.pedidos || [])){
        const pedId = await up("pedidos", "ped:" + p.id, {
          negocio_id: negId,
          numero: p.numero || 1,
          data: dt(p.data),
          forma_pagamento: p.formaPagamento || "",
          comissao_pct: Number(p.comissaoPct) || 0,
          atual: !!p.atual,
          criado_em: ts(p.criadoEm) || new Date().toISOString(),
          atualizado_em: ts(p.atualizadoEm) || new Date().toISOString()
        });
        nPed++;
        await repor("pedido_itens", "pedido_id", pedId, (p.itens || []).map((it,i) => ({
          produto: it.produto || "", quantidade: Number(it.quantidade) || 0,
          preco: Number(it.preco) || 0, posicao: i
        })));
        await repor("comentarios", "pedido_id", pedId, (p.comentarios || []).map(k => ({
          texto: k.texto || "", criado_em: ts(k.criadoEm) || new Date().toISOString()
        })));
        nCom += (p.comentarios || []).length;
      }
    }

    await db.query("commit");

    console.log(`
Migração concluída.
  representada .. ${REPR}
  funil ......... ${dados.boardName}
  etapas ........ ${Object.keys(etapaId).length}
  clientes ...... ${nCli}
  pessoas ....... ${nPes}
  negócios ...... ${nNeg}
  atividades .... ${nAtiv}
  pedidos ....... ${nPed}
  comentários ... ${nCom}

Confira no SQL Editor:
  select * from v_funil_resumo order by posicao;
  select * from v_comissao_mensal order by mes desc;
`);
  }catch(e){
    await db.query("rollback");
    console.error("Nada foi gravado. Erro:", e.message);
    process.exitCode = 1;
  }finally{
    await db.end();
  }
})();
