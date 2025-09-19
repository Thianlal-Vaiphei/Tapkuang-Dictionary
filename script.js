let loggedIn = false;
let currentDict = "v2e";
let currentPage = 1;
const pageSize = 20; // ✅ multiple entries per page

// Login
function showLogin() {
  hideAll();
  document.getElementById("login-page").classList.remove("hidden");
}

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    loggedIn = true;
    goHome();
  } else {
    document.getElementById("login-msg").textContent = "Invalid credentials";
  }
}

function logout() {
  loggedIn = false;
  goHome();
}

function goHome() {
  hideAll();
  document.getElementById("home-page").classList.remove("hidden");
}

function hideAll() {
  ["cover-page","login-page","home-page","dictionary-page","add-word-page","import-page"]
    .forEach(id => document.getElementById(id).classList.add("hidden"));
}

// Dictionary
function openDictionary(type) {
  hideAll();
  currentDict = type;
  document.getElementById("dict-title").textContent = type === "v2e" ? "Vaiphei → English" : "English → Vaiphei";
  document.getElementById("dictionary-page").classList.remove("hidden");
  currentPage = 1;
  renderPage(currentPage);
}

function getDictionaryData() {
  return currentDict === "v2e" ? v2eDict : e2vDict;
}

function saveDictionaryData(data) {
  if (currentDict === "v2e") v2eDict = data;
  else e2vDict = data;
}

function renderPage(page) {
  let dictionary = getDictionaryData();
  dictionary.sort((a, b) => a.word.localeCompare(b.word)); // keep sorted
  const totalPages = Math.ceil(dictionary.length / pageSize);

  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;
  currentPage = page;

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const words = dictionary.slice(start, end);

  const container = document.getElementById("dictionary-content");
  container.innerHTML = "";

  if (words.length === 0) {
    container.innerHTML = "<p>No words found.</p>";
  } else {
    words.forEach((word, i) => {
      const entry = document.createElement("div");
      entry.className = "word-entry";
      entry.innerHTML = `
        <b class="headword">${word.word}</b> <span class="pos">(${word.pos})</span><br>
        <span class="definition">${word.definition}</span>
        ${loggedIn ? `
        <span class="admin-tools">
          <button onclick="editWord(${start + i})">Edit</button>
          <button onclick="deleteWord(${start + i})">Delete</button>
        </span>` : ""}
      `;
      container.appendChild(entry);
    });
  }

  document.getElementById("page-info").textContent = 
    `Page ${currentPage} / ${totalPages || 1}`;
}

function nextPage() { renderPage(currentPage + 1); }
function prevPage() { renderPage(currentPage - 1); }

function deleteWord(index) {
  let dictionary = getDictionaryData();
  dictionary.splice(index, 1);
  saveDictionaryData(dictionary);
  renderPage(currentPage); // ✅ stay on same page
}

function editWord(index) {
  let dictionary = getDictionaryData();
  let newDef = prompt("Edit meaning for " + dictionary[index].word, dictionary[index].definition);
  if (newDef !== null) {
    dictionary[index].definition = newDef;
    saveDictionaryData(dictionary);
    renderPage(currentPage);
  }
}

// Add Word
function showAddWord() {
  hideAll();
  document.getElementById("add-word-page").classList.remove("hidden");
}

function saveWord() {
  let dictType = document.getElementById("dict-type").value;
  let word = document.getElementById("word").value.trim();
  let pos = document.getElementById("pos").value.trim();
  let def = document.getElementById("definition").value.trim();

  if (!word || !def) return alert("Please fill word and meaning");

  let dict = dictType === "v2e" ? v2eDict : e2vDict;
  dict.push({ word: word, pos: pos, definition: def });
  dict.sort((a, b) => a.word.localeCompare(b.word));
  if (dictType === "v2e") v2eDict = dict; else e2vDict = dict;

  alert("Word saved!");
  goHome();
}

// Import / Export
function showImport() {
  hideAll();
  document.getElementById("import-page").classList.remove("hidden");
}

function importExcel() {
  alert("Excel Import not yet implemented here.");
}
