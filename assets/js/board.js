/* =========================================================
   board.js — funil kanban: colunas, cartões, arrastar,
   menu do botão direito.
   ========================================================= */

let arrastando = null;      // id do cartão

/* ---------------- render principal ---------------- */
function render(){
  if(!dados) return;

  document.getElementById("boardName").value = dados.boardName || "Meu funil";

  const visiveis = cardsFiltrados();
  const total = visiveis.reduce((s,c) => s + valorCartao(c), 0);
  document.getElementById("totalValue").textContent = moeda(total);
  document.getElementById("totalCount").textContent =
    visiveis.length + (visiveis.length === 1 ? " negócio" : " negócios");

  const board = document.getElementById("board");
  board.innerHTML = "";

  dados.columns.forEach((col, idx) => {
    const lista = visiveis.filter(c => c.columnId === col.id)
                          .sort((a,b) => (a.posicao || 0) - (b.posicao || 0));
    const soma = lista.reduce((s,c) => s + valorCartao(c), 0);

    const el = document.createElement("div");
    el.className = "column";
    el.dataset.colId = col.id;
    el.innerHTML = `
      <div class="col-head">
        <div class="col-head-main">
          <input class="col-title" value="${esc(col.name)}" data-col="${col.id}" aria-label="Nome da etapa">
          <div class="col-meta"><span>${lista.length}</span><span>·</span><b>${moeda(soma)}</b></div>
        </div>
        <div class="col-acts">
          <button data-act="left" data-col="${col.id}" title="Mover etapa para a esquerda" ${idx===0?'style="visibility:hidden"':""}>${icon("arrowl",14,2.2)}</button>
          <button data-act="right" data-col="${col.id}" title="Mover etapa para a direita" ${idx===dados.columns.length-1?'style="visibility:hidden"':""}>${icon("arrowr",14,2.2)}</button>
          <button data-act="del" data-col="${col.id}" title="Excluir etapa">${icon("x",14,2.2)}</button>
        </div>
      </div>
      <div class="cards" data-col="${col.id}"></div>
      <button class="add-card" data-col="${col.id}">+ Adicionar negócio</button>
    `;
    board.appendChild(el);

    const wrap = el.querySelector(".cards");
    if(!lista.length){
      wrap.innerHTML = `<div class="col-empty">Arraste um negócio para cá<br>ou adicione um nesta etapa</div>`;
    } else {
      lista.forEach(c => wrap.appendChild(renderCard(c)));
    }

    wrap.addEventListener("dragover", e => {
      e.preventDefault();
      if(!arrastando) return;
      el.classList.add("dragover");
      posicionarMarcador(wrap, e.clientY);
    });
    wrap.addEventListener("dragleave", e => {
      if(!wrap.contains(e.relatedTarget)){
        el.classList.remove("dragover");
        removerMarcador();
      }
    });
    wrap.addEventListener("drop", e => {
      e.preventDefault();
      el.classList.remove("dragover");
      if(!arrastando) return;
      soltarCartao(col.id, wrap);
    });
  });

  const add = document.createElement("div");
  add.className = "add-column";
  add.innerHTML = `<button id="addColBtn">+ Adicionar etapa</button>`;
  board.appendChild(add);

  ligarEventosBoard();
  atualizarContadoresAgenda();
  if(typeof renderMenuFunis === "function") renderMenuFunis();
}

/* ---------------- arrastar: marcador de posição ---------------- */
function removerMarcador(){
  const m = document.getElementById("dropMark");
  if(m) m.remove();
}

/** Coloca a linha de inserção entre os cartões, conforme a altura do mouse. */
function posicionarMarcador(wrap, y){
  let mark = document.getElementById("dropMark");
  if(!mark){
    mark = document.createElement("div");
    mark.id = "dropMark";
    mark.className = "drop-mark";
  }
  const cartoes = [...wrap.querySelectorAll(".card:not(.dragging)")];
  const alvo = cartoes.find(c => {
    const r = c.getBoundingClientRect();
    return y < r.top + r.height / 2;
  });
  const vazio = wrap.querySelector(".col-empty");
  if(vazio) vazio.remove();
  if(alvo) wrap.insertBefore(mark, alvo);
  else wrap.appendChild(mark);
}

/**
 * Solta o cartão na coluna, na altura em que o marcador está.
 * A ordem dos cartões escondidos por filtro/busca é preservada: o cartão
 * arrastado entra imediatamente antes do cartão visível que o marcador aponta.
 */
function soltarCartao(colId, wrap){
  const card = dados.cards.find(c => c.id === arrastando);

  // lê a posição do marcador ANTES de removê-lo
  const mark = wrap.querySelector(".drop-mark");
  let idSeguinte = null;   // id do próximo cartão visível (null = foi para o fim)
  if(mark){
    let n = mark.nextElementSibling;
    while(n && !n.classList.contains("card")) n = n.nextElementSibling;
    if(n) idSeguinte = n.dataset.cardId;
  }
  removerMarcador();
  if(!card) return;

  const mudouDeEtapa = card.columnId !== colId;

  // lista completa da coluna de destino, na ordem atual, sem o cartão arrastado
  const destino = dados.cards
    .filter(c => c.columnId === colId && c.id !== card.id)
    .sort((a,b) => (a.posicao || 0) - (b.posicao || 0));

  const at = idSeguinte ? destino.findIndex(c => c.id === idSeguinte) : -1;
  if(at >= 0) destino.splice(at, 0, card);
  else destino.push(card);

  const colOrigem = card.columnId;
  card.columnId = colId;
  destino.forEach((c,i) => { c.posicao = i; });

  // reaperta a coluna de origem para não deixar buracos
  if(mudouDeEtapa){
    dados.cards.filter(c => c.columnId === colOrigem)
      .sort((a,b) => (a.posicao || 0) - (b.posicao || 0))
      .forEach((c,i) => { c.posicao = i; });
    card.etapaEm = new Date().toISOString();
  }
  card.atualizadoEm = new Date().toISOString();

  salvar(); render();
}

/** O valor que aparece no funil é o do pedido atual do cliente. */
function valorCartao(card){
  if(typeof pedidoAtual === "function"){
    const p = pedidoAtual(card);
    if(p) return totalPedido(p);
  }
  return Number(card.valor) || 0;
}

function cardsFiltrados(){
  const busca = (document.getElementById("searchInput").value || "").trim().toLowerCase();
  return dados.cards.filter(c => {
    if(!busca) return true;
    const alvo = [c.nome, c.razaoSocial, c.cnpj, c.whatsapp, c.telefone, c.celular, c.email,
                  c.cidade, c.categoria, c.origem, c.responsavel,
                  (c.produtos||[]).join(" "),
                  (c.pessoas||[]).map(p => p.nome).join(" ")]
                  .join(" ").toLowerCase();
    return alvo.includes(busca);
  });
}

/* ---------------- cartão ---------------- */
function renderCard(card){
  const el = document.createElement("div");
  el.className = "card" + (card.status === "ganho" ? " won" : card.status === "perdido" ? " lost" : "");
  el.draggable = true;
  el.dataset.cardId = card.id;

  const pendente = proximaAtividade(card);
  let badge = "";
  if(pendente){
    const t = ACT_TYPES[pendente.tipo] || ACT_TYPES.nota;
    const late = estaAtrasado(pendente.data);
    badge = `<div class="card-badge${late ? " late" : ""}" style="background:${t.color}14;color:${t.color}">
      <i class="dot" style="background:${t.color}"></i>${t.label} · ${esc(fmtPrazo(pendente.data))}
    </div>`;
  }

  const contato = card.whatsapp || card.celular || card.telefone || card.email || "";
  const tags = [];
  if(card.cidade) tags.push(card.cidade + (card.estado ? "/" + card.estado : ""));
  if(card.categoria) tags.push(card.categoria);
  if(card.origem) tags.push(card.origem);

  el.innerHTML = `
    <div class="card-top">
      <span class="card-num">#${card.numero}</span>
      <span class="card-name" title="${esc(card.nome)}">${esc(card.nome)}</span>
      ${card.status === "ganho" ? `<span style="color:var(--green)" title="Ganho">${icon("trophy",14,2)}</span>` : ""}
      ${card.status === "perdido" ? `<span style="color:var(--red)" title="Perdido">${icon("flag",14,2)}</span>` : ""}
    </div>
    ${contato ? `<div class="card-sub">${icon("phone",12,2)}${esc(contato)}</div>` : ""}
${(() => { const v = valorCartao(card); return v ? `<div class="card-value">${moeda(v)}</div>` : ""; })()}
    ${badge}
    ${tags.length ? `<div class="card-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
  `;

  el.addEventListener("dragstart", () => { arrastando = card.id; el.classList.add("dragging"); });
  el.addEventListener("dragend", () => {
    arrastando = null;
    el.classList.remove("dragging");
    removerMarcador();
    document.querySelectorAll(".column.dragover").forEach(c => c.classList.remove("dragover"));
  });
  el.addEventListener("click", () => abrirNegocio(card.id));
  el.addEventListener("contextmenu", e => { e.preventDefault(); abrirMenu(e, card.id); });

  return el;
}

function proximaAtividade(card){
  return (card.agendamentos || [])
    .filter(a => !a.concluido && a.data)
    .sort((a,b) => new Date(a.data) - new Date(b.data))[0];
}

/* ---------------- eventos do board ---------------- */
function ligarEventosBoard(){
  document.querySelectorAll(".col-title").forEach(inp => {
    inp.onchange = e => {
      const col = dados.columns.find(c => c.id === e.target.dataset.col);
      if(col){ col.name = e.target.value.trim() || "Sem nome"; salvar(); render(); }
    };
  });

  document.querySelectorAll("[data-act]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.col;
      const i = dados.columns.findIndex(c => c.id === id);
      const act = btn.dataset.act;

      if(act === "left" && i > 0){
        [dados.columns[i-1], dados.columns[i]] = [dados.columns[i], dados.columns[i-1]];
      } else if(act === "right" && i < dados.columns.length - 1){
        [dados.columns[i+1], dados.columns[i]] = [dados.columns[i], dados.columns[i+1]];
      } else if(act === "del"){
        if(dados.columns.length === 1){ toast("O funil precisa de pelo menos uma etapa.", "err"); return; }
        const qtd = dados.cards.filter(c => c.columnId === id).length;
        const msg = qtd
          ? `Esta etapa tem ${qtd} negócio(s). Ao excluir, eles vão para a primeira etapa do funil.`
          : "Excluir esta etapa do funil?";
        if(!(await confirmar(msg, { titulo:"Excluir etapa", ok:"Excluir etapa", perigo:true }))) return;
        const destino = dados.columns.find(c => c.id !== id).id;
        dados.cards.forEach(c => { if(c.columnId === id) c.columnId = destino; });
        dados.columns = dados.columns.filter(c => c.id !== id);
      }
      salvar(); render();
    };
  });

  document.querySelectorAll(".add-card").forEach(b => {
    b.onclick = () => abrirEmpresa(null, b.dataset.col);
  });

  const addCol = document.getElementById("addColBtn");
  if(addCol) addCol.onclick = async () => {
    const nome = await pedirTexto("Nova etapa", "Nome da etapa", "");
    if(!nome) return;
    dados.columns.push({ id: uid(), name: nome });
    salvar(); render();
    toast("Etapa criada.");
  };
}

/* ---------------- menu do botão direito ---------------- */
function abrirMenu(ev, cardId){
  const card = dados.cards.find(c => c.id === cardId);
  if(!card) return;
  const menu = document.getElementById("ctxMenu");

  const item = (ic, txt, fn, cls) =>
    `<button data-fn="${fn}" ${cls ? `class="${cls}"` : ""}><span class="ic">${icon(ic,15,1.9)}</span>${txt}</button>`;

  menu.innerHTML = `
    <div class="ctx-head">#${card.numero} · ${esc(card.nome)}</div>
    ${item("open","Abrir negócio","abrir")}
    ${item("edit","Editar empresa","editar")}
    <hr>
    <div class="ctx-head">Agendar</div>
    ${item("whats","Agendar WhatsApp","ag_whatsapp")}
    ${item("pin","Agendar visita","ag_visita")}
    ${item("phone","Agendar ligação","ag_ligacao")}
    ${item("users","Agendar reunião","ag_reuniao")}
    ${item("mail","Agendar e-mail","ag_email")}
    ${item("doc","Registrar proposta","ag_proposta")}
    ${item("note","Escrever nota","ag_nota")}
    <hr>
    ${card.whatsapp || card.celular ? item("whats","Abrir conversa no WhatsApp","wa") : ""}
    ${item("copy","Duplicar negócio","duplicar")}
    ${item("trash","Excluir negócio","excluir","danger")}
  `;

  menu.classList.add("show");
  const r = menu.getBoundingClientRect();
  const x = Math.min(ev.clientX, window.innerWidth - r.width - 10);
  const y = Math.min(ev.clientY, window.innerHeight - r.height - 10);
  menu.style.left = Math.max(8, x) + "px";
  menu.style.top = Math.max(8, y) + "px";

  menu.querySelectorAll("button").forEach(b => {
    b.onclick = () => { fecharMenu(); acaoMenu(b.dataset.fn, card); };
  });
}

function fecharMenu(){ document.getElementById("ctxMenu").classList.remove("show"); }

async function acaoMenu(fn, card){
  if(fn === "abrir")  return abrirNegocio(card.id);
  if(fn === "editar") return abrirEmpresa(card.id);
  if(fn.startsWith("ag_")) return abrirAgendar(card.id, fn.slice(3));
  if(fn === "wa"){
    const link = waLink(card.whatsapp || card.celular);
    if(link) window.open(link, "_blank");
    return;
  }
  if(["ganho","perdido","andamento"].includes(fn)){
    definirStatus(card.id, fn);
    return;
  }
  if(fn === "duplicar"){
    const copia = JSON.parse(JSON.stringify(card));
    copia.id = uid();
    copia.numero = proximoNumero();
    copia.nome = card.nome + " (cópia)";
    copia.codigo = copia.numero + "-" + uid() + "@crm.local";
    copia.agendamentos = [];
    copia.criadoEm = new Date().toISOString();
    copia.atualizadoEm = copia.criadoEm;
    dados.cards.push(copia);
    salvar(); render();
    toast("Negócio duplicado.");
    return;
  }
  if(fn === "excluir"){
    const ok = await confirmar(
      `Excluir "${card.nome}" e todo o histórico de atividades dele? Não é possível desfazer.`,
      { titulo:"Excluir negócio", ok:"Excluir", perigo:true }
    );
    if(!ok) return;
    dados.cards = dados.cards.filter(c => c.id !== card.id);
    salvar(); render();
    toast("Negócio excluído.");
  }
}

async function definirStatus(cardId, status){
  const card = dados.cards.find(c => c.id === cardId);
  if(!card) return;
  if(status === "perdido"){
    // o modelo do Agendor tem colunas para isso — vale registrar
    const motivo = await pedirTexto("Marcar como perdido", "Motivo da perda (Preço, Concorrente, Sem retorno...)", card.motivoPerda || "");
    if(motivo !== null) card.motivoPerda = motivo;
  }
  card.status = status;
  card.atualizadoEm = new Date().toISOString();
  if(status === "ganho" && !card.dataConclusao){
    card.dataConclusao = new Date().toISOString().slice(0,10);
  }
  salvar(); render();
  if(document.getElementById("dealOverlay").classList.contains("show")) renderNegocio();
  toast(status === "ganho" ? "Negócio marcado como ganho." :
        status === "perdido" ? "Negócio marcado como perdido." : "Negócio reaberto.");
}
