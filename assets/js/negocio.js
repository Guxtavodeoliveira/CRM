/* =========================================================
   negocio.js — modal do negócio: etapas, atividades,
   dados do contato, ações rápidas.
   ========================================================= */

let negocioId = null;
let composerTipo = "nota";
let histAba = "todas";
const comentariosAbertos = new Set();   // ids de atividades com a thread aberta

/* ---------------- abrir / fechar ---------------- */
function abrirNegocio(cardId){
  negocioId = cardId;
  composerTipo = "nota";
  histAba = "todas";
  renderNegocio();
  document.getElementById("dealOverlay").classList.add("show");
}
function fecharNegocio(){
  document.getElementById("dealOverlay").classList.remove("show");
  negocioId = null;
}
function cardAtual(){ return dados.cards.find(c => c.id === negocioId); }

/* ---------------- render ---------------- */
function renderNegocio(){
  const card = cardAtual();
  if(!card) return fecharNegocio();
  const box = document.getElementById("dealContent");

  box.innerHTML = `
    ${cabecalho(card)}
    ${stepper(card)}
    <div class="deal-body">
      <div class="deal-col-left">
        ${histAba === "pedidos" ? "" : composer()}
        ${historico(card)}
      </div>
      <div class="deal-col-right">
        ${painelAcoes(card)}
        ${painelValor(card)}
        ${painelNegocio(card)}
        ${painelContato(card)}
        ${painelCodigo(card)}
      </div>
    </div>
  `;
  ligarNegocio(card);
}

/* ---------------- cabeçalho ---------------- */
function cabecalho(card){
  const stars = [1,2,3,4,5].map(n =>
    `<button data-star="${n}" class="${n <= (card.estrelas||0) ? "on" : ""}" title="${n} estrela(s)" aria-label="${n} estrelas">
       ${n <= (card.estrelas||0) ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.6 7 .9-5 4.7 1.3 7-6.3-3.5L5.7 21 7 14.2 2 9.5l7-.9z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3.5l2.7 5.9 6.3.8-4.5 4.2 1.1 6.2-5.6-3.1-5.6 3.1 1.1-6.2L3 10.2l6.3-.8z"/></svg>'}
     </button>`).join("");

  const periodo = card.dataInicio
    ? `${fmtData(card.dataInicio)}${card.dataConclusao ? " → " + fmtData(card.dataConclusao) : ""}`
    : "Período indefinido";

  return `
  <div class="deal-head">
    <div class="deal-title-row">
      <h2>${card.numero} - ${esc(card.nome)}</h2>
      <span class="period">${esc(periodo)}</span>
      <div class="deal-status">
        <button class="st-btn ${card.status === "perdido" ? "on-lost" : ""}" data-status="perdido">${icon("flag",14,2)} Perdido</button>
        <button class="st-btn ${card.status === "andamento" ? "on-open" : ""}" data-status="andamento">${icon("hour",14,2)} Em andamento</button>
        <button class="st-btn ${card.status === "ganho" ? "on-won" : ""}" data-status="ganho">${icon("trophy",14,2)} Ganho</button>
        <button class="icon-btn lg" id="dealEdit" title="Editar empresa">${icon("edit",16,2)}</button>
        <button class="icon-btn lg" id="dealClose" title="Fechar">${icon("x",17,2.2)}</button>
      </div>
    </div>
    <div class="deal-meta">
      <span class="deal-company">${icon("build",14,1.9)}${esc(card.nome)}</span>
      <span class="stars">${stars}</span>
      <span class="sep">·</span>
      <span class="avatar">${esc(iniciais(card.responsavel || dados.usuario))}</span>
      <span>${esc(card.responsavel || dados.usuario)}</span>
      ${card.categoria ? `<span class="sep">·</span><span>${esc(card.categoria)}</span>` : ""}
      ${card.origem ? `<span class="sep">·</span><span>Origem: ${esc(card.origem)}</span>` : ""}
    </div>
  </div>`;
}

/* ---------------- etapas ---------------- */
function stepper(card){
  const i = dados.columns.findIndex(c => c.id === card.columnId);
  const dias = diasDesde(card.etapaEm);
  const steps = dados.columns.map((col, idx) => {
    const cls = idx === i ? "current" : idx < i ? "done" : "";
    const badge = idx === i
      ? `<span class="days">${icon("clock",11,2.2)} ${dias === 0 ? "<1d" : dias + "d"}</span>`
      : "";
    return `<button class="step ${cls}" data-col="${col.id}" title="${esc(col.name)}">${esc(col.name)}${badge}</button>`;
  }).join("");

  return `
  <div class="stepper">
    <span class="funnel-name">${icon("note",14,1.9)} ${esc(dados.boardName)}</span>
    <button class="step-nav" id="stepPrev" ${i <= 0 ? "disabled" : ""} title="Etapa anterior">${icon("arrowl",15,2.2)}</button>
    <div class="steps">${steps}</div>
    <button class="step-nav" id="stepNext" ${i >= dados.columns.length-1 ? "disabled" : ""} title="Próxima etapa">${icon("arrowr",15,2.2)}</button>
  </div>`;
}

/* ---------------- composer ---------------- */
function composer(){
  const tabs = Object.entries(ACT_TYPES).map(([k,v]) =>
    `<button class="ctab ${k === composerTipo ? "on" : ""}" data-tipo="${k}">${icon(v.icon,14,1.9)} ${v.label}</button>`
  ).join("");

  return `
  <div class="composer">
    <div class="composer-tabs">${tabs}</div>
    <div class="composer-body">
      <textarea id="cpNota" placeholder="O que foi feito e qual o próximo passo?"></textarea>
    </div>
    <div class="composer-foot">
      <span class="when">${icon("clock",14,2)} Prazo</span>
      <input type="datetime-local" id="cpData" value="${toInputDT(proximaHoraCheia())}">
      <label class="check"><input type="checkbox" id="cpFeito"> Já concluída</label>
      <span class="grow"></span>
      <button class="btn btn-primary btn-sm" id="cpSalvar">${icon("plus",13,2.6)} Registrar atividade</button>
    </div>
  </div>`;
}

function proximaHoraCheia(){
  const d = new Date();
  d.setMinutes(0,0,0);
  d.setHours(d.getHours() + 1);
  return d;
}

/* ---------------- histórico ---------------- */
function historico(card){
  const todas = [...(card.agendamentos || [])].sort((a,b) => {
    const da = new Date(a.data || a.criadoEm), db = new Date(b.data || b.criadoEm);
    return da - db;
  });
  const lista = histAba === "whatsapp" ? todas.filter(a => a.tipo === "whatsapp") : todas;
  const qtdWa = todas.filter(a => a.tipo === "whatsapp").length;
  const qtdPed = (card.pedidos || []).length;

  const abas = `
  <div class="hist-tabs">
    <button class="htab ${histAba === "todas" ? "on" : ""}" data-hist="todas">${icon("check",14,2.2)} Histórico de atividades</button>
    <button class="htab ${histAba === "whatsapp" ? "on" : ""}" data-hist="whatsapp">${icon("whats",14,2)} WhatsApp ${qtdWa ? `<span class="badge-new">${qtdWa}</span>` : ""}</button>
    <button class="htab ${histAba === "pedidos" ? "on" : ""}" data-hist="pedidos">${icon("cart",14,2)} Pedidos ${qtdPed ? `<span class="badge-new">${qtdPed}</span>` : ""}</button>
  </div>`;

  if(histAba === "pedidos"){
    return abas + `<div id="histList">${abaPedidos(card)}</div>`;
  }

  return abas + `
  <div id="histList">
    ${lista.length ? lista.map(a => atividadeHtml(card, a)).join("")
      : `<div class="empty-state">Nenhuma atividade por aqui ainda.<br>Use o campo acima para registrar a próxima ligação, visita ou mensagem.</div>`}
  </div>`;
}

function atividadeHtml(card, a){
  const t = ACT_TYPES[a.tipo] || ACT_TYPES.nota;
  const late = !a.concluido && estaAtrasado(a.data);
  const dueCls = a.concluido ? "done" : late ? "late" : "soon";
  const dueTxt = a.concluido ? "Concluída" : (a.data ? "Prazo: " + fmtPrazo(a.data) : "Sem prazo");
  const autor = a.criadoPor || dados.usuario;
  const qtd = (a.comentarios || []).length;
  const aberta = comentariosAbertos.has(a.id);

  return `
  <div class="act ${a.concluido ? "done" : ""}">
    <div class="act-crumb">
      ${icon("build",12,2)} <span>${esc(card.nome)}</span>
      <span style="color:#D5D6E5">|</span>
      ${icon("note",12,2)} <b>${card.numero} - ${esc(card.nome)}</b>
    </div>
    <div class="act-main">
      <span class="act-ic" style="background:${t.color}14;color:${t.color}">${icon(t.icon,16,2)}</span>
      <div class="act-info">
        <div class="act-t">${esc(rotuloAtividade(a))}</div>
        <div class="act-when">${esc(fmtCriada(a.criadoEm))}</div>
      </div>
      <div class="act-right">
        <span class="due ${dueCls}">${esc(dueTxt)}</span>
        <label class="check"><input type="checkbox" data-done="${a.id}" ${a.concluido ? "checked" : ""}> Finalizar</label>
      </div>
    </div>
    ${a.nota ? `<div class="act-note">${esc(a.nota)}</div>` : ""}
    ${threadHtml(a)}
    <div class="act-foot">
      <span class="g">Criada por <span class="avatar">${esc(iniciais(autor))}</span></span>
      <span class="g">Responsável <span class="avatar">${esc(iniciais(card.responsavel || dados.usuario))}</span></span>
      <button class="cm ${aberta ? "on" : ""}" data-coment="${a.id}">
        ${icon("chat",13,2)} Comentários${qtd ? ` (${qtd})` : ""}
      </button>
      <button class="rm" data-del="${a.id}">Excluir</button>
    </div>
  </div>`;
}

/** Thread de comentários da atividade — resumo do que foi feito. */
function threadHtml(a){
  if(!comentariosAbertos.has(a.id)) return "";
  const lista = a.comentarios || [];
  return `
  <div class="thread">
    ${lista.length ? lista.map(k => `
      <div class="coment">
        <span class="avatar">${esc(iniciais(k.autor))}</span>
        <div class="coment-corpo">
          <div class="coment-topo">
            <b>${esc(k.autor)}</b>
            <span>${esc(fmtCriada(k.criadoEm).replace("Criada ",""))}</span>
            <button class="coment-rm" data-rmcoment="${a.id}|${k.id}" title="Excluir comentário">${icon("x",12,2.4)}</button>
          </div>
          <div class="coment-txt">${esc(k.texto)}</div>
        </div>
      </div>`).join("")
      : `<div class="thread-vazio">Nenhum comentário ainda. Escreva abaixo o resumo do que foi feito.</div>`}
    <div class="coment-novo">
      <textarea class="inp" data-novocoment="${a.id}" rows="2"
        placeholder="Resumo do que foi feito, o que o cliente falou, o que ficou combinado..."></textarea>
      <button class="btn btn-primary btn-sm" data-addcoment="${a.id}">${icon("plus",13,2.6)} Comentar</button>
    </div>
  </div>`;
}

function rotuloAtividade(a){
  const t = ACT_TYPES[a.tipo] || ACT_TYPES.nota;
  if(a.tipo === "nota") return "Nota";
  if(a.tipo === "proposta") return "Proposta";
  const prefixo = a.concluido ? "" : (a.tipo === "visita" ? "Fazer " : a.tipo === "ligacao" ? "Fazer " : "Enviar ");
  if(a.tipo === "visita") return (a.concluido ? "Visita realizada" : "Fazer visita");
  if(a.tipo === "ligacao") return (a.concluido ? "Ligação feita" : "Fazer ligação");
  if(a.tipo === "reuniao") return (a.concluido ? "Reunião realizada" : "Fazer reunião");
  return (a.concluido ? t.label + " enviado" : prefixo + t.label);
}

/* ---------------- painéis da direita ---------------- */
function painelAcoes(card){
  return `
  <div class="panel">
    <div class="panel-head">Ações</div>
    <div class="panel-body">
      <div class="actions-grid">
        <button class="btn btn-primary" data-acao="email">${icon("mail",14,2)} Enviar e-mail</button>
        <button class="btn btn-primary" data-acao="ligar">${icon("phone",14,2)} Fazer ligação</button>
        <button class="btn btn-primary" data-acao="proposta">${icon("doc",14,2)} Gerar proposta</button>
        <button class="btn btn-primary" data-acao="whats">${icon("whats",14,2)} Enviar WhatsApp</button>
      </div>
      <div class="row-gap" style="margin-top:9px">
        <button class="btn btn-sm" data-acao="agendar_visita">${icon("pin",13,2)} Agendar visita</button>
        <button class="btn btn-sm" data-acao="agendar_reuniao">${icon("users",13,2)} Agendar reunião</button>
      </div>
    </div>
  </div>`;
}

function painelValor(card){
  const prods = card.produtos || [];
  return `
  <div class="panel">
    <div class="panel-head">Valor do negócio</div>
    <div class="panel-body">
      <input class="value-edit" id="dealValor" value="${esc(moeda(card.valor))}" aria-label="Valor do negócio">
      ${(() => {
        const pa = typeof pedidoAtual === "function" ? pedidoAtual(card) : null;
        if(!pa) return "";
        return `<button class="ped-atalho" data-verpedidos="1">
          ${icon("cart",13,2)} Pedido atual #${pa.numero}: <b>${moeda(totalPedido(pa))}</b>
        </button>`;
      })()}
      <div class="sub-label" style="margin-top:10px">Produtos e serviços</div>
      ${prods.length
        ? `<div class="chips">${prods.map((p,i) => `<span class="chip">${esc(p)}<button data-rmprod="${i}" title="Remover">${icon("x",12,2.6)}</button></span>`).join("")}</div>`
        : `<div class="chips-empty">Nenhum produto ou serviço foi adicionado a este negócio</div>`}
      <button class="btn btn-soft btn-sm" id="dealAddProd">${icon("plus",13,2.6)} Adicionar produtos/serviços</button>
    </div>
  </div>`;
}

function painelNegocio(card){
  const col = dados.columns.find(c => c.id === card.columnId);
  return `
  <div class="panel">
    <div class="panel-head">Dados do negócio</div>
    <div class="panel-body">
      <div class="kv">
        <span class="k">Responsável</span>
        <span class="v" style="display:flex;align-items:center;gap:7px">
          <span class="avatar">${esc(iniciais(card.responsavel || dados.usuario))}</span>
          ${editavel(card, "responsavel", "text", "Adicionar")}
        </span>
        <span class="k">Etapa</span>
        <span class="v">${esc(col ? col.name : "—")}</span>
        <span class="k">Data de início</span>
        <span class="v">${editavel(card, "dataInicio", "date", "Adicionar", fmtData(card.dataInicio))}</span>
        <span class="k">Data de conclusão</span>
        <span class="v">${editavel(card, "dataConclusao", "date", "Adicionar", fmtData(card.dataConclusao))}</span>
        <span class="k">Descrição</span>
        <span class="v">${editavel(card, "descricao", "text", "Adicionar descrição")}</span>
      </div>
    </div>
  </div>`;
}

/** valor clicável que se transforma em campo */
function editavel(card, campo, tipo, placeholder, mostrar){
  const bruto = card[campo] || "";
  const txt = mostrar !== undefined && mostrar !== "" ? mostrar : bruto;
  if(!bruto) return `<button class="inline-add" data-edit="${campo}" data-tipo="${tipo}">${esc(placeholder)}</button>`;
  return `<button class="inline-add" data-edit="${campo}" data-tipo="${tipo}" style="color:var(--ink-2)">${esc(txt)}</button>`;
}

function painelContato(card){
  const linha = (k, v, href) => `
    <span class="k">${k}</span>
    <span class="v ${href ? "link" : ""}">${v ? (href ? `<a href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${esc(v)}</a>` : esc(v)) : '<span class="muted">—</span>'}</span>`;

  const endereco = [card.rua, card.numero_end, card.bairro, card.cidade, card.estado, card.pais, card.cep]
    .filter(Boolean).join(", ");
  const mapa = endereco ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(endereco) : "";

  const pessoas = (card.pessoas || []).map(p => `
    <div class="contact-block">
      <div class="block-label">${esc(p.nome || "Contato")} ${p.cargo ? `<span class="muted" style="font-weight:500">· ${esc(p.cargo)}</span>` : ""}</div>
      <div class="kv">
        ${linha("E-mail", p.email, p.email ? "mailto:" + p.email : "")}
        ${linha("Celular", p.celular, p.celular ? "tel:" + soDigitos(p.celular) : "")}
        ${linha("WhatsApp", p.whatsapp, waLink(p.whatsapp))}
        ${linha("Telefone", p.telefone, p.telefone ? "tel:" + soDigitos(p.telefone) : "")}
      </div>
    </div>`).join("");

  const redes = card.redes || {};
  const redesList = Object.entries({
    Instagram: redes.instagram, Facebook: redes.facebook, LinkedIn: redes.linkedin,
    "X (twitter)": redes.twitter, Skype: redes.skype, Website: card.website
  }).filter(([,v]) => v).map(([k,v]) =>
    `<a href="${esc(urlHttp(v))}" target="_blank" rel="noopener">${icon("link",13,2)} ${esc(k)}</a>`
  ).join("");

  return `
  <div class="panel">
    <div class="panel-head">Dados do contato</div>
    <div class="panel-body">
      <div class="contact-scroll">
        <div class="contact-block">
          <div class="contact-title"><span class="avatar-sq">${icon("build",16,1.9)}</span>${esc(card.nome)}</div>
          <div class="kv">
            ${linha("E-mail", card.email, card.email ? "mailto:" + card.email : "")}
            ${linha("Celular", card.celular, card.celular ? "tel:" + soDigitos(card.celular) : "")}
            ${linha("WhatsApp", card.whatsapp, waLink(card.whatsapp))}
            ${linha("Telefone", card.telefone, card.telefone ? "tel:" + soDigitos(card.telefone) : "")}
            ${card.cnpj ? linha("CNPJ", card.cnpj, "") : ""}
            ${card.razaoSocial ? linha("Razão social", card.razaoSocial, "") : ""}
          </div>
        </div>

        <div class="contact-block">
          <div class="block-label">Endereço</div>
          ${endereco ? `<div style="font-size:12.5px;line-height:1.6;color:var(--brand)">${esc(endereco)}</div>
            <a class="map-btn" href="${mapa}" target="_blank" rel="noopener">${icon("map",14,2)} Abrir no Google Maps</a>`
            : `<div class="muted" style="font-size:12.5px">Nenhum endereço cadastrado.</div>`}
        </div>

        <div class="contact-block">
          <div class="block-label">Pessoas da empresa</div>
          ${pessoas || `<div class="muted" style="font-size:12.5px;margin-bottom:9px">Nenhuma pessoa cadastrada.</div>`}
          <button class="btn btn-soft btn-sm" id="dealAddPessoa">${icon("plus",13,2.6)} Adicionar pessoa</button>
        </div>

        ${redesList ? `<div class="contact-block">
          <div class="block-label">Redes sociais</div>
          <div class="social-list">${redesList}</div>
        </div>` : ""}
      </div>
    </div>
  </div>`;
}

function painelCodigo(card){
  return `
  <div class="panel">
    <div class="panel-head">Código do negócio</div>
    <div class="panel-body tight">
      <div class="code-box">
        <code>${esc(card.codigo)}</code>
        <button class="icon-btn" id="copyCode" title="Copiar código">${icon("copy",14,2)}</button>
      </div>
    </div>
    <div class="meta-lines">
      · Criado por ${esc(card.criadoPor || dados.usuario)} em ${esc(fmtLongo(card.criadoEm))}<br>
      · Última atualização em ${esc(fmtLongo(card.atualizadoEm))}
    </div>
  </div>`;
}

/* ---------------- eventos ---------------- */
function ligarNegocio(card){
  const box = document.getElementById("dealContent");

  box.querySelector("#dealClose").onclick = fecharNegocio;
  box.querySelector("#dealEdit").onclick = () => abrirEmpresa(card.id);

  box.querySelectorAll("[data-status]").forEach(b => {
    b.onclick = () => definirStatus(card.id, b.dataset.status);
  });

  box.querySelectorAll("[data-star]").forEach(b => {
    b.onclick = () => {
      const n = Number(b.dataset.star);
      card.estrelas = card.estrelas === n ? 0 : n;
      card.atualizadoEm = new Date().toISOString();
      salvar(); renderNegocio(); render();
    };
  });

  // etapas
  box.querySelectorAll(".step").forEach(b => {
    b.onclick = () => moverEtapa(card, b.dataset.col);
  });
  const i = dados.columns.findIndex(c => c.id === card.columnId);
  const prev = box.querySelector("#stepPrev"), next = box.querySelector("#stepNext");
  if(prev) prev.onclick = () => moverEtapa(card, dados.columns[i-1].id);
  if(next) next.onclick = () => moverEtapa(card, dados.columns[i+1].id);

  // composer
  box.querySelectorAll(".ctab").forEach(b => {
    b.onclick = () => {
      composerTipo = b.dataset.tipo;
      box.querySelectorAll(".ctab").forEach(x => x.classList.toggle("on", x === b));
    };
  });
  if(box.querySelector("#cpSalvar")) box.querySelector("#cpSalvar").onclick = () => {
    const nota = box.querySelector("#cpNota").value.trim();
    const quando = box.querySelector("#cpData").value;
    const feito = box.querySelector("#cpFeito").checked;
    if(!nota && !quando){ toast("Escreva a nota ou defina um prazo.", "err"); return; }
    registrarAtividade(card, composerTipo, quando, nota, feito);
  };

  // abas do histórico
  box.querySelectorAll(".htab").forEach(b => {
    b.onclick = () => { histAba = b.dataset.hist; renderNegocio(); };
  });

  // atividades
  box.querySelectorAll("[data-done]").forEach(chk => {
    chk.onchange = () => {
      const a = card.agendamentos.find(x => x.id === chk.dataset.done);
      if(a){ a.concluido = chk.checked; card.atualizadoEm = new Date().toISOString(); salvar(); renderNegocio(); render(); }
    };
  });
  // comentários
  box.querySelectorAll("[data-coment]").forEach(b => {
    b.onclick = () => {
      const id = b.dataset.coment;
      if(comentariosAbertos.has(id)) comentariosAbertos.delete(id);
      else comentariosAbertos.add(id);
      renderNegocio();
    };
  });
  box.querySelectorAll("[data-addcoment]").forEach(b => {
    b.onclick = () => adicionarComentario(card, b.dataset.addcoment);
  });
  box.querySelectorAll("[data-novocoment]").forEach(ta => {
    // Ctrl+Enter envia
    ta.onkeydown = e => {
      if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
        e.preventDefault();
        adicionarComentario(card, ta.dataset.novocoment);
      }
    };
  });
  box.querySelectorAll("[data-rmcoment]").forEach(b => {
    b.onclick = async () => {
      const [idAtiv, idCom] = b.dataset.rmcoment.split("|");
      if(!(await confirmar("Excluir este comentário?", { titulo:"Excluir comentário", ok:"Excluir", perigo:true }))) return;
      const a = card.agendamentos.find(x => x.id === idAtiv);
      if(a){
        a.comentarios = (a.comentarios || []).filter(k => k.id !== idCom);
        card.atualizadoEm = new Date().toISOString();
        salvar(); renderNegocio();
      }
    };
  });

  box.querySelectorAll("[data-del]").forEach(b => {
    b.onclick = async () => {
      if(!(await confirmar("Excluir esta atividade do histórico?", { titulo:"Excluir atividade", ok:"Excluir", perigo:true }))) return;
      card.agendamentos = card.agendamentos.filter(x => x.id !== b.dataset.del);
      salvar(); renderNegocio(); render();
    };
  });

  // ações rápidas
  box.querySelectorAll("[data-acao]").forEach(b => {
    b.onclick = () => acaoRapida(card, b.dataset.acao);
  });

  // valor
  const valorEl = box.querySelector("#dealValor");
  valorEl.onchange = () => {
    card.valor = parseMoeda(valorEl.value);
    card.atualizadoEm = new Date().toISOString();
    valorEl.value = moeda(card.valor);
    salvar(); render();
  };

  // produtos
  box.querySelector("#dealAddProd").onclick = async () => {
    const p = await pedirTexto("Adicionar produto ou serviço", "Nome do produto/serviço", "");
    if(!p) return;
    card.produtos = card.produtos || [];
    if(!card.produtos.includes(p)) card.produtos.push(p);
    if(!dados.listas.produtos.includes(p)) dados.listas.produtos.push(p);
    card.atualizadoEm = new Date().toISOString();
    salvar(); renderNegocio(); render();
  };
  box.querySelectorAll("[data-rmprod]").forEach(b => {
    b.onclick = () => {
      card.produtos.splice(Number(b.dataset.rmprod), 1);
      salvar(); renderNegocio(); render();
    };
  });

  // pessoa (abre o cadastro na seção de pessoas)
  box.querySelector("#dealAddPessoa").onclick = () => {
    abrirEmpresa(card.id);
    setTimeout(() => {
      addPessoa();
      document.getElementById("f_pessoas").scrollIntoView({ behavior:"smooth", block:"center" });
    }, 120);
  };

  box.querySelectorAll("[data-verpedidos]").forEach(b => {
    b.onclick = () => { histAba = "pedidos"; renderNegocio(); };
  });

  box.querySelector("#copyCode").onclick = () => copiar(card.codigo);

  // edição no local
  box.querySelectorAll("[data-edit]").forEach(b => {
    b.onclick = () => editarNoLocal(b, card);
  });

  // aba de pedidos
  if(histAba === "pedidos") ligarPedidos(card);
}

function moverEtapa(card, colId){
  if(card.columnId === colId) return;
  card.columnId = colId;
  card.etapaEm = new Date().toISOString();
  card.atualizadoEm = new Date().toISOString();
  salvar(); renderNegocio(); render();
}

function editarNoLocal(btn, card){
  const campo = btn.dataset.edit;
  const tipo = btn.dataset.tipo;
  const inp = document.createElement("input");
  inp.className = "inline-inp";
  inp.type = tipo === "date" ? "date" : "text";
  inp.value = tipo === "date" ? (card[campo] || "").slice(0,10) : (card[campo] || "");
  btn.replaceWith(inp);
  inp.focus();
  const salvarCampo = () => {
    card[campo] = inp.value.trim();
    card.atualizadoEm = new Date().toISOString();
    salvar(); renderNegocio(); render();
  };
  inp.onblur = salvarCampo;
  inp.onkeydown = e => {
    if(e.key === "Enter") salvarCampo();
    if(e.key === "Escape") renderNegocio();
  };
}

function adicionarComentario(card, idAtiv){
  const ta = document.querySelector(`[data-novocoment="${idAtiv}"]`);
  const texto = ta ? ta.value.trim() : "";
  if(!texto){ toast("Escreva o comentário antes de salvar.", "err"); return; }
  const a = card.agendamentos.find(x => x.id === idAtiv);
  if(!a) return;
  a.comentarios = a.comentarios || [];
  a.comentarios.push({
    id: uid(), texto,
    autor: card.responsavel || dados.usuario,
    criadoEm: new Date().toISOString()
  });
  card.atualizadoEm = new Date().toISOString();
  comentariosAbertos.add(idAtiv);
  salvar(); renderNegocio(); render();
  toast("Comentário adicionado.");
}

function registrarAtividade(card, tipo, quando, nota, feito){
  card.agendamentos = card.agendamentos || [];
  card.agendamentos.push({
    id: uid(), tipo,
    data: quando || "",
    nota: nota || "",
    concluido: !!feito,
    criadoEm: new Date().toISOString(),
    criadoPor: card.responsavel || dados.usuario
  });
  card.atualizadoEm = new Date().toISOString();
  salvar(); renderNegocio(); render();
  toast(feito ? "Atividade registrada." : "Atividade agendada.");
}

function acaoRapida(card, acao){
  if(acao === "email"){
    if(!card.email){ toast("Este cliente não tem e-mail cadastrado.", "err"); return; }
    window.open("mailto:" + card.email, "_blank");
    abrirAgendar(card.id, "email");
    return;
  }
  if(acao === "ligar"){
    const fone = card.telefone || card.celular || card.whatsapp;
    if(!fone){ toast("Este cliente não tem telefone cadastrado.", "err"); return; }
    window.open("tel:" + soDigitos(fone));
    abrirAgendar(card.id, "ligacao");
    return;
  }
  if(acao === "whats"){
    const link = waLink(card.whatsapp || card.celular);
    if(!link){ toast("Este cliente não tem WhatsApp cadastrado.", "err"); return; }
    window.open(link, "_blank");
    abrirAgendar(card.id, "whatsapp");
    return;
  }
  if(acao === "proposta") return abrirAgendar(card.id, "proposta");
  if(acao === "agendar_visita") return abrirAgendar(card.id, "visita");
  if(acao === "agendar_reuniao") return abrirAgendar(card.id, "reuniao");
}

/* =========================================================
   Modal de agendamento (usado pelo menu do botão direito)
   ========================================================= */
let agendarCardId = null;

function abrirAgendar(cardId, tipo){
  agendarCardId = cardId;
  const card = dados.cards.find(c => c.id === cardId);
  if(!card) return;
  const t = ACT_TYPES[tipo] || ACT_TYPES.nota;

  document.getElementById("s_tipo").innerHTML = Object.entries(ACT_TYPES)
    .map(([k,v]) => `<option value="${k}" ${k === tipo ? "selected" : ""}>${v.label}</option>`).join("");
  document.getElementById("s_data").value = toInputDT(proximaHoraCheia());
  document.getElementById("s_nota").value = "";
  document.getElementById("schedTitle").textContent = t.label === "Nota" ? "Escrever nota" : "Agendar " + t.label.toLowerCase();
  document.getElementById("schedSub").textContent = `#${card.numero} · ${card.nome}`;
  const ic = document.getElementById("schedIcon");
  ic.innerHTML = icon(t.icon, 20, 1.9);
  ic.style.background = t.color + "14";
  ic.style.color = t.color;

  document.getElementById("schedOverlay").classList.add("show");
  setTimeout(() => document.getElementById("s_nota").focus(), 80);
}

function fecharAgendar(){
  document.getElementById("schedOverlay").classList.remove("show");
  agendarCardId = null;
}

function salvarAgendar(){
  const card = dados.cards.find(c => c.id === agendarCardId);
  if(!card) return fecharAgendar();
  const tipo = document.getElementById("s_tipo").value;
  const quando = document.getElementById("s_data").value;
  const nota = document.getElementById("s_nota").value.trim();
  if(!quando && !nota){ toast("Defina um prazo ou escreva a nota.", "err"); return; }
  registrarAtividade(card, tipo, quando, nota, false);
  fecharAgendar();
}

function ligarAgendar(){
  document.getElementById("schedClose").onclick = fecharAgendar;
  document.getElementById("schedCancel").onclick = fecharAgendar;
  document.getElementById("schedSave").onclick = salvarAgendar;
  document.getElementById("schedOverlay").addEventListener("click", e => {
    if(e.target.id === "schedOverlay") fecharAgendar();
  });
  document.getElementById("s_tipo").onchange = e => {
    const t = ACT_TYPES[e.target.value];
    const ic = document.getElementById("schedIcon");
    ic.innerHTML = icon(t.icon, 20, 1.9);
    ic.style.background = t.color + "14";
    ic.style.color = t.color;
    document.getElementById("schedTitle").textContent =
      t.label === "Nota" ? "Escrever nota" : "Agendar " + t.label.toLowerCase();
  };
}
