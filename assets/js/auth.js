/* =========================================================
   auth.js — cadastro, login, recuperação e troca de senha.

   O Supabase cuida do que é delicado: guarda a senha com hash,
   envia os e-mails de confirmação e recuperação, e mantém a
   sessão. Aqui ficam só as regras de tela.
   ========================================================= */

/* ---------------- regras da senha ---------------- */
const REGRAS_SENHA = [
  { id:"tam",   texto:"Pelo menos 8 caracteres",       ok: s => s.length >= 8 },
  { id:"maius", texto:"Uma letra maiúscula (A-Z)",     ok: s => /[A-Z]/.test(s) },
  { id:"minus", texto:"Uma letra minúscula (a-z)",     ok: s => /[a-z]/.test(s) },
  { id:"num",   texto:"Um número (0-9)",               ok: s => /[0-9]/.test(s) },
  { id:"esp",   texto:"Um caractere especial (!@#$…)", ok: s => /[^A-Za-z0-9]/.test(s) }
];

function avaliarSenha(s){
  const atendidas = REGRAS_SENHA.filter(r => r.ok(s));
  return {
    regras: REGRAS_SENHA.map(r => ({ ...r, atende: r.ok(s) })),
    pontos: atendidas.length,
    valida: atendidas.length === REGRAS_SENHA.length
  };
}

function nivelSenha(pontos){
  if(pontos <= 2) return { classe:"fraca",  texto:"Fraca" };
  if(pontos === 3) return { classe:"media", texto:"Média" };
  if(pontos === 4) return { classe:"boa",   texto:"Boa" };
  return { classe:"forte", texto:"Forte" };
}

/** Liga o medidor visual num campo de senha. */
function ligarMedidorSenha(inputId, caixaId){
  const inp = document.getElementById(inputId);
  const box = document.getElementById(caixaId);
  if(!inp || !box) return;

  const desenhar = () => {
    const r = avaliarSenha(inp.value);
    const n = nivelSenha(r.pontos);
    box.innerHTML = `
      <div class="forca">
        <div class="forca-barra"><i class="${n.classe}" style="width:${(r.pontos/5)*100}%"></i></div>
        <span class="forca-txt ${n.classe}">${inp.value ? n.texto : ""}</span>
      </div>
      <ul class="regras">
        ${r.regras.map(x => `
          <li class="${x.atende ? "ok" : ""}">
            <span class="marca">${x.atende ? "✓" : "○"}</span>${x.texto}
          </li>`).join("")}
      </ul>`;
  };
  inp.addEventListener("input", desenhar);
  desenhar();
}

/* ---------------- mensagens em português ---------------- */
function traduzirErro(msg){
  const m = String(msg || "").toLowerCase();
  if(m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if(m.includes("email not confirmed"))       return "Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos (veja também o spam).";
  if(m.includes("user already registered") ||
     m.includes("already been registered"))   return "Já existe uma conta com esse e-mail. Tente entrar ou use 'Esqueci minha senha'.";
  if(m.includes("password should be at least")) return "A senha é curta demais.";
  if(m.includes("unable to validate email"))  return "Esse e-mail não parece válido.";
  if(m.includes("for security purposes") ||
     m.includes("rate limit") ||
     m.includes("too many"))                  return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if(m.includes("failed to fetch") ||
     m.includes("networkerror"))              return "Sem conexão com o servidor. Confira sua internet.";
  if(m.includes("new password should be different")) return "A nova senha precisa ser diferente da atual.";
  return msg || "Não foi possível concluir. Tente de novo.";
}

/* ---------------- avisos na tela ---------------- */
function aviso(texto, tipo){
  const box = document.getElementById("authAviso");
  if(!box) return;
  if(!texto){ box.className = "aviso hidden"; box.textContent = ""; return; }
  box.className = "aviso " + (tipo || "erro");
  box.textContent = texto;
}

function carregando(botaoId, ligado, textoOriginal){
  const b = document.getElementById(botaoId);
  if(!b) return;
  b.disabled = ligado;
  b.classList.toggle("carregando", ligado);
  if(ligado){ b.dataset.txt = b.textContent; b.textContent = "Aguarde..."; }
  else if(b.dataset.txt || textoOriginal){ b.textContent = textoOriginal || b.dataset.txt; }
}

/* ---------------- operações ---------------- */
async function entrar(email, senha){
  if(!sb) throw new Error("Configuração do servidor ausente.");
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
  if(error) throw new Error(traduzirErro(error.message));
  return data;
}

async function cadastrar(nome, email, senha){
  if(!sb) throw new Error("Configuração do servidor ausente.");
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password: senha,
    options: {
      data: { nome: nome.trim() },
      emailRedirectTo: urlDoApp("index.html")
    }
  });
  if(error) throw new Error(traduzirErro(error.message));
  return data;
}

async function pedirRecuperacao(email){
  if(!sb) throw new Error("Configuração do servidor ausente.");
  const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: urlDoApp("nova-senha.html")
  });
  if(error) throw new Error(traduzirErro(error.message));
}

async function definirNovaSenha(senha){
  if(!sb) throw new Error("Configuração do servidor ausente.");
  const { error } = await sb.auth.updateUser({ password: senha });
  if(error) throw new Error(traduzirErro(error.message));
}

async function sair(){
  if(sb) await sb.auth.signOut();
  location.href = "login.html";
}

async function sessaoAtual(){
  if(!sb) return null;
  const { data } = await sb.auth.getSession();
  return data ? data.session : null;
}

/** Usada nas páginas internas: manda para o login se não estiver logado. */
async function exigirLogin(){
  const s = await sessaoAtual();
  if(!s){ location.replace("login.html"); return null; }
  return s.user;
}

/** Usada no login: se já estiver logado, vai direto para o sistema. */
async function pularSeLogado(){
  const s = await sessaoAtual();
  if(s) location.replace("index.html");
}

/* ---------------- perfil do representante ---------------- */
async function carregarPerfil(){
  if(!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if(!user) return null;
  const { data } = await sb.from("perfis").select("*").eq("id", user.id).single();
  return data || { id:user.id, nome:"", email:user.email, telefone:"" };
}

async function salvarPerfil(campos){
  if(!sb) throw new Error("Sem conexão.");
  const { data: { user } } = await sb.auth.getUser();
  if(!user) throw new Error("Sessão expirada.");
  const { error } = await sb.from("perfis").update(campos).eq("id", user.id);
  if(error) throw new Error(error.message);
}
