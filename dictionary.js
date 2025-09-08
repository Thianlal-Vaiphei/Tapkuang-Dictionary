// ===== Load dictionary from localStorage =====
let dictionary = JSON.parse(localStorage.getItem('vaipheiDictionary') || '[]');

// ===== Save dictionary =====
function saveDictionary() {
    localStorage.setItem('vaipheiDictionary', JSON.stringify(dictionary));
}

// ===== Add / Update word =====
function addOrUpdateWord(word, meaning) {
    if (!word || !meaning) return;

    const existingIndex = dictionary.findIndex(e => e.word.toLowerCase() === word.toLowerCase());
    if (existingIndex >= 0) {
        dictionary[existingIndex].meaning = meaning;
    } else {
        dictionary.push({ word, meaning });
    }

    // Sort alphabetically by Vaiphei
    dictionary.sort((a, b) => a.word.replace(/-/g,'').toLowerCase().localeCompare(b.word.replace(/-/g,'').toLowerCase()));
    saveDictionary();
    renderAll();
}

// ===== Process Excel =====
function processExcelData(data) {
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) continue;
        const word = row[0].toString().trim();
        const meaning = row[1].toString().trim();
        if (!word || !meaning) continue;
        addOrUpdateWord(word, meaning);
    }
    alert('Excel import completed!');
}

// ===== Excel import =====
document.getElementById('importExcel').addEventListener('click', () => {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput.files.length) { alert('Select a file'); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processExcelData(jsonData);
    };
    reader.readAsArrayBuffer(file);
});

// ===== Manual add/update =====
document.getElementById('addUpdateWord').addEventListener('click', () => {
    const word = document.getElementById('wordInput').value.trim();
    const meaning = document.getElementById('meaningInput').value.trim();
    if (!word || !meaning) { alert('Enter both Vaiphei and English'); return; }
    addOrUpdateWord(word, meaning);
    document.getElementById('wordInput').value = '';
    document.getElementById('meaningInput').value = '';
});

// ===== Render V2E =====
function renderV2E(filter = '') {
    const tbody = document.querySelector('#tableV2E tbody');
    tbody.innerHTML = '';
    dictionary.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()))
        .forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${e.word}</td><td>${e.meaning}</td>`;
            tbody.appendChild(tr);
        });
}

// ===== Render E2V =====
function renderE2V(filter = '') {
    const tbody = document.querySelector('#tableE2V tbody');
    tbody.innerHTML = '';
    dictionary.filter(e => e.meaning.toLowerCase().includes(filter.toLowerCase()))
        .forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${e.meaning}</td><td>${e.word}</td>`;
            tbody.appendChild(tr);
        });
}

// ===== Render both sections =====
function renderAll() {
    renderV2E(document.getElementById('searchV2E').value);
    renderE2V(document.getElementById('searchE2V').value);
}

// ===== Search inputs =====
document.getElementById('searchV2E').addEventListener('input', e => renderV2E(e.target.value.trim()));
document.getElementById('searchE2V').addEventListener('input', e => renderE2V(e.target.value.trim()));

// ===== Initial render =====
renderAll();
// ===== Process English → Vaiphei Excel =====
function processExcelE2V(data) {
    for (let i = 1; i < data.length; i++) { // skip header
        const row = data[i];
        if (!row || row.length < 2) continue;

        const english = row[0].toString().trim();
        const vaiphei = row[1].toString().trim();
        if (!english || !vaiphei) continue;

        // Check if Vaiphei already exists in dictionary
        const existingIndex = dictionary.findIndex(e => e.word.toLowerCase() === vaiphei.toLowerCase());
        if (existingIndex >= 0) {
            dictionary[existingIndex].meaning = english;
        } else {
            dictionary.push({ word: vaiphei, meaning: english });
        }
    }

    // Sort by Vaiphei word
    dictionary.sort((a,b) => a.word.replace(/-/g,'').toLowerCase().localeCompare(b.word.replace(/-/g,'').toLowerCase()));
    localStorage.setItem('vaipheiDictionary', JSON.stringify(dictionary));
    renderAll();
    alert('English → Vaiphei import completed!');
}

// ===== Event listener for English → Vaiphei import =====
document.getElementById('importExcelE2V').addEventListener('click', () => {
    const fileInput = document.getElementById('excelFileE2V');
    if (!fileInput.files.length) { alert('Select an Excel file first'); return; }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processExcelE2V(jsonData);
    };
    reader.readAsArrayBuffer(file);
});

