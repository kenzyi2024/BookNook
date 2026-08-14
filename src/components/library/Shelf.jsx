import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookSpine from './BookSpine';
import FairyLights from './FairyLights';

/**
 * A horizontal, scrollable shelf of book spines with a title, optional header
 * action (e.g. a filter), and a custom empty state.
 */
export default function Shelf({ icon, title, action, books, onSelect, emptyState, wave, extras, onPersistCover }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
  };

  const hasBooks = books.length > 0;
  const hasExtras = Boolean(extras && extras.length);

  return (
    <div className="relative group">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 pr-4 items-start">
        <div className="flex items-center gap-3 relative z-20">
          {icon}
          <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
            {title}
          </h2>
        </div>
        {action && <div className="relative z-40">{action}</div>}
      </div>

      {hasBooks && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 bottom-16 md:bottom-24 z-40 p-2 bg-surface/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-brand-600 hover:bg-surface rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:scale-110"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 bottom-16 md:bottom-24 z-40 p-2 bg-surface/95 backdrop-blur shadow-lg border border-stone-200 text-stone-500 hover:text-brand-600 hover:bg-surface rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all hover:scale-110"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="relative">
        {(hasBooks || hasExtras) && <FairyLights />}
        <div
          ref={rowRef}
          className={`flex items-end gap-2 px-20 z-30 relative overflow-x-auto flex-nowrap scroll-smooth no-scrollbar ${
            hasBooks || hasExtras ? 'pt-32 -mt-32 min-h-[280px]' : 'min-h-[240px]'
          }`}
        >
          {hasBooks && books.map((book) => <BookSpine key={book._id} book={book} onSelect={onSelect} onPersistCover={onPersistCover} />)}
          {hasExtras && extras}
          {!hasBooks && !hasExtras && (
            <div className="flex flex-col items-start gap-3 mb-8 w-full max-w-md">{emptyState}</div>
          )}
        </div>
      </div>
      {wave}
    </div>
  );
}
