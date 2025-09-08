let dictV2E = JSON.parse(localStorage.getItem('vaipheiToEnglish') || '[]');

function saveV2E() {
    localStorage.setItem('vaipheiToEnglish', JSON.stringify(dictV2E));
}

function renderV2E(filter = '') {
    const tbody = document.querySelector('#tableV2E tbody');
    tbody.innerHTML = '';
    dictV2E.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()))
        .forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${e.word}</td><td>${e.meaning}</td>`;
            tbody.appendChild(tr);
        });
}

function addV2E(word, meaning) {
    if (!word || !meaning) return;
    dictV2E.push({ word, meaning });
    dictV2E.sort((a,b)=>a.word.localeCompare(b.word));
    saveV2E();
    renderV2E();
}

function processExcelV2E(data) {
    for (let i=1; i<data.length; i++) {
        const row = data[i];
        if (row && row[0] && row[1]) addV2E(row[0].trim(), row[1].trim());
    }
    alert('Vaiphei → English import done!');
}

document.getElementById('importExcelV2E').addEventListener('click', () => {
    const file = document.getElementById('excelFileV2E').files[0];
    if (!file) return alert('Choose a file!');
    const reader = new FileReader();
    reader.onload = e => {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        processExcelV2E(XLSX.utils.sheet_to_json(ws, { header: 1 }));
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('searchV2E').addEventListener('input', e => renderV2E(e.target.value));
renderV2E();
