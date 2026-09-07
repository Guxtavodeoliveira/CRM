/* =========================================================
   segmentos.js — segmentos do negócio.

   Cada FUNIL tem a sua própria lista de segmentos (nome + cor).
   Um negócio pode ter nenhum, um ou vários. Nada disso é
   obrigatório: negócio sem segmento continua funcionando igual.

   Aqui dentro estão três coisas:
     1. o cadastro da lista (modal "Segmentos")
     2. os chips no cartão e o seletor de marcar/desmarcar
     3. o filtro do funil (segmento, estado e cidade)
   ========================================================= */

/* A paleta fixa (CORES_SEGMENTO) e corDeSegmento() ficam em util.js,
   junto das outras cores do sistema. */

/* ---------------- leitura da lista ---------------- */
function listaSegmentos(){
  if(!dados || !Array.isArray(dados.segmentos)) return [];
  return dados.segmentos.slice().sort((a,b) => (a.posicao || 0) - (b.posicao || 0));
}
function segmentoPorId(id){
  if(!dados || !Array.isArray(dados.segmentos)) return null;
  return dados.segmentos.find(s => s.id === id) || null;
}
/** Segmentos do cartão, na ordem do cadastro, sem os que já não existem. */
function segmentosDoCartao(card){
  const ids = Array.isArray(card && card.segmentos) ? card.segmentos : [];
  return listaSegmentos().filter(s => ids.includes(s.id));
}
function quantosUsam(segId){
  return (dados.cards || []).filter(c => (c.segmentos || []).includes(segId)).length;
}

/* =========================================================
   1. CHIPS NO CARTÃO
   ========================================================= */
/** Rodapé de segmentos do cartão: chips lado a lado, ou o link discreto. */
function htmlSegmentosCartao(card){
  const segs = segmentosDoCartao(card);
  if(!segs.length){
    return `<div class="card-segs">
      <button class="seg-add" data-seg-add="${esc(card.id)}" title="Adicionar segmento">+ adicionar segmento</button>
    </div>`;
  }
  return `<div class="card-segs">
    ${segs.map(s => `
      <span class="seg-chip" style="background:${corDeSegmento(s.cor)}1A;color:${corDeSegmento(s.cor)}">
        <span class="seg-chip-txt">${esc(s.nome)}</span>
        <button class="seg-x" data-seg-rm="${esc(card.id)}" data-seg-id="${esc(s.id)}"
                title="Tirar ${esc(s.nome)} deste negócio" aria-label="Tirar ${esc(s.nome)}">${icon("x",9,3)}</button>
      </span>`).join("")}
    <button class="seg-mais" data-seg-add="${esc(card.id)}" title="Adicionar segmento" aria-label="Adicionar segmento">${icon("plus",11,3)}</button>
  </div>`;
}

/** Liga os botões do rodapé de segmentos de um cartão já desenhado. */
function ligarSegmentosCartao(el, card){
  el.querySelectorAll("[data-seg-add]").forEach(b => {
    b.onclick = e => { e.stopPropagation(); abrirSeletorSegmentos(card.id, b); };
  });
  el.querySelectorAll("[data-seg-rm]").forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      tirarSegmentoDoCartao(card.id, b.dataset.segId);
    };
  });
}

/** Redesenha só o rodapé de segmentos, sem refazer o quadro inteiro. */
function atualizarChipsCartao(card){
  const el = document.querySelector('.card[data-card-id="' + card.id + '"]');
  if(!el) return;
  const molde = document.createElement("div");
  molde.innerHTML = htmlSegmentosCartao(card);
  const nova = molde.firstElementChild;
  const antiga = el.querySelector(".card-segs");
  if(antiga) antiga.replaceWith(nova);
  else el.appendChild(nova);
  ligarSegmentosCartao(el, card);
}

function marcarSegmentoNoCartao(cardId, segId, marcar){
  const card = (dados.cards || []).find(c => c.id === cardId);
  if(!card) return null;
  if(!Array.isArray(card.segmentos)) card.segmentos = [];
  const tem = card.segmentos.includes(segId);
  if(marcar && !tem) card.segmentos.push(segId);
  if(!marcar && tem) card.segmentos = card.segmentos.filter(x => x !== segId);
  if(tem !== marcar){
    card.atualizadoEm = new Date().toISOString();
    salvar();
  }
  return card;
}

function tirarSegmentoDoCartao(cardId, segId){
  const card = marcarSegmentoNoCartao(cardId, segId, false);
  if(!card) return;
  atualizarChipsCartao(card);
  // o cartão pode sair do filtro atual: redesenha o quadro
  if(filtroSegmentos.length) render();
  else renderFiltrosBoard();
}

/* =========================================================
   2. SELETOR (popover) — marcar mais de um segmento
   ========================================================= */
let segPopCard = null;
let segPopSujo = false;      // mexeu em algo: ao fechar, redesenha o quadro
let segPopAberto = 0;        // instante em que abriu (ver o fechar por rolagem)

function abrirSeletorSegmentos(cardId, botao){
  const card = (dados.cards || []).find(c => c.id === cardId);
  if(!card) return;
  segPopCard = cardId;
  segPopSujo = false;
  segPopAberto = Date.now();

  const pop = document.getElementById("segPop");
  if(!pop) return;
  const lista = listaSegmentos();
  const marcados = card.segmentos || [];

  pop.innerHTML = `
    <div class="ctx-head">Segmentos deste funil</div>
    ${lista.length
      ? lista.map(s => `
        <label class="seg-op">
          <input type="checkbox" data-seg="${esc(s.id)}" ${marcados.includes(s.id) ? "checked" : ""}>
          <i class="seg-cor" style="background:${corDeSegmento(s.cor)}"></i>
          <span>${esc(s.nome)}</span>
        </label>`).join("")
      : `<div class="menu-vazio">Nenhum segmento cadastrado neste funil ainda.</div>`}
    <hr>
    <button class="seg-cad" id="segPopCadastrar">
      <span class="ic">${icon("edit",14,2)}</span>Cadastrar segmentos
    </button>
  `;

  pop.classList.add("show");
  posicionarSeletor(pop, botao);

  pop.querySelectorAll("[data-seg]").forEach(inp => {
    inp.onchange = () => {
      const c = marcarSegmentoNoCartao(segPopCard, inp.dataset.seg, inp.checked);
      if(c) atualizarChipsCartao(c);
      segPopSujo = true;
    };
  });
  const cad = pop.querySelector("#segPopCadastrar");
  if(cad) cad.onclick = () => { fecharSeletorSegmentos(); abrirCadastroSegmentos(); };
}

/** Abre logo abaixo do botão, sem sair da tela. */
function posicionarSeletor(pop, botao){
  const r = botao.getBoundingClientRect();
  const p = pop.getBoundingClientRect();
  const x = Math.min(r.left, window.innerWidth - p.width - 10);
  let y = r.bottom + 6;
  if(y + p.height > window.innerHeight - 8) y = Math.max(8, r.top - p.height - 6);
  pop.style.left = Math.max(8, x) + "px";
  pop.style.top = y + "px";
}

function fecharSeletorSegmentos(){
  const pop = document.getElementById("segPop");
  if(!pop || !pop.classList.contains("show")) return;
  pop.classList.remove("show");
  segPopCard = null;
  if(segPopSujo){ segPopSujo = false; render(); }
}

/* =========================================================
   3. CADASTRO DA LISTA (modal)
   ========================================================= */
let segEditandoId = null;
let segCorEscolhida = COR_SEGMENTO_PADRAO;

function abrirCadastroSegmentos(){
  segEditandoId = null;
  segCorEscolhida = COR_SEGMENTO_PADRAO;
  renderCadastroSegmentos();
  document.getElementById("segOverlay").classList.add("show");
  setTimeout(() => { const i = document.getElementById("segNome"); if(i) i.focus(); }, 80);
}

function fecharCadastroSegmentos(){
  document.getElementById("segOverlay").classList.remove("show");
  segEditandoId = null;
}

function renderCadastroSegmentos(){
  const lista = listaSegmentos();
  const editando = segEditandoId ? segmentoPorId(segEditandoId) : null;

  document.getElementById("segFunil").textContent =
    "Valem só para o funil " + ((dados && dados.boardName) || "atual") + ".";

  // o que a pessoa já digitou não some ao trocar de cor: só ao editar é que
  // o campo recebe o nome do segmento escolhido
  if(editando) document.getElementById("segNome").value = editando.nome;

  renderPaletaSegmentos();

  document.getElementById("segSalvar").textContent = editando ? "Salvar alterações" : "Adicionar segmento";
  document.getElementById("segCancelarEdicao").classList.toggle("hidden", !editando);

  document.getElementById("segLista").innerHTML = lista.length
    ? lista.map(s => {
        const uso = quantosUsam(s.id);
        return `
        <div class="seg-linha${s.id === segEditandoId ? " editando" : ""}">
          <span class="seg-chip" style="background:${corDeSegmento(s.cor)}1A;color:${corDeSegmento(s.cor)}">
            <span class="seg-chip-txt">${esc(s.nome)}</span>
          </span>
          <span class="seg-uso">${uso ? uso + (uso === 1 ? " negócio" : " negócios") : "sem uso"}</span>
          <button class="icon-btn" data-seg-editar="${esc(s.id)}" title="Editar" aria-label="Editar ${esc(s.nome)}">${icon("edit",15,1.9)}</button>
          <button class="icon-btn perigo" data-seg-excluir="${esc(s.id)}" title="Excluir" aria-label="Excluir ${esc(s.nome)}">${icon("trash",15,1.9)}</button>
        </div>`;
      }).join("")
    : `<div class="empty-state">Nenhum segmento cadastrado ainda. Crie o primeiro acima.</div>`;

  ligarCadastroSegmentos();
}

/** Só as bolinhas de cor — trocar de cor não redesenha o resto. */
function renderPaletaSegmentos(){
  const box = document.getElementById("segPaleta");
  if(!box) return;
  box.innerHTML = CORES_SEGMENTO.map(c => `
    <button type="button" class="seg-swatch${c.cor === segCorEscolhida ? " on" : ""}"
            data-cor="${c.cor}" style="background:${c.cor}" title="${esc(c.nome)}" aria-label="${esc(c.nome)}">
      ${c.cor === segCorEscolhida ? icon("check",12,3) : ""}
    </button>`).join("");
  box.querySelectorAll("[data-cor]").forEach(b => {
    b.onclick = () => { segCorEscolhida = b.dataset.cor; renderPaletaSegmentos(); };
  });
}

function ligarCadastroSegmentos(){
  document.querySelectorAll("#segLista [data-seg-editar]").forEach(b => {
    b.onclick = () => {
      const s = segmentoPorId(b.dataset.segEditar);
      if(!s) return;
      segEditandoId = s.id;
      segCorEscolhida = corDeSegmento(s.cor);
      renderCadastroSegmentos();
      const i = document.getElementById("segNome");
      i.focus(); i.select();
    };
  });
  document.querySelectorAll("#segLista [data-seg-excluir]").forEach(b => {
    b.onclick = () => excluirSegmento(b.dataset.segExcluir);
  });
}

function salvarSegmento(){
  const inp = document.getElementById("segNome");
  const nome = (inp.value || "").trim();
  if(!nome){ toast("Escreva o nome do segmento.", "err"); inp.focus(); return; }

  const repetido = listaSegmentos().some(s =>
    s.id !== segEditandoId && chaveTexto(s.nome) === chaveTexto(nome));
  if(repetido){ toast("Já existe um segmento com esse nome neste funil.", "err"); inp.focus(); return; }

  if(!Array.isArray(dados.segmentos)) dados.segmentos = [];

  if(segEditandoId){
    const s = segmentoPorId(segEditandoId);
    if(s){ s.nome = nome; s.cor = corDeSegmento(segCorEscolhida); }
    segEditandoId = null;
    toast("Segmento atualizado.");
  }else{
    dados.segmentos.push({
      id: uid(), nome, cor: corDeSegmento(segCorEscolhida),
      posicao: dados.segmentos.length
    });
    toast("Segmento criado.");
  }

  segCorEscolhida = COR_SEGMENTO_PADRAO;
  salvar();
  renderCadastroSegmentos();
  render();
  inp.value = "";
  inp.focus();
}

async function excluirSegmento(id){
  const s = segmentoPorId(id);
  if(!s) return;
  const uso = quantosUsam(id);
  const msg = uso
    ? `${uso} negócio(s) usam o segmento "${s.nome}". Ao excluir, ele sai desses negócios — nada mais é apagado.`
    : `Excluir o segmento "${s.nome}"?`;
  const ok = await confirmar(msg, { titulo:"Excluir segmento", ok:"Excluir", perigo:true });
  if(!ok) return;

  dados.segmentos = (dados.segmentos || []).filter(x => x.id !== id);
  (dados.cards || []).forEach(c => {
    if((c.segmentos || []).includes(id)){
      c.segmentos = c.segmentos.filter(x => x !== id);
      c.atualizadoEm = new Date().toISOString();
    }
  });
  dados.segmentos.forEach((x,i) => { x.posicao = i; });
  filtroSegmentos = filtroSegmentos.filter(x => x !== id);

  if(segEditandoId === id) segEditandoId = null;
  salvar();
  renderCadastroSegmentos();
  render();
  toast("Segmento excluído.");
}

/* =========================================================
   4. FILTRO DO QUADRO (só visualização, não muda dado)
   ========================================================= */
let filtroSegmentos = [];      // ids marcados — OU entre eles
let filtroUF = "todos";
let filtroCidade = "todas";

/** Regra do filtro: E entre os três, OU dentro dos segmentos. */
function cartaoPassaNoFiltro(card){
  if(filtroSegmentos.length){
    const meus = card.segmentos || [];
    if(!filtroSegmentos.some(id => meus.includes(id))) return false;
  }
  if(filtroUF !== "todos" && (card.estado || "") !== filtroUF) return false;
  if(filtroCidade !== "todas" && chaveTexto(card.cidade) !== filtroCidade) return false;
  return true;
}

function filtroBoardAtivo(){
  return !!(filtroSegmentos.length || filtroUF !== "todos" || filtroCidade !== "todas");
}

/** Estados que realmente existem entre os clientes do funil. */
function estadosDoFunil(){
  const set = new Set();
  (dados.cards || []).forEach(c => { if(c.estado) set.add(c.estado); });
  return [...set].sort();
}

/** Cidades do estado escolhido (ou de todos, quando não há estado). */
function cidadesDoFunil(){
  const mapa = new Map();
  (dados.cards || []).forEach(c => {
    if(!c.cidade) return;
    if(filtroUF !== "todos" && (c.estado || "") !== filtroUF) return;
    const k = chaveTexto(c.cidade);
    if(!mapa.has(k)) mapa.set(k, { chave:k, nome:c.cidade.trim(), uf:c.estado || "" });
  });
  return [...mapa.values()].sort((a,b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Some com o que ficou impossível (segmento excluído, cidade inexistente). */
function ajustarFiltrosBoard(){
  const ids = listaSegmentos().map(s => s.id);
  filtroSegmentos = filtroSegmentos.filter(id => ids.includes(id));
  if(filtroUF !== "todos" && !estadosDoFunil().includes(filtroUF)){
    filtroUF = "todos"; filtroCidade = "todas";
  }
  if(filtroCidade !== "todas" && !cidadesDoFunil().some(c => c.chave === filtroCidade)){
    filtroCidade = "todas";
  }
}

function limparFiltrosBoard(){
  filtroSegmentos = [];
  filtroUF = "todos";
  filtroCidade = "todas";
  render();
}

/** Desenha a barra de filtro. Chamada no fim de cada render do quadro. */
function renderFiltrosBoard(){
  const barra = document.getElementById("filtrosBoard");
  if(!barra || !dados) return;
  ajustarFiltrosBoard();

  const segs = listaSegmentos();
  const ufs = estadosDoFunil();
  const cidades = cidadesDoFunil();

  const rotulo = document.getElementById("fSegLabel");
  if(rotulo){
    rotulo.textContent = !filtroSegmentos.length
      ? "Segmento: todos"
      : filtroSegmentos.length === 1
        ? "Segmento: " + ((segmentoPorId(filtroSegmentos[0]) || {}).nome || "")
        : "Segmentos: " + filtroSegmentos.length;
  }
  const btnSeg = document.getElementById("fSegBtn");
  if(btnSeg) btnSeg.classList.toggle("on", filtroSegmentos.length > 0);

  document.getElementById("fSegLista").innerHTML = segs.length
    ? segs.map(s => `
      <label class="seg-op">
        <input type="checkbox" data-fseg="${esc(s.id)}" ${filtroSegmentos.includes(s.id) ? "checked" : ""}>
        <i class="seg-cor" style="background:${corDeSegmento(s.cor)}"></i>
        <span>${esc(s.nome)}</span>
      </label>`).join("")
    : `<div class="menu-vazio">Nenhum segmento cadastrado neste funil ainda.</div>`;

  document.getElementById("fEstado").innerHTML =
    `<option value="todos">Todos</option>` +
    ufs.map(u => `<option value="${esc(u)}" ${u === filtroUF ? "selected" : ""}>${esc(u)}</option>`).join("");

  document.getElementById("fCidade").innerHTML =
    `<option value="todas">Todas</option>` +
    cidades.map(c => `<option value="${esc(c.chave)}" ${c.chave === filtroCidade ? "selected" : ""}>${esc(c.nome)}${filtroUF === "todos" && c.uf ? " - " + esc(c.uf) : ""}</option>`).join("");

  const escondidos = (dados.cards || []).filter(c => !cartaoPassaNoFiltro(c)).length;
  const info = document.getElementById("fInfo");
  if(info){
    info.textContent = filtroBoardAtivo() && escondidos
      ? escondidos + (escondidos === 1 ? " negócio fora do filtro" : " negócios fora do filtro")
      : "";
  }
  document.getElementById("fLimpar").classList.toggle("hidden", !filtroBoardAtivo());

  /* eventos */
  document.querySelectorAll("#fSegLista [data-fseg]").forEach(inp => {
    inp.onchange = () => {
      const id = inp.dataset.fseg;
      if(inp.checked){ if(!filtroSegmentos.includes(id)) filtroSegmentos.push(id); }
      else filtroSegmentos = filtroSegmentos.filter(x => x !== id);
      render();   // o menu segue aberto: dá para marcar vários seguidos
    };
  });
}

/* ---------------- ligação inicial ---------------- */
function ligarSegmentos(){
  /* botão "Segmentos" da barra */
  const btnCad = document.getElementById("segBtn");
  if(btnCad) btnCad.onclick = abrirCadastroSegmentos;

  /* modal do cadastro */
  const ov = document.getElementById("segOverlay");
  if(ov){
    document.getElementById("segFechar").onclick = fecharCadastroSegmentos;
    document.getElementById("segPronto").onclick = fecharCadastroSegmentos;
    document.getElementById("segSalvar").onclick = salvarSegmento;
    document.getElementById("segCancelarEdicao").onclick = () => {
      segEditandoId = null;
      segCorEscolhida = COR_SEGMENTO_PADRAO;
      renderCadastroSegmentos();
    };
    document.getElementById("segNome").onkeydown = e => {
      if(e.key === "Enter"){ e.preventDefault(); salvarSegmento(); }
    };
    ov.addEventListener("click", e => { if(e.target.id === "segOverlay") fecharCadastroSegmentos(); });
  }

  /* menu de segmentos do filtro */
  const fBtn = document.getElementById("fSegBtn");
  const fMenu = document.getElementById("fSegMenu");
  if(fBtn && fMenu){
    fBtn.onclick = e => {
      e.stopPropagation();
      const aberto = fMenu.classList.toggle("show");
      fBtn.setAttribute("aria-expanded", aberto ? "true" : "false");
    };
    fMenu.onclick = e => e.stopPropagation();
    document.addEventListener("click", () => {
      fMenu.classList.remove("show");
      fBtn.setAttribute("aria-expanded", "false");
    });
  }

  const fEstado = document.getElementById("fEstado");
  if(fEstado) fEstado.onchange = e => {
    filtroUF = e.target.value;
    filtroCidade = "todas";        // trocar de estado sempre solta a cidade
    render();
  };
  const fCidade = document.getElementById("fCidade");
  if(fCidade) fCidade.onchange = e => { filtroCidade = e.target.value; render(); };

  const fLimpar = document.getElementById("fLimpar");
  if(fLimpar) fLimpar.onclick = limparFiltrosBoard;

  const fSegLimpar = document.getElementById("fSegLimpar");
  if(fSegLimpar) fSegLimpar.onclick = () => { filtroSegmentos = []; render(); };

  const fSegCadastrar = document.getElementById("fSegCadastrar");
  if(fSegCadastrar) fSegCadastrar.onclick = () => {
    document.getElementById("fSegMenu").classList.remove("show");
    abrirCadastroSegmentos();
  };

  /* o seletor do cartão fecha ao clicar fora, ao rolar ou ao sair da aba */
  document.addEventListener("click", e => {
    if(!e.target.isConnected) return;      // alvo redesenhado: não é clique fora
    if(e.target.closest("#segPop") || e.target.closest("[data-seg-add]")) return;
    fecharSeletorSegmentos();
  });
  document.addEventListener("scroll", () => {
    if(Date.now() - segPopAberto < 500) return;   // a rolagem que o navegador faz ao abrir
    fecharSeletorSegmentos();
  }, true);
  window.addEventListener("blur", fecharSeletorSegmentos);
}
