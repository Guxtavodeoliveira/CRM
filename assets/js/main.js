/* =========================================================
   main.js — inicialização e eventos globais
   ========================================================= */

document.getElementById("searchInput").addEventListener("input", render);

document.getElementById("boardName").addEventListener("change", e => {
  dados.boardName = e.target.value.trim() || "Meu funil";
  salvar(); render();
});

document.querySelectorAll("[data-filter]").forEach(b => {
  b.onclick = () => {
    filtroStatus = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(x => x.classList.toggle("on", x === b));
    render();
  };
});

document.getElementById("newDealBtn").onclick = () => abrirEmpresa(null, dados.columns[0].id);
document.getElementById("switchFileBtn").onclick = mostrarConexao;

document.querySelectorAll("[data-agenda]").forEach(b => {
  b.onclick = () => abrirAgenda(b.dataset.agenda);
});
document.getElementById("agendaOverlay").addEventListener("click", e => {
  if(e.target.id === "agendaOverlay") fecharAgenda();
});

document.getElementById("exportBtn").onclick = exportarBackup;
document.getElementById("agNegocios").onclick = () => exportarAgendorNegocios({ apenasFiltrados: cardsFiltrados() });
document.getElementById("agCadastros").onclick = exportarConferencia;
document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
document.getElementById("importFile").addEventListener("change", e => {
  const f = e.target.files[0];
  if(f) importarBackup(f);
  e.target.value = "";
});

/* fecha o menu de contexto ao clicar fora / rolar / Esc */
document.addEventListener("click", e => {
  if(!e.target.closest("#ctxMenu")) fecharMenu();
});
document.addEventListener("scroll", fecharMenu, true);
window.addEventListener("blur", fecharMenu);

/* atalhos */
document.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    fecharMenu();
    if(document.getElementById("promptOverlay").classList.contains("show")) return;
    if(document.getElementById("confirmOverlay").classList.contains("show")) return;
    if(document.getElementById("schedOverlay").classList.contains("show")) return fecharAgendar();
    if(document.getElementById("pedidoOverlay").classList.contains("show")) return fecharPedidoModal();
    if(document.getElementById("relOverlay").classList.contains("show")) return fecharRelatorio();
    if(document.getElementById("agendaOverlay").classList.contains("show")) return fecharAgenda();
    if(document.getElementById("empresaOverlay").classList.contains("show")) return fecharEmpresa();
    if(document.getElementById("dealOverlay").classList.contains("show")) return fecharNegocio();
  }
  // Ctrl/Cmd + K foca a busca
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){
    e.preventDefault();
    document.getElementById("searchInput").focus();
  }
  // Ctrl/Cmd + S força a gravação
  if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s"){
    e.preventDefault();
    writeToFile().then(() => toast("Dados gravados no arquivo."));
  }
});

document.getElementById("dealOverlay").addEventListener("click", e => {
  if(e.target.id === "dealOverlay") fecharNegocio();
});

/* avisa se a aba fechar antes de gravar */
window.addEventListener("beforeunload", () => { if(saveTimer) writeToFile(); });

ligarUsuario();
ligarRelatorios();
ligarPedidoModal();
ligarEmpresa();
ligarAgendar();

/* Com login configurado: exige a sessão e busca os dados no banco.
   Sem configuração (uso local): continua no modo arquivo. */
(async () => {
  if(sb){
    const user = await exigirLogin();
    if(!user) return;
    await iniciarUsuario();
    const ok = await iniciarBanco();
    if(ok) return;
  }else{
    iniciarArmazenamento();
  }
})();
