const app = document.getElementById("app");
let dict = JSON.parse(localStorage.getItem("tapkuang-dict") || "[]");

function render() {
  app.innerHTML = `
    <input id="q" placeholder="Search word..." style="padding:0.5rem;width:80%" />
    <button onclick="addWord()">+ Add</button>
    <div id="list"></div>
  `;
  document.getElementById("q").oninput = e => search(e.target.value);
  search("");
}

function search(q) {
  q = q.toLowerCase();
  const res = dict.filter(it => it.vaiphei.toLowerCase().includes(q) || it.english.toLowerCase().includes(q));
  document.getElementById("list").innerHTML = res.map(it => `<p><b>${it.vaiphei}</b>: ${it.english}</p>`).join("");
}

function addWord() {
  const v = prompt("Vaiphei word:");
  const e = prompt("English meaning:");
  if (!v || !e) return;
  dict.push({vaiphei:v, english:e});
  localStorage.setItem("tapkuang-dict", JSON.stringify(dict));
  search("");
}

render();
