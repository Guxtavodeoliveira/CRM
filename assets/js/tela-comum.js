/* Comportamentos compartilhados pelas telas de entrada. */
function ligarOlhos(){
  document.querySelectorAll("[data-ver]").forEach(b => {
    b.onclick = () => {
      const alvo = document.getElementById(b.dataset.ver);
      const mostrando = alvo.type === "text";
      alvo.type = mostrando ? "password" : "text";
      b.setAttribute("aria-label", mostrando ? "Mostrar senha" : "Ocultar senha");
      alvo.focus();
    };
  });
}
function marcarErro(id, tem){
  const el = document.getElementById(id);
  if(el) el.classList.toggle("erro", !!tem);
}
function limparErros(){
  document.querySelectorAll("input.erro").forEach(e => e.classList.remove("erro"));
}
function emailValido(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); }
