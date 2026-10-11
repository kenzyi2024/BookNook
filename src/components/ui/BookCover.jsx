import { useState } from 'react';
import { isImageReady, isImageFailed, markImageLoaded, markImageFailed } from '../../lib/imageCache';

/**
 * A book cover that always looks intentional. A branded, spine-tinted placeholder
 * (with the title) holds the cover's exact box from the first paint, so nothing
 * shifts or collapses; the real cover appears over it once decoded; a failed or
 * missing image keeps the placeholder. A reader never sees a blank box, a
 * spinner, or a broken-image glyph.
 *
 * Covers already loaded anywhere in this session (see lib/imageCache) paint at
 * full opacity immediately — no fade — so re-mounting a cover (a hover card
 * reopening, navigating back to a view) never looks like a reload.
 *
 * Size the cover via `className` (e.g. "w-16 h-24"). `titleClass` scales the
 * fallback title text; pass `showTitle={false}` for very small thumbnails.
 * `priority="high"` loads eagerly with high fetch priority — use it only for
 * covers in the initial viewport.
 */
export default function BookCover({
  book,
  className = '',
  rounded = 'rounded-md',
  showTitle = true,
  titleClass = 'text-[10px]',
  priority = 'auto',
}) {
  const url = book?.coverUrl || '';
  // Load state is tracked per URL, so a new cover (e.g. "Refresh cover") starts
  // clean instead of inheriting the previous image's loaded/failed flags.
  // `instant`: this URL already loaded somewhere this session, so skip the fade.
  // `loaded`: this <img> has fired load — only then is the placeholder hidden,
  // so even a cover the browser has to refetch never shows an empty box.
  const fresh = () => ({ url, loaded: false, instant: isImageReady(url) });
  const [state, setState] = useState(fresh);
  const current = state.url === url ? state : fresh();
  if (current !== state) setState(current);

  const failed = isImageFailed(url) && !current.loaded;
  const shade = book?.spineColor || '';
  const tintClass = shade ? '' : (book?.coverColor || 'bg-brand-400');
  const showImg = Boolean(url) && !failed;
  const imgVisible = showImg && (current.loaded || current.instant);
  const placeholderVisible = !(showImg && current.loaded);
  const fade = current.instant ? '' : 'transition-opacity duration-300';

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${tintClass} ${className}`}
      style={shade ? { backgroundColor: shade } : undefined}
    >
      {/* Branded placeholder — a spine sliver + the title, so it reads as a cover. */}
      <div className={`absolute inset-0 ${fade} ${placeholderVisible ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!placeholderVisible}>
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
          alt={book?.title ? `Cover of ${book.title}` : 'Book cover'}
          loading={priority === 'high' || current.instant ? 'eager' : 'lazy'}
          fetchPriority={priority === 'high' ? 'high' : undefined}
          decoding="async"
          onLoad={() => {
            markImageLoaded(url);
            setState((s) => (s.url === url ? { ...s, loaded: true } : s));
          }}
          onError={() => {
            markImageFailed(url);
            setState((s) => (s.url === url ? { ...s, loaded: false } : s));
          }}
          className={`absolute inset-0 w-full h-full object-cover ${fade} ${imgVisible ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}
