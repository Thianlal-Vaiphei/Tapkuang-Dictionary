/* UPDATED script.js
   Replaces previous script.js. Only change is dynamic SheetJS loading & robust import/export.
   UI, styling, and other behaviours remain unchanged.
*/

/* ---------- Config & State (unchanged) ---------- */
let currentTab = "v2e";
let currentPage = 0;
let wordsPerPage = 15;
let isAdmin = false;

// main dictionary variable comes from dictionary.js (must exist)
if (typeof dictionary === "undefined") {
  window.dictionary = { v2e: [], e2v: [] };
}

/* ---------- Utility: load SheetJS (XLSX) if missing ---------- */
function ensureXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);

  // If other load in progress, reuse the same promise
  if (window._sheetJsLoadingPromise) return window._sheetJsLoadingPromise;

  window._sheetJsLoadingPromise = new Promise((resolve, reject) => {
    const CDN = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    const s = document.createElement("script");
    s.src = CDN;
    s.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("SheetJS loaded but XLSX not found on window"));
    };
    s.onerror = () => reject(new Error("Failed to load SheetJS from CDN"));
    document.head.appendChild(s);
  });
  return window._sheetJsLoadingPromise;
}

/* ---------- Small helpers ---------- */
function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for (let line of lines) {
    if (!line.trim()) continue;
    const cols = []; let cur = ""; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* ---------- UI helpers (unchanged) ---------- */
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
  const el = document.getElementById(id);
  if (el) el.style.display = "block";
  if (id === "dictionary") renderPage();
}
function switchTab(tab) {
  currentTab = tab;
  currentPage = 0;
  renderPage();
}

/* ---------- Render / Pagination (same behaviour) ---------- */
function renderPage() {
  const container = document.getElementById("page");
  if (!container) return;
  const list = dictionary[currentTab] || [];
  const start = currentPage * wordsPerPage;
  const end = start + wordsPerPage;
  const pageWords = list.slice(start, end);

  container.innerHTML = "";
  pageWords.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "word-box";
    div.innerHTML = `<strong>${escapeHtml(entry.left)}</strong> → <span>${escapeHtml(entry.right)}</span>`;

    if (isAdmin) {
      div.innerHTML += `
        <button onclick="editWord(${start + index})">Edit</button>
        <button onclick="deleteWord(${start + index})">Delete</button>
      `;
    }
    container.appendChild(div);
  });

  const totalPages = Math.max(1, Math.ceil(list.length / wordsPerPage));
  const pageNumberEl = document.getElementById("pageNumber");
  if (pageNumberEl) pageNumberEl.innerText = `Page ${currentPage + 1} of ${totalPages}`;
}

/* ---------- Navigation ---------- */
function nextPage() {
  const max = Math.ceil((dictionary[currentTab] || []).length / wordsPerPage);
  if (currentPage < max - 1) { currentPage++; renderPage(); }
}
function prevPage() {
  if (currentPage > 0) { currentPage--; renderPage(); }
}

/* ---------- Add / Edit / Delete ---------- */
function addWord() {
  const word = (document.getElementById("newWord") || {}).value || "";
  const meaning = (document.getElementById("newMeaning") || {}).value || "";
  const tabEl = document.getElementById("addTab");
  const tab = tabEl ? tabEl.value : currentTab;

  if (!word.trim() || !meaning.trim()) return alert("Fill both fields!");
  dictionary[tab].push({ left: word.trim(), right: meaning.trim() });
  dictionary[tab].sort((a, b) => a.left.localeCompare(b.left));
  (document.getElementById("newWord") || {}).value = "";
  (document.getElementById("newMeaning") || {}).value = "";
  alert("Word added!");
  if (document.getElementById("dictionary")) showSection("dictionary");
}

function editWord(index) {
  if (!isAdmin) return alert("Admin only");
  const entry = dictionary[currentTab][index];
  if (!entry) return alert("Entry not found");
  const newW = prompt("Edit word:", entry.left);
  if (newW === null) return;
  const newM = prompt("Edit meaning:", entry.right);
  if (newM === null) return;
  dictionary[currentTab][index] = { left: newW.trim(), right: newM.trim() };
  dictionary[currentTab].sort((a,b)=> a.left.localeCompare(b.left));
  renderPage();
}

function deleteWord(index) {
  if (!isAdmin) return alert("Admin only");
  if (!confirm("Delete this word?")) return;
  dictionary[currentTab].splice(index, 1);
  // keep pageIndex valid
  const filteredLen = dictionary[currentTab].length;
  const totalPages = Math.max(1, Math.ceil(filteredLen / wordsPerPage));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  renderPage();
}

/* ---------- Admin login ---------- */
function login() {
  const user = (document.getElementById("username") || {}).value || "";
  const pass = (document.getElementById("password") || {}).value || "";
  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    isAdmin = true;
    alert("Admin logged in");
    showSection("dictionary");
    renderPage();
  } else {
    alert("Invalid credentials");
  }
}

/* ---------- IMPORT & EXPORT (now robust) ---------- */
function importAndSave() {
  // try different common file input IDs used in versions
  const fileInput = document.getElementById("fileInput") || document.getElementById("importFile") || document.getElementById("importFileInput");
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return alert("Choose a file to import (xlsx or csv).");
  }
  if (!isAdmin) return alert("Please login as admin to import.");

  const file = fileInput.files[0];
  const name = (file.name || "").toLowerCase();
  // find import target tab (robust)
  const importTabEl = document.getElementById("importTab") || document.getElementById("importDir") || document.getElementById("importDirection");
  const tab = importTabEl ? importTabEl.value : currentTab;

  // Ensure SheetJS is loaded for XLSX reading (if CSV we can parse without XLSX)
  ensureXLSX().then(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (name.endsWith(".csv") || name.endsWith(".txt")) {
          // text
          const text = (typeof e.target.result === 'string') ? e.target.result : new TextDecoder('utf-8').decode(e.target.result);
          const rows = parseCSV(text);
          rows.forEach(r => { if (r[0] && r[1]) dictionary[tab].push({ left: String(r[0]).trim(), right: String(r[1]).trim() }); });
        } else {
          // binary XLSX
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          rows.forEach(r => { if (r[0] && r[1]) dictionary[tab].push({ left: String(r[0]).trim(), right: String(r[1]).trim() }); });
        }
        dictionary[tab].sort((a,b)=> a.left.localeCompare(b.left));
        renderPage();
        alert("Imported and saved.");
      } catch (err) {
        console.error(err);
        alert("Import failed: " + (err && err.message ? err.message : err));
      }
    };
    if (name.endsWith(".csv") || name.endsWith(".txt")) reader.readAsText(file, "utf-8");
    else reader.readAsArrayBuffer(file);
  }).catch(err=>{
    alert("Could not load Excel library (XLSX). " + err.message + ".\nYou can also include SheetJS manually before script.js.");
    console.error(err);
  });
}

function exportDictionary(tab) {
  ensureXLSX().then(()=> {
    const arr = (dictionary[tab] || []).map(e => [e.left, e.right]);
    const ws = XLSX.utils.aoa_to_sheet([["Word","Meaning"], ...arr]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
    XLSX.writeFile(wb, `${tab}_dictionary.xlsx`);
  }).catch(err=>{
    alert("Export failed: " + err.message);
  });
}

function exportAll(tab) { exportDictionary(tab); }

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // show home by default
  showSection("home");
  // attempt to pre-load XLSX (non-blocking) so import feels faster
  if (!window.XLSX) {
    // best-effort preload
    ensureXLSX().catch(()=>{/* ignore preload failure; will be handled at import time */});
  }
});
