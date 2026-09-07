/* =========================================================
   relatorios.js — relatórios do funil.
   Primeiro: vendas e comissões por período, agrupado por cliente,
   com impressão / salvar em PDF pelo próprio navegador.
   ========================================================= */

let relDe = "", relAte = "";
let relAgrupado = true;

/* ---------------- menu ---------------- */
function ligarRelatorios(){
  const btn = document.getElementById("relBtn");
  const menu = document.getElementById("relMenu");

  btn.onclick = e => {
    e.stopPropagation();
    const aberto = menu.classList.toggle("show");
    btn.setAttribute("aria-expanded", aberto ? "true" : "false");
  };
  document.addEventListener("click", () => {
    menu.classList.remove("show");
    btn.setAttribute("aria-expanded", "false");
  });
  menu.onclick = e => e.stopPropagation();

  menu.querySelectorAll("[data-rel]").forEach(b => {
    b.onclick = () => {
      menu.classList.remove("show");
      if(b.dataset.rel === "vendas") abrirRelVendas();
      if(b.dataset.rel === "clientes") abrirRelClientes();
      if(b.dataset.rel === "produtos") abrirRelProdutos();
    };
  });

  document.getElementById("relOverlay").addEventListener("click", e => {
    if(e.target.id === "relOverlay") fecharRelatorio();
  });
}

function fecharRelatorio(){
  document.getElementById("relOverlay").classList.remove("show");
}

/* ---------------- períodos rápidos ---------------- */
function iso(d){
  const p = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
const PERIODOS = {
  mes:      { label:"Este mês",       fn:() => { const h=new Date(); return [iso(new Date(h.getFullYear(),h.getMonth(),1)), iso(new Date(h.getFullYear(),h.getMonth()+1,0))]; } },
  mes_ant:  { label:"Mês passado",    fn:() => { const h=new Date(); return [iso(new Date(h.getFullYear(),h.getMonth()-1,1)), iso(new Date(h.getFullYear(),h.getMonth(),0))]; } },
  d30:      { label:"Últimos 30 dias",fn:() => { const h=new Date(); const a=new Date(h); a.setDate(a.getDate()-29); return [iso(a), iso(h)]; } },
  d90:      { label:"Últimos 90 dias",fn:() => { const h=new Date(); const a=new Date(h); a.setDate(a.getDate()-89); return [iso(a), iso(h)]; } },
  ano:      { label:"Este ano",       fn:() => { const h=new Date(); return [iso(new Date(h.getFullYear(),0,1)), iso(new Date(h.getFullYear(),11,31))]; } },
  tudo:     { label:"Tudo",           fn:() => ["", ""] }
};

/* ---------------- coleta dos dados ---------------- */
/** Todos os pedidos (atual + histórico) de todos os clientes, no período. */
function pedidosNoPeriodo(de, ate){
  const linhas = [];
  dados.cards.forEach(card => {
    (card.pedidos || []).forEach(p => {
      const data = (p.data || (p.criadoEm || "").slice(0,10) || "").slice(0,10);
      if(de && data < de) return;
      if(ate && data > ate) return;
      const total = totalPedido(p);
      linhas.push({
        card, pedido: p, data,
        cliente: card.nome,
        cidade: [card.cidade, card.estado].filter(Boolean).join("/"),
        total,
        pct: Number(p.comissaoPct) || 0,
        comissao: comissaoPedido(p),
        itens: (p.itens || []).length,
        pagamento: p.formaPagamento || ""
      });
    });
  });
  return linhas.sort((a,b) => (a.data || "").localeCompare(b.data || "")
                              || a.cliente.localeCompare(b.cliente));
}

function agruparPorCliente(linhas){
  const mapa = new Map();
  linhas.forEach(l => {
    if(!mapa.has(l.cliente)) mapa.set(l.cliente, { cliente:l.cliente, cidade:l.cidade, linhas:[], total:0, comissao:0 });
    const g = mapa.get(l.cliente);
    g.linhas.push(l);
    g.total += l.total;
    g.comissao += l.comissao;
  });
  return [...mapa.values()].sort((a,b) => b.total - a.total);
}

/* ---------------- tela ---------------- */
function abrirRelVendas(){
  if(!relDe && !relAte){
    const [a,b] = PERIODOS.mes.fn();
    relDe = a; relAte = b;
  }
  renderRelVendas();
  document.getElementById("relOverlay").classList.add("show");
}

function renderRelVendas(){
  const linhas = pedidosNoPeriodo(relDe, relAte);
  const grupos = agruparPorCliente(linhas);
  const total = linhas.reduce((s,l) => s + l.total, 0);
  const comis = linhas.reduce((s,l) => s + l.comissao, 0);
  const semPct = linhas.filter(l => !l.pct).length;

  const periodoTxt = (relDe || relAte)
    ? `${relDe ? fmtData(relDe) : "início"} a ${relAte ? fmtData(relAte) : "hoje"}`
    : "todo o histórico";

  document.getElementById("relContent").innerHTML = `
    <div class="modal-head">
      <div class="avatar-sq">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <h2>Vendas e comissões</h2>
        <div class="sub">${esc(periodoTxt)} · ${linhas.length} pedido(s) · ${grupos.length} cliente(s)</div>
      </div>
      <button class="icon-btn lg" id="relFechar" aria-label="Fechar">${icon("x",17,2.2)}</button>
    </div>

    <div class="rel-filtros">
      <div class="seg" id="relPeriodos">
        ${Object.entries(PERIODOS).map(([k,v]) =>
          `<button data-per="${k}">${esc(v.label)}</button>`).join("")}
      </div>
      <div class="rel-datas">
        <label>De <input type="date" class="inp" id="relDe" value="${relDe}"></label>
        <label>Até <input type="date" class="inp" id="relAte" value="${relAte}"></label>
      </div>
      <label class="check"><input type="checkbox" id="relAgrup" ${relAgrupado ? "checked" : ""}> Agrupar por cliente</label>
    </div>

    <div class="modal-body" id="relBody">
      <div id="relFolha" class="folha">
        ${cabecalhoFolha(periodoTxt, linhas.length, grupos.length)}

        <div class="rel-cards">
          <div><span>Total de vendas</span><b>${moeda(total)}</b></div>
          <div class="destaque"><span>Total de comissões</span><b>${moeda(comis)}</b></div>
          <div><span>Ticket médio</span><b>${moeda(linhas.length ? total/linhas.length : 0)}</b></div>
        </div>

        ${semPct ? `<div class="rel-aviso">${semPct} pedido(s) sem percentual de comissão definido — entram como R$ 0,00 na coluna de comissão.</div>` : ""}

        ${linhas.length
          ? (relAgrupado ? tabelaAgrupada(grupos, total, comis) : tabelaSimples(linhas, total, comis))
          : `<div class="empty-state">Nenhum pedido nesse período.</div>`}

        <div class="rel-rodape">
          Emitido em ${esc(fmtLongo(new Date().toISOString()))} · ${esc(dados.boardName || "")}
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <span class="left muted" style="font-size:12.5px">Em “Imprimir”, escolha <b>Salvar como PDF</b> no destino.</span>
      <button class="btn" id="relXlsx">${icon("save",14,2)} Excel</button>
      <button class="btn btn-primary" id="relPrint">${icon("doc",14,2)} Imprimir / Salvar PDF</button>
    </div>
  `;
  ligarRelVendas();
}

function cabecalhoFolha(periodoTxt, qtdPed, qtdCli){
  return `
  <div class="folha-topo">
    <img src="img/logo.svg" alt="Gustavo de Oliveira" class="folha-logo">
    <div class="folha-info">
      <h3>Relatório de vendas e comissões</h3>
      <div>Período: <b>${esc(periodoTxt)}</b></div>
      <div>${qtdPed} pedido(s) · ${qtdCli} cliente(s) · Funil: ${esc(dados.boardName || "")}</div>
    </div>
  </div>`;
}

function linhaTabela(l){
  return `
  <tr>
    <td>${esc(fmtData(l.data) || "—")}</td>
    <td>#${l.pedido.numero}</td>
    <td>${esc(l.pagamento || "—")}</td>
    <td class="num">${moeda(l.total)}</td>
    <td class="num">${l.pct ? esc(fmtPct(l.pct)) : "—"}</td>
    <td class="num comis">${moeda(l.comissao)}</td>
  </tr>`;
}

function tabelaAgrupada(grupos, total, comis){
  return grupos.map(g => `
    <div class="rel-grupo">
      <div class="rel-grupo-head">
        <div>
          <b>${esc(g.cliente)}</b>
          ${g.cidade ? `<span class="tag">${esc(g.cidade)}</span>` : ""}
        </div>
        <div class="rel-grupo-tot">
          <span>${g.linhas.length} pedido(s)</span>
          <b>${moeda(g.total)}</b>
          <b class="comis">${moeda(g.comissao)}</b>
        </div>
      </div>
      <table class="rel-tab">
        <thead><tr><th>Data</th><th>Pedido</th><th>Pagamento</th><th class="num">Venda</th><th class="num">%</th><th class="num">Comissão</th></tr></thead>
        <tbody>${g.linhas.map(linhaTabela).join("")}</tbody>
      </table>
    </div>`).join("") + rodapeTotais(total, comis);
}

function tabelaSimples(linhas, total, comis){
  return `
  <table class="rel-tab solta">
    <thead><tr><th>Data</th><th>Cliente</th><th>Pedido</th><th>Pagamento</th><th class="num">Venda</th><th class="num">%</th><th class="num">Comissão</th></tr></thead>
    <tbody>
      ${linhas.map(l => `
        <tr>
          <td>${esc(fmtData(l.data) || "—")}</td>
          <td><b>${esc(l.cliente)}</b></td>
          <td>#${l.pedido.numero}</td>
          <td>${esc(l.pagamento || "—")}</td>
          <td class="num">${moeda(l.total)}</td>
          <td class="num">${l.pct ? esc(fmtPct(l.pct)) : "—"}</td>
          <td class="num comis">${moeda(l.comissao)}</td>
        </tr>`).join("")}
    </tbody>
  </table>` + rodapeTotais(total, comis);
}

function rodapeTotais(total, comis){
  return `
  <div class="rel-totais">
    <div><span>Total de vendas no período</span><b>${moeda(total)}</b></div>
    <div class="comis"><span>Total de comissões</span><b>${moeda(comis)}</b></div>
  </div>`;
}

/* ---------------- eventos ---------------- */
function ligarRelVendas(){
  const box = document.getElementById("relContent");
  box.querySelector("#relFechar").onclick = fecharRelatorio;

  box.querySelectorAll("[data-per]").forEach(b => {
    b.onclick = () => {
      const [a,c] = PERIODOS[b.dataset.per].fn();
      relDe = a; relAte = c;
      renderRelVendas();
    };
  });
  box.querySelector("#relDe").onchange = e => { relDe = e.target.value; renderRelVendas(); };
  box.querySelector("#relAte").onchange = e => { relAte = e.target.value; renderRelVendas(); };
  box.querySelector("#relAgrup").onchange = e => { relAgrupado = e.target.checked; renderRelVendas(); };

  box.querySelector("#relPrint").onclick = () => imprimirFolha("relOverlay");

  box.querySelector("#relXlsx").onclick = exportarRelXlsx;
}

/* ---------------- impressão / PDF ---------------- */
/** Isola a folha indicada e abre a impressão do navegador. */
function imprimirFolha(idOverlay){
  const ov = document.getElementById(idOverlay);
  if(!ov) return;
  ov.classList.add("para-imprimir");
  document.body.classList.add("imprimindo");
  const limpar = () => {
    document.body.classList.remove("imprimindo");
    ov.classList.remove("para-imprimir");
    window.removeEventListener("afterprint", limpar);
  };
  window.addEventListener("afterprint", limpar);
  setTimeout(() => { window.print(); setTimeout(limpar, 1200); }, 60);
}

/* ---------------- Excel ---------------- */
function exportarRelXlsx(){
  const linhas = pedidosNoPeriodo(relDe, relAte);
  if(!linhas.length){ toast("Nenhum pedido no período.", "err"); return; }

  const cab = ["Data","Cliente","Cidade","Pedido","Forma de pagamento","Itens","Valor da venda","Comissão %","Valor da comissão"];
  const corpo = linhas.map(l => [
    l.data ? new Date(l.data + "T12:00:00") : "",
    l.cliente, l.cidade, l.pedido.numero, l.pagamento, l.itens,
    l.total, l.pct, l.comissao
  ]);
  corpo.push([]);
  corpo.push(["", "", "", "", "", "TOTAIS",
    linhas.reduce((s,l) => s + l.total, 0), "",
    linhas.reduce((s,l) => s + l.comissao, 0)]);

  const ws = montarAba(cab, corpo, {
    z: { 0:"dd/mm/yyyy", 6:"#,##0.00", 7:'0.00"%"', 8:"#,##0.00" },
    largura: [12,34,18,10,26,8,16,11,18]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vendas e comissões");
  XLSX.writeFile(wb, `vendas-comissoes-${relDe || "inicio"}_a_${relAte || "hoje"}.xlsx`);
  toast("Planilha gerada.");
}

/* =========================================================
   Relatório de clientes
   Filtros por etapa do funil, estado e cidade — todos começam
   em "todos". A cidade só oferece o que existe no estado
   escolhido, e a ordenação é escolhida pelo usuário.
   ========================================================= */

let relCliEtapa  = "todas";
let relCliUF     = "todos";
let relCliCidade = "todas";
let relCliOrdem  = "nome";

/* ---------------- apoio ---------------- */
/* chaveTexto() (comparar cidade sem acento) fica em util.js */

function nomeEtapa(columnId){
  const col = dados.columns.find(c => c.id === columnId);
  return col ? col.name : "—";
}

function posEtapa(columnId){
  const i = dados.columns.findIndex(c => c.id === columnId);
  return i < 0 ? 9999 : i;
}

/** Telefone de contato: usa o fixo e, na falta dele, celular ou WhatsApp. */
function telefoneCliente(card){
  return card.telefone || card.celular || card.whatsapp || "";
}

function cidadeUf(card){
  const cid = (card.cidade || "").trim();
  const uf  = (card.estado || "").trim();
  if(cid && uf) return cid + "/" + uf;
  return cid || uf || "";
}

/* ---------------- filtros ---------------- */
/** Base dos demais filtros: os clientes da etapa escolhida. */
function clientesDaEtapa(){
  return dados.cards.filter(c => relCliEtapa === "todas" || c.columnId === relCliEtapa);
}

/** Só os estados em que realmente existem clientes. */
function estadosDisponiveis(){
  const set = new Set();
  clientesDaEtapa().forEach(c => { if(c.estado) set.add(c.estado); });
  return [...set].sort();
}

/** Cidades do estado escolhido (ou de todos, quando não há estado). */
function cidadesDisponiveis(){
  const mapa = new Map();
  clientesDaEtapa().forEach(c => {
    if(!c.cidade) return;
    if(relCliUF !== "todos" && (c.estado || "") !== relCliUF) return;
    const k = chaveTexto(c.cidade);
    if(!mapa.has(k)) mapa.set(k, { chave:k, nome:c.cidade.trim(), uf:c.estado || "" });
  });
  return [...mapa.values()].sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function clientesFiltrados(){
  return clientesDaEtapa().filter(c => {
    if(relCliUF !== "todos" && (c.estado || "") !== relCliUF) return false;
    if(relCliCidade !== "todas" && chaveTexto(c.cidade) !== relCliCidade) return false;
    return true;
  });
}

/** Se a etapa mudou e o estado/cidade não existem mais, volta para "todos". */
function ajustarFiltrosCli(){
  if(relCliEtapa !== "todas" && !dados.columns.some(c => c.id === relCliEtapa)){
    relCliEtapa = "todas";
  }
  if(relCliUF !== "todos" && !estadosDisponiveis().includes(relCliUF)){
    relCliUF = "todos"; relCliCidade = "todas";
  }
  if(relCliCidade !== "todas" && !cidadesDisponiveis().some(c => c.chave === relCliCidade)){
    relCliCidade = "todas";
  }
}

/* ---------------- ordenação ---------------- */
function txtOrd(v){ return String(v || "").trim(); }

const ORDENS_CLI = {
  nome: {
    label: "Nome (A → Z)",
    fn: (a,b) => txtOrd(a.nome).localeCompare(txtOrd(b.nome), "pt-BR")
  },
  cidade: {
    label: "Cidade / Estado",
    fn: (a,b) => {
      const ea = txtOrd(a.estado), eb = txtOrd(b.estado);
      if(!ea !== !eb) return ea ? -1 : 1;          // sem estado vai para o fim
      const r1 = ea.localeCompare(eb, "pt-BR"); if(r1) return r1;
      const ca = txtOrd(a.cidade), cb = txtOrd(b.cidade);
      if(!ca !== !cb) return ca ? -1 : 1;
      const r2 = ca.localeCompare(cb, "pt-BR"); if(r2) return r2;
      return txtOrd(a.nome).localeCompare(txtOrd(b.nome), "pt-BR");
    }
  },
  etapa: {
    label: "Etapa do funil",
    fn: (a,b) => posEtapa(a.columnId) - posEtapa(b.columnId)
              || txtOrd(a.nome).localeCompare(txtOrd(b.nome), "pt-BR")
  },
  recentes: {
    label: "Cadastro mais recente",
    fn: (a,b) => txtOrd(b.criadoEm).localeCompare(txtOrd(a.criadoEm))
              || txtOrd(a.nome).localeCompare(txtOrd(b.nome), "pt-BR")
  }
};

/* ---------------- tela ---------------- */
function abrirRelClientes(){
  ajustarFiltrosCli();
  renderRelClientes();
  document.getElementById("relOverlay").classList.add("show");
}

function resumoFiltrosCli(cidades){
  const cid = cidades.find(c => c.chave === relCliCidade);
  return [
    relCliEtapa  === "todas" ? "Todas as etapas"   : nomeEtapa(relCliEtapa),
    relCliUF     === "todos" ? "Todos os estados"  : relCliUF,
    relCliCidade === "todas" ? "Todas as cidades"  : (cid ? cid.nome : "")
  ].filter(Boolean).join(" · ");
}

function renderRelClientes(){
  const ufs     = estadosDisponiveis();
  const cidades = cidadesDisponiveis();
  const lista   = clientesFiltrados().slice().sort(ORDENS_CLI[relCliOrdem].fn);

  const qtdCidades = new Set(lista.map(c => chaveTexto(c.cidade)).filter(Boolean)).size;
  const qtdEstados = new Set(lista.map(c => c.estado).filter(Boolean)).size;
  const semTel     = lista.filter(c => !telefoneCliente(c)).length;
  const filtroTxt  = resumoFiltrosCli(cidades);

  document.getElementById("relContent").innerHTML = `
    <div class="modal-head">
      <div class="avatar-sq">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <h2>Clientes</h2>
        <div class="sub">${esc(filtroTxt)} · ${lista.length} cliente(s)</div>
      </div>
      <button class="icon-btn lg" id="relFechar" aria-label="Fechar">${icon("x",17,2.2)}</button>
    </div>

    <div class="rel-filtros">
      <div class="rel-sel">
        <label>Etapa
          <select class="inp" id="fCliEtapa">
            <option value="todas">Todas</option>
            ${dados.columns.map(c =>
              `<option value="${esc(c.id)}" ${c.id === relCliEtapa ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select>
        </label>
        <label>Estado
          <select class="inp" id="fCliUF">
            <option value="todos">Todos</option>
            ${ufs.map(u =>
              `<option value="${esc(u)}" ${u === relCliUF ? "selected" : ""}>${esc(u)}</option>`).join("")}
          </select>
        </label>
        <label>Cidade
          <select class="inp" id="fCliCidade">
            <option value="todas">Todas</option>
            ${cidades.map(c =>
              `<option value="${esc(c.chave)}" ${c.chave === relCliCidade ? "selected" : ""}>${esc(c.nome)}${relCliUF === "todos" && c.uf ? " - " + esc(c.uf) : ""}</option>`).join("")}
          </select>
        </label>
        <label>Ordenar por
          <select class="inp" id="fCliOrdem">
            ${Object.entries(ORDENS_CLI).map(([k,v]) =>
              `<option value="${k}" ${k === relCliOrdem ? "selected" : ""}>${esc(v.label)}</option>`).join("")}
          </select>
        </label>
      </div>
      <button class="btn btn-soft nao-imprime" id="fCliLimpar" type="button">Limpar filtros</button>
    </div>

    <div class="modal-body" id="relBody">
      <div id="relFolha" class="folha">
        <div class="folha-topo">
          <img src="img/logo.svg" alt="Gustavo de Oliveira" class="folha-logo">
          <div class="folha-info">
            <h3>Relatório de clientes</h3>
            <div>Filtros: <b>${esc(filtroTxt)}</b></div>
            <div>${lista.length} cliente(s) · Ordenado por: ${esc(ORDENS_CLI[relCliOrdem].label)} · Funil: ${esc(dados.boardName || "")}</div>
          </div>
        </div>

        <div class="rel-cards">
          <div class="destaque"><span>Clientes</span><b>${lista.length}</b></div>
          <div><span>Cidades</span><b>${qtdCidades}</b></div>
          <div><span>Estados</span><b>${qtdEstados}</b></div>
        </div>

        ${semTel ? `<div class="rel-aviso">${semTel} cliente(s) sem telefone cadastrado — aparecem com trav\u00e7o na coluna Telefone.</div>` : ""}

        ${lista.length ? `
          <table class="rel-tab solta">
            <thead>
              <tr>
                <th style="width:6%">#</th>
                <th style="width:29%">Cliente</th>
                <th style="width:17%">CNPJ</th>
                <th style="width:15%">Telefone</th>
                <th style="width:17%">Cidade/Estado</th>
                <th style="width:16%">Etapa no funil</th>
              </tr>
            </thead>
            <tbody>
              ${lista.map(c => `
                <tr>
                  <td class="muted">${c.numero || "—"}</td>
                  <td><b>${esc(c.nome || "—")}</b></td>
                  <td>${esc(c.cnpj || "—")}</td>
                  <td>${esc(telefoneCliente(c) || "—")}</td>
                  <td>${esc(cidadeUf(c) || "—")}</td>
                  <td>${esc(nomeEtapa(c.columnId))}</td>
                </tr>`).join("")}
            </tbody>
          </table>`
        : `<div class="empty-state">Nenhum cliente com esses filtros.</div>`}

        <div class="rel-rodape">
          Emitido em ${esc(fmtLongo(new Date().toISOString()))} · ${esc(dados.boardName || "")}
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <span class="left muted" style="font-size:12.5px">Em “Imprimir”, escolha <b>Salvar como PDF</b> no destino.</span>
      <button class="btn" id="relCliXlsx">${icon("save",14,2)} Excel</button>
      <button class="btn btn-primary" id="relCliPrint">${icon("doc",14,2)} Imprimir / Salvar PDF</button>
    </div>
  `;
  ligarRelClientes();
}

/* ---------------- eventos ---------------- */
function ligarRelClientes(){
  const box = document.getElementById("relContent");
  box.querySelector("#relFechar").onclick = fecharRelatorio;

  box.querySelector("#fCliEtapa").onchange = e => {
    relCliEtapa = e.target.value;
    ajustarFiltrosCli();
    renderRelClientes();
  };
  // trocar de estado sempre solta a cidade, senão sobra um filtro impossível
  box.querySelector("#fCliUF").onchange = e => {
    relCliUF = e.target.value;
    relCliCidade = "todas";
    renderRelClientes();
  };
  box.querySelector("#fCliCidade").onchange = e => {
    relCliCidade = e.target.value;
    renderRelClientes();
  };
  box.querySelector("#fCliOrdem").onchange = e => {
    relCliOrdem = e.target.value;
    renderRelClientes();
  };
  box.querySelector("#fCliLimpar").onclick = () => {
    relCliEtapa = "todas"; relCliUF = "todos";
    relCliCidade = "todas"; relCliOrdem = "nome";
    renderRelClientes();
  };

  box.querySelector("#relCliPrint").onclick = () => imprimirFolha("relOverlay");
  box.querySelector("#relCliXlsx").onclick = exportarClientesXlsx;
}

/* ---------------- Excel ---------------- */
function exportarClientesXlsx(){
  const lista = clientesFiltrados().slice().sort(ORDENS_CLI[relCliOrdem].fn);
  if(!lista.length){ toast("Nenhum cliente com esses filtros.", "err"); return; }

  const cab = ["#","Cliente","CNPJ","Telefone","Cidade","Estado","Etapa no funil"];
  const corpo = lista.map(c => [
    c.numero || "", c.nome || "", c.cnpj || "", telefoneCliente(c),
    c.cidade || "", c.estado || "", nomeEtapa(c.columnId)
  ]);

  const ws = montarAba(cab, corpo, {
    texto: [0,2,3],
    largura: [8,34,20,18,22,10,22]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, "clientes.xlsx");
  toast("Planilha gerada.");
}


/* =========================================================
   Relatório de produtos
   A lista dos produtos cadastrados NESTE funil, com os três
   preços. É a tabela de preços em papel: serve para consultar
   e para levar na visita, sem nada de venda misturado.
   ========================================================= */

let relProdLinha = "todas";
let relProdOrdem = "linha";

const ORDENS_PROD = {
  linha: { label:"Linha e sublinha", fn:(a,b) =>
    a.ordemGrupo - b.ordemGrupo || a.nome.localeCompare(b.nome, "pt-BR") },
  nome:  { label:"Nome (A → Z)", fn:(a,b) => a.nome.localeCompare(b.nome, "pt-BR") },
  maior: { label:"Preço máximo (maior primeiro)", fn:(a,b) =>
    (Number(b.precoMax)||0) - (Number(a.precoMax)||0) },
  menor: { label:"Preço mínimo (menor primeiro)", fn:(a,b) =>
    (Number(a.precoMin)||0) - (Number(b.precoMin)||0) }
};

function abrirRelProdutos(){
  if(relProdLinha !== "todas" && !linhasRaiz().some(l => l.id === relProdLinha)) relProdLinha = "todas";
  renderRelProdutos();
  document.getElementById("relOverlay").classList.add("show");
}

/** Os produtos do funil, já com o grupo (linha › sublinha) e a margem. */
function produtosDoRelatorio(){
  const lista = produtosEmOrdem().map((p,i) => {
    const min = Number(p.precoMin) || 0, max = Number(p.precoMax) || 0;
    return {
      ...p,
      grupo: [p.linha, p.sub].filter(Boolean).join(" › ") || "Sem linha",
      ordemGrupo: i,
      margem: (min && max) ? max - min : 0,
      margemPct: (min && max) ? ((max - min) / min) * 100 : 0
    };
  });
  const filtrada = relProdLinha === "todas"
    ? lista
    : lista.filter(p => p.linha === ((linhaPorId(relProdLinha) || {}).nome || ""));
  return filtrada.slice().sort(ORDENS_PROD[relProdOrdem].fn);
}

function linhaProdutoTabela(p, comGrupo){
  return `
  <tr>
    <td><b>${esc(p.nome)}</b></td>
    ${comGrupo ? `<td>${esc(p.grupo)}</td>` : ""}
    <td class="num pr-min">${Number(p.precoMin) ? moeda(p.precoMin) : "—"}</td>
    <td class="num pr-med">${Number(p.precoMed) ? moeda(p.precoMed) : "—"}</td>
    <td class="num pr-max">${Number(p.precoMax) ? moeda(p.precoMax) : "—"}</td>
    <td class="num">${p.margem ? moeda(p.margem) + " <span class=\"muted\">(" + p.margemPct.toFixed(0) + "%)</span>" : "—"}</td>
  </tr>`;
}

function cabecalhoTabelaProdutos(comGrupo){
  return `
  <thead>
    <tr>
      <th style="width:${comGrupo ? "34%" : "46%"}">Produto</th>
      ${comGrupo ? `<th style="width:20%">Linha / Sublinha</th>` : ""}
      <th class="num">Mínimo</th>
      <th class="num">Médio</th>
      <th class="num">Máximo</th>
      <th class="num">Margem</th>
    </tr>
  </thead>`;
}

/** Ordenado por linha: um bloco por linha, com as sublinhas dentro. */
function tabelaProdutosAgrupada(lista){
  const grupos = [];
  lista.forEach(p => {
    const chave = p.linha || "Sem linha";
    let g = grupos.find(x => x.nome === chave);
    if(!g){ g = { nome:chave, subs:[] }; grupos.push(g); }
    const nomeSub = p.sub || "";
    let sg = g.subs.find(x => x.nome === nomeSub);
    if(!sg){ sg = { nome:nomeSub, itens:[] }; g.subs.push(sg); }
    sg.itens.push(p);
  });

  return grupos.map(g => {
    const qtd = g.subs.reduce((s,x) => s + x.itens.length, 0);
    return `
    <div class="rel-grupo">
      <div class="rel-grupo-head">
        <div><b>${esc(g.nome)}</b></div>
        <div class="rel-grupo-tot"><span>${qtd} produto(s)</span></div>
      </div>
      <table class="rel-tab">
        ${cabecalhoTabelaProdutos(false)}
        <tbody>
          ${g.subs.map(sg => `
            ${sg.nome ? `<tr class="rel-sublinha"><td colspan="5">${esc(sg.nome)}</td></tr>` : ""}
            ${sg.itens.map(p => linhaProdutoTabela(p, false)).join("")}
          `).join("")}
        </tbody>
      </table>
    </div>`;
  }).join("");
}

function renderRelProdutos(){
  const lista = produtosDoRelatorio();
  const semPreco = lista.filter(p => !Number(p.precoMin) && !Number(p.precoMax)).length;
  const linhas = new Set(lista.map(p => p.linha).filter(Boolean)).size;
  const agrupado = relProdOrdem === "linha";
  const filtroTxt = relProdLinha === "todas"
    ? "Todas as linhas"
    : ((linhaPorId(relProdLinha) || {}).nome || "");

  document.getElementById("relContent").innerHTML = `
    <div class="modal-head">
      <div class="avatar-sq">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></svg>
      </div>
      <div style="flex:1;min-width:0">
        <h2>Produtos</h2>
        <div class="sub">${esc(filtroTxt)} · ${lista.length} produto(s) cadastrado(s)</div>
      </div>
      <button class="icon-btn lg" id="relFechar" aria-label="Fechar">${icon("x",17,2.2)}</button>
    </div>

    <div class="rel-filtros">
      <div class="rel-sel">
        <label>Linha
          <select class="inp" id="fProdLinha">
            <option value="todas">Todas</option>
            ${linhasRaiz().map(l =>
              `<option value="${esc(l.id)}" ${l.id === relProdLinha ? "selected" : ""}>${esc(l.nome)}</option>`).join("")}
          </select>
        </label>
        <label>Ordenar por
          <select class="inp" id="fProdOrdem">
            ${Object.entries(ORDENS_PROD).map(([k,v]) =>
              `<option value="${k}" ${k === relProdOrdem ? "selected" : ""}>${esc(v.label)}</option>`).join("")}
          </select>
        </label>
      </div>
      <button class="btn btn-soft nao-imprime" id="fProdLimpar" type="button">Limpar filtros</button>
    </div>

    <div class="modal-body" id="relBody">
      <div id="relFolha" class="folha">
        <div class="folha-topo">
          <img src="img/logo.svg" alt="Gustavo de Oliveira" class="folha-logo">
          <div class="folha-info">
            <h3>Tabela de preços — produtos</h3>
            <div>Filtros: <b>${esc(filtroTxt)}</b></div>
            <div>${lista.length} produto(s) · Ordenado por: ${esc(ORDENS_PROD[relProdOrdem].label)} · Funil: ${esc(dados.boardName || "")}</div>
          </div>
        </div>

        <div class="rel-cards">
          <div class="destaque"><span>Produtos cadastrados</span><b>${lista.length}</b></div>
          <div><span>Linhas</span><b>${linhas}</b></div>
          <div><span>Sem preço cadastrado</span><b>${semPreco}</b></div>
        </div>

        ${semPreco ? `<div class="rel-aviso">${semPreco} produto(s) sem preço mínimo e máximo — eles aparecem com traço e nunca geram aviso na hora do pedido.</div>` : ""}

        ${lista.length
          ? (agrupado ? tabelaProdutosAgrupada(lista) : `
            <table class="rel-tab solta">
              ${cabecalhoTabelaProdutos(true)}
              <tbody>${lista.map(p => linhaProdutoTabela(p, true)).join("")}</tbody>
            </table>`)
          : `<div class="empty-state">Nenhum produto cadastrado neste funil. Use o botão <b>Produtos</b>, na barra de cima, para montar a sua tabela de preços.</div>`}

        <div class="rel-legenda">
          Preços <b>por unidade</b> · <span class="pr-min">mínimo</span> ·
          <span class="pr-med">médio</span> · <span class="pr-max">máximo</span> ·
          margem = quanto o máximo está acima do mínimo.
        </div>

        <div class="rel-rodape">
          Emitido em ${esc(fmtLongo(new Date().toISOString()))} · ${esc(dados.boardName || "")}
        </div>
      </div>
    </div>

    <div class="modal-foot">
      <span class="left muted" style="font-size:12.5px">Em “Imprimir”, escolha <b>Salvar como PDF</b> no destino.</span>
      <button class="btn" id="relProdXlsx">${icon("save",14,2)} Excel</button>
      <button class="btn btn-primary" id="relProdPrint">${icon("doc",14,2)} Imprimir / Salvar PDF</button>
    </div>
  `;
  ligarRelProdutos();
}

function ligarRelProdutos(){
  const box = document.getElementById("relContent");
  box.querySelector("#relFechar").onclick = fecharRelatorio;
  box.querySelector("#fProdLinha").onchange = e => { relProdLinha = e.target.value; renderRelProdutos(); };
  box.querySelector("#fProdOrdem").onchange = e => { relProdOrdem = e.target.value; renderRelProdutos(); };
  box.querySelector("#fProdLimpar").onclick = () => {
    relProdLinha = "todas"; relProdOrdem = "linha";
    renderRelProdutos();
  };
  box.querySelector("#relProdPrint").onclick = () => imprimirFolha("relOverlay");
  box.querySelector("#relProdXlsx").onclick = exportarProdutosXlsx;
}

function exportarProdutosXlsx(){
  const lista = produtosDoRelatorio();
  if(!lista.length){ toast("Nenhum produto cadastrado neste funil.", "err"); return; }

  const cab = ["Produto","Linha","Sublinha","Preço mínimo","Preço médio","Preço máximo","Margem (R$)","Margem (%)"];
  const corpo = lista.map(p => [
    p.nome, p.linha || "", p.sub || "",
    Number(p.precoMin) || "", Number(p.precoMed) || "", Number(p.precoMax) || "",
    p.margem || "", p.margemPct ? Number(p.margemPct.toFixed(1)) : ""
  ]);

  const ws = montarAba(cab, corpo, {
    z: { 3:"#,##0.00", 4:"#,##0.00", 5:"#,##0.00", 6:"#,##0.00", 7:'0.0"%"' },
    largura: [44,24,24,14,14,14,14,12]
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "produtos.xlsx");
  toast("Planilha gerada.");
}
