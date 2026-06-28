import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Search, Plus, BarChart2, Library, 
  ChevronRight, ChevronLeft, ArrowLeft, Edit3, MessageSquare, 
  Sparkles, BookOpenCheck, Loader2, Send, RefreshCw, Filter, Star, PieChart,
  Book, CheckCircle, XCircle, Clock
} from 'lucide-react';

import { Show, SignInButton, SignUpButton, UserButton, ClerkLoading } from "@clerk/react";

import logoImg from './assets/logo.png';

import gsap from "gsap";


// --- API Helpers ---
const callGemini = async (prompt) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return "**Error:** API key is missing! Make sure your `.env` file exists and you restarted the server.";
  }

  try {
    // Updated to the stable gemini-2.5-flash model
    // Appended "-latest" to the model name
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!response.ok) {
       const errorData = await response.json();
       console.error("API Error Details:", errorData);
       return `**Error from Google:** ${errorData.error?.message || "Failed to fetch from AI. Check the browser console."}`;
    }
    
    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error("Fetch caught error:", e);
    return `**Network Error:** ${e.message}. Please check your browser console for more details.`;
  }
  
};


// --- Main App Component ---
export default function App() {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('library'); // library, metrics
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// --- Fetch Database on Startup ---
useEffect(() => {
    const loadLibrary = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const response = await fetch(`${API_URL}/api/books`);
        if (!response.ok) throw new Error('Failed to fetch from database');

        const databaseBooks = await response.json();
        
        // NEW: Translate MongoDB's "_id" into React's "id"
        const normalizedBooks = databaseBooks.map(book => ({
          ...book,
          id: book._id
        }));
        
        setBooks(normalizedBooks);
        
      } catch (error) {
        console.error("Error loading library:", error);
      }
    };
    loadLibrary();
  }, []);

  const handleUpdateBook = async (id, updates) => {
    // 1. Instantly update the UI so it feels snappy
    setBooks(books.map(b => b.id === id ? { ...b, ...updates } : b));
    if (selectedBook && selectedBook.id === id) {
      setSelectedBook({ ...selectedBook, ...updates });
    }

    // 2. Secretly save the changes to the database
    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes to the database');
      }
    } catch (error) {
      console.error("Error updating book:", error);
      console.warn("Changes may not have saved to the database.");
    }
  };

  const handleAddBook = async (newBook) => {
    // 1. Prevent Duplicates
    const isDuplicate = books.some(b => b.title.toLowerCase() === newBook.title.toLowerCase());
    if (isDuplicate) {
      alert(`You already have "${newBook.title}" in your library!`);
      return false; // Tell the modal it failed
    }

    try {
      const response = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });

      if (!response.ok) throw new Error('Failed to save book to the database');

      const savedBook = await response.json();
      // NEW: Translate the new book's ID too!
      savedBook.id = savedBook._id; 
      setBooks([...books, savedBook]);
      
      // 2. Success Notification
      alert(`🎉 "${savedBook.title}" was successfully added to your library!`);
      return true; // Tell the modal it succeeded!
      
    } catch (error) {
      console.error("Error adding book:", error);
      alert("Failed to add book. Make sure your backend server is running!");
      return false;
    }
  };

  // 3. NEW: Delete Function
const handleDeleteBook = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this book?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete from database');

      // 🛡️ BULLETPROOF STATE UPDATES
      // Using 'prevBooks' guarantees React looks at the live, current list of books
      setBooks(prevBooks => prevBooks.filter(b => (b.id !== id) && (b._id !== id)));
      
      // Force the screen back to the library view instantly
      setSelectedBook(null); 
      
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Failed to delete the book.");
    }
  };

  return (
    // Warmer cream background for the whole app
    <div className="min-h-screen bg-[#FCF9F2] text-stone-800 font-sans selection:bg-orange-200">
      <Show when="signed-in">
      {/* Softer, warmer Navigation Bar */}
      <nav className="bg-[#FCF9F2]/90 backdrop-blur-md border-b border-orange-900/10 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
          
          {/* THE LOGO - Massively increased size and removed rigid padding */}
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-transform hover:scale-105 duration-300 origin-left"
            onClick={() => { setActiveTab('library'); setSelectedBook(null); }}
          >
            <img 
              src={logoImg} 
              alt="BookNook" 
              className="h-20 md:h-28 w-auto object-contain drop-shadow-sm" 
            />
          </div>
          
          {/* Cozy Pill Tabs */}
          <div className="flex items-center gap-1 md:gap-2 bg-[#F2E8DC] p-1.5 rounded-full shadow-inner border border-orange-900/5">
            <button 
              onClick={() => { setActiveTab('library'); setSelectedBook(null); }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'library' && !selectedBook ? 'bg-white shadow-sm text-[#C05D22]' : 'text-stone-500 hover:text-[#C05D22]'}`}
            >
              Library
            </button>
            <button 
              onClick={() => { setActiveTab('metrics'); setSelectedBook(null); }}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'metrics' && !selectedBook ? 'bg-white shadow-sm text-[#C05D22]' : 'text-stone-500 hover:text-[#C05D22]'}`}
            >
              Metrics
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Terracotta Action Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#C05D22] hover:bg-[#A34B18] text-white p-2.5 md:px-6 md:py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-bold"
            >
              <Plus size={18} strokeWidth={3} /> <span className="hidden md:inline text-sm">Add Book</span>
            </button>
            
          </div>

        </div>
      </nav>
    </Show>

      {/* Main Content */}
      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 pb-24">
        
        <ClerkLoading>
          <div className="flex flex-col items-center justify-center h-[60vh] text-stone-500 animate-in fade-in">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-lg">Clerk is attempting to connect...</p>
          </div>
        </ClerkLoading>
        
        {/* --- What logged-out users see (The "Login Page") --- */}
        {/* --- What logged-out users see (The Landing Page) --- */}
        {/* --- What logged-out users see (The Landing Page) --- */}
        <Show when="signed-out">
          <AnimatedIntro logoImg={logoImg} />
        </Show>

        {/* --- What logged-in users see (The Actual App) --- */}
        <Show when="signed-in">
          {selectedBook ? (
            <BookDetailView 
              book={selectedBook} 
              onUpdate={(updates) => handleUpdateBook(selectedBook.id, updates)}
              onBack={() => setSelectedBook(null)}
              onDelete={handleDeleteBook} // <--- ADD THIS LINE
            />
          ) : activeTab === 'library' ? (
            <LibraryView books={books} onSelect={setSelectedBook} onAddBook={handleAddBook} />
          ) : (
            <MetricsView books={books} />
          )}
        </Show>

      </main>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onAdd={handleAddBook} />}
    </div>
  );
}

// --- Library View (Shelves) ---
function LibraryView({ books, onSelect, onAddBook }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [suggestionsType, setSuggestionsType] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState('all');

  const shelf1Ref = useRef(null);
  const shelf2Ref = useRef(null);

  const scrollShelf = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 350; // Distance to scroll per click
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const readingBooks = books.filter(b => b.status === 'reading');
  
  let otherBooks = books.filter(b => b.status !== 'reading');
  if (collectionFilter === 'read') {
    otherBooks = otherBooks.filter(b => b.status === 'read');
  } else if (collectionFilter === 'want_to_read') {
    otherBooks = otherBooks.filter(b => b.status === 'want_to_read');
  } else if (collectionFilter === 'dnf') {
    otherBooks = otherBooks.filter(b => b.status === 'dnf');
  }

  const handleGetSuggestions = async (type) => {
    setLoadingType(type);
    setSuggestionsType(type);
    setSuggestions([]);
    
    const allExistingTitles = books.map(b => `"${b.title}"`).join(', ');
    
    let prompt = "";
    if (type === 'history') {
       const historyTitles = books.map(b => `"${b.title}" by ${b.author}`);
       prompt = `I have these books in my library: ${historyTitles.join(', ')}. Recommend 3 specific new books I might enjoy based on this. DO NOT recommend any of the following books: ${allExistingTitles}. Ensure variety and different picks each time (Seed: ${Math.random()}). Return ONLY a JSON array of objects with keys: "title", "author", "totalPages", "genre". Do not use markdown blocks like \`\`\`json.`;
    } else {
       prompt = `Recommend 3 highly popular, must-read classic or modern best-selling books. DO NOT recommend any of the following books: ${allExistingTitles}. Ensure variety and different picks each time (Seed: ${Math.random()}). Return ONLY a JSON array of objects with keys: "title", "author", "totalPages", "genre". Do not use markdown blocks like \`\`\`json.`;
    }

    try {
      const rawRes = await callGemini(prompt);
      
      // 🛡️ THE NEW SAFETY CHECK 🛡️
      // If the API failed and returned our error string, stop immediately!
      if (rawRes.includes('**Error')) {
        console.error("AI API Issue:", rawRes);
        alert("The AI recommendation engine is currently busy. Please try again in a few moments!");
        setLoadingType(null);
        return; // Exits the function before trying to parse bad data
      }

      const cleanRes = rawRes.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanRes);
      
      const safeSuggestions = Array.isArray(parsed) 
        ? parsed.filter(s => !books.some(b => b.title.toLowerCase() === s.title.toLowerCase()))
        : [];
        
      setSuggestions(safeSuggestions);
    } catch (e) {
      console.error("Failed to parse suggestions", e);
      alert("Oops! The AI sent back data we couldn't read. Let's try that again.");
    }
    
    setLoadingType(null);
  };

  const renderSuggestions = () => (
    <div className="mt-2 bg-white border border-stone-200 rounded-xl p-4 shadow-md w-full max-w-md z-30 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-serif font-bold text-amber-900 flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-amber-500" /> 
          {loadingType === 'history' ? 'Suggested based on your history' : 'Popular Books'}
        </h4>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleGetSuggestions(suggestionsType)} 
            className="text-stone-400 hover:text-amber-600 transition-colors p-1 rounded-md hover:bg-stone-100" 
            title="Refresh Suggestions"
          >
            <RefreshCw size={14} className={loadingType ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => { setSuggestions([]); setSuggestionsType(null); }} 
            className="text-stone-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-stone-100"
            title="Close"
          >
            <Plus size={16} className="rotate-45" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => (
           <div key={i} className="flex items-center justify-between bg-[#FDFBF7] p-2.5 rounded-lg border border-stone-100 group hover:border-amber-200 transition-colors">
             <div className="pr-4">
               <p className="font-bold text-sm text-stone-800">{s.title}</p>
               <p className="text-xs text-stone-500">{s.author}</p>
             </div>
             <button 
               onClick={() => {
                 const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-700', 'bg-purple-900', 'bg-slate-800', 'bg-stone-800'];
                 onAddBook({
                   title: s.title,
                   author: s.author,
                   genre: s.genre || 'Fiction',
                   totalPages: s.totalPages || 300,
                   coverColor: colors[Math.floor(Math.random() * colors.length)],
                 });
                 setSuggestions(suggestions.filter(item => item !== s));
                 if (suggestions.length === 1) setSuggestionsType(null);
               }}
               className="p-1.5 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
               title="Add to Collection"
             >
               <Plus size={16} />
             </button>
           </div>
        ))}
      </div>
    </div>
  );

  const renderBookSpine = (book) => {
    // Dynamic height based on pages (capped to look nice)
    const height = Math.max(120, Math.min(220, 100 + (book.totalPages * 0.15))); 
    // Dynamic width for a bit of variation
    const width = Math.max(35, Math.min(55, 30 + (book.totalPages * 0.05)));

    return (
      <div 
        key={book.id}
        onClick={() => onSelect(book)}
        // CHANGED: Added 'group/spine' so the tooltip only listens to THIS book
        className={`${book.coverColor} rounded-sm shadow-[2px_0_5px_rgba(0,0,0,0.3)] cursor-pointer hover:-translate-y-3 transition-transform duration-300 flex items-center justify-center relative group/spine`}
        style={{ width: `${width}px`, height: `${height}px`, flexShrink: 0 }}
      >
        
        {/* Pages effect */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-sm"></div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-sm"></div>

        {/* Tooltip replacing the clipped spine text */}
        {/* CHANGED: group-hover/spine, centered position, and slightly narrower width */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/spine:opacity-100 transition-opacity duration-200 w-48 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
          <p className="font-bold text-sm truncate mb-1">{book.title}</p>
          <p className="text-stone-300 truncate mb-2">{book.author}</p>
          <div className="w-full bg-stone-700 rounded-full h-1.5 mb-1 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(100, (book.currentPage / book.totalPages) * 100)}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>{book.currentPage} / {book.totalPages}</span>
            <span>{Math.round((book.currentPage / book.totalPages) * 100) || 0}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-32 mt-12 mb-20 animate-in fade-in duration-500">
      {/* Shelf 1: Currently Reading */}
      <div className="relative group">
        <div className="flex items-center justify-between mb-4 pr-4 relative z-20">
          <div className="flex items-center gap-3">
            <BookOpenCheck size={32} className="text-[#C05D22] drop-shadow-sm shrink-0" />
            <h2 className="font-['Noto_Serif'] italic font-bold text-4xl md:text-5xl text-[#C05D22] tracking-tight drop-shadow-sm">
              Currently Reading
            </h2>
          </div>
        </div>
        
        {readingBooks.length > 0 && (
          <>
            <button 
              onClick={() => scrollShelf(shelf1Ref, 'left')}
              className="absolute left-0 bottom-16 md:bottom-24 z-40 p-2 bg-white/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => scrollShelf(shelf1Ref, 'right')}
              className="absolute right-0 bottom-16 md:bottom-24 z-30 p-2 bg-white/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

          {/* Notice we changed -mt-24 to -mt-32 and min-h-[320px] to min-h-[280px] */}
        <div ref={shelf1Ref} className={`flex items-end gap-2 px-20 z-30 relative overflow-x-auto flex-nowrap scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${readingBooks.length > 0 ? 'pt-32 -mt-32 min-h-[280px]' : 'min-h-[240px]'}`}>
          {readingBooks.length > 0 ? readingBooks.map(renderBookSpine) : (
            <div className="flex flex-col items-start gap-3 mb-8 w-full max-w-md">
              <div className="text-stone-400 italic">No books currently being read.</div>
              {books.length > 0 && suggestionsType !== 'history' && !loadingType && (
                 <button 
                   onClick={() => handleGetSuggestions('history')}
                   className="flex items-center gap-2 text-sm bg-white border border-amber-200 text-amber-900 px-4 py-2 rounded-full hover:bg-amber-50 transition-colors shadow-sm"
                 >
                   <Sparkles size={16} className="text-amber-500" /> Explore books based on history
                 </button>
              )}
              {loadingType === 'history' && (
                <div className="flex items-center gap-2 text-sm text-amber-700 mt-2 bg-amber-50 px-4 py-2 rounded-full">
                  <Loader2 className="animate-spin" size={16} /> Finding matches...
                </div>
              )}
              {suggestionsType === 'history' && suggestions.length > 0 && renderSuggestions()}
            </div>
          )}
        </div>
        <ShelfWave1 />
      </div>

      {/* Shelf 2: Up Next & Finished */}
      <div className="relative group">
        {/* 1. REMOVED 'relative' and 'z-20' from this main wrapper so its children can break out */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pr-4 items-start">
          
          {/* 2. ADDED 'relative z-20' here so the title stays behind the tooltips */}
          <div className="flex items-center gap-3 relative z-20">
            <Library size={32} className="text-[#C05D22] drop-shadow-sm shrink-0" />
            <h2 className="font-['Noto_Serif'] italic font-bold text-4xl md:text-5xl text-[#C05D22] tracking-tight drop-shadow-sm">
              The Collection
            </h2>
          </div>
          
          {/* 3. CHANGED to 'z-40' so the dropdown punches through the invisible bookshelf padding */}
          <div className="flex items-center gap-2 text-sm bg-[#FCF9F2]/80 border border-orange-900/10 rounded-full px-3 py-1.5 shadow-sm backdrop-blur-sm z-40 relative">
            <Filter size={14} className="text-stone-500" />
            <select 
              value={collectionFilter} 
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="bg-transparent border-none text-stone-700 font-medium focus:outline-none cursor-pointer text-sm outline-none"
            >
              <option value="all">All Books</option>
              <option value="read">Finished</option>
              <option value="want_to_read">Unread</option>
              <option value="dnf">Did Not Finish (DNF)</option>
            </select>
          </div>
        </div>

        {otherBooks.length > 0 && (
          <>
            <button 
              onClick={() => scrollShelf(shelf2Ref, 'left')}
              className="absolute left-0 bottom-16 md:bottom-24 z-40 p-2 bg-white/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 hover:scale-110"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => scrollShelf(shelf2Ref, 'right')}
              className="absolute right-0 bottom-16 md:bottom-24 z-40 p-2 bg-white/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 hover:scale-110"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Changed -mt-24 to -mt-32 and min-h-[320px] to min-h-[280px] */}
        <div ref={shelf2Ref} className={`flex items-end gap-2 px-20 z-30 relative overflow-x-auto flex-nowrap scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${otherBooks.length > 0 ? 'pt-32 -mt-32 min-h-[280px]' : 'min-h-[240px]'}`}>
           {otherBooks.length > 0 ? otherBooks.map(renderBookSpine) : (
            <div className="flex flex-col items-start gap-3 mb-8 w-full max-w-md">
              <div className="text-stone-400 italic">No books in this view.</div>
              {suggestionsType !== 'popular' && !loadingType && collectionFilter === 'all' && (
                <button 
                  onClick={() => handleGetSuggestions('popular')}
                  className="flex items-center gap-2 text-sm bg-white border border-amber-200 text-amber-900 px-4 py-2 rounded-full hover:bg-amber-50 transition-colors shadow-sm"
                >
                  <Sparkles size={16} className="text-amber-500" /> Discover popular books
                </button>
              )}
              {loadingType === 'popular' && (
                <div className="flex items-center gap-2 text-sm text-amber-700 mt-2 bg-amber-50 px-4 py-2 rounded-full">
                  <Loader2 className="animate-spin" size={16} /> Fetching recommendations...
                </div>
              )}
              {suggestionsType === 'popular' && suggestions.length > 0 && renderSuggestions()}
            </div>
          )}
        </div>
        <ShelfWave2 />
      </div>
    </div>
  );
}

// --- Metrics / Dashboard View ---
function MetricsView({ books }) {
  const readBooks = books.filter(b => b.status === 'read');
  const dnfBooks = books.filter(b => b.status === 'dnf');
  
  const totalRead = readBooks.length;
  const totalPagesRead = readBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0) 
                       + books.filter(b => b.status === 'reading').reduce((sum, b) => sum + (b.currentPage || 0), 0);
  
  const avgRating = readBooks.length > 0 
    ? (readBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / readBooks.length).toFixed(1) 
    : 0;
  
  const avgPages = readBooks.length > 0 
    ? Math.round(readBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0) / readBooks.length) 
    : 0;

  // Pie Chart Data Calculation
  const booksToCount = books.filter(b => b.status === 'read' || b.status === 'reading');
  const genreCounts = {};
  booksToCount.forEach(b => {
    const g = b.genre || 'Unknown';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const totalGenreBooks = booksToCount.length;
  
  // High contrast palette
  const PIE_COLORS = ['#d97706', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#475569', '#ea580c', '#65a30d', '#0d9488', '#db2777'];

  let currentPercent = 0;
  const gradientStops = totalGenreBooks > 0 ? sortedGenres.map((entry, index) => {
    const percent = (entry[1] / totalGenreBooks) * 100;
    const start = currentPercent;
    const end = currentPercent + percent;
    currentPercent = end;
    return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${end}%`;
  }).join(', ') : '';

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="mb-4 flex items-center gap-3">
        <BarChart2 size={36} className="text-[#C05D22] drop-shadow-sm shrink-0" />
        <h2 className="font-['Noto_Serif'] italic font-bold text-4xl md:text-5xl text-[#C05D22] tracking-tight drop-shadow-sm">
          Your Year in Books
        </h2>
      </div>
      
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-center">
          <span className="text-stone-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500"/> Finished
          </span>
          <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{totalRead}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-center">
          <span className="text-stone-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500"/> Pages Read
          </span>
          <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{totalPagesRead.toLocaleString()}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-center">
          <span className="text-stone-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <Star size={16} className="text-amber-400 fill-amber-400"/> Avg Rating
          </span>
          <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{avgRating}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col justify-center">
          <span className="text-stone-500 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <XCircle size={16} className="text-red-400"/> Abandoned
          </span>
          <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{dnfBooks.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Genre Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 md:col-span-2">
          <h3 className="text-lg font-serif font-semibold text-stone-800 mb-6 flex items-center gap-2">
            <PieChart className="text-amber-700" size={20} /> Top Genres Read
          </h3>
          
          {totalGenreBooks > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-8 px-2">
              <div 
                className="w-48 h-48 rounded-full shadow-inner border-4 border-white flex-shrink-0"
                style={{ 
                  background: `conic-gradient(${gradientStops})`, 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 2px 4px rgba(0,0,0,0.1)' 
                }}
              />
              <div className="flex-1 w-full flex flex-col gap-3">
                {sortedGenres.map((entry, index) => (
                   <div key={entry[0]} className="flex items-center gap-3 bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-100">
                     <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                     <span className="font-bold text-stone-700 flex-1 truncate">{entry[0]}</span>
                     <span className="text-stone-500 text-sm font-bold bg-white px-2.5 py-1 rounded-md shadow-sm border border-stone-200">
                       {Math.round((entry[1] / totalGenreBooks) * 100)}%
                     </span>
                   </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-stone-400 italic">
              Read some books to see your genre breakdown!
            </div>
          )}
        </div>

        {/* Quick Insights */}
        <div className="flex flex-col gap-6">
           <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex-1 flex flex-col justify-center">
            <span className="text-amber-800 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={16}/> Avg. Book Length
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{avgPages}</span>
              <span className="text-stone-500 font-medium">pages</span>
            </div>
            <p className="text-sm text-stone-600 mt-2">The average length of books you've completed.</p>
          </div>
          
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex-1 flex flex-col justify-center">
            <span className="text-stone-500 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Book size={16}/> Total Books in Library
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-4xl text-stone-800 leading-tight">{books.length}</span>
              <span className="text-stone-500 font-medium">books</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Book Detail View ---
function BookDetailView({ book, onUpdate, onBack, onDelete }) {
  const [activeSubTab, setActiveSubTab] = useState('progress'); // progress, notes, ai
  const [coverUrl, setCoverUrl] = useState(book.coverUrl);
  const [ratingInput, setRatingInput] = useState(book.rating ? book.rating.toString() : '');

  // 1. THE SAFETY LOCK: Remembers if we've already checked OpenLibrary
  const hasAttemptedFetch = useRef(false);

  // Safely calculate math even if the input is temporarily empty
  const safeCurrentPage = parseInt(book.currentPage, 10) || 0;
  const progressPercent = Math.round((safeCurrentPage / book.totalPages) * 100) || 0;
  const pagesLeft = book.totalPages - safeCurrentPage;

  useEffect(() => {
    // 2. CHECK THE LOCK: Only run if we don't have a cover AND haven't tried yet
    if (!book.coverUrl && !hasAttemptedFetch.current) {
      hasAttemptedFetch.current = true; // Instantly lock the door!

      const fetchCover = async () => {
        try {
          const query = encodeURIComponent(`${book.title} ${book.author}`);
          const res = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=1`);
          const data = await res.json();
          const doc = data.docs?.[0];
          
          if (doc && doc.cover_i) {
            const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            setCoverUrl(url);
            onUpdate({ coverUrl: url }); 
          }
        } catch (e) {
          console.error("Failed to fetch cover", e);
        }
      };
      fetchCover();
    }
  }, [book.title, book.author, book.coverUrl]);

  const handleRatingChange = (val) => {
    setRatingInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 5) {
      onUpdate({ rating: num });
    }
  };

  const handlePageUpdate = (val) => {
    if (val === '') {
      onUpdate({ currentPage: '' });
      return;
    }
    
    let newPage = parseInt(val, 10);
    if (isNaN(newPage)) return; 
    
    newPage = Math.min(book.totalPages, Math.max(0, newPage));
    
    const updates = { currentPage: newPage };
    
    if (newPage === book.totalPages && book.status !== 'read') {
      updates.status = 'read'; 
    } else if (newPage > 0 && newPage < book.totalPages && book.status === 'want_to_read') {
      updates.status = 'reading'; 
    }
    
    onUpdate(updates);
  };

  return (
    <div className="max-w-4xl mx-auto mt-2 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-amber-700 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back to Library
        </button>
        
        <button 
          onClick={() => {
            console.log("0. Button was physically clicked!"); 
            onDelete(book.id || book._id); 
          }}
          className="flex items-center gap-2 text-red-400 hover:text-red-700 transition-colors font-bold text-sm px-3 py-1.5 rounded-full hover:bg-red-50"
        >
          <XCircle size={16} /> Delete Book
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-8 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">        
        <div className={`w-48 h-72 ${book.coverColor} rounded-md shadow-2xl flex-shrink-0 flex items-center justify-center p-4 relative overflow-hidden`}>
          {coverUrl ? (
            <img src={coverUrl} alt={`Cover of ${book.title}`} className="absolute inset-0 w-full h-full object-cover z-20" />
          ) : (
            <>
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/handmade-paper.png')] mix-blend-overlay"></div>
              <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/20"></div>
              <h2 className="text-white text-xl font-serif font-bold text-center z-10 leading-snug break-words drop-shadow-md">
                {book.title}
              </h2>
            </>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2 leading-tight">{book.title}</h1>
              <p className="text-xl text-stone-600 font-serif italic mb-4">{book.author}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <select 
              value={book.status}
              onChange={(e) => onUpdate({ status: e.target.value })}
              className="bg-stone-100 border border-stone-200 text-stone-800 text-sm rounded-full px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="read">Finished</option>
              <option value="dnf">Did Not Finish (DNF)</option>
            </select>
            
            <span className="text-stone-500 text-sm font-medium px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
              {book.totalPages} Pages total
            </span>
            {book.genre && (
              <span className="text-stone-500 text-sm font-medium px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                {book.genre}
              </span>
            )}
          </div>

          {(book.status === 'read' || book.status === 'dnf') && (
            <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100 inline-flex w-max">
              <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">Your Rating:</span>
              <StarRating exactRating={book.rating || 0} />
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                max="5" 
                value={ratingInput}
                onChange={(e) => handleRatingChange(e.target.value)}
                className="w-20 bg-white border border-stone-200 rounded-lg p-2 text-center font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex border-b border-stone-200 mb-6">
        {[
          { id: 'progress', icon: <BookOpen size={18}/>, label: 'Progress' },
          { id: 'notes', icon: <Edit3 size={18}/>, label: 'Notes' },
          { id: 'ai', icon: <Sparkles size={18}/>, label: 'AI Tools' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeSubTab === tab.id 
                ? 'border-amber-600 text-amber-800' 
                : 'border-transparent text-stone-400 hover:text-stone-600 hover:border-stone-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100 min-h-[400px]">
        {activeSubTab === 'progress' && (
          <div className="max-w-xl animate-in fade-in">
            <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">Update Current Page</h3>
            
            <div className="flex items-center gap-4 mb-8">
               <input 
                 type="number" 
                 value={book.currentPage || ''} // 3. ADDED FALLBACK HERE
                 onChange={(e) => handlePageUpdate(e.target.value)}
                 className="w-24 text-3xl font-serif font-bold text-stone-800 border-b-2 border-amber-200 focus:border-amber-600 focus:outline-none py-1 text-center bg-transparent"
               />
               <span className="text-xl text-stone-400 font-serif">of {book.totalPages} pages</span>
            </div>

            <div className="relative mb-6 h-6 flex items-center group mt-8">
              <div className="absolute w-full h-4 bg-stone-100 rounded-full shadow-inner pointer-events-none"></div>
              <div 
                className="absolute left-0 h-4 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full pointer-events-none transition-all duration-300 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
              <div 
                className="absolute h-6 w-6 bg-white border-4 border-amber-600 rounded-full shadow-md pointer-events-none group-hover:scale-110 transition-transform z-0"
                style={{ 
                  left: `calc(${progressPercent}% - 12px)` 
                }}
              ></div>
              <input 
                type="range" 
                min="0" 
                max={book.totalPages} 
                value={safeCurrentPage}
                onChange={(e) => handlePageUpdate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="flex justify-between text-sm font-bold text-stone-500 mb-8">
              <span>{progressPercent}% Complete</span>
              <span>{pagesLeft} pages left</span>
            </div>
          </div>
        )}

        {activeSubTab === 'notes' && (
          <div className="h-full flex flex-col animate-in fade-in">
            <textarea
              value={book.notes || ''} // 4. ADDED FALLBACK HERE
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Jot down your thoughts, favorite quotes, or reminders here..."
              className="w-full flex-1 min-h-[300px] p-6 bg-[#faf9f5] border border-stone-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-700 leading-relaxed font-serif text-lg shadow-inner"
            />
          </div>
        )}

        {activeSubTab === 'ai' && (
          <AIToolsView book={book} />
        )}
      </div>
    </div>
  );
}

// --- Exact Decimal Star Rating Component ---
function StarRating({ exactRating }) {
  // exactRating could be 3.78, 4.5, etc.
  return (
    <div className="flex items-center relative">
      {/* Background (Empty) Stars */}
      <div className="flex gap-1 text-stone-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={24} className="fill-current" />
        ))}
      </div>
      
      {/* Foreground (Filled) Stars - Clipped precisely */}
      <div 
        className="flex gap-1 text-amber-500 absolute top-0 left-0 overflow-hidden" 
        style={{ width: `${(exactRating / 5) * 100}%` }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={`f-${i}`} size={24} className="fill-current flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// --- AI Tools Component ---
function AIToolsView({ book }) {
  const [activeTool, setActiveTool] = useState(null); // recap, analysis, seminar
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const handleRecap = async () => {
    setActiveTool('recap');
    setLoading(true);
    setResult('');
    const prompt = `Give me a plot recap of the book "${book.title}" by ${book.author} up to page ${book.currentPage} out of ${book.totalPages} pages. DO NOT spoil anything that happens after this point. Keep it engaging and concise.`;
    const res = await callGemini(prompt);
    setResult(res);
    setLoading(false);
  };

  const handleAnalysis = async () => {
    setActiveTool('analysis');
    setLoading(true);
    setResult('');
    const prompt = `Provide an English-class style analysis kit for the book "${book.title}" by ${book.author}. Include: Major Themes, Motifs to look out for, Key Symbols, and 3 thought-provoking questions to ponder while reading. CRITICAL: DO NOT include any spoilers. Keep it completely safe for someone who has not finished the book. Format nicely with markdown.`;
    const res = await callGemini(prompt);
    setResult(res);
    setLoading(false);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newHistory);
    setChatInput('');
    setLoading(true);

    const context = newHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `You are leading a Socratic Seminar about the book "${book.title}" by ${book.author}. The user has finished the book. Keep your responses concise, ask probing questions, and encourage deep literary analysis. \n\nChat History:\n${context}\n\nAI:`;
    
    const res = await callGemini(prompt);
    setChatHistory([...newHistory, { role: 'ai', content: res }]);
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in">
      {!activeTool ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button onClick={handleRecap} className="flex flex-col items-center text-center p-8 bg-amber-50 rounded-2xl border border-amber-100 hover:bg-amber-100 transition-colors group">
            <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={28} />
            </div>
            <h4 className="font-serif font-bold text-lg text-amber-900 mb-2">Smart Recap</h4>
            <p className="text-sm text-amber-700">Get caught up on the plot exactly to page {book.currentPage} without spoilers.</p>
          </button>

          <button onClick={handleAnalysis} className="flex flex-col items-center text-center p-8 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors group">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 mb-4 group-hover:scale-110 transition-transform">
              <Search size={28} />
            </div>
            <h4 className="font-serif font-bold text-lg text-blue-900 mb-2">Analysis Kit</h4>
            <p className="text-sm text-blue-700">Themes, motifs, and symbols to watch for as you read.</p>
          </button>

          <button 
            onClick={() => setActiveTool('seminar')} 
            disabled={book.status !== 'read'}
            className={`flex flex-col items-center text-center p-8 rounded-2xl border transition-colors group ${book.status === 'read' ? 'bg-purple-50 border-purple-100 hover:bg-purple-100 cursor-pointer' : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'}`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${book.status === 'read' ? 'bg-purple-200 text-purple-700 group-hover:scale-110' : 'bg-stone-200 text-stone-400'}`}>
              <MessageSquare size={28} />
            </div>
            <h4 className={`font-serif font-bold text-lg mb-2 ${book.status === 'read' ? 'text-purple-900' : 'text-stone-500'}`}>Socratic Seminar</h4>
            <p className={`text-sm ${book.status === 'read' ? 'text-purple-700' : 'text-stone-400'}`}>
              {book.status === 'read' ? "Discuss the ending and deeper meanings with AI." : "Finish the book first to unlock discussion!"}
            </p>
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveTool(null)} className="mb-4 flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm font-medium">
            <ArrowLeft size={16} /> Back to Tools
          </button>
          
          <div className="bg-stone-50 p-6 md:p-8 rounded-2xl border border-stone-200 min-h-[300px]">
            {loading && !result && chatHistory.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-stone-400 gap-3">
                 <Loader2 size={32} className="animate-spin text-amber-500" />
                 <p>AI is thinking...</p>
               </div>
            ) : activeTool === 'seminar' ? (
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-stone-500 mt-10 italic">Start the discussion! What did you think of the ending?</div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                     <div className="flex justify-start">
                       <div className="bg-white border border-stone-200 p-4 rounded-2xl rounded-tl-sm flex gap-2">
                         <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></span>
                         <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                         <span className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                       </div>
                     </div>
                  )}
                </div>
                <form onSubmit={handleChat} className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button type="submit" disabled={loading || !chatInput.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 rounded-xl transition-colors">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="prose prose-stone prose-amber max-w-none font-serif leading-relaxed text-stone-800" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Add Book Modal ---
function AddBookModal({ onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverColor, setCoverColor] = useState('bg-amber-700');

  const COLORS = [
    'bg-amber-700', 'bg-red-800', 'bg-blue-800', 'bg-emerald-800', 
    'bg-purple-900', 'bg-slate-800', 'bg-stone-800', 'bg-teal-700', 'bg-orange-800'
  ];

// Search Debounce effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          // Switched to OpenLibrary API to bypass Google's 429 Rate Limits
          const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          
          if (data.docs && data.docs.length > 0) {
             setSearchResults(data.docs.map(item => ({
               id: item.key || Math.random().toString(),
               title: item.title,
               author: item.author_name ? item.author_name.join(', ') : 'Unknown Author',
               totalPages: item.number_of_pages_median || 300,
               coverUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null,
               genre: item.subject ? item.subject[0] : 'Fiction'
             })));
          } else {
             setSearchResults([]);
          }
        } catch (e) {
          console.error("Search failed", e);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    setTitle(result.title);
    setAuthor(result.author);
    setGenre(result.genre || 'Fiction');
    setTotalPages(result.totalPages);
    setCoverUrl(result.coverUrl);
    setCoverColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setShowManual(true); // Switch to the form view to confirm details
  };

const handleSubmit = async (e) => { // <-- Made this async
    e.preventDefault();
    if (title && author && totalPages) {
      
      // Wait to see if the book was successfully added without being a duplicate
      const success = await onAdd({ 
        title, 
        author, 
        genre: genre || 'Fiction',
        totalPages: parseInt(totalPages, 10) || 300, 
        coverColor: coverColor,
        coverUrl: coverUrl
      });

      // If it worked, reset the modal back to the clean search view!
      if (success) {
        setShowManual(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="text-xl font-serif font-bold text-stone-800">Add a Book</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 bg-white rounded-full p-1 shadow-sm border border-stone-200 transition-colors">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!showManual ? (
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-3.5 text-stone-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search by title..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-stone-800 placeholder:text-stone-400"
                />
              </div>
              
              <div className="min-h-[200px]">
                {isSearching ? (
                   <div className="flex justify-center items-center h-32 text-amber-600">
                     <Loader2 className="animate-spin" size={24} />
                   </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(result => (
                      <div 
                        key={result.id} 
                        onClick={() => handleSelectResult(result)}
                        className="flex gap-4 p-3 hover:bg-amber-50 rounded-xl cursor-pointer border border-transparent hover:border-amber-100 transition-colors items-center"
                      >
                        {result.coverUrl ? (
                          <img src={result.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-10 h-14 bg-stone-200 rounded shadow-sm flex items-center justify-center"><Book size={16} className="text-stone-400"/></div>
                        )}
                        <div>
                          <p className="font-bold text-stone-800">{result.title}</p>
                          <p className="text-sm text-stone-500">{result.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery.trim().length > 2 ? (
                  <div className="text-center text-stone-500 mt-8">No results found.</div>
                ) : (
                  <div className="text-center text-stone-400 mt-12 flex flex-col items-center gap-2">
                     <BookOpen size={32} className="opacity-20" />
                     <p>Search for a book to add to your library.</p>
                  </div>
                )}
              </div>

              <div className="text-center pt-4 border-t border-stone-100">
                <button 
                  onClick={() => setShowManual(true)}
                  className="text-amber-700 text-sm font-medium hover:underline"
                >
                  Can't find it? Add manually.
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4">
              <button 
                type="button" 
                onClick={() => setShowManual(false)}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-4 font-medium"
              >
                <ArrowLeft size={16} /> Back to Search
              </button>

              {coverUrl && (
                <div className="flex justify-center mb-4">
                  <img src={coverUrl} alt="Cover Preview" className="w-24 h-36 object-cover rounded-md shadow-md" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">Book Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">Author</label>
                <input required type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">Genre</label>
                  <input required type="text" value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide mb-1">Total Pages</label>
                  <input required type="number" value={totalPages} onChange={e => setTotalPages(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide mb-2">Shelf Spine Color</label>
                 <div className="flex gap-2 flex-wrap">
                   {COLORS.map(c => (
                     <button
                       key={c}
                       type="button"
                       onClick={() => setCoverColor(c)}
                       className={`w-8 h-8 rounded-full ${c} ${coverColor === c ? 'ring-2 ring-offset-2 ring-stone-800' : 'opacity-80 hover:opacity-100'}`}
                     />
                   ))}
                 </div>
              </div>

              <button type="submit" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-4 rounded-xl mt-4 shadow-md transition-colors text-lg">
                Add to Library
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Wavy Shelves SVGs ---
const ShelfWave1 = () => (
  <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-16 md:h-24 fill-amber-700/80 drop-shadow-xl absolute top-full left-0 mt-[-10px] pointer-events-none z-0">
    <path d="M0,0 C200,60 300,100 500,60 C700,20 800,0 1000,40 L1000,120 L0,120 Z" />
    <path d="M0,20 C200,80 300,120 500,80 C700,40 800,20 1000,60 L1000,120 L0,120 Z" fill="#b45309" />
  </svg>
);

const ShelfWave2 = () => (
  <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-16 md:h-24 fill-amber-700/80 drop-shadow-xl absolute top-full left-0 mt-[-10px] pointer-events-none z-0">
    <path d="M0,40 C200,0 300,20 500,60 C700,100 800,60 1000,0 L1000,120 L0,120 Z" />
    <path d="M0,60 C200,20 300,40 500,80 C700,120 800,80 1000,20 L1000,120 L0,120 Z" fill="#b45309" />
  </svg>
);


function AnimatedIntro({ logoImg }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Step 1: Typewriter effect
      tl.fromTo(".typewriter-container",
        { width: "0%" },
        { width: "100%", duration: 1.2, ease: "steps(15)", delay: 0.4 }
      )
      // Step 2: Breathe In (Logo scales up and sharpens, then stays)
      .fromTo(".intro-logo",
        { opacity: 0, scale: 0.8, filter: "blur(10px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.8, ease: "power2.out" }
      )
      // Step 3: Fade in the instructions and buttons
      .fromTo(".action-area",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" },
        "-=0.8" // Overlap this so the buttons appear right as the logo settles
      );
    }, containerRef);

    return () => ctx.revert(); 
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center min-h-[85vh] bg-[#FCF9F2] overflow-hidden px-4">
      
      {/* CSS for the blinking typewriter cursor */}
      <style>{`
        .typewriter-cursor::after {
          content: '|';
          animation: blink 1s step-end infinite;
          margin-left: 4px;
        }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>

      <div className="z-10 flex flex-col items-center text-center">
        
        {/* The Typewriter Text */}
        <div className="typewriter-container overflow-hidden whitespace-nowrap opacity-100 flex justify-center mb-6">
          <span className="text-2xl md:text-4xl font-serif font-bold text-stone-700 typewriter-cursor tracking-tight">
            welcome to your
          </span>
        </div>

        {/* The Logo */}
        <img 
          src={logoImg} 
          alt="BookNook Logo" 
          className="intro-logo h-36 md:h-48 object-contain opacity-0 drop-shadow-md mb-10"
        />

        {/* Action Area (Text and Buttons) */}
        <div className="z-10 action-area opacity-0 flex flex-col items-center">
          <p className="text-stone-500 mb-8 text-lg font-medium max-w-md">
            Log in or create an account to start tracking your reading journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <SignInButton mode="modal">
              <button className="w-full sm:w-auto bg-[#C05D22] hover:bg-[#A34B18] text-white px-10 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300 text-lg">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white px-10 py-3.5 rounded-full font-bold shadow-md hover:shadow-lg transition-all duration-300 text-lg">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>

      </div>
    </div>
  );
}