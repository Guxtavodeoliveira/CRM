/* =========================================================
   util.js — helpers gerais, ícones, máscaras, avisos
   ========================================================= */

/* ---------- tipos de atividade ---------- */
const ACT_TYPES = {
  nota:     { label:"Nota",     color:"#6E7191", icon:"note" },
  email:    { label:"E-mail",   color:"#D0509B", icon:"mail" },
  ligacao:  { label:"Ligação",  color:"#2E7FE0", icon:"phone" },
  whatsapp: { label:"WhatsApp", color:"#17A673", icon:"whats" },
  proposta: { label:"Proposta", color:"#8B5CF6", icon:"doc" },
  reuniao:  { label:"Reunião",  color:"#5B4FE9", icon:"users" },
  visita:   { label:"Visita",   color:"#E0912F", icon:"pin" },
};

/* ---------- ícones (traço, 24x24) ---------- */
const ICON_PATHS = {
  note:  '<path d="M15 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M15 3v5h5"/><path d="M8 13h8M8 17h5"/>',
  mail:  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/>',
  whats: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.5 7.3L3.5 20.5l1.6-4.4A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M8.8 9.2c0 3 2.3 5.3 5.3 5.3l1-1-1.6-1-.8.7a4.6 4.6 0 0 1-2-2l.7-.8-1-1.6-1 .9z"/>',
  doc:   '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>',
  users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.9"/><path d="M16.5 4.2a3.5 3.5 0 0 1 0 6.6"/>',
  pin:   '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.8"/>',
  build: '<path d="M3 21h18M5 21V6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M14 21V10h4a1 1 0 0 1 1 1v10"/><path d="M8 9h3M8 13h3M8 17h3"/>',
  user:  '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  edit:  '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  copy:  '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  open:  '<path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.5 2"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x:     '<path d="M6 6l12 12M18 6L6 18"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5C4 9 6 10 8 10"/><path d="M16 5h2.5A1.5 1.5 0 0 1 20 6.5C20 9 18 10 16 10"/><path d="M12 13v4M9 20h6"/>',
  flag:  '<path d="M5 21V4M5 4h10l-1.5 4L15 12H5"/>',
  hour:  '<path d="M7 3h10M7 21h10"/><path d="M8 3c0 4 4 5 4 9s-4 5-4 9M16 3c0 4-4 5-4 9s4 5 4 9"/>',
  arrowl:'<path d="M15 6l-6 6 6 6"/>',
  arrowr:'<path d="M9 6l6 6-6 6"/>',
  dots:  '<path d="M6 9l6 6 6-6"/>',
  map:   '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  plus:  '<path d="M12 5v14M5 12h14"/>',
  link:  '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  cart:  '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.4 12.1a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.6-1.3L21 7H6"/>',
  chat:  '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.9-5.3A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>',
  save:  '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
};

function icon(name, size, width){
  const p = ICON_PATHS[name] || ICON_PATHS.note;
  const s = size || 16;
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${width||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

/* ---------- ids ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

/* ---------- escapes ---------- */
function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
}

/* ---------- moeda ---------- */
function moeda(n){
  const v = Number(n) || 0;
  return v.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
}
function parseMoeda(str){
  if(typeof str === "number") return str;
  let s = String(str || "").replace(/[^\d,.-]/g, "");
  if(!s) return 0;
  // formato brasileiro: 1.234,56
  if(s.includes(",")){ s = s.replace(/\./g, "").replace(",", "."); }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/* ---------- datas ---------- */
const MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function dtLocal(iso){
  if(!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? null : d;
}
function sameDay(a,b){ return a.toDateString() === b.toDateString(); }

/** "Hoje 12:00" / "Amanhã 12:00" / "12/03/2026 12:00" */
function fmtPrazo(iso){
  const d = dtLocal(iso);
  if(!d) return "";
  const hoje = new Date();
  const amanha = new Date(hoje); amanha.setDate(hoje.getDate()+1);
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate()-1);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  if(sameDay(d,hoje)) return `Hoje ${hh}:${mm}`;
  if(sameDay(d,amanha)) return `Amanhã ${hh}:${mm}`;
  if(sameDay(d,ontem)) return `Ontem ${hh}:${mm}`;
  return `${d.toLocaleDateString("pt-BR")} ${hh}:${mm}`;
}
/** "03 ago, 2026 às 17:34" */
function fmtLongo(iso){
  const d = dtLocal(iso);
  if(!d) return "—";
  const dia = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${dia} ${MESES[d.getMonth()]}, ${d.getFullYear()} às ${hh}:${mm}`;
}
/** "03/08/2026" */
function fmtData(iso){
  const d = dtLocal(iso);
  if(!d) return "";
  return d.toLocaleDateString("pt-BR");
}
/** "Criada hoje 17:35" */
function fmtCriada(iso){
  const d = dtLocal(iso);
  if(!d) return "";
  const hoje = new Date();
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  if(sameDay(d,hoje)) return `Criada hoje ${hh}:${mm}`;
  return `Criada em ${d.toLocaleDateString("pt-BR")} ${hh}:${mm}`;
}
/** valor para <input type="datetime-local"> */
function toInputDT(date){
  const d = date || new Date();
  const p = n => String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
/** dias desde uma data */
function diasDesde(iso){
  const d = dtLocal(iso);
  if(!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}
function estaAtrasado(iso){
  const d = dtLocal(iso);
  return d ? d.getTime() < Date.now() : false;
}

/* ---------- máscaras ---------- */
function maskCNPJ(v){
  const d = String(v).replace(/\D/g,"").slice(0,14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
function maskCEP(v){
  const d = String(v).replace(/\D/g,"").slice(0,8);
  return d.length > 5 ? d.slice(0,5) + "-" + d.slice(5) : d;
}
function maskFone(v){
  const d = String(v).replace(/\D/g,"").slice(0,11);
  if(d.length <= 2) return d.length ? "(" + d : "";
  if(d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if(d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function bindMask(el, fn){
  if(!el) return;
  el.addEventListener("input", () => {
    const pos = el.selectionStart === el.value.length;
    el.value = fn(el.value);
    if(pos) el.setSelectionRange(el.value.length, el.value.length);
  });
}
/** só dígitos, formato para wa.me */
function soDigitos(v){ return String(v||"").replace(/\D/g,""); }
function waLink(numero){
  let d = soDigitos(numero);
  if(!d) return "";
  if(d.length <= 11) d = "55" + d;      // assume Brasil
  return "https://wa.me/" + d;
}
function urlHttp(u){
  const s = String(u||"").trim();
  if(!s) return "";
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}

/* ---------- estados brasileiros ---------- */
const UFS = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],
  ["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],
  ["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],
  ["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],
  ["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],
  ["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],
  ["SE","Sergipe"],["TO","Tocantins"]
];

/* ---------- iniciais para avatar ---------- */
function iniciais(nome){
  const parts = String(nome||"?").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "?";
  if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}

/* ---------- avisos (toast) ---------- */
function toast(msg, tipo){
  const box = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast " + (tipo === "err" ? "err" : "ok");
  el.innerHTML = `<span class="tic">${icon(tipo === "err" ? "x" : "check", 16, 2.4)}</span><span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .2s, transform .2s";
    el.style.opacity = "0";
    el.style.transform = "translateX(12px)";
    setTimeout(() => el.remove(), 220);
  }, 2600);
}

/* ---------- confirmação ---------- */
function confirmar(texto, opts){
  opts = opts || {};
  return new Promise(resolve => {
    const ov = document.getElementById("confirmOverlay");
    document.getElementById("confirmTitle").textContent = opts.titulo || "Confirmar";
    document.getElementById("confirmText").textContent = texto;
    const yes = document.getElementById("confirmYes");
    const no  = document.getElementById("confirmNo");
    yes.textContent = opts.ok || "Confirmar";
    yes.className = "btn " + (opts.perigo ? "btn-danger" : "btn-primary");
    ov.classList.add("show");
    const fim = (r) => {
      ov.classList.remove("show");
      yes.onclick = null; no.onclick = null; ov.onclick = null;
      resolve(r);
    };
    yes.onclick = () => fim(true);
    no.onclick  = () => fim(false);
    ov.onclick = e => { if(e.target === ov) fim(false); };
    setTimeout(() => yes.focus(), 60);
  });
}

/* ---------- entrada de texto (substitui prompt) ---------- */
function pedirTexto(titulo, label, valor){
  return new Promise(resolve => {
    const ov = document.getElementById("promptOverlay");
    document.getElementById("promptTitle").textContent = titulo;
    document.getElementById("promptLabel").textContent = label;
    const inp = document.getElementById("promptInput");
    inp.value = valor || "";
    const yes = document.getElementById("promptYes");
    const no  = document.getElementById("promptNo");
    ov.classList.add("show");
    const fim = (r) => {
      ov.classList.remove("show");
      yes.onclick = null; no.onclick = null; ov.onclick = null; inp.onkeydown = null;
      resolve(r);
    };
    yes.onclick = () => fim(inp.value.trim() || null);
    no.onclick  = () => fim(null);
    inp.onkeydown = e => { if(e.key === "Enter") fim(inp.value.trim() || null); };
    ov.onclick = e => { if(e.target === ov) fim(null); };
    setTimeout(() => { inp.focus(); inp.select(); }, 60);
  });
}

/* ---------- clipboard ---------- */
async function copiar(txt){
  try{
    await navigator.clipboard.writeText(txt);
    toast("Copiado.");
  }catch(e){
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    toast("Copiado.");
  }
}
