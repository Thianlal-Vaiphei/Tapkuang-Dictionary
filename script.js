/* script.js - shared app logic for index + dictionary page */

/* Admin credentials */
const ADMIN_USER = "Thianlal Vaiphei";
const ADMIN_PASS = "phaltual";

/* Storage keys */
const KEY_V2E = "tapkuang_v2e";
const KEY_E2V = "tapkuang_e2v";

/* Page / filter state */
let isAdmin = false;
let currentTab = "v2e"; // 'v2e' or 'e2v'
let pageIndex = 0;
const pageSize = 20; // entries per page (smaller font + A4 approx)

/* Lists (load from localStorage or sample) */
let v2eList = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || window.initialV2E || [];
let e2vList = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || window.initialE2V || [];

/* Utility */
function saveAll() {
  localStorage.setItem(KEY_V2E, JSON.stringify(v2eList));
  localStorage.setItem(KEY_E2V, JSON.stringify(e2vList));
}
function sortLists() {
  v2eList.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  e2vList.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  saveAll();
}

/* ---------------- Home interactions ---------------- */
function toggleAuthorNote() {
  const note = document.getElementById("authorNote");
  const btn = document.getElementById("toggleNote");
  if(note.classList.contains("collapsed")) {
    note.classList.remove("collapsed"); btn.textContent = "Hide Author's Note ▴";
  } else {
    note.classList.add("collapsed"); btn.textContent = "Read Author's Note ▾";
  }
}

/* Login modal */
function openLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "flex";
}
function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  modal.setAttribute("aria-hidden", "true");
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
    // if on dictionary page, show admin controls
    showAdminControls();
  } else {
    document.getElementById("loginMsg").textContent = "Invalid username or password";
  }
}

/* ---------------- Dictionary page functions ---------------- */
/* Called from index buttons to open dictionary.html with anchor */
function openDictionaryPage(tab) {
  // if current window is dictionary.html, just switch tab; otherwise go there with hash
  if(location.pathname.endsWith("dictionary.html")) {
    switchTab(tab);
  } else {
    location.href = "dictionary.html#" + tab;
  }
}

/* On dictionary.html load: determine tab from hash */
document.addEventListener("DOMContentLoaded", () => {
  // if dictionary page present, init it
  if(document.getElementById("bookContainer")) {
    // check hash
    const hash = location.hash.replace("#","") || "v2e";
    switchTab(hash);
    buildAlphaFilter(); // fills alpha select
    showAdminControls();
  }
});

/* switch between V2E and E2V */
function switchTab(tab) {
  currentTab = (tab === "e2v") ? "e2v" : "v2e";
  pageIndex = 0;
  // tab UI
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const activeBtn = document.getElementById("tab-" + currentTab);
  if(activeBtn) activeBtn.classList.add("active");
  // clear search & alpha
  document.getElementById("searchInput").value = "";
  document.getElementById("alphaFilter").value = "ALL";
  renderCurrent();
}

/* build alphabet filter (A..Z + AW, NG, CH for V2E) */
function buildAlphaFilter() {
  const sel = document.getElementById("alphaFilter");
  sel.innerHTML = "";
  const letters = currentTab === "v2e"
    ? ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"]
    : ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  letters.forEach(l => {
    const opt = document.createElement("option"); opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });
}

/* apply alpha filter change */
function onFilterAlpha() {
  pageIndex = 0;
  renderCurrent();
}

/* search */
function onSearch() {
  pageIndex = 0;
  renderCurrent();
}

/* get current filtered list */
function getFilteredList() {
  const search = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  const alpha = (document.getElementById("alphaFilter")?.value || "ALL");
  let list = (currentTab === "v2e") ? v2eList.slice() : e2vList.slice();
  if(alpha && alpha !== "ALL") {
    const L = alpha.toLowerCase();
    list = list.filter(item => item.split(" - ")[0].toLowerCase().startsWith(L));
  }
  if(search) list = list.filter(item => item.toLowerCase().includes(search));
  return list;
}

/* render current page */
function renderCurrent() {
  const container = document.getElementById("bookContainer");
  if(!container) return;
  container.innerHTML = "";
  buildAlphaFilter(); // refresh alpha options to current tab's set

  let list = getFilteredList();
  sortLists(); // ensure global lists are sorted

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if(pageIndex >= totalPages) pageIndex = totalPages - 1;
  if(pageIndex < 0) pageIndex = 0;

  const start = pageIndex * pageSize;
  const slice = list.slice(start, start + pageSize);

  // create a single A4 "page" element and fill with entries
  const page = document.createElement("div");
  page.className = "page";

  // for each entry: left - right
  slice.forEach((entry, idx) => {
    const left = entry.split(" - ")[0] || "";
    const right = entry.split(" - ").slice(1).join(" - ") || "";
    const row = document.createElement("div");
    row.className = "word-entry";
    row.innerHTML = `
      <div class="word-left"><b>${escapeHtml(left)}</b><div class="word-meaning">${escapeHtml(right)}</div></div>
      <div class="entry-controls">
        ${isAdmin ? `<button class="edit" data-index="${start + idx}">Edit</button><button class="del" data-index="${start + idx}">Delete</button>` : ""}
      </div>
    `;
    page.appendChild(row);
  });

  // if no entries show a message
  if(slice.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No entries found.";
    page.appendChild(p);
  }

  container.appendChild(page);
  document.getElementById("pageInfo").textContent = `Page ${pageIndex + 1} / ${totalPages}`;

  // hook admin buttons
  if(isAdmin) {
    container.querySelectorAll(".entry-controls .edit").forEach(btn => btn.onclick = (e) => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      openEditByIndex(idx);
    });
    container.querySelectorAll(".entry-controls .del").forEach(btn => btn.onclick = (e) => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      doDeleteByIndex(idx);
    });
  }
}

/* pagination */
function nextPage() { pageIndex++; renderCurrent(); }
function prevPage() { if(pageIndex > 0) pageIndex--; renderCurrent(); }
function jumpToPage() {
  const n = parseInt(document.getElementById("jumpPage").value, 10);
  const list = getFilteredList();
  const total = Math.max(1, Math.ceil(list.length / pageSize));
  if(!isNaN(n) && n >= 1 && n <= total) { pageIndex = n - 1; renderCurrent(); }
}

/* ---------------- Add / Edit / Delete ---------------- */
function openAddDialog() {
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

/* edit by global index */
function openEditByIndex(idx) {
  const list = (currentTab === "v2e") ? v2eList : e2vList;
  // find which list contains idx: we will assume idx refers to the active list (global)
  const globalList = (currentTab === "v2e") ? v2eList : e2vList;
  const entry = globalList[idx];
  if(!entry) { alert("Entry not found"); return; }
  const parts = entry.split(" - ");
  const left = parts.shift();
  const right = parts.join(" - ");
  // show add dialog as edit
  document.getElementById("addDialogTitle").textContent = "Edit Word";
  document.getElementById("addDirection").value = currentTab;
  document.getElementById("addLeft").value = left;
  document.getElementById("addRight").value = right;
  document.getElementById("addMsg").textContent = "";
  document.getElementById("addDialog").style.display = "block";
  // replace saveAdd with a custom save for editing (temporary)
  const saveBtn = document.querySelector("#addDialog .dialog-actions button:first-child");
  saveBtn.onclick = function() {
    const newLeft = (document.getElementById("addLeft").value || "").trim();
    const newRight = (document.getElementById("addRight").value || "").trim();
    if(!newLeft || !newRight) { document.getElementById("addMsg").textContent = "Both fields required."; return; }
    globalList[idx] = `${newLeft} - ${newRight}`;
    sortLists();
    closeAddDialog();
    renderCurrent();
    // restore saveAdd handler
    saveBtn.onclick = saveAdd;
  };
}

/* delete by index (keep same page or adjust) */
function doDeleteByIndex(idx) {
  if(!confirm("Delete this entry?")) return;
  const list = (currentTab === "v2e") ? v2eList : e2vList;
  list.splice(idx, 1);
  sortLists();
  // After deletion, ensure pageIndex still valid:
  const filtered = getFilteredList();
  const total = Math.max(1, Math.ceil(filtered.length / pageSize));
  if(pageIndex >= total) pageIndex = total - 1;
  renderCurrent();
}

/* ---------------- Import / Export ---------------- */
function doImport() {
  const fileInput = document.getElementById("fileInput");
  const f = fileInput.files[0];
  if(!f) return alert("Choose a .xlsx or .csv file first.");
  const reader = new FileReader();
  const name = f.name.toLowerCase();
  reader.onload = (e) => {
    try {
      if(name.endsWith(".csv") || name.endsWith(".txt")) {
        const text = e.target.result;
        const rows = parseCSV(text);
        rows.forEach(r => {
          if(r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if(currentTab === "v2e") v2eList.push(entry); else e2vList.push(entry);
          }
        });
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
        rows.forEach(r => {
          if(r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if(currentTab === "v2e") v2eList.push(entry); else e2vList.push(entry);
          }
        });
      }
      sortLists();
      renderCurrent();
      alert("Imported and saved.");
      fileInput.value = "";
    } catch(err) {
      console.error(err); alert("Import failed.");
    }
  };
  if(name.endsWith(".csv")||name.endsWith(".txt")) reader.readAsText(f, "utf-8");
  else reader.readAsArrayBuffer(f);
}
function exportCurrent() {
  const list = (currentTab === "v2e") ? v2eList : e2vList;
  const rows = list.map(it => it.split(" - "));
  const ws = XLSX.utils.aoa_to_sheet([["Word","Meaning"], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  const filename = (currentTab === "v2e") ? "v2e_dictionary.xlsx" : "e2v_dictionary.xlsx";
  XLSX.writeFile(wb, filename);
}

/* CSV parser (safe) */
function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for(let line of lines) {
    if(!line.trim()) continue;
    const cols = []; let cur="", inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch === '"' && line[i+1] === '"'){ cur+='"'; i++; continue; }
      if(ch === '"'){ inQ = !inQ; continue; }
      if(ch === ',' && !inQ){ cols.push(cur); cur=""; continue; }
      cur += ch;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

/* ---------------- Admin UI helpers ---------------- */
function showAdminControls() {
  const el = document.getElementById("adminControls");
  if(el) el.style.display = isAdmin ? "flex" : "none";
  const adminRow = document.getElementById("adminRow");
  if(adminRow) adminRow.style.display = isAdmin ? "block" : "none";
}

/* escape html */
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* init sample lists if not present */
sortLists();
