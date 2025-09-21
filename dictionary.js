// Initial dictionary data
let v2eDictionary = [
  { word: "A", meaning: "First letter of alphabet" },
  { word: "Aw", meaning: "Respectful prefix" },
  { word: "Bawl", meaning: "To sing" },
  { word: "Chap", meaning: "Quick" }
];

let e2vDictionary = [
  { word: "Apple", meaning: "Thinghat" },
  { word: "Book", meaning: "Thumal" },
  { word: "Cat", meaning: "Kuli" }
];

// Sort function
function sortDictionary(dict) {
  return dict.sort((a, b) => a.word.localeCompare(b.word));
}

v2eDictionary = sortDictionary(v2eDictionary);
e2vDictionary = sortDictionary(e2vDictionary);
