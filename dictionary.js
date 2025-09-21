let v2eDictionary = [
  { word: "Sial", meaning: "Apple" },
  { word: "Thu", meaning: "Book" },
  { word: "Kizu", meaning: "Cat" },
  { word: "Uithu", meaning: "Dog" }
];

let e2vDictionary = [
  { word: "Apple", meaning: "Sial" },
  { word: "Book", meaning: "Thu" },
  { word: "Cat", meaning: "Kizu" },
  { word: "Dog", meaning: "Uithu" }
];

function sortDictionary(dict) {
  return dict.sort((a, b) => a.word.localeCompare(b.word));
}
