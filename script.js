let loggedIn = false;
let pageSize = 10;
let currentPage = { e2v: 0, v2e: 0 };
let words = { e2v: [], v2e: [] };
let filtered = { e2v: null, v2e: null };

// Setup default admin
if (!localStorage.getItem("admin")) {
  localStorage.setItem("admin", JSON.stringify({ username: "admin", password: "admin123" }));
}

// Load words from localStorage
if (localStorage.getItem("words")) {
  words = JSON.parse(localStorage.getItem("words"));
}

function saveWords() {
  localStorage.setItem("words", JSON.stringify(words));
}

// Section navigation
function openSection(id) {
  document.querySelectorAll(".section, .cover").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "dictionaryE2V") showPage("e2v");
  if (id === "dictionaryV2E") showPage("v2e");
}

function backHome() {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById("cover").style.display = "flex";
}

// Login
function doLogin() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;
  let admin = JSON.parse(localStorage.getItem("admin"));

  if (user === admin.username && pass === admin.password) {
    loggedIn = true;
    document.getElementById("loginMsg").innerText = "Login successful!";
    openSection("admin");
  } else {
    document.getElementById("loginMsg").innerText = "Wrong username or password!";
  }
}

function logout() {
  loggedIn = false;
  backHome();
}

// Change Login
function updateLogin() {
  let newUser = document.getElementById("newUser").value.trim();
  let newPass = document.getElementById("newPass").value.trim();
  if (!newUser || !newPass) {
    document.getElementById("loginChangeMsg").innerText = "Both fields required!";
    return;
  }
  localStorage.setItem("admin", JSON.stringify({ username: newUser, password: newPass }));
  document.getElementById("loginChangeMsg").innerText = "Login updated!";
}

// Add Word
function addWord() {
  let type = document.getElementById("addType").value;
  let w1 = document.getElementById("word1").value.trim();
  let w2 = document.getElementById("word2").value.trim();
  if (!w1 || !w2) {
    document.getElementById("addMsg").innerText = "Both fields required!";
    return;
  }
  if (type === "e2v") words.e2v.push({ e: w1, v: w2 });
  else words.v2e.push({ v: w1, e: w2 });
  saveWords();
  document.getElementById("addMsg").innerText = "Word added!";
  document.getElementById("word1").value = "";
  document.getElementById("word2").value = "";
}

// Show Dictionary
function showPage(type) {
  let list = document.getElementById(type + "List");
  list.innerHTML = "";
  let data = filtered[type] || words[type];
  let start = currentPage[type] * pageSize;
  let pageData = data.slice(start, start + pageSize);

  pageData.forEach((item, i) => {
    let div = document.createElement("div");
    div.className = "word-entry";
    div.innerHTML = type === "e2v"
      ? `<b>${item.e}</b> → ${item.v}`
      : `<b>${item.v}</b> → ${item.e}`;

    if (loggedIn) {
      let editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => editWord(type, start + i);
      let delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => deleteWord(type, start + i);
      div.appendChild(editBtn);
      div.appendChild(delBtn);
    }
    list.appendChild(div);
  });
}

// Edit word
function editWord(type, index) {
  let new1, new2;
  if (type === "e2v") {
    new1 = prompt("Edit English:", words.e2v[index].e);
    new2 = prompt("Edit Vaiphei:", words.e2v[index].v);
    if (new1 && new2) words.e2v[index] = { e: new1, v: new2 };
  } else {
    new1 = prompt("Edit Vaiphei:", words.v2e[index].v);
    new2 = prompt("Edit English:", words.v2e[index].e);
    if (new1 && new2) words.v2e[index] = { v: new1, e: new2 };
  }
  saveWords();
  showPage(type);
}

// Delete word
function deleteWord(type, index) {
  if (confirm("Delete this word?")) {
    words[type].splice(index, 1);
    saveWords();
    showPage(type);
  }
}

// Paging
function nextPage(type) {
  let data = filtered[type] || words[type];
  if ((currentPage[type] + 1) * pageSize < data.length) {
    currentPage[type]++;
    showPage(type);
  }
}
function prevPage(type) {
  if (currentPage[type] > 0) {
    currentPage[type]--;
    showPage(type);
  }
}

// Search
function searchWords(type) {
  let query = document.getElementById(type === "e2v" ? "searchE2V" : "searchV2E").value.toLowerCase();
  if (!query) {
    filtered[type] = null;
  } else {
    filtered[type] = words[type].filter(item =>
      (item.e && item.e.toLowerCase().includes(query)) ||
      (item.v && item.v.toLowerCase().includes(query))
    );
  }
  currentPage[type] = 0;
  showPage(type);
}

// Excel Import/Export
function importExcel() {
  let input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls";
  input.onchange = e => {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = evt => {
      let data = new Uint8Array(evt.target.result);
      let workbook = XLSX.read(data, { type: "array" });
      let sheet = workbook.Sheets[workbook.SheetNames[0]];
      let rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(r => {
        if (r.English && r.Vaiphei) words.e2v.push({ e: r.English, v: r.Vaiphei });
        if (r.Vaiphei && r.English) words.v2e.push({ v: r.Vaiphei, e: r.English });
      });
      saveWords();
      alert("Imported successfully!");
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
}

function exportExcel() {
  let wb = XLSX.utils.book_new();
  let ws1 = XLSX.utils.json_to_sheet(words.e2v.map(w => ({ English: w.e, Vaiphei: w.v })));
  let ws2 = XLSX.utils.json_to_sheet(words.v2e.map(w => ({ Vaiphei: w.v, English: w.e })));
  XLSX.utils.book_append_sheet(wb, ws1, "E2V");
  XLSX.utils.book_append_sheet(wb, ws2, "V2E");
  XLSX.writeFile(wb, "dictionary.xlsx");
}
