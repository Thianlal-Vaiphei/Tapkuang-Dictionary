let currentTab = "v2e";
let currentPage = 0;
const pageSize = 25; // words per page
let isAdmin = false;

// Navigation
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Switch dictionary tab
function switchTab(tab) {
  currentTab = tab;
  currentPage = 0;
  renderDictionary();
}

// Render dictionary
function renderDictionary() {
  const dict = currentTab === "v2e" ? v2eDictionary : e2vDictionary;
  const start = currentPage * pageSize;
  const pageWords = dict.slice(start, start + pageSize);

  let html = "<ul>";
  pageWords.forEach((entry, index) => {
    html += `<li><b>${entry.word}</b> → ${entry.meaning}`;
    if (isAdmin) {
      html += ` <button onclick="editWord(${start + index})">Edit</button>
                <button onclick="deleteWord(${start + index})">Delete</button>`;
    }
    html += "</li>";
  });
  html += "</ul>";

  document.getElementById("pageContent").innerHTML = html;
  document.getElementById("pageNumber").innerText = `Page ${currentPage + 1} of ${Math.ceil(dict.length / pageSize)}`;
}

function nextPage() {
  const dict = currentTab === "v2e" ? v2eDictionary : e2vDictionary;
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

// Add word
function addWord(event) {
  event.preventDefault();
  if (!isAdmin) {
    alert("Admin only can add words!");
    return;
  }
  const type = document.getElementById("dictType").value;
  const word = document.getElementById("wordInput").value.trim();
  const meaning = document.getElementById("meaningInput").value.trim();
  if (!word || !meaning) return;

  if (type === "v2e") {
    v2eDictionary.push({ word, meaning });
    v2eDictionary = sortDictionary(v2eDictionary);
  } else {
    e2vDictionary.push({ word, meaning });
    e2vDictionary = sortDictionary(e2vDictionary);
  }
  document.getElementById("wordInput").value = "";
  document.getElementById("meaningInput").value = "";
  renderDictionary();
}

// Edit word
function editWord(index) {
  const dict = currentTab === "v2e" ? v2eDictionary : e2vDictionary;
  const newWord = prompt("Edit word:", dict[index].word);
  const newMeaning = prompt("Edit meaning:", dict[index].meaning);
  if (newWord && newMeaning) {
    dict[index] = { word: newWord, meaning: newMeaning };
    if (currentTab === "v2e") v2eDictionary = sortDictionary(dict);
    else e2vDictionary = sortDictionary(dict);
    renderDictionary();
  }
}

// Delete word
function deleteWord(index) {
  const dict = currentTab === "v2e" ? v2eDictionary : e2vDictionary;
  dict.splice(index, 1);
  renderDictionary();
}

// Admin login
function login(event) {
  event.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    isAdmin = true;
    document.getElementById("loginMessage").innerText = "Login successful!";
  } else {
    document.getElementById("loginMessage").innerText = "Wrong username or password.";
  }
}

// Excel Import
function importExcel(type) {
  if (!isAdmin) {
    alert("Admin only can import!");
    return;
  }
  const input = type === "v2e" ? document.getElementById("importV2E") : document.getElementById("importE2V");
  const file = input.files[0];
  if (!file) return alert("Select a file!");

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const newEntries = rows.slice(1).map(r => ({ word: r[0], meaning: r[1] }));
    if (type === "v2e") {
      v2eDictionary = sortDictionary(v2eDictionary.concat(newEntries));
    } else {
      e2vDictionary = sortDictionary(e2vDictionary.concat(newEntries));
    }
    renderDictionary();
  };
  reader.readAsArrayBuffer(file);
}

// Excel Export
function exportExcel(type) {
  if (!isAdmin) {
    alert("Admin only can export!");
    return;
  }
  const dict = type === "v2e" ? v2eDictionary : e2vDictionary;
  const ws = XLSX.utils.json_to_sheet(dict);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  XLSX.writeFile(wb, type === "v2e" ? "Vaiphei-English.xlsx" : "English-Vaiphei.xlsx");
}
