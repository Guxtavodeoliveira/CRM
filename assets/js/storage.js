/* =========================================================
   storage.js — grava os dados em um arquivo .json na pasta
   escolhida pelo usuário (File System Access API). O handle
   do arquivo fica no IndexedDB para reabrir sozinho depois.
   Fallback: localStorage, quando o navegador não suporta.
   ========================================================= */

const supportsFS = ("showSaveFilePicker" in window) && ("showOpenFilePicker" in window);
const LS_KEY = "kanbanCrmData";     // mesma chave da versão anterior
const IDB_NAME = "kanbanCrmFS";     // mesmo banco da versão anterior

let dados = null;
let fileHandle = null;
let saveTimer = null;

/* ---------------- modelo ---------------- */
function etapasPadrao(){
  return ["Contato Iniciado","Conversando","Em Negociação","Visita Agendada","Amostra Enviada","Cliente Comprador"];
}

function dadosPadrao(){
  return {
    boardName: "Meu funil",
    seq: 0,
    usuario: "Eu",
    listas: {
      categorias: ["Cliente","Prospect","Fornecedor","Parceiro"],
      origens: ["Indicação","Instagram","WhatsApp","Site","Feira","Visita porta a porta","Google"],
      setores: ["Confecção","Gráfica","Comércio","Indústria","Serviços"],
      responsaveis: ["Eu"],
      produtos: []
    },
    columns: etapasPadrao().map(name => ({ id: uid(), name })),
    cards: []
  };
}

function cardPadrao(){
  return {
    id: uid(), columnId: null, numero: 0, posicao: 0,
    nome: "", cnpj: "", razaoSocial: "", categoria: "", origem: "",
    responsavel: "", setor: "", descricao: "",
    privacidade: "todos", acessos: "",
    email: "", whatsapp: "", telefone: "", celular: "", fax: "", ramal: "", website: "",
    cep: "", pais: "Brasil", estado: "", cidade: "", bairro: "", rua: "", numero_end: "", complemento: "",
    produtos: [], pessoas: [],
    redes: { facebook:"", twitter:"", linkedin:"", skype:"", instagram:"" },
    valor: 0, status: "andamento", estrelas: 0,
    motivoPerda: "", descricaoPerda: "",
    dataInicio: "", dataConclusao: "",
    agendamentos: [],                 // mantém o nome antigo do campo
    pedidos: [],                      // pedidos fechados (1 atual + histórico)
    codigo: "",
    criadoEm: new Date().toISOString(),
    criadoPor: "",
    atualizadoEm: new Date().toISOString(),
    etapaEm: new Date().toISOString()
  };
}

/** Garante que arquivos antigos (formato anterior) continuem funcionando. */
function normalizar(raw){
  const base = dadosPadrao();
  const d = Object.assign({}, base, raw || {});

  d.listas = Object.assign({}, base.listas, (raw && raw.listas) || {});
  if(!Array.isArray(d.columns) || !d.columns.length){
    d.columns = base.columns;
  }
  d.columns = d.columns.map(c => ({ id: c.id || uid(), name: c.name || "Sem nome" }));

  if(!Array.isArray(d.cards)) d.cards = [];
  let maxNum = 0;

  d.cards = d.cards.map(c => {
    const card = Object.assign(cardPadrao(), c);
    card.redes = Object.assign({facebook:"",twitter:"",linkedin:"",skype:"",instagram:""}, c.redes || {});
    card.produtos = Array.isArray(c.produtos) ? c.produtos : [];
    card.pessoas = Array.isArray(c.pessoas) ? c.pessoas.map(p => Object.assign({
      id: uid(), nome:"", cargo:"", email:"", celular:"", whatsapp:"", telefone:""
    }, p)) : [];
    card.agendamentos = Array.isArray(c.agendamentos) ? c.agendamentos.map(a => ({
      id: a.id || uid(),
      tipo: ACT_TYPES[a.tipo] ? a.tipo : "nota",
      data: a.data || "",
      nota: a.nota || "",
      concluido: !!a.concluido,
      criadoEm: a.criadoEm || card.criadoEm,
      criadoPor: a.criadoPor || d.usuario || "Eu",
      comentarios: Array.isArray(a.comentarios) ? a.comentarios.map(k => ({
        id: k.id || uid(),
        texto: k.texto || "",
        autor: k.autor || d.usuario || "Eu",
        criadoEm: k.criadoEm || new Date().toISOString()
      })) : []
    })) : [];
    card.posicao = Number(card.posicao) || 0;

    card.pedidos = Array.isArray(c.pedidos) ? c.pedidos.map(p => ({
      id: p.id || uid(),
      numero: Number(p.numero) || 0,
      data: p.data || "",
      itens: Array.isArray(p.itens) ? p.itens.map(it => ({
        id: it.id || uid(),
        produto: it.produto || "",
        quantidade: Number(it.quantidade) || 0,
        preco: Number(it.preco) || 0
      })) : [],
      formaPagamento: p.formaPagamento || "",
      comissaoPct: Number(p.comissaoPct) || 0,
      atual: !!p.atual,
      comentarios: Array.isArray(p.comentarios) ? p.comentarios.map(k => ({
        id: k.id || uid(),
        texto: k.texto || "",
        autor: k.autor || d.usuario || "Eu",
        criadoEm: k.criadoEm || new Date().toISOString()
      })) : [],
      criadoEm: p.criadoEm || new Date().toISOString(),
      criadoPor: p.criadoPor || d.usuario || "Eu",
      atualizadoEm: p.atualizadoEm || p.criadoEm || new Date().toISOString()
    })) : [];

    // numera pedidos antigos sem número e garante um único "atual"
    let maxPed = card.pedidos.reduce((m,p) => Math.max(m, p.numero), 0);
    card.pedidos.forEach(p => { if(!p.numero) p.numero = ++maxPed; });
    const atuais = card.pedidos.filter(p => p.atual);
    if(atuais.length !== 1 && card.pedidos.length){
      card.pedidos.forEach(p => { p.atual = false; });
      [...card.pedidos].sort((a,b) => b.numero - a.numero)[0].atual = true;
    }
    // endereço em texto livre da versão antiga
    if(!card.rua && c.endereco){ card.rua = c.endereco; }
    card.valor = Number(card.valor) || 0;
    if(!["andamento","ganho","perdido"].includes(card.status)) card.status = "andamento";
    if(!d.columns.some(col => col.id === card.columnId)) card.columnId = d.columns[0].id;
    card.numero = Number(card.numero) || 0;
    if(card.numero > maxNum) maxNum = card.numero;
    return card;
  });

  // numera os que vieram sem número
  d.seq = Math.max(Number(d.seq) || 0, maxNum);
  d.cards.forEach(c => {
    if(!c.numero){ d.seq += 1; c.numero = d.seq; }
    if(!c.codigo) c.codigo = c.numero + "-" + uid() + "@crm.local";
  });

  // ordena cada coluna: quem já tem posicao respeita, quem não tem mantém a
  // ordem em que estava no arquivo. No fim as posições ficam 0,1,2,3...
  d.columns.forEach(col => {
    const naCol = d.cards.filter(c => c.columnId === col.id);
    naCol.sort((a,b) => (a.posicao || 0) - (b.posicao || 0));   // sort estável
    naCol.forEach((c,i) => { c.posicao = i; });
  });

  if(!d.usuario) d.usuario = "Eu";
  if(!d.listas.responsaveis.length) d.listas.responsaveis = [d.usuario];
  return d;
}

function proximoNumero(){
  dados.seq = (Number(dados.seq) || 0) + 1;
  return dados.seq;
}

/* ---------------- IndexedDB (guarda o handle) ---------------- */
function idbOpen(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, val){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles","readwrite");
    tx.objectStore("handles").put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key){
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles","readonly");
    const req = tx.objectStore("handles").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ---------------- leitura / gravação ---------------- */
async function verifyPermission(handle, pedir){
  const opts = { mode: "readwrite" };
  if((await handle.queryPermission(opts)) === "granted") return true;
  if(pedir && (await handle.requestPermission(opts)) === "granted") return true;
  return false;
}

async function readFromFile(handle){
  try{
    const file = await handle.getFile();
    const txt = await file.text();
    if(!txt.trim()) return dadosPadrao();
    return normalizar(JSON.parse(txt));
  }catch(e){
    console.error("Falha ao ler o arquivo:", e);
    toast("Não foi possível ler o arquivo. Comecei com um funil novo.", "err");
    return dadosPadrao();
  }
}

async function writeToFile(){
  if(!dados) return;
  const json = JSON.stringify(dados, null, 2);
  if(fileHandle){
    try{
      const w = await fileHandle.createWritable();
      await w.write(json);
      await w.close();
    }catch(e){
      console.error("Falha ao salvar no arquivo:", e);
      toast("Não consegui gravar no arquivo. Verifique a permissão.", "err");
    }
  } else {
    try{ localStorage.setItem(LS_KEY, json); }
    catch(e){ toast("Não consegui salvar no navegador.", "err"); }
  }
}

/** grava com pequeno atraso, para não escrever a cada tecla */
function salvar(){
  if(dados) dados.atualizadoEm = new Date().toISOString();
  clearTimeout(saveTimer);
  if(modoBanco){
    marcarSalvando();
    saveTimer = setTimeout(sincronizar, 700);
  }else{
    saveTimer = setTimeout(writeToFile, 180);
  }
}

/* Quando existe login configurado, o sistema trabalha com o banco
   e a tela de "conectar arquivo" nem aparece. */
let modoBanco = false;

async function iniciarBanco(){
  try{
    dados = await carregarDoBanco();
    if(!dados) return false;
    modoBanco = true;
    mostrarApp();
    document.getElementById("fileChip").style.display = "none";
    const chip = document.getElementById("syncChip");
    if(chip) chip.style.display = "inline-flex";
    marcarSalvo(true);
    render();
    return true;
  }catch(e){
    console.error("carregar do banco:", e);
    document.getElementById("connectTitle").textContent = "Não consegui carregar seus dados";
    document.getElementById("connectText").textContent =
      "O servidor respondeu com: " + ((e && e.message) || e) +
      ". Confira sua internet e tente de novo.";
    document.getElementById("connectActions").innerHTML =
      '<button class="btn btn-primary" id="tentarDeNovo">Tentar de novo</button>' +
      '<button class="btn" id="usarArquivo">Usar arquivo local</button>';
    document.getElementById("tentarDeNovo").onclick = () => location.reload();
    document.getElementById("usarArquivo").onclick = () => { modoBanco = false; iniciarArmazenamento(); };
    mostrarConexao();
    return false;
  }
}

/* ---------------- tela de conexão ---------------- */
function mostrarApp(){
  document.getElementById("connectScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}
function mostrarConexao(){
  const sp = document.getElementById("splash");
  if(sp) sp.remove();
  document.getElementById("connectScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}
function atualizarChip(){
  const chip = document.getElementById("fileChip");
  const nome = document.getElementById("fileChipName");
  if(fileHandle){
    nome.textContent = fileHandle.name;
    chip.style.display = "inline-flex";
  } else if(!supportsFS){
    nome.textContent = "salvo no navegador — exporte backups";
    chip.style.display = "inline-flex";
  } else {
    chip.style.display = "none";
  }
}

async function criarArquivo(){
  try{
    const handle = await window.showSaveFilePicker({
      suggestedName: "crm-dados.json",
      types: [{ description:"JSON", accept:{ "application/json":[".json"] } }]
    });
    fileHandle = handle;
    dados = dadosPadrao();
    await writeToFile();
    await idbSet("fileHandle", handle);
    mostrarApp(); atualizarChip(); render();
    toast("Arquivo criado. Tudo será salvo nele.");
  }catch(e){ /* usuário cancelou */ }
}

async function abrirArquivo(){
  try{
    const [handle] = await window.showOpenFilePicker({
      types: [{ description:"JSON", accept:{ "application/json":[".json"] } }]
    });
    if(!(await verifyPermission(handle, true))){
      toast("Permissão negada para esse arquivo.", "err"); return;
    }
    fileHandle = handle;
    dados = await readFromFile(handle);
    await writeToFile();                 // regrava já normalizado
    await idbSet("fileHandle", handle);
    mostrarApp(); atualizarChip(); render();
    toast("Dados carregados de " + handle.name + ".");
  }catch(e){ /* usuário cancelou */ }
}

function telaEscolha(){
  document.getElementById("connectTitle").textContent = "Conectar arquivo de dados";
  document.getElementById("connectText").innerHTML =
    'Escolha o arquivo <span class="file-name">.json</span> onde este CRM vai guardar tudo. Ele fica na pasta que você escolher, no seu computador — para migrar de máquina, basta levar o arquivo.';
  document.getElementById("connectActions").innerHTML =
    '<button class="btn btn-primary" id="createFileBtn">Criar novo arquivo de dados</button>' +
    '<button class="btn" id="openFileBtn">Abrir arquivo existente</button>';
  document.getElementById("createFileBtn").onclick = criarArquivo;
  document.getElementById("openFileBtn").onclick = abrirArquivo;
}

async function iniciarArmazenamento(){
  telaEscolha();

  if(!supportsFS){
    let raw = null;
    try{ raw = localStorage.getItem(LS_KEY); }catch(e){}
    dados = normalizar(raw ? JSON.parse(raw) : null);
    document.getElementById("connectTitle").textContent = "Sobre este navegador";
    document.getElementById("connectText").textContent =
      "Este navegador não grava direto em arquivos. Seus dados ficam guardados no próprio navegador.";
    document.getElementById("connectNote").innerHTML =
      '<div class="notice notice-warn">Use <b>Exportar</b> com frequência: o arquivo .json baixado é o seu backup, e é ele que você leva para outro computador (lá você usa <b>Importar</b>). Para gravar direto na pasta, abra em Chrome, Edge ou Opera.</div>';
    document.getElementById("connectActions").innerHTML =
      '<button class="btn btn-primary" id="continueAnyway">Continuar assim</button>';
    document.getElementById("continueAnyway").onclick = () => {
      mostrarApp(); atualizarChip(); render();
    };
    return;
  }

  const saved = await idbGet("fileHandle").catch(() => null);
  if(!saved) return;

  if(await verifyPermission(saved, false)){
    fileHandle = saved;
    dados = await readFromFile(saved);
    mostrarApp(); atualizarChip(); render();
    return;
  }

  // precisa de um clique para reautorizar
  document.getElementById("connectTitle").textContent = "Reconectar arquivo de dados";
  document.getElementById("connectText").innerHTML =
    `Encontrei o arquivo <span class="file-name">${esc(saved.name)}</span> usado da última vez. Reconecte para continuar de onde parou.`;
  document.getElementById("connectActions").innerHTML =
    `<button class="btn btn-primary" id="reconnectBtn">Reconectar a ${esc(saved.name)}</button>` +
    `<button class="btn" id="otherFileBtn">Escolher outro arquivo</button>`;
  document.getElementById("reconnectBtn").onclick = async () => {
    if(await verifyPermission(saved, true)){
      fileHandle = saved;
      dados = await readFromFile(saved);
      mostrarApp(); atualizarChip(); render();
    } else {
      toast("Permissão negada.", "err");
    }
  };
  document.getElementById("otherFileBtn").onclick = telaEscolha;
}

/* ---------------- exportar / importar ---------------- */
function exportarBackup(){
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "crm-backup-" + new Date().toISOString().slice(0,10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
  toast("Backup exportado.");
}

function importarBackup(file){
  const reader = new FileReader();
  reader.onload = async evt => {
    let parsed;
    try{ parsed = JSON.parse(evt.target.result); }
    catch(e){ toast("Esse arquivo não é um JSON válido.", "err"); return; }
    if(!parsed || !parsed.columns || !parsed.cards){
      toast("O arquivo não tem o formato do CRM.", "err"); return;
    }
    const qtd = parsed.cards.length;
    const ok = await confirmar(
      `Importar substitui o funil atual pelos dados do arquivo (${qtd} negócio(s)). Os dados atuais serão perdidos.`,
      { titulo:"Importar backup", ok:"Importar", perigo:true }
    );
    if(!ok) return;
    dados = normalizar(parsed);
    await writeToFile();
    render();
    toast("Backup importado.");
  };
  reader.readAsText(file);
}
