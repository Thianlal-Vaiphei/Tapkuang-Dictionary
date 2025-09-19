/* script.js - A4 pages + dynamic fill + stay on same page after delete */

/* CONFIG */
const ADMIN = { user: "Thianlal Vaiphei", pass: "phaltual" };
const KEY_V2E = "vaiphei_v2e";
const KEY_E2V = "vaiphei_e2v";
const V2E_ALPHAS = ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"];
const E2V_ALPHAS = ["ALL"].concat(Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));

/* state */
let v2e = [];
let e2v = [];
let isAdmin = false;
let filterV2E = { alpha: "ALL", query: "" };
let filterE2V = { alpha: "ALL", query: "" };
const PAGE_FILL_GUARD = 40; // min px space to consider page full

document.addEventListener('DOMContentLoaded', () => {
  v2e = JSON.parse(localStorage.getItem(KEY_V2E) || "null") || window.initialV2E || [];
  e2v = JSON.parse(localStorage.getItem(KEY_E2V) || "null") || window.initialE2V || [];
  sortAll();
  buildAlphaRow('v2eAlpha', V2E_ALPHAS, (l)=> setAlpha('v2e', l));
  buildAlphaRow('e2vAlpha', E2V_ALPHAS, (l)=> setAlpha('e2v', l));
  openHome();
});

/* helpers */
function saveAll(){ localStorage.setItem(KEY_V2E, JSON.stringify(v2e)); localStorage.setItem(KEY_E2V, JSON.stringify(e2v)); }
function sortAll(){ v2e.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'})); e2v.sort((a,b)=> a.localeCompare(b, undefined, {sensitivity:'base'})); saveAll(); }
function hideScreens(){ document.querySelectorAll('.screen').forEach(s=> s.style.display='none'); }
function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* NAV */
function openHome(){ hideScreens(); document.getElementById('home').style.display='block'; updateLoginUI(); }
function openLogin(){ hideScreens(); document.getElementById('login').style.display='block'; }
function openImport(){ if(!isAdmin){ alert('Login as admin to import'); return; } hideScreens(); document.getElementById('importPage').style.display='block'; }
function openAdd(){ if(!isAdmin){ alert('Login as admin to add'); return; } hideScreens(); document.getElementById('addPage').style.display='block'; }
function openBook(key){ hideScreens(); document.getElementById(key).style.display='block'; if(key==='v2e') renderBookV2E(); else renderBookE2V(); }

/* LOGIN */
function doLogin(){
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value.trim();
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  if(u === ADMIN.user && p === ADMIN.pass){ isAdmin = true; document.getElementById('loginUser').value=''; document.getElementById('loginPass').value=''; updateLoginUI(); alert('Logged in as admin'); openHome(); }
  else msg.textContent = 'Invalid username or password';
}
function doLogout(){ isAdmin = false; updateLoginUI(); openHome(); }
function updateLoginUI(){ document.getElementById('loginBtn').style.display = isAdmin ? 'none' : 'inline-block'; document.getElementById('logoutBtn').style.display = isAdmin ? 'inline-block' : 'none'; buildAdminRow('v2e'); buildAdminRow('e2v'); }

/* ALPHABET */
function buildAlphaRow(id, letters, onClick){
  const c = document.getElementById(id);
  if(!c) return;
  c.innerHTML = '';
  letters.forEach(l=>{
    const b = document.createElement('button'); b.textContent = l; b.onclick = ()=> onClick(l); c.appendChild(b);
  });
}
function setAlpha(key, letter){
  if(key==='v2e'){ filterV2E.alpha = letter; filterV2E.query=''; document.getElementById('v2eSearch').value=''; renderBookV2E(); highlightAlpha('v2e', letter); }
  else { filterE2V.alpha = letter; filterE2V.query=''; document.getElementById('e2vSearch').value=''; renderBookE2V(); highlightAlpha('e2v', letter); }
}
function highlightAlpha(key, letter){ const c = document.getElementById(key + 'Alpha'); if(!c) return; c.querySelectorAll('button').forEach(b=> b.classList.toggle('active', b.textContent===letter)); }

/* SEARCH */
function filterBySearch(key){
  const q = (document.getElementById(key + 'Search').value || '').trim().toLowerCase();
  if(key==='v2e'){ filterV2E.query = q; renderBookV2E(); } else { filterE2V.query = q; renderBookE2V(); }
}

/* PAGINATION (dynamic fill) */
/* Create page elements by adding entries until page scrollHeight exceeds clientHeight, then back off */
function paginateListToPages(list, containerWidth, containerHeight){
  const pages = [];
  // create temporary page element (not attached) to measure
  const temp = document.createElement('div');
  temp.className = 'page';
  temp.style.width = containerWidth + 'px';
  temp.style.height = containerHeight + 'px';
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  document.body.appendChild(temp);

  let page = temp.cloneNode();
  page.innerHTML = '';
  for(let i=0;i<list.length;i++){
    const item = list[i];
    const parts = item.split(' - ');
    const left = escapeHtml(parts.shift());
    const right = escapeHtml(parts.join(' - '));
    const entry = document.createElement('div');
    entry.className = 'entry';
    const controlsHTML = isAdmin ? `<div class="entry-controls"><button class="edit">Edit</button><button class="del">Delete</button></div>` : `<div class="entry-controls"></div>`;
    entry.innerHTML = `<div class="entry-row"><h3>${left}</h3>${controlsHTML}</div><div class="entry-meaning">${right}</div><hr/>`;
    page.appendChild(entry);

    // measure
    document.body.appendChild(page);
    const tooTall = page.scrollHeight > containerHeight - PAGE_FILL_GUARD;
    document.body.removeChild(page);

    if(tooTall){
      // remove last entry from this page and put into new page
      page.removeChild(entry);
      const saved = page.innerHTML;
      const realPage = document.createElement('div'); realPage.className = 'page'; realPage.innerHTML = saved;
      pages.push(realPage);
      // start new page with current entry (recreate)
      page = temp.cloneNode();
      page.innerHTML = '';
      page.appendChild(entry);
    }
  }
  // push final page
  if(page.childElementCount > 0){
    const lastPage = document.createElement('div'); lastPage.className='page'; lastPage.innerHTML = page.innerHTML;
    pages.push(lastPage);
  }
  document.body.removeChild(temp);
  if(pages.length === 0){
    const p = document.createElement('div'); p.className='page'; p.innerHTML = '<p>No entries.</p>'; pages.push(p);
  }
  return pages;
}

/* Render V2E and E2V */
function renderBookV2E(){
  const container = document.getElementById('book-v2e'); container.innerHTML = '';
  let list = v2e.slice();
  if(filterV2E.alpha && filterV2E.alpha !== 'ALL'){ const L = filterV2E.alpha.toLowerCase(); list = list.filter(it => it.split(' - ')[0].toLowerCase().startsWith(L)); }
  if(filterV2E.query) list = list.filter(it => it.toLowerCase().includes(filterV2E.query));
  // paginate using container size
  const cw = container.clientWidth || 794;
  const ch = container.clientHeight || 1123;
  const pages = paginateListToPages(list, cw, ch);
  pages.forEach(p => container.appendChild(p));
  initTurn(container, 'v2e', pages.length);
  attachEntryButtonHandlers(container, 'v2e', list);
}

function renderBookE2V(){
  const container = document.getElementById('book-e2v'); container.innerHTML = '';
  let list = e2v.slice();
  if(filterE2V.alpha && filterE2V.alpha !== 'ALL'){ const L = filterE2V.alpha.toLowerCase(); list = list.filter(it => it.split(' - ')[0].toLowerCase().startsWith(L)); }
  if(filterE2V.query) list = list.filter(it => it.toLowerCase().includes(filterE2V.query));
  const cw = container.clientWidth || 794;
  const ch = container.clientHeight || 1123;
  const pages = paginateListToPages(list, cw, ch);
  pages.forEach(p => container.appendChild(p));
  initTurn(container, 'e2v', pages.length);
  attachEntryButtonHandlers(container, 'e2v', list);
}

/* Initialize turn.js or fallback */
function initTurn(container, key, pages){
  try{ if($(container).data('turn')) $(container).turn('destroy'); }catch(e){}
  if(typeof $ !== 'undefined' && typeof $(container).turn === 'function'){
    $(container).turn({ width: container.clientWidth, height: container.clientHeight, autoCenter: true, pages });
    updatePageInfo(key, 1, pages);
    $(container).bind('turned', function(e, page) { updatePageInfo(key, page, $(container).turn('pages')); });
  } else {
    Array.from(container.children).forEach((ch,i)=> ch.style.display = (i===0)?'block':'none');
    updatePageInfo(key,1,pages);
  }
  buildAdminRow(key);
}

/* turn navigation */
function turnNext(key){ const c = document.getElementById('book-' + key); if(typeof $ !== 'undefined' && $(c).data('turn')){ $(c).turn('next'); updatePageInfo(key, $(c).turn('page'), $(c).turn('pages')); } else { const ch = Array.from(c.children); let idx = ch.findIndex(x=> x.style.display !== 'none'); if(idx < ch.length-1){ ch[idx].style.display='none'; ch[idx+1].style.display='block'; updatePageInfo(key, idx+2, ch.length); } } }
function turnPrev(key){ const c = document.getElementById('book-' + key); if(typeof $ !== 'undefined' && $(c).data('turn')){ $(c).turn('previous'); updatePageInfo(key, $(c).turn('page'), $(c).turn('pages')); } else { const ch = Array.from(c.children); let idx = ch.findIndex(x=> x.style.display !== 'none'); if(idx > 0){ ch[idx].style.display='none'; ch[idx-1].style.display='block'; updatePageInfo(key, idx, ch.length); } } }
function updatePageInfo(key, page, total){ document.getElementById(key + 'PageInfo').textContent = `Page ${page} / ${total}`; }

function jumpToPage(key){ const n = parseInt(document.getElementById(key + 'Jump').value); if(!n||n<1) return; const c = document.getElementById('book-' + key); if(typeof $ !== 'undefined' && $(c).data('turn')){ $(c).turn('page', n); updatePageInfo(key, n, $(c).turn('pages')); } else { const ch = Array.from(c.children); if(n<=ch.length){ ch.forEach(cc=> cc.style.display='none'); ch[n-1].style.display='block'; updatePageInfo(key, n, ch.length); } } }

/* ENTRY BUTTONS */
function attachEntryButtonHandlers(container, key, filteredList){
  // attach edit/delete in each visible page
  container.querySelectorAll('.edit').forEach((btn,i)=>{
    btn.onclick = (ev)=>{
      // find entry text from surrounding DOM
      const row = btn.closest('.entry');
      const left = row.querySelector('h3').textContent;
      // find index in global list by left match and meaning
      const meaning = row.querySelector('.entry-meaning').textContent;
      const entryText = filteredList.find(it => it.split(' - ')[0] === left && it.toLowerCase().includes(meaning.trim().toLowerCase()));
      if(entryText) editByText(key, entryText);
    };
  });
  container.querySelectorAll('.del').forEach((btn,i)=>{
    btn.onclick = (ev)=>{
      const row = btn.closest('.entry');
      const left = row.querySelector('h3').textContent;
      const meaning = row.querySelector('.entry-meaning').textContent;
      const entryText = filteredList.find(it => it.split(' - ')[0] === left && it.toLowerCase().includes(meaning.trim().toLowerCase()));
      if(entryText) deleteByText(key, entryText);
    };
  });
}

/* edit/delete by text - maintain current page after deletion */
function editByText(key, entryText){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  const idx = list.findIndex(x => x === entryText);
  if(idx === -1) return alert('Item not found');
  const parts = entryText.split(' - ');
  const left = prompt('Edit left', parts.shift());
  if(left === null) return;
  const right = prompt('Edit right', parts.join(' - '));
  if(right === null) return;
  list[idx] = `${left} - ${right}`;
  sortAll();
  // re-render same book and try to keep same page: compute page that contained the edited index
  rerenderSamePageAfterChange(key, idx);
}

function deleteByText(key, entryText){
  if(!isAdmin){ alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  const idx = list.findIndex(x => x === entryText);
  if(idx === -1) return alert('Item not found');
  if(!confirm('Delete this entry?')) return;
  // before deleting, compute approximate page number that contains idx
  const currentPageNumber = computePageForIndex(key, idx);
  list.splice(idx,1);
  sortAll();
  // re-render and go to same page (or last page if shorter)
  rerenderAndGoToPage(key, currentPageNumber);
}

/* compute page number for a given index by repaginating until we reach that index */
function computePageForIndex(key, targetIndex){
  const container = document.createElement('div');
  container.style.width = (document.getElementById('book-' + key).clientWidth || 794) + 'px';
  container.style.height = (document.getElementById('book-' + key).clientHeight || 1123) + 'px';
  const list = (key==='v2e') ? v2e.slice() : e2v.slice();
  // simulate pages with current isAdmin state
  const pages = paginateListToPages(list, parseInt(container.style.width), parseInt(container.style.height));
  const pageIndex = Math.floor(targetIndex / (pageSize || 6)); // fallback page number estimate
  // but find exact page that contains that index by scanning pages lengths
  let count = 0;
  for(let i=0;i<pages.length;i++){
    // estimate entries per page by counting <h3> in page HTML
    const temp = document.createElement('div'); temp.innerHTML = pages[i].innerHTML;
    const entries = temp.querySelectorAll('h3').length;
    if(targetIndex < count + entries) return i+1;
    count += entries;
  }
  return 1;
}

/* rerender helpers */
function rerenderSamePageAfterChange(key, index){
  // compute page number where index falls and navigate there after render
  const pageNum = computePageForIndex(key, index);
  if(key === 'v2e'){ renderBookV2E(); goToPage('v2e', pageNum); } else { renderBookE2V(); goToPage('e2v', pageNum); }
}
function rerenderAndGoToPage(key, pageNum){
  if(key === 'v2e'){ renderBookV2E(); goToPage('v2e', pageNum); } else { renderBookE2V(); goToPage('e2v', pageNum); }
}
function goToPage(key, pageNum){
  const container = document.getElementById('book-' + key);
  if(typeof $ !== 'undefined' && $(container).data('turn')) {
    const total = $(container).turn('pages');
    const p = Math.min(pageNum, total);
    $(container).turn('page', p);
    updatePageInfo(key,p,total);
  } else {
    const ch = Array.from(container.children);
    const p = Math.min(pageNum, ch.length);
    ch.forEach((c,i)=> c.style.display = (i===p-1)?'block':'none');
    updatePageInfo(key, p, ch.length);
  }
}

/* ADMIN ROW (below book) */
function buildAdminRow(key){
  const row = document.getElementById(key + 'AdminRow');
  if(!row) return;
  row.innerHTML = '';
  if(isAdmin){
    const edit = document.createElement('button'); edit.textContent='Edit Current'; edit.onclick = ()=> { const idx = getCurrentGlobalIndex(key); quickEditIndex(key, idx); };
    const del  = document.createElement('button'); del.textContent='Delete Current'; del.onclick = ()=> { const idx = getCurrentGlobalIndex(key); quickDeleteIndex(key, idx); };
    const add  = document.createElement('button'); add.textContent='Add New'; add.onclick = ()=> { document.getElementById('addTarget').value = key; openAdd(); };
    row.appendChild(edit); row.appendChild(del); row.appendChild(add);
  }
}
function getCurrentGlobalIndex(key){
  const container = document.getElementById('book-' + key);
  if(typeof $ !== 'undefined' && $(container).data('turn')) {
    const page = $(container).turn('page');
    // each page contains variable number of entries; approximate by totaling entries on previous pages
    let count = 0;
    for(let p=1;p<page;p++){
      const html = $(container).turn('pageElement', p)[0].innerHTML;
      const temp = document.createElement('div'); temp.innerHTML = html;
      count += temp.querySelectorAll('h3').length;
    }
    // on current visible page, select the first entry (index = count)
    return count;
  } else {
    const ch = Array.from(container.children);
    const idxPage = ch.findIndex(c=> c.style.display !== 'none');
    // count entries on earlier pages
    let count = 0;
    for(let i=0;i<idxPage;i++){
      const temp = document.createElement('div'); temp.innerHTML = ch[i].innerHTML;
      count += temp.querySelectorAll('h3').length;
    }
    return count;
  }
}
function quickEditIndex(key, idx){
  if(!isAdmin) { alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) { alert('No entry selected'); return; }
  const parts = list[idx].split(' - ');
  const left = prompt('Edit left', parts.shift());
  if(left === null) return;
  const right = prompt('Edit right', parts.join(' - '));
  if(right === null) return;
  list[idx] = `${left} - ${right}`; sortAll(); rerenderSamePageAfterChange(key, idx);
}
function quickDeleteIndex(key, idx){
  if(!isAdmin) { alert('Admin only'); return; }
  const list = (key==='v2e') ? v2e : e2v;
  if(idx >= list.length) return;
  if(!confirm('Delete this entry?')) return;
  const pageNum = computePageForIndex(key, idx);
  list.splice(idx,1); sortAll(); rerenderAndGoToPage(key, pageNum);
}

/* ADD / IMPORT / EXPORT */
function saveAdded(){
  const t = document.getElementById('addTarget').value;
  const L = (document.getElementById('leftInput').value || '').trim();
  const R = (document.getElementById('rightInput').value || '').trim();
  const msg = document.getElementById('addMsg');
  msg.textContent = '';
  if(!L || !R){ msg.textContent = 'Both required'; return; }
  const entry = `${L} - ${R}`;
  if(t === 'v2e') v2e.push(entry); else e2v.push(entry);
  sortAll(); renderBookV2E(); renderBookE2V(); msg.textContent = 'Saved'; document.getElementById('leftInput').value=''; document.getElementById('rightInput').value='';
}

function doImport(){
  const f = document.getElementById('importFile').files[0];
  const target = document.getElementById('importTarget').value;
  const msg = document.getElementById('importMsg'); msg.textContent = '';
  if(!f){ msg.textContent = 'Choose file'; return; }
  const reader = new FileReader(); const name = f.name.toLowerCase();
  reader.onload = (e)=>{
    try{
      if(name.endsWith('.csv') || name.endsWith('.txt')){
        const rows = parseCSV(e.target.result);
        rows.forEach(r=> { if(r[0] && r[1]) { const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`; if(target==='v2e') v2e.push(entry); else e2v.push(entry); }});
      } else {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data,{type:'array'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet,{header:1});
        rows.forEach(r=> { if(r[0] && r[1]){ const entry = `${String(r[0]).trim()} - ${String(r[1]).trim()}`; if(target==='v2e') v2e.push(entry); else e2v.push(entry); }});
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
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dictionary'); XLSX.writeFile(wb, `${key}_dictionary.xlsx`);
}

/* CSV parser */
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

/* expose */
window.openHome = openHome; window.openLogin = openLogin; window.openImport = openImport; window.openAdd = openAdd;
window.openBook = openBook; window.doLogin = doLogin; window.doLogout = doLogout; window.saveAdded = saveAdded;
window.doImport = doImport; window.exportDict = exportDict; window.turnNext = turnNext; window.turnPrev = turnPrev;
window.jumpToPage = jumpToPage; window.filterBySearch = filterBySearch;
