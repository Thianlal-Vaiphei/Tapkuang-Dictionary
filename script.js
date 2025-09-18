/* Final script.js - Vaiphei Dictionary (single file logic) */

/* --- Storage keys & defaults --- */
const ADMIN_KEY = "vaiphei_admin";
const E2V_KEY = "vaiphei_e2v";
const V2E_KEY = "vaiphei_v2e";

/* default admin if none saved */
const DEFAULT_ADMIN = { user: "Thianlal Vaiphei", pass: "phaltual" };

/* initialize admin credentials */
if (!localStorage.getItem(ADMIN_KEY)) localStorage.setItem(ADMIN_KEY, JSON.stringify(DEFAULT_ADMIN));
let admin = JSON.parse(localStorage.getItem(ADMIN_KEY));

/* load dictionaries */
let e2v = JSON.parse(localStorage.getItem(E2V_KEY) || "[]"); // strings "Word - Meaning"
let v2e = JSON.parse(localStorage.getItem(V2E_KEY) || "[]");

let isAdmin = false;
let current = { e2v: 0, v2e: 0 };
let searchState = { e2v: null, v2e: null };

/* helper: save */
function saveAll() {
  localStorage.setItem(E2V_KEY, JSON.stringify(e2v));
  localStorage.setItem(V2E_KEY, JSON.stringify(v2e));
}

/* helper: sort alphabetically by left side (before ' - ') */
function sortAll() {
  e2v.sort((a,b) => a.localeCompare(b, undefined, {sensitivity:'base'}));
  v2e.sort((a,b) => a.localeCompare(b, undefined, {sensitivity:'base'}));
  saveAll();
}

/* show home */
function showHome() {
  hideAllPanels();
  document.getElementById("homeScreen").style.display = "block";
  document.getElementById("loginMsg").textContent = "";
  document.getElementById("importMsg")?.textContent = "";
  updateLoginButtons();
}

/* hide panels */
function hideAllPanels(){
  document.querySelectorAll(".panel, .dict, .home").forEach(el => el.style.display = "none");
}

/* open dictionary */
function openBook(key){
  hideAllPanels();
  document.getElementById(key).style.display = "block";
  renderEntry(key);
  updateLoginButtons();
}

/* render one entry (uses searchState if active) */
function renderEntry(key){
  const pageEl = document.getElementById(key + "Page");
  const posEl = document.getElementById(key + "Pos");
  const adminDiv = document.getElementById(key + "Admin");

  let list = (key === "e2v") ? e2v : v2e;
  if (searchState[key]) list = searchState[key];

  if (!list || list.length === 0) {
    pageEl.textContent = "No entries.";
    posEl.textContent = "0 / 0";
    adminDiv.innerHTML = isAdmin ? `<button onclick="openAddForm('${key}')">Add Word</button>` : "";
    return;
  }

  if (current[key] < 0) current[key] = 0;
  if (current[key] >= list.length) current[key] = list.length - 1;

  // show entry
  pageEl.classList.remove("flip-next","flip-prev");
  const entry = list[current[key]];
  // entry format "Word - Meaning" (both parts may contain ' - ' but we keep split only first)
  const parts = entry.split(" - ");
  const left = parts.shift();
  const right = parts.join(" - ");
  pageEl.innerHTML = `<div style="font-weight:800; font-size:1.3rem">${escapeHtml(left)}</div>
                      <div style="margin-top:10px; color:#333">${escapeHtml(right)}</div>`;

  // admin controls
  if (isAdmin) {
    adminDiv.innerHTML = `
      <button onclick="editEntry('${key}')">Edit</button>
      <button onclick="deleteEntry('${key}')">Delete</button>
      <button onclick="openAddForm('${key}')">Add New</button>
      <button onclick="doLogout()">Logout</button>
    `;
  } else {
    adminDiv.innerHTML = isAdmin ? "" : `<button onclick="openAddForm('${key}')">Add</button>`;
  }

  posEl.textContent = `${current[key]+1} / ${list.length}`;
}

/* next / prev with flip animation */
function nextEntry(key){
  let list = (searchState[key] && searchState[key].length>0) ? searchState[key] : (key==='e2v'?e2v:v2e);
  if (!list || current[key] >= list.length-1) return;
  const pageEl = document.getElementById(key + "Page");
  pageEl.classList.add("flip-next");
  setTimeout(()=> {
    current[key]++; renderEntry(key); pageEl.classList.remove("flip-next");
  }, 600);
}
function prevEntry(key){
  let list = (searchState[key] && searchState[key].length>0) ? searchState[key] : (key==='e2v'?e2v:v2e);
  if (!list || current[key] <= 0) return;
  const pageEl = document.getElementById(key + "Page");
  pageEl.classList.add("flip-prev");
  setTimeout(()=> {
    current[key]--; renderEntry(key); pageEl.classList.remove("flip-prev");
  }, 600);
}

/* jump to page */
function jumpTo(key){
  const input = document.getElementById(key + "Jump");
  const n = parseInt(input.value);
  let list = (searchState[key] && searchState[key].length>0) ? searchState[key] : (key==='e2v'?e2v:v2e);
  if (!list || isNaN(n) || n<1 || n>list.length) { alert("Invalid page number"); return; }
  current[key] = n-1;
  renderEntry(key);
}

/* search within dictionary (top search input) */
function searchInDict(key){
  const q = (document.getElementById(key + "Search").value || "").trim().toLowerCase();
  const list = (key==='e2v') ? e2v : v2e;
  if (!q) { searchState[key] = null; current[key]=0; renderEntry(key); return; }
  searchState[key] = list.filter(it => it.toLowerCase().includes(q));
  current[key] = 0;
  renderEntry(key);
}

/* global search (Hawlna) */
function doSearch(){
  const q = (document.getElementById("searchBox").value || "").trim().toLowerCase();
  const target = document.getElementById("searchTarget").value;
  const list = (target==='e2v') ? e2v : v2e;
  const results = list.filter(it => it.toLowerCase().includes(q));
  const out = document.getElementById("searchResults");
  out.innerHTML = "";
  if (!results.length) { out.textContent = "No results."; return; }
  results.forEach((r,i) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `<b>${escapeHtml(r.split(" - ")[0])}</b> — ${escapeHtml(r.split(" - ").slice(1).join(" - "))}`;
    out.appendChild(div);
  });
}

/* open add form prefill target */
function openAddForm(key){
  hideAllPanels();
  document.getElementById("add").style.display = "block";
  document.getElementById("addTarget").value = key;
}

/* add word from form */
function addWordFromForm(){
  const t = document.getElementById("addTarget").value;
  const left = (document.getElementById("addWordLeft").value || "").trim();
  const right = (document.getElementById("addWordRight").value || "").trim();
  const msg = document.getElementById("addMsg");
  msg.textContent = "";
  if (!left || !right) { msg.textContent = "Both fields required."; return; }
  const entry = `${left} - ${right}`;
  if (t === "e2v") e2v.push(entry); else v2e.push(entry);
  sortAll();
  saveAll();
  msg.textContent = "Saved.";
  // reset
  document.getElementById("addWordLeft").value = "";
  document.getElementById("addWordRight").value = "";
}

/* edit / delete operations (admin only) */
function editEntry(key){
  if (!isAdmin) { alert("Admin only"); return; }
  let list = (key==='e2v') ? e2v : v2e;
  const entry = list[current[key]];
  if (!entry) return;
  const left = prompt("Edit word", entry.split(" - ")[0]);
  if (left === null) return;
  const right = prompt("Edit meaning", entry.split(" - ").slice(1).join(" - "));
  if (right === null) return;
  list[current[key]] = `${left} - ${right}`;
  sortAll(); saveAll(); renderEntry(key);
}
function deleteEntry(key){
  if (!isAdmin) { alert("Admin only"); return; }
  let list = (key==='e2v') ? e2v : v2e;
  if (!confirm("Delete this entry?")) return;
  list.splice(current[key],1);
  sortAll(); saveAll();
  if (current[key] > 0) current[key]--;
  renderEntry(key);
}

/* import file handler called by import panel */
function importFile(){
  const fIn = document.getElementById("importFile");
  const target = document.getElementById("importTarget").value;
  const msg = document.getElementById("importMsg");
  msg.textContent = "";
  const file = fIn.files[0];
  if (!file) { msg.textContent = "Choose a file."; return; }

  const reader = new FileReader();
  const name = file.name.toLowerCase();

  reader.onload = (e) => {
    try {
      if (name.endsWith(".csv") || name.endsWith(".txt")) {
        const text = e.target.result;
        const rows = parseCSV(text);
        rows.forEach(r => {
          if (r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if (target==='e2v') e2v.push(entry); else v2e.push(entry);
          }
        });
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data,{type:"array"});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet,{header:1});
        rows.forEach(r => {
          if (r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if (target==='e2v') e2v.push(entry); else v2e.push(entry);
          }
        });
      }
      sortAll(); saveAll();
      msg.textContent = "Import saved.";
    } catch(err){
      console.error(err);
      msg.textContent = "Import failed.";
    }
  };

  if (name.endsWith(".csv") || name.endsWith(".txt")) reader.readAsText(file,"utf-8");
  else reader.readAsArrayBuffer(file);
}

/* trigger import buttons in dictionaries */
function triggerImport(key){
  document.getElementById("importTarget").value = key;
  document.getElementById("import").style.display = "block";
  document.getElementById("homeScreen").style.display = "none";
}

/* export dictionary to XLSX */
function exportDict(key){
  const list = (key==='e2v') ? e2v : v2e;
  const rows = list.map(it => it.split(" - "));
  const ws = XLSX.utils.aoa_to_sheet([["Word","Meaning"], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  XLSX.writeFile(wb, `${key}_dictionary.xlsx`);
}

/* CSV parse (simple) */
function parseCSV(text){
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for (let line of lines) {
    if (!line.trim()) continue;
    const cols = [];
    let cur="", inQ=false;
    for (let i=0;i<line.length;i++){
      const ch=line[i];
      if (ch === '"' && line[i+1] === '"') { cur+='"'; i++; continue; }
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur); cur=""; continue; }
      cur += ch;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

/* admin login/logout */
function doLogin(){
  const u = document.getElementById("loginUser").value?.trim();
  const p = document.getElementById("loginPass").value?.trim();
  const msg = document.getElementById("loginMsg");
  if (!u || !p) { msg.textContent = "Enter credentials."; return; }
  const stored = JSON.parse(localStorage.getItem(ADMIN_KEY) || JSON.stringify(DEFAULT_ADMIN));
  if (u === stored.user && p === stored.pass) {
    isAdmin = true;
    msg.textContent = "Logged in.";
    document.getElementById("loginUser").value = "";
    document.getElementById("loginPass").value = "";
    showHome();
  } else {
    msg.textContent = "Wrong username or password.";
  }
}
function doLogout(){ isAdmin = false; showHome(); }

/* change admin creds (settings) */
function changeAdmin(){
  const nu = document.getElementById("newAdminUser").value?.trim();
  const np = document.getElementById("newAdminPass").value?.trim();
  const msg = document.getElementById("setMsg");
  if (!nu || !np) { msg.textContent = "Both required."; return; }
  localStorage.setItem(ADMIN_KEY, JSON.stringify({ user:nu, pass:np }));
  admin = {user:nu, pass:np};
  msg.textContent = "Admin updated.";
}

/* update visibility of login/logout card on home */
function updateLoginButtons(){
  if (isAdmin) {
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("logoutCard").style.display = "inline-block";
    document.getElementById("e2vLogout").style.display = "inline-block";
    document.getElementById("v2eLogout").style.display = "inline-block";
  } else {
    document.getElementById("loginCard").style.display = "inline-block";
    document.getElementById("logoutCard").style.display = "none";
    document.getElementById("e2vLogout").style.display = "none";
    document.getElementById("v2eLogout").style.display = "none";
  }
}

/* escape HTML */
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* initialize */
(function init(){
  sortAll();
  showHome();
  /* preload page renders (hidden) */
  renderEntry('e2v'); renderEntry('v2e');
})();
