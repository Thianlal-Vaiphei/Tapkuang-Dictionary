let currentTab = "v2e";
let currentPage = 0;
let wordsPerPage = 15;
let isAdmin = false;

// Switch sections
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "dictionary") renderPage();
}

// Switch dictionary tab
function switchTab(tab) {
  currentTab = tab;
  currentPage = 0;
  renderPage();
}

// Render dictionary page
function renderPage() {
  let container = document.getElementById("page");
  let list = dictionary[currentTab];
  let start = currentPage * wordsPerPage;
  let end = start + wordsPerPage;
  let pageWords = list.slice(start, end);

  container.innerHTML = "";
  pageWords.forEach((entry, index) => {
    let div = document.createElement("div");
    div.className = "word-box";
    div.innerHTML = `<strong>${entry.left}</strong> → <span>${entry.right}</span>`;

    if (isAdmin) {
      div.innerHTML += `
        <button onclick="editWord(${start + index})">Edit</button>
        <button onclick="deleteWord(${start + index})">Delete</button>
      `;
    }
    container.appendChild(div);
  });

  document.getElementById("pageNumber").innerText = 
    `Page ${currentPage + 1} of ${Math.ceil(list.length / wordsPerPage)}`;
}

// Navigation
function nextPage() {
  let max = Math.ceil(dictionary[currentTab].length / wordsPerPage);
  if (currentPage < max - 1) {
    currentPage++;
    renderPage();
  }
}
function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderPage();
  }
}

// Add word
function addWord() {
  let word = document.getElementById("newWord").value.trim();
  let meaning = document.getElementById("newMeaning").value.trim();
  let tab = document.getElementById("addTab").value;

  if (!word || !meaning) return alert("Fill both fields!");

  dictionary[tab].push({ left: word, right: meaning });
  dictionary[tab].sort((a, b) => a.left.localeCompare(b.left));

  document.getElementById("newWord").value = "";
  document.getElementById("newMeaning").value = "";
  alert("Word added!");
}

// Edit word
function editWord(index) {
  let entry = dictionary[currentTab][index];
  let newWord = prompt("Edit word:", entry.left);
  let newMeaning = prompt("Edit meaning:", entry.right);

  if (newWord && newMeaning) {
    dictionary[currentTab][index] = { left: newWord, right: newMeaning };
    dictionary[currentTab].sort((a, b) => a.left.localeCompare(b.left));
    renderPage();
  }
}

// Delete word
function deleteWord(index) {
  if (confirm("Delete this word?")) {
    dictionary[currentTab].splice(index, 1);
    renderPage();
  }
}

// Login
function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;

  if (user === "Thianlal Vaiphei" && pass === "phaltual") {
    isAdmin = true;
    alert("Login successful!");
    showSection("dictionary");
  } else {
    alert("Invalid login");
  }
}

// Import
function importAndSave() {
  let fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Select a file");

  let tab = document.getElementById("importTab").value;
  let file = fileInput.files[0];
  let reader = new FileReader();

  reader.onload = e => {
    try {
      let workbook = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      let sheet = workbook.Sheets[workbook.SheetNames[0]];
      let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      rows.forEach(r => {
        if (r[0] && r[1]) {
          dictionary[tab].push({ left: r[0], right: r[1] });
        }
      });

      dictionary[tab].sort((a, b) => a.left.localeCompare(b.left));
      renderPage();
      alert("Imported successfully!");
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Export
function exportDictionary(tab) {
  let ws = XLSX.utils.json_to_sheet(dictionary[tab].map(e => [e.left, e.right]));
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  XLSX.writeFile(wb, tab + "_dictionary.xlsx");
}
