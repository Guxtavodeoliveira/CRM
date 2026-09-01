/* =========================================================
   usuario.js — área do representante no topo do sistema.
   ========================================================= */

let perfilAtual = null;

async function iniciarUsuario(){
  if(!sb) return;                       // sem configuração: segue no modo arquivo

  const { data:{ user } } = await sb.auth.getUser();
  if(!user) return;

  perfilAtual = await carregarPerfil();
  const nome = (perfilAtual && perfilAtual.nome) || user.email.split("@")[0];
  const email = user.email;

  document.getElementById("userNome").textContent = nome;
  document.getElementById("userNome2").textContent = nome;
  document.getElementById("userEmail").textContent = email;
  const ini = iniciais(nome);
  document.getElementById("userIniciais").textContent = ini;
  document.getElementById("userIniciais2").textContent = ini;

  // o responsável padrão dos cadastros passa a ser o representante
  if(typeof dados === "object" && dados && (!dados.usuario || dados.usuario === "Eu")){
    dados.usuario = nome;
  }
}

function ligarUsuario(){
  const btn = document.getElementById("userBtn");
  const menu = document.getElementById("userMenu");
  if(!btn) return;

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

  document.getElementById("btnPerfil").onclick = () => {
    menu.classList.remove("show");
    abrirPerfil();
  };

  document.getElementById("btnTrocarSenha").onclick = async () => {
    menu.classList.remove("show");
    const email = document.getElementById("userEmail").textContent;
    const ok = await confirmar(
      `Vamos enviar um link para ${email}. Ao clicar nele você define a nova senha.`,
      { titulo:"Trocar minha senha", ok:"Enviar link" });
    if(!ok) return;
    try{
      await pedirRecuperacao(email);
      toast("Link enviado. Confira seu e-mail.");
    }catch(e){ toast(e.message, "err"); }
  };

  document.getElementById("btnSair").onclick = async () => {
    menu.classList.remove("show");
    const ok = await confirmar("Deseja sair da sua conta?", { titulo:"Sair", ok:"Sair" });
    if(ok) sair();
  };

  document.getElementById("perfilFechar").onclick = fecharPerfil;
  document.getElementById("perfilCancelar").onclick = fecharPerfil;
  document.getElementById("perfilSalvar").onclick = salvarMeusDados;
  document.getElementById("perfilOverlay").addEventListener("click", e => {
    if(e.target.id === "perfilOverlay") fecharPerfil();
  });
  bindMask(document.getElementById("pf_telefone"), maskFone);
}

function abrirPerfil(){
  document.getElementById("pf_nome").value = (perfilAtual && perfilAtual.nome) || "";
  document.getElementById("pf_email").value = document.getElementById("userEmail").textContent;
  document.getElementById("pf_telefone").value = (perfilAtual && perfilAtual.telefone) || "";
  document.getElementById("perfilOverlay").classList.add("show");
  setTimeout(() => document.getElementById("pf_nome").focus(), 80);
}
function fecharPerfil(){
  document.getElementById("perfilOverlay").classList.remove("show");
}

async function salvarMeusDados(){
  const nome = document.getElementById("pf_nome").value.trim();
  const telefone = document.getElementById("pf_telefone").value.trim();
  if(!nome){ toast("Informe seu nome.", "err"); return; }
  try{
    await salvarPerfil({ nome, telefone });
    perfilAtual = Object.assign(perfilAtual || {}, { nome, telefone });
    document.getElementById("userNome").textContent = nome;
    document.getElementById("userNome2").textContent = nome;
    document.getElementById("userIniciais").textContent = iniciais(nome);
    document.getElementById("userIniciais2").textContent = iniciais(nome);
    fecharPerfil();
    toast("Dados salvos.");
  }catch(e){ toast(e.message, "err"); }
}


/* =========================================================
   Menu de funis (canto superior esquerdo)
   ========================================================= */
function renderMenuFunis(){
  const nomeEl = document.getElementById("funilNome");
  const lista = document.getElementById("funilLista");
  if(!nomeEl || !lista) return;

  nomeEl.textContent = (dados && dados.boardName) || "Meu funil";

  if(!sb || !listaFunis.length){
    lista.innerHTML = `<div class="menu-vazio">Modo local — sem login</div>`;
    return;
  }
  lista.innerHTML = listaFunis.map(f => `
    <button data-funil="${f.id}" class="${funilAtual && f.id === funilAtual.id ? "atual" : ""}">
      <span class="mic">${icon("note",15,1.9)}</span>
      <span><b>${esc(f.nome)}</b>${funilAtual && f.id === funilAtual.id ? "<i>em uso agora</i>" : ""}</span>
    </button>`).join("");

  lista.querySelectorAll("[data-funil]").forEach(b => {
    b.onclick = () => {
      document.getElementById("funilMenu").classList.remove("show");
      trocarFunil(b.dataset.funil);
    };
  });
}

function ligarFunis(){
  const btn = document.getElementById("funilBtn");
  const menu = document.getElementById("funilMenu");
  if(!btn) return;

  btn.onclick = e => {
    e.stopPropagation();
    renderMenuFunis();
    const aberto = menu.classList.toggle("show");
    btn.setAttribute("aria-expanded", aberto ? "true" : "false");
  };
  document.addEventListener("click", () => menu.classList.remove("show"));
  menu.onclick = e => e.stopPropagation();

  document.getElementById("btnNovoFunil").onclick = async () => {
    menu.classList.remove("show");
    if(!sb){ toast("Disponível apenas com login.", "err"); return; }
    const nome = await pedirTexto("Novo funil",
      "Nome da empresa que você representa", "");
    if(!nome) return;
    try{
      const f = await criarFunil(nome);
      toast("Funil criado. Abrindo...");
      trocarFunil(f.id);
    }catch(e){ toast("Não consegui criar: " + e.message, "err"); }
  };

  document.getElementById("btnRenomearFunil").onclick = async () => {
    menu.classList.remove("show");
    const nome = await pedirTexto("Renomear funil", "Novo nome", dados.boardName || "");
    if(!nome) return;
    if(sb){
      try{ await renomearFunilAtual(nome); }
      catch(e){ toast("Não consegui renomear: " + e.message, "err"); return; }
    }else{
      dados.boardName = nome;
      salvar();
    }
    render();
    toast("Funil renomeado.");
  };
}
