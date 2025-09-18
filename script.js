// ===== LOGIN =====
const ADMIN_USER = "Thianlal Vaiphei";
const ADMIN_PASS = "phaltual";

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem("loggedIn", "true");
    alert("Login successful!");
    showSection("homePage");
  } else {
    alert("Invalid username or password!");
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  showSection("loginPage");
}

// ===== DATA =====
let e2vPages = JSON.parse(localStorage.getItem("e2v")) || [];
let v2ePages = JSON.parse(localStorage.getItem("v2e")) || [];
let currentPage = { e2v: 0, v2e: 0 };

function saveData() {
  localStorage.setItem("e2v", JSON.stringify(e2vPages));
  localStorage.setItem("v2e", JSON.stringify(v2ePages));
}

// ===== NAVIGATION =====
function showSection(id) {
  document.querySelectorAll("section.page").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
}

window.onload = function() {
  if (localStorage.getItem("loggedIn") === "true") {
    showSection("homePage");
  } else {
    showSection("loginPage");
  }
  showPage("e2v");
  showPage("v2e");
};

// ===== WORD FUNCTIONS =====
function sortDictionary(book) {
  if (book === "e2v") {
    e2vPages.sort((a, b) => a.word.localeCompare(b.word));
  } else {
    v2ePages.sort((a, b) => a.word.localeCompare(b.word));
  }
}

function addWord() {
  let book = document.getElementById("dictType").value;
  let word = document.getElementById("wordInput").value.trim();
  let meaning = document.getElementById("meaningInput").value.trim();
  if (!word || !meaning) {
    alert("Please enter both word and meaning");
    return;
  }
  if (book === "e2v") {
    e2vPages.push({ word, meaning });
    sortDictionary("e2v");
  } else {
    v2ePages.push({ word, meaning });
    sortDictionary("v2e");
  }
  saveData();
  alert("Word added!");
  document.getElementById("wordInput").value = "";
  document.getElementById("meaningInput").value = "";
}

function showPage(book) {
  let pageIndex = currentPage[book];
  let content = (book === "e2v") ? e2vPages : v2ePages;
  let pageEl = document.getElementById(book + "Page");
  if (content.length === 0) {
    pageEl.innerText = "No words available.";
  } else {
    let entry = content[pageIndex];
    pageEl.innerText = entry.word + " → " + entry.meaning;
  }
  document.getElementById(book + "PageNum").innerText =
    (pageIndex + 1) + " / " + content.length;
}

function nextPage(book) {
  let content = (book === "e2v") ? e2vPages : v2ePages;
  if (currentPage[book] < content.length - 1) {
    currentPage[book]++;
    showPage(book);
  }
}

function prevPage(book) {
  if (currentPage[book] > 0) {
    currentPage[book]--;
    showPage(book);
  }
}

// ===== SEARCH =====
function searchWord(book) {
  let query = document.getElementById(book + "Search").value.toLowerCase();
  let content = (book === "e2v") ? e2vPages : v2ePages;
  let result = content.findIndex(entry =>
    entry.word.toLowerCase().startsWith(query)
  );
  if (result !== -1) {
    currentPage[book] = result;
    showPage(book);
  }
}

// ===== IMPORT / EXPORT =====
function importExcel(event, book) {
  const file = event.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(e) {
    let data = new Uint8Array(e.target.result);
    let workbook = XLSX.read(data, { type: "array" });
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    rows.forEach(row => {
      if (row[0] && row[1]) {
        if (book === "e2v") e2vPages.push({ word: row[0], meaning: row[1] });
        else v2ePages.push({ word: row[0], meaning: row[1] });
      }
    });
    sortDictionary(book);
    saveData();
    showPage(book);
    alert("Imported successfully!");
  };
  reader.readAsArrayBuffer(file);
}

function exportExcel(book) {
  let content = (book === "e2v") ? e2vPages : v2ePages;
  let data = content.map(entry => [entry.word, entry.meaning]);
  let ws = XLSX.utils.aoa_to_sheet([["Word", "Meaning"], ...data]);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, book + "_dictionary.xlsx");
}
