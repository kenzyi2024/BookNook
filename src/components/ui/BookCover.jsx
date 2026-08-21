import { useState } from 'react';

/**
 * A book cover that always looks intentional. A branded, spine-tinted placeholder
 * (with the title) shows instantly; the real cover fades in over it once decoded;
 * a failed load falls back to the placeholder. So a reader never sees a blank box,
 * a spinner, or a broken-image glyph while a cover resolves.
 *
 * Size the cover via `className` (e.g. "w-16 h-24"). `titleClass` scales the
 * fallback title text; pass `showTitle={false}` for very small thumbnails.
 */
export default function BookCover({
  book,
  className = '',
  rounded = 'rounded-md',
  showTitle = true,
  titleClass = 'text-[10px]',
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const url = book?.coverUrl || '';
  const shade = book?.spineColor || '';
  const tintClass = shade ? '' : (book?.coverColor || 'bg-brand-400');
  const showImg = Boolean(url) && !failed;

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${tintClass} ${className}`}
      style={shade ? { backgroundColor: shade } : undefined}
    >
      {/* Branded placeholder — a spine sliver + the title, so it reads as a cover. */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${showImg && loaded ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20" />
        {showTitle ? (
          <span className={`absolute inset-x-0 bottom-0 px-1.5 pb-1 text-white/95 font-display font-semibold leading-tight line-clamp-3 drop-shadow ${titleClass}`}>
            {book?.title}
          </span>
        ) : null}
      </div>

      {showImg ? (
        <img
          src={url}
          alt={book?.title || 'Book cover'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setFailed(true); setLoaded(false); }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}
