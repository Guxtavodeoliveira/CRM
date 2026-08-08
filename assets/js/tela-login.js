/* Tela de login */
ligarOlhos();
pularSeLogado();

document.getElementById("formLogin").addEventListener("submit", async e => {
  e.preventDefault();
  limparErros(); aviso("");

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if(!emailValido(email)){ marcarErro("email", true); aviso("Digite um e-mail válido."); return; }
  if(!senha){ marcarErro("senha", true); aviso("Digite sua senha."); return; }

  carregando("btnEntrar", true);
  try{
    await entrar(email, senha);
    location.replace("index.html");
  }catch(err){
    aviso(err.message);
    marcarErro("senha", true);
    carregando("btnEntrar", false, "Entrar");
  }
});
