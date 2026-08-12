import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, RefreshCw, Plus } from 'lucide-react';
import { randomSpine } from '../../lib/status';
import { resolveCover } from '../../lib/covers';

/**
 * A single recommendation. Resolves its own cover (so it shows on add and in the
 * hover card), and on hover reveals a floating card with the full AI summary and
 * the cover on the right.
 */
function SuggestionRow({ s, onAdd }) {
  const rowRef = useRef(null);
  const [cover, setCover] = useState({ coverUrl: '', spineColor: '' });
  const [pop, setPop] = useState(null);

  useEffect(() => {
    let alive = true;
    resolveCover(s.title, s.author).then((r) => {
      if (alive) setCover(r);
    });
    return () => {
      alive = false;
    };
  }, [s.title, s.author]);

  const showPop = () => {
    const r = rowRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 340;
    const gap = 12;
    let left = r.right + gap;
    if (left + width > window.innerWidth - 8) left = r.left - width - gap;
    left = Math.max(8, left);
    const top = Math.min(r.top, window.innerHeight - 230);
    setPop({ left, top: Math.max(8, top), width });
  };
  const hidePop = () => setPop(null);

  const add = () =>
    onAdd({
      title: s.title,
      author: s.author,
      genre: s.genre || 'Fiction',
      totalPages: s.totalPages || 300,
      coverColor: randomSpine(),
      coverUrl: cover.coverUrl || '',
      spineColor: cover.spineColor || '',
    });

  return (
    <div
      ref={rowRef}
      onMouseEnter={showPop}
      onMouseLeave={hidePop}
      className="flex items-start justify-between bg-paper p-2.5 rounded-xl border border-stone-100 group hover:border-brand-200 transition-colors"
    >
      <div className="pr-4 min-w-0">
        <p className="font-semibold text-sm text-ink truncate">{s.title}</p>
        <p className="text-xs text-stone-500 truncate">{s.author}</p>
        {s.blurb && <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-snug">{s.blurb}</p>}
      </div>
      <button
        onClick={add}
        className="mt-0.5 p-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Add to collection"
        aria-label={`Add ${s.title}`}
      >
        <Plus size={16} />
      </button>

      {pop &&
        createPortal(
          <div
            style={{ position: 'fixed', left: pop.left, top: pop.top, width: pop.width, zIndex: 80 }}
            className="bg-surface border border-stone-200 rounded-2xl shadow-2xl p-4 flex gap-4 pointer-events-none animate-in fade-in zoom-in-95"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-ink leading-snug">{s.title}</p>
              <p className="text-xs text-stone-500 mb-2">
                {s.author}
                {s.genre ? ` · ${s.genre}` : ''}
                {s.totalPages ? ` · ${s.totalPages} pp` : ''}
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {s.summary || s.blurb || 'A great next read.'}
              </p>
            </div>
            <div className="w-24 shrink-0">
              {cover.coverUrl ? (
                <img src={cover.coverUrl} alt="" className="w-24 h-36 object-cover rounded-lg shadow-md" />
              ) : (
                <div
                  className="w-24 h-36 rounded-lg shadow-md flex items-center justify-center p-2 text-center"
                  style={{ backgroundColor: cover.spineColor || 'var(--color-brand-300)' }}
                >
                  <span className="text-white text-[10px] font-bold leading-tight line-clamp-4">{s.title}</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * AI recommendation panel. Hover a row for a full summary + cover.
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
            className="text-stone-400 hover:text-brand-600 transition-colors p-1 rounded-md hover:bg-stone-100"
            title="Refresh suggestions"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-status-dnf transition-colors p-1 rounded-md hover:bg-stone-100"
            title="Close"
          >
            <Plus size={16} className="rotate-45" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <SuggestionRow key={`${s.title}-${i}`} s={s} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
}
