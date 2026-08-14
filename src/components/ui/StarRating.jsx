import { useRef, useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Star rating that can be display-only or interactive.
 *
 *   <StarRating value={3.78} />                       → read-only, decimal fill
 *   <StarRating value={r} onChange={setR} />          → click / drag / arrow keys
 *
 * When interactive, the reader can land on ANY value 0–5 (snapped to 0.1) by
 * where they click across the row, so it isn't limited to whole or half stars.
 */
export default function StarRating({ value = 0, size = 24, onChange }) {
  const rowRef = useRef(null);
  const [hover, setHover] = useState(null);
  const interactive = typeof onChange === 'function';

  const shown = hover ?? value;
  const pct = Math.max(0, Math.min(100, (shown / 5) * 100));

  // Map a pointer x-position across the row to a 0–5 value, snapped to 0.1.
  const valueFromEvent = (e) => {
    const el = rowRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(5, Math.round(ratio * 50) / 10));
  };

  const stars = (className) =>
    [1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={className} />);

  const readOnlyLabel = `Rating: ${value} out of 5`;

  const content = (
    <div ref={rowRef} className="flex items-center relative" aria-hidden={interactive ? true : undefined}>
      <div className="flex gap-1 text-stone-200 dark:text-stone-300/40">{stars('fill-current')}</div>
      <div
        className="flex gap-1 text-brand-400 absolute top-0 left-0 overflow-hidden pointer-events-none"
        style={{ width: `${pct}%` }}
      >
        {stars('fill-current flex-shrink-0')}
      </div>
    </div>
  );

  if (!interactive) {
    return (
      <div aria-label={readOnlyLabel}>{content}</div>
    );
  }

  const step = (delta) => onChange(Math.max(0, Math.min(5, Math.round((value + delta) * 10) / 10)));

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Your rating"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={`${value} out of 5 stars`}
      className="cursor-pointer rounded outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      onMouseMove={(e) => setHover(valueFromEvent(e))}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => onChange(valueFromEvent(e))}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); step(e.shiftKey ? 0.5 : 0.1); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); step(e.shiftKey ? -0.5 : -0.1); }
        else if (e.key === 'Home') { e.preventDefault(); onChange(0); }
        else if (e.key === 'End') { e.preventDefault(); onChange(5); }
      }}
    >
      {content}
    </div>
  );
}
