import { useEffect, useState } from 'react';
import { resolveCover } from '../../lib/covers';

// Small accent color per reading status, shown as a dot near the spine foot.
const STATUS_DOT = {
  reading: '#e0a13a',
  read: '#4c9a76',
  want_to_read: '#8aa0c4',
  dnf: '#c98a8a',
};

/**
 * A book rendered as a clean, characterful spine: just the title runs down the
 * spine, framed by raised head/tail bands and a thin foil line, with a small
 * status dot and a progress sliver. The spine is tinted by the cover's dominant
 * color (fetched from Open Library, cached) and the real cover appears in the
 * hover card. Falls back to the book's `coverColor` when no cover is found.
 */
export default function BookSpine({ book, onSelect }) {
  const height = Math.max(150, Math.min(230, 120 + book.totalPages * 0.14));
  const width = Math.max(46, Math.min(66, 40 + book.totalPages * 0.045));
  const progress = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100) || 0);
  const dot = STATUS_DOT[book.status] || STATUS_DOT.want_to_read;

  const [cover, setCover] = useState({ coverUrl: book.coverUrl || '', spineColor: '' });

  useEffect(() => {
    let alive = true;
    resolveCover(book.title, book.author, book.coverUrl || '').then((r) => {
      if (alive) setCover(r);
    });
    return () => {
      alive = false;
    };
  }, [book.title, book.author, book.coverUrl]);

  const tinted = Boolean(cover.spineColor);

  return (
    <button
      onClick={() => onSelect(book)}
      aria-label={`Open ${book.title}`}
      className={`${tinted ? '' : book.coverColor} rounded-sm shadow-[2px_0_6px_rgba(0,0,0,0.35)] cursor-pointer hover:-translate-y-3 transition-transform duration-300 relative group/spine flex flex-col items-center`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        flexShrink: 0,
        ...(tinted ? { backgroundColor: cover.spineColor } : null),
      }}
    >
      {/* edge highlights for a rounded, printed look */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-r-sm" />
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/25 rounded-l-sm" />

      {/* head band + foil line */}
      <div className="w-full h-2 bg-white/15 mt-2.5 shrink-0" />
      <div className="h-[2px] mt-1.5 rounded-full bg-amber-200/80 shrink-0" style={{ width: '62%' }} />

      {/* vertical title only — author + detail live in the hover card */}
      <div className="flex-1 min-h-0 flex items-center justify-center py-2 px-0.5">
        <span
          className="font-display font-bold text-white text-[13px] leading-tight tracking-wide drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: `${height - 70}px` }}
        >
          {book.title}
        </span>
      </div>

      {/* foil line + tail band */}
      <div className="h-[2px] mb-1.5 rounded-full bg-amber-200/80 shrink-0" style={{ width: '62%' }} />
      <span
        className="w-2 h-2 rounded-full mb-2.5 shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: dot }}
      />

      {/* progress sliver */}
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div className="h-full bg-amber-300/90" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* hover card — now with the real cover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/spine:opacity-100 transition-opacity duration-200 w-52 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none text-left">
        <div className="flex gap-3">
          {cover.coverUrl ? (
            <img
              src={cover.coverUrl}
              alt={`${book.title} cover`}
              className="w-12 h-[72px] object-cover rounded shadow shrink-0"
            />
          ) : (
            <div
              className={`w-12 h-[72px] rounded shadow shrink-0 ${tinted ? '' : book.coverColor}`}
              style={tinted ? { backgroundColor: cover.spineColor } : undefined}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm leading-snug mb-0.5 line-clamp-2">{book.title}</p>
            <p className="text-stone-300 truncate mb-2">{book.author}</p>
            <div className="w-full bg-stone-700 rounded-full h-1.5 mb-1 overflow-hidden">
              <div className="bg-brand-400 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>{book.currentPage || 0} / {book.totalPages}</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
