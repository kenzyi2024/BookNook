import { Sparkles, RefreshCw, Plus } from 'lucide-react';
import { randomSpine } from '../../lib/status';

/**
 * AI recommendation panel shown under an empty shelf.
 */
export default function SuggestionsPanel({
  title,
  suggestions,
  loading,
  onRefresh,
  onClose,
  onAdd,
}) {
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
          <div
            key={`${s.title}-${i}`}
            className="flex items-start justify-between bg-paper p-2.5 rounded-xl border border-stone-100 group hover:border-brand-200 transition-colors"
          >
            <div className="pr-4 min-w-0">
              <p className="font-semibold text-sm text-ink truncate">{s.title}</p>
              <p className="text-xs text-stone-500 truncate">{s.author}</p>
              {s.blurb && <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-snug">{s.blurb}</p>}
            </div>
            <button
              onClick={() =>
                onAdd({
                  title: s.title,
                  author: s.author,
                  genre: s.genre || 'Fiction',
                  totalPages: s.totalPages || 300,
                  coverColor: randomSpine(),
                })
              }
              className="p-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Add to collection"
              aria-label={`Add ${s.title}`}
            >
              <Plus size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
