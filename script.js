/* =========================================================
   1) COLE AQUI A CONFIGURAÇÃO DO SEU PROJETO FIREBASE
   (Console Firebase > Configurações do projeto > Seus apps > Web)
   ========================================================= */
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000"
};

const ADMIN_EMAIL = "admin@admin.com";
const DB_PATH = "manual";

/* =========================================================
   2) CONTEÚDO PADRÃO (usado se o banco estiver vazio)
   ========================================================= */
const DEFAULT_CONTENT = {
  title: "GUIA DE INICIALIZAÇÃO",
  subtitle: "Sistema OPL & FMCB 1.8 (Funtuna)",
  bonusLabel: "BÔNUS",
  qr: "",
  qrHref: "",
  intro: "Este manual mostra três métodos para poder carregar seus jogos diretamente pelo OPL utilizando o sistema funtuna. Escolha o método que melhor se adapta à configuração de seu PS2",
  m1title: "<b>MODO 1:</b> Inicialização direta<br>pelo OPL (Slot 1)",
  m1steps: [
    "Insira o <b>Memory Card</b> preparado no <b>Slot 1</b> do seu PlayStation 2.",
    "Conecte o seu <b>pendrive</b> ou <b>HD externo</b> em uma das duas portas <b>USB</b> do seu PS2.",
    "Pressione e mantenha pressionado o botão [R2] no controle.",
    "Ligue o PlayStation 2 mantendo o botão [R2] pressionado até que a tela comece a piscar e o OPL apareça e abra completamente."
  ].join("\n"),
  m2title: "<b>MODO 2:</b> Inicialização manual<br>pelo FreeMCBoot (Slot 1)",
  m2steps: [
    "Insira o <b>Memory Card</b> no <b>Slot 1</b> do seu PlayStation 2.",
    "<span class=\"red\">ATENÇÃO!</span> Não conecte o pendrive neste momento.",
    "Pressione e mantenha pressionado o botão [R1] no controle.",
    "Aguarde alguns instantes até que o <b>MENU do FreeMCBoot</b> carregue na tela.",
    "Agora, conecte o seu <b>pendrive</b>.",
    "Selecione a opção <b>Open PS2 Loader (OPL)</b> para iniciar a lista de jogos."
  ].join("\n"),
  m3title: "<b>MODO 3:</b> Inicialização através da<br>Rotina de Pesquisa (Slot 1/2)",
  m3stepsA: [
    "Insira o <b>Memory Card</b> no <b>Slot 1/2</b> do seu PlayStation 2.",
    "<span class=\"red\">ATENÇÃO!</span> Não conecte o pendrive neste momento.",
    "Ligue o console e espere aparecer a opção Rotina de pesquisa, entre pressionando [X].",
    "Agora entre no <b>Memory Card</b> pressionando [X] e em seguida saia pressionando (O) ."
  ].join("\n"),
  m3stepsB: [
    "Neste momento você verá um brilho na tela, pressione (O) para sair e verá a logo do <b>FMCB</b> aparecer e logo após as opções.",
    "Agora escolha o homebrew que desejar (<b>OPL Oficial</b>, <b>OPL DB</b>, <b>uLaunchelf</b>)."
  ].join("\n"),
  warning: "<b>AVISO IMPORTANTE!</b> Nunca exclua ou modifique os arquivos identificados como <b>“Dados corrompidos”</b> ou <b>“OPL”</b> dentro do Memory Card. Eles são fundamentais para que os apps de desbloqueio funcionem corretamente. <span class=\"red\">NÃO É RECOMENDÁVEL GRAVAR OS SAVES DOS JOGOS NESTE MEMORY CARD, POIS, O SISTEMA PODE DEIXAR DE FUNCIONAR. PARA ISSO É RECOMENDADO USAR MEMORY CARDS VIRTUAIS NO PENDRIVE.</span>"
};

/* ========================================================= */
const $ = (s) => document.querySelector(s);
let content = { ...DEFAULT_CONTENT };
let auth = null, db = null;

// Tokens: [R2] -> tecla, (O) -> círculo
function format(html) {
  return String(html || "")
    .replace(/\[([A-Za-z0-9]{1,3})\]/g, '<span class="key">$1</span>')
    .replace(/\(O\)/g, '<span class="circle"></span>');
}

function render() {
  document.querySelectorAll("[data-field]").forEach((el) => {
    const v = content[el.dataset.field] ?? "";
    if (el.hasAttribute("data-rich")) el.innerHTML = format(v);
    else el.textContent = v;
  });
  document.querySelectorAll("[data-list]").forEach((ol) => {
    const lines = String(content[ol.dataset.list] || "").split("\n").map((l) => l.trim()).filter(Boolean);
    ol.innerHTML = lines.map((l) => `<li>${format(l)}</li>`).join("");
  });
  const nA = $('[data-list="m3stepsA"]').children.length;
  $("#m3B").style.counterReset = "s " + nA;
  const img = $("#qrImg");
  if (content.qr) img.src = content.qr; else img.removeAttribute("src");
  const a = $("#qrLink");
  if (content.qrHref) a.href = content.qrHref; else a.removeAttribute("href");
}

/* ---------- Firebase ---------- */
function initFirebase() {
  try {
    if (firebaseConfig.apiKey.startsWith("SUA_")) throw new Error("Firebase não configurado");
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
    db.ref(DB_PATH).on("value", (snap) => {
      const data = snap.val();
      content = { ...DEFAULT_CONTENT, ...(data || {}) };
      render();
    });
  } catch (e) {
    console.warn(e.message + " – exibindo conteúdo padrão.");
  }
}

/* ---------- Modais ---------- */
function open(id) { $(id).classList.remove("hidden"); }
function close(id) { $(id).classList.add("hidden"); }
document.querySelectorAll("[data-close]").forEach((b) =>
  b.addEventListener("click", () => b.closest(".overlay").classList.add("hidden")));
document.querySelectorAll(".overlay").forEach((o) =>
  o.addEventListener("click", (e) => { if (e.target === o) o.classList.add("hidden"); }));

function setMsg(el, text, type) { el.textContent = text; el.className = "msg " + (type || ""); }

$("#secretDot").addEventListener("click", () => {
  if (auth && auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) openAdmin();
  else { setMsg($("#loginMsg"), ""); open("#loginModal"); $("#loginPass").focus(); }
});

/* ---------- Login ---------- */
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn"), msg = $("#loginMsg");
  const email = $("#loginEmail").value.trim().toLowerCase();
  if (!auth) return setMsg(msg, "Firebase não configurado.", "err");
  if (email !== ADMIN_EMAIL) return setMsg(msg, "Acesso negado.", "err");
  btn.classList.add("loading"); setMsg(msg, "");
  try {
    await auth.signInWithEmailAndPassword(email, $("#loginPass").value);
    $("#loginPass").value = "";
    close("#loginModal");
    openAdmin();
  } catch (err) {
    setMsg(msg, "E-mail ou senha inválidos.", "err");
  } finally {
    btn.classList.remove("loading");
  }
});

/* ---------- Admin ---------- */
const form = $("#adminForm");
let pendingQr = null;

function openAdmin() {
  const f = form.elements;
  ["title","subtitle","bonusLabel","qrHref","intro","m1title","m1steps","m2title","m2steps","m3title","m3stepsA","m3stepsB","warning"]
    .forEach((k) => { f[k].value = content[k] || ""; });
  pendingQr = content.qr || "";
  f.qrUrl.value = pendingQr.startsWith("data:") ? "" : pendingQr;
  $("#qrFile").value = "";
  updatePreview();
  setMsg($("#adminMsg"), "");
  open("#adminModal");
}

function updatePreview() {
  const p = $("#qrPreview");
  if (pendingQr) p.src = pendingQr; else p.removeAttribute("src");
}

form.elements.qrUrl.addEventListener("input", (e) => { pendingQr = e.target.value.trim(); updatePreview(); });

$("#qrFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1.5 * 1024 * 1024) { setMsg($("#adminMsg"), "Imagem muito grande (máx. 1,5 MB).", "err"); return; }
  const r = new FileReader();
  r.onload = () => { pendingQr = r.result; form.elements.qrUrl.value = ""; updatePreview(); };
  r.readAsDataURL(file);
});

$("#qrClear").addEventListener("click", () => { pendingQr = ""; form.elements.qrUrl.value = ""; $("#qrFile").value = ""; updatePreview(); });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#saveBtn"), msg = $("#adminMsg"), f = form.elements;
  const data = { qr: pendingQr || "", updatedAt: Date.now() };
  ["title","subtitle","bonusLabel","qrHref","intro","m1title","m1steps","m2title","m2steps","m3title","m3stepsA","m3stepsB","warning"]
    .forEach((k) => { data[k] = f[k].value; });
  btn.classList.add("loading");
  try {
    await db.ref(DB_PATH).set(data);
    setMsg(msg, "Salvo com sucesso!", "ok");
  } catch (err) {
    setMsg(msg, "Erro ao salvar: " + err.message, "err");
  } finally {
    btn.classList.remove("loading");
  }
});

$("#btnReset").addEventListener("click", () => {
  if (!confirm("Preencher o formulário com o conteúdo original? (Só será gravado ao clicar em Salvar)")) return;
  const keep = content; content = { ...DEFAULT_CONTENT, qr: keep.qr, qrHref: keep.qrHref };
  openAdmin(); content = keep;
});

$("#btnLogout").addEventListener("click", async () => { if (auth) await auth.signOut(); close("#adminModal"); });

/* ---------- PDF ---------- */
$("#btnPdf").addEventListener("click", async () => {
  const btn = $("#btnPdf"), el = $("#manual");
  btn.disabled = true;
  el.classList.add("pdf-mode");
  try {
    await html2pdf().set({
      margin: 0,
      filename: "Guia-de-Inicializacao-OPL-FMCB.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1040 },
      jsPDF: { unit: "px", format: [1000, 1400], hotfixes: ["px_scaling"] },
      pagebreak: { mode: "avoid-all" }
    }).from(el).save();
  } finally {
    el.classList.remove("pdf-mode");
    btn.disabled = false;
  }
});

render();
initFirebase();
