// ===== Load dictionary from localStorage =====
let dictionary = JSON.parse(localStorage.getItem('vaipheiDictionary') || '[]');

// ===== Save dictionary to localStorage =====
function saveDictionary() {
    localStorage.setItem('vaipheiDictionary', JSON.stringify(dictionary));
}

// ===== Render dictionary table =====
function renderDictionary(filter = '') {
    const tbody = document.getElementById('dictionaryTable').querySelector('tbody');
    tbody.innerHTML = '';

    const filtered = dictionary.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${entry.word}</td><td>${entry.meaning}</td>`;
        tbody.appendChild(tr);
    });
}

// ===== Add or update a word =====
function addOrUpdateWord(word, meaning) {
    if (!word || !meaning) return;

    const existingIndex = dictionary.findIndex(e => e.word.toLowerCase() === word.toLowerCase());
    if (existingIndex >= 0) {
        dictionary[existingIndex].meaning = meaning; // update
    } else {
        dictionary.push({ word, meaning }); // add
    }

    // Sort alphabetically & syllable-aware
    dictionary.sort((a, b) => {
        const wA = a.word.replace(/-/g, '').toLowerCase();
        const wB = b.word.replace(/-/g, '').toLowerCase();
        return wA.localeCompare(wB);
    });

    saveDictionary();
    renderDictionary(document.getElementById('searchInput').value);
}

// ===== Process Excel data =====
function processExcelData(data) {
    for (let i = 1; i < data.length; i++) { // skip header
        const row = data[i];
        if (!row || row.length < 2) continue;

        const word = row[0].toString().trim();
        const meaning = row[1].toString().trim();
        if (!word || !meaning) continue;

        addOrUpdateWord(word, meaning);
    }
    alert('Excel import completed and dictionary sorted!');
}

// ===== Event: Excel import =====
document.getElementById('importExcel').addEventListener('click', () => {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput.files.length) { alert('Select an Excel file first'); return; }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processExcelData(jsonData);
    };

    reader.readAsArrayBuffer(file);
});

// ===== Event: Manual add/update =====
document.getElementById('addUpdateWord').addEventListener('click', () => {
    const word = document.getElementById('wordInput').value.trim();
    const meaning = document.getElementById('meaningInput').value.trim();
    if (!word || !meaning) { alert('Enter both word and meaning'); return; }

    addOrUpdateWord(word, meaning);
    document.getElementById('wordInput').value = '';
    document.getElementById('meaningInput').value = '';
});

// ===== Event: Search =====
document.getElementById('searchInput').addEventListener('input', (e) => {
    renderDictionary(e.target.value.trim());
});

// ===== Initial render =====
renderDictionary();
