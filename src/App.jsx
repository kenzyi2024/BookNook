import { useState, useEffect, useCallback } from 'react';

import Navbar from './components/layout/Navbar';
import AuthPage from './components/auth/AuthPage';
import LibraryView from './components/library/LibraryView';
import MetricsView from './components/metrics/MetricsView';
import DiscoverView from './components/discover/DiscoverView';
import BookDetailView from './components/book/BookDetailView';
import AddBookModal from './components/book/AddBookModal';
import { useApi } from './hooks/useApi';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useToast } from './components/ui/ToastProvider';
import { buildMockBooks, buildMockGadgets, DEMO_TAG, isDemoBook } from './lib/mockLibrary';
import { setGadgetPos } from './lib/gadgetPos';
import { localBooks } from './lib/localBooks';

export default function App() {
  const { isAuthenticated, loading, user, logout, guest, converting, startAccountSave, cancelAccountSave, updateProfile } = useAuth();
  const { setTheme } = useTheme();
  const api = useApi();
  const toast = useToast();

  // Apply the signed-in user's saved theme.
  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
  }, [user?.theme, setTheme]);

  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('library');
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const sampleLoaded = books.some(isDemoBook);

  // Load the signed-in user's library (scoped server-side by their user id).
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    (async () => {
      try {
        const data = await api.getBooks();
        if (active) setBooks(data);
      } catch (err) {
        console.error('Error loading library:', err);
        if (active) toast.error('Could not load your library. Is the backend running?');
      }
    })();
    return () => {
      active = false;
      setBooks([]);
    };
  }, [isAuthenticated, api, toast]);

  const goTo = useCallback((tab) => {
    setActiveTab(tab);
    setSelectedBook(null);
  }, []);

  const handleAddBook = async (newBook) => {
    try {
      const saved = await api.createBook(newBook);
      setBooks((prev) => [saved, ...prev]);
      toast.success(`"${saved.title}" was added to your library!`);
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to add book.');
      return false;
    }
  };

  const handleUpdateBook = async (id, updates) => {
    setBooks((prev) => prev.map((b) => (b._id === id ? { ...b, ...updates } : b)));
    setSelectedBook((prev) => (prev && prev._id === id ? { ...prev, ...updates } : prev));
    try {
      await api.updateBook(id, updates);
    } catch (err) {
      toast.error(err.message || 'Failed to save changes.');
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await api.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b._id !== id));
      setSelectedBook(null);
      toast.success('Book deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete the book.');
    }
  };

  const reloadBooks = useCallback(async () => {
    try {
      setBooks(await api.getBooks());
    } catch {
      /* ignore */
    }
  }, [api]);

  const loadSample = async () => {
    setSampleBusy(true);
    try {
      const before = books.length;
      let added = 0;
      let skipped = 0;
      // Add each book independently so a duplicate title (409) just gets skipped.
      for (const b of buildMockBooks()) {
        try {
          const saved = await api.createBook(b);
          if (saved?._id) added += 1;
        } catch {
          skipped += 1;
        }
      }
      // Scatter demo gadgets across the shelves.
      try {
        const gadgets = buildMockGadgets(before + added);
        const updated = await updateProfile({ shelfDecor: [...(user?.shelfDecor || []), ...gadgets] });
        const decor = updated?.shelfDecor;
        if (decor) {
          decor
            .filter((g) => g.caption === DEMO_TAG)
            .slice(-gadgets.length)
            .forEach((g, idx) => {
              if (g._id) setGadgetPos(g._id, gadgets[idx].position);
            });
        }
      } catch {
        /* ignore */
      }
      if (guest) setBooks(localBooks.all());
      else await reloadBooks();
      if (added) toast.success(`Sample library loaded${skipped ? ` (${skipped} you already had were skipped)` : ''}.`);
      else toast.error('Those sample books are already in your library.');
    } finally {
      setSampleBusy(false);
    }
  };

  const removeSample = async () => {
    setSampleBusy(true);
    try {
      for (const b of books.filter(isDemoBook)) {
        try {
          await api.deleteBook(b._id);
        } catch {
          /* already gone */
        }
      }
      try {
        const current = user?.shelfDecor || [];
        const kept = current.filter((g) => g.caption !== DEMO_TAG);
        if (kept.length !== current.length) await updateProfile({ shelfDecor: kept });
      } catch {
        /* ignore */
      }
      if (guest) setBooks(localBooks.all());
      else await reloadBooks();
      toast.success('Sample data removed.');
    } finally {
      setSampleBusy(false);
    }
  };

  const toggleSample = () => (sampleLoaded ? removeSample() : loadSample());

  const clearLibrary = () => {
    localBooks.clear();
    setBooks([]);
    toast.success('Library cleared.');
  };

  // --- Gate on auth ---
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center text-stone-500">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
        <p className="font-semibold text-lg">Loading...</p>
      </div>
    );
  }

  if (converting) {
    return <AuthPage onCancel={cancelAccountSave} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-brand-200">
      <Navbar
        activeTab={activeTab}
        onTab={goTo}
        onAdd={() => setShowAddModal(true)}
        user={user}
        onLogout={logout}
        onToggleSample={toggleSample}
        sampleLoaded={sampleLoaded}
        sampleBusy={sampleBusy}
      />

      {guest && (
        <div className="bg-brand-50 border-b border-brand-100 text-sm text-brand-800 px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
          <span>You’re browsing as a guest — your library is saved on this device.</span>
          <button onClick={startAccountSave} className="font-semibold text-brand-700 hover:underline">
            Create a free account to save it
          </button>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pb-24">
        {selectedBook ? (
          <BookDetailView
            book={selectedBook}
            onUpdate={(updates) => handleUpdateBook(selectedBook._id, updates)}
            onBack={() => setSelectedBook(null)}
            onDelete={handleDeleteBook}
          />
        ) : activeTab === 'library' ? (
          <LibraryView
            books={books}
            onSelect={setSelectedBook}
            onAddBook={handleAddBook}
            onToggleSample={toggleSample}
            sampleLoaded={sampleLoaded}
            onClearLibrary={guest ? clearLibrary : undefined}
          />
        ) : activeTab === 'discover' ? (
          <DiscoverView books={books} onAdd={handleAddBook} />
        ) : (
          <MetricsView books={books} />
        )}
      </main>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onAdd={handleAddBook} />}
    </div>
  );
}
