/* Tela de criação de conta */
ligarOlhos();
pularSeLogado();
ligarMedidorSenha("senha", "medidor");

document.getElementById("formCadastro").addEventListener("submit", async e => {
  e.preventDefault();
  limparErros(); aviso("");

  const nome  = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const senha2= document.getElementById("senha2").value;

  if(nome.length < 2){ marcarErro("nome", true); aviso("Informe seu nome."); return; }
  if(!emailValido(email)){ marcarErro("email", true); aviso("Digite um e-mail válido."); return; }

  const forca = avaliarSenha(senha);
  if(!forca.valida){
    marcarErro("senha", true);
    const falta = forca.regras.filter(r => !r.atende).map(r => r.texto.toLowerCase());
    aviso("A senha ainda precisa de: " + falta.join(", ") + ".");
    return;
  }
  if(senha !== senha2){ marcarErro("senha2", true); aviso("As duas senhas não são iguais."); return; }

  carregando("btnCriar", true);
  try{
    const r = await cadastrar(nome, email, senha);
    // quando a confirmação por e-mail está ligada, não vem sessão
    if(r && r.session){
      location.replace("index.html");
    }else{
      document.getElementById("formCadastro").classList.add("hidden");
      aviso("Conta criada. Enviamos um e-mail de confirmação para " + email +
            ". Clique no link da mensagem para ativar o acesso (olhe também o spam).", "ok");
    }
  }catch(err){
    aviso(err.message);
    carregando("btnCriar", false, "Criar conta");
  }
});
