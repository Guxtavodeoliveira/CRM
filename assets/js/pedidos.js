/* =========================================================
   pedidos.js — aba PEDIDOS do negócio.

   Regra principal: só existe UM pedido atual. Ao lançar um novo,
   o que era atual desce para o histórico automaticamente.
   ========================================================= */

let pedidoOrdem = "data_desc";                 // ordenação do histórico
const pedidosAbertos = new Set();              // ids com os itens expandidos
const pedidoComentAbertos = new Set();         // ids com a thread aberta
let pedidoEditandoId = null;                   // null = criando um novo
let pedidoItensTmp = [];                       // itens dentro do modal

const ORDENS_PEDIDO = {
  data_desc:  { label:"Data (mais novo primeiro)", fn:(a,b) => (b.data||"").localeCompare(a.data||"") },
  data_asc:   { label:"Data (mais antigo primeiro)", fn:(a,b) => (a.data||"").localeCompare(b.data||"") },
  numero_desc:{ label:"Nº do pedido (maior primeiro)", fn:(a,b) => b.numero - a.numero },
  numero_asc: { label:"Nº do pedido (menor primeiro)", fn:(a,b) => a.numero - b.numero },
  valor_desc: { label:"Valor (maior primeiro)", fn:(a,b) => totalPedido(b) - totalPedido(a) },
  valor_asc:  { label:"Valor (menor primeiro)", fn:(a,b) => totalPedido(a) - totalPedido(b) },
  comis_desc: { label:"Comissão (maior primeiro)", fn:(a,b) => comissaoPedido(b) - comissaoPedido(a) }
};

/* ---------------- cálculos ---------------- */
function subtotalItem(it){
  return (Number(it.quantidade) || 0) * (Number(it.preco) || 0);
}
function totalPedido(p){
  return (p.itens || []).reduce((s,it) => s + subtotalItem(it), 0);
}
/** Comissão em reais = total do pedido x percentual. */
function comissaoPedido(p){
  return totalPedido(p) * ((Number(p.comissaoPct) || 0) / 100);
}
/** Aceita "5", "5,5", "5%" e devolve número. */
function parsePct(v){
  const n = parseFloat(String(v == null ? "" : v).replace("%","").replace(",","."));
  return isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
}
function fmtPct(n){
  const v = Number(n) || 0;
  return (Number.isInteger(v) ? v : v.toFixed(2).replace(".", ",")) + "%";
}
function pedidoAtual(card){
  return (card.pedidos || []).find(p => p.atual) || null;
}
function pedidosHistorico(card){
  return (card.pedidos || []).filter(p => !p.atual);
}

/* =========================================================
   Aba PEDIDOS dentro do modal do negócio
   ========================================================= */
function abaPedidos(card){
  const atual = pedidoAtual(card);
  const hist = pedidosHistorico(card).sort(ORDENS_PEDIDO[pedidoOrdem].fn);

  const somaHist = hist.reduce((s,p) => s + totalPedido(p), 0);
  const comisHist = hist.reduce((s,p) => s + comissaoPedido(p), 0);
  const todos = card.pedidos || [];
  const somaTudo = todos.reduce((s,p) => s + totalPedido(p), 0);
  const comisTudo = todos.reduce((s,p) => s + comissaoPedido(p), 0);

  return `
  ${todos.length ? `
  <div class="ped-resumo-geral">
    <div><span>Pedidos deste cliente</span><b>${todos.length}</b></div>
    <div><span>Total fechado</span><b>${moeda(somaTudo)}</b></div>
    <div class="destaque"><span>Comissão gerada</span><b>${moeda(comisTudo)}</b></div>
  </div>` : ""}

  <div class="ped-topo">
    <div>
      <div class="ped-secao">Pedido atual</div>
      <div class="ped-sub">O último pedido lançado. Ao lançar outro, este desce para o histórico.</div>
    </div>
    <button class="btn btn-primary btn-sm" id="pedNovo">${icon("plus",13,2.6)} Novo pedido</button>
  </div>

  ${atual ? pedidoCard(atual, true)
    : `<div class="empty-state">Nenhum pedido lançado ainda.<br>Use <b>Novo pedido</b> para registrar o primeiro.</div>`}

  <div class="ped-topo" style="margin-top:22px">
    <div>
      <div class="ped-secao">Histórico de pedidos ${hist.length ? `<span class="ag-cont">${hist.length}</span>` : ""}</div>
      ${hist.length ? `<div class="ped-sub">Histórico: <b>${moeda(somaHist)}</b> em pedidos · <b>${moeda(comisHist)}</b> de comissão</div>` : ""}
    </div>
    ${hist.length > 1 ? `
      <div class="select-wrap" style="min-width:210px">
        <select class="inp" id="pedOrdem">
          ${Object.entries(ORDENS_PEDIDO).map(([k,v]) =>
            `<option value="${k}" ${k === pedidoOrdem ? "selected" : ""}>${esc(v.label)}</option>`).join("")}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>` : ""}
  </div>

  ${hist.length ? hist.map(p => pedidoCard(p, false)).join("")
    : `<div class="empty-state">Ainda não há pedidos anteriores.</div>`}
  `;
}

function pedidoCard(p, ehAtual){
  const aberto = ehAtual || pedidosAbertos.has(p.id);
  const qtdCom = (p.comentarios || []).length;
  const itens = p.itens || [];
  const pecas = itens.reduce((s,it) => s + (Number(it.quantidade) || 0), 0);

  return `
  <div class="ped ${ehAtual ? "atual" : ""}">
    <div class="ped-head" data-pedtoggle="${p.id}">
      <div class="ped-id">
        ${ehAtual ? `<span class="ped-flag">ATUAL</span>` : ""}
        <b>Pedido #${p.numero}</b>
        <span class="ped-data">${icon("clock",12,2.2)} ${esc(fmtData(p.data) || "sem data")}</span>
      </div>
      <div class="ped-resumo">
        <span>${itens.length} ${itens.length === 1 ? "item" : "itens"} · ${pecas.toLocaleString("pt-BR")} un.</span>
        <b class="ped-total">${moeda(totalPedido(p))}</b>
        ${p.comissaoPct ? `<span class="ped-comis">${esc(fmtPct(p.comissaoPct))} = <b>${moeda(comissaoPedido(p))}</b></span>` : ""}
        ${!ehAtual ? `<span class="ped-chev ${aberto ? "on" : ""}">${icon("dots",14,2.4)}</span>` : ""}
      </div>
    </div>

    ${aberto ? `
    <div class="ped-corpo">
      ${itens.length ? `
      <table class="ped-tab">
        <thead>
          <tr><th>Produto</th><th class="num">Qtd</th><th class="num">Preço unit.</th><th class="num">Subtotal</th></tr>
        </thead>
        <tbody>
          ${itens.map(it => `
            <tr>
              <td>${esc(it.produto || "—")}</td>
              <td class="num">${(Number(it.quantidade)||0).toLocaleString("pt-BR")}</td>
              <td class="num">${moeda(it.preco)}</td>
              <td class="num forte">${moeda(subtotalItem(it))}</td>
            </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr><td colspan="3" class="num">Total do pedido</td><td class="num total">${moeda(totalPedido(p))}</td></tr>
          <tr class="linha-comis">
            <td colspan="3" class="num">Total comissão ${p.comissaoPct ? `(${esc(fmtPct(p.comissaoPct))})` : "— sem % definida"}</td>
            <td class="num total comis">${moeda(comissaoPedido(p))}</td>
          </tr>
        </tfoot>
      </table>` : `<div class="muted" style="font-size:12.5px">Pedido sem itens.</div>`}

      <div class="ped-pgto">
        <span class="k">Forma de pagamento</span>
        <span class="v">${p.formaPagamento ? esc(p.formaPagamento) : '<span class="muted">não informada</span>'}</span>
      </div>

      <div class="ped-foot">
        <span class="g">Lançado por <span class="avatar">${esc(iniciais(p.criadoPor || dados.usuario))}</span></span>
        <span class="g">${esc(fmtLongo(p.criadoEm))}</span>
        <button class="cm ${pedidoComentAbertos.has(p.id) ? "on" : ""}" data-pedcoment="${p.id}">
          ${icon("chat",13,2)} Comentários${qtdCom ? ` (${qtdCom})` : ""}
        </button>
        <button class="cm" data-pededit="${p.id}">${icon("edit",13,2)} Editar</button>
        <button class="rm" data-peddel="${p.id}">Excluir</button>
      </div>

      ${pedidoThread(p)}
    </div>` : ""}
  </div>`;
}

function pedidoThread(p){
  if(!pedidoComentAbertos.has(p.id)) return "";
  const lista = p.comentarios || [];
  return `
  <div class="thread" style="padding-left:12px">
    ${lista.length ? lista.map(k => `
      <div class="coment">
        <span class="avatar">${esc(iniciais(k.autor))}</span>
        <div class="coment-corpo">
          <div class="coment-topo">
            <b>${esc(k.autor)}</b>
            <span>${esc(fmtCriada(k.criadoEm).replace("Criada ",""))}</span>
            <button class="coment-rm" data-rmpedcom="${p.id}|${k.id}" title="Excluir comentário">${icon("x",12,2.4)}</button>
          </div>
          <div class="coment-txt">${esc(k.texto)}</div>
        </div>
      </div>`).join("")
      : `<div class="thread-vazio">Nenhum comentário neste pedido.</div>`}
    <div class="coment-novo">
      <textarea class="inp" data-novopedcom="${p.id}" rows="2"
        placeholder="Prazo de entrega, combinação de frete, o que o cliente pediu de diferente..."></textarea>
      <button class="btn btn-primary btn-sm" data-addpedcom="${p.id}">${icon("plus",13,2.6)} Comentar</button>
    </div>
  </div>`;
}

/* ---------------- eventos da aba ---------------- */
function ligarPedidos(card){
  const box = document.getElementById("dealContent");
  if(!box) return;

  const nv = box.querySelector("#pedNovo");
  if(nv) nv.onclick = () => abrirPedidoModal(card, null);

  const ord = box.querySelector("#pedOrdem");
  if(ord) ord.onchange = () => { pedidoOrdem = ord.value; renderNegocio(); };

  box.querySelectorAll("[data-pedtoggle]").forEach(h => {
    h.onclick = e => {
      if(e.target.closest("button")) return;
      const id = h.dataset.pedtoggle;
      const p = (card.pedidos || []).find(x => x.id === id);
      if(p && p.atual) return;                       // o atual fica sempre aberto
      if(pedidosAbertos.has(id)) pedidosAbertos.delete(id);
      else pedidosAbertos.add(id);
      renderNegocio();
    };
  });

  box.querySelectorAll("[data-pededit]").forEach(b => {
    b.onclick = () => abrirPedidoModal(card, b.dataset.pededit);
  });

  box.querySelectorAll("[data-peddel]").forEach(b => {
    b.onclick = async () => {
      const p = (card.pedidos || []).find(x => x.id === b.dataset.peddel);
      if(!p) return;
      const ok = await confirmar(
        `Excluir o pedido #${p.numero} (${moeda(totalPedido(p))}) e os comentários dele?`,
        { titulo:"Excluir pedido", ok:"Excluir", perigo:true });
      if(!ok) return;
      const eraAtual = p.atual;
      card.pedidos = card.pedidos.filter(x => x.id !== p.id);
      // se o atual foi excluído, o mais recente do histórico volta a ser o atual
      if(eraAtual && card.pedidos.length){
        const novo = [...card.pedidos].sort((a,b) => b.numero - a.numero)[0];
        novo.atual = true;
      }
      card.atualizadoEm = new Date().toISOString();
      salvar(); renderNegocio(); render();
      toast("Pedido excluído.");
    };
  });

  // comentários do pedido
  box.querySelectorAll("[data-pedcoment]").forEach(b => {
    b.onclick = () => {
      const id = b.dataset.pedcoment;
      if(pedidoComentAbertos.has(id)) pedidoComentAbertos.delete(id);
      else pedidoComentAbertos.add(id);
      renderNegocio();
    };
  });
  box.querySelectorAll("[data-addpedcom]").forEach(b => {
    b.onclick = () => adicionarComentarioPedido(card, b.dataset.addpedcom);
  });
  box.querySelectorAll("[data-novopedcom]").forEach(ta => {
    ta.onkeydown = e => {
      if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
        e.preventDefault();
        adicionarComentarioPedido(card, ta.dataset.novopedcom);
      }
    };
  });
  box.querySelectorAll("[data-rmpedcom]").forEach(b => {
    b.onclick = async () => {
      const [idPed, idCom] = b.dataset.rmpedcom.split("|");
      if(!(await confirmar("Excluir este comentário?", { titulo:"Excluir comentário", ok:"Excluir", perigo:true }))) return;
      const p = (card.pedidos || []).find(x => x.id === idPed);
      if(p){
        p.comentarios = (p.comentarios || []).filter(k => k.id !== idCom);
        card.atualizadoEm = new Date().toISOString();
        salvar(); renderNegocio();
      }
    };
  });
}

function adicionarComentarioPedido(card, idPed){
  const ta = document.querySelector(`[data-novopedcom="${idPed}"]`);
  const texto = ta ? ta.value.trim() : "";
  if(!texto){ toast("Escreva o comentário antes de salvar.", "err"); return; }
  const p = (card.pedidos || []).find(x => x.id === idPed);
  if(!p) return;
  p.comentarios = p.comentarios || [];
  p.comentarios.push({
    id: uid(), texto,
    autor: card.responsavel || dados.usuario,
    criadoEm: new Date().toISOString()
  });
  card.atualizadoEm = new Date().toISOString();
  pedidoComentAbertos.add(idPed);
  salvar(); renderNegocio();
  toast("Comentário adicionado ao pedido.");
}

/* =========================================================
   Modal de lançamento / edição do pedido
   ========================================================= */
function abrirPedidoModal(card, pedidoId){
  pedidoEditandoId = pedidoId || null;
  const p = pedidoId ? (card.pedidos || []).find(x => x.id === pedidoId) : null;

  document.getElementById("pedTitulo").textContent = p ? `Editar pedido #${p.numero}` : "Novo pedido";
  document.getElementById("pedSub").textContent = `${card.numero} · ${card.nome}`;
  document.getElementById("ped_data").value = p ? (p.data || "").slice(0,10)
    : new Date().toISOString().slice(0,10);
  document.getElementById("ped_pgto").value = p ? (p.formaPagamento || "") : "";
  document.getElementById("ped_comis").value = p && p.comissaoPct ? String(p.comissaoPct).replace(".", ",") : "";

  pedidoItensTmp = p && (p.itens || []).length
    ? JSON.parse(JSON.stringify(p.itens))
    : [{ id: uid(), produto:"", quantidade:1, preco:0 }];

  // sugestões de produto: os do cliente + os já usados na conta
  const sugestoes = [...new Set([...(card.produtos || []), ...(dados.listas.produtos || [])])];
  document.getElementById("dl_pedprod").innerHTML =
    sugestoes.map(v => `<option value="${esc(v)}"></option>`).join("");

  renderItensPedido();
  document.getElementById("pedidoOverlay").classList.add("show");
  setTimeout(() => {
    const primeiro = document.querySelector('[data-it="0"][data-k="produto"]');
    if(primeiro) primeiro.focus();
  }, 80);
}

function fecharPedidoModal(){
  document.getElementById("pedidoOverlay").classList.remove("show");
  pedidoEditandoId = null;
  pedidoItensTmp = [];
}

function renderItensPedido(){
  const box = document.getElementById("pedItens");
  box.innerHTML = pedidoItensTmp.map((it,i) => `
    <div class="it-linha">
      <div class="field">
        ${i === 0 ? "<label>Produto</label>" : ""}
        <input class="inp" list="dl_pedprod" data-it="${i}" data-k="produto"
               value="${esc(it.produto)}" placeholder="Nome do produto fechado">
      </div>
      <div class="field it-qtd">
        ${i === 0 ? "<label>Qtd</label>" : ""}
        <input class="inp num" type="number" min="0" step="any" data-it="${i}" data-k="quantidade"
               value="${it.quantidade}" placeholder="0">
      </div>
      <div class="field it-preco">
        ${i === 0 ? "<label>Preço unit.</label>" : ""}
        <input class="inp num" data-it="${i}" data-k="preco"
               value="${it.preco ? moeda(it.preco) : ""}" placeholder="R$ 0,00" inputmode="decimal">
      </div>
      <div class="field it-sub">
        ${i === 0 ? "<label>Subtotal</label>" : ""}
        <div class="it-subvalor" data-sub="${i}">${moeda(subtotalItem(it))}</div>
      </div>
      <button class="icon-btn it-rm" data-rmit="${i}" title="Remover item"
        ${pedidoItensTmp.length === 1 ? "disabled style=\"opacity:.3\"" : ""}>${icon("trash",14,2)}</button>
    </div>`).join("");

  // digitação nos campos
  box.querySelectorAll("[data-it]").forEach(inp => {
    const i = Number(inp.dataset.it), k = inp.dataset.k;
    inp.oninput = () => {
      pedidoItensTmp[i][k] = k === "produto" ? inp.value
        : k === "quantidade" ? (Number(inp.value) || 0)
        : parseMoeda(inp.value);
      atualizarTotais();
    };
    if(k === "preco"){
      inp.onblur = () => {
        const v = parseMoeda(inp.value);
        pedidoItensTmp[i].preco = v;
        inp.value = v ? moeda(v) : "";
        atualizarTotais();
      };
    }
    // Enter no último campo cria a próxima linha
    inp.onkeydown = e => {
      if(e.key === "Enter"){ e.preventDefault(); addItemPedido(); }
    };
  });

  box.querySelectorAll("[data-rmit]").forEach(b => {
    b.onclick = () => {
      if(pedidoItensTmp.length === 1) return;
      pedidoItensTmp.splice(Number(b.dataset.rmit), 1);
      renderItensPedido();
    };
  });

  atualizarTotais();
}

function atualizarTotais(){
  pedidoItensTmp.forEach((it,i) => {
    const el = document.querySelector(`[data-sub="${i}"]`);
    if(el) el.textContent = moeda(subtotalItem(it));
  });
  const total = pedidoItensTmp.reduce((s,it) => s + subtotalItem(it), 0);
  const pecas = pedidoItensTmp.reduce((s,it) => s + (Number(it.quantidade) || 0), 0);
  const pct = parsePct(document.getElementById("ped_comis").value);
  document.getElementById("pedTotal").textContent = moeda(total);
  document.getElementById("pedComisVal").textContent = moeda(total * pct / 100);
  document.getElementById("pedComisLbl").textContent =
    pct ? `Total comissão (${fmtPct(pct)})` : "Total comissão";
  document.getElementById("pedPecas").textContent =
    `${pedidoItensTmp.length} ${pedidoItensTmp.length === 1 ? "item" : "itens"} · ${pecas.toLocaleString("pt-BR")} un.`;
}

function addItemPedido(){
  pedidoItensTmp.push({ id: uid(), produto:"", quantidade:1, preco:0 });
  renderItensPedido();
  const inputs = document.querySelectorAll('[data-k="produto"]');
  if(inputs.length) inputs[inputs.length-1].focus();
}

function salvarPedido(){
  const card = cardAtual();
  if(!card) return;

  const itens = pedidoItensTmp
    .filter(it => (it.produto || "").trim() || Number(it.quantidade) || Number(it.preco))
    .map(it => ({
      id: it.id || uid(),
      produto: (it.produto || "").trim(),
      quantidade: Number(it.quantidade) || 0,
      preco: Number(it.preco) || 0
    }));

  if(!itens.length){ toast("Adicione pelo menos um item ao pedido.", "err"); return; }
  if(itens.some(it => !it.produto)){ toast("Todo item precisa do nome do produto.", "err"); return; }

  const data = document.getElementById("ped_data").value;
  const pgto = document.getElementById("ped_pgto").value.trim();
  const pct = parsePct(document.getElementById("ped_comis").value);

  card.pedidos = card.pedidos || [];

  if(pedidoEditandoId){
    const p = card.pedidos.find(x => x.id === pedidoEditandoId);
    if(p){
      p.itens = itens;
      p.data = data;
      p.formaPagamento = pgto;
      p.comissaoPct = pct;
      p.atualizadoEm = new Date().toISOString();
    }
    toast("Pedido atualizado.");
  } else {
    // o que era atual desce para o histórico
    card.pedidos.forEach(p => { p.atual = false; });
    const numero = card.pedidos.reduce((m,p) => Math.max(m, p.numero || 0), 0) + 1;
    card.pedidos.push({
      id: uid(), numero, data,
      itens, formaPagamento: pgto, comissaoPct: pct,
      atual: true, comentarios: [],
      criadoEm: new Date().toISOString(),
      criadoPor: card.responsavel || dados.usuario,
      atualizadoEm: new Date().toISOString()
    });
    toast(card.pedidos.length > 1
      ? `Pedido #${numero} lançado. O anterior foi para o histórico.`
      : `Pedido #${numero} lançado.`);
  }

  // guarda os produtos novos para sugerir depois
  itens.forEach(it => {
    if(it.produto && !dados.listas.produtos.includes(it.produto)) dados.listas.produtos.push(it.produto);
  });

  card.atualizadoEm = new Date().toISOString();
  salvar();
  fecharPedidoModal();
  histAba = "pedidos";
  renderNegocio();
  render();
}

/* ---------------- ligações fixas do modal ---------------- */
function ligarPedidoModal(){
  document.getElementById("pedFechar").onclick = fecharPedidoModal;
  document.getElementById("pedCancelar").onclick = fecharPedidoModal;
  document.getElementById("pedSalvar").onclick = salvarPedido;
  document.getElementById("pedAddItem").onclick = addItemPedido;
  document.getElementById("ped_comis").addEventListener("input", atualizarTotais);
  document.getElementById("pedidoOverlay").addEventListener("click", e => {
    if(e.target.id === "pedidoOverlay") fecharPedidoModal();
  });
}
