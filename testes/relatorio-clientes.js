/* =========================================================
   relatorio-clientes.js — verifica o relatório de clientes:
   filtros de etapa/estado/cidade, dependência cidade→estado,
   ordenações, colunas da folha e exportação para Excel.

   Uso:
     cd testes
     node relatorio-clientes.js
   ========================================================= */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..") + "/";

const falhas = [];
let total = 0;
function t(nome, fn){
  total++;
  try{ fn(); console.log("  ok   " + nome); }
  catch(e){ console.log("  FALHA " + nome + " -> " + e.message); falhas.push(nome); }
}
function precisa(cond, msg){ if(!cond) throw new Error(msg); }

/* ---- base de teste: clientes espalhados por etapas e cidades ---- */
const COLS = [
  { id:"c1", name:"Contato Iniciado" },
  { id:"c2", name:"Em Negociação" },
  { id:"c3", name:"Cliente Comprador" }
];
function cli(id, nome, columnId, cidade, estado, extra){
  return Object.assign({
    id, nome, columnId, cidade, estado,
    numero: Number(id.replace(/\D/g,"")) || 1,
    cnpj:"", telefone:"", celular:"", whatsapp:"",
    criadoEm:"2026-01-0" + (Number(id.replace(/\D/g,"")) || 1) + "T10:00:00.000Z",
    pedidos:[], pessoas:[], redes:{}
  }, extra || {});
}
const BASE = {
  boardName:"NST Print", usuario:"Gustavo de Oliveira",
  columns: COLS,
  cards: [
    cli("k1","Zeta Serigrafia","c1","Brusque","SC",{ cnpj:"11.111.111/0001-11", telefone:"(47) 3355-0001" }),
    cli("k2","Alfa Camisetas","c1","Blumenau","SC",{ celular:"(47) 99999-0002" }),
    cli("k3","Beta Uniformes","c2","Brusque","SC",{ whatsapp:"+55 47 98888-0003" }),
    cli("k4","Delta Estamparia","c2","Curitiba","PR",{ telefone:"(41) 3232-0004" }),
    cli("k5","Ômega Malhas","c3","São Paulo","SP",{ telefone:"(11) 3131-0005" }),
    cli("k6","Gama Têxtil","c3","","",{}),                    // sem endereço
    cli("k7","Sigma Bordados","c1","BRUSQUE","SC",{})          // caixa diferente de propósito
  ],
  listas:{ categorias:[], origens:[], setores:[], responsaveis:[], produtos:[], formasPagamento:[] },
  agenda:[], numeroSeq:8
};

function montar(){
  const dom = new JSDOM(fs.readFileSync(RAIZ + "index.html", "utf8"),
    { runScripts:"outside-only", url:"https://exemplo.test/index.html", pretendToBeVisual:true });
  const w = dom.window, d = w.document;
  w.indexedDB = undefined;
  w.print = () => {};
  w.XLSX = { utils:{ aoa_to_sheet:aoa=>({__aoa:aoa}), book_new:()=>({s:[]}),
                     book_append_sheet:(wb,ws,n)=>wb.s.push({n,ws}),
                     encode_cell:({r,c})=>`R${r}C${c}` },
             writeFile:(wb,nome)=>{ w.__xlsx = {wb,nome}; } };
  w.__loc = { href:"", origin:"https://exemplo.test", pathname:"/index.html",
              replace:()=>{}, assign:()=>{}, reload:()=>{} };
  w.localStorage.setItem("kanbanCrmData", JSON.stringify(BASE));

  const arquivos = ["config.js","auth.js","util.js","storage.js","banco.js","board.js",
                    "empresa.js","negocio.js","pedidos.js","relatorios.js","segmentos.js","produtos.js","agenda.js",
                    "exportar-agendor.js","usuario.js","main.js"];
  let codigo = "const location = window.__loc;\n" +
    arquivos.map(f => fs.readFileSync(RAIZ + "assets/js/" + f, "utf8")).join("\n;\n");
  codigo = codigo.replace(/const sb = [\s\S]*?: null;/, "const sb = null;");
  codigo += `
;window.__x = {
  get dados(){return dados;}, set dados(v){dados=v;},
  get etapa(){return relCliEtapa;}, set etapa(v){relCliEtapa=v;},
  get uf(){return relCliUF;},       set uf(v){relCliUF=v;},
  get cidade(){return relCliCidade;}, set cidade(v){relCliCidade=v;},
  get ordem(){return relCliOrdem;}, set ordem(v){relCliOrdem=v;},
  normalizar, clientesFiltrados, cidadesDisponiveis, estadosDisponiveis,
  telefoneCliente, cidadeUf, nomeEtapa, ORDENS_CLI
};`;
  try{ w.eval(codigo); }
  catch(e){ falhas.push("EXEC: " + e.message); console.log("ERRO AO CARREGAR:", e.message); }
  w.__x.dados = w.__x.normalizar(JSON.parse(JSON.stringify(BASE)));
  return { w, d, X:()=>w.__x };
}

const A = montar();
const { w, d } = A;
const X = A.X();

/** abre o relatório e devolve o HTML da folha */
function abrir(){
  w.abrirRelClientes();
  return d.getElementById("relFolha").innerHTML;
}
/** nomes dos clientes na ordem em que saíram na tabela */
function nomesNaFolha(){
  return [...d.querySelectorAll("#relFolha tbody tr")]
    .map(tr => tr.querySelector("td:nth-child(2)").textContent.trim());
}

console.log("\n== menu e abertura ==");

t("o menu tem a opção Clientes", () => {
  const b = d.querySelector('#relMenu [data-rel="clientes"]');
  precisa(b, "não achei o botão no menu");
  precisa(/Clientes/.test(b.textContent), "o botão não diz Clientes");
});

t("abre com todos os filtros em Todos", () => {
  abrir();
  precisa(X.etapa === "todas", "etapa não começou em todas");
  precisa(X.uf === "todos", "estado não começou em todos");
  precisa(X.cidade === "todas", "cidade não começou em todas");
  precisa(d.getElementById("relOverlay").classList.contains("show"), "a janela não abriu");
});

t("por padrão traz os clientes de todas as etapas", () => {
  abrir();
  const nomes = nomesNaFolha();
  precisa(nomes.length === 7, "vieram " + nomes.length + " clientes, esperava 7");
  ["Zeta Serigrafia","Alfa Camisetas","Beta Uniformes","Delta Estamparia",
   "Ômega Malhas","Gama Têxtil","Sigma Bordados"].forEach(n =>
    precisa(nomes.includes(n), "faltou o cliente " + n));
});

console.log("\n== colunas da folha ==");

t("traz nome, CNPJ, telefone, cidade/estado e a etapa", () => {
  abrir();
  const html = d.getElementById("relFolha").innerHTML;
  ["Cliente","CNPJ","Telefone","Cidade/Estado","Etapa no funil"].forEach(c =>
    precisa(html.includes(c), "faltou a coluna " + c));
  const linha = [...d.querySelectorAll("#relFolha tbody tr")]
    .find(tr => /Zeta Serigrafia/.test(tr.textContent));
  const td = [...linha.querySelectorAll("td")].map(x => x.textContent.trim());
  precisa(td[2] === "11.111.111/0001-11", "CNPJ errado: " + td[2]);
  precisa(td[3] === "(47) 3355-0001", "telefone errado: " + td[3]);
  precisa(td[4] === "Brusque/SC", "cidade/estado errado: " + td[4]);
  precisa(td[5] === "Contato Iniciado", "etapa errada: " + td[5]);
});

t("sem telefone fixo, usa o celular ou o WhatsApp", () => {
  precisa(X.telefoneCliente({ celular:"(47) 99999-0002" }) === "(47) 99999-0002", "não usou o celular");
  precisa(X.telefoneCliente({ whatsapp:"+55 47 98888-0003" }) === "+55 47 98888-0003", "não usou o WhatsApp");
  precisa(X.telefoneCliente({ telefone:"A", celular:"B" }) === "A", "o fixo devia vir primeiro");
  precisa(X.telefoneCliente({}) === "", "devia vir vazio");
});

t("cliente sem endereço aparece com traço", () => {
  abrir();
  const linha = [...d.querySelectorAll("#relFolha tbody tr")]
    .find(tr => /Gama Têxtil/.test(tr.textContent));
  const td = [...linha.querySelectorAll("td")].map(x => x.textContent.trim());
  precisa(td[4] === "—", "cidade/estado devia ser traço, veio: " + td[4]);
  precisa(td[5] === "Cliente Comprador", "perdeu a etapa do cliente sem endereço");
});

console.log("\n== filtro de etapa ==");

t("filtrar por etapa traz só aquela coluna", () => {
  abrir();
  d.getElementById("fCliEtapa").value = "c2";
  d.getElementById("fCliEtapa").dispatchEvent(new w.Event("change"));
  const nomes = nomesNaFolha();
  precisa(nomes.length === 2, "vieram " + nomes.length + ", esperava 2");
  precisa(nomes.includes("Beta Uniformes") && nomes.includes("Delta Estamparia"),
    "trouxe os clientes errados: " + nomes.join(", "));
});

t("o estado só oferece o que existe na etapa escolhida", () => {
  // ainda na etapa c2: Brusque/SC e Curitiba/PR
  const ufs = [...d.querySelectorAll("#fCliUF option")].map(o => o.value);
  precisa(ufs.includes("SC") && ufs.includes("PR"), "faltaram SC ou PR");
  precisa(!ufs.includes("SP"), "ofereceu SP, que só existe em outra etapa");
});

console.log("\n== filtro de estado e cidade ==");

t("escolher o estado limita as cidades àquele estado", () => {
  X.etapa = "todas"; X.uf = "todos"; X.cidade = "todas";
  abrir();
  d.getElementById("fCliUF").value = "SC";
  d.getElementById("fCliUF").dispatchEvent(new w.Event("change"));
  const cidades = [...d.querySelectorAll("#fCliCidade option")]
    .map(o => o.textContent.trim()).filter(x => x !== "Todas");
  precisa(cidades.length === 2, "vieram " + cidades.length + " cidades: " + cidades.join(", "));
  precisa(cidades.some(c => /Brusque/i.test(c)), "faltou Brusque");
  precisa(cidades.some(c => /Blumenau/i.test(c)), "faltou Blumenau");
  precisa(!cidades.some(c => /Curitiba|São Paulo/i.test(c)), "vazou cidade de outro estado");
});

t("Brusque e BRUSQUE contam como a mesma cidade", () => {
  const cidades = X.cidadesDisponiveis().filter(c => /brusque/i.test(c.nome));
  precisa(cidades.length === 1, "Brusque apareceu " + cidades.length + " vezes na lista");
});

t("filtrar a cidade traz os dois clientes de Brusque, em qualquer caixa", () => {
  d.getElementById("fCliCidade").value = "brusque";
  d.getElementById("fCliCidade").dispatchEvent(new w.Event("change"));
  const nomes = nomesNaFolha();
  precisa(nomes.length === 3, "vieram " + nomes.length + ": " + nomes.join(", "));
  ["Zeta Serigrafia","Beta Uniformes","Sigma Bordados"].forEach(n =>
    precisa(nomes.includes(n), "faltou " + n));
});

t("trocar o estado solta a cidade escolhida", () => {
  d.getElementById("fCliUF").value = "PR";
  d.getElementById("fCliUF").dispatchEvent(new w.Event("change"));
  precisa(X.cidade === "todas", "a cidade continuou presa em: " + X.cidade);
  const nomes = nomesNaFolha();
  precisa(nomes.length === 1 && nomes[0] === "Delta Estamparia",
    "esperava só a Delta, veio: " + nomes.join(", "));
});

t("mudar a etapa desfaz um estado que não existe mais nela", () => {
  // está em PR; a etapa c3 não tem ninguém no PR
  d.getElementById("fCliEtapa").value = "c3";
  d.getElementById("fCliEtapa").dispatchEvent(new w.Event("change"));
  precisa(X.uf === "todos", "o estado continuou em " + X.uf);
  const nomes = nomesNaFolha();
  precisa(nomes.length === 2, "esperava os 2 clientes da etapa, veio " + nomes.length);
});

t("combinação sem resultado avisa em vez de quebrar", () => {
  X.etapa = "c3"; X.uf = "todos"; X.cidade = "todas";
  abrir();
  X.cidade = "brusque";                       // c3 não tem ninguém em Brusque
  w.renderRelClientes();
  const html = d.getElementById("relFolha").innerHTML;
  precisa(/Nenhum cliente com esses filtros/.test(html), "não mostrou o aviso de vazio");
});

t("Limpar filtros volta tudo para Todos", () => {
  d.getElementById("fCliLimpar").click();
  precisa(X.etapa === "todas" && X.uf === "todos" && X.cidade === "todas" && X.ordem === "nome",
    "não limpou tudo");
  precisa(nomesNaFolha().length === 7, "não voltou a lista completa");
});

console.log("\n== ordenação ==");

t("ordem alfabética pelo nome", () => {
  X.etapa="todas"; X.uf="todos"; X.cidade="todas"; X.ordem="nome";
  abrir();
  const nomes = nomesNaFolha();
  const esperado = [...nomes].sort((a,b) => a.localeCompare(b,"pt-BR"));
  precisa(JSON.stringify(nomes) === JSON.stringify(esperado),
    "fora de ordem: " + nomes.join(", "));
  precisa(nomes[0] === "Alfa Camisetas", "o primeiro devia ser Alfa Camisetas, veio " + nomes[0]);
});

t("ordem por cidade/estado agrupa por UF e joga os sem endereço para o fim", () => {
  d.getElementById("fCliOrdem").value = "cidade";
  d.getElementById("fCliOrdem").dispatchEvent(new w.Event("change"));
  const nomes = nomesNaFolha();
  precisa(nomes[nomes.length-1] === "Gama Têxtil",
    "o cliente sem endereço devia ficar por último, veio " + nomes[nomes.length-1]);
  const ufs = [...d.querySelectorAll("#relFolha tbody tr")]
    .map(tr => tr.querySelector("td:nth-child(5)").textContent.trim())
    .filter(x => x !== "—").map(x => x.split("/")[1]);
  precisa(JSON.stringify(ufs) === JSON.stringify([...ufs].sort()),
    "os estados saíram fora de ordem: " + ufs.join(","));
});

t("ordem por etapa segue a ordem das colunas do funil, não o alfabeto", () => {
  d.getElementById("fCliOrdem").value = "etapa";
  d.getElementById("fCliOrdem").dispatchEvent(new w.Event("change"));
  const etapas = [...d.querySelectorAll("#relFolha tbody tr")]
    .map(tr => tr.querySelector("td:nth-child(6)").textContent.trim());
  const pos = etapas.map(e => COLS.findIndex(c => c.name === e));
  precisa(JSON.stringify(pos) === JSON.stringify([...pos].sort((a,b)=>a-b)),
    "as etapas saíram fora da ordem do funil: " + etapas.join(" | "));
  precisa(etapas[0] === "Contato Iniciado", "devia começar pela 1ª etapa, veio " + etapas[0]);
});

t("ordem por cadastro mais recente", () => {
  d.getElementById("fCliOrdem").value = "recentes";
  d.getElementById("fCliOrdem").dispatchEvent(new w.Event("change"));
  const nomes = nomesNaFolha();
  precisa(nomes[0] === "Sigma Bordados", "o mais recente devia vir primeiro, veio " + nomes[0]);
});

console.log("\n== cabeçalho e Excel ==");

t("o cabeçalho mostra os filtros e a contagem", () => {
  X.etapa="c1"; X.uf="SC"; X.cidade="todas"; X.ordem="nome";
  abrir();
  const html = d.getElementById("relFolha").innerHTML;
  precisa(/Relatório de clientes/.test(html), "faltou o título");
  precisa(/Contato Iniciado/.test(html), "não mostrou a etapa filtrada");
  precisa(/SC/.test(html), "não mostrou o estado filtrado");
  precisa(/Nome \(A → Z\)/.test(html), "não mostrou a ordenação");
  const sub = d.querySelector("#relContent .sub").textContent;
  precisa(/3 cliente\(s\)/.test(sub), "contagem errada no topo: " + sub);
});

t("o Excel sai com as mesmas colunas e linhas", () => {
  X.etapa="todas"; X.uf="todos"; X.cidade="todas"; X.ordem="nome";
  abrir();
  d.getElementById("relCliXlsx").click();
  const aoa = w.__xlsx.wb.s[0].ws.__aoa;
  precisa(w.__xlsx.nome === "clientes.xlsx", "nome do arquivo: " + w.__xlsx.nome);
  precisa(JSON.stringify(aoa[0]) ===
    JSON.stringify(["#","Cliente","CNPJ","Telefone","Cidade","Estado","Etapa no funil"]),
    "cabeçalho diferente: " + aoa[0].join(","));
  precisa(aoa.length === 8, "esperava 7 clientes + cabeçalho, veio " + (aoa.length-1));
  const zeta = aoa.find(l => l[1] === "Zeta Serigrafia");
  precisa(zeta[3] === "(47) 3355-0001" && zeta[4] === "Brusque" && zeta[5] === "SC",
    "linha do Zeta errada: " + zeta.join(" | "));
  precisa(zeta[6] === "Contato Iniciado", "etapa errada no Excel: " + zeta[6]);
});

console.log("\n== não quebrou o que já existia ==");

t("o relatório de vendas continua abrindo", () => {
  w.abrirRelVendas();
  const html = d.getElementById("relContent").innerHTML;
  precisa(/Vendas e comissões/.test(html), "o relatório de vendas parou de abrir");
  precisa(d.getElementById("relPrint"), "sumiu o botão de imprimir das vendas");
});

t("dá para voltar do de vendas para o de clientes", () => {
  w.abrirRelClientes();
  precisa(/Relatório de clientes/.test(d.getElementById("relFolha").innerHTML),
    "não voltou para o de clientes");
});

console.log("\n########## RESULTADO ##########");
console.log(`  ${total - falhas.length} de ${total} verificações passaram`);
if(falhas.length){ console.log("  FALHOU:\n   - " + falhas.join("\n   - ")); process.exit(1); }
console.log("  tudo certo\n");
