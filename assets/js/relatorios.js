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
    <img src="img/logo.svg" alt="Shaliach" class="folha-logo">
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
