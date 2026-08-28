import { useState, useEffect } from 'react';
import { Search, Loader2, ArrowLeft, Plus, BookOpen } from 'lucide-react';
import { SPINE_COLORS, randomSpine } from '../../lib/status';
import { searchBooks } from '../../lib/bookSearch';
import { GENRE_OPTIONS } from '../../lib/genres';
import BookCover from '../ui/BookCover';

/**
 * Add-book modal: search OpenLibrary, or add manually. Calls onAdd() which
 * returns true on success so the modal can reset.
 */
export default function AddBookModal({ onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverColor, setCoverColor] = useState('bg-amber-700');

  // Debounced search — Google Books (with Open Library fallback), already
  // normalized into { id, title, author, totalPages, coverUrl, genre }.
  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchQuery.trim().length <= 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      setSearchError('');
      try {
        setSearchResults(await searchBooks(searchQuery));
      } catch (err) {
        setSearchResults([]);
        setSearchError(err.message || 'Book search is unavailable right now.');
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const selectResult = (r) => {
    setTitle(r.title);
    setAuthor(r.author);
    setGenre(GENRE_OPTIONS.includes(r.genre) ? r.genre : 'Fiction');
    setTotalPages(r.totalPages || '');
    setCoverUrl(r.coverUrl || null);
    setCoverColor(randomSpine());
    setShowManual(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !author) return;
    setSubmitting(true);
    const success = await onAdd({
      title,
      author,
      genre: genre || 'Fiction',
      totalPages: parseInt(totalPages, 10) || 300,
      coverColor,
      coverUrl,
    });
    setSubmitting(false);
    if (success) {
      setShowManual(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h3 className="font-display font-bold text-lg text-ink">Add a Book</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-ink bg-surface rounded-full p-1 shadow-sm border border-stone-200 transition-colors"
            aria-label="Close"
          >
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
                  className="w-full bg-surface border border-stone-300 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-ink placeholder:text-stone-400"
                />
              </div>

              <div className="min-h-[200px]">
                {isSearching ? (
                  <div className="flex justify-center items-center h-32 text-brand-500">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 -mr-1">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => selectResult(r)}
                        className="w-full flex gap-4 p-3 hover:bg-brand-50 rounded-xl cursor-pointer border border-transparent hover:border-brand-100 transition-colors items-center text-left"
                      >
                        <BookCover book={{ coverUrl: r.coverUrl, title: r.title }} rounded="rounded" className="w-10 h-14 shadow-sm shrink-0" showTitle={false} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">{r.title}</p>
                          <p className="text-sm text-stone-500 truncate">{r.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchError ? (
                  <div className="text-center mt-8 flex flex-col items-center gap-3">
                    <p className="text-status-dnf">{searchError}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSearchQuery((q) => `${q} `)}
                        className="bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => setShowManual(true)}
                        className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                      >
                        Add it manually
                      </button>
                    </div>
                  </div>
                ) : searchQuery.trim().length > 2 ? (
                  <div className="text-center mt-8 flex flex-col items-center gap-3">
                    <p className="text-stone-500">No matches for “{searchQuery}”.</p>
                    <button
                      onClick={() => setShowManual(true)}
                      className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                    >
                      Add it manually
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-stone-400 mt-12 flex flex-col items-center gap-2">
                    <BookOpen size={32} className="opacity-20" />
                    <p>Search for a book to add to your library.</p>
                  </div>
                )}
              </div>

              <div className="text-center pt-4 border-t border-stone-100">
                <button onClick={() => setShowManual(true)} className="text-brand-600 text-sm font-medium hover:underline">
                  Can't find it? Add manually.
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4">
              <button
                type="button"
                onClick={() => setShowManual(false)}
                className="flex items-center gap-2 text-stone-500 hover:text-ink text-sm mb-4 font-medium"
              >
                <ArrowLeft size={16} /> Back to Search
              </button>

              {coverUrl && (
                <div className="flex justify-center mb-4">
                  <img src={coverUrl} alt="Cover preview" className="w-24 h-36 object-cover rounded-md shadow-md" />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 uppercase tracking-wide mb-1">Book Title</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 uppercase tracking-wide mb-1">Author</label>
                <input required type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 uppercase tracking-wide mb-1">
                  Total Pages <span className="text-stone-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  placeholder="e.g. 320"
                  className="w-full bg-stone-100 border-none rounded-xl p-3 focus:ring-2 focus:ring-brand-400"
                />
                {/* Genre is auto-detected and refined by AI — no need to pick it here. */}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 uppercase tracking-wide mb-2">Shelf Spine Color</label>
                <div className="flex gap-2 flex-wrap">
                  {SPINE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoverColor(c)}
                      className={`w-8 h-8 rounded-full ${c} ${coverColor === c ? 'ring-2 ring-offset-2 ring-ink' : 'opacity-80 hover:opacity-100'}`}
                      aria-label={`Spine color ${c}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl mt-4 shadow-md transition-colors text-lg flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={18} className="animate-spin" />}
                Add to Library
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
