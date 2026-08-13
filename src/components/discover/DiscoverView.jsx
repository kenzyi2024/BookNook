import { useState, useEffect, useRef } from 'react';
import { Sparkles, Search, Plus, Check, Compass, RefreshCw } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import { resolveCover } from '../../lib/covers';
import { randomSpine } from '../../lib/status';
import { SUGGEST_FORMAT, parseSuggestions } from '../../lib/aiBooks';
import BookLoader from '../ui/BookLoader';

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

function DiscoverCard({ s, owned, onAdd }) {
  const [cover, setCover] = useState({ coverUrl: '', spineColor: '' });
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveCover(s.title, s.author).then((r) => {
      if (alive) setCover(r);
    });
    return () => {
      alive = false;
    };
  }, [s.title, s.author]);

  const inLibrary = owned.some((b) => b.title.toLowerCase() === s.title.toLowerCase());

  const add = async () => {
    setBusy(true);
    const ok = await onAdd({
      title: s.title,
      author: s.author,
      genre: s.genre || 'Fiction',
      totalPages: s.totalPages || 300,
      status: 'want_to_read',
      coverColor: randomSpine(),
      coverUrl: cover.coverUrl || '',
      spineColor: cover.spineColor || '',
    });
    setBusy(false);
    if (ok) setAdded(true);
  };

  return (
    <div className="bg-surface border border-stone-200 rounded-2xl p-4 flex gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="w-16 shrink-0">
        {cover.coverUrl ? (
          <img src={cover.coverUrl} alt="" className="w-16 h-24 object-cover rounded-lg shadow" />
        ) : (
          <div
            className="w-16 h-24 rounded-lg shadow flex items-center justify-center p-1 text-center"
            style={{ backgroundColor: cover.spineColor || 'var(--color-brand-300)' }}
          >
            <span className="text-white text-[9px] font-bold leading-tight line-clamp-4">{s.title}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <p className="font-display font-bold text-ink leading-snug line-clamp-2">{s.title}</p>
        <p className="text-xs text-stone-500 mb-1.5">
          {s.author}
          {s.genre ? ` · ${s.genre}` : ''}
        </p>
        <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 flex-1">{s.summary || s.blurb}</p>
        <div className="mt-3">
          {inLibrary || added ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-read">
              <Check size={14} /> {added ? 'Added to Want to Read' : 'In your library'}
            </span>
          ) : (
            <button
              onClick={add}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-3.5 py-1.5 hover:bg-brand-100 disabled:opacity-50 transition-colors"
            >
              <Plus size={15} /> Add to shelf
            </button>
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
  const { guest } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [lastQuery, setLastQuery] = useState('');
  const seen = useRef(new Set());

  const run = async (text) => {
    const q = (text ?? query).trim();
    if (!q) return;
    setQuery(q);
    setLastQuery(q);
    setLoading(true);
    setResults([]);
    try {
      const seed = makeSeed();
      const avoid = [...books.map((b) => b.title), ...seen.current];
      const prompt =
        `A reader is looking for: "${q}". Recommend 6 books that fit this mood or request. ` +
        (avoid.length ? `Avoid these: ${avoid.map((t) => `"${t}"`).join(', ')}. ` : '') +
        `Offer real, well-regarded variety (seed ${seed}). ${SUGGEST_FORMAT}`;
      const raw = await api.generateAI(prompt);
      const parsed = parseSuggestions(raw).filter(
        (s) => !books.some((b) => b.title.toLowerCase() === s.title.toLowerCase())
      );
      const fresh = parsed.filter((s) => !seen.current.has(s.title.toLowerCase()));
      const list = fresh.length ? fresh : parsed;
      list.forEach((s) => seen.current.add(s.title.toLowerCase()));
      setResults(list);
    } catch (e) {
      setResults([]);
      toast.error(e.message || 'Could not fetch ideas. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickMood = (m) => {
    seen.current.clear();
    run(m);
  };

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
    <div className="mt-4 mb-20 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Compass size={28} className="text-brand-600 drop-shadow-sm" />
          <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
            Discover
          </h2>
        </div>
        <p className="text-stone-500">Tell me what you're in the mood for and I'll find books to explore.</p>
      </div>

      {/* Prompt */}
      <form
        onSubmit={(e) => { e.preventDefault(); run(); }}
        className="max-w-2xl mx-auto flex gap-2 mb-4"
      >
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. a cozy mystery, something like Project Hail Mary, short literary fiction…"
            className="w-full bg-surface border border-stone-300 rounded-full pl-11 pr-4 py-3 text-ink placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-5 rounded-full flex items-center gap-2 transition-colors shrink-0"
        >
          <Sparkles size={16} /> <span className="hidden sm:inline">Find books</span>
        </button>
      </form>

      {/* Mood chips */}
      <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2 mb-8">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => pickMood(m)}
            className="text-sm text-stone-600 bg-surface border border-stone-200 rounded-full px-3.5 py-1.5 hover:border-brand-300 hover:text-brand-600 transition-colors"
          >
            {m}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16">
          <BookLoader label="Hunting down your next read…" />
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="flex items-center justify-between max-w-5xl mx-auto mb-3 px-1">
            <p className="text-sm text-stone-500">Ideas for “{lastQuery}”</p>
            <button
              onClick={() => run(lastQuery)}
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-600 transition-colors"
            >
              <RefreshCw size={14} /> More
            </button>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((s, i) => (
              <DiscoverCard key={`${s.title}-${i}`} s={s} owned={books} onAdd={onAdd} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-stone-400 italic py-10">Pick a mood above, or describe what you feel like reading.</p>
      )}
    </div>
  );
}
