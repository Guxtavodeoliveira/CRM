/* Tela de nova senha (aberta pelo link do e-mail) */
ligarOlhos();
ligarMedidorSenha("senha", "medidor");

/* O link do e-mail traz a sessão temporária na própria URL.
   Se a pessoa abriu esta página sem o link, avisa. */
(async () => {
  const s = await sessaoAtual();
  if(!s){
    aviso("Este link não é mais válido ou já foi usado. Peça um novo em 'Esqueci minha senha'.", "erro");
    document.getElementById("formNovaSenha").classList.add("hidden");
  }
})();

document.getElementById("formNovaSenha").addEventListener("submit", async e => {
  e.preventDefault();
  limparErros(); aviso("");

  const senha  = document.getElementById("senha").value;
  const senha2 = document.getElementById("senha2").value;

  const forca = avaliarSenha(senha);
  if(!forca.valida){
    marcarErro("senha", true);
    const falta = forca.regras.filter(r => !r.atende).map(r => r.texto.toLowerCase());
    aviso("A senha ainda precisa de: " + falta.join(", ") + ".");
    return;
  }
  if(senha !== senha2){ marcarErro("senha2", true); aviso("As duas senhas não são iguais."); return; }

  carregando("btnSalvarSenha", true);
  try{
    await definirNovaSenha(senha);
    document.getElementById("formNovaSenha").classList.add("hidden");
    aviso("Senha alterada. Você já pode entrar com ela.", "ok");
    setTimeout(() => location.replace("index.html"), 1800);
  }catch(err){
    aviso(err.message);
    carregando("btnSalvarSenha", false, "Salvar nova senha");
  }
});
