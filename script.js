/* script.js - final app logic */

/* --- CONFIG --- */
const ADMIN = { user: "Thianlal Vaiphei", pass: "phaltual" };
const KEY_V2E = "vaiphei_v2e";
const KEY_E2V = "vaiphei_e2v";

/* V2E special alphabets */
const V2E_ALPHAS = ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"];
const E2V_ALPHAS = ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));

/* in-memory lists */
let v2e = [];
let e2v = [];

/* admin state */
let isAdmin = false;

/* filter states */
let filterV2E = { alpha: "ALL", query: "" };
let filterE2V = { alpha: "ALL", query: "" };

/* page counts */
let pageSize = 6; // entries per page (adjust to fit A4/A5 look)

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // load from storage, else initial data
  v2e = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || (window.initialV2E || []);
  e2v = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || (window.initialE2V || []);
  sortAll();

  // build alphabet rows
  buildAlphaRow("v2eAlpha", V2E_ALPHAS, (l)=> setAlpha('v2e', l));
  buildAlphaRow("e2vAlpha", E2V_ALPHAS, (l)=> setAlpha('e2v', l));

  openHome();
});

/* ---------- HELPERS ---------- */
function saveAll(){
  localStorage.setItem(KEY_V2E, JSON.stringify(v2e));
  localStorage.setItem(KEY_E2V, JSON.stringify(e2v));
}
function sortAll(){
  v2e.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  e2v.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'}));
  saveAll();
}
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function hideScreens(){ document.querySelectorAll('.screen').forEach(s=> s.style.display='none'); }

/* ---------- NAV ---------- */
function openHome(){ hideScreens(); document.getElementById('home').style.display='block'; updateLoginUI(); }
function openLogin(){ hideScreens(); document.getElementById('login').style.display='block'; }
function openImport(){ if(!isAdmin){ alert('Login as admin to import'); return; } hideScreens(); document.getElementById('importPage').style.display='block'; }
function openAdd(){ if(!isAdmin){ alert('Login as admin to add'); return; } hideScreens(); document.getElementById('addPage').style.display='block'; }
function openBook(key){ hideScreens(); document.getElementById(key).style.display='block'; if(key==='v2e') renderBookV2E(); else renderBookE2V(); }

/* ---------- LOGIN ---------- */
function doLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  if(u === ADMIN.user && p === ADMIN.pass){
    isAdmin = true;
    document.getElementById('loginUser').value=''; document.getElementById('loginPass').value='';
    updateLoginUI();
    alert('Logged in as admin');
    openHome();
  } else {
    msg.textContent = 'Invalid username or password';
  }
}
function doLogout(){ isAdmin = false; updateLoginUI(); openHome(); }
function updateLoginUI(){
  document.getElementById('loginBtn').style.display = isAdmin ? 'none':'inline-block';
  document.getElementById('logoutBtn').style.display = isAdmin ? 'inline-block':'none';
  buildAdminRow('v2e'); buildAdminRow('e2v');
}

/* ---------- ALPHABET ROW ---------- */
function buildAlphaRow(containerId, letters, onClick){
  const c = document.getElementById(containerId);
  if(!c) return;
  c.innerHTML = '';
  letters.forEach(l=>{
    const b = document.createElement('button');
    b.textContent = l;
    b.onclick = ()=> onClick(l);
    c.appendChild(b);
  });
}
function setAlpha(key, letter){
  if(key==='v2e'){ filterV2E.alpha = letter; filterV2E.query=''; document.getElementById('v2eSearch').value=''; renderBookV2E(); highlightAlpha('v2e', letter); }
  else { filterE2V.alpha = letter; filterE2V.query=''; document.getElementById('e2vSearch').value=''; renderBookE2V(); highlightAlpha('e2v', letter); }
}
function highlightAlpha(key, letter){
  const container = document.getElementById(key + 'Alpha');
  if(!container) return;
  container.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b.textContent === letter));
}

/* ---------- SEARCH ---------- */
function filterBySearch(key){
  const q = (document.getElementById(key + 'Search').value || '').trim().toLowerCase();
  if(key==='v2e'){ filterV2E.query = q; renderBookV2E(); }
  else { filterE2V.query = q; renderBookE2V(); }
}

/* ---------- BUILD PAGES ---------- */
function buildPages(list, pageSize){
  const pages = [];
  for(let i=0;i<list.length;i+=pageSize){
    const chunk = list.slice(i, i+pageSize);
    const page = document.createElement('div');
    page.className = 'page';
    const html = chunk.map(item=>{
      const parts = item.split(' - ');
      const left = escapeHtml(parts.shift());
      const right = escapeHtml(parts.join(' - '));
      // entry html: left (with edit/delete) then meaning below
      return `<div class="entry">
                <div class="entry-row">
                  <h3>${left}</h3>
                  <div class="entry-controls">
                    ${isAdmin ? `<button class="edit" data-entry="${escapeHtml(item)}">Edit</button><button class="del" data-entry="${escapeHtml(item)}">Delete</button>` : ''}
                  </div>
                </div>
                <div class="entry-meaning">${right}</div>
              </div>`;
    }).join('<hr/>');
    page.innerHTML = html;
    pages.push(page);
  }
  if(pages.length===0){
    const p = document.createElement('div'); p.className='page'; p.innerHTML='<p>No entries.</p>'; pages.push(p);
  }
  return pages;
}

/* ---------- RENDER & TURN ---------- */
function renderBookV2E(){
  const container = document.getElementById('book-v2e');
  container.innerHTML = '';
  let list = v2e.slice();
  // alpha filter
  if(filterV2E.alpha && filterV2E.alpha !== 'ALL'){
    const L = filterV2E.alpha.toLowerCase();
    list = list.filter(it => it.split(' - ')[0].toLowerCase().startsWith(L));
  }
  // search
  if(filterV2E.query) list = list.filter(it => it.toLowerCase().includes(filterV2E.query));
  const pages = buildPages(list, pageSize);
  pages.forEach(p => container.appendChild(p));
  initTurn(container, 'v2e', pages.length);
  attachEntryButtons(container, 'v2e');
}

function renderBookE2V(){
  const container = document.getElementById('book-e2v');
  container.innerHTML = '';
  let list = e2v.slice();
  if(filterE2V.alpha && filterE2V.alpha !== 'ALL'){
    const L = filterE2V.alpha.toLowerCase();
    list = list.filter(it => it.split(' - ')[0].toLowerCase().startsWith(L));
  }
  if(filterE2V.query) list = list.filter(it => it.toLowerCase().includes(filterE2V.query));
  const pages = buildPages(list, pageSize);
  pages.forEach(p => container.appendChild(p));
  initTurn(container, 'e2v', pages.length);
  attachEntryButtons(container, 'e2v');
}

function initTurn(container, key, pages){
  // destroy existing
  try { if($(container).data('turn')) $(container).turn('destroy'); } catch(e){}
  if (typeof $ !== 'undefined' && typeof $(container).turn === 'function') {
    $(container).turn({
      width: container.clientWidth,
      height: container.clientHeight,
      autoCenter: true,
      pages: pages
    });
    updatePageInfo(key, 1, pages);
    $(container).bind('turned', function(e, page) { updatePageInfo(key, page, $(container).turn('pages')); });
  } else {
    // fallback: show first page only
    Array.from(container.children).forEach((ch,i)=> ch.style.display = (i===0) ? 'block' : 'none');
    updatePageInfo(key, 1, pages);
  }
}

/* ---------- TURN NAV ---------- */
function turnNext(key){
  const c = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(c).data('turn')) {
    $(c).turn('next');
    updatePageInfo(key, $(c).turn('page'), $(c).turn('pages'));
  } else {
    const ch = Array.from(c.children); let idx = ch.findIndex(x=> x.style.display !== 'none'); if(idx < ch.length-1) { ch[idx].style.display='none'; ch[idx+1].style.display='block'; updatePageInfo(key, idx+2, ch.length); }
  }
}
function turnPrev(key){
  const c = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(c).data('turn')) {
    $(c).turn('previous');
    updatePageInfo(key, $(c).turn('page'), $(c).turn('pages'));
  } else {
    const ch = Array.from(c.children); let idx = ch.findIndex(x=> x.style.display !== 'none'); if(idx > 0) { ch[idx].style.display='none'; ch[idx-1].style.display='block'; updatePageInfo(key, idx, ch.length); }
  }
}
function updatePageInfo(key, page, total){ document.getElementById(key + 'PageInfo').textContent = `Page ${page} / ${total}`; }

function jumpToPage(key){
  const n = parseInt(document.getElementById(key + 'Jump').value);
  if(!n || n<1) return;
  const c = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(c).data('turn')) {
    $(c).turn('page', n);
    updatePageInfo(key, n, $(c).turn('pages'));
  } else {
    const ch = Array.from(c.children);
    if(n <= ch.length){
      ch.forEach(c=>c.style.display='none'); ch[n-1].style.display='block'; updatePageInfo(key, n, ch.length);
    }
  }
}

/* ---------- Entry buttons (Edit/Delete) ---------- */
function attachEntryButtons(container, key){
  // attach events to buttons inside container
  container.querySelectorAll('.entry-controls button.edit').forEach(btn=>{
    btn.onclick = (ev)=>{
      const entryText = btn.getAttribute('data-entry');
      editEntryByText(key, entryText);
    };
  });
  container.querySelectorAll('.entry-controls button.del').forEach(btn=>{
    btn.onclick = (ev)=>{
      const entryText = btn.getAttribute('data-entry');
      deleteEntryByText(key, entryText);
    };
  });
}

function editEntryByText(key, entryText){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  const idx = list.findIndex(x => x === entryText);
  if(idx === -1){ alert('Entry not found'); return; }
  const parts = entryText.split(' - ');
  const left = prompt('Edit left (word)', parts.shift());
  if(left === null) return;
  const right = prompt('Edit right (meaning)', parts.join(' - '));
  if(right === null) return;
  list[idx] = `${left} - ${right}`;
  sortAll(); renderBookV2E(); renderBookE2V(); alert('Saved');
}

function deleteEntryByText(key, entryText){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  const idx = list.findIndex(x => x === entryText);
  if(idx === -1){ alert('Entry not found'); return; }
  if(!confirm('Delete this entry?')) return;
  list.splice(idx,1); sortAll(); renderBookV2E(); renderBookE2V(); alert('Deleted');
}

/* ---------- Admin Row (buttons under book) ---------- */
function buildAdminRow(key){
  const row = document.getElementById(key + 'AdminRow');
  if(!row) return;
  row.innerHTML = '';
  if(isAdmin){
    const edit = document.createElement('button'); edit.textContent='Edit Current'; edit.onclick = ()=> { const idx = getCurrentIndex(key); quickEditIndex(key, idx); };
    const del = document.createElement('button'); del.textContent='Delete Current'; del.onclick = ()=> { const idx=getCurrentIndex(key); quickDeleteIndex(key, idx); };
    const add = document.createElement('button'); add.textContent='Add New'; add.onclick = ()=> { document.getElementById('addTarget').value = key; openAdd(); };
    row.appendChild(edit); row.appendChild(del); row.appendChild(add);
  }
}
function getCurrentIndex(key){
  const container = document.getElementById('book-' + key);
  if (typeof $ !== 'undefined' && $(container).data('turn')) {
    const page = $(container).turn('page');
    return (page-1) * pageSize;
  } else {
    const ch = Array.from(container.children);
    const idx = ch.findIndex(c => c.style.display !== 'none');
    return idx * pageSize;
  }
}
function quickEditIndex(key, idx){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) { alert('No entry selected'); return; }
  const parts = list[idx].split(' - ');
  const left = prompt('Edit left', parts.shift());
  if(left === null) return;
  const right = prompt('Edit right', parts.join(' - '));
  if(right === null) return;
  list[idx] = `${left} - ${right}`; sortAll(); renderBookV2E(); renderBookE2V(); alert('Saved');
}
function quickDeleteIndex(key, idx){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) return;
  if(!confirm('Delete this entry?')) return;
  list.splice(idx,1); sortAll(); renderBookV2E(); renderBookE2V(); alert('Deleted');
}

/* ---------- ADD / IMPORT / EXPORT ---------- */
function saveAdded(){
  const t = document.getElementById('addTarget').value;
  const L = (document.getElementById('leftInput').value || '').trim();
  const R = (document.getElementById('rightInput').value || '').trim();
  const msg = document.getElementById('addMsg');
  msg.textContent = '';
  if(!L || !R){ msg.textContent = 'Both fields required'; return; }
  const entry = `${L} - ${R}`;
  if(t === 'v2e') v2e.push(entry); else e2v.push(entry);
  sortAll(); renderBookV2E(); renderBookE2V();
  msg.textContent = 'Saved';
  document.getElementById('leftInput').value=''; document.getElementById('rightInput').value='';
}

function doImport(){
  const f = document.getElementById('importFile').files[0];
  const target = document.getElementById('importTarget').value;
  const msg = document.getElementById('importMsg');
  msg.textContent = '';
  if(!f){ msg.textContent = 'Choose a file'; return; }
  const reader = new FileReader();
  const name = f.name.toLowerCase();
  reader.onload = (e) => {
    try {
      if(name.endsWith('.csv') || name.endsWith('.txt')){
        const txt = e.target.result;
        const rows = parseCSV(txt);
        rows.forEach(r => { if(r[0] && r[1]) { const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`; if(target==='v2e') v2e.push(entry); else e2v.push(entry); }});
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data,{type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet,{header:1});
        rows.forEach(r => { if(r[0] && r[1]) { const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`; if(target==='v2e') v2e.push(entry); else e2v.push(entry); }});
      }
      sortAll(); renderBookV2E(); renderBookE2V(); msg.textContent = 'Imported and saved';
    } catch(err){ console.error(err); msg.textContent = 'Import failed'; }
  };
  if(name.endsWith('.csv')||name.endsWith('.txt')) reader.readAsText(f,'utf-8'); else reader.readAsArrayBuffer(f);
}

function exportDict(key){
  const list = (key==='v2e') ? v2e : e2v;
  const rows = list.map(it => it.split(' - '));
  const ws = XLSX.utils.aoa_to_sheet([['Word','Meaning'], ...rows]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dictionary');
  XLSX.writeFile(wb, `${key}_dictionary.xlsx`);
}

/* ---------- CSV parser ---------- */
function parseCSV(text){
  const lines = text.split(/\r\n|\n/);
  const rows = [];
  for(let line of lines){
    if(!line.trim()) continue;
    const cols = []; let cur='', inQ=false;
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

/* ---------- utility expose for HTML buttons ---------- */
window.openHome = openHome;
window.openLogin = openLogin;
window.openImport = openImport;
window.openAdd = openAdd;
window.openBook = openBook;
window.doLogin = doLogin;
window.doLogout = doLogout;
window.saveAdded = saveAdded;
window.doImport = doImport;
window.exportDict = exportDict;
window.turnNext = turnNext;
window.turnPrev = turnPrev;
window.jumpToPage = jumpToPage;
window.filterBySearch = filterBySearch;
