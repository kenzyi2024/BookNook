import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Plus, ChevronDown } from 'lucide-react';
import { randomSpine } from '../../lib/status';
import { resolveCover } from '../../lib/covers';
import { preloadImage } from '../../lib/imageCache';
import { suggestionKey } from '../../lib/recommendations';
import BookCover from '../ui/BookCover';

/**
 * A single recommendation: cover, title, author and a one-line blurb, with the
 * full spoiler-free summary one click away (works with touch and keyboard, not
 * just hover). The cover is resolved and preloaded as soon as the row appears.
 */
function SuggestionRow({ s, onAdd }) {
  const [cover, setCover] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveCover(s.title, s.author).then((r) => {
      if (!alive) return;
      setCover(r.coverUrl);
      preloadImage(r.coverUrl, { priority: 'high' });
    });
    return () => {
      alive = false;
    };
  }, [s.title, s.author]);

  const add = async () => {
    setBusy(true);
    try {
      await onAdd({
        title: s.title,
        author: s.author,
        genre: s.genre || 'Fiction',
        totalPages: s.totalPages || 300,
        coverColor: randomSpine(),
        coverUrl: cover || '',
        // Keep the summary the reader saw, attached to this exact book.
        summary: s.summary || '',
      });
    } finally {
      setBusy(false);
    }
  };

  const summaryId = `sugg-${suggestionKey(s).replace(/[^a-z0-9]+/gi, '-')}`;
  const hasMore = Boolean(s.summary) && s.summary !== s.blurb;

  return (
    <div className="flex items-start gap-3 bg-paper p-2.5 rounded-xl border border-stone-100 hover:border-brand-200 transition-colors">
      <BookCover
        book={{ coverUrl: cover, title: s.title }}
        rounded="rounded"
        className="w-10 h-[60px] shadow-sm shrink-0"
        showTitle={false}
        priority="high"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-ink truncate">{s.title}</p>
        <p className="text-xs text-stone-500 truncate">
          {s.author}
          {s.totalPages ? ` · ${s.totalPages} pp` : ''}
        </p>
        {s.blurb && <p className="text-xs text-stone-500 mt-1 leading-snug">{s.blurb}</p>}
        {hasMore && (
          <>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={summaryId}
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              {open ? 'Hide summary' : 'Read summary'}
              <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <p id={summaryId} className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {s.summary}
              </p>
            )}
          </>
        )}
      </div>
      <button
        onClick={add}
        disabled={busy}
        className="mt-0.5 p-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 disabled:opacity-50 transition-colors shrink-0"
        title="Add to Want to Read"
        aria-label={`Add ${s.title} to Want to Read`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/**
 * AI recommendation panel. Suggestions are already filtered against the
 * reader's shelf; an empty list gets an explicit "nothing new" state.
 */
export default function SuggestionsPanel({ title, suggestions, loading, onRefresh, onClose, onAdd }) {
  return (
    <div className="mt-2 bg-surface border border-stone-200 rounded-2xl p-4 shadow-md w-full max-w-md z-30 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-display font-semibold text-brand-700 flex items-center gap-2 text-sm">
          <Sparkles size={14} className="text-brand-400" />
          {title}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-stone-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-stone-100"
            title="Refresh suggestions"
            aria-label="Refresh suggestions"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-status-dnf transition-colors p-1 rounded-md hover:bg-stone-100"
            title="Close"
            aria-label="Close suggestions"
          >
            <Plus size={16} className="rotate-45" />
          </button>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <SuggestionRow key={suggestionKey(s)} s={s} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-stone-600">No new suggestions right now.</p>
          <p className="text-xs text-stone-500 mt-1">Everything we found is already on your shelf.</p>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Try again
          </button>
        </div>
      )}
    </div>
  );
}
