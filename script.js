/* script.js - combined app logic
   Features:
   - Two tabs: v2e and e2v
   - A4 page rendering, page-size controlled by 'pageSize'
   - Add/Edit/Delete (admin only)
   - Import & Save (choose file, then "Import & Save")
   - Export xlsx for current direction
   - LocalStorage persistence
   - Admin login: Thianlal Vaiphei / phaltual
*/

/* ---------- Config ---------- */
const ADMIN_USER = "Thianlal Vaiphei";
const ADMIN_PASS = "phaltual";
const KEY_V2E = "tapkuang_v2e";
const KEY_E2V = "tapkuang_e2v";
const pageSize = 20; // how many entries per A4 page (adjustable)

/* ---------- State ---------- */
let isAdmin = false;
let currentTab = "v2e"; // 'v2e' or 'e2v'
let pageIndex = 0;      // zero-based page index

/* load lists (strings "Left - Right") */
let v2eList = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || (window.initialV2E || []);
let e2vList = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || (window.initialE2V || []);

/* ---------- Utilities ---------- */
function saveAll() {
  localStorage.setItem(KEY_V2E, JSON.stringify(v2eList));
  localStorage.setItem(KEY_E2V, JSON.stringify(e2vList));
}
function sortLists() {
  v2eList.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  e2vList.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  saveAll();
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Home page helpers ---------- */
function toggleAuthorNote() {
  const note = document.getElementById("authorNote");
  const btn = document.getElementById("toggleNote");
  if(note.classList.contains("collapsed")) {
    note.classList.remove("collapsed"); btn.textContent = "Hide Author's Note ▴";
  } else {
    note.classList.add("collapsed"); btn.textContent = "Read Author's Note ▾";
  }
}

/* ---------- Dictionary opening/closing ---------- */
function openDictionary() {
  document.querySelector("main.main-menu").style.display = "none";
  document.getElementById("dictionaryApp").style.display = "block";
  // set default tab
  switchTab("v2e");
  showAdminControls();
}
function closeDictionary() {
  document.getElementById("dictionaryApp").style.display = "none";
  document.querySelector("main.main-menu").style.display = "block";
}

/* open directly to a tab */
function openDictionaryTab(tab) {
  openDictionary();
  switchTab(tab);
}

/* ---------- Login Modal ---------- */
function showLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.setAttribute("aria-hidden","false");
  modal.style.display = "flex";
}
function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.setAttribute("aria-hidden","true");
  modal.style.display = "none";
  document.getElementById("loginMsg").textContent = "";
}
function doLogin() {
  const u = document.getElementById("adminUser").value.trim();
  const p = document.getElementById("adminPass").value.trim();
  if(u === ADMIN_USER && p === ADMIN_PASS) {
    isAdmin = true;
    closeLoginModal();
    alert("Admin login successful");
    showAdminControls();
  } else {
    document.getElementById("loginMsg").textContent = "Invalid username or password";
  }
}
function logoutAdmin() {
  isAdmin = false;
  showAdminControls();
  alert("Logged out");
}

/* show/hide admin UI on dictionary page */
function showAdminControls() {
  const el = document.getElementById("adminControls");
  const adminRow = document.getElementById("adminRow");
  if(el) el.style.display = isAdmin ? "flex" : "none";
  if(adminRow) adminRow.style.display = isAdmin ? "block" : "none";
  renderCurrent(); // re-render to show/hide edit/delete buttons
}

/* ---------- Tabs, Search, Filter ---------- */
function switchTab(tab) {
  currentTab = (tab === "e2v") ? "e2v" : "v2e";
  pageIndex = 0;
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  const el = document.getElementById("tab-" + currentTab);
  if(el) el.classList.add("active");
  buildAlphaFilter();
  renderCurrent();
}

function buildAlphaFilter() {
  const sel = document.getElementById("alphaFilter");
  if(!sel) return;
  sel.innerHTML = "";
  const letters = currentTab === "v2e"
    ? ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"]
    : ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  letters.forEach(l => {
    const opt = document.createElement("option"); opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });
}

function onSearch() { pageIndex = 0; renderCurrent(); }
function onFilterAlpha() { pageIndex = 0; renderCurrent(); }

/* ---------- Filtering / Pagination / Rendering ---------- */
function getActiveList() {
  return currentTab === "v2e" ? v2eList : e2vList;
}
function setActiveList(list) {
  if(currentTab === "v2e") { v2eList = list; } else { e2vList = list; }
  saveAll();
}

function getFilteredList() {
  const search = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  const alpha = (document.getElementById("alphaFilter")?.value || "ALL");
  let list = getActiveList().slice();
  if(alpha && alpha !== "ALL") {
    const L = alpha.toLowerCase();
    list = list.filter(item => item.split(" - ")[0].toLowerCase().startsWith(L));
  }
  if(search) list = list.filter(item => item.toLowerCase().includes(search));
  return list;
}

function renderCurrent() {
  const container = document.getElementById("bookContainer");
  if(!container) return;
  container.innerHTML = "";
  buildAlphaFilter();

  let list = getFilteredList();
  // ensure native sort globally (not only filtered)
  sortLists();

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if(pageIndex >= totalPages) pageIndex = totalPages - 1;
  if(pageIndex < 0) pageIndex = 0;

  const start = pageIndex * pageSize;
  const slice = list.slice(start, start + pageSize);

  const page = document.createElement("div");
  page.className = "page";

  slice.forEach((entry, idx) => {
    const parts = entry.split(" - ");
    const left = parts.shift();
    const right = parts.join(" - ");
    const row = document.createElement("div");
    row.className = "word-entry";
    row.innerHTML = `
      <div class="word-left">
        <b>${escapeHtml(left)}</b>
        <div class="word-meaning">${escapeHtml(right)}</div>
      </div>
      <div class="entry-controls">
        ${isAdmin ? `<button class="edit" data-index="${start + idx}">Edit</button><button class="del" data-index="${start + idx}">Delete</button>` : ""}
      </div>
    `;
    page.appendChild(row);
  });

  if(slice.length === 0) {
    const p = document.createElement("p"); p.textContent = "No entries found."; page.appendChild(p);
  }

  container.appendChild(page);
  document.getElementById("pageInfo").textContent = `Page ${pageIndex + 1} / ${totalPages}`;

  // wire up edit/delete buttons
  if(isAdmin) {
    container.querySelectorAll(".entry-controls .edit").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        openEditByIndex(idx);
      };
    });
    container.querySelectorAll(".entry-controls .del").forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        doDeleteByIndex(idx);
      };
    });
  }
}

/* pagination controls */
function nextPage() { pageIndex++; renderCurrent(); }
function prevPage() { if(pageIndex > 0) pageIndex--; renderCurrent(); }
function jumpToPage() {
  const n = parseInt(document.getElementById("jumpPage").value, 10);
  const list = getFilteredList();
  const total = Math.max(1, Math.ceil(list.length / pageSize));
  if(!isNaN(n) && n >= 1 && n <= total) { pageIndex = n - 1; renderCurrent(); }
}

/* ---------- Add / Edit / Delete ---------- */
function showAddDialog() {
  if(!isAdmin) return alert("Please login as admin to add words.");
  document.getElementById("addDialogTitle").textContent = "Add Word";
  document.getElementById("addDirection").value = currentTab;
  document.getElementById("addLeft").value = "";
  document.getElementById("addRight").value = "";
  document.getElementById("addMsg").textContent = "";
  document.getElementById("addDialog").style.display = "block";
}
function closeAddDialog() { document.getElementById("addDialog").style.display = "none"; }

function saveAdd() {
  const dir = document.getElementById("addDirection").value;
  const left = (document.getElementById("addLeft").value || "").trim();
  const right = (document.getElementById("addRight").value || "").trim();
  if(!left || !right) { document.getElementById("addMsg").textContent = "Both fields required."; return; }
  const entry = `${left} - ${right}`;
  if(dir === "v2e") v2eList.push(entry); else e2vList.push(entry);
  sortLists();
  closeAddDialog();
  renderCurrent();
}

function openEditByIndex(idx) {
  if(!isAdmin) return alert("Admin only");
  const globalList = (currentTab === "v2e") ? v2eList : e2vList;
  const entry = globalList[idx];
  if(!entry) return alert("Entry not found");
  const parts = entry.split(" - ");
  document.getElementById("addDialogTitle").textContent = "Edit Word";
  document.getElementById("addDirection").value = currentTab;
  document.getElementById("addLeft").value = parts.shift();
  document.getElementById("addRight").value = parts.join(" - ");
  document.getElementById("addMsg").textContent = "";
  document.getElementById("addDialog").style.display = "block";

  // temporary override of Save button for editing
  const saveBtn = document.querySelector("#addDialog .dialog-actions button:first-child");
  const restore = saveBtn.onclick;
  saveBtn.onclick = function() {
    const newLeft = (document.getElementById("addLeft").value || "").trim();
    const newRight = (document.getElementById("addRight").value || "").trim();
    if(!newLeft || !newRight) { document.getElementById("addMsg").textContent = "Both fields required."; return; }
    globalList[idx] = `${newLeft} - ${newRight}`;
    sortLists();
    saveBtn.onclick = restore;
    closeAddDialog();
    renderCurrent();
  };
}

function doDeleteByIndex(idx) {
  if(!isAdmin) return alert("Admin only");
  if(!confirm("Delete this entry?")) return;
  const list = (currentTab === "v2e") ? v2eList : e2vList;
  list.splice(idx, 1);
  sortLists();
  // keep same page if possible
  const filtered = getFilteredList();
  const total = Math.max(1, Math.ceil(filtered.length / pageSize));
  if(pageIndex >= total) pageIndex = total - 1;
  renderCurrent();
}

/* ---------- Import & Export (Excel) ---------- */
function showImportSection() {
  openDictionary();
  // focus import UI area by showing adminControls if admin, otherwise show instructions
  if(!isAdmin) {
    alert("To import Excel you must log in as admin (Admin: Thianlal Vaiphei / phaltual). After login, use Import & Save.");
  }
  // switch to currentTab so admin can import to desired direction
  switchTab(currentTab);
}

function importAndSave() {
  if(!isAdmin) return alert("Login as admin to import.");
  const fi = document.getElementById("fileInput");
  if(!fi || !fi.files || fi.files.length === 0) return alert("Choose a .xlsx or .csv file first.");
  const f = fi.files[0];
  const name = f.name.toLowerCase();
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if(name.endsWith(".csv") || name.endsWith(".txt")) {
        const txt = e.target.result;
        const rows = parseCSV(txt);
        rows.forEach(r => { if(r[0] && r[1]) {
          const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
          if(currentTab === "v2e") v2eList.push(entry); else e2vList.push(entry);
        }});
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
        rows.forEach(r => { if(r[0] && r[1]) {
          const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
          if(currentTab === "v2e") v2eList.push(entry); else e2vList.push(entry);
        }});
      }
      sortLists();
      renderCurrent();
      fi.value = "";
      alert("Imported and saved.");
    } catch(err) {
      console.error(err);
      alert("Import failed.");
    }
  };
  if(name.endsWith(".csv")||name.endsWith(".txt")) reader.readAsText(f, "utf-8");
  else reader.readAsArrayBuffer(f);
}

function exportCurrent() {
  const list = getFilteredList(); // export filtered or full? we export full active list
  const full = (currentTab === "v2e") ? v2eList : e2vList;
  const rows = full.map(it => it.split(" - "));
  const ws = XLSX.utils.aoa_to_sheet([["Word","Meaning"], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  const filename = (currentTab === "v2e") ? "v2e_dictionary.xlsx" : "e2v_dictionary.xlsx";
  XLSX.writeFile(wb, filename);
}

/* ---------- CSV parser ---------- */
function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for(let line of lines) {
    if(!line.trim()) continue;
    const cols = []; let cur="", inQ=false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(ch === '"' && line[i+1] === '"'){ cur+='"'; i++; continue; }
      if(ch === '"'){ inQ = !inQ; continue; }
      if(ch === ',' && !inQ){ cols.push(cur); cur=''; continue; }
      cur += ch;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

/* ---------- Search helper ---------- */
function onSearchKeyPress(e){
  if(e.key === "Enter") onSearch();
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  sortLists();
  // If the user opens dictionary directly via hash, handle it
  if(location.hash && location.hash.includes("v2e")) openDictionaryTab("v2e");
  if(location.hash && location.hash.includes("e2v")) openDictionaryTab("e2v");
  // If dictionaryApp present on page load, initialize controls
  if(document.getElementById("bookContainer")) {
    buildAlphaFilter();
    renderCurrent();
    showAdminControls();
  }
});
