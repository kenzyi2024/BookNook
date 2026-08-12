import { useState, useEffect } from 'react';
import { BookOpenCheck, Library, Sparkles, Loader2, Rows3, LayoutGrid, Sprout, ArrowUpDown } from 'lucide-react';
import { genreNeedsHeal, markGenreHealed, classifyGenre } from '../../lib/genres';
import { SORT_OPTIONS, sortBooks } from '../../lib/sortBooks';
import Shelf from './Shelf';
import Bookcase from './Bookcase';
import SuggestionsPanel from './SuggestionsPanel';
import GadgetModal from './GadgetModal';
import { ShelfWave1, ShelfWave2 } from './ShelfWaves';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'read', label: 'Finished' },
  { id: 'want_to_read', label: 'Want to Read' },
  { id: 'dnf', label: 'DNF' },
];

// Random seed for suggestion variety (module scope keeps it out of render purity checks).
const makeSeed = () => Math.random().toString(36).slice(2);

// Labeled-line format the AI returns for recommendations. Far more robust than
// JSON, which the model routinely breaks with unescaped quotes/newlines in the
// longer summary field.
const SUGGEST_FORMAT =
  'For EACH recommended book output exactly these labeled lines and nothing else, ' +
  'with a line containing only "---" between books:\n' +
  'Title: <title>\n' +
  'Author: <author>\n' +
  'Pages: <approximate page count, a number>\n' +
  'Genre: <a single genre>\n' +
  'Blurb: <one enticing spoiler-free sentence, max 14 words>\n' +
  'Summary: <2-3 sentence spoiler-free description>';

// Parse the labeled-line format into suggestion objects. Tolerant of missing
// separators, extra prose, and multi-line summaries.
function parseSuggestions(raw) {
  const items = [];
  let cur = null;
  const commit = () => {
    if (cur && cur.title) {
      delete cur._last;
      items.push(cur);
    }
  };
  for (const line of (raw || '').split(/\r?\n/)) {
    const m = line.match(/^\s*(Title|Author|Pages|Genre|Blurb|Summary)\s*:\s*(.*)$/i);
    if (!m) {
      const t = line.trim();
      if (/^-{2,}$/.test(t)) { if (cur) cur._last = null; continue; } // book separator
      if (cur && cur._last === 'summary' && t) cur.summary += ' ' + t;
      continue;
    }
    const key = m[1].toLowerCase();
    const val = m[2].trim().replace(/^["'<]+|["'>]+$/g, '');
    if (key === 'title') {
      commit();
      cur = { title: val, author: '', totalPages: 0, genre: '', blurb: '', summary: '', _last: 'title' };
    } else if (cur) {
      if (key === 'pages') cur.totalPages = parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
      else cur[key] = val;
      cur._last = key;
    }
  }
  commit();
  return items;
}

// Order + presentation for the separated view
const STATUS_SHELVES = [
  { id: 'reading', title: 'Currently Reading', icon: BookOpenCheck },
  { id: 'want_to_read', title: 'Up Next', icon: Library },
  { id: 'read', title: 'Finished', icon: Library },
  { id: 'dnf', title: 'Set Aside', icon: Library },
];

export default function LibraryView({ books, onSelect, onAddBook }) {
  const toast = useToast();
  const api = useApi();
  const { user, updateProfile } = useAuth();
  const [filter, setFilter] = useState('all');
  const [separated, setSeparated] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingType, setLoadingType] = useState(null);
  const [suggestionsType, setSuggestionsType] = useState(null);
  const [showGadget, setShowGadget] = useState(false);
  const [sort, setSort] = useState('added_desc');

  const decor = user?.shelfDecor || [];
  const addGadget = (g) => updateProfile({ shelfDecor: [...decor, g] });
  const removeGadget = (idx) => updateProfile({ shelfDecor: decor.filter((_, i) => i !== idx) });
  const moveGadget = (idx, dir) => {
    const next = decor.map((g, i) => {
      if (i !== idx) return g;
      const cur = g.position ?? books.length;
      return { ...g, position: Math.max(0, Math.min(books.length, cur + dir)) };
    });
    updateProfile({ shelfDecor: next });
  };

  const filtered = filter === 'all' ? books : books.filter((b) => b.status === filter);
  const sorted = sortBooks(filtered, sort);

  // Persist a resolved cover/tint to the DB (best-effort; self-heals existing books).
  const persistCover = (id, patch) => {
    api.updateBook(id, patch).catch(() => {});
  };

  // Background genre self-heal: AI-classify books with generic/unknown genres
  // into the canonical list, once each, throttled to be gentle on the API.
  useEffect(() => {
    const todo = books.filter(genreNeedsHeal);
    if (!todo.length) return;
    let cancelled = false;
    (async () => {
      for (const b of todo) {
        if (cancelled) break;
        markGenreHealed(b._id);
        try {
          const genre = await classifyGenre(api.generateAI, b.title, b.author);
          if (genre && genre !== b.genre) api.updateBook(b._id, { genre }).catch(() => {});
        } catch {
          /* leave as-is on failure */
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [books, api]);

  const getSuggestions = async (type) => {
    setLoadingType(type);
    setSuggestionsType(type);
    setSuggestions([]);
    const existing = books.map((b) => `"${b.title}"`).join(', ');
    const seed = makeSeed();
    const prompt =
      type === 'history'
        ? `I have these books: ${books.map((b) => `"${b.title}" by ${b.author}`).join(', ')}. Recommend 3 new books I'd enjoy. Avoid: ${existing}. Variety (seed ${seed}).\n\n${SUGGEST_FORMAT}`
        : `Recommend 3 popular must-read books. Avoid: ${existing}. Variety (seed ${seed}).\n\n${SUGGEST_FORMAT}`;
    try {
      const raw = await api.generateAI(prompt);
      const parsed = parseSuggestions(raw).filter(
        (s) => !books.some((b) => b.title.toLowerCase() === s.title.toLowerCase())
      );
      setSuggestions(parsed);
    } catch (e) {
      console.error('Suggestion failed', e);
      toast.error(e.message || "Couldn't fetch suggestions. Try again.");
    } finally {
      setLoadingType(null);
    }
  };

  const addSuggestion = async (book) => {
    const ok = await onAddBook(book);
    if (ok) {
      setSuggestions((prev) => {
        const next = prev.filter((s) => s.title !== book.title);
        if (!next.length) setSuggestionsType(null);
        return next;
      });
    }
  };

  const suggestBlock = (type) => (
    <>
      {suggestionsType !== type && !loadingType && (
        <button
          onClick={() => getSuggestions(type)}
          className="flex items-center gap-2 text-sm bg-surface border border-brand-200 text-brand-700 px-4 py-2 rounded-full hover:bg-brand-50 transition-colors shadow-sm"
        >
          <Sparkles size={16} className="text-brand-400" />
          {type === 'history' ? 'Suggest from my history' : 'Discover popular books'}
        </button>
      )}
      {loadingType === type && (
        <div className="flex items-center gap-2 text-sm text-brand-600 mt-1 bg-brand-50 px-4 py-2 rounded-full">
          <Loader2 className="animate-spin" size={16} /> Finding books…
        </div>
      )}
      {suggestionsType === type && suggestions.length > 0 && (
        <SuggestionsPanel
          title={type === 'history' ? 'Based on your history' : 'Popular books'}
          suggestions={suggestions}
          loading={loadingType === type}
          onRefresh={() => getSuggestions(type)}
          onClose={() => { setSuggestions([]); setSuggestionsType(null); }}
          onAdd={addSuggestion}
        />
      )}
    </>
  );

  const ToggleBtn = (
    <button
      onClick={() => setSeparated((s) => !s)}
      className="flex items-center gap-2 text-sm font-medium text-stone-600 bg-surface border border-stone-200 rounded-full px-4 py-2 hover:border-brand-300 transition-colors"
    >
      {separated ? <LayoutGrid size={15} /> : <Rows3 size={15} />}
      {separated ? 'One shelf' : 'Separate shelves'}
    </button>
  );

  // --- Separated view: a shelf per status ---
  if (separated) {
    const shelves = STATUS_SHELVES.map((s) => ({ ...s, list: books.filter((b) => b.status === s.id) })).filter((s) => s.list.length);
    return (
      <div className="mt-8 mb-20 animate-in fade-in duration-500">
        <div className="relative z-40 flex justify-end mb-4">{ToggleBtn}</div>
        {shelves.length === 0 ? (
          <EmptyLibrary suggestBlock={suggestBlock} />
        ) : (
          <div className="space-y-28">
            {shelves.map((s, i) => (
              <Shelf
                key={s.id}
                icon={<s.icon size={30} className="text-brand-600 drop-shadow-sm shrink-0" />}
                title={s.title}
                books={s.list}
                onSelect={onSelect}
                onPersistCover={persistCover}
                wave={i % 2 === 0 ? <ShelfWave1 /> : <ShelfWave2 />}
                emptyState={null}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Unified view: one shelf + filter chips ---
  return (
    <div className="mt-8 mb-20 animate-in fade-in duration-500">
      <div className="relative z-40 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? books.length : books.filter((b) => b.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.id ? 'bg-brand-500 text-white' : 'bg-surface text-stone-600 border border-stone-200 hover:border-brand-300'
                }`}
              >
                {f.label} <span className={filter === f.id ? 'text-white/70' : 'text-stone-400'}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <ArrowUpDown size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none text-sm font-medium text-stone-600 bg-surface border border-stone-200 rounded-full pl-9 pr-4 py-2 hover:border-brand-300 transition-colors cursor-pointer"
              aria-label="Sort books"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => getSuggestions('history')}
            disabled={books.length === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <Sparkles size={15} /> Up Next
          </button>
          <button
            onClick={() => setShowGadget(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 bg-surface border border-stone-200 rounded-full px-4 py-2 hover:border-brand-300 transition-colors"
          >
            <Sprout size={15} /> Add gadget
          </button>
          {ToggleBtn}
        </div>
      </div>

      {/* For You recommendations */}
      {(loadingType === 'history' || (suggestionsType === 'history' && suggestions.length > 0)) && (
        <div className="relative z-40 mb-6">
          {loadingType === 'history' ? (
            <div className="flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2 rounded-full w-max">
              <Loader2 className="animate-spin" size={16} /> Finding books you'll love…
            </div>
          ) : (
            <SuggestionsPanel
              title="Up Next — based on your reading"
              suggestions={suggestions}
              loading={false}
              onRefresh={() => getSuggestions('history')}
              onClose={() => { setSuggestions([]); setSuggestionsType(null); }}
              onAdd={addSuggestion}
            />
          )}
        </div>
      )}

      {/* Library title */}
      <div className="relative z-20 flex items-center gap-3 mb-3">
        <Library size={30} className="text-brand-600 drop-shadow-sm shrink-0" />
        <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
          {filter === 'all' ? 'Your Library' : FILTERS.find((f) => f.id === filter).label}
        </h2>
      </div>

      {books.length === 0 ? (
        <EmptyLibrary suggestBlock={suggestBlock} inline />
      ) : sorted.length === 0 ? (
        <div className="text-stone-400 italic py-10">No books in this filter.</div>
      ) : (
        <Bookcase
          books={sorted}
          decor={filter === 'all' ? decor : []}
          onSelect={onSelect}
          onPersistCover={persistCover}
          onMoveGadget={moveGadget}
          onRemoveGadget={removeGadget}
        />
      )}

      {showGadget && (
        <GadgetModal
          onAdd={addGadget}
          onClose={() => setShowGadget(false)}
        />
      )}
    </div>
  );
}

function EmptyLibrary({ suggestBlock, inline }) {
  return (
    <div className={`flex flex-col ${inline ? 'items-start' : 'items-center'} gap-3 ${inline ? '' : 'py-16 text-center'}`}>
      <p className="text-stone-500">Your shelves are empty — add a book or get a recommendation.</p>
      <div className="flex flex-wrap gap-2">
        {suggestBlock('popular')}
        {suggestBlock('history')}
      </div>
    </div>
  );
}
