/* Tela de recuperação de senha */
document.getElementById("formRecuperar").addEventListener("submit", async e => {
  e.preventDefault();
  limparErros(); aviso("");

  const email = document.getElementById("email").value;
  if(!emailValido(email)){ marcarErro("email", true); aviso("Digite um e-mail válido."); return; }

  carregando("btnEnviar", true);
  try{
    await pedirRecuperacao(email);
    document.getElementById("emailEnviado").textContent = email.trim();
    document.getElementById("telaPedido").classList.add("hidden");
    document.getElementById("telaEnviado").classList.remove("hidden");
  }catch(err){
    aviso(err.message);
    carregando("btnEnviar", false, "Enviar link");
  }
});
