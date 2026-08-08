/* =========================================================
   usuario.js — área do representante no topo do sistema.
   ========================================================= */

let perfilAtual = null;

async function iniciarUsuario(){
  if(!sb) return;                       // sem configuração: segue no modo arquivo

  const user = await exigirLogin();     // manda para o login se não estiver logado
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
