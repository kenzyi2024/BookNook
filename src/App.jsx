import { useState, useEffect, useCallback } from 'react';

import Navbar from './components/layout/Navbar';
import AuthPage from './components/auth/AuthPage';
import LibraryView from './components/library/LibraryView';
import MetricsView from './components/metrics/MetricsView';
import BookDetailView from './components/book/BookDetailView';
import AddBookModal from './components/book/AddBookModal';
import { useApi } from './hooks/useApi';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useToast } from './components/ui/ToastProvider';

export default function App() {
  const { isAuthenticated, loading, user, logout } = useAuth();
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

  // --- Gate on auth ---
  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center text-stone-500">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
        <p className="font-semibold text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-brand-200">
      <Navbar activeTab={activeTab} onTab={goTo} onAdd={() => setShowAddModal(true)} user={user} onLogout={logout} />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pb-24">
        {selectedBook ? (
          <BookDetailView
            book={selectedBook}
            onUpdate={(updates) => handleUpdateBook(selectedBook._id, updates)}
            onBack={() => setSelectedBook(null)}
            onDelete={handleDeleteBook}
          />
        ) : activeTab === 'library' ? (
          <LibraryView books={books} onSelect={setSelectedBook} onAddBook={handleAddBook} />
        ) : (
          <MetricsView books={books} />
        )}
      </main>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onAdd={handleAddBook} />}
    </div>
  );
}
