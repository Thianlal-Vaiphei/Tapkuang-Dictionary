let currentTab = "v2e";
let currentPage = 1;
let itemsPerPage = 10;
let isAdmin = false;

// Navigation
function openSection(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if (id === "dictionary") renderPage();
}

function switchTab(tab) {
  currentTab = tab;
  currentPage = 1;
  renderPage();
}

// Render Dictionary Page
function renderPage() {
  let data = dictionary[currentTab];
  let start = (currentPage - 1) * itemsPerPage;
  let pageData = data.slice(start, start + itemsPerPage);

  let container = document.getElementById("pageContent");
  container.innerHTML = "";
  pageData.forEach((entry, index) => {
    let div = document.createElement("div");
    div.className = "word-box";
    div.innerHTML = `<strong>${entry.left}</strong> - <span>${entry.right}</span>`;
    if (isAdmin) {
      div.innerHTML += ` <button onclick="deleteWord(${start + index})">Delete</button>`;
    }
    container.appendChild(div);
  });

  document.getElementById("pageNum").innerText = currentPage;
}

function nextPage() {
  if ((currentPage * itemsPerPage) < dictionary[currentTab].length) {
    currentPage++;
    renderPage();
  }
}
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
}

// Add Word
function addWord() {
  let side = document.getElementById("wordSide").value;
  let word = document.getElementById("wordInput").value.trim();
  let meaning = document.getElementById("meaningInput").value.trim();

  if (!word || !meaning) return alert("Enter both word and meaning");

  dictionary[side].push({ left: word, right: meaning });
  dictionary[side].sort((a, b) => a.left.localeCompare(b.left));
  alert("Word added!");
}

// Delete Word
function deleteWord(index) {
  dictionary[currentTab].splice(index, 1);
  renderPage();
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
    alert("Import successful!");
  };
  reader.readAsArrayBuffer(file);
}

// Export
function exportExcel(side) {
  let ws = XLSX.utils.json_to_sheet(dictionary[side].map(x => [x.left, x.right]));
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${side}.xlsx`);
}

// Login
function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;
  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    isAdmin = true;
    document.getElementById("loginMsg").innerText = "Login successful!";
  } else {
    document.getElementById("loginMsg").innerText = "Invalid credentials!";
  }
}
