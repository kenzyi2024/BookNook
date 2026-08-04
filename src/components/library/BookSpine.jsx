/**
 * A single book rendered as a spine on the shelf, with a hover tooltip showing
 * title, author, and reading progress.
 */
export default function BookSpine({ book, onSelect }) {
  const height = Math.max(120, Math.min(220, 100 + book.totalPages * 0.15));
  const width = Math.max(35, Math.min(55, 30 + book.totalPages * 0.05));
  const progress = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100) || 0);

  return (
    <button
      onClick={() => onSelect(book)}
      aria-label={`Open ${book.title}`}
      className={`${book.coverColor} rounded-sm shadow-[2px_0_5px_rgba(0,0,0,0.3)] cursor-pointer hover:-translate-y-3 transition-transform duration-300 flex items-center justify-center relative group/spine`}
      style={{ width: `${width}px`, height: `${height}px`, flexShrink: 0 }}
    >
      {/* page edges */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-sm" />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-sm" />

      {/* tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/spine:opacity-100 transition-opacity duration-200 w-48 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none text-left">
        <p className="font-bold text-sm truncate mb-1">{book.title}</p>
        <p className="text-stone-300 truncate mb-2">{book.author}</p>
        <div className="w-full bg-stone-700 rounded-full h-1.5 mb-1 overflow-hidden">
          <div className="bg-brand-400 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-stone-400">
          <span>
            {book.currentPage || 0} / {book.totalPages}
          </span>
          <span>{progress}%</span>
        </div>
      </div>
    </button>
  );
}
