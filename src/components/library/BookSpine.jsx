/**
 * A book rendered as a labeled spine — the title (and author) run vertically down
 * the spine like a real bookshelf, with a progress sliver and a hover tooltip.
 */
export default function BookSpine({ book, onSelect }) {
  const height = Math.max(150, Math.min(230, 120 + book.totalPages * 0.14));
  const width = Math.max(46, Math.min(66, 40 + book.totalPages * 0.045));
  const progress = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100) || 0);

  return (
    <button
      onClick={() => onSelect(book)}
      aria-label={`Open ${book.title}`}
      className={`${book.coverColor} rounded-sm shadow-[2px_0_6px_rgba(0,0,0,0.35)] cursor-pointer hover:-translate-y-3 transition-transform duration-300 relative group/spine flex flex-col items-center`}
      style={{ width: `${width}px`, height: `${height}px`, flexShrink: 0 }}
    >
      {/* edge highlights */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-sm" />
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/25 rounded-l-sm" />

      {/* top & bottom bands for a booky look */}
      <div className="w-full h-2 bg-white/15 mt-2 shrink-0" />

      {/* vertical title + author */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2 px-0.5">
        <div
          className="flex items-center gap-1 max-h-full"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          <span className="font-display font-bold text-white text-[13px] leading-tight tracking-wide drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxHeight: `${height - 60}px` }}>
            {book.title}
          </span>
          <span className="text-white/70 text-[10px] leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxHeight: `${height - 90}px` }}>
            {book.author}
          </span>
        </div>
      </div>

      <div className="w-full h-2 bg-white/15 mb-2 shrink-0" />

      {/* progress sliver */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div className="h-full bg-amber-300/90" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/spine:opacity-100 transition-opacity duration-200 w-48 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none text-left">
        <p className="font-bold text-sm truncate mb-1">{book.title}</p>
        <p className="text-stone-300 truncate mb-2">{book.author}</p>
        <div className="w-full bg-stone-700 rounded-full h-1.5 mb-1 overflow-hidden">
          <div className="bg-brand-400 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400">
          <span>{book.currentPage || 0} / {book.totalPages}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </button>
  );
}
