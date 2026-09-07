/* =========================================================
   ordenacao.js — ordenar os cartões DENTRO de cada etapa.

   Cada coluna do funil tem a sua própria ordenação, escolhida
   por você e somando quantos critérios quiser: primeiro estado,
   depois cidade, depois segmento em destaque, e assim por diante.

   Nada disso muda dado: é só a ordem em que os cartões aparecem
   na tela. Limpando a ordenação, o funil volta para a ordem
   manual (a que você monta arrastando os cartões).

   A escolha fica gravada no navegador, por funil e por etapa —
   não vai para o banco, é preferência de tela.
   ========================================================= */

const CHAVE_ORDEM = "crmOrdemEtapas";

/* { colId: [ {tipo, dir, segId} ] } — a ordem do array é a ordem dos critérios */
let ordemColunas = null;
let ordPopCol = null;          // etapa com o menu de ordenação aberto
let ordPopAberto = 0;          // instante em que abriu (ver o fechar por rolagem)

const CRITERIOS = {
  estado:  { label:"Estado",              sub:"A → Z, sem estado por último" },
  cidade:  { label:"Cidade",              sub:"A → Z, sem cidade por último" },
  segmento:{ label:"Segmento em destaque",sub:"O segmento escolhido sobe para cima" },
  cadastro:{ label:"Data de cadastro",    sub:"Quando o negócio entrou no funil" },
  pedido:  { label:"Data do último pedido", sub:"Para chamar quem comprou há mais tempo" }
};

/* ---------------- guardar / ler a escolha ---------------- */
function chaveOrdemFunil(){
  const id = (typeof funilAtual === "object" && funilAtual && funilAtual.id)
    || (dados && dados.boardName) || "local";
  return CHAVE_ORDEM + ":" + id;
}

function carregarOrdemColunas(){
  if(ordemColunas) return ordemColunas;
  ordemColunas = {};
  try{
    const bruto = localStorage.getItem(chaveOrdemFunil());
    if(bruto){
      const lido = JSON.parse(bruto);
      if(lido && typeof lido === "object"){
        Object.entries(lido).forEach(([col, lista]) => {
          if(Array.isArray(lista)){
            ordemColunas[col] = lista
              .filter(c => c && CRITERIOS[c.tipo])
              .map(c => ({ tipo:c.tipo, dir:c.dir === "desc" ? "desc" : "asc", segId:c.segId || null }));
          }
        });
      }
    }
  }catch(e){ ordemColunas = {}; }
  return ordemColunas;
}

function gravarOrdemColunas(){
  try{ localStorage.setItem(chaveOrdemFunil(), JSON.stringify(ordemColunas || {})); }
  catch(e){ /* navegador sem espaço: a ordenação vale só nesta sessão */ }
}

function ordemDaColuna(colId){
  const todas = carregarOrdemColunas();
  return Array.isArray(todas[colId]) ? todas[colId] : [];
}

function definirOrdemDaColuna(colId, criterios){
  carregarOrdemColunas();
  if(criterios && criterios.length) ordemColunas[colId] = criterios;
  else delete ordemColunas[colId];
  gravarOrdemColunas();
}

/* ---------------- os critérios ---------------- */
function dataUltimoPedido(card){
  return (card.pedidos || []).reduce((maior, p) => {
    const d = (p.data || (p.criadoEm || "").slice(0,10) || "").slice(0,10);
    return d > maior ? d : maior;
  }, "");
}

/** Colunas com pedido lançado ganham o critério "data do último pedido". */
function colunaTemPedido(colId){
  return (dados.cards || []).some(c => c.columnId === colId && (c.pedidos || []).length);
}

function criteriosDisponiveis(colId){
  const lista = ["estado","cidade"];
  if(typeof listaSegmentos === "function" && listaSegmentos().length) lista.push("segmento");
  lista.push("cadastro");
  if(colunaTemPedido(colId)) lista.push("pedido");
  return lista;
}

/** Compara dois cartões por UM critério. Vazio vai sempre para o fim. */
function compararPorCriterio(a, b, crit){
  const dir = crit.dir === "desc" ? -1 : 1;

  if(crit.tipo === "estado" || crit.tipo === "cidade"){
    const va = chaveTexto(crit.tipo === "estado" ? a.estado : a.cidade);
    const vb = chaveTexto(crit.tipo === "estado" ? b.estado : b.cidade);
    if(!va !== !vb) return va ? -1 : 1;              // sem valor vai para o fim
    if(!va && !vb) return 0;
    return va.localeCompare(vb, "pt-BR") * dir;
  }

  if(crit.tipo === "segmento"){
    if(!crit.segId) return 0;
    const ta = (a.segmentos || []).includes(crit.segId) ? 0 : 1;
    const tb = (b.segmentos || []).includes(crit.segId) ? 0 : 1;
    return (ta - tb) * dir;                          // quem tem o segmento sobe
  }

  if(crit.tipo === "cadastro"){
    const va = a.criadoEm || "", vb = b.criadoEm || "";
    if(!va !== !vb) return va ? -1 : 1;
    return va.localeCompare(vb) * dir;
  }

  if(crit.tipo === "pedido"){
    const va = dataUltimoPedido(a), vb = dataUltimoPedido(b);
    if(!va !== !vb) return va ? -1 : 1;              // quem nunca comprou vai para o fim
    if(!va && !vb) return 0;
    return va.localeCompare(vb) * dir;
  }

  return 0;
}

/**
 * Ordena os cartões de uma etapa. Sem critério nenhum, vale a ordem
 * manual (posicao) — que continua sendo o desempate em todos os casos.
 */
function ordenarCartoesDaColuna(colId, lista){
  const criterios = ordemDaColuna(colId);
  const porPosicao = (a,b) => (a.posicao || 0) - (b.posicao || 0);
  if(!criterios.length) return lista.slice().sort(porPosicao);

  return lista.slice().sort((a,b) => {
    for(const crit of criterios){
      const r = compararPorCriterio(a, b, crit);
      if(r) return r;
    }
    return porPosicao(a, b);
  });
}

/* ---------------- resumo que aparece na etapa ---------------- */
function rotuloCriterio(crit){
  if(crit.tipo === "segmento"){
    const s = (typeof segmentoPorId === "function") ? segmentoPorId(crit.segId) : null;
    return s ? s.nome : "Segmento";
  }
  if(crit.tipo === "cadastro") return crit.dir === "desc" ? "Cadastro (novos)" : "Cadastro (antigos)";
  if(crit.tipo === "pedido")   return crit.dir === "desc" ? "Pedido (recentes)" : "Pedido (antigos)";
  return CRITERIOS[crit.tipo] ? CRITERIOS[crit.tipo].label : "";
}

function resumoOrdem(colId){
  return ordemDaColuna(colId).map(rotuloCriterio).filter(Boolean).join(" · ");
}

/** A tirinha que fica embaixo do nome da etapa. */
function htmlOrdemColuna(colId){
  const criterios = ordemDaColuna(colId);
  const ativa = criterios.length > 0;
  return `
  <div class="col-ord-fila">
    <button class="col-ord${ativa ? " on" : ""}" data-ord="${esc(colId)}"
            title="${ativa ? "Ordenação desta etapa: " + esc(resumoOrdem(colId)) : "Ordenar esta etapa"}">
      ${icon("sort",12,2.3)}<span>${ativa ? esc(resumoOrdem(colId)) : "Ordenar"}</span>
    </button>
    ${ativa ? `<button class="col-ord-x" data-ordlimpar="${esc(colId)}" title="Voltar à ordem manual" aria-label="Limpar ordenação">${icon("x",11,2.6)}</button>` : ""}
  </div>`;
}

/** Liga os botões da tirinha (chamado no fim do render do quadro). */
function ligarOrdemColunas(){
  document.querySelectorAll("[data-ord]").forEach(b => {
    b.onclick = e => { e.stopPropagation(); abrirMenuOrdem(b.dataset.ord, b); };
  });
  document.querySelectorAll("[data-ordlimpar]").forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      definirOrdemDaColuna(b.dataset.ordlimpar, []);
      render();
      toast("Ordenação limpa. A etapa voltou para a ordem manual.");
    };
  });
}

/* ---------------- menu de ordenação ---------------- */
function abrirMenuOrdem(colId, botao){
  const pop = document.getElementById("ordPop");
  if(!pop) return;
  ordPopCol = colId;
  ordPopAberto = Date.now();
  renderMenuOrdem();
  pop.classList.add("show");
  posicionarPop(pop, botao);
}

function fecharMenuOrdem(){
  const pop = document.getElementById("ordPop");
  if(!pop || !pop.classList.contains("show")) return;
  pop.classList.remove("show");
  ordPopCol = null;
}

/** Abre encostado no botão, sem sair da tela. */
function posicionarPop(pop, botao){
  const r = botao.getBoundingClientRect();
  const p = pop.getBoundingClientRect();
  const x = Math.min(r.left, window.innerWidth - p.width - 10);
  let y = r.bottom + 6;
  if(y + p.height > window.innerHeight - 8) y = Math.max(8, r.top - p.height - 6);
  pop.style.left = Math.max(8, x) + "px";
  pop.style.top = y + "px";
}

function renderMenuOrdem(){
  const pop = document.getElementById("ordPop");
  if(!pop || !ordPopCol) return;

  const col = (dados.columns || []).find(c => c.id === ordPopCol);
  const criterios = ordemDaColuna(ordPopCol);
  const escolhido = tipo => criterios.find(c => c.tipo === tipo);
  const posicaoDe = tipo => criterios.findIndex(c => c.tipo === tipo) + 1;
  const segs = (typeof listaSegmentos === "function") ? listaSegmentos() : [];

  pop.innerHTML = `
    <div class="ctx-head">Ordenar “${esc((col && col.name) || "")}”</div>
    <div class="ord-ajuda">Marque quantos quiser: valem na ordem em que você marcar.</div>

    ${criteriosDisponiveis(ordPopCol).map(tipo => {
      const c = escolhido(tipo);
      const n = posicaoDe(tipo);
      return `
      <div class="ord-item${c ? " on" : ""}">
        <label class="ord-op">
          <input type="checkbox" data-crit="${tipo}" ${c ? "checked" : ""}>
          <span class="ord-num">${c ? n : ""}</span>
          <span class="ord-txt"><b>${esc(CRITERIOS[tipo].label)}</b><i>${esc(CRITERIOS[tipo].sub)}</i></span>
        </label>

        ${c && tipo === "segmento" ? `
          <div class="ord-extra">
            <select class="inp" data-critseg>
              ${segs.map(s => `<option value="${esc(s.id)}" ${s.id === c.segId ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}
            </select>
          </div>` : ""}

        ${c && (tipo === "cadastro" || tipo === "pedido") ? `
          <div class="ord-extra ord-dir" role="group">
            <button type="button" data-critdir="${tipo}" data-dir="asc" class="${c.dir !== "desc" ? "on" : ""}">Mais antigos</button>
            <button type="button" data-critdir="${tipo}" data-dir="desc" class="${c.dir === "desc" ? "on" : ""}">Mais novos</button>
          </div>` : ""}

        ${c && (tipo === "estado" || tipo === "cidade") ? `
          <div class="ord-extra ord-dir" role="group">
            <button type="button" data-critdir="${tipo}" data-dir="asc" class="${c.dir !== "desc" ? "on" : ""}">A → Z</button>
            <button type="button" data-critdir="${tipo}" data-dir="desc" class="${c.dir === "desc" ? "on" : ""}">Z → A</button>
          </div>` : ""}
      </div>`;
    }).join("")}

    ${criterios.length ? `
      <hr>
      <div class="ord-resumo">Ordem aplicada: <b>${esc(resumoOrdem(ordPopCol))}</b></div>
      <button class="ord-limpar" id="ordLimparTudo">${icon("x",13,2.4)} Voltar à ordem manual</button>` : ""}
  `;

  /* marcar / desmarcar um critério */
  pop.querySelectorAll("[data-crit]").forEach(inp => {
    inp.onchange = () => {
      const tipo = inp.dataset.crit;
      const atual = ordemDaColuna(ordPopCol).slice();
      if(inp.checked){
        const novo = { tipo, dir:"asc", segId:null };
        if(tipo === "segmento"){
          const segs2 = (typeof listaSegmentos === "function") ? listaSegmentos() : [];
          if(!segs2.length){
            toast("Cadastre um segmento primeiro, no botão Segmentos.", "err");
            inp.checked = false;
            return;
          }
          novo.segId = segs2[0].id;
        }
        if(tipo === "pedido") novo.dir = "asc";        // mais antigos primeiro: é o que serve para chamar
        atual.push(novo);
      }else{
        const i = atual.findIndex(c => c.tipo === tipo);
        if(i >= 0) atual.splice(i, 1);
      }
      definirOrdemDaColuna(ordPopCol, atual);
      render();
      renderMenuOrdem();          // o menu continua aberto para somar outro critério
    };
  });

  /* qual segmento fica em destaque */
  const sel = pop.querySelector("[data-critseg]");
  if(sel) sel.onchange = () => {
    const atual = ordemDaColuna(ordPopCol).map(c =>
      c.tipo === "segmento" ? { ...c, segId: sel.value } : c);
    definirOrdemDaColuna(ordPopCol, atual);
    render();
    renderMenuOrdem();
  };

  /* sentido de cada critério */
  pop.querySelectorAll("[data-critdir]").forEach(b => {
    b.onclick = () => {
      const atual = ordemDaColuna(ordPopCol).map(c =>
        c.tipo === b.dataset.critdir ? { ...c, dir: b.dataset.dir } : c);
      definirOrdemDaColuna(ordPopCol, atual);
      render();
      renderMenuOrdem();
    };
  });

  const limpar = pop.querySelector("#ordLimparTudo");
  if(limpar) limpar.onclick = () => {
    definirOrdemDaColuna(ordPopCol, []);
    render();
    renderMenuOrdem();
  };
}

/* ---------------- ligação inicial ---------------- */
function ligarOrdenacao(){
  const pop = document.getElementById("ordPop");
  if(pop) pop.onclick = e => e.stopPropagation();

  document.addEventListener("click", e => {
    // clique num item que o próprio menu acabou de redesenhar: o alvo já saiu
    // do documento, então não dá para perguntar se estava dentro do menu
    if(!e.target.isConnected) return;
    if(e.target.closest("#ordPop") || e.target.closest("[data-ord]")) return;
    fecharMenuOrdem();
  });
  /* rolar fecha o menu — menos a rolagem que o próprio navegador faz para
     trazer o botão da etapa para a tela, que chega logo depois do clique */
  document.addEventListener("scroll", () => {
    if(Date.now() - ordPopAberto < 500) return;
    fecharMenuOrdem();
  }, true);
  window.addEventListener("blur", fecharMenuOrdem);
}
