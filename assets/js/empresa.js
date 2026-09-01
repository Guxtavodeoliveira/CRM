/* =========================================================
   empresa.js — modal de cadastro/edição da empresa (cliente)
   ========================================================= */

let empEditandoId = null;
let empPessoas = [];
let empColunaDestino = null;   // etapa em que o cliente entra quando é novo

const CAMPOS = [
  ["f_nome","nome"],["f_cnpj","cnpj"],["f_razao","razaoSocial"],
  ["f_ie","inscricaoEstadual"],["f_responsavelEmpresa","responsavelEmpresa"],
  ["f_descricao","descricao"],
  ["f_banco","banco"],["f_agencia","agencia"],["f_cc","contaCorrente"],
  ["f_poupanca","contaPoupanca"],["f_pix","pix"],
  ["f_email","email"],["f_whatsapp","whatsapp"],["f_telefone","telefone"],
  ["f_celular","celular"],["f_fax","fax"],["f_ramal","ramal"],["f_website","website"],
  ["f_cep","cep"],["f_pais","pais"],["f_bairro","bairro"],["f_rua","rua"],
  ["f_numero","numero_end"],["f_complemento","complemento"]
];

/* ---------------- abrir ---------------- */
function abrirEmpresa(cardId, columnId){
  empEditandoId = cardId || null;
  const card = cardId ? dados.cards.find(c => c.id === cardId) : null;

  // etapa do funil não fica mais na ficha: novo cliente entra na coluna de onde veio
  empColunaDestino = card ? card.columnId : (columnId || dados.columns[0].id);

  preencherUFs(card ? card.estado : "");

  CAMPOS.forEach(([id, campo]) => {
    const el = document.getElementById(id);
    el.value = card ? (card[campo] || "") : (campo === "pais" ? "Brasil" : "");
    el.closest(".field").classList.remove("invalid");
    el.classList.remove("error");
  });

  const cidade = document.getElementById("f_cidade");
  cidade.value = card ? (card.cidade || "") : "";
  atualizarCidade();

  const redes = (card && card.redes) || {};
  document.getElementById("f_facebook").value  = redes.facebook  || "";
  document.getElementById("f_twitter").value   = redes.twitter   || "";
  document.getElementById("f_linkedin").value  = redes.linkedin  || "";
  document.getElementById("f_skype").value     = redes.skype     || "";
  document.getElementById("f_instagram").value = redes.instagram || "";

  empPessoas = card ? JSON.parse(JSON.stringify(card.pessoas || [])) : [];
  renderPessoas();

  document.getElementById("empTitle").textContent = card ? "Editar empresa" : "Adicionar nova empresa";
  document.getElementById("empSub").textContent = card
    ? `#${card.numero} · cadastrado em ${fmtData(card.criadoEm)}`
    : "Cadastre os dados do cliente";
  document.getElementById("empSave").textContent = card ? "Salvar alterações" : "Salvar e continuar";
  document.getElementById("empDelete").classList.toggle("hidden", !card);

  document.getElementById("empresaOverlay").classList.add("show");
  document.querySelector("#empresaOverlay .modal-body").scrollTop = 0;
  setTimeout(() => document.getElementById("f_nome").focus(), 80);
}

function fecharEmpresa(){
  document.getElementById("empresaOverlay").classList.remove("show");
  empEditandoId = null;
}

/* ---------------- listas auxiliares ---------------- */
function preencherUFs(sel){
  document.getElementById("f_estado").innerHTML =
    `<option value="">Selecione</option>` +
    UFS.map(([uf,nome]) => `<option value="${uf}" ${uf === sel ? "selected" : ""}>${uf} — ${nome}</option>`).join("");
}

function atualizarCidade(){
  const uf = document.getElementById("f_estado").value;
  const cidade = document.getElementById("f_cidade");
  if(uf){
    cidade.disabled = false;
    cidade.placeholder = "Nome da cidade";
  } else {
    cidade.disabled = true;
    cidade.value = "";
    cidade.placeholder = "Primeiro, selecione o estado";
  }
}

/* ---------------- pessoas ---------------- */
function renderPessoas(){
  const box = document.getElementById("f_pessoas");
  if(!empPessoas.length){ box.innerHTML = ""; return; }
  box.innerHTML = empPessoas.map((p,i) => `
    <div class="person">
      <button type="button" class="icon-btn rm" data-i="${i}" title="Remover pessoa">${icon("trash",14,2)}</button>
      <div class="person-title">Pessoa ${i+1}</div>
      <div class="grid">
        <div class="field"><label>Nome</label><input class="inp" data-p="${i}" data-k="nome" value="${esc(p.nome)}" placeholder="Nome do contato"></div>
        <div class="field"><label>Cargo</label><input class="inp" data-p="${i}" data-k="cargo" value="${esc(p.cargo)}" placeholder="Comprador, sócio..."></div>
        <div class="field"><label>E-mail</label><input class="inp" data-p="${i}" data-k="email" value="${esc(p.email)}" placeholder="exemplo@email.com"></div>
        <div class="field"><label>WhatsApp</label><input class="inp" data-p="${i}" data-k="whatsapp" value="${esc(p.whatsapp)}" placeholder="+55 00 00000-0000"></div>
        <div class="field"><label>Celular</label><input class="inp" data-p="${i}" data-k="celular" value="${esc(p.celular)}" placeholder="(00) 00000-0000"></div>
        <div class="field"><label>Telefone</label><input class="inp" data-p="${i}" data-k="telefone" value="${esc(p.telefone)}" placeholder="(00) 0000-0000"></div>
      </div>
    </div>`).join("");

  box.querySelectorAll("input[data-p]").forEach(inp => {
    inp.oninput = () => { empPessoas[Number(inp.dataset.p)][inp.dataset.k] = inp.value; };
  });
  box.querySelectorAll(".rm").forEach(b => {
    b.onclick = () => { empPessoas.splice(Number(b.dataset.i), 1); renderPessoas(); };
  });
}

function addPessoa(){
  empPessoas.push({ id: uid(), nome:"", cargo:"", email:"", celular:"", whatsapp:"", telefone:"" });
  renderPessoas();
  const inputs = document.querySelectorAll('#f_pessoas input[data-k="nome"]');
  if(inputs.length) inputs[inputs.length-1].focus();
}

/* ---------------- CEP ---------------- */
async function buscarCEP(){
  const cep = soDigitos(document.getElementById("f_cep").value);
  const st = document.getElementById("cepStatus");
  if(cep.length !== 8){ st.textContent = ""; return; }
  st.textContent = "buscando...";
  try{
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const j = await r.json();
    if(j.erro){ st.textContent = "CEP não encontrado"; return; }
    if(j.uf){
      document.getElementById("f_estado").value = j.uf;
      atualizarCidade();
    }
    if(j.localidade) document.getElementById("f_cidade").value = j.localidade;
    if(j.bairro) document.getElementById("f_bairro").value = j.bairro;
    if(j.logradouro) document.getElementById("f_rua").value = j.logradouro;
    st.textContent = "endereço preenchido";
    setTimeout(() => { st.textContent = ""; }, 2500);
  }catch(e){
    st.textContent = "sem internet — preencha à mão";
    setTimeout(() => { st.textContent = ""; }, 3000);
  }
}

/* ---------------- salvar ---------------- */
function salvarEmpresa(){
  const nomeEl = document.getElementById("f_nome");
  const nome = nomeEl.value.trim();
  if(!nome){
    nomeEl.closest(".field").classList.add("invalid");
    nomeEl.classList.add("error");
    nomeEl.focus();
    toast("Informe o nome do cliente.", "err");
    return;
  }

  const editando = empEditandoId ? dados.cards.find(c => c.id === empEditandoId) : null;
  const card = editando || cardPadrao();

  CAMPOS.forEach(([id, campo]) => { card[campo] = document.getElementById(id).value.trim(); });
  card.cidade = document.getElementById("f_cidade").value.trim();
  card.estado = document.getElementById("f_estado").value;
  card.pessoas = empPessoas.filter(p => (p.nome || p.email || p.celular || p.whatsapp || p.telefone));
  card.redes = {
    facebook:  document.getElementById("f_facebook").value.trim(),
    twitter:   document.getElementById("f_twitter").value.trim(),
    linkedin:  document.getElementById("f_linkedin").value.trim(),
    skype:     document.getElementById("f_skype").value.trim(),
    instagram: document.getElementById("f_instagram").value.trim()
  };
  card.atualizadoEm = new Date().toISOString();

  if(!editando){
    // a etapa do funil não fica mais na ficha: entra na coluna de onde foi aberto
    const col = dados.columns.find(c => c.id === empColunaDestino) || dados.columns[0];
    card.columnId = col.id;
    card.dataInicio = card.dataInicio || new Date().toISOString().slice(0,10);
    card.numero = proximoNumero();
    card.codigo = card.numero + "-" + uid() + "@crm.local";
    card.criadoPor = dados.usuario;
    card.etapaEm = new Date().toISOString();
    dados.cards.push(card);
  }

  salvar();
  fecharEmpresa();
  render();
  toast(editando ? "Alterações salvas." : "Cliente cadastrado no funil.");
  if(!editando) abrirNegocio(card.id);
  else if(document.getElementById("dealOverlay").classList.contains("show")) renderNegocio();
}

async function excluirEmpresaAtual(){
  const card = dados.cards.find(c => c.id === empEditandoId);
  if(!card) return;
  const ok = await confirmar(
    `Excluir "${card.nome}" e todo o histórico de atividades dele? Não é possível desfazer.`,
    { titulo:"Excluir cliente", ok:"Excluir", perigo:true }
  );
  if(!ok) return;
  dados.cards = dados.cards.filter(c => c.id !== card.id);
  salvar();
  fecharEmpresa();
  fecharNegocio();
  render();
  toast("Cliente excluído.");
}

/* ---------------- ligações do modal ---------------- */
function ligarEmpresa(){
  document.getElementById("empClose").onclick = fecharEmpresa;
  document.getElementById("empCancel").onclick = fecharEmpresa;
  document.getElementById("empSave").onclick = salvarEmpresa;
  document.getElementById("empDelete").onclick = excluirEmpresaAtual;
  document.getElementById("empresaOverlay").addEventListener("click", e => {
    if(e.target.id === "empresaOverlay") fecharEmpresa();
  });

  document.getElementById("f_estado").onchange = atualizarCidade;
  document.getElementById("f_addPessoa").onclick = addPessoa;

  bindMask(document.getElementById("f_cnpj"), maskCNPJ);
  bindMask(document.getElementById("f_cep"), maskCEP);
  bindMask(document.getElementById("f_telefone"), maskFone);
  bindMask(document.getElementById("f_celular"), maskFone);
  bindMask(document.getElementById("f_fax"), maskFone);

  document.getElementById("f_cep").addEventListener("blur", buscarCEP);
  document.getElementById("f_nome").addEventListener("input", e => {
    if(e.target.value.trim()){
      e.target.closest(".field").classList.remove("invalid");
      e.target.classList.remove("error");
    }
  });
}
