import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Search, Book, FileSpreadsheet, PlusCircle, Settings, LogIn, LogOut, Trash2 } from "lucide-react";

export default function DictionaryApp() {
  // --- App state ---
  const [activePage, setActivePage] = useState("home");
  const [dict, setDict] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tapkuang-dict") || "[]"); } catch { return []; }
  });
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [newWord, setNewWord] = useState({ vaiphei: "", english: "", example: "" });
  const [newPassword, setNewPassword] = useState("");
  const PAGE_SIZE = 20;

  // Password storage
  const savedPass = localStorage.getItem("tapkuang-pass") || "1234";

  // Custom Vaiphei alphabet order
  const alphabet = ["ALL","A","AW","B","CH","D","E","F","G","NG","H","I","J","K","L","M","N","O","P","R","S","T","U","V","Z"];

  // Menu
  const menuItems = [
    { key: "search", label: "Hawlna", subtitle: "Search", icon: <Search size={20} /> },
    { key: "dictionary", label: "Thumalhilchian", subtitle: "Dictionary", icon: <Book size={20} /> },
    { key: "import", label: "Excel laklutna", subtitle: "Import Excel File", icon: <FileSpreadsheet size={20} /> },
    { key: "add", label: "Thumal belapna", subtitle: "Add Word", icon: <PlusCircle size={20} /> },
    { key: "settings", label: "Munpi", subtitle: "Settings", icon: <Settings size={20} /> },
    { key: "login", label: "Lutna", subtitle: "Login", icon: <LogIn size={20} /> },
    { key: "logout", label: "Pawtna", subtitle: "Logout", icon: <LogOut size={20} /> }
  ];

  // --- Helpers ---
  function normalize(s) { return (s || "").toString().trim(); }
  function firstTokenVA(word) {
    if (!word) return "";
    const W = word.toUpperCase();
    if (W.startsWith("AW")) return "AW";
    if (W.startsWith("CH")) return "CH";
    if (W.startsWith("NG")) return "NG";
    return W[0];
  }
  const vaipheiOrder = new Map(alphabet.map((l, i) => [l, i]));
  function compareVaiphei(a, b) {
    const A = firstTokenVA(a.vaiphei);
    const B = firstTokenVA(b.vaiphei);
    const aIdx = vaipheiOrder.get(A) ?? 999;
    const bIdx = vaipheiOrder.get(B) ?? 999;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.vaiphei.localeCompare(b.vaiphei);
  }

  // --- Filtering, search, paging ---
  const filtered = dict
    .filter(it => {
      const q = query.toLowerCase();
      const matchesQ = !q || it.vaiphei.toLowerCase().includes(q) || it.english.toLowerCase().includes(q);
      const matchesLetter = letter === "ALL" || firstTokenVA(it.vaiphei) === letter;
      return matchesQ && matchesLetter;
    })
    .sort(compareVaiphei);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(page, 0), totalPages - 1);
  const slice = filtered.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  // --- CRUD ---
  function addWord() {
    if (!newWord.vaiphei || !newWord.english) return alert("Fill Vaiphei & English");
    const next = [...dict, newWord].sort(compareVaiphei);
    setDict(next);
    localStorage.setItem("tapkuang-dict", JSON.stringify(next));
    setNewWord({ vaiphei: "", english: "", example: "" });
    alert("Word added!");
  }
  function deleteWord(index) {
    if (!confirm("Delete this word?")) return;
    const next = dict.filter((_, i) => i !== index);
    setDict(next);
    localStorage.setItem("tapkuang-dict", JSON.stringify(next));
  }

  function changePassword() {
    if (!newPassword) return alert("Enter new password");
    localStorage.setItem("tapkuang-pass", newPassword);
    setNewPassword("");
    alert("Password changed!");
  }

  // Dictionary list UI
  function DictionaryList() {
    return (
      <div className="space-y-3">
        {slice.length === 0 && <p>No entries.</p>}
        {slice.map((it, i) => (
          <div key={`${it.vaiphei}-${i}`} className="border rounded-xl p-3 bg-white/80 flex justify-between items-center">
            <div>
              <div className="font-semibold">{it.vaiphei}</div>
              <div className="text-sm">{it.english}</div>
              {it.example && <div className="text-xs text-gray-500">{it.example}</div>}
            </div>
            {isAdmin && (
              <Button variant="outline" className="border-red-500 text-red-600 rounded-xl" onClick={()=>deleteWord(dict.indexOf(it))}>
                <Trash2 size={16}/>
              </Button>
            )}
          </div>
        ))}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" disabled={pageSafe===0} onClick={()=>setPage(Math.max(0,pageSafe-1))}>←</Button>
            <span>Page {pageSafe+1} / {totalPages}</span>
            <Button variant="outline" disabled={pageSafe>=totalPages-1} onClick={()=>setPage(Math.min(totalPages-1,pageSafe+1))}>→</Button>
          </div>
        )}
      </div>
    );
  }

  function AlphabetBar() {
    return (
      <div className="flex flex-wrap gap-2">
        {alphabet.map(l => (
          <Button key={l} variant="outline" onClick={() => { setLetter(l); setPage(0); }}
            className={letter===l ? "bg-yellow-200" : "bg-white"}>{l}</Button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 p-6">
      <Card className="max-w-xl mx-auto shadow-2xl rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-yellow-800">Tapkuang – Vaiphei Dictionary</h1>
            <Menu size={28} />
          </div>

          {/* Menu */}
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Button key={item.key} variant="outline"
                className="flex flex-col items-center justify-center h-20"
                onClick={() => setActivePage(item.key)}>
                {item.icon}
                <span className="font-semibold">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="mt-8 p-4 border rounded-xl bg-white shadow-inner">
            {activePage === "search" && (
              <div>
                <input className="w-full border rounded-xl p-3 mb-3"
                  placeholder="Search…" value={query}
                  onChange={(e)=>{ setQuery(e.target.value); setPage(0); setActivePage("dictionary"); }}/>
                <AlphabetBar/>
                <DictionaryList/>
              </div>
            )}
            {activePage === "dictionary" && (
              <div>
                <input className="w-full border rounded-xl p-3 mb-3"
                  placeholder="Search…" value={query}
                  onChange={(e)=>{ setQuery(e.target.value); setPage(0); }}/>
                <AlphabetBar/>
                <DictionaryList/>
              </div>
            )}
            {activePage === "add" && isAdmin && (
              <div className="space-y-3">
                <input placeholder="Vaiphei" className="w-full border p-2 rounded" value={newWord.vaiphei} onChange={e=>setNewWord({...newWord, vaiphei:e.target.value})}/>
                <input placeholder="English" className="w-full border p-2 rounded" value={newWord.english} onChange={e=>setNewWord({...newWord, english:e.target.value})}/>
                <input placeholder="Example" className="w-full border p-2 rounded" value={newWord.example} onChange={e=>setNewWord({...newWord, example:e.target.value})}/>
                <Button onClick={addWord}>Add Word</Button>
              </div>
            )}
            {activePage === "add" && !isAdmin && <p>⚠️ Admin only. Please login.</p>}

            {activePage === "settings" && (
              <div className="space-y-3">
                <p>Total entries: {dict.length}</p>
                {isAdmin && (
                  <>
                    <input placeholder="New password" className="w-full border p-2 rounded" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
                    <Button onClick={changePassword}>Change Password</Button>
                  </>
                )}
              </div>
            )}
            {activePage === "login" && (
              <div className="space-y-3">
                <input type="password" placeholder="Password" className="w-full border p-2 rounded" value={password} onChange={e=>setPassword(e.target.value)}/>
                <Button onClick={()=>{ if(password===savedPass){ setIsAdmin(true); setActivePage("home"); alert("Logged in!"); } else alert("Wrong password"); }}>Login</Button>
              </div>
            )}
            {activePage === "logout" && (
              <Button onClick={()=>{ setIsAdmin(false); alert("Logged out"); }}>Logout</Button>
            )}
            {activePage === "home" && <p className="text-center">👋 Welcome to Vaiphei Dictionary</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
