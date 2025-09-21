let currentTab = "v2e";
let currentPage = 1;
let pageSize = 10;
let isAdmin = false;

// Show / Hide sections
function showSection(id) {
  document.querySelectorAll(".app-section, .main-menu").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "dictionary") renderPage();
}

// Tabs
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  currentPage = 1;
  renderPage();
}

// Render dictionary page
function renderPage() {
  let data = dictionary[currentTab];
  let start = (currentPage - 1) * pageSize;
  let page = data.slice(start, start + pageSize);

  let container = document.getElementById("bookContainer");
  container.innerHTML = page.map(entry =>
    `<div class="word-box"><strong>${entry.left}</strong> — ${entry.right}</div>`
  ).join("");

  document.getElementById("pageInfo").textContent =
    `Page ${currentPage} / ${Math.ceil(data.length / pageSize)}`;
}

// Pager
function prevPage(section="dictionary") {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
}
function nextPage(section="dictionary") {
  let max = Math.ceil(dictionary[currentTab].length / pageSize);
  if (currentPage < max) {
    currentPage++;
    renderPage();
  }
}
function jumpToPage() {
  let p = parseInt(document.getElementById("jumpPage").value);
  let max = Math.ceil(dictionary[currentTab].length / pageSize);
  if (p >= 1 && p <= max) {
    currentPage = p;
    renderPage();
  }
}

// Search
function onSearch() {
  let q = document.getElementById("searchInput").value.toLowerCase();
  let data = dictionary[currentTab].filter(
    w => w.left.toLowerCase().includes(q) || w.right.toLowerCase().includes(q)
  );
  let container = document.getElementById("bookContainer");
  container.innerHTML = data.map(entry =>
    `<div class="word-box"><strong>${entry.left}</strong> — ${entry.right}</div>`
  ).join("");
  document.getElementById("pageInfo").textContent = `Search result: ${data.length}`;
}

// Import
function importAndSave() {
  let fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Select a file");
  let file = fileInput.files[0];
  let reader = new FileReader();
  reader.onload = e => {
    let workbook = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    rows.forEach(r => {
      if (r[0] && r[1]) dictionary[currentTab].push({ left: r[0], right: r[1] });
    });
    renderPage();
  };
  reader.readAsArrayBuffer(file);
}

// Export
function exportCurrent() {
  let ws = XLSX.utils.json_to_sheet(dictionary[currentTab]);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, currentTab);
  XLSX.writeFile(wb, currentTab + ".xlsx");
}
function exportAll(tab) {
  let ws = XLSX.utils.json_to_sheet(dictionary[tab]);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tab);
  XLSX.writeFile(wb, tab + ".xlsx");
}

// Add word
function saveAdd() {
  let dir = document.getElementById("addDirection").value;
  let left = document.getElementById("addLeft").value.trim();
  let right = document.getElementById("addRight").value.trim();
  if (!left || !right) {
    document.getElementById("addMsg").textContent = "Please fill both fields";
    return;
  }
  dictionary[dir].push({ left, right });
  document.getElementById("addMsg").textContent = "Saved!";
}

// Login
function openLoginModal() {
  document.getElementById("loginModal").style.display = "flex";
}
function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}
function doLogin() {
  let user = document.getElementById("adminUser").value;
  let pass = document.getElementById("adminPass").value;
  if (user === "admin" && pass === "1234") {
    isAdmin = true;
    document.getElementById("adminControls").style.display = "block";
    closeLoginModal();
  } else {
    document.getElementById("loginMsg").textContent = "Invalid login";
  }
}
function logoutAdmin() {
  isAdmin = false;
  document.getElementById("adminControls").style.display = "none";
}

// Author note toggle
function toggleAuthorNote() {
  let note = document.getElementById("authorNote");
  if (note.classList.contains("collapsed")) {
    note.classList.remove("collapsed");
    note.classList.add("expanded");
  } else {
    note.classList.remove("expanded");
    note.classList.add("collapsed");
  }
}

// Start
window.onload = () => renderPage();
