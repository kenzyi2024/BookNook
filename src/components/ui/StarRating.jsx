import { Star } from 'lucide-react';

/**
 * Precise decimal star rating (e.g. 3.78 → 75.6% of the fifth star filled).
 */
export default function StarRating({ value = 0, size = 24 }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <div className="flex items-center relative" aria-label={`Rating: ${value} out of 5`}>
      <div className="flex gap-1 text-stone-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className="fill-current" />
        ))}
      </div>
      <div
        className="flex gap-1 text-brand-400 absolute top-0 left-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={`f-${i}`} size={size} className="fill-current flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}
