import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Search, Plus, Check, Compass, Loader2, X, ChevronDown, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import { resolveCover } from '../../lib/covers';
import { randomSpine } from '../../lib/status';
import { GENRE_OPTIONS } from '../../lib/genres';
import { SUGGEST_FORMAT } from '../../lib/aiBooks';
import { fetchRecommendations, createBookMatcher, suggestionKey } from '../../lib/recommendations';
import { preloadImage } from '../../lib/imageCache';
import BookLoader from '../ui/BookLoader';
import Button from '../ui/Button';
import Chip from '../ui/Chip';
import PageHeader from '../ui/PageHeader';
import BookCover from '../ui/BookCover';

// Module scope keeps the impure call out of render-purity checks.
const makeSeed = () => Math.random().toString(36).slice(2);

const MOODS = [
  'Cozy and comforting',
  'Mind-bending sci-fi',
  'A twisty thriller',
  'Made me cry',
  'Beautiful prose',
  'Underrated gems',
  'Modern classics',
  'Short and gripping',
  'Feel-good romance',
  'Sweeping fantasy',
];

const randomMood = () => MOODS[Math.floor(Math.random() * MOODS.length)];

// Persist the last Discover session across tab switches (survives remount).
// Keyed by user, so signing in as someone else never shows the previous
// reader's searches or results.
const caches = new Map();
const cacheFor = (userId = 'anon') => {
  if (!caches.has(userId)) {
    caches.set(userId, { query: '', lastQuery: '', length: 'any', genre: 'any', results: [], seen: [], added: [] });
  }
  return caches.get(userId);
};
const saveCache = (userId, patch) => Object.assign(cacheFor(userId), patch);

// How many cards make up the first screenful — their covers load eagerly.
const ABOVE_FOLD = 6;

function DiscoverCard({ s, inLibrary, added, onAdd, onHide, eager }) {
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveCover(s.title, s.author).then((r) => {
      if (!alive) return;
      setCover(r.coverUrl);
      preloadImage(r.coverUrl, { priority: eager ? 'high' : 'low' });
    });
    return () => {
      alive = false;
    };
  }, [s.title, s.author, eager]);

  const add = async () => {
    setBusy(true);
    try {
      await onAdd({
        title: s.title,
        author: s.author,
        genre: s.genre || 'Fiction',
        totalPages: s.totalPages || 300,
        status: 'want_to_read',
        coverColor: randomSpine(),
        coverUrl: cover || '',
        // Keep the summary the reader saw, attached to this exact book.
        summary: s.summary || '',
      });
    } finally {
      setBusy(false);
    }
  };

  // Short blurb as the preview; the full summary expands in place.
  const preview = s.blurb || s.summary;
  const hasMore = Boolean(s.summary) && s.summary !== preview;
  const summaryId = `disc-${suggestionKey(s).replace(/[^a-z0-9]+/gi, '-')}`;

  return (
    <div className="relative bg-surface border border-stone-200 rounded-2xl p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group/card">
      {onHide && !added && (
        <button
          onClick={onHide}
          aria-label={`Not interested in ${s.title}`}
          title="Not interested"
          className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-stone-300 hover:text-status-dnf hover:bg-stone-100 transition-colors opacity-0 group-hover/card:opacity-100 focus:opacity-100"
        >
          <X size={15} />
        </button>
      )}
      <div className="w-16 shrink-0">
        <BookCover
          book={{ coverUrl: cover, title: s.title }}
          rounded="rounded-lg"
          className="w-16 h-24 shadow"
          titleClass="text-[9px]"
          priority={eager ? 'high' : 'auto'}
        />
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <p className="font-display font-bold text-ink leading-snug line-clamp-2 pr-5">{s.title}</p>
        <p className="text-xs text-stone-500 mb-1.5">
          {s.author}
          {s.genre ? ` · ${s.genre}` : ''}
        </p>
        {preview ? (
          <p className="text-sm text-stone-600 leading-relaxed">{preview}</p>
        ) : (
          <p className="text-sm text-stone-400 italic">No summary available.</p>
        )}
        {hasMore && (
          <>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={summaryId}
              className="self-start mt-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              {open ? 'Hide summary' : 'Read summary'}
              <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <p id={summaryId} className="text-sm text-stone-600 leading-relaxed mt-1.5 border-l-2 border-brand-100 pl-3">
                {s.summary}
              </p>
            )}
          </>
        )}
        <div className="mt-3">
          {inLibrary || added ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-read">
              <Check size={14} /> {added ? 'Added to Want to Read' : 'In your library'}
            </span>
          ) : (
            <Button variant="soft" size="sm" onClick={add} disabled={busy}>
              <Plus size={15} /> Add to shelf
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Discover: describe a mood or vibe and get AI-curated book ideas to explore and
 * add — separate from your owned library. AI is a signed-in feature, so guests
 * see a gentle prompt to create an account.
 */
export default function DiscoverView({ books, onAdd }) {
  const api = useApi();
  const { guest, user } = useAuth();
  const toast = useToast();
  const uid = user?._id;
  const cache = cacheFor(uid);
  const [query, setQuery] = useState(cache.query);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState(cache.results);
  const [lastQuery, setLastQuery] = useState(cache.lastQuery);
  const [length, setLength] = useState(cache.length);
  const [genre, setGenre] = useState(cache.genre);
  const [added, setAdded] = useState(() => new Set(cache.added));
  // Every suggestion shown or dismissed for the current query, so "Show more"
  // never repeats one.
  const seen = useRef(cache.seen);
  const requestId = useRef(0);

  // Mirror to the module cache so leaving/returning to the tab restores state.
  useEffect(() => { saveCache(uid, { query }); }, [uid, query]);
  useEffect(() => { saveCache(uid, { lastQuery }); }, [uid, lastQuery]);
  useEffect(() => { saveCache(uid, { length }); }, [uid, length]);
  useEffect(() => { saveCache(uid, { genre }); }, [uid, genre]);
  useEffect(() => { saveCache(uid, { results }); }, [uid, results]);
  useEffect(() => { saveCache(uid, { added: [...added] }); }, [uid, added]);

  // Anything already on the shelf (any status) is hidden — except cards the
  // reader added from this page, which stay to confirm the add.
  const onShelf = useMemo(() => createBookMatcher(books), [books]);
  const visible = results.filter((s) => added.has(suggestionKey(s)) || !onShelf(s));

  // A few of the reader's favorites, to power "Because you loved…" starters.
  const topBooks = books
    .filter((b) => b.status === 'read')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  const lenHint = (len) =>
    len === 'short'
      ? ' Prefer books under ~350 pages.'
      : len === 'long'
        ? ' Prefer longer books (around 500+ pages).'
        : '';
  const genreHint = (g) => (g && g !== 'any' ? ` Focus on the ${g} genre.` : '');

  const fetchIdeas = async (q, append, len = length, gen = genre) => {
    const id = ++requestId.current; // a newer search supersedes this one
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setResults([]);
      seen.current = [];
      saveCache(uid, { seen: seen.current });
    }
    setQuery(q);
    setLastQuery(q);
    const seed = makeSeed();
    try {
      const list = await fetchRecommendations({
        generate: api.generateAI,
        buildPrompt: (avoid, count) =>
          `A reader is looking for: "${q}". Recommend ${count} books that fit this mood or request.${lenHint(len)}${genreHint(gen)} ` +
          (avoid.length ? `Do not recommend any of these: ${avoid.map((t) => `"${t}"`).join(', ')}. ` : '') +
          `Offer real, well-regarded variety (seed ${seed}). ${SUGGEST_FORMAT}`,
        shelf: books, // every status — want to read, reading, finished, DNF
        exclude: seen.current,
        want: 6,
      });
      if (id !== requestId.current) return;
      seen.current.push(...list);
      setResults((prev) => (append ? [...prev, ...list] : list));
      if (append && !list.length) toast.success('That’s everything new for this search — try another mood.');
    } catch (e) {
      if (id !== requestId.current) return;
      if (!append) setResults([]);
      toast.error(e.message || 'Could not fetch ideas. Try again.');
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // A new search starts fresh; "show more" keeps and appends.
  const search = (text) => {
    const q = (text ?? query).trim();
    if (!q) return;
    fetchIdeas(q, false);
  };
  const showMore = () => {
    if (lastQuery) fetchIdeas(lastQuery, true);
  };
  const changeLength = (l) => {
    setLength(l);
    if (lastQuery) fetchIdeas(lastQuery, false, l, genre);
  };
  const changeGenre = (g) => {
    setGenre(g);
    if (lastQuery) fetchIdeas(lastQuery, false, length, g);
  };
  const hide = (s) => {
    setResults((prev) => prev.filter((r) => r !== s)); // stays in `seen`, so it won't come back
  };
  const addFromCard = async (book) => {
    const ok = await onAdd(book);
    if (ok) setAdded((prev) => new Set(prev).add(suggestionKey(book)));
    return ok;
  };
  const surprise = () => search(randomMood());

  if (guest) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center animate-in fade-in">
        <Compass size={40} className="text-brand-500 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-ink mb-2">Discover your next read</h2>
        <p className="text-stone-500">
          AI-curated recommendations are part of a free account. Create one to explore books by mood and add them to your shelf.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 mb-20 animate-in fade-in duration-500">
      <PageHeader
        icon={Compass}
        title="Discover"
        subtitle="Tell me what you're in the mood for and I'll find books to explore."
      />

      {/* Prompt */}
      <form
        onSubmit={(e) => { e.preventDefault(); search(); }}
        className="max-w-2xl mx-auto flex gap-2 mb-4"
      >
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Describe what you feel like reading"
            placeholder="e.g. a cozy mystery, something like Project Hail Mary, short literary fiction…"
            className="w-full bg-surface border border-stone-300 rounded-full pl-11 pr-4 py-3 text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading || !query.trim()} className="shrink-0">
          <Sparkles size={16} /> <span className="hidden sm:inline">Find books</span>
        </Button>
      </form>

      {/* Because you loved … */}
      {topBooks.length > 0 && (
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center items-center gap-2 mb-3">
          <span className="text-xs text-stone-400 uppercase tracking-wider">Because you loved</span>
          {topBooks.map((b) => (
            <button
              key={b._id}
              onClick={() => search(`books similar to "${b.title}" by ${b.author}`)}
              className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-3.5 py-1.5 hover:bg-brand-100 transition-colors"
            >
              {b.title.length > 26 ? `${b.title.slice(0, 26)}…` : b.title}
            </button>
          ))}
        </div>
      )}

      {/* Mood chips */}
      <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2 mb-4">
        <Button variant="soft" size="sm" onClick={surprise}>
          <Sparkles size={14} /> Surprise me
        </Button>
        {MOODS.map((m) => (
          <Chip key={m} onClick={() => search(m)}>{m}</Chip>
        ))}
      </div>

      {/* Refine: length + genre */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
        <div className="inline-flex bg-surface border border-stone-200 rounded-full p-1">
          {[['any', 'Any length'], ['short', 'Short'], ['long', 'Long']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => changeLength(id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                length === id ? 'bg-brand-500 text-white' : 'text-stone-600 hover:text-brand-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={genre}
          onChange={(e) => changeGenre(e.target.value)}
          aria-label="Genre"
          className="text-sm font-medium text-stone-600 bg-surface border border-stone-200 rounded-full px-4 py-2 hover:border-brand-300 transition-colors cursor-pointer"
        >
          <option value="any">Any genre</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16">
          <BookLoader label="Hunting down your next read…" />
        </div>
      ) : visible.length > 0 ? (
        <>
          <p className="text-sm text-stone-500 max-w-5xl mx-auto mb-3 px-1">Ideas for “{lastQuery}”</p>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {visible.map((s, i) => {
              const key = suggestionKey(s);
              return (
                <DiscoverCard
                  key={key}
                  s={s}
                  inLibrary={onShelf(s)}
                  added={added.has(key)}
                  onAdd={addFromCard}
                  onHide={() => hide(s)}
                  eager={i < ABOVE_FOLD}
                />
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Button variant="soft" onClick={showMore} disabled={loadingMore} className="px-6">
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Show more
            </Button>
          </div>
        </>
      ) : lastQuery ? (
        <div className="max-w-md mx-auto text-center py-10">
          <p className="text-stone-600">No new books for “{lastQuery}”.</p>
          <p className="text-sm text-stone-500 mt-1">Everything we found is already on your shelf or was dismissed. Try again, or pick another mood.</p>
          <Button variant="soft" size="sm" className="mt-4" onClick={() => search(lastQuery)}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      ) : (
        <p className="text-center text-stone-500 italic py-10">Pick a mood above, or describe what you feel like reading.</p>
      )}
    </div>
  );
}
