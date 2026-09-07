/* =========================================================
   campos-novos.js — verifica as mudanças da ficha do cliente:

   - Nome fantasia / Nome do cliente
   - Inscrição estadual e Responsável (da empresa)
   - Dados bancários: banco, agência, C/C, poupança, Pix
   - Negócio no funil e Produtos e serviços: removidos
   - Tudo aparecendo na ficha do pedido em PDF

   Uso:
     cd testes
     node campos-novos.js
   ========================================================= */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const RAIZ = path.join(__dirname, "..") + "/";
const FIXTURE = path.join(__dirname, "fixtures", "funil-exemplo.json");

const falhas = [];
let total = 0;
function t(nome, fn){
  total++;
  try{
    const r = fn();
    if(r && typeof r.then === "function"){
      return r.then(() => console.log("  ok   " + nome))
              .catch(e => { console.log("  FALHA " + nome + " -> " + e.message); falhas.push(nome); });
    }
    console.log("  ok   " + nome);
  }
  catch(e){ console.log("  FALHA " + nome + " -> " + e.message); falhas.push(nome); }
}
function precisa(cond, msg){ if(!cond) throw new Error(msg); }

function montar(){
  const dom = new JSDOM(fs.readFileSync(RAIZ + "index.html", "utf8"),
    { runScripts:"outside-only", url:"https://exemplo.test/index.html", pretendToBeVisual:true });
  const w = dom.window, d = w.document;
  w.indexedDB = undefined;
  w.XLSX = { utils:{ aoa_to_sheet:aoa=>({__aoa:aoa}), book_new:()=>({s:[]}),
                     book_append_sheet:(wb,ws,n)=>wb.s.push({n,ws}),
                     encode_cell:({r,c})=>`R${r}C${c}` },
             writeFile:(wb,nome)=>{ w.__xlsx = {wb,nome}; } };
  w.__loc = { href:"https://exemplo.test/index.html", origin:"https://exemplo.test",
              pathname:"/index.html", replace:()=>{}, assign:()=>{}, reload:()=>{} };
  w.print = () => {};
  w.localStorage.setItem("kanbanCrmData", fs.readFileSync(FIXTURE, "utf8"));

  const arquivos = ["config.js","auth.js","util.js","storage.js","banco.js","board.js",
                    "empresa.js","negocio.js","pedidos.js","relatorios.js","segmentos.js","produtos.js","ordenacao.js","agenda.js",
                    "exportar-agendor.js","usuario.js","main.js"];
  let codigo = "const location = window.__loc;\n" +
    arquivos.map(f => fs.readFileSync(RAIZ + "assets/js/" + f, "utf8")).join("\n;\n");
  codigo = codigo.replace(/const sb = [\s\S]*?: null;/, "const sb = null;");
  codigo += `
;window.__x = {
  get dados(){return dados;}, set dados(v){dados=v;},
  get histAba(){return histAba;}, set histAba(v){histAba=v;},
  normalizar, paraCliente, renderFicha, linhasEmpresas, COLS_EMPRESAS,
  cardsFiltrados, renderCard, cardPadrao
};`;
  try{ w.eval(codigo); }
  catch(e){ falhas.push("EXEC: " + e.message); console.log("ERRO AO CARREGAR:", e.message); }
  return { w, d, X:()=>w.__x };
}

const A = montar();
const { w, d } = A;

console.log("\n== formulário da empresa ==");

t("seções removidas não existem mais", () => {
  const html = d.body.innerHTML;
  precisa(!d.getElementById("f_etapa"), "campo Etapa ainda existe");
  precisa(!d.getElementById("f_valor"), "campo Valor do negócio ainda existe");
  precisa(!d.getElementById("f_dataInicio"), "campo Data de início ainda existe");
  precisa(!d.getElementById("f_produtoInput"), "Produtos e serviços ainda existe");
  precisa(!d.getElementById("f_categoria"), "Categoria ainda existe");
  precisa(!d.getElementById("f_origem"), "Origem ainda existe");
  precisa(!d.getElementById("f_setor"), "Setor ainda existe");
  precisa(!/Negócio no funil/.test(html), "título 'Negócio no funil' ainda na tela");
  precisa(!/Produtos e serviços/.test(html), "título 'Produtos e serviços' ainda na tela");
});

t("campos novos existem", () => {
  ["f_ie","f_responsavelEmpresa","f_banco","f_agencia","f_cc","f_poupanca","f_pix"]
    .forEach(id => precisa(d.getElementById(id), "faltou o campo " + id));
});

t("rótulo do nome virou nome fantasia", () => {
  const lbl = d.querySelector('label[for="f_nome"]').textContent;
  precisa(/Nome fantasia/i.test(lbl), "rótulo continua: " + lbl);
});

t("seções mantidas continuam iguais", () => {
  const html = d.body.innerHTML;
  precisa(/Informações para contato/.test(html), "sumiu a seção de contato");
  precisa(/Dados de endereço/.test(html), "sumiu a seção de endereço");
  precisa(/Pessoas da empresa/.test(html), "sumiu Pessoas da empresa");
  precisa(/Redes sociais/.test(html), "sumiu Redes sociais");
  precisa(/Dados bancários/.test(html), "faltou a seção Dados bancários");
  ["f_email","f_whatsapp","f_telefone","f_celular","f_fax","f_ramal","f_website",
   "f_cep","f_pais","f_estado","f_cidade","f_bairro","f_rua","f_numero","f_complemento",
   "f_facebook","f_twitter","f_linkedin","f_skype","f_instagram"]
    .forEach(id => precisa(d.getElementById(id), "sumiu o campo " + id));
});

console.log("\n== salvar o cliente ==");

const CLI = {
  f_nome:"Malharia Aurora", f_cnpj:"12.345.678/0001-90", f_razao:"Aurora Têxtil LTDA",
  f_ie:"255.123.456.789", f_responsavelEmpresa:"Marcos Andrade",
  f_banco:"341 - Itaú", f_agencia:"1234-5", f_cc:"98765-4",
  f_poupanca:"11111-2", f_pix:"12.345.678/0001-90",
  f_email:"compras@aurora.com.br", f_whatsapp:"+55 47 99999-1234"
};

let cardNovo = null;

t("cadastro grava todos os campos novos", () => {
  const cols = A.X().dados.columns;
  w.abrirEmpresa(null, cols[1].id);              // abre já na 2ª etapa
  Object.entries(CLI).forEach(([id,v]) => { d.getElementById(id).value = v; });
  w.salvarEmpresa();

  cardNovo = A.X().dados.cards.find(c => c.nome === "Malharia Aurora");
  precisa(cardNovo, "o cliente não foi salvo");
  precisa(cardNovo.inscricaoEstadual === "255.123.456.789", "inscrição estadual não gravou");
  precisa(cardNovo.responsavelEmpresa === "Marcos Andrade", "responsável não gravou");
  precisa(cardNovo.banco === "341 - Itaú", "banco não gravou");
  precisa(cardNovo.agencia === "1234-5", "agência não gravou");
  precisa(cardNovo.contaCorrente === "98765-4", "conta corrente não gravou");
  precisa(cardNovo.contaPoupanca === "11111-2", "poupança não gravou");
  precisa(cardNovo.pix === "12.345.678/0001-90", "pix não gravou");
});

t("cliente novo entra na etapa de onde foi aberto", () => {
  const cols = A.X().dados.columns;
  precisa(cardNovo.columnId === cols[1].id,
    "caiu na etapa errada: " + cardNovo.columnId);
});

t("data de início é preenchida sozinha", () => {
  const hoje = new Date().toISOString().slice(0,10);
  precisa(cardNovo.dataInicio === hoje, "dataInicio veio como: " + cardNovo.dataInicio);
});

t("numeração e código continuam funcionando", () => {
  precisa(cardNovo.numero > 0, "ficou sem número");
  precisa(/@crm\.local$/.test(cardNovo.codigo), "código fora do padrão");
});

t("editar o cliente reabre os valores certos", () => {
  w.abrirEmpresa(cardNovo.id);
  precisa(d.getElementById("f_ie").value === "255.123.456.789", "IE não voltou no formulário");
  precisa(d.getElementById("f_pix").value === "12.345.678/0001-90", "Pix não voltou no formulário");
  precisa(d.getElementById("f_responsavelEmpresa").value === "Marcos Andrade", "responsável não voltou");
  w.fecharEmpresa();
});

t("editar não muda a etapa nem duplica o cliente", () => {
  const cols = A.X().dados.columns;
  const antes = A.X().dados.cards.length;
  w.abrirEmpresa(cardNovo.id);
  d.getElementById("f_banco").value = "033 - Santander";
  w.salvarEmpresa();
  const depois = A.X().dados.cards.filter(c => c.nome === "Malharia Aurora");
  precisa(depois.length === 1, "duplicou o cliente");
  precisa(depois[0].banco === "033 - Santander", "não salvou a alteração");
  precisa(depois[0].columnId === cols[1].id, "a etapa mudou sozinha ao editar");
  precisa(A.X().dados.cards.length === antes, "criou cartão a mais");
});

console.log("\n== ficha do pedido em PDF ==");

t("PDF traz cadastro, dados bancários, contato e endereço", () => {
  const card = A.X().dados.cards.find(c => (c.pedidos||[]).length);
  precisa(card, "a fixture não tem nenhum pedido");
  card.inscricaoEstadual = "111.222.333.444";
  card.responsavelEmpresa = "Joana Prado";
  card.banco = "104 - Caixa";
  card.agencia = "0455";
  card.contaCorrente = "00012-3";
  card.contaPoupanca = "013-00012-3";
  card.pix = "joana@empresa.com.br";
  card.rua = "Rua das Palmeiras"; card.numero_end = "450";
  card.cidade = "Brusque"; card.estado = "SC"; card.cep = "88350-000";

  w.abrirFichaPedido(card, card.pedidos[0].id);
  const html = d.getElementById("fichaContent").innerHTML;

  precisa(/Dados do cliente/.test(html), "faltou Dados do cliente");
  precisa(/Nome fantasia/.test(html), "faltou o rótulo Nome fantasia");
  precisa(/Inscrição estadual/.test(html) && /111\.222\.333\.444/.test(html), "faltou a inscrição estadual");
  precisa(/Joana Prado/.test(html), "faltou o responsável");
  precisa(/Dados bancários/.test(html), "faltou a seção Dados bancários");
  precisa(/104 - Caixa/.test(html), "faltou o banco");
  precisa(/0455/.test(html), "faltou a agência");
  precisa(/00012-3/.test(html), "faltou a conta corrente");
  precisa(/joana@empresa\.com\.br/.test(html), "faltou o Pix");
  precisa(/Endereço de faturamento/.test(html), "faltou o endereço de faturamento");
  precisa(/Rua das Palmeiras/.test(html) && /Brusque/.test(html), "endereço não montou");
  precisa(/Itens do pedido/.test(html), "faltaram os itens");
  precisa(/Forma de pagamento/.test(html), "faltou a forma de pagamento");
  precisa(/Conferido por/.test(html), "faltaram as assinaturas");
  precisa(!/Categoria|Setor|Origem/.test(html), "campos removidos ainda saem no PDF");
});

t("PDF sem dados bancários não mostra a seção vazia", () => {
  const card = A.X().dados.cards.find(c => (c.pedidos||[]).length);
  ["banco","agencia","contaCorrente","contaPoupanca","pix"].forEach(k => { card[k] = ""; });
  w.abrirFichaPedido(card, card.pedidos[0].id);
  const html = d.getElementById("fichaContent").innerHTML;
  precisa(!/Dados bancários/.test(html), "mostrou a seção bancária vazia");
  precisa(/Dados do cliente/.test(html), "quebrou o resto da ficha");
});

console.log("\n== banco de dados ==");

t("paraCliente envia os campos novos", () => {
  const linha = A.X().paraCliente(cardNovo, "OWNER-1");
  precisa(linha.inscricao_estadual === "255.123.456.789", "inscricao_estadual não foi");
  precisa(linha.responsavel_empresa === "Marcos Andrade", "responsavel_empresa não foi");
  precisa(linha.conta_corrente === "98765-4", "conta_corrente não foi");
  precisa(linha.conta_poupanca === "11111-2", "conta_poupanca não foi");
  precisa(linha.pix === "12.345.678/0001-90", "pix não foi");
  precisa(linha.agencia === "1234-5", "agencia não foi");
});

t("schema.sql e atualizar-campos.sql têm as colunas", () => {
  const schema = fs.readFileSync(RAIZ + "banco/schema.sql", "utf8");
  const migra  = fs.readFileSync(RAIZ + "banco/atualizar-campos.sql", "utf8");
  ["inscricao_estadual","responsavel_empresa","banco","agencia",
   "conta_corrente","conta_poupanca","pix"].forEach(col => {
    precisa(schema.includes(col), "schema.sql sem a coluna " + col);
    precisa(migra.includes(col), "atualizar-campos.sql sem a coluna " + col);
  });
});

/* Banco antigo, sem as colunas novas: o sistema tem que continuar
   salvando o cliente em vez de travar. */
function montarBancoAntigo(){
  const dom = new JSDOM(fs.readFileSync(RAIZ + "index.html", "utf8"),
    { runScripts:"outside-only", url:"https://exemplo.test/index.html", pretendToBeVisual:true });
  const w = dom.window;
  w.indexedDB = undefined;
  w.__loc = { replace:()=>{}, assign:()=>{}, reload:()=>{},
              href:"", origin:"https://exemplo.test", pathname:"/index.html" };
  w.__enviado = [];
  const COLS_ANTIGAS = new Set(["id","owner_id","nome","cnpj","razao_social","categoria",
    "origem","setor","descricao","email","whatsapp","telefone","celular","fax","ramal",
    "website","cep","pais","estado","cidade","bairro","rua","numero","complemento",
    "redes","atualizado_em"]);
  w.__sbStub = {
    from: () => ({
      upsert: async linhas => {
        const fora = Object.keys(linhas[0]).filter(k => !COLS_ANTIGAS.has(k));
        if(fora.length){
          return { error:{ code:"PGRST204",
            message:`Could not find the '${fora[0]}' column of 'clientes' in the schema cache` } };
        }
        w.__enviado.push(linhas);
        return { error:null };
      }
    })
  };
  const arquivos = ["config.js","auth.js","util.js","storage.js","banco.js"];
  let codigo = "const location = window.__loc;\n" +
    arquivos.map(f => fs.readFileSync(RAIZ + "assets/js/" + f, "utf8")).join("\n;\n");
  codigo = codigo.replace(/const sb = [\s\S]*?: null;/, "const sb = window.__sbStub;");
  codigo += "\n;window.__b = { gravarClientes, paraCliente, get novos(){return clienteTemCamposNovos;} };";
  w.eval(codigo);
  return w;
}

t("banco sem as colunas novas: salva mesmo assim, sem travar", async () => {
  const wb = montarBancoAntigo();
  const linha = wb.__b.paraCliente({ id:"11111111-1111-4111-8111-111111111111",
    nome:"Aurora", pix:"chave-pix", banco:"341", inscricaoEstadual:"123" }, "OWNER-1");
  precisa(linha.pix === "chave-pix", "a primeira tentativa devia levar o pix");

  await wb.__b.gravarClientes([linha]);          // não pode lançar erro

  precisa(wb.__enviado.length === 1, "não regravou sem as colunas novas");
  const gravado = wb.__enviado[0][0];
  precisa(gravado.nome === "Aurora", "perdeu o nome do cliente");
  precisa(!("pix" in gravado), "insistiu em mandar a coluna que não existe");
  precisa(wb.__b.novos === false, "não desligou os campos novos");

  // da segunda vez já manda direto sem as colunas novas
  const l2 = wb.__b.paraCliente({ id:"22222222-2222-4222-8222-222222222222",
    nome:"Beta", pix:"x" }, "OWNER-1");
  precisa(!("pix" in l2), "continuou montando a linha com as colunas novas");
});

console.log("\n== compatibilidade ==");

t("cliente antigo continua abrindo sem perder nada", () => {
  const antigo = A.X().normalizar({
    columns:[{id:"c1",name:"Etapa"}],
    cards:[{ id:"x1", columnId:"c1", nome:"Cliente Velho", cnpj:"11.111.111/0001-11",
             categoria:"Cliente", origem:"Indicação", setor:"Confecção",
             responsavel:"Fernanda Lopes", email:"velho@exemplo.com" }]
  });
  const c = antigo.cards[0];
  precisa(c.nome === "Cliente Velho", "perdeu o nome");
  precisa(c.email === "velho@exemplo.com", "perdeu o e-mail");
  precisa(c.responsavelEmpresa === "Fernanda Lopes",
    "o responsável antigo não foi aproveitado: " + c.responsavelEmpresa);
  precisa(c.inscricaoEstadual === "", "IE devia nascer vazia");
  precisa(c.banco === "" && c.pix === "", "campos bancários deviam nascer vazios");
});

t("busca no funil acha por IE, responsável e pix", () => {
  const inp = d.getElementById("searchInput");
  const achar = termo => { inp.value = termo; return A.X().cardsFiltrados(); };
  precisa(achar("255.123").some(c => c.nome === "Malharia Aurora"), "não achou pela inscrição estadual");
  precisa(achar("Marcos Andrade").some(c => c.nome === "Malharia Aurora"), "não achou pelo responsável");
  precisa(achar("Santander").some(c => c.nome === "Malharia Aurora"), "não achou pelo banco");
  inp.value = "";
});

t("planilha de conferência traz as colunas novas", () => {
  const cols = A.X().COLS_EMPRESAS;
  ["Nome fantasia","Inscrição estadual","Responsável","Banco","Agência",
   "Conta corrente","Conta poupança","Pix"].forEach(c =>
    precisa(cols.includes(c), "faltou a coluna " + c));
  const linhas = A.X().linhasEmpresas(A.X().dados);
  precisa(linhas[0].length === cols.length, "colunas e linhas com tamanhos diferentes");
  const linha = linhas.find(l => l[0] === "Malharia Aurora");
  precisa(linha && linha[cols.indexOf("Pix")] === "12.345.678/0001-90", "Pix errado na planilha");
});

setTimeout(() => {
console.log("\n########## RESULTADO ##########");
console.log(`  ${total - falhas.length} de ${total} verificações passaram`);
if(falhas.length){ console.log("  FALHOU:\n   - " + falhas.join("\n   - ")); process.exit(1); }
console.log("  tudo certo\n");
}, 300);
