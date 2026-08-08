/* =========================================================
   banco.js — lê e grava no Supabase.

   Como funciona: ao abrir, carrega tudo para a memória no mesmo
   formato que o sistema já usava (o objeto "dados"). A partir daí
   toda a tela funciona igual. Quando algo muda, comparamos com a
   última foto conhecida e mandamos ao banco só o que mudou.

   Isso mantém o sistema rápido e evita reescrever cada tela.
   ========================================================= */

let funilAtual = null;         // { id, nome, representada_id }
let fotoAnterior = null;       // cópia do estado, para comparar
let sincronizando = false;
let novaSincPendente = false;

/* ---------------- utilidades ---------------- */
const igual = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const porId = arr => { const m = new Map(); (arr||[]).forEach(x => m.set(x.id, x)); return m; };
const dataOuNulo = v => (v && String(v).trim()) ? String(v).slice(0,10) : null;
const horaOuNulo = v => { if(!v) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };

function erroBanco(e, oque){
  console.error(oque, e);
  const msg = (e && e.message) || String(e);
  if(/JWT|not authenticated|session/i.test(msg)){
    toast("Sua sessão expirou. Entre de novo.", "err");
    setTimeout(() => location.replace("login.html"), 1500);
    return;
  }
  toast("Não consegui salvar no servidor. " + msg, "err");
}

/* =========================================================
   CARREGAR
   ========================================================= */
async function carregarDoBanco(){
  const { data: { user } } = await sb.auth.getUser();
  if(!user) { location.replace("login.html"); return null; }

  // --- funil (cria um na primeira vez) ---
  let { data: funis, error } = await sb.from("funis")
    .select("id, nome, representada_id").order("criado_em", { ascending:true });
  if(error) throw error;

  if(!funis || !funis.length){
    const { data: rep, error: e1 } = await sb.from("representadas")
      .insert({ nome:"Minha empresa", owner_id:user.id }).select("id").single();
    if(e1) throw e1;
    const { data: f, error: e2 } = await sb.from("funis")
      .insert({ nome:"Meu funil", representada_id:rep.id, owner_id:user.id })
      .select("id, nome, representada_id").single();
    if(e2) throw e2;
    funis = [f];
    const padrao = ["Contato Iniciado","Conversando","Em Negociação","Visita Agendada","Amostra Enviada","Cliente Comprador"];
    await sb.from("etapas").insert(padrao.map((nome,i) => ({
      funil_id: f.id, nome, posicao: i, owner_id: user.id
    })));
  }
  funilAtual = funis[0];

  // --- tudo em paralelo ---
  const [etapas, negocios, clientes, pessoas, atividades, pedidos, itens, comentarios, opcoes] =
    await Promise.all([
      sb.from("etapas").select("*").eq("funil_id", funilAtual.id).order("posicao"),
      sb.from("negocios").select("*").eq("funil_id", funilAtual.id).order("posicao"),
      sb.from("clientes").select("*"),
      sb.from("pessoas").select("*"),
      sb.from("atividades").select("*"),
      sb.from("pedidos").select("*").order("numero"),
      sb.from("pedido_itens").select("*").order("posicao"),
      sb.from("comentarios").select("*").order("criado_em"),
      sb.from("opcoes").select("*")
    ]);

  for(const r of [etapas, negocios, clientes, pessoas, atividades, pedidos, itens, comentarios, opcoes]){
    if(r.error) throw r.error;
  }

  // --- agrupamentos ---
  const cliPorId = porId(clientes.data);
  const pessoasPorCli = {}, ativPorNeg = {}, pedPorNeg = {}, itensPorPed = {},
        comPorAtiv = {}, comPorPed = {};
  (pessoas.data||[]).forEach(p => (pessoasPorCli[p.cliente_id] ||= []).push(p));
  (atividades.data||[]).forEach(a => (ativPorNeg[a.negocio_id] ||= []).push(a));
  (pedidos.data||[]).forEach(p => (pedPorNeg[p.negocio_id] ||= []).push(p));
  (itens.data||[]).forEach(i => (itensPorPed[i.pedido_id] ||= []).push(i));
  (comentarios.data||[]).forEach(c => {
    if(c.atividade_id) (comPorAtiv[c.atividade_id] ||= []).push(c);
    else if(c.pedido_id) (comPorPed[c.pedido_id] ||= []).push(c);
  });

  const listas = { categorias:[], origens:[], setores:[], responsaveis:[], produtos:[] };
  const mapaOp = { categoria:"categorias", origem:"origens", setor:"setores", produto:"produtos" };
  (opcoes.data||[]).forEach(o => { const k = mapaOp[o.tipo]; if(k) listas[k].push(o.valor); });

  const perfil = await carregarPerfil();
  const nomeUsuario = (perfil && perfil.nome) || user.email.split("@")[0];
  if(!listas.responsaveis.length) listas.responsaveis = [nomeUsuario];

  // --- monta o objeto que o sistema já entende ---
  const d = {
    boardName: funilAtual.nome,
    seq: (negocios.data||[]).reduce((m,n) => Math.max(m, n.numero||0), 0),
    usuario: nomeUsuario,
    listas,
    columns: (etapas.data||[]).map(e => ({ id:e.id, name:e.nome })),
    cards: (negocios.data||[]).map(n => {
      const c = cliPorId.get(n.cliente_id) || {};
      return {
        id: n.id,
        clienteId: n.cliente_id,
        columnId: n.etapa_id,
        numero: n.numero,
        posicao: n.posicao || 0,
        nome: c.nome || "", cnpj: c.cnpj || "", razaoSocial: c.razao_social || "",
        categoria: c.categoria || "", origem: c.origem || "", setor: c.setor || "",
        responsavel: nomeUsuario,
        descricao: n.descricao || c.descricao || "",
        privacidade: "todos", acessos: "",
        email: c.email || "", whatsapp: c.whatsapp || "", telefone: c.telefone || "",
        celular: c.celular || "", fax: c.fax || "", ramal: c.ramal || "", website: c.website || "",
        cep: c.cep || "", pais: c.pais || "Brasil", estado: c.estado || "",
        cidade: c.cidade || "", bairro: c.bairro || "", rua: c.rua || "",
        numero_end: c.numero || "", complemento: c.complemento || "",
        redes: c.redes || { facebook:"",twitter:"",linkedin:"",skype:"",instagram:"" },
        produtos: [],
        pessoas: (pessoasPorCli[n.cliente_id]||[]).map(p => ({
          id:p.id, nome:p.nome||"", cargo:p.cargo||"", email:p.email||"",
          celular:p.celular||"", whatsapp:p.whatsapp||"", telefone:p.telefone||""
        })),
        valor: Number(n.valor) || 0,
        status: n.status || "andamento",
        estrelas: n.estrelas || 0,
        motivoPerda: n.motivo_perda || "", descricaoPerda: "",
        dataInicio: n.data_inicio || "", dataConclusao: n.data_conclusao || "",
        agendamentos: (ativPorNeg[n.id]||[])
          .sort((a,b) => new Date(a.criado_em) - new Date(b.criado_em))
          .map(a => ({
            id:a.id, tipo:a.tipo, data: a.prazo ? toInputDT(new Date(a.prazo)) : "",
            nota:a.nota||"", concluido:!!a.concluido,
            criadoEm:a.criado_em, criadoPor:nomeUsuario,
            comentarios: (comPorAtiv[a.id]||[]).map(k => ({
              id:k.id, texto:k.texto, autor:nomeUsuario, criadoEm:k.criado_em
            }))
          })),
        pedidos: (pedPorNeg[n.id]||[]).map(p => ({
          id:p.id, numero:p.numero, data:p.data || "",
          formaPagamento:p.forma_pagamento||"", comissaoPct:Number(p.comissao_pct)||0,
          atual:!!p.atual,
          itens: (itensPorPed[p.id]||[]).map(i => ({
            id:i.id, produto:i.produto||"",
            quantidade:Number(i.quantidade)||0, preco:Number(i.preco)||0
          })),
          comentarios: (comPorPed[p.id]||[]).map(k => ({
            id:k.id, texto:k.texto, autor:nomeUsuario, criadoEm:k.criado_em
          })),
          criadoEm:p.criado_em, criadoPor:nomeUsuario, atualizadoEm:p.atualizado_em
        })),
        codigo: n.codigo || "",
        criadoEm: n.criado_em, criadoPor: nomeUsuario,
        atualizadoEm: n.atualizado_em, etapaEm: n.etapa_em
      };
    })
  };

  fotoAnterior = JSON.parse(JSON.stringify(d));
  return d;
}

/* =========================================================
   GRAVAR — compara com a foto anterior e manda só a diferença
   ========================================================= */
function paraCliente(c, ownerId){
  return {
    id: c.clienteId || c.id, owner_id: ownerId,
    nome: c.nome || "", cnpj: c.cnpj || "", razao_social: c.razaoSocial || "",
    categoria: c.categoria || "", origem: c.origem || "", setor: c.setor || "",
    descricao: c.descricao || "",
    email: c.email || "", whatsapp: c.whatsapp || "", telefone: c.telefone || "",
    celular: c.celular || "", fax: c.fax || "", ramal: c.ramal || "", website: c.website || "",
    cep: c.cep || "", pais: c.pais || "Brasil", estado: c.estado || "",
    cidade: c.cidade || "", bairro: c.bairro || "", rua: c.rua || "",
    numero: c.numero_end || "", complemento: c.complemento || "",
    redes: c.redes || {},
    atualizado_em: new Date().toISOString()
  };
}

function paraNegocio(c, ownerId, funilId){
  return {
    id: c.id, owner_id: ownerId, funil_id: funilId,
    etapa_id: c.columnId, cliente_id: c.clienteId || c.id,
    numero: c.numero || 1, codigo: c.codigo || "",
    valor: Number(c.valor) || 0, status: c.status || "andamento",
    estrelas: Number(c.estrelas) || 0, posicao: Number(c.posicao) || 0,
    data_inicio: dataOuNulo(c.dataInicio), data_conclusao: dataOuNulo(c.dataConclusao),
    descricao: c.descricao || "", motivo_perda: c.motivoPerda || "",
    criado_em: horaOuNulo(c.criadoEm) || new Date().toISOString(),
    etapa_em: horaOuNulo(c.etapaEm) || new Date().toISOString(),
    atualizado_em: new Date().toISOString()
  };
}

/* Campos que mudam sozinhos a cada gravação: não contam como alteração. */
const CAMPOS_VOLATEIS = ["atualizado_em"];
function semVolateis(linha){
  const c = { ...linha };
  CAMPOS_VOLATEIS.forEach(k => delete c[k]);
  return c;
}

/**
 * Compara as linhas JÁ TRADUZIDAS para o formato do banco.
 * É isso que faz mexer no valor do negócio não marcar o cliente
 * como alterado — cada tabela só enxerga os campos que são dela.
 */
function diferenca(antes, agora, mapear){
  const mAntes = new Map();
  (antes || []).forEach(x => { const l = mapear(x); mAntes.set(l.id, l); });

  const gravar = [], apagar = [], vistos = new Set();
  (agora || []).forEach(x => {
    const linha = mapear(x);
    vistos.add(linha.id);
    const velha = mAntes.get(linha.id);
    if(!velha || !igual(semVolateis(velha), semVolateis(linha))) gravar.push(linha);
  });
  mAntes.forEach((_, id) => { if(!vistos.has(id)) apagar.push(id); });
  return { gravar, apagar };
}

/** Achata os filhos de todos os cartões numa lista só. */
function achatar(cards, extrair){
  const out = [];
  (cards||[]).forEach(c => extrair(c, out));
  return out;
}

async function sincronizar(){
  if(!sb || !funilAtual || !dados) return;
  if(sincronizando){ novaSincPendente = true; return; }
  sincronizando = true;

  try{
    const { data: { user } } = await sb.auth.getUser();
    if(!user) throw new Error("Sessão expirada");
    const own = user.id, fid = funilAtual.id;
    const antes = fotoAnterior || { columns:[], cards:[], boardName:"", listas:{} };
    const agora = JSON.parse(JSON.stringify(dados));
    const ops = [];

    /* nome do funil */
    if(antes.boardName !== agora.boardName){
      ops.push(sb.from("funis").update({ nome: agora.boardName }).eq("id", fid));
    }

    /* etapas */
    const etAntes = (antes.columns||[]).map((c,i) => ({ id:c.id, name:c.name, i }));
    const etAgora = (agora.columns||[]).map((c,i) => ({ id:c.id, name:c.name, i }));
    const dEt = diferenca(etAntes, etAgora, e => ({
      id:e.id, owner_id:own, funil_id:fid, nome:e.name, posicao:e.i
    }));
    if(dEt.gravar.length) ops.push(sb.from("etapas").upsert(dEt.gravar));

    /* clientes e negócios */
    const dCli = diferenca(antes.cards||[], agora.cards||[], c => paraCliente(c, own));
    if(dCli.gravar.length) ops.push(sb.from("clientes").upsert(dCli.gravar));

    const dNeg = diferenca(antes.cards||[], agora.cards||[], c => paraNegocio(c, own, fid));
    if(dNeg.gravar.length) ops.push(sb.from("negocios").upsert(dNeg.gravar));

    /* pessoas */
    const pesA = achatar(antes.cards, (c,o) => (c.pessoas||[]).forEach(p => o.push({ ...p, _cli: c.clienteId || c.id })));
    const pesB = achatar(agora.cards, (c,o) => (c.pessoas||[]).forEach(p => o.push({ ...p, _cli: c.clienteId || c.id })));
    const dPes = diferenca(pesA, pesB, p => ({
      id:p.id, owner_id:own, cliente_id:p._cli,
      nome:p.nome||"", cargo:p.cargo||"", email:p.email||"",
      whatsapp:p.whatsapp||"", celular:p.celular||"", telefone:p.telefone||""
    }));
    if(dPes.gravar.length) ops.push(sb.from("pessoas").upsert(dPes.gravar));
    if(dPes.apagar.length) ops.push(sb.from("pessoas").delete().in("id", dPes.apagar));

    /* atividades */
    const atA = achatar(antes.cards, (c,o) => (c.agendamentos||[]).forEach(a => o.push({ ...a, _neg:c.id })));
    const atB = achatar(agora.cards, (c,o) => (c.agendamentos||[]).forEach(a => o.push({ ...a, _neg:c.id })));
    const dAt = diferenca(atA, atB, a => ({
      id:a.id, owner_id:own, negocio_id:a._neg,
      tipo:a.tipo || "nota", prazo: horaOuNulo(a.data),
      nota:a.nota||"", concluido:!!a.concluido,
      criado_em: horaOuNulo(a.criadoEm) || new Date().toISOString()
    }));
    if(dAt.gravar.length) ops.push(sb.from("atividades").upsert(dAt.gravar));
    if(dAt.apagar.length) ops.push(sb.from("atividades").delete().in("id", dAt.apagar));

    /* pedidos */
    const pdA = achatar(antes.cards, (c,o) => (c.pedidos||[]).forEach(p => o.push({ ...p, _neg:c.id })));
    const pdB = achatar(agora.cards, (c,o) => (c.pedidos||[]).forEach(p => o.push({ ...p, _neg:c.id })));
    const dPd = diferenca(pdA, pdB, p => ({
      id:p.id, owner_id:own, negocio_id:p._neg,
      numero:p.numero || 1, data: dataOuNulo(p.data),
      forma_pagamento:p.formaPagamento||"", comissao_pct:Number(p.comissaoPct)||0,
      atual: !!p.atual,
      criado_em: horaOuNulo(p.criadoEm) || new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }));
    // apagar antes de gravar: o banco só aceita um pedido "atual" por negócio
    if(dPd.apagar.length) ops.push(sb.from("pedidos").delete().in("id", dPd.apagar));

    /* itens do pedido */
    const itA = achatar(antes.cards, (c,o) => (c.pedidos||[]).forEach(p => (p.itens||[]).forEach((i,ix) => o.push({ ...i, _ped:p.id, _ix:ix }))));
    const itB = achatar(agora.cards, (c,o) => (c.pedidos||[]).forEach(p => (p.itens||[]).forEach((i,ix) => o.push({ ...i, _ped:p.id, _ix:ix }))));
    const dIt = diferenca(itA, itB, i => ({
      id:i.id, owner_id:own, pedido_id:i._ped,
      produto:i.produto||"", quantidade:Number(i.quantidade)||0,
      preco:Number(i.preco)||0, posicao:i._ix
    }));

    /* comentários (de atividade e de pedido) */
    const comA = [], comB = [];
    const juntarCom = (cards, alvo) => (cards||[]).forEach(c => {
      (c.agendamentos||[]).forEach(a => (a.comentarios||[]).forEach(k => alvo.push({ ...k, _ativ:a.id, _ped:null })));
      (c.pedidos||[]).forEach(p => (p.comentarios||[]).forEach(k => alvo.push({ ...k, _ativ:null, _ped:p.id })));
    });
    juntarCom(antes.cards, comA);
    juntarCom(agora.cards, comB);
    const dCom = diferenca(comA, comB, k => ({
      id:k.id, owner_id:own, atividade_id:k._ativ, pedido_id:k._ped,
      texto:k.texto || "", criado_em: horaOuNulo(k.criadoEm) || new Date().toISOString()
    }));

    /* opções novas (categorias, produtos...) */
    const opNovas = [];
    const mapaOp = { categorias:"categoria", origens:"origem", setores:"setor", produtos:"produto" };
    Object.entries(mapaOp).forEach(([chave, tipo]) => {
      const velhas = new Set(((antes.listas||{})[chave]) || []);
      (((agora.listas||{})[chave]) || []).forEach(v => {
        if(v && !velhas.has(v)) opNovas.push({ owner_id:own, tipo, valor:v });
      });
    });

    /* ---- executa na ordem certa (pais antes dos filhos) ---- */
    for(const op of ops){ const { error } = await op; if(error) throw error; }

    if(dPd.gravar.length){
      const { error } = await sb.from("pedidos").upsert(dPd.gravar);
      if(error) throw error;
    }
    if(dIt.apagar.length){
      const { error } = await sb.from("pedido_itens").delete().in("id", dIt.apagar);
      if(error) throw error;
    }
    if(dIt.gravar.length){
      const { error } = await sb.from("pedido_itens").upsert(dIt.gravar);
      if(error) throw error;
    }
    if(dCom.apagar.length){
      const { error } = await sb.from("comentarios").delete().in("id", dCom.apagar);
      if(error) throw error;
    }
    if(dCom.gravar.length){
      const { error } = await sb.from("comentarios").upsert(dCom.gravar);
      if(error) throw error;
    }
    if(opNovas.length){
      await sb.from("opcoes").upsert(opNovas, { onConflict:"owner_id,tipo,valor", ignoreDuplicates:true });
    }
    // negócios e clientes excluídos: por último, para não derrubar filhos antes
    if(dNeg.apagar.length){
      const { error } = await sb.from("negocios").delete().in("id", dNeg.apagar);
      if(error) throw error;
      await sb.from("clientes").delete().in("id",
        (antes.cards||[]).filter(c => dNeg.apagar.includes(c.id)).map(c => c.clienteId || c.id));
    }
    if(dEt.apagar.length){
      const { error } = await sb.from("etapas").delete().in("id", dEt.apagar);
      if(error) throw error;
    }

    fotoAnterior = agora;
    marcarSalvo(true);
  }catch(e){
    marcarSalvo(false);
    erroBanco(e, "sincronizar");
  }finally{
    sincronizando = false;
    if(novaSincPendente){ novaSincPendente = false; setTimeout(sincronizar, 200); }
  }
}

/* ---------------- indicador "salvando / salvo" ---------------- */
function marcarSalvo(ok){
  const chip = document.getElementById("syncChip");
  if(!chip) return;
  chip.className = "sync-chip " + (ok ? "ok" : "erro");
  chip.innerHTML = ok
    ? `<i class="dot"></i><span>Salvo na nuvem</span>`
    : `<i class="dot"></i><span>Erro ao salvar</span>`;
}
function marcarSalvando(){
  const chip = document.getElementById("syncChip");
  if(!chip) return;
  chip.className = "sync-chip salvando";
  chip.innerHTML = `<i class="dot"></i><span>Salvando...</span>`;
}
