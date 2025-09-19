let currentPage = { e2v: 0, v2e: 0 };
const pageSize = 20; // about 20 entries per A4 page

function openBook(book) {
  document.getElementById("cover").style.display = "none";
  document.getElementById("author-note").style.display = "none";
  document.getElementById(book).style.display = "block";
  showPage(book);
}

function closeBook() {
  document.getElementById("cover").style.display = "flex";
  document.getElementById("author-note").style.display = "block";
  document.getElementById("e2v").style.display = "none";
  document.getElementById("v2e").style.display = "none";
}

function showPage(book) {
  let pageIndex = currentPage[book];
  let content = (book === "e2v") ? e2vPages : v2ePages;

  const totalPages = Math.ceil(content.length / pageSize);
  if (pageIndex >= totalPages) pageIndex = totalPages - 1;
  if (pageIndex < 0) pageIndex = 0;
  currentPage[book] = pageIndex;

  const start = pageIndex * pageSize;
  const end = start + pageSize;
  const pageWords = content.slice(start, end);

  document.getElementById(book + "Page").innerHTML = pageWords
    .map((word, idx) =>
      `<div class="word-entry">
         ${word}
         <span class="admin-tools">
           <button onclick="editWord('${book}', ${start + idx})">Edit</button>
           <button onclick="deleteWord('${book}', ${start + idx})">Delete</button>
         </span>
       </div>`)
    .join("");

  document.getElementById("page-info-" + book).textContent =
    `Page ${pageIndex + 1} / ${totalPages}`;
}

function nextPage(book) {
  currentPage[book]++;
  showPage(book);
}

function prevPage(book) {
  currentPage[book]--;
  showPage(book);
}

function deleteWord(book, index) {
  if (book === "e2v") e2vPages.splice(index, 1);
  else v2ePages.splice(index, 1);
  showPage(book); // stay on same page
}

function editWord(book, index) {
  let content = (book === "e2v") ? e2vPages : v2ePages;
  let newWord = prompt("Edit entry:", content[index]);
  if (newWord) {
    content[index] = newWord;
    showPage(book);
  }
}
