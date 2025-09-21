/* script.js
   Combined logic:
   - v2eList and e2vList stored in localStorage as arrays of {left, right}
   - Combined single-page app with sections toggled
   - Import (xlsx/csv) preview + save for both directions
   - Export (xlsx) for both directions
   - Pagination that adapts to available page height (estimates entries per page)
   - Admin login (Thianlal Vaiphei / phaltual) to enable add/edit/delete/import/save
*/

/* ---------- Config ---------- */
const ADMIN_USER = "Thianlal Vaiphei";
const ADMIN_PASS = "phaltual";
const KEY_V2E = "tapkuang_v2e_v1";
const KEY_E2V = "tapkuang_e2v_v1";

/* ---------- State ---------- */
let isAdmin = false;
let currentTab = "v2e"; // v2e or e2v
let v2eList = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || [];
let e2vList = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || [];
let pageIndex = 0;
let importPreviewList = []; // temporary list for import preview
let importPreviewPageIndex = 0;

/* ---------- Helpers ---------- */
function saveAll() {
  localStorage.setItem(KEY_V2E, JSON.stringify(v2eList));
  localStorage.setItem(KEY_E2V, JSON.stringify(e2vList));
}
function sortLists() {
  v2eList.sort((a,b)=> a.left.localeCompare(b.left, undefined, {sensitivity:'base'}));
  e2vList.sort((a,b)=> a.left.localeCompare(b.left, undefined, {sensitivity:'base'}));
  saveAll();
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- UI section switching ---------- */
function showSection(id) {
  document.querySelectorAll('.app-section').forEach(el=>el.style.display='none');
  document.getElementById(id).style.display = 'block';
  // hide home
  document.getElementById('home').style.display = (id==='home'?'block':'none');
  if(id === 'dictionary') {
    switchTab(currentTab);
    showAdminControls();
  }
  if(id === 'import') {
    // reset preview
    importPreviewList = [];
    importPreviewPageIndex = 0;
    document.getElementById('importPreview').innerHTML = '';
    document.getElementById('importPageInfo').textContent = '';
  }
  if(id === 'add') {
    // only admin can add (prompt)
    if(!isAdmin) {
      alert('Please login as admin to add words.');
      showLoginModal();
      return;
    }
  }
}
document.addEventListener('DOMContentLoaded', ()=>{ showSection('home'); buildAlphaFilter(); });

/* ---------- Admin Login ---------- */
function openLoginModal(){ document.getElementById('loginModal').style.display='flex'; document.getElementById('loginModal').setAttribute('aria-hidden','false'); }
function closeLoginModal(){ document.getElementById('loginModal').style.display='none'; document.getElementById('loginModal').setAttribute('aria-hidden','true'); document.getElementById('loginMsg').textContent=''; }
function doLogin(){
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value.trim();
  if(u === ADMIN_USER && p === ADMIN_PASS){
    isAdmin = true;
    closeLoginModal();
    alert('Admin logged in');
    showAdminControls();
  } else {
    document.getElementById('loginMsg').textContent = 'Invalid credentials';
  }
}
function logoutAdmin(){ isAdmin=false; showAdminControls(); alert('Admin logged out'); }

/* ---------- Show admin controls ---------- */
function showAdminControls(){
  document.getElementById('adminControls').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('loginToggleBtn').textContent = isAdmin ? 'Admin' : 'Admin Log in';
}

/* ---------- Tabs, search, alpha ---------- */
function switchTab(tab){
  currentTab = (tab === 'e2v') ? 'e2v' : 'v2e';
  pageIndex = 0;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  const btn = document.getElementById('tab-' + currentTab);
  if(btn) btn.classList.add('active');
  buildAlphaFilter();
  renderCurrent();
}
function buildAlphaFilter(){
  const sel = document.getElementById('alphaFilter');
  if(!sel) return;
  sel.innerHTML='';
  const letters = currentTab === 'v2e' ? ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"] : ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  letters.forEach(l=>{ const o=document.createElement('option'); o.value=l; o.textContent=l; sel.appendChild(o); });
}
function onSearch(){ pageIndex=0; renderCurrent(); }
function onFilterAlpha(){ pageIndex=0; renderCurrent(); }

/* ---------- Pagination calculation (dynamic) ---------- */
function computePageSize() {
  // create a temporary word-entry to measure its height (if none exist, assume default)
  const container = document.createElement('div');
  container.style.visibility = 'hidden';
  container.style.position = 'absolute';
  container.style.width = 'calc(100% - 60px)';
  container.innerHTML = `<div class="page"><div class="word-entry"><div class="word-left"><b>Sample</b><div class="word-meaning">sample</div></div></div></div>`;
  document.body.appendChild(container);
  const pageEl = container.querySelector('.page');
  const entryEl = container.querySelector('.word-entry');
  const pageHeight = (pageEl) ? pageEl.clientHeight : 800;
  const entryHeight = (entryEl) ? entryEl.clientHeight : 28;
  document.body.removeChild(container);
  const perPage = Math.max(6, Math.floor(pageHeight / (entryHeight + 6)));
  return perPage;
}

/* ---------- Get filtered list ---------- */
function getActiveList(){
  return (currentTab === 'v2e') ? v2eList.slice() : e2vList.slice();
}
function getFilteredList(){
  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const alpha = (document.getElementById('alphaFilter')?.value || 'ALL');
  let list = getActiveList();
  if(alpha && alpha !== 'ALL') {
    const L = alpha.toLowerCase();
    list = list.filter(it => it.left.toLowerCase().startsWith(L));
  }
  if(search) list = list.filter(it => (it.left + ' ' + it.right).toLowerCase().includes(search));
  return list;
}

/* ---------- Render current dictionary page ---------- */
function renderCurrent(){
  const container = document.getElementById('bookContainer');
  if(!container) return;
  container.innerHTML = ''; buildAlphaFilter();

  let list = getFilteredList();
  // sort global lists so indices remain consistent
  sortLists();

  const perPage = computePageSize(); // dynamic
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  if(pageIndex >= totalPages) pageIndex = totalPages - 1;
  if(pageIndex < 0) pageIndex = 0;

  const start = pageIndex * perPage;
  const slice = list.slice(start, start + perPage);

  const page = document.createElement('div'); page.className='page';
  slice.forEach((it, idx)=>{
    const row = document.createElement('div'); row.className='word-entry';
    row.innerHTML = `<div class="word-left"><b>${escapeHtml(it.left)}</b><div class="word-meaning">${escapeHtml(it.right)}</div></div>
      <div class="entry-controls">
        ${isAdmin ? `<button class="edit" data-index="${start+idx}">Edit</button><button class="del" data-index="${start+idx}">Delete</button>` : ''}
      </div>`;
    page.appendChild(row);
  });

  if(slice.length === 0) { const p = document.createElement('p'); p.textContent='No entries found.'; page.appendChild(p); }
  container.appendChild(page);
  document.getElementById('pageInfo').textContent = `Page ${pageIndex+1} / ${totalPages}`;

  // wire edit/delete
  if(isAdmin) {
    container.querySelectorAll('.entry-controls .edit').forEach(btn=>{
      btn.onclick = ()=> openEditByIndex(parseInt(btn.getAttribute('data-index'),10));
    });
    container.querySelectorAll('.entry-controls .del').forEach(btn=>{
      btn.onclick = ()=> doDeleteByIndex(parseInt(btn.getAttribute('data-index'),10));
    });
  }
}

/* ---------- Pagination controls ---------- */
function nextPage(which){
  if(which === 'import') {
    importPreviewPageIndex++; renderImportPreview();
    return;
  }
  pageIndex++; renderCurrent();
}
function prevPage(which){
  if(which === 'import') {
    if(importPreviewPageIndex>0) importPreviewPageIndex--; renderImportPreview(); return;
  }
  if(pageIndex>0) pageIndex--; renderCurrent();
}
function jumpToPage(){
  const n = parseInt(document.getElementById('jumpPage').value,10);
  const list = getFilteredList(); const perPage = computePageSize(); const total = Math.max(1,Math.ceil(list.length/perPage));
  if(!isNaN(n) && n>=1 && n<=total){ pageIndex = n-1; renderCurrent(); }
}

/* ---------- Add / Edit / Delete ---------- */
function openAddDialog(){ showSection('add'); document.getElementById('addMsg').textContent=''; document.getElementById('addDirection').value = currentTab; }
function saveAdd(){
  if(!isAdmin){ alert('Login as admin to add'); openLoginModal(); return; }
  const dir = document.getElementById('addDirection').value;
  const left = (document.getElementById('addLeft').value || '').trim();
  const right = (document.getElementById('addRight').value || '').trim();
  if(!left || !right){ document.getElementById('addMsg').textContent='Both fields required'; return; }
  const entry = { left, right };
  if(dir === 'v2e') v2eList.push(entry); else e2vList.push(entry);
  sortLists(); alert('Saved'); document.getElementById('addLeft').value=''; document.getElementById('addRight').value=''; showSection('dictionary');
}
function openEditByIndex(idx){
  if(!isAdmin) return alert('Admin only');
  const list = (currentTab === 'v2e') ? v2eList : e2vList;
  const entry = list[idx];
  if(!entry) return alert('Not found');
  // reuse add form
  showSection('add');
  document.getElementById('addDirection').value = currentTab;
  document.getElementById('addLeft').value = entry.left;
  document.getElementById('addRight').value = entry.right;
  // override save for update
  const saveHandler = ()=> {
    const newLeft = (document.getElementById('addLeft').value||'').trim();
    const newRight = (document.getElementById('addRight').value||'').trim();
    if(!newLeft || !newRight) { document.getElementById('addMsg').textContent='Both required'; return; }
    list[idx] = { left: newLeft, right: newRight };
    sortLists(); document.getElementById('addLeft').value=''; document.getElementById('addRight').value=''; showSection('dictionary');
    // restore default saveAdd by changing onclick
    document.querySelector('.dialog-actions button:first-child').onclick = saveAdd;
  };
  document.querySelector('.dialog-actions button:first-child').onclick = saveHandler;
}
function doDeleteByIndex(idx){
  if(!isAdmin) return alert('Admin only');
  if(!confirm('Delete this entry?')) return;
  const list = (currentTab === 'v2e') ? v2eList : e2vList;
  list.splice(idx,1);
  sortLists();
  // keep same page if possible
  const filtered = getFilteredList(); const perPage = computePageSize(), total = Math.max(1, Math.ceil(filtered.length/perPage));
  if(pageIndex >= total) pageIndex = total -1;
  renderCurrent();
}

/* ---------- Import / Preview / Confirm ---------- */
function previewImport(){
  const fileInput = document.getElementById('importFile');
  const f = fileInput.files[0];
  if(!f) return alert('Choose a file first');
  const name = f.name.toLowerCase();
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if(name.endsWith('.csv') || name.endsWith('.txt')){
        const txt = e.target.result;
        const rows = parseCSV(txt);
        importPreviewList = rows.filter(r=>r[0] && r[1]).map(r=>({left: String(r[0]).trim(), right: String(r[1]).trim()}));
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
        importPreviewList = rows.filter(r=>r[0] && r[1]).map(r=>({left:String(r[0]).trim(), right:String(r[1]).trim()}));
      }
      importPreviewPageIndex = 0;
      renderImportPreview();
      showSection('import');
    } catch(err){ console.error(err); alert('Import preview failed'); }
  };
  if(name.endsWith('.csv')||name.endsWith('.txt')) reader.readAsText(f,'utf-8'); else reader.readAsArrayBuffer(f);
}
function renderImportPreview(){
  const container = document.getElementById('importPreview'); if(!container) return;
  container.innerHTML = '';
  const perPage = computePageSize(); const total = Math.max(1, Math.ceil(importPreviewList.length / perPage));
  if(importPreviewPageIndex >= total) importPreviewPageIndex = total - 1;
  if(importPreviewPageIndex < 0) importPreviewPageIndex = 0;
  const start = importPreviewPageIndex * perPage;
  const slice = importPreviewList.slice(start, start + perPage);
  const page = document.createElement('div'); page.className = 'page';
  slice.forEach(it=>{
    const row = document.createElement('div'); row.className='word-entry';
    row.innerHTML = `<div class="word-left"><b>${escapeHtml(it.left)}</b><div class="word-meaning">${escapeHtml(it.right)}</div></div>`;
    page.appendChild(row);
  });
  if(slice.length === 0) { const p = document.createElement('p'); p.textContent = '(No preview items)'; page.appendChild(p); }
  container.appendChild(page);
  document.getElementById('importPageInfo').textContent = `Page ${importPreviewPageIndex+1} / ${total}`;
}
function confirmImport(){
  if(!isAdmin) return alert('Login as admin to import');
  if(!importPreviewList.length) return alert('No previewed items to import');
  const dir = document.getElementById('importDir').value;
  if(dir === 'v2e') v2eList = v2eList.concat(importPreviewList);
  else e2vList = e2vList.concat(importPreviewList);
  sortLists();
  importPreviewList = []; importPreviewPageIndex = 0;
  alert('Imported & saved');
  showSection('dictionary');
}

/* ---------- Export ---------- */
function exportCurrent(){
  if(!window.XLSX) return alert('XLSX library not loaded (use CDN or local sheetjs).');
  const list = (currentTab === 'v2e') ? v2eList : e2vList;
  const rows = list.map(it=>[it.left, it.right]);
  const ws = XLSX.utils.aoa_to_sheet([['Word','Meaning'], ...rows]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dictionary');
  const filename = (currentTab === 'v2e') ? 'v2e_export.xlsx' : 'e2v_export.xlsx';
  XLSX.writeFile(wb, filename);
}
function exportAll(dir){
  if(!window.XLSX) return alert('XLSX library not loaded.');
  const list = (dir === 'v2e') ? v2eList : e2vList;
  const rows = list.map(it=>[it.left, it.right]);
  const ws = XLSX.utils.aoa_to_sheet([['Word','Meaning'], ...rows]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dictionary');
  const filename = (dir === 'v2e') ? 'v2e_full.xlsx' : 'e2v_full.xlsx';
  XLSX.writeFile(wb, filename);
}

/* ---------- CSV parse (simple) ---------- */
function parseCSV(text){
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for(let line of lines){
    if(!line.trim()) continue;
    const cols=[]; let cur=''; let inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch === '"' && line[i+1]==='"'){ cur+='"'; i++; continue; }
      if(ch === '"'){ inQ = !inQ; continue; }
      if(ch === ',' && !inQ){ cols.push(cur); cur=''; continue; }
      cur += ch;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

/* ---------- Utility: get filtered page count, etc ---------- */
function nextPage_global(){
  pageIndex++; renderCurrent();
}
function prevPage_global(){
  if(pageIndex>0) pageIndex--; renderCurrent();
}

/* alias pager functions used by HTML controls */
function nextPage(which){ if(which==='import'){ importPreviewPageIndex++; renderImportPreview(); } else { pageIndex++; renderCurrent(); } }
function prevPage(which){ if(which==='import'){ if(importPreviewPageIndex>0) importPreviewPageIndex--; renderImportPreview(); } else { if(pageIndex>0) pageIndex--; renderCurrent(); } }

/* jump */
function jumpToPage(){ const n = parseInt(document.getElementById('jumpPage').value,10); const list = getFilteredList(); const per = computePageSize(); const tot = Math.max(1, Math.ceil(list.length/per)); if(!isNaN(n)&&n>=1&&n<=tot){ pageIndex = n-1; renderCurrent(); } }

/* ---------- Search helper trigger ---------- */
function onSearchKeyPress(e){ if(e.key==='Enter') onSearch(); }

/* ---------- Initial sample data (if empty) ---------- */
if(!v2eList.length && !e2vList.length){
  v2eList = [
    {left:'sial', right:'apple'},
    {left:'thu', right:'book'},
    {left:'kizu', right:'cat'},
    {left:'uithu', right:'dog'}
  ];
  e2vList = [
    {left:'Apple', right:'sial'},
    {left:'Book', right:'thu'},
    {left:'Cat', right:'kizu'},
    {left:'Dog', right:'uithu'}
  ];
  saveAll();
}

/* ---------- DOM convenience ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  buildAlphaFilter();
  renderCurrent();
  showAdminControls();
});
