/* =========================================================
   produtos.js — tabela de preços do funil.

   Cada FUNIL tem a sua própria lista de produtos, organizada
   em linhas e sublinhas:

     Papel para sublimação          (linha)
       └ Fast Dry                   (sublinha)
           └ Bobina 90g 1,60x100m   (produto)

   Cada produto guarda três preços POR UNIDADE — mínimo, médio
   e máximo — e uma anotação livre que só aparece aqui: nunca
   vai para o pedido, para a ficha em PDF ou para relatório.

   Nada disso é obrigatório: quem preferir continuar digitando
   o produto na mão, na hora do pedido, continua podendo.
   ========================================================= */

/* ---------------- leitura ---------------- */
function linhasProduto(){
  if(!dados || !Array.isArray(dados.linhasProduto)) return [];
  return dados.linhasProduto.slice().sort((a,b) => (a.posicao || 0) - (b.posicao || 0));
}
function linhasRaiz(){ return linhasProduto().filter(l => !l.paiId); }
function sublinhasDe(paiId){ return linhasProduto().filter(l => l.paiId === paiId); }
function linhaPorId(id){ return linhasProduto().find(l => l.id === id) || null; }

function listaProdutos(){
  if(!dados || !Array.isArray(dados.produtos)) return [];
  return dados.produtos.slice().sort((a,b) => (a.posicao || 0) - (b.posicao || 0));
}
function produtoPorId(id){ return listaProdutos().find(p => p.id === id) || null; }
function produtosDaLinha(linhaId){ return listaProdutos().filter(p => p.linhaId === linhaId); }

/** Produtos que ficaram sem linha (a linha foi excluída, por exemplo). */
function produtosSemLinha(){
  const ids = new Set(linhasProduto().map(l => l.id));
  return listaProdutos().filter(p => !p.linhaId || !ids.has(p.linhaId));
}

/** "Linha › Sublinha" — usado na ficha do pedido e nos relatórios. */
function caminhoProduto(p){
  if(!p) return "";
  const l = linhaPorId(p.linhaId);
  if(!l) return "";
  const pai = l.paiId ? linhaPorId(l.paiId) : null;
  return pai ? pai.nome + " › " + l.nome : l.nome;
}

/**
 * Todos os produtos do funil na ordem em que aparecem na tela,
 * já com o nome da linha e da sublinha. É o que alimenta a lista
 * do pedido e o relatório de produtos.
 */
function produtosEmOrdem(){
  const out = [];
  const juntar = (p, linha, sub) => out.push({ ...p, linha, sub });
  produtosSemLinha().forEach(p => juntar(p, "", ""));
  linhasRaiz().forEach(l => {
    produtosDaLinha(l.id).forEach(p => juntar(p, l.nome, ""));
    sublinhasDe(l.id).forEach(s => produtosDaLinha(s.id).forEach(p => juntar(p, l.nome, s.nome)));
  });
  return out;
}

/** Acha o produto do funil pelo nome digitado (sem acento, sem caixa). */
function produtoPorNome(nome){
  const k = chaveTexto(nome);
  if(!k) return null;
  return listaProdutos().find(p => chaveTexto(p.nome) === k) || null;
}

/** "" (dentro), "abaixo" ou "acima". Preço 0 ou faixa não cadastrada nunca avisa. */
function foraDaFaixa(prod, valor){
  const v = Number(valor) || 0;
  if(!prod || !v) return "";
  const min = Number(prod.precoMin) || 0;
  const max = Number(prod.precoMax) || 0;
  if(min && v < min) return "abaixo";
  if(max && v > max) return "acima";
  return "";
}

/** Texto curto da faixa: "R$ 6,90 · R$ 8,00 · R$ 9,40". */
function textoFaixa(prod){
  const partes = [];
  if(Number(prod.precoMin)) partes.push(`<span class="fx-min">${moeda(prod.precoMin)}</span>`);
  if(Number(prod.precoMed)) partes.push(`<span class="fx-med">${moeda(prod.precoMed)}</span>`);
  if(Number(prod.precoMax)) partes.push(`<span class="fx-max">${moeda(prod.precoMax)}</span>`);
  return partes.join(" · ");
}

/** Mesma faixa em texto puro, para title="" e planilha. */
function textoSimplesFaixa(prod){
  if(!prod) return "";
  const partes = [];
  if(Number(prod.precoMin)) partes.push("mín " + moeda(prod.precoMin));
  if(Number(prod.precoMed)) partes.push("médio " + moeda(prod.precoMed));
  if(Number(prod.precoMax)) partes.push("máx " + moeda(prod.precoMax));
  return partes.join(" · ") || "sem preço cadastrado";
}

/* =========================================================
   Modal de cadastro
   ========================================================= */
let prodBusca = "";
const prodFechadas = new Set();      // linhas recolhidas
let prodForm = null;                 // { tipo:"produto"|"linha"|"sublinha", paiId }
let prodEditando = null;             // id do produto aberto para editar
let prodRenomeando = null;           // id da linha/sublinha sendo renomeada

function abrirCadastroProdutos(){
  prodBusca = ""; prodForm = null; prodEditando = null; prodRenomeando = null;
  const b = document.getElementById("prodBusca");
  if(b) b.value = "";
  renderCadastroProdutos();
  document.getElementById("prodOverlay").classList.add("show");
  document.querySelector("#prodOverlay .modal-body").scrollTop = 0;
}

function fecharCadastroProdutos(){
  document.getElementById("prodOverlay").classList.remove("show");
  prodForm = null; prodEditando = null; prodRenomeando = null;
}

function bateBusca(txt){
  return !prodBusca || chaveTexto(txt).includes(prodBusca);
}

function htmlProdutoLinhaTabela(p, solto){
  if(prodEditando === p.id) return formProduto(p, p.linhaId);
  return `
  <div class="pr-item${solto ? " solto" : ""}">
    <span class="pr-item-nome">${esc(p.nome)}${p.observacao
      ? `<span class="pr-marca" title="Você tem uma anotação neste produto">${icon("note",11,2)}</span>` : ""}</span>
    <span class="pr-preco min">${Number(p.precoMin) ? moeda(p.precoMin) : "—"}</span>
    <span class="pr-preco med">${Number(p.precoMed) ? moeda(p.precoMed) : "—"}</span>
    <span class="pr-preco max">${Number(p.precoMax) ? moeda(p.precoMax) : "—"}</span>
    <span class="pr-acts">
      <button class="icon-btn" type="button" data-pedit="${esc(p.id)}" title="Editar" aria-label="Editar ${esc(p.nome)}">${icon("edit",14,1.9)}</button>
      <button class="icon-btn perigo" type="button" data-pdel="${esc(p.id)}" title="Excluir" aria-label="Excluir ${esc(p.nome)}">${icon("trash",14,1.9)}</button>
    </span>
  </div>`;
}

function formProduto(p, linhaId){
  return `
  <div class="pr-form" data-form>
    <div class="field">
      <label for="prd_nome">Nome do produto</label>
      <input class="inp" id="prd_nome" autocomplete="off" maxlength="120"
             placeholder="Ex.: Bobina Papel Fast Dry 90g · 1,60m x 100m" value="${p ? esc(p.nome) : ""}">
    </div>
    <div class="field">
      <label for="prd_min" class="lb-min">Preço mínimo</label>
      <input class="inp num" id="prd_min" inputmode="decimal" placeholder="R$ 0,00"
             value="${p && Number(p.precoMin) ? moeda(p.precoMin) : ""}">
    </div>
    <div class="field">
      <label for="prd_med" class="lb-med">Preço médio</label>
      <input class="inp num" id="prd_med" inputmode="decimal" placeholder="R$ 0,00"
             value="${p && Number(p.precoMed) ? moeda(p.precoMed) : ""}">
    </div>
    <div class="field">
      <label for="prd_max" class="lb-max">Preço máximo</label>
      <input class="inp num" id="prd_max" inputmode="decimal" placeholder="R$ 0,00"
             value="${p && Number(p.precoMax) ? moeda(p.precoMax) : ""}">
    </div>
    <div class="acoes">
      <button class="btn btn-primary btn-sm" type="button" data-psalvar="${esc(linhaId || "")}">${p ? "Salvar" : "Adicionar"}</button>
      <button class="btn btn-sm" type="button" data-pcancelar>Cancelar</button>
    </div>
    <div class="field pr-obs">
      <label for="prd_obs">Anotação — só para você
        <span class="pr-obs-tag">não aparece no pedido nem no PDF</span></label>
      <textarea class="inp" id="prd_obs" rows="2"
        placeholder="Prazo da fábrica, com quem falar, quando dá para descer do mínimo...">${p ? esc(p.observacao || "") : ""}</textarea>
    </div>
  </div>`;
}

function formLinha(tipo, paiId, linha){
  return `
  <div class="pr-form so-nome" data-form>
    <div class="field">
      <label for="prl_nome">Nome da ${tipo}</label>
      <input class="inp" id="prl_nome" autocomplete="off" maxlength="80"
             placeholder="${tipo === "linha" ? "Ex.: Papel para sublimação" : "Ex.: Fast Dry"}"
             value="${linha ? esc(linha.nome) : ""}">
    </div>
    <div class="acoes">
      <button class="btn btn-primary btn-sm" type="button" data-lsalvar="${esc(paiId || "")}" data-ltipo="${tipo}">${linha ? "Salvar" : "Adicionar"}</button>
      <button class="btn btn-sm" type="button" data-pcancelar>Cancelar</button>
    </div>
  </div>`;
}

function renderCadastroProdutos(){
  const box = document.getElementById("prodArvore");
  if(!box || !dados) return;

  document.getElementById("prodFunil").textContent =
    `Valem só para o funil ${(dados && dados.boardName) || "atual"} · ` +
    `${listaProdutos().length} produto(s) em ${linhasRaiz().length} linha(s)`;

  const soltos = produtosSemLinha().filter(p => bateBusca(p.nome));
  let achou = soltos.length;

  let html = "";

  if(soltos.length){
    html += `<div class="pr-linha">
      <div class="pr-linha-cab">
        <span class="pr-nome">Sem linha</span>
        <span class="pr-conta">${soltos.length} produto(s)</span>
      </div>
      ${soltos.map(p => htmlProdutoLinhaTabela(p, true)).join("")}
    </div>`;
  }

  html += linhasRaiz().map(l => {
    const fechada = prodFechadas.has(l.id) && !prodBusca;
    const diretos = produtosDaLinha(l.id).filter(p => bateBusca(p.nome) || bateBusca(l.nome));
    const subs = sublinhasDe(l.id);
    let total = produtosDaLinha(l.id).length;
    subs.forEach(s => { total += produtosDaLinha(s.id).length; });

    const htmlSubs = subs.map(s => {
      const itens = produtosDaLinha(s.id).filter(p =>
        bateBusca(p.nome) || bateBusca(s.nome) || bateBusca(l.nome));
      achou += itens.length;
      if(prodBusca && !itens.length) return "";
      return `
      <div class="pr-sub">
        <div class="pr-sub-cab">
          ${prodRenomeando === s.id ? formLinha("sublinha", l.id, s) : `
            <span class="pr-nome">${esc(s.nome)}</span>
            <span class="pr-conta">${produtosDaLinha(s.id).length} produto(s)</span>
            <span class="pr-acts">
              <button class="icon-btn" type="button" data-lrename="${esc(s.id)}" title="Renomear sublinha">${icon("edit",13,1.9)}</button>
              <button class="icon-btn perigo" type="button" data-ldel="${esc(s.id)}" title="Excluir sublinha">${icon("trash",13,1.9)}</button>
            </span>`}
        </div>
        ${itens.map(p => htmlProdutoLinhaTabela(p, false)).join("")}
        ${prodForm && prodForm.tipo === "produto" && prodForm.paiId === s.id
          ? formProduto(null, s.id)
          : `<div class="pr-add-fila fundo">
               <button class="pr-add" type="button" data-add="produto" data-pai="${esc(s.id)}">${icon("plus",12,2.6)} Produto nesta sublinha</button>
             </div>`}
      </div>`;
    }).join("");

    achou += diretos.length;
    if(prodBusca && !diretos.length && !htmlSubs) return "";

    return `
    <div class="pr-linha">
      <div class="pr-linha-cab">
        ${prodRenomeando === l.id ? formLinha("linha", null, l) : `
          <button class="pr-caret${fechada ? " fechado" : ""}" type="button" data-ltoggle="${esc(l.id)}"
                  aria-label="Abrir ou fechar ${esc(l.nome)}">${icon("dots",15,2.4)}</button>
          <span class="pr-nome">${esc(l.nome)}</span>
          <span class="pr-conta">${total} produto(s)${subs.length ? " · " + subs.length + " sublinha(s)" : ""}</span>
          <span class="pr-acts">
            <button class="icon-btn" type="button" data-lrename="${esc(l.id)}" title="Renomear linha">${icon("edit",14,1.9)}</button>
            <button class="icon-btn perigo" type="button" data-ldel="${esc(l.id)}" title="Excluir linha">${icon("trash",14,1.9)}</button>
          </span>`}
      </div>
      ${fechada ? "" : `
        ${diretos.map(p => htmlProdutoLinhaTabela(p, true)).join("")}
        ${htmlSubs}
        ${prodForm && prodForm.paiId === l.id
          ? (prodForm.tipo === "produto" ? formProduto(null, l.id) : formLinha("sublinha", l.id, null))
          : `<div class="pr-add-fila">
               <button class="pr-add" type="button" data-add="produto" data-pai="${esc(l.id)}">${icon("plus",12,2.6)} Produto direto nesta linha</button>
               <button class="pr-add" type="button" data-add="sublinha" data-pai="${esc(l.id)}">${icon("plus",12,2.6)} Sublinha</button>
             </div>`}
      `}
    </div>`;
  }).join("");

  if(prodForm && prodForm.tipo === "linha"){
    html += `<div class="pr-linha">${formLinha("linha", null, null)}</div>`;
  }

  if(!html){
    html = prodBusca
      ? `<div class="empty-state">Nenhum produto com esse nome neste funil.</div>`
      : `<div class="empty-state">Nenhum produto cadastrado ainda.<br>Comece criando uma <b>linha</b> (por exemplo: Papel para sublimação) e depois os produtos dentro dela.</div>`;
  } else if(prodBusca && !achou){
    html = `<div class="empty-state">Nenhum produto com esse nome neste funil.</div>`;
  }

  box.innerHTML = html;
  ligarArvoreProdutos();
}

function ligarArvoreProdutos(){
  const box = document.getElementById("prodArvore");

  box.querySelectorAll("[data-ltoggle]").forEach(b => b.onclick = () => {
    const id = b.dataset.ltoggle;
    prodFechadas.has(id) ? prodFechadas.delete(id) : prodFechadas.add(id);
    renderCadastroProdutos();
  });

  box.querySelectorAll("[data-add]").forEach(b => b.onclick = () => {
    prodForm = { tipo:b.dataset.add, paiId:b.dataset.pai };
    prodEditando = null; prodRenomeando = null;
    renderCadastroProdutos();
    focarForm();
  });

  box.querySelectorAll("[data-pedit]").forEach(b => b.onclick = () => {
    prodEditando = b.dataset.pedit;
    prodForm = null; prodRenomeando = null;
    renderCadastroProdutos();
    focarForm();
  });

  box.querySelectorAll("[data-lrename]").forEach(b => b.onclick = () => {
    prodRenomeando = b.dataset.lrename;
    prodForm = null; prodEditando = null;
    renderCadastroProdutos();
    focarForm();
  });

  box.querySelectorAll("[data-pcancelar]").forEach(b => b.onclick = () => {
    prodForm = null; prodEditando = null; prodRenomeando = null;
    renderCadastroProdutos();
  });

  box.querySelectorAll("[data-psalvar]").forEach(b => b.onclick = () => salvarProduto(b.dataset.psalvar));
  box.querySelectorAll("[data-lsalvar]").forEach(b => b.onclick = () => salvarLinha(b.dataset.lsalvar, b.dataset.ltipo));
  box.querySelectorAll("[data-pdel]").forEach(b => b.onclick = () => excluirProduto(b.dataset.pdel));
  box.querySelectorAll("[data-ldel]").forEach(b => b.onclick = () => excluirLinha(b.dataset.ldel));

  // dinheiro: formata ao sair do campo
  ["prd_min","prd_med","prd_max"].forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    el.onblur = () => { const v = parseMoeda(el.value); el.value = v ? moeda(v) : ""; };
  });
  const nome = document.getElementById("prd_nome");
  if(nome) nome.onkeydown = e => { if(e.key === "Enter"){ e.preventDefault(); document.getElementById("prd_min").focus(); } };
  const lnome = document.getElementById("prl_nome");
  if(lnome) lnome.onkeydown = e => {
    if(e.key === "Enter"){
      e.preventDefault();
      const b = document.querySelector("[data-lsalvar]");
      if(b) b.click();
    }
  };
}

function focarForm(){
  const el = document.querySelector("#prodArvore [data-form] .inp");
  if(el){ el.focus(); el.select && el.select(); }
}

/* ---------------- gravar ---------------- */
function salvarProduto(linhaId){
  const nome = (document.getElementById("prd_nome").value || "").trim();
  if(!nome){ toast("Escreva o nome do produto.", "err"); return; }

  const min = parseMoeda(document.getElementById("prd_min").value);
  const med = parseMoeda(document.getElementById("prd_med").value);
  const max = parseMoeda(document.getElementById("prd_max").value);
  const obs = (document.getElementById("prd_obs").value || "").trim();

  if(min && max && min > max){ toast("O preço mínimo ficou maior que o máximo.", "err"); return; }
  if(med && min && med < min){ toast("O preço médio ficou abaixo do mínimo.", "err"); return; }
  if(med && max && med > max){ toast("O preço médio ficou acima do máximo.", "err"); return; }

  const repetido = listaProdutos().some(p =>
    p.id !== prodEditando && chaveTexto(p.nome) === chaveTexto(nome));
  if(repetido){ toast("Já existe um produto com esse nome neste funil.", "err"); return; }

  if(!Array.isArray(dados.produtos)) dados.produtos = [];

  if(prodEditando){
    const p = produtoPorId(prodEditando);
    if(p){
      const nomeAntigo = p.nome;
      p.nome = nome; p.precoMin = min; p.precoMed = med; p.precoMax = max;
      p.observacao = obs;
      p.atualizadoEm = new Date().toISOString();
      // o item do pedido guarda o nome: renomear o produto renomeia o histórico
      if(chaveTexto(nomeAntigo) !== chaveTexto(nome)) renomearNosPedidos(nomeAntigo, nome);
    }
    prodEditando = null;
    toast("Produto atualizado.");
  }else{
    dados.produtos.push({
      id: uid(), linhaId: linhaId || null, nome,
      precoMin: min, precoMed: med, precoMax: max,
      observacao: obs, posicao: dados.produtos.length,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    });
    prodForm = null;
    toast("Produto cadastrado.");
  }

  salvar();
  renderCadastroProdutos();
}

/** Mantém os pedidos apontando para o produto certo depois de um rename. */
function renomearNosPedidos(de, para){
  const k = chaveTexto(de);
  (dados.cards || []).forEach(c => {
    (c.pedidos || []).forEach(p => {
      (p.itens || []).forEach(it => {
        if(chaveTexto(it.produto) === k) it.produto = para;
      });
    });
  });
}

function salvarLinha(paiId, tipo){
  const nome = (document.getElementById("prl_nome").value || "").trim();
  if(!nome){ toast(`Escreva o nome da ${tipo}.`, "err"); return; }
  if(!Array.isArray(dados.linhasProduto)) dados.linhasProduto = [];

  if(prodRenomeando){
    const l = linhaPorId(prodRenomeando);
    if(l) l.nome = nome;
    prodRenomeando = null;
    toast("Nome alterado.");
  }else{
    const irmas = paiId ? sublinhasDe(paiId) : linhasRaiz();
    if(irmas.some(l => chaveTexto(l.nome) === chaveTexto(nome))){
      toast(`Já existe uma ${tipo} com esse nome aqui.`, "err"); return;
    }
    dados.linhasProduto.push({
      id: uid(), paiId: paiId || null, nome,
      posicao: dados.linhasProduto.length,
      criadoEm: new Date().toISOString()
    });
    prodForm = null;
    toast(tipo === "linha" ? "Linha criada." : "Sublinha criada.");
  }

  salvar();
  renderCadastroProdutos();
}

async function excluirProduto(id){
  const p = produtoPorId(id);
  if(!p) return;
  const usos = usosDoProduto(p);
  const msg = usos
    ? `"${p.nome}" aparece em ${usos} pedido(s) já lançados. Excluir tira ele da sua tabela de preços; os pedidos antigos continuam com o nome escrito e o valor que você fechou.`
    : `Excluir "${p.nome}" da tabela de preços?`;
  if(!(await confirmar(msg, { titulo:"Excluir produto", ok:"Excluir", perigo:true }))) return;

  dados.produtos = (dados.produtos || []).filter(x => x.id !== id);
  if(prodEditando === id) prodEditando = null;
  salvar();
  renderCadastroProdutos();
  toast("Produto excluído.");
}

/** Em quantos pedidos este produto já foi lançado. */
function usosDoProduto(p){
  const k = chaveTexto(p.nome);
  let n = 0;
  (dados.cards || []).forEach(c => (c.pedidos || []).forEach(ped => {
    if((ped.itens || []).some(it => chaveTexto(it.produto) === k)) n++;
  }));
  return n;
}

async function excluirLinha(id){
  const l = linhaPorId(id);
  if(!l) return;
  const subs = sublinhasDe(id);
  const ids = [id, ...subs.map(s => s.id)];
  const qtd = listaProdutos().filter(p => ids.includes(p.linhaId)).length;
  const tipo = l.paiId ? "sublinha" : "linha";

  const msg = qtd
    ? `A ${tipo} "${l.nome}" tem ${qtd} produto(s)${subs.length ? ` e ${subs.length} sublinha(s)` : ""}. Excluindo, os produtos NÃO são apagados: eles ficam no topo, em "Sem linha", e você reorganiza depois.`
    : `Excluir a ${tipo} "${l.nome}"?`;
  if(!(await confirmar(msg, { titulo:`Excluir ${tipo}`, ok:"Excluir", perigo:true }))) return;

  (dados.produtos || []).forEach(p => { if(ids.includes(p.linhaId)) p.linhaId = null; });
  dados.linhasProduto = (dados.linhasProduto || []).filter(x => !ids.includes(x.id));
  if(prodRenomeando && ids.includes(prodRenomeando)) prodRenomeando = null;
  salvar();
  renderCadastroProdutos();
  toast(tipo === "linha" ? "Linha excluída." : "Sublinha excluída.");
}

/* ---------------- ligação inicial ---------------- */
function ligarProdutos(){
  const btn = document.getElementById("prodBtn");
  if(btn) btn.onclick = abrirCadastroProdutos;

  const ov = document.getElementById("prodOverlay");
  if(!ov) return;

  document.getElementById("prodFechar").onclick = fecharCadastroProdutos;
  document.getElementById("prodPronto").onclick = fecharCadastroProdutos;
  document.getElementById("prodAddLinha").onclick = () => {
    prodForm = { tipo:"linha", paiId:null };
    prodEditando = null; prodRenomeando = null;
    renderCadastroProdutos();
    focarForm();
  };
  document.getElementById("prodBusca").oninput = e => {
    prodBusca = chaveTexto(e.target.value);
    renderCadastroProdutos();
  };
  ov.addEventListener("click", e => { if(e.target.id === "prodOverlay") fecharCadastroProdutos(); });
}
