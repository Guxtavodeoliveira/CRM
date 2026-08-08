/* =========================================================
   agenda.js — painel "Hoje" e "Amanhã" com as atividades
   agendadas, somando também o que ficou atrasado.
   ========================================================= */

let agendaDia = "hoje";

/* ---------------- coleta ---------------- */
function limitesDoDia(offset){
  const ini = new Date();
  ini.setHours(0,0,0,0);
  ini.setDate(ini.getDate() + (offset || 0));
  const fim = new Date(ini);
  fim.setDate(fim.getDate() + 1);
  return [ini.getTime(), fim.getTime()];
}

/** Todas as atividades pendentes com prazo, achatadas com o negócio delas. */
function atividadesPendentes(){
  const out = [];
  dados.cards.forEach(card => {
    (card.agendamentos || []).forEach(a => {
      if(a.concluido || !a.data) return;
      const t = new Date(a.data).getTime();
      if(isNaN(t)) return;
      out.push({ card, a, t });
    });
  });
  return out.sort((x,y) => x.t - y.t);
}

function agendaDoDia(offset){
  const [ini, fim] = limitesDoDia(offset);
  return atividadesPendentes().filter(i => i.t >= ini && i.t < fim);
}

function agendaAtrasadas(){
  const [ini] = limitesDoDia(0);
  return atividadesPendentes().filter(i => i.t < ini);
}

/** Atualiza os números nos botões da barra. */
function atualizarContadoresAgenda(){
  const hoje = agendaDoDia(0).length + agendaAtrasadas().length;
  const amanha = agendaDoDia(1).length;
  const bh = document.getElementById("cntHoje");
  const ba = document.getElementById("cntAmanha");
  if(bh){ bh.textContent = hoje || ""; bh.classList.toggle("hidden", !hoje); }
  if(ba){ ba.textContent = amanha || ""; ba.classList.toggle("hidden", !amanha); }
}

/* ---------------- painel ---------------- */
function abrirAgenda(dia){
  agendaDia = dia || "hoje";
  renderAgenda();
  document.getElementById("agendaOverlay").classList.add("show");
}
function fecharAgenda(){
  document.getElementById("agendaOverlay").classList.remove("show");
}

function renderAgenda(){
  const box = document.getElementById("agendaContent");
  const offset = agendaDia === "amanha" ? 1 : 0;
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dataTxt = d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" });

  const itens = agendaDoDia(offset);
  const atrasadas = agendaDia === "hoje" ? agendaAtrasadas() : [];

  box.innerHTML = `
    <div class="modal-head">
      <div class="avatar-sq">${icon("clock",20,2)}</div>
      <div style="flex:1;min-width:0">
        <h2>Atividades de ${agendaDia === "hoje" ? "hoje" : "amanhã"}</h2>
        <div class="sub" style="text-transform:capitalize">${esc(dataTxt)}</div>
      </div>
      <div class="seg" style="margin-right:6px">
        <button data-dia="hoje" class="${agendaDia === "hoje" ? "on" : ""}">Hoje</button>
        <button data-dia="amanha" class="${agendaDia === "amanha" ? "on" : ""}">Amanhã</button>
      </div>
      <button class="icon-btn lg" id="agFechar" aria-label="Fechar">${icon("x",17,2.2)}</button>
    </div>
    <div class="modal-body">
      ${atrasadas.length ? `
        <div class="ag-grupo">
          <div class="ag-titulo atraso">${icon("flag",14,2.2)} Atrasadas <span class="ag-cont">${atrasadas.length}</span></div>
          ${atrasadas.map(i => itemAgenda(i, true)).join("")}
        </div>` : ""}

      <div class="ag-grupo">
        <div class="ag-titulo">${icon("clock",14,2.2)} ${agendaDia === "hoje" ? "Para hoje" : "Para amanhã"}
          ${itens.length ? `<span class="ag-cont">${itens.length}</span>` : ""}</div>
        ${itens.length ? itens.map(i => itemAgenda(i, false)).join("")
          : `<div class="empty-state">Nada agendado para ${agendaDia === "hoje" ? "hoje" : "amanhã"}.<br>
             Bom sinal — ou hora de agendar o próximo contato.</div>`}
      </div>
    </div>
    <div class="modal-foot">
      <span class="left muted" style="font-size:12.5px">Clique em um item para abrir o negócio.</span>
      <button class="btn" id="agFechar2">Fechar</button>
    </div>
  `;

  // eventos
  box.querySelectorAll("[data-dia]").forEach(b => {
    b.onclick = () => { agendaDia = b.dataset.dia; renderAgenda(); };
  });
  box.querySelector("#agFechar").onclick = fecharAgenda;
  box.querySelector("#agFechar2").onclick = fecharAgenda;

  box.querySelectorAll("[data-abrir]").forEach(el => {
    el.onclick = e => {
      if(e.target.closest("input,label,button")) return;   // não abrir ao marcar
      fecharAgenda();
      abrirNegocio(el.dataset.abrir);
    };
  });
  box.querySelectorAll("[data-agdone]").forEach(chk => {
    chk.onchange = () => {
      const [idCard, idAtiv] = chk.dataset.agdone.split("|");
      const card = dados.cards.find(c => c.id === idCard);
      const a = card && card.agendamentos.find(x => x.id === idAtiv);
      if(a){
        a.concluido = chk.checked;
        card.atualizadoEm = new Date().toISOString();
        salvar(); render(); renderAgenda();
        if(document.getElementById("dealOverlay").classList.contains("show")) renderNegocio();
      }
    };
  });
  box.querySelectorAll("[data-agwa]").forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      const card = dados.cards.find(c => c.id === b.dataset.agwa);
      const link = card && waLink(card.whatsapp || card.celular);
      if(link) window.open(link, "_blank");
      else toast("Este cliente não tem WhatsApp cadastrado.", "err");
    };
  });
}

function itemAgenda(i, atrasada){
  const { card, a } = i;
  const t = ACT_TYPES[a.tipo] || ACT_TYPES.nota;
  const hora = new Date(a.data);
  const hh = String(hora.getHours()).padStart(2,"0") + ":" + String(hora.getMinutes()).padStart(2,"0");
  const qtdCom = (a.comentarios || []).length;
  const col = dados.columns.find(c => c.id === card.columnId);
  const temWa = !!(card.whatsapp || card.celular);

  return `
  <div class="ag-item ${atrasada ? "atraso" : ""}" data-abrir="${card.id}">
    <div class="ag-hora">${atrasada ? esc(fmtData(a.data)) : ""}<b>${hh}</b></div>
    <span class="act-ic" style="background:${t.color}14;color:${t.color}">${icon(t.icon,16,2)}</span>
    <div class="ag-corpo">
      <div class="ag-linha1">
        <b>${esc(rotuloAtividade(a))}</b>
        <span class="ag-emp">${card.numero} - ${esc(card.nome)}</span>
        ${col ? `<span class="tag">${esc(col.name)}</span>` : ""}
        ${qtdCom ? `<span class="tag">${icon("chat",10,2.4)} ${qtdCom}</span>` : ""}
      </div>
      ${a.nota ? `<div class="ag-nota">${esc(a.nota)}</div>` : ""}
    </div>
    <div class="ag-acoes">
      ${temWa ? `<button class="icon-btn" data-agwa="${card.id}" title="Abrir conversa no WhatsApp">${icon("whats",15,2)}</button>` : ""}
      <label class="check" title="Marcar como concluída">
        <input type="checkbox" data-agdone="${card.id}|${a.id}"> Finalizar
      </label>
    </div>
  </div>`;
}
