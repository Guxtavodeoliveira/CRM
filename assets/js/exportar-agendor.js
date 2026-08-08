/* =========================================================
   exportar-agendor.js
   Converte os dados do CRM para as planilhas do Agendor.

   Planilha 1 — "negocios-agendor.xlsx": layout IDÊNTICO ao modelo
   oficial "exemplo-importacao-negocios.xlsx" (16 colunas, aba
   "Negócios"). É esta que entra no importador do Agendor.

   Planilha 2 — "conferencia-crm.xlsx": tudo o que o modelo de
   negócios NÃO carrega (endereço, telefones, redes sociais,
   pessoas da empresa e o histórico de atividades), para você não
   perder nada e conferir depois da importação.
   ========================================================= */

/* Cabeçalhos na ordem exata do modelo oficial. Não altere. */
const AGENDOR_COLS = [
  "Título do negócio",
  "CNPJ da empresa relacionada",
  "Nome da empresa relacionada",
  "Pessoa relacionada",
  "Usuário responsável",
  "Data de início",
  "Data de conclusão",
  "Valor Total",
  "Funil",
  "Etapa",
  "Status",
  "Motivo de perda",
  "Descrição do motivo de perda",
  "Ranking",
  "Descrição",
  "Produtos e Serviços"
];

const STATUS_AGENDOR = { andamento:"Em andamento", ganho:"Ganho", perdido:"Perdido" };

/** "04/08/2026 12:00" — absoluto, porque em planilha "Amanhã" não ajuda */
function dataHoraCurta(iso){
  const d = iso ? new Date(iso) : null;
  if(!d || isNaN(d)) return "";
  const p = n => String(n).padStart(2,"0");
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** O modelo do Agendor não importa atividades. Para o próximo passo não se
    perder, ele vai para a Descrição quando ela está vazia. */
function descricaoComProximoPasso(c){
  if(c.descricao) return c.descricao;
  const pend = (c.agendamentos || [])
    .filter(a => !a.concluido && a.nota)
    .sort((a,b) => new Date(a.data || 0) - new Date(b.data || 0))[0];
  if(!pend) return "";
  const t = ACT_TYPES[pend.tipo] || ACT_TYPES.nota;
  const quando = dataHoraCurta(pend.data);
  return `Próximo passo — ${t.label}${quando ? " em " + quando : ""}: ${pend.nota}`;
}

/** "2026-08-03" -> objeto Date (sem fuso atrapalhando) */
function dataParaExcel(s){
  if(!s) return null;
  const t = String(s).slice(0,10).split("-");
  if(t.length !== 3) return null;
  const d = new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2]));
  return isNaN(d) ? null : d;
}

/** Uma linha da aba "Negócios" para cada negócio do funil. */
function linhasNegocios(base, opcoes){
  const op = Object.assign({ incluirPessoa:true, apenasFiltrados:null, proximoPassoNaDescricao:true }, opcoes || {});
  const etapa = {};
  base.columns.forEach(c => { etapa[c.id] = c.name; });

  const cards = op.apenasFiltrados || base.cards;

  return cards.map(c => {
    const contato = (c.pessoas || []).find(p => p.nome);
    return [
      `${c.numero} - ${c.nome}`,                                  // Título do negócio
      c.cnpj || "",                                               // CNPJ (texto, com ou sem máscara)
      c.nome || "",                                               // Nome da empresa relacionada
      op.incluirPessoa && contato ? contato.nome : "",             // Pessoa relacionada
      c.responsavel || base.usuario || "",                        // Usuário responsável
      dataParaExcel(c.dataInicio),                                // Data de início
      dataParaExcel(c.dataConclusao),                             // Data de conclusão
      Number(c.valor) || 0,                                       // Valor Total
      base.boardName || "",                                       // Funil
      etapa[c.columnId] || "",                                    // Etapa
      STATUS_AGENDOR[c.status] || "Em andamento",                 // Status
      c.motivoPerda || "",                                        // Motivo de perda
      c.descricaoPerda || "",                                     // Descrição do motivo de perda
      Number(c.estrelas) || "",                                   // Ranking (1 a 5)
      op.proximoPassoNaDescricao ? descricaoComProximoPasso(c) : (c.descricao || ""), // Descrição
      (c.produtos || []).join(", ")                               // Produtos e Serviços
    ];
  });
}

/* ---------- planilhas de conferência ---------- */
const COLS_EMPRESAS = [
  "Nome","CNPJ","Razão social","Categoria","Origem","Setor","Responsável","Descrição",
  "E-mail","WhatsApp","Telefone","Celular","Fax","Ramal","Website",
  "CEP","País","Estado","Cidade","Bairro","Rua","Número","Complemento",
  "Facebook","X (twitter)","LinkedIn","Skype","Instagram","Produtos e Serviços"
];
function linhasEmpresas(base){
  return base.cards.map(c => [
    c.nome, c.cnpj, c.razaoSocial, c.categoria, c.origem, c.setor,
    c.responsavel || base.usuario, c.descricao,
    c.email, c.whatsapp, c.telefone, c.celular, c.fax, c.ramal, c.website,
    c.cep, c.pais, c.estado, c.cidade, c.bairro, c.rua, c.numero_end, c.complemento,
    (c.redes||{}).facebook, (c.redes||{}).twitter, (c.redes||{}).linkedin,
    (c.redes||{}).skype, (c.redes||{}).instagram,
    (c.produtos||[]).join(", ")
  ].map(v => v == null ? "" : v));
}

const COLS_PESSOAS = ["Nome","Cargo","Empresa","CNPJ da empresa","E-mail","WhatsApp","Celular","Telefone"];
function linhasPessoas(base){
  const out = [];
  base.cards.forEach(c => (c.pessoas || []).forEach(p => {
    out.push([p.nome, p.cargo, c.nome, c.cnpj, p.email, p.whatsapp, p.celular, p.telefone]
      .map(v => v == null ? "" : v));
  }));
  return out;
}

const COLS_ATIV = ["Negócio","Empresa","Tipo","Prazo","Concluída","Criada em","Criada por","Nota"];
function linhasAtividades(base){
  const out = [];
  base.cards.forEach(c => (c.agendamentos || []).forEach(a => {
    const t = ACT_TYPES[a.tipo] || ACT_TYPES.nota;
    out.push([
      `${c.numero} - ${c.nome}`, c.nome, t.label,
      a.data ? fmtPrazo(a.data) : "",
      a.concluido ? "Sim" : "Não",
      a.criadoEm ? fmtLongo(a.criadoEm) : "",
      a.criadoPor || base.usuario || "",
      a.nota || ""
    ]);
  }));
  return out;
}

/* =========================================================
   Escrita dos arquivos (usa SheetJS)
   ========================================================= */
function montarAba(cabecalho, linhas, formatos){
  const aoa = [cabecalho].concat(linhas);
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates:true });

  // negrito no cabeçalho e largura das colunas
  ws["!cols"] = cabecalho.map((h,i) => ({ wch: Math.min(50, Math.max(12, (formatos && formatos.largura && formatos.largura[i]) || h.length + 6)) }));
  cabecalho.forEach((_,i) => {
    const ref = XLSX.utils.encode_cell({ r:0, c:i });
    if(ws[ref]) ws[ref].s = { font:{ bold:true } };
  });

  // formatos de célula por coluna
  if(formatos){
    for(let r = 1; r <= linhas.length; r++){
      Object.entries(formatos.z || {}).forEach(([col, z]) => {
        const ref = XLSX.utils.encode_cell({ r, c:Number(col) });
        if(ws[ref] && ws[ref].v !== "" && ws[ref].v != null) ws[ref].z = z;
      });
      (formatos.texto || []).forEach(col => {
        const ref = XLSX.utils.encode_cell({ r, c:col });
        if(ws[ref] && ws[ref].v != null){ ws[ref].t = "s"; ws[ref].v = String(ws[ref].v); ws[ref].z = "@"; }
      });
    }
  }
  return ws;
}

/** Gera o arquivo pronto para o importador do Agendor. */
function exportarAgendorNegocios(opcoes){
  const linhas = linhasNegocios(dados, opcoes);
  if(!linhas.length){ toast("Não há negócios para exportar.", "err"); return; }

  const ws = montarAba(AGENDOR_COLS, linhas, {
    z: { 5:"dd/mm/yyyy", 6:"dd/mm/yyyy", 7:"#,##0.00" },
    texto: [1],   // CNPJ como texto, para não perder zeros à esquerda
    largura: [20,29,29,21,18,13,17,12,14,14,14,15,40,12,50,20]
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Negócios");
  XLSX.writeFile(wb, "negocios-agendor-" + new Date().toISOString().slice(0,10) + ".xlsx");
  toast(linhas.length + " negócio(s) exportado(s) no formato do Agendor.");
}

/** Gera a planilha com o que o modelo de negócios não carrega. */
function exportarConferencia(){
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, montarAba(COLS_EMPRESAS, linhasEmpresas(dados), { texto:[1] }), "Empresas");
  XLSX.utils.book_append_sheet(wb, montarAba(COLS_PESSOAS, linhasPessoas(dados), { texto:[3] }), "Pessoas");
  XLSX.utils.book_append_sheet(wb, montarAba(COLS_ATIV, linhasAtividades(dados), null), "Atividades");
  XLSX.writeFile(wb, "conferencia-crm-" + new Date().toISOString().slice(0,10) + ".xlsx");
  toast("Planilha de conferência gerada.");
}

/* exportado para o teste automatizado em Node */
if(typeof module !== "undefined" && module.exports){
  module.exports = { AGENDOR_COLS, linhasNegocios, linhasEmpresas, linhasPessoas, linhasAtividades, montarAba, dataParaExcel };
}
