let currentDict = "v2e";
let currentPage = 0;
const pageSize = 30; // number of words per page
let isAdmin = false;

// Navigation
function openSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if (id === "dictionary") renderDictionary();
}

// Switch dictionary type
function switchDictionary(type) {
  currentDict = type;
  currentPage = 0;
  renderDictionary();
}

// Render dictionary pages
function renderDictionary() {
  const container = document.getElementById("dict-pages");
  container.innerHTML = "";

  const dict = currentDict === "v2e" ? v2eDictionary : e2vDictionary;
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageWords = dict.slice(start, end);

  pageWords.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "word-entry";
    div.innerHTML = `
      <span><b>${entry.word}</b>: ${entry.meaning}</span>
      <span class="word-actions">
        <button class="edit" onclick="editWord(${start + index})">Edit</button>
        <button onclick="deleteWord(${start + index})">Delete</button>
      </span>
    `;
    container.appendChild(div);
  });

  document.getElementById("pageIndicator").textContent =
    `Page ${currentPage + 1} / ${Math.ceil(dict.length / pageSize)}`;
}

// Page turning
function nextPage() {
  const dict = currentDict === "v2e" ? v2eDictionary : e2vDictionary;
  if ((currentPage + 1) * pageSize < dict.length) {
    currentPage++;
    renderDictionary();
  }
}
function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderDictionary();
  }
}

// Add Word
function addWord() {
  const word = document.getElementById("wordInput").value.trim();
  const meaning = document.getElementById("meaningInput").value.trim();
  const type = document.getElementById("dictType").value;

  if (!word || !meaning) return alert("Fill both fields!");

  const entry = { word, meaning };
  if (type === "v2e") {
    v2eDictionary.push(entry);
    v2eDictionary = sortDictionary(v2eDictionary);
  } else {
    e2vDictionary.push(entry);
    e2vDictionary = sortDictionary(e2vDictionary);
  }
  alert("Word added successfully!");
  document.getElementById("wordInput").value = "";
  document.getElementById("meaningInput").value = "";
}

// Delete Word
function deleteWord(index) {
  const dict = currentDict === "v2e" ? v2eDictionary : e2vDictionary;
  dict.splice(index, 1);
  if (currentPage * pageSize >= dict.length && currentPage > 0) {
    currentPage--;
  }
  renderDictionary();
}

// Edit Word
function editWord(index) {
  const dict = currentDict === "v2e" ? v2eDictionary : e2vDictionary;
  const entry = dict[index];
  const newMeaning = prompt(`Edit meaning for "${entry.word}"`, entry.meaning);
  if (newMeaning !== null && newMeaning.trim() !== "") {
    entry.meaning = newMeaning.trim();
    renderDictionary();
  }
}

// Login
function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    isAdmin = true;
    document.body.classList.add("admin");
    document.getElementById("loginMessage").textContent = "Admin logged in!";
  } else {
    alert("Invalid login!");
  }
}

// Excel Import/Export
function importExcel() {
  alert("Excel import feature to be implemented with SheetJS.");
}

function exportExcel(type) {
  alert(`Exporting ${type === "v2e" ? "Vaiphei→English" : "English→Vaiphei"} dictionary...`);
}
