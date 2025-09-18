// ===== Data Storage =====
let e2vPages = JSON.parse(localStorage.getItem("e2vPages") || "[]");
let v2ePages = JSON.parse(localStorage.getItem("v2ePages") || "[]");
let currentPage = { e2v: 0, v2e: 0 };
let searchResults = { e2v: null, v2e: null };

// ===== Admin Credentials =====
const adminUser = "Thianlal Vaiphei";
const adminPass = "phaltual";
let isAdmin = false;

// ===== Utility: Save Data =====
function saveData() {
  localStorage.setItem("e2vPages", JSON.stringify(e2vPages));
  localStorage.setItem("v2ePages", JSON.stringify(v2ePages));
}

// ===== Utility: Sort Dictionary =====
function sortDictionary(book) {
  if (book === "e2v") {
    e2vPages.sort((a, b) => a.localeCompare(b));
  } else {
    v2ePages.sort((a, b) => a.localeCompare(b));
  }
}

// ===== Open/Close Books =====
function openBook(book) {
  document.getElementById("cover").style.display = "none";
  document.getElementById(book).style.display = "block";
  showPage(book);
}

function closeBook() {
  document.getElementById("cover").style.display = "flex";
  document.getElementById("e2v").style.display = "none";
  document.getElementById("v2e").style.display = "none";
}

// ===== Login =====
function login() {
  let user = prompt("Enter username:");
  let pass = prompt("Enter password:");
  if (user === adminUser && pass === adminPass) {
    alert("Login successful!");
    isAdmin = true;
  } else {
    alert("Invalid credentials.");
  }
  showPage("e2v");
  showPage("v2e");
}

function logout() {
  isAdmin = false;
  alert("Logged out!");
  showPage("e2v");
  showPage("v2e");
}

// ===== Add Word =====
function addWord(book) {
  let word = prompt("Enter word:");
  let meaning = prompt("Enter meaning:");
  if (word && meaning) {
    let entry = word + " - " + meaning;
    if (book === "e2v") {
      e2vPages.push(entry);
      sortDictionary("e2v");
    } else {
      v2ePages.push(entry);
      sortDictionary("v2e");
    }
    saveData();
    showPage(book);
  }
}

// ===== Edit Word =====
function editWord(book, index) {
  let data = (book === "e2v") ? e2vPages : v2ePages;
  let parts = data[index].split(" - ");
  let newWord = prompt("Edit word:", parts[0]);
  let newMeaning = prompt("Edit meaning:", parts[1]);
  if (newWord && newMeaning) {
    data[index] = newWord + " - " + newMeaning;
    sortDictionary(book);
    saveData();
    showPage(book);
  }
}

// ===== Delete Word =====
function deleteWord(book, index) {
  if (confirm("Delete this word?")) {
    if (book === "e2v") {
      e2vPages.splice(index, 1);
      sortDictionary("e2v");
    } else {
      v2ePages.splice(index, 1);
      sortDictionary("v2e");
    }
    saveData();
    showPage(book);
  }
}

// ===== Show Page =====
function showPage(book) {
  let pageIndex = currentPage[book];
  let data = searchResults[book] ? searchResults[book] : (book === "e2v" ? e2vPages : v2ePages);
  let container = document.getElementById(book + "Page");

  container.innerText = data[pageIndex] || "No entry";

  // Admin controls
  let adminDiv = document.getElementById(book + "Admin");
  if (isAdmin && data[pageIndex] && data[pageIndex] !== "No results found") {
    adminDiv.innerHTML = `
      <button onclick="editWord('${book}', ${pageIndex})">Edit</button>
      <button onclick="deleteWord('${book}', ${pageIndex})">Delete</button>
      <button onclick="addWord('${book}')">Add New</button>
      <button onclick="logout()">Logout</button>
    `;
  } else if (isAdmin) {
    adminDiv.innerHTML = `<button onclick="addWord('${book}')">Add New</button>
                          <button onclick="logout()">Logout</button>`;
  } else {
    adminDiv.innerHTML = "";
  }

  // Update Jump Info
  document.getElementById(book + "PageNum").innerText = (pageIndex + 1) + " / " + data.length;
}

// ===== Next / Prev Page with Animation =====
function nextPage(book) {
  let data = searchResults[book] ? searchResults[book] : (book === "e2v" ? e2vPages : v2ePages);
  if (currentPage[book] < data.length - 1) {
    let pageEl = document.getElementById(book + "Page");
    pageEl.classList.add("flip-next");
    setTimeout(() => {
      currentPage[book]++;
      showPage(book);
      pageEl.classList.remove("flip-next");
    }, 600);
  }
}

function prevPage(book) {
  if (currentPage[book] > 0) {
    let pageEl = document.getElementById(book + "Page");
    pageEl.classList.add("flip-prev");
    setTimeout(() => {
      currentPage[book]--;
      showPage(book);
      pageEl.classList.remove("flip-prev");
    }, 600);
  }
}

// ===== Jump to Page =====
function jumpToPage(book) {
  let num = parseInt(document.getElementById(book + "Jump").value);
  let data = searchResults[book] ? searchResults[book] : (book === "e2v" ? e2vPages : v2ePages);
  if (!isNaN(num) && num > 0 && num <= data.length) {
    currentPage[book] = num - 1;
    showPage(book);
  } else {
    alert("Invalid page number!");
  }
}

// ===== Search =====
function searchWord(book) {
  let query = document.getElementById(book + "Search").value.toLowerCase().trim();
  let data = (book === "e2v") ? e2vPages : v2ePages;

  if (query === "") {
    searchResults[book] = null;
    currentPage[book] = 0;
    showPage(book);
    return;
  }

  let results = data.filter(entry => entry.toLowerCase().includes(query));
  searchResults[book] = results.length ? results : ["No results found"];
  currentPage[book] = 0;
  showPage(book);
}

// ===== A–Z Filter =====
function filterAZ(book, letter) {
  let data = (book === "e2v") ? e2vPages : v2ePages;
  let results = data.filter(entry => entry.toLowerCase().startsWith(letter.toLowerCase()));
  searchResults[book] = results.length ? results : ["No results found"];
  currentPage[book] = 0;
  showPage(book);
}

// ===== Import / Export Excel =====
function importExcel(event, book) {
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = function(e) {
    let data = new Uint8Array(e.target.result);
    let workbook = XLSX.read(data, { type: "array" });
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    rows.forEach(row => {
      if (row[0] && row[1]) {
        let entry = row[0] + " - " + row[1];
        if (book === "e2v") {
          e2vPages.push(entry);
        } else {
          v2ePages.push(entry);
        }
      }
    });
    sortDictionary(book);
    saveData();
    showPage(book);
  };
  reader.readAsArrayBuffer(file);
}

function exportExcel(book) {
  let data = (book === "e2v") ? e2vPages : v2ePages;
  let rows = data.map(entry => entry.split(" - "));
  let ws = XLSX.utils.aoa_to_sheet([["Word", "Meaning"], ...rows]);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dictionary");
  XLSX.writeFile(wb, book + "_dictionary.xlsx");
}

// ===== Init =====
window.onload = () => {
  sortDictionary("e2v");
  sortDictionary("v2e");
  showPage("e2v");
  showPage("v2e");
};
