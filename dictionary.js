// ======= Load existing dictionary from localStorage or initialize =======
let dictionary = JSON.parse(localStorage.getItem('vaipheiDictionary') || '[]');

// ======= Save dictionary to localStorage =======
function saveDictionary() {
    localStorage.setItem('vaipheiDictionary', JSON.stringify(dictionary));
}

// ======= Render dictionary table =======
function renderDictionary() {
    const tbody = document.getElementById('dictionaryTable').querySelector('tbody');
    tbody.innerHTML = '';
    dictionary.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${entry.word}</td><td>${entry.meaning}</td>`;
        tbody.appendChild(tr);
    });
}

// ======= Add or Update a word =======
function addOrUpdateWord(word, meaning) {
    if (!word || !meaning) return;

    const existingIndex = dictionary.findIndex(e => e.word.toLowerCase() === word.toLowerCase());
    if (existingIndex >= 0) {
        dictionary[existingIndex].meaning = meaning; // update existing
    } else {
        dictionary.push({ word, meaning }); // add new
    }

    // Sort alphabetically and by syllable (ignore hyphens)
    dictionary.sort((a, b) => {
        const wordA = a.word.replace(/-/g, '').toLowerCase();
        const wordB = b.word.replace(/-/g, '').toLowerCase();
        return wordA.localeCompare(wordB);
    });

    saveDictionary();
    renderDictionary();
}

// ======= Process Excel Data =======
function processExcelData(data) {
    for (let i = 1; i < data.length; i++) { // skip header row
        const row = data[i];
        if (!row || row.length < 2) continue;

        const word = row[0].toString().trim();
        const meaning = row[1].toString().trim();
        if (!word || !meaning) continue;

        addOrUpdateWord(word, meaning);
    }
    alert('Excel import completed and dictionary sorted!');
}

// ======= Excel Import Event Listener =======
document.getElementById('importExcel').addEventListener('click', function() {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput.files.length) { alert('Please select an Excel file'); return; }

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

// ======= Initial render =======
renderDictionary();

// ======= Optional: Existing features =======
// Keep all your existing dictionary functions (search, add manually, delete, etc.) below
// Make sure any function that modifies the dictionary calls saveDictionary() and renderDictionary()
