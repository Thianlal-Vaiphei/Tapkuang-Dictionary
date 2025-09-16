// Local storage structure: { e2v: [{word, meaning}], v2e: [{word, meaning}] }
if (!localStorage.getItem("dictionary")) {
  localStorage.setItem("dictionary", JSON.stringify({ e2v: [], v2e: [] }));
}

let currentDict = "e2v";
let currentIndex = 0;
let loggedIn = false;

function getDictionary(type) {
  let dict = JSON.parse(localStorage.getItem("dictionary"));
  return dict[type];
}

function setDictionary(type, data) {
  let dict = JSON.parse(localStorage.getItem("dictionary"));
  dict[type] = data;
  localStorage.setItem("dictionary", JSON.stringify(dict));
}

// Navigation
function openSection(id) {
  document.querySelectorAll(".dictionary, .cover").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";

  if (id === "e2v" || id === "v2e") {
    currentDict = id;
    currentIndex = 0;
    document.getElementById("dictTitle").innerText =
      (id === "e2v") ? "English → Vaiphei Dictionary" : "Vaiphei → English Dictionary";
    showPage();
  }
  if (id === "admin" && !loggedIn) {
    backHome();
  }
}

function backHome() {
  document.querySelectorAll(".dictionary").forEach(sec => sec.style.display = "none");
  document.getElementById("cover").style.display = "flex";
}

// Dictionary page turning
function showPage() {
  let dict = getDictionary(currentDict);
  let page = document.getElementById("dictPage");
  if (dict.length === 0) {
    page.innerText = "No entries found.";
    return;
  }
  let entry = dict[currentIndex];
  page.innerText = `${entry.word} → ${entry.meaning}`;
}

function nextPage() {
  let dict = getDictionary(currentDict);
  if (currentIndex < dict.length - 1) {
    currentIndex++;
    showPage();
  }
}

function prevPage() {
  if (currentIndex > 0) {
    currentIndex--;
    showPage();
  }
}

// Login
function doLogin() {
  let pass = document.getElementById("password").value;
  if (pass === "admin123") {
    loggedIn = true;
    document.getElementById("loginMsg").innerText = "Login successful!";
    openSection("admin");
  } else {
    document.getElementById("loginMsg").innerText = "Wrong password!";
  }
}

function logout() {
  loggedIn = false;
  backHome();
}

// Add Word
function saveWord() {
  let type = document.getElementById("dictType").value;
  let word = document.getElementById("word").value.trim();
  let meaning = document.getElementById("meaning").value.trim();

  if (!word || !meaning) {
    document.getElementById("addMsg").innerText = "Both fields required!";
    return;
  }

  let dict = getDictionary(type);
  let index = dict.findIndex(e => e.word === word);
  if (index >= 0) {
    dict[index].meaning = meaning;
    document.getElementById("addMsg").innerText = "Word updated!";
  } else {
    dict.push({ word, meaning });
    document.getElementById("addMsg").innerText = "Word added!";
  }
  setDictionary(type, dict);
}

function deleteWord() {
  let type = document.getElementById("dictType").value;
  let word = document.getElementById("word").value.trim();

  let dict = getDictionary(type);
  let index = dict.findIndex(e => e.word === word);
  if (index >= 0) {
    dict.splice(index, 1);
    setDictionary(type, dict);
    document.getElementById("addMsg").innerText = "Word deleted!";
  } else {
    document.getElementById("addMsg").innerText = "Word not found!";
  }
}

// Import / Export Excel
function importExcel() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx";
  input.onchange = e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = evt => {
      let data = new Uint8Array(evt.target.result);
      let workbook = XLSX.read(data, { type: "array" });
      let dict = { e2v: [], v2e: [] };

      workbook.SheetNames.forEach(name => {
        let sheet = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
        if (name.toLowerCase().includes("e2v")) dict.e2v = sheet;
        if (name.toLowerCase().includes("v2e")) dict.v2e = sheet;
      });

      localStorage.setItem("dictionary", JSON.stringify(dict));
      alert("Excel imported!");
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
}

function exportExcel() {
  let dict = JSON.parse(localStorage.getItem("dictionary"));
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dict.e2v), "E2V");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dict.v2e), "V2E");
  XLSX.writeFile(wb, "dictionary.xlsx");
}
