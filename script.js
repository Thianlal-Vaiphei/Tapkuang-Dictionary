// script.js - main app

/* ---------- CONFIG ---------- */
const ADMIN = { user: "Thianlal Vaiphei", pass: "phaltual" };

/* storage keys */
const KEY_V2E = "vaiphei_v2e";
const KEY_E2V = "vaiphei_e2v";

/* special V2E alphabet categories */
const V2E_ALPHAS = ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"];
const E2V_ALPHAS = ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));

/* book refs */
let bookV2E = null;
let bookE2V = null;

/* in-memory arrays (strings "Left - Right") */
let v2e = [];
let e2v = [];

/* search/filter states */
let filterV2E = { alpha: "ALL", query: "" };
let filterE2V = { alpha: "ALL", query: "" };

/* current pages */
let pageCountV2E = 0;
let pageCountE2V = 0;

/* admin state */
let isAdmin = false;

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // load data (localStorage or initial arrays)
  v2e = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || window.initialV2E || [];
  e2v = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || window.initialE2V || [];
  sortAll();

  // build alphabet buttons
  buildAlpha("v2eAlpha", V2E_ALPHAS, (letter)=>{ setAlphaFilter('v2e', letter); });
  buildAlpha("e2vAlpha", E2V_ALPHAS, (letter)=>{ setAlphaFilter('e2v', letter); });

  // init turn.js books (container elements will be filled on open)
  // If turn.js isn't present, we'll keep fallback navigation
  // Show home
  openHome();
});

/* ---------- Utilities ---------- */
function saveAll(){
  localStorage.setItem(KEY_V2E, JSON.stringify(v2e));
  localStorage.setItem(KEY_E2V, JSON.stringify(e2v));
}
function sortAll(){
  // sorts by left side before first " - "
  v2e.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  e2v.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  saveAll();
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- UI helpers ---------- */
function hideAllScreens(){ document.querySelectorAll('.screen').forEach(el=>el.style.display='none'); }
function openHome(){ hideAllScreens(); document.getElementById('home').style.display='block'; updateLoginUI(); }
function openLogin(){ hideAllScreens(); document.getElementById('login').style.display='block'; }
function openImportPage(){ hideAllScreens(); document.getElementById('importPage').style.display='block'; }
function openAddPage(){ if(!isAdmin){ alert('Login as admin to add words'); return; } hideAllScreens(); document.getElementById('addPage').style.display='block'; }

/* ---------- Login ---------- */
function doLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  if(u === ADMIN.user && p === ADMIN.pass){
    isAdmin = true;
    document.getElementById('loginUser').value = "";
    document.getElementById('loginPass').value = "";
    openHome();
    alert('Login success (admin)');
  } else {
    msg.textContent = 'Wrong username or password';
  }
  updateLoginUI();
}
function doLogout(){
  isAdmin = false;
  updateLoginUI();
  openHome();
}
function updateLoginUI(){
  document.getElementById('loginBtn').style.display = isAdmin ? 'none' : 'inline-block';
  document.getElementById('logoutBtn').style.display = isAdmin ? 'inline-block' : 'none';
  // admin controls on book pages
  buildAdminRow('v2e');
  buildAdminRow('e2v');
}

/* ---------- Alphabet UI ---------- */
function buildAlpha(containerId, letters, onClick){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '';
  letters.forEach(letter=>{
    const b = document.createElement('button');
    b.textContent = letter;
    b.onclick = ()=> onClick(letter);
    container.appendChild(b);
  });
}

/* ---------- Open Book ---------- */
function openBook(key){
  hideAllScreens();
  document.getElementById(key).style.display='block';
  // render pages into book container
  if(key==='v2e') renderBookV2E();
  else renderBookE2V();
}

/* ---------- Filters ---------- */
function setAlphaFilter(key, letter){
  if(key==='v2e'){ filterV2E.alpha = letter; filterV2E.query = ''; document.getElementById('v2eSearch').value=''; renderBookV2E(); }
  else { filterE2V.alpha = letter; filterE2V.query = ''; document.getElementById('e2vSearch').value=''; renderBookE2V(); }
  // highlight active
  highlightAlpha(key, letter);
}
function highlightAlpha(key, letter){
  const container = document.getElementById(key + 'Alpha');
  if(!container) return;
  container.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b.textContent === letter));
}
function filterBySearch(key){
  const q = (document.getElementById(key + 'Search').value || '').trim().toLowerCase();
  if(key==='v2e'){ filterV2E.query = q; renderBookV2E(); } else { filterE2V.query = q; renderBookE2V(); }
}

/* ---------- Build pages & turn.js integration ---------- */
function buildPagesFromList(list, pageSize=5){
  // each page contains up to pageSize entries (list are strings "Left - Right")
  const pages = [];
  for(let i=0;i<list.length;i+=pageSize){
    const chunk = list.slice(i, i+pageSize);
    const inner = document.createElement('div');
    inner.className='page';
    const html = chunk.map(item=>{
      const parts = item.split(' - ');
      const left = escapeHtml(parts.shift());
      const right = escapeHtml(parts.join(' - '));
      return `<h3>${left}</h3><p>${right}</p><hr/>`;
    }).join('');
    inner.innerHTML = html;
    pages.push(inner);
  }
  if(pages.length===0){
    const p = document.createElement('div'); p.className='page'; p.innerHTML='<p>No entries found</p>'; pages.push(p);
  }
  return pages;
}

function renderBookV2E(){
  const container = document.getElementById('book-v2e');
  container.innerHTML = ''; // clear
  // filter items
  let list = v2e.slice();
  // alpha filter
  if(filterV2E.alpha && filterV2E.alpha !== 'ALL'){
    const L = filterV2E.alpha.toLowerCase();
    list = list.filter(it=>{
      const left = it.split(' - ')[0].toLowerCase();
      // special handling for multi-letter groups like "aw", "ng", "ch"
      if(L.length > 1) return left.startsWith(L);
      return left.startsWith(L);
    });
  }
  // search query filter
  if(filterV2E.query) { list = list.filter(it=> it.toLowerCase().includes(filterV2E.query)); }
  // build pages (choose page size so book pages look like A4/A5; adjust as needed)
  const pages = buildPagesFromList(list, 6);
  pages.forEach(p=> container.appendChild(p));
  // init turn
  initTurn(container, 'v2e', pages.length);
}

function renderBookE2V(){
  const container = document.getElementById('book-e2v');
  container.innerHTML = '';
  let list = e2v.slice();
  if(filterE2V.alpha && filterE2V.alpha !== 'ALL'){
    const L = filterE2V.alpha.toLowerCase();
    list = list.filter(it=> it.split(' - ')[0].toLowerCase().startsWith(L));
  }
  if(filterE2V.query){ list = list.filter(it=> it.toLowerCase().includes(filterE2V.query)); }
  const pages = buildPagesFromList(list, 6);
  pages.forEach(p=> container.appendChild(p));
  initTurn(container, 'e2v', pages.length);
}

/* Initialize turn.js on container; if not available, fallback to simple single-page view */
function initTurn(container, key, pages){
  // update page info
  if(key==='v2e') pageCountV2E = pages;
  else pageCountE2V = pages;

  // destroy existing turn if present
  try {
    if ($(container).data('turn')) $(container).turn('destroy');
  } catch(e){ /* ignore */ }

  // If turn.js available, initialize
  if (typeof $ !== 'undefined' && typeof $(container).turn === 'function') {
    $(container).turn({
      width: container.clientWidth,
      height: container.clientHeight,
      autoCenter: true,
      pages: pages
    });
    updatePageInfoUI(key, 1, pages);
  } else {
    // fallback: show first child only and provide page info / prev/next operate by index.
    // Mark container children display block; only show first page
    Array.from(container.children).forEach((ch,i)=> ch.style.display = (i===0) ? 'block' : 'none');
    updatePageInfoUI(key, 1, pages);
  }
  // build admin row
  buildAdminRow(key);
}

/* turn navigation */
function turnNext(key){
  const container = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(container).data('turn')) {
    $(container).turn('next');
    const p = $(container).turn('page');
    updatePageInfoUI(key, p, $(container).turn('pages'));
  } else {
    // fallback: find visible index
    const ch = Array.from(container.children);
    let idx = ch.findIndex(c => c.style.display !== 'none');
    if(idx < ch.length-1){ ch[idx].style.display='none'; ch[idx+1].style.display='block'; updatePageInfoUI(key, idx+2, ch.length); }
  }
}
function turnPrev(key){
  const container = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(container).data('turn')) {
    $(container).turn('previous');
    const p = $(container).turn('page');
    updatePageInfoUI(key, p, $(container).turn('pages'));
  } else {
    const ch = Array.from(container.children);
    let idx = ch.findIndex(c => c.style.display !== 'none');
    if(idx > 0){ ch[idx].style.display='none'; ch[idx-1].style.display='block'; updatePageInfoUI(key, idx, ch.length); }
  }
}
function updatePageInfoUI(key, pageNum, total){
  document.getElementById(key + 'PageInfo').textContent = `Page ${pageNum} / ${total}`;
}

/* Jump to page (works for fallback; with turn.js uses turn('page', n)) */
function jumpToPage(key){
  const input = document.getElementById(key + 'Jump');
  const n = parseInt(input.value);
  if(!n || n < 1) return;
  const container = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(container).data('turn')) {
    $(container).turn('page', n);
    updatePageInfoUI(key, n, $(container).turn('pages'));
  } else {
    const ch = Array.from(container.children);
    if(n <= ch.length){
      ch.forEach(c=> c.style.display='none');
      ch[n-1].style.display='block';
      updatePageInfoUI(key, n, ch.length);
    }
  }
}

/* ---------- Admin row (edit/delete/add) ---------- */
function buildAdminRow(key){
  const row = document.getElementById(key + 'AdminRow');
  if(!row) return;
  row.innerHTML = '';
  if(isAdmin){
    const edit = document.createElement('button'); edit.textContent='Edit Current'; edit.onclick = ()=> editCurrent(key);
    const del = document.createElement('button'); del.textContent='Delete Current'; del.onclick = ()=> deleteCurrent(key);
    const add = document.createElement('button'); add.textContent='Add New'; add.onclick = ()=> { document.getElementById('addTarget').value = key; openAddPage(); };
    row.appendChild(edit); row.appendChild(del); row.appendChild(add);
  }
}

/* finding current index (fallback or turn.js) */
function getCurrentIndex(key){
  const container = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(container).data('turn')) {
    const p = $(container).turn('page') - 1; // page to 0-based
    // each page stores up to pageSize entries; we used 6 per page in render
    return p * 6;
  } else {
    const ch = Array.from(container.children);
    const idx = ch.findIndex(c => c.style.display !== 'none');
    return idx * 6;
  }
}

function editCurrent(key){
  if(!isAdmin){ alert('Admin only'); return; }
  const idx = getCurrentIndex(key);
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) { alert('No entry selected'); return; }
  const entry = list[idx];
  const parts = entry.split(' - ');
  const left = prompt('Edit left', parts.shift());
  if(left === null) return;
  const right = prompt('Edit right', parts.join(' - '));
  if(right === null) return;
  list[idx] = `${left} - ${right}`;
  sortAll(); renderBookV2E(); renderBookE2V(); alert('Saved');
}

function deleteCurrent(key){
  if(!isAdmin){ alert('Admin only'); return; }
  const idx = getCurrentIndex(key);
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) return;
  if(!confirm('Delete this entry?')) return;
  list.splice(idx,1);
  sortAll(); renderBookV2E(); renderBookE2V(); alert('Deleted');
}

/* ---------- Add / Import / Export ---------- */
function saveAdded(){
  const t = document.getElementById('addTarget').value;
  const left = (document.getElementById('leftInput').value || '').trim();
  const right = (document.getElementById('rightInput').value || '').trim();
  const msg = document.getElementById('addMsg');
  msg.textContent = '';
  if(!left || !right){ msg.textContent = 'Both fields required'; return; }
  const entry = `${left} - ${right}`;
  if(t==='v2e') v2e.push(entry); else e2v.push(entry);
  sortAll(); renderBookV2E(); renderBookE2V();
  msg.textContent = 'Saved';
  document.getElementById('leftInput').value=''; document.getElementById('rightInput').value='';
}

function doImport(){
  const f = document.getElementById('importFile').files[0];
  const target = document.getElementById('importTarget').value;
  const msg = document.getElementById('importMsg');
  msg.textContent = '';
  if(!f){ msg.textContent = 'Choose file'; return; }
  const reader = new FileReader();
  const name = f.name.toLowerCase();
  reader.onload = (e) => {
    try {
      if(name.endsWith('.csv') || name.endsWith('.txt')){
        const text = e.target.result;
        const rows = parseCSV(text);
        rows.forEach(r=>{
          if(r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if(target==='v2e') v2e.push(entry); else e2v.push(entry);
          }
        });
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header:1});
        rows.forEach(r=>{
          if(r[0] && r[1]) {
            const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`;
            if(target==='v2e') v2e.push(entry); else e2v.push(entry);
          }
        });
      }
      sortAll(); renderBookV2E(); renderBookE2V();
      msg.textContent = 'Imported and saved';
    } catch(err){
      console.error(err); msg.textContent = 'Import failed';
    }
  };
  if(name.endsWith('.csv')||name.endsWith('.txt')) reader.readAsText(f,'utf-8'); else reader.readAsArrayBuffer(f);
}

function exportDict(key){
  const list = (key==='v2e') ? v2e : e2v;
  const rows = list.map(it => it.split(' - '));
  const ws = XLSX.utils.aoa_to_sheet([['Word','Meaning'], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dictionary');
  XLSX.writeFile(wb, `${key}_dictionary.xlsx`);
}

/* ---------- Utilities ---------- */
function parseCSV(text){
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for(let line of lines){
    if(!line.trim()) continue;
    const cols = [];
    let cur='', inQ=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
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

/* ---------- Search helpers ---------- */
function filterListByAlphaAndQuery(list, alpha, query){
  let out = list.slice();
  if(alpha && alpha !== 'ALL'){
    const L = alpha.toLowerCase();
    out = out.filter(it => it.split(' - ')[0].toLowerCase().startsWith(L));
  }
  if(query) out = out.filter(it => it.toLowerCase().includes(query.toLowerCase()));
  return out;
}

/* ---------- Render helpers (call from various places) ---------- */
function renderBookV2E(){ renderBookGeneric('v2e', v2e, filterV2E); }
function renderBookE2V(){ renderBookGeneric('e2v', e2v, filterE2V); }

function renderBookGeneric(key, list, filterState){
  // create filtered list according to filterState
  const filtered = filterListByAlphaAndQuery(list, filterState.alpha, filterState.query);
  const container = document.getElementById('book-' + key);
  container.innerHTML = '';
  const pages = buildPagesFromList(filtered, 6);
  pages.forEach(p=> container.appendChild(p));
  initTurn(container, key, pages.length);
}

/* Expose openHome to HTML buttons */
window.openHome = openHome;
window.openBook = openBook;
window.openLogin = openLogin;
window.openImportPage = openImportPage;
window.openAddPage = openAddPage;
window.doLogin = doLogin;
window.doLogout = doLogout;
window.saveAll = saveAll;
window.renderBookV2E = renderBookV2E;
window.renderBookE2V = renderBookE2V;
window.filterBySearch = filterBySearch;
window.setAlphaFilter = setAlphaFilter;
window.turnNext = turnNext;
window.turnPrev = turnPrev;
window.jumpToPage = jumpToPage;
window.buildAdminRow = buildAdminRow;
window.editCurrent = editCurrent;
window.deleteCurrent = deleteCurrent;
window.saveAdded = saveAdded;
window.doImport = doImport;
window.exportDict = exportDict;
