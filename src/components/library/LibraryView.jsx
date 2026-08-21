import { useState, useEffect, useRef } from 'react';
import { BookOpenCheck, Library, Sparkles, Loader2, Rows3, LayoutGrid, Sprout, ArrowUpDown, Search, MoreHorizontal, Wand2, Trash2, ListOrdered } from 'lucide-react';
import TBRPlanner from './TBRPlanner';
import { genreNeedsHeal, markGenreHealed, classifyGenre } from '../../lib/genres';
import { SORT_OPTIONS, sortBooks } from '../../lib/sortBooks';
import { getGadgetPos, setGadgetPos } from '../../lib/gadgetPos';
import { SUGGEST_FORMAT, parseSuggestions } from '../../lib/aiBooks';
import Shelf from './Shelf';
import Bookcase from './Bookcase';
import SuggestionsPanel from './SuggestionsPanel';
import GadgetModal from './GadgetModal';
import { ShelfWave1, ShelfWave2 } from './ShelfWaves';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'read', label: 'Finished' },
  { id: 'want_to_read', label: 'Want to Read' },
  { id: 'dnf', label: 'DNF' },
];

// Random seed for suggestion variety (module scope keeps it out of render purity checks).
const makeSeed = () => Math.random().toString(36).slice(2);

// Order + presentation for the separated view
const STATUS_SHELVES = [
  { id: 'reading', title: 'Currently Reading', icon: BookOpenCheck },
  { id: 'want_to_read', title: 'Up Next', icon: Library },
  { id: 'read', title: 'Finished', icon: Library },
  { id: 'dnf', title: 'Set Aside', icon: Library },
];

export default function LibraryView({ books, onSelect, onAddBook, onToggleSample, sampleLoaded, onClearLibrary, onUpdateBook }) {
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
  const [posBump, setPosBump] = useState(0);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTBR, setShowTBR] = useState(false);

  const wantToRead = books.filter((b) => b.status === 'want_to_read');
  const saveTBR = (updates) => {
    updates.forEach((u) => onUpdateBook && onUpdateBook(u.id, { tbrMonth: u.tbrMonth, tbrRank: u.tbrRank }));
    setFilter('want_to_read');
    setSort('tbr');
  };
  const menuRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const decor = user?.shelfDecor || [];
  const addGadget = (g) => updateProfile({ shelfDecor: [...decor, { ...g, position: books.length }] });
  const removeGadget = (idx) => updateProfile({ shelfDecor: decor.filter((_, i) => i !== idx) });
  // Positions resolve from the client store first (instant), then DB, then end.
  const decorPositioned = decor.map((g) => ({
    ...g,
    position: getGadgetPos(g._id) ?? g.position ?? books.length,
  }));
  const placeGadget = (idx, position) => {
    const g = decor[idx];
    const pos = Math.max(0, Math.min(books.length, position));
    setGadgetPos(g._id, pos);
    setPosBump((b) => b + 1); // instant re-render
    // best-effort DB sync (persists once the backend has the position field)
    updateProfile({ shelfDecor: decor.map((d, i) => (i === idx ? { ...d, position: pos } : d)) }).catch(() => {});
  };

  const filtered = filter === 'all' ? books : books.filter((b) => b.status === filter);
  const sorted = sortBooks(filtered, sort);
  const q = query.trim().toLowerCase();
  const searched = q
    ? sorted.filter((b) => `${b.title} ${b.author} ${b.genre || ''} ${(b.moods || []).join(' ')}`.toLowerCase().includes(q))
    : sorted;

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

  const seenTitles = useRef(new Set()); // titles already suggested this session — avoid repeats on refresh
  const getSuggestions = async (type) => {
    setLoadingType(type);
    setSuggestionsType(type);
    setSuggestions([]);
    const avoidList = [...books.map((b) => b.title), ...seenTitles.current];
    const existing = avoidList.map((t) => `"${t}"`).join(', ');
    const seed = makeSeed();
    const prompt =
      type === 'history'
        ? `I have these books: ${books.map((b) => `"${b.title}" by ${b.author}`).join(', ')}. Recommend 3 new books I'd enjoy. Avoid: ${existing}. Variety (seed ${seed}).\n\n${SUGGEST_FORMAT}`
        : `Recommend 3 popular must-read books. Avoid: ${existing}. Variety (seed ${seed}).\n\n${SUGGEST_FORMAT}`;
    try {
      const raw = await api.generateAI(prompt);
      const owned = (s) => books.some((b) => b.title.toLowerCase() === s.title.toLowerCase());
      const parsed = parseSuggestions(raw).filter((s) => !owned(s));
      const fresh = parsed.filter((s) => !seenTitles.current.has(s.title.toLowerCase()));
      const result = fresh.length ? fresh : parsed; // fall back if the model repeats everything
      result.forEach((s) => seenTitles.current.add(s.title.toLowerCase()));
      setSuggestions(result);
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
          onClose={() => { setSuggestions([]); setSuggestionsType(null); seenTitles.current.clear(); }}
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
          <EmptyLibrary suggestBlock={suggestBlock} onLoadSample={!sampleLoaded ? onToggleSample : undefined} />
        ) : (
          <div className="space-y-28">
            {shelves.map((s, i) => (
              <Shelf
                key={s.id}
                icon={s.icon}
                title={s.title}
                subtitle={`${s.list.length} book${s.list.length === 1 ? '' : 's'}`}
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
    <div className="mt-8 mb-20 animate-in fade-in duration-500" data-pos={posBump}>
      {/* Page title — kept at the very top so it aligns with the other tabs */}
      <div className="relative z-20">
        <PageHeader
          icon={Library}
          title={filter === 'all' ? 'Your Library' : FILTERS.find((f) => f.id === filter).label}
          subtitle={books.length ? `${books.length} book${books.length === 1 ? '' : 's'} on your shelves` : 'Build your shelves'}
          action={
            <Button variant="soft" onClick={() => getSuggestions('history')} disabled={books.length === 0}>
              <Sparkles size={15} /> Up Next
            </Button>
          }
        />
      </div>

      {/* Toolbar — one clean bar: filters + search + sort · view + more */}
      <div className="relative z-40 mb-4 flex flex-wrap items-center gap-2">
        {/* segmented status filters */}
        <div className="inline-flex bg-surface border border-stone-200 rounded-full p-1">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? books.length : books.filter((b) => b.status === f.id).length;
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? 'bg-brand-500 text-white' : 'text-stone-600 hover:text-brand-600'
                }`}
              >
                {f.label} <span className={active ? 'text-white/70' : 'text-stone-400'}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or author"
            aria-label="Search your library"
            className="w-44 focus:w-56 transition-all bg-surface border border-stone-200 rounded-full pl-9 pr-3 py-2 text-sm text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* sort */}
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

        {/* right cluster: view mode + overflow */}
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex bg-surface border border-stone-200 rounded-full p-1">
            <button
              onClick={() => setSeparated(false)}
              title="One shelf"
              aria-label="One shelf"
              className={`p-1.5 rounded-full transition-colors ${!separated ? 'bg-brand-50 text-brand-600' : 'text-stone-500 hover:text-brand-600'}`}
            >
              <Rows3 size={16} />
            </button>
            <button
              onClick={() => setSeparated(true)}
              title="Group by status"
              aria-label="Group by status"
              className={`p-1.5 rounded-full transition-colors ${separated ? 'bg-brand-50 text-brand-600' : 'text-stone-500 hover:text-brand-600'}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="More options"
              aria-expanded={menuOpen}
              className="p-2 rounded-full bg-surface border border-stone-200 text-stone-500 hover:text-brand-600 hover:border-brand-300 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-surface border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => { setMenuOpen(false); setShowGadget(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <Sprout size={16} /> Decorate shelf
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setShowTBR(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <ListOrdered size={16} /> Plan TBR
                </button>
                {onClearLibrary && (
                  <button
                    onClick={() => { setMenuOpen(false); onClearLibrary(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-status-dnf hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} /> Clear library
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations — their own space, below the toolbar */}
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
              onClose={() => { setSuggestions([]); setSuggestionsType(null); seenTitles.current.clear(); }}
              onAdd={addSuggestion}
            />
          )}
        </div>
      )}

      {books.length === 0 ? (
        <EmptyLibrary suggestBlock={suggestBlock} onLoadSample={!sampleLoaded ? onToggleSample : undefined} inline />
      ) : searched.length === 0 ? (
        <div className="text-stone-400 italic py-10">
          {query ? `No books match “${query}”.` : 'No books in this filter — try another tab.'}
        </div>
      ) : (
        <Bookcase
          books={searched}
          decor={filter === 'all' && !q ? decorPositioned : []}
          onSelect={onSelect}
          onPersistCover={persistCover}
          onPlaceGadget={placeGadget}
          onRemoveGadget={removeGadget}
        />
      )}

      {showGadget && (
        <GadgetModal
          onAdd={addGadget}
          onClose={() => setShowGadget(false)}
        />
      )}

      {showTBR && (
        <TBRPlanner books={wantToRead} onSave={saveTBR} onClose={() => setShowTBR(false)} />
      )}
    </div>
  );
}

function EmptyLibrary({ suggestBlock, onLoadSample }) {
  return (
    <div className="rounded-3xl border border-stone-200/70 bg-surface shadow-sm px-6 py-14 text-center">
      <span className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
        <Library size={30} className="text-brand-400" />
      </span>
      <h3 className="font-display font-semibold text-lg text-ink">Your shelves are waiting</h3>
      <p className="text-stone-500 mt-1 max-w-md mx-auto">
        Add a book with the button up top, explore a recommendation, or load a sample library to see BookNook in action.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        {onLoadSample && (
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-brand-500 text-white px-4 py-2 rounded-full hover:bg-brand-600 transition-colors shadow-sm"
          >
            <Wand2 size={16} /> Load sample library
          </button>
        )}
        {suggestBlock('popular')}
        {suggestBlock('history')}
      </div>
    </div>
  );
}
