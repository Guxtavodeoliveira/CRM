/* =========================================================
   smoke.js — verificação dos caminhos críticos do sistema.

   Roda sem navegador e sem internet: carrega os scripts num
   jsdom e usa um Supabase simulado que registra o que seria
   enviado ao banco.

   Uso:
     cd testes
     npm install jsdom
     node smoke.js

   Cada bloco abaixo cobre um bug que já aconteceu de verdade ou
   uma regra do negócio que não pode quebrar. Ao mexer no sistema,
   rode isto antes de entregar.
   ========================================================= */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..") + "/";
const FIXTURE = path.join(__dirname, "fixtures", "funil-exemplo.json");

const falhas = [];
let total = 0;
function t(nome, fn){
  total++;
  try{ fn(); console.log("  ok   " + nome); }
  catch(e){ console.log("  FALHA " + nome + " -> " + e.message); falhas.push(nome + ": " + (e.stack||e.message)); }
}
async function ta(nome, fn){
  total++;
  try{ await fn(); console.log("  ok   " + nome); }
  catch(e){ console.log("  FALHA " + nome + " -> " + e.message); falhas.push(nome + ": " + (e.stack||e.message)); }
}
const espera = ms => new Promise(r => setTimeout(r, ms));

/* ---------------------------------------------------------
   Supabase simulado: registra tudo que receberia
   --------------------------------------------------------- */
function fakeSb(tabelas){
  const log = [];
  const consulta = nome => {
    const st = { _t:nome };
    const ok = data => Promise.resolve({ data, error:null });
    st.select = () => st; st.order = () => st; st.eq = () => st;
    st.in = () => st;
    st.single = () => ok((tabelas[nome]||[])[0] || null);
    st.upsert = (rows, opt) => { log.push({op:"upsert", tabela:nome, rows:[].concat(rows), opt}); return ok(rows); };
    st.insert = rows => {
      log.push({op:"insert", tabela:nome, rows:[].concat(rows)});
      const r = [].concat(rows).map((x,i) => ({...x, id: x.id || `novo-${nome}-${i}`}));
      const p = ok(r); p.select = () => ({ single: () => ok(r[0]) }); return p;
    };
    st.update = vals => { log.push({op:"update", tabela:nome, vals}); return { eq: () => ok(null) }; };
    st.delete = () => ({ in:(c,v) => { log.push({op:"delete", tabela:nome, ids:v}); return ok(null); },
                         eq: () => ok(null) });
    st.then = res => ok(tabelas[nome]||[]).then(res);
    return st;
  };
  return { log, from:consulta,
    auth:{ getUser: async () => ({ data:{ user:{ id:"OWNER-1", email:"teste@exemplo.com" } } }),
           getSession: async () => ({ data:{ session:{ user:{ id:"OWNER-1" } } } }),
           signOut: async () => {} } };
}

/* ---------------------------------------------------------
   Monta a aplicação no jsdom
   modo: "arquivo" (sem login) ou "banco" (Supabase simulado)
   --------------------------------------------------------- */
function montar(modo, tabelas){
  const dom = new JSDOM(fs.readFileSync(RAIZ + "index.html", "utf8"),
    { runScripts:"outside-only", url:"https://exemplo.test/index.html", pretendToBeVisual:true });
  const w = dom.window, d = w.document;

  w.indexedDB = undefined;
  w.XLSX = { utils:{ aoa_to_sheet:aoa=>({__aoa:aoa}), book_new:()=>({s:[]}),
                     book_append_sheet:(wb,ws,n)=>wb.s.push({n,ws}),
                     encode_cell:({r,c})=>`R${r}C${c}` },
             writeFile:(wb,nome)=>{ w.__xlsx = {wb,nome}; } };
  w.__nav = [];
  w.__loc = { href:"https://exemplo.test/index.html", origin:"https://exemplo.test",
              pathname:"/index.html", replace:u=>w.__nav.push(u), assign:u=>w.__nav.push(u),
              reload:()=>{ w.__recarregou = true; } };
  w.__imprimiu = 0;
  w.print = () => { w.__imprimiu++; w.__marcado = (d.querySelector(".para-imprimir")||{}).id || null; };

  if(modo === "arquivo"){
    w.localStorage.setItem("kanbanCrmData", fs.readFileSync(FIXTURE, "utf8"));
  }

  const sbFake = modo === "banco" ? fakeSb(tabelas || {}) : null;
  w.__sbFake = sbFake;

  const arquivos = ["config.js","auth.js","util.js","storage.js","banco.js","board.js",
                    "empresa.js","negocio.js","pedidos.js","relatorios.js","segmentos.js","agenda.js",
                    "exportar-agendor.js","usuario.js","main.js"];
  let codigo = "const location = window.__loc;\n" +
    arquivos.map(f => fs.readFileSync(RAIZ + "assets/js/" + f, "utf8")).join("\n;\n");
  codigo = codigo.replace(/const sb = [\s\S]*?: null;/,
    modo === "banco" ? "const sb = window.__sbFake;" : "const sb = null;");
  codigo += `
;window.__x = {
  get dados(){return dados;}, set dados(v){dados=v;},
  get foto(){return fotoAnterior;}, set foto(v){fotoAnterior=v;},
  get histAba(){return histAba;}, set histAba(v){histAba=v;},
  uid, ehUUID, normalizar, writeToFile, carregarDoBanco, sincronizar,
  valorCartao, totalPedido, comissaoPedido, pedidoAtual, pedidosHistorico,
  parsePct, agendaDoPeriodo, agendaDoDia, agendaAtrasadas,
  pedidosNoPeriodo, avaliarSenha
};`;
  try{ w.eval(codigo); }
  catch(e){ falhas.push("EXEC (" + modo + "): " + e.message + "\n" + (e.stack||"").split("\n")[1]); }
  return { w, d, sb:sbFake, X:()=>w.__x };
}

/* =========================================================
   Dados de exemplo para o modo banco
   ========================================================= */
const ID = {
  neg:"11111111-1111-4111-8111-111111111111",
  cli:"22222222-2222-4222-8222-222222222222",
  et1:"33333333-3333-4333-8333-333333333333",
  et2:"44444444-4444-4444-8444-444444444444",
  ativ:"55555555-5555-4555-8555-555555555555",
  ped:"66666666-6666-4666-8666-666666666666",
  item:"77777777-7777-4777-8777-777777777777"
};
const TABELAS = {
  funis:[{id:"F1", nome:"NST Print", representada_id:"R1"}],
  etapas:[{id:ID.et1, nome:"Contato Iniciado", posicao:0, funil_id:"F1"},
          {id:ID.et2, nome:"Cliente Comprador", posicao:1, funil_id:"F1"}],
  negocios:[{id:ID.neg, cliente_id:ID.cli, etapa_id:ID.et1, numero:5, valor:0,
             status:"andamento", estrelas:3, posicao:0, data_inicio:"2026-08-03",
             data_conclusao:null, descricao:"", motivo_perda:"", codigo:"5-x@crm.local",
             criado_em:"2026-08-03T10:00:00Z", etapa_em:"2026-08-03T10:00:00Z",
             atualizado_em:"2026-08-03T10:00:00Z"}],
  clientes:[{id:ID.cli, nome:"Delta Estamparia", cnpj:"12.345.678/0001-99",
             razao_social:"", categoria:"Cliente", origem:"", setor:"", descricao:"",
             email:"", whatsapp:"+55 47 90000-0000", telefone:"", celular:"",
             fax:"", ramal:"", website:"", cep:"88117-850", pais:"Brasil",
             estado:"SC", cidade:"São José", bairro:"Barreiros", rua:"Rua do Iano",
             numero:"598", complemento:"", redes:{instagram:"https://exemplo"}}],
  pessoas:[{id:"P1", cliente_id:ID.cli, nome:"Emerson", cargo:"Proprietário",
            email:"", whatsapp:"", celular:"", telefone:""}],
  atividades:[{id:ID.ativ, negocio_id:ID.neg, tipo:"whatsapp",
               prazo:"2026-08-20T11:00:00Z", nota:"Perguntar do pedido",
               concluido:false, criado_em:"2026-08-03T23:09:00Z"}],
  pedidos:[{id:ID.ped, negocio_id:ID.neg, numero:1, data:"2026-08-07",
            forma_pagamento:"Boleto 30", comissao_pct:12, atual:true,
            criado_em:"2026-08-07T20:00:00Z", atualizado_em:"2026-08-07T20:00:00Z"}],
  pedido_itens:[{id:ID.item, pedido_id:ID.ped, produto:"Tinta Branca",
                 quantidade:4, preco:190, posicao:0}],
  comentarios:[{id:"C1", atividade_id:ID.ativ, pedido_id:null,
                texto:"Cliente pediu prazo", criado_em:"2026-08-04T10:00:00Z"}],
  opcoes:[{tipo:"categoria", valor:"Cliente"},{tipo:"produto", valor:"Tinta Branca"}],
  perfis:[{id:"OWNER-1", nome:"Gustavo de Oliveira", email:"teste@exemplo.com"}]
};

/* =========================================================
   EXECUÇÃO
   ========================================================= */
(async () => {

console.log("\n########## MODO ARQUIVO ##########");
const A = montar("arquivo");
await espera(80);

console.log("\n== abertura ==");
t("carrega o funil de exemplo", () => {
  A.d.getElementById("continueAnyway").click();
  const dd = A.X().dados;
  if(dd.cards.length !== 5) throw new Error("cartões=" + dd.cards.length);
  if(dd.columns.length !== 6) throw new Error("etapas=" + dd.columns.length);
  if(A.d.querySelectorAll("#board .card").length !== 5) throw new Error("board não renderizou");
});
t("marca aplicada: título, logo e favicon", () => {
  if(!A.d.title.includes("Gustavo de Oliveira")) throw new Error(A.d.title);
  if(!A.d.querySelector('.brand-logo[src="img/logo-barra.svg"]')) throw new Error("logo da barra");
  if(!A.d.querySelector('link[href="img/faviconlogo.ico"]')) throw new Error("favicon");
  if(/shaliach/i.test(A.d.body.textContent)) throw new Error("sobrou nome antigo na tela");
});
t("removidos a pedido do dono: filtro, status, privacidade", () => {
  if(A.d.querySelector("[data-filter]")) throw new Error("filtro de situação voltou");
  if(A.d.querySelector("[data-status]")) throw new Error("botões de status voltaram");
  if(A.d.getElementById("f_priv_todos")) throw new Error("privacidade voltou");
});

console.log("\n== identificadores ==");
t("uid() gera UUID (id da tela = id do banco)", () => {
  const ids = [...Array(200)].map(() => A.X().uid());
  if(!ids.every(A.X().ehUUID)) throw new Error("não é uuid: " + ids[0]);
  if(new Set(ids).size !== 200) throw new Error("repetiu");
});

console.log("\n== cadastro de cliente ==");
t("nome vazio é recusado", () => {
  A.w.abrirEmpresa(null, A.X().dados.columns[0].id);
  const antes = A.X().dados.cards.length;
  A.d.getElementById("empSave").click();
  if(A.X().dados.cards.length !== antes) throw new Error("salvou sem nome");
  if(!A.d.getElementById("f_nome").classList.contains("erro") &&
     !A.d.getElementById("f_nome").classList.contains("error")) throw new Error("sem marca de erro");
});
t("cadastro completo salva e numera", () => {
  A.d.getElementById("f_nome").value = "Zeta Serigrafia";
  A.d.getElementById("f_estado").value = "SC";
  A.d.getElementById("f_estado").dispatchEvent(new A.w.Event("change"));
  A.d.getElementById("f_cidade").value = "Itajaí";
  A.d.getElementById("empSave").click();
  const novo = A.X().dados.cards.find(c => c.nome === "Zeta Serigrafia");
  if(!novo) throw new Error("não salvou");
  if(novo.numero !== 6) throw new Error("numero=" + novo.numero);
  if(!novo.codigo) throw new Error("sem código");
  if(!A.X().ehUUID(novo.id)) throw new Error("id não é uuid");
});
t("cidade só libera depois do estado", () => {
  A.w.abrirEmpresa(null, A.X().dados.columns[0].id);
  if(!A.d.getElementById("f_cidade").disabled) throw new Error("cidade liberada sem estado");
  A.w.fecharEmpresa();
});

console.log("\n== atividades e comentários ==");
const delta = () => A.X().dados.cards.find(c => c.nome === "Delta Estamparia");
t("registra atividade pelo composer", () => {
  A.w.abrirNegocio(delta().id);
  const box = A.d.getElementById("dealContent");
  box.querySelector('.ctab[data-tipo="visita"]').click();
  box.querySelector("#cpNota").value = "Levar catálogo novo";
  box.querySelector("#cpSalvar").click();
  const ult = delta().agendamentos[delta().agendamentos.length - 1];
  if(ult.tipo !== "visita") throw new Error("tipo=" + ult.tipo);
  if(ult.nota !== "Levar catálogo novo") throw new Error("nota");
});
t("comentário em atividade: abre, salva, conta", () => {
  const ativ = delta().agendamentos[0];
  A.d.querySelector(`[data-coment="${ativ.id}"]`).click();
  const ta = A.d.querySelector("[data-novopedcom], [data-novocoment]");
  A.d.querySelector("[data-novocoment]").value = "Resumo do que foi conversado.";
  A.d.querySelector("[data-addcoment]").click();
  const a = delta().agendamentos.find(x => x.id === ativ.id);
  if(!a.comentarios.some(k => k.texto.includes("Resumo do que"))) throw new Error("não salvou");
  if(!A.d.querySelector(`[data-coment="${ativ.id}"]`).textContent.includes("(")) throw new Error("sem contador");
});

console.log("\n== pedidos ==");
t("pedido atual único: novo empurra o anterior para o histórico", () => {
  A.X().histAba = "pedidos";
  A.w.renderNegocio();
  const antes = A.X().pedidoAtual(delta()).numero;
  A.d.getElementById("pedNovo").click();
  const set = (i,k,v) => { const e = A.d.querySelector(`[data-it="${i}"][data-k="${k}"]`);
    e.value = v; e.dispatchEvent(new A.w.Event("input")); e.dispatchEvent(new A.w.Event("blur")); };
  set(0,"produto","Filme DTF"); set(0,"quantidade","10"); set(0,"preco","150");
  A.d.getElementById("ped_comis").value = "5";
  A.d.getElementById("ped_comis").dispatchEvent(new A.w.Event("input"));
  A.d.getElementById("pedSalvar").click();

  const atuais = delta().pedidos.filter(p => p.atual);
  if(atuais.length !== 1) throw new Error("pedidos atuais=" + atuais.length);
  if(atuais[0].numero === antes) throw new Error("não trocou o atual");
  if(!A.X().pedidosHistorico(delta()).some(p => p.numero === antes)) throw new Error("antigo não foi para o histórico");
});
t("total e comissão calculados", () => {
  const p = A.X().pedidoAtual(delta());
  if(A.X().totalPedido(p) !== 1500) throw new Error("total=" + A.X().totalPedido(p));
  if(Math.abs(A.X().comissaoPedido(p) - 75) > 0.001) throw new Error("comissão=" + A.X().comissaoPedido(p));
});
t("percentual aceita vírgula e trava entre 0 e 100", () => {
  if(A.X().parsePct("3,5") !== 3.5) throw new Error("vírgula");
  if(A.X().parsePct("7%") !== 7) throw new Error("com %");
  if(A.X().parsePct("150") !== 100) throw new Error("acima de 100");
  if(A.X().parsePct("-3") !== 0) throw new Error("negativo");
  if(A.X().parsePct("abc") !== 0) throw new Error("texto");
});
t("valor no funil vem do pedido atual", () => {
  if(A.X().valorCartao(delta()) !== 1500) throw new Error(A.X().valorCartao(delta()));
  const sem = A.X().dados.cards.find(c => c.nome === "Gama Malhas");
  if(A.X().valorCartao(sem) !== 0) throw new Error("sem pedido deveria ser 0");
});

console.log("\n== ficha do pedido em PDF ==");
t("ficha traz cadastro, itens e comentários", () => {
  const p = A.X().pedidoAtual(delta());
  A.w.abrirFichaPedido(delta(), p.id);
  const txt = A.d.getElementById("fichaFolha").textContent;
  ["Delta Estamparia","Rua Exemplo","São José - SC","Filme DTF","1.500,00"]
    .forEach(x => { if(!txt.includes(x)) throw new Error("faltou: " + x); });
});
t("comissão fica FORA da ficha por padrão", () => {
  const txt = A.d.getElementById("fichaFolha").textContent;
  if(txt.includes("Comissão do representante")) throw new Error("comissão apareceu sem pedir");
  const chk = A.d.getElementById("fichaComis");
  chk.checked = true; chk.dispatchEvent(new A.w.Event("change"));
  if(!A.d.getElementById("fichaFolha").textContent.includes("Comissão do representante")) throw new Error("não entrou ao marcar");
});
await ta("impressão isola só a folha", async () => {
  A.d.getElementById("fichaPrint").click();
  await espera(120);
  if(A.w.__imprimiu !== 1) throw new Error("não imprimiu");
  if(A.w.__marcado !== "fichaOverlay") throw new Error("isolou: " + A.w.__marcado);
  await espera(1400);
  if(A.d.body.classList.contains("imprimindo")) throw new Error("não limpou o modo impressão");
  A.w.fecharFicha();
});

console.log("\n== agenda ==");
t("hoje / amanhã / atrasadas separam certo", () => {
  const c = A.X().dados.cards;
  const iso = off => { const d0 = new Date(); d0.setDate(d0.getDate()+off);
    const p = n => String(n).padStart(2,"0");
    return `${d0.getFullYear()}-${p(d0.getMonth()+1)}-${p(d0.getDate())}T09:00`; };
  c.forEach(x => (x.agendamentos||[]).forEach(a => { a.concluido = true; }));
  c[0].agendamentos = [{id:A.X().uid(),tipo:"whatsapp",data:iso(0),nota:"hoje",concluido:false,criadoEm:new Date().toISOString(),comentarios:[]}];
  c[1].agendamentos = [{id:A.X().uid(),tipo:"visita",data:iso(1),nota:"amanha",concluido:false,criadoEm:new Date().toISOString(),comentarios:[]}];
  c[2].agendamentos = [{id:A.X().uid(),tipo:"ligacao",data:iso(-3),nota:"atrasada",concluido:false,criadoEm:new Date().toISOString(),comentarios:[]}];
  if(A.X().agendaDoDia(0).length !== 1) throw new Error("hoje=" + A.X().agendaDoDia(0).length);
  if(A.X().agendaDoDia(1).length !== 1) throw new Error("amanhã=" + A.X().agendaDoDia(1).length);
  if(A.X().agendaAtrasadas().length !== 1) throw new Error("atrasadas=" + A.X().agendaAtrasadas().length);
});
t("período personalizado filtra o intervalo", () => {
  const hoje = new Date(); const p = n => String(n).padStart(2,"0");
  const dia = off => { const d0 = new Date(hoje); d0.setDate(d0.getDate()+off);
    return `${d0.getFullYear()}-${p(d0.getMonth()+1)}-${p(d0.getDate())}`; };
  if(A.X().agendaDoPeriodo(dia(0), dia(2)).length !== 2) throw new Error("hoje+amanhã");
  if(A.X().agendaDoPeriodo(dia(-5), dia(-1)).length !== 1) throw new Error("só a atrasada");
  if(A.X().agendaDoPeriodo(dia(30), dia(60)).length !== 0) throw new Error("futuro vazio");
});
t("botão Personalizado existe e abre o modal", () => {
  A.d.querySelector('[data-agenda="periodo"]').click();
  if(!A.d.getElementById("periodoOverlay").classList.contains("show")) throw new Error("não abriu");
  A.w.fecharEscolhaPeriodo();
});

console.log("\n== relatório ==");
t("soma vendas e comissões do período", () => {
  const linhas = A.X().pedidosNoPeriodo("2026-01-01","2026-12-31");
  if(!linhas.length) throw new Error("nenhum pedido");
  const tot = linhas.reduce((s,l) => s + l.total, 0);
  const com = linhas.reduce((s,l) => s + l.comissao, 0);
  if(tot <= 0) throw new Error("total=" + tot);
  if(com <= 0) throw new Error("comissão=" + com);
  const fora = A.X().pedidosNoPeriodo("2020-01-01","2020-12-31");
  if(fora.length) throw new Error("trouxe pedido fora do período");
});
t("gera a planilha do relatório", () => {
  A.w.abrirRelVendas();
  A.d.getElementById("relDe").value = "2026-01-01";
  A.d.getElementById("relDe").dispatchEvent(new A.w.Event("change"));
  A.d.getElementById("relAte").value = "2026-12-31";
  A.d.getElementById("relAte").dispatchEvent(new A.w.Event("change"));
  A.d.getElementById("relXlsx").click();
  if(!A.w.__xlsx) throw new Error("não gerou");
  const cab = A.w.__xlsx.wb.s[0].ws.__aoa[0];
  if(cab[0] !== "Data" || cab[8] !== "Valor da comissão") throw new Error(JSON.stringify(cab));
  A.w.fecharRelatorio();
});

console.log("\n== ordem dentro da coluna ==");
t("arrastar respeita a posição do marcador (bug já corrigido)", () => {
  const col = A.X().dados.columns[0].id;
  const naCol = () => A.X().dados.cards.filter(c => c.columnId === col)
    .sort((a,b) => a.posicao - b.posicao).map(c => c.nome);
  const antes = naCol();
  if(antes.length < 2) throw new Error("coluna com menos de 2 cartões");
  const wrap = A.d.querySelector(`.cards[data-col="${col}"]`);
  const cartoes = [...wrap.querySelectorAll(".card")];
  const ultimo = cartoes[cartoes.length - 1];
  const nomeMovido = ultimo.querySelector(".card-name").textContent;
  ultimo.dispatchEvent(new A.w.Event("dragstart", { bubbles:true }));
  const marca = A.d.createElement("div");
  marca.id = "dropMark"; marca.className = "drop-mark";
  wrap.insertBefore(marca, cartoes[0]);
  A.w.soltarCartao(col, wrap);
  const depois = naCol();
  if(depois[0] !== nomeMovido) throw new Error("esperava " + nomeMovido + " no topo, veio " + depois[0]);
  if(depois.length !== antes.length) throw new Error("perdeu cartão");
  depois.forEach((_,i) => {
    const c = A.X().dados.cards.filter(x => x.columnId === col).sort((a,b)=>a.posicao-b.posicao)[i];
    if(c.posicao !== i) throw new Error("posições com buraco");
  });
});

console.log("\n== compatibilidade de arquivos antigos ==");
t("JSON do formato original ainda abre", () => {
  const n = A.X().normalizar({
    boardName:"Antigo",
    columns:[{id:"c1",name:"A"},{id:"c2",name:"B"}],
    cards:[{ id:"x1", columnId:"c2", nome:"Cliente Velho", whatsapp:"47999999999",
             endereco:"Rua Antiga, 50", descricao:"nota",
             agendamentos:[{id:"a1",tipo:"visita",data:"2026-08-04T12:00",nota:"visitar",concluido:false}],
             criadoEm:"2026-01-01T10:00:00.000Z" }]
  });
  const c = n.cards[0];
  if(c.rua !== "Rua Antiga, 50") throw new Error("endereço não migrou: " + c.rua);
  if(c.agendamentos.length !== 1) throw new Error("atividades perdidas");
  if(!Array.isArray(c.agendamentos[0].comentarios)) throw new Error("sem array de comentários");
  if(!Array.isArray(c.pedidos)) throw new Error("sem array de pedidos");
  if(c.numero !== 1 || !c.codigo) throw new Error("não numerou");
  if(typeof c.posicao !== "number") throw new Error("sem posicao");
});
t("objeto vazio virou funil padrão", () => {
  const n = A.X().normalizar({});
  if(n.columns.length !== 6) throw new Error("etapas=" + n.columns.length);
});
t("arquivo com dois pedidos 'atual' é consertado", () => {
  const n = A.X().normalizar({ boardName:"X", columns:[{id:"c1",name:"A"}],
    cards:[{ id:"x1", columnId:"c1", nome:"Y", pedidos:[
      {id:"p1", numero:1, atual:true, itens:[{produto:"A",quantidade:1,preco:10}]},
      {id:"p2", numero:2, atual:true, itens:[{produto:"B",quantidade:1,preco:20}]} ]}] });
  const ped = n.cards[0].pedidos;
  if(ped.filter(p => p.atual).length !== 1) throw new Error("não consertou");
  if(!ped.find(p => p.numero === 2).atual) throw new Error("o atual deveria ser o de maior número");
});

console.log("\n== senha ==");
t("regras da senha", () => {
  const av = A.X().avaliarSenha;
  ["123456","abcdef1!","Abcdef12","Abcdefg!","Ab1!"].forEach(s => {
    if(av(s).valida) throw new Error("aceitou senha fraca: " + s);
  });
  if(!av("Consultoria2026!").valida) throw new Error("recusou senha boa");
  if(av("Consultoria2026!").pontos !== 5) throw new Error("pontos");
});

console.log("\n########## MODO BANCO ##########");
const B = montar("banco", TABELAS);

console.log("\n== carregar ==");
/* O main.js inicia a carga sozinho. Esperamos ela terminar, em vez de
   carregar por fora — assim o teste também cobre o caminho real de abertura. */
async function esperarCarga(ctx, tentativas){
  for(let i = 0; i < (tentativas || 60); i++){
    const dd = ctx.X().dados;
    if(dd && dd.cards && dd.cards.length) return dd;
    await espera(25);
  }
  throw new Error("a aplicação não carregou os dados");
}

await ta("monta o funil vindo das tabelas (pelo caminho real de abertura)", async () => {
  const dd = await esperarCarga(B);
  if(dd.boardName !== "NST Print") throw new Error(dd.boardName);
  if(dd.columns.length !== 2) throw new Error("etapas=" + dd.columns.length);
  if(dd.cards.length !== 1) throw new Error("cartões=" + dd.cards.length);
});
t("cliente + negócio viram um cartão, guardando os dois ids", () => {
  const c = B.X().dados.cards[0];
  if(c.id !== ID.neg) throw new Error("id deveria ser o do negócio");
  if(c.clienteId !== ID.cli) throw new Error("perdeu o id do cliente");
  if(c.nome !== "Delta Estamparia") throw new Error(c.nome);
  if(c.numero_end !== "598") throw new Error("numero_end=" + c.numero_end);
  if(c.pessoas.length !== 1) throw new Error("pessoas");
  if(c.agendamentos[0].comentarios.length !== 1) throw new Error("comentários da atividade");
  if(c.pedidos[0].comissaoPct !== 12) throw new Error("comissão do pedido");
  if(c.pedidos[0].itens.length !== 1) throw new Error("itens do pedido");
});

console.log("\n== gravar só o diferente ==");
const limpar = () => { B.sb.log.length = 0; };
const enviados = (tab, op) => B.sb.log.filter(l => l.tabela === tab && (!op || l.op === op));

await ta("nada mudou, nada é enviado", async () => {
  limpar();
  await B.X().sincronizar();
  const rel = B.sb.log.filter(l => l.op !== "select");
  if(rel.length) throw new Error("enviou " + JSON.stringify(rel.map(r => r.tabela + "/" + r.op)));
});
await ta("mexer no negócio não marca o cliente (bug já corrigido)", async () => {
  limpar();
  B.X().dados.cards[0].estrelas = 5;
  await B.X().sincronizar();
  if(enviados("clientes").length) throw new Error("enviou cliente à toa");
  const n = enviados("negocios","upsert");
  if(n.length !== 1) throw new Error("negocios=" + n.length);
  if(n[0].rows[0].estrelas !== 5) throw new Error("valor não foi");
});
await ta("mexer no cadastro não marca o negócio", async () => {
  limpar();
  B.X().dados.cards[0].email = "compras@delta.com.br";
  await B.X().sincronizar();
  if(enviados("negocios","upsert").length) throw new Error("enviou negócio à toa");
  const c = enviados("clientes","upsert");
  if(!c.length) throw new Error("não enviou cliente");
  if(c[0].rows[0].id !== ID.cli) throw new Error("id errado");
});
await ta("nova atividade vai com o id do negócio", async () => {
  limpar();
  const novo = B.X().uid();
  B.X().dados.cards[0].agendamentos.push({ id:novo, tipo:"visita", data:"2026-09-01T14:00",
    nota:"Levar amostra", concluido:false, criadoEm:new Date().toISOString(), comentarios:[] });
  await B.X().sincronizar();
  const a = enviados("atividades","upsert");
  if(!a.length) throw new Error("não enviou");
  const r = a[0].rows[0];
  if(r.id !== novo || r.negocio_id !== ID.neg) throw new Error("vínculo errado");
  if(!r.prazo.includes("2026-09-01")) throw new Error("prazo=" + r.prazo);
});
await ta("excluir manda delete", async () => {
  limpar();
  const id = B.X().dados.cards[0].agendamentos[0].id;
  B.X().dados.cards[0].agendamentos.shift();
  await B.X().sincronizar();
  const del = enviados("atividades","delete");
  if(!del.length || !del[0].ids.includes(id)) throw new Error("não apagou");
});
await ta("comentário de pedido vai com pedido_id, não atividade_id", async () => {
  limpar();
  B.X().dados.cards[0].pedidos[0].comentarios.push({ id:B.X().uid(),
    texto:"Entrega parcelada", autor:"G", criadoEm:new Date().toISOString() });
  await B.X().sincronizar();
  const c = enviados("comentarios","upsert");
  if(!c.length) throw new Error("não enviou");
  if(c[0].rows[0].pedido_id !== ID.ped) throw new Error("pedido_id");
  if(c[0].rows[0].atividade_id !== null) throw new Error("atividade_id deveria ser nulo");
});
await ta("novo pedido: apaga antes de gravar (índice do pedido atual)", async () => {
  limpar();
  const c = B.X().dados.cards[0];
  c.pedidos.forEach(p => { p.atual = false; });
  const novo = B.X().uid();
  c.pedidos.push({ id:novo, numero:2, data:"2026-09-10", formaPagamento:"Pix",
    comissaoPct:5, atual:true, itens:[{id:B.X().uid(),produto:"TPU",quantidade:2,preco:75}],
    comentarios:[], criadoEm:new Date().toISOString() });
  await B.X().sincronizar();
  const ups = enviados("pedidos","upsert");
  if(!ups.length) throw new Error("não gravou");
  const rows = ups[0].rows;
  if(!rows.find(r => r.id === novo && r.atual)) throw new Error("novo não veio como atual");
  const velho = rows.find(r => r.id === ID.ped);
  if(velho && velho.atual !== false) throw new Error("antigo continua atual");
  if(!enviados("pedido_itens","upsert").length) throw new Error("não gravou itens");
});
await ta("renomear etapa manda posição e funil", async () => {
  limpar();
  B.X().dados.columns[0].name = "Primeiro contato";
  await B.X().sincronizar();
  const e = enviados("etapas","upsert");
  if(!e.length) throw new Error("não enviou");
  if(e[0].rows[0].nome !== "Primeiro contato") throw new Error("nome");
  if(e[0].rows[0].posicao !== 0 || e[0].rows[0].funil_id !== "F1") throw new Error("vínculo");
});
await ta("excluir cartão apaga negócio e cliente", async () => {
  limpar();
  B.X().dados.cards = [];
  await B.X().sincronizar();
  const dn = enviados("negocios","delete");
  const dc = enviados("clientes","delete");
  if(!dn.length || !dn[0].ids.includes(ID.neg)) throw new Error("negócio");
  if(!dc.length || !dc[0].ids.includes(ID.cli)) throw new Error("cliente");
});

console.log("\n########## RESULTADO ##########");
console.log(`  ${total - falhas.length} de ${total} verificações passaram`);
if(falhas.length){
  console.log("\nFALHAS:\n" + falhas.join("\n---\n"));
  process.exit(1);
}
console.log("  tudo certo\n");
})();
