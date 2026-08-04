import { useState } from 'react';
import { BookOpenCheck, Library, Sparkles, Loader2, Filter } from 'lucide-react';
import Shelf from './Shelf';
import SuggestionsPanel from './SuggestionsPanel';
import { ShelfWave1, ShelfWave2 } from './ShelfWaves';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../ui/ToastProvider';

/**
 * The main library screen: a "Currently Reading" shelf and a filterable
 * "Collection" shelf, each with AI suggestions when empty.
 */
export default function LibraryView({ books, onSelect, onAddBook }) {
  const toast = useToast();
  const api = useApi();
  const [suggestions, setSuggestions] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [suggestionsType, setSuggestionsType] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState('all');

  const readingBooks = books.filter((b) => b.status === 'reading');
  let otherBooks = books.filter((b) => b.status !== 'reading');
  if (collectionFilter !== 'all') {
    otherBooks = otherBooks.filter((b) => b.status === collectionFilter);
  }

  const getSuggestions = async (type) => {
    setLoadingType(type);
    setSuggestionsType(type);
    setSuggestions([]);

    const existing = books.map((b) => `"${b.title}"`).join(', ');
    const seed = Math.random();
    const prompt =
      type === 'history'
        ? `I have these books in my library: ${books
            .map((b) => `"${b.title}" by ${b.author}`)
            .join(', ')}. Recommend 3 specific new books I might enjoy based on this. DO NOT recommend any of: ${existing}. Ensure variety (Seed: ${seed}). Return ONLY a JSON array of objects with keys "title", "author", "totalPages", "genre". No markdown.`
        : `Recommend 3 highly popular must-read classic or best-selling books. DO NOT recommend any of: ${existing}. Ensure variety (Seed: ${seed}). Return ONLY a JSON array of objects with keys "title", "author", "totalPages", "genre". No markdown.`;

    try {
      const raw = await api.generateAI(prompt);
      const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      const safe = Array.isArray(parsed)
        ? parsed.filter((s) => !books.some((b) => b.title.toLowerCase() === s.title.toLowerCase()))
        : [];
      setSuggestions(safe);
    } catch (e) {
      console.error('Suggestion request failed', e);
      toast.error(e.message || "The AI sent back data we couldn't read. Try again.");
    } finally {
      setLoadingType(null);
    }
  };

  const addSuggestion = async (book) => {
    const ok = await onAddBook(book);
    if (ok) {
      setSuggestions((prev) => {
        const next = prev.filter((s) => s.title !== book.title);
        if (next.length === 0) setSuggestionsType(null);
        return next;
      });
    }
  };

  return (
    <div className="space-y-32 mt-10 mb-20 animate-in fade-in duration-500">
      <Shelf
        icon={<BookOpenCheck size={32} className="text-brand-600 drop-shadow-sm shrink-0" />}
        title="Currently Reading"
        books={readingBooks}
        onSelect={onSelect}
        wave={<ShelfWave1 />}
        emptyState={
          <>
            <div className="text-stone-400 italic">No books currently being read.</div>
            {books.length > 0 && suggestionsType !== 'history' && !loadingType && (
              <button
                onClick={() => getSuggestions('history')}
                className="flex items-center gap-2 text-sm bg-surface border border-brand-200 text-brand-700 px-4 py-2 rounded-full hover:bg-brand-50 transition-colors shadow-sm"
              >
                <Sparkles size={16} className="text-brand-400" /> Explore books based on history
              </button>
            )}
            {loadingType === 'history' && (
              <div className="flex items-center gap-2 text-sm text-brand-600 mt-2 bg-brand-50 px-4 py-2 rounded-full">
                <Loader2 className="animate-spin" size={16} /> Finding matches...
              </div>
            )}
            {suggestionsType === 'history' && suggestions.length > 0 && (
              <SuggestionsPanel
                title="Suggested from your history"
                suggestions={suggestions}
                loading={loadingType === 'history'}
                onRefresh={() => getSuggestions('history')}
                onClose={() => {
                  setSuggestions([]);
                  setSuggestionsType(null);
                }}
                onAdd={addSuggestion}
              />
            )}
          </>
        }
      />

      <Shelf
        icon={<Library size={32} className="text-brand-600 drop-shadow-sm shrink-0" />}
        title="The Collection"
        books={otherBooks}
        onSelect={onSelect}
        wave={<ShelfWave2 />}
        action={
          <div className="flex items-center gap-2 text-sm bg-paper/80 border border-brand-900/10 rounded-full px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <Filter size={14} className="text-stone-500" />
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              className="bg-transparent border-none text-stone-700 font-medium focus:outline-none cursor-pointer text-sm"
            >
              <option value="all">All Books</option>
              <option value="read">Finished</option>
              <option value="want_to_read">Unread</option>
              <option value="dnf">Did Not Finish (DNF)</option>
            </select>
          </div>
        }
        emptyState={
          <>
            <div className="text-stone-400 italic">No books in this view.</div>
            {suggestionsType !== 'popular' && !loadingType && collectionFilter === 'all' && (
              <button
                onClick={() => getSuggestions('popular')}
                className="flex items-center gap-2 text-sm bg-surface border border-brand-200 text-brand-700 px-4 py-2 rounded-full hover:bg-brand-50 transition-colors shadow-sm"
              >
                <Sparkles size={16} className="text-brand-400" /> Discover popular books
              </button>
            )}
            {loadingType === 'popular' && (
              <div className="flex items-center gap-2 text-sm text-brand-600 mt-2 bg-brand-50 px-4 py-2 rounded-full">
                <Loader2 className="animate-spin" size={16} /> Fetching recommendations...
              </div>
            )}
            {suggestionsType === 'popular' && suggestions.length > 0 && (
              <SuggestionsPanel
                title="Popular books"
                suggestions={suggestions}
                loading={loadingType === 'popular'}
                onRefresh={() => getSuggestions('popular')}
                onClose={() => {
                  setSuggestions([]);
                  setSuggestionsType(null);
                }}
                onAdd={addSuggestion}
              />
            )}
          </>
        }
      />
    </div>
  );
}
