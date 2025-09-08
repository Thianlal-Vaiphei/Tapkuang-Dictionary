let dictE2V = JSON.parse(localStorage.getItem('englishToVaiphei') || '[]');

function saveE2V() {
    localStorage.setItem('englishToVaiphei', JSON.stringify(dictE2V));
}

function renderE2V(filter = '') {
    const tbody = document.querySelector('#tableE2V tbody');
    tbody.innerHTML = '';
    dictE2V.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()))
        .forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${e.word}</td><td>${e.meaning}</td>`;
            tbody.appendChild(tr);
        });
}

function addE2V(word, meaning) {
    if (!word || !meaning) return;
    dictE2V.push({ word, meaning });
    dictE2V.sort((a,b)=>a.word.localeCompare(b.word));
    saveE2V();
    renderE2V();
}

function processExcelE2V(data) {
    for (let i=1; i<data.length; i++) {
        const row = data[i];
        if (row && row[0] && row[1]) addE2V(row[0].trim(), row[1].trim());
    }
    alert('English → Vaiphei import done!');
}

document.getElementById('importExcelE2V').addEventListener('click', () => {
    const file = document.getElementById('excelFileE2V').files[0];
    if (!file) return alert('Choose a file!');
    const reader = new FileReader();
    reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        processExcelE2V(XLSX.utils.sheet_to_json(ws, { header: 1 }));
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('searchE2V').addEventListener('input', e => renderE2V(e.target.value));
renderE2V();
