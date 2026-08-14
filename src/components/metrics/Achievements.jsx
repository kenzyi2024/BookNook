import { Trophy, Check } from 'lucide-react';
import { normalizeGenre } from '../../lib/genres';
import BadgeCreature from './BadgeCreature';

/**
 * Reading achievements — a cozy badge wall of little creatures. Each badge always
 * shows what it's for; earned ones come to life in color with a check, unearned
 * ones stay greyed until you get there. Every critter is custom SVG art (no emojis).
 */
export default function Achievements({ books, streak = 0, totalPagesRead = 0 }) {
  const finished = books.filter((b) => b.status === 'read').length;
  const genres = new Set(
    books.filter((b) => b.status === 'read' || b.status === 'reading').map((b) => normalizeGenre(b.genre))
  ).size;
  const ratedCount = books.filter((b) => b.rating > 0).length;
  const quotesCount = books.reduce((n, b) => n + (b.quotes?.length || 0), 0);
  const longestFinished = books
    .filter((b) => b.status === 'read')
    .reduce((max, b) => Math.max(max, b.totalPages || 0), 0);

  const BADGES = [
    { id: 'first', label: 'First Page', desc: 'Finish your first book', earned: finished >= 1 },
    { id: 'bookworm', label: 'Bookworm', desc: 'Finish 10 books', earned: finished >= 10 },
    { id: 'voracious', label: 'Voracious', desc: 'Finish 25 books', earned: finished >= 25 },
    { id: 'marathon', label: 'Marathoner', desc: 'Read 10,000 pages', earned: totalPagesRead >= 10000 },
    { id: 'streak7', label: 'On Fire', desc: 'Reach a 7-day streak', earned: streak >= 7 },
    { id: 'streak30', label: 'Devoted', desc: 'Reach a 30-day streak', earned: streak >= 30 },
    { id: 'eclectic', label: 'Eclectic', desc: 'Read across 5 genres', earned: genres >= 5 },
    { id: 'critic', label: 'Critic', desc: 'Rate 10 books', earned: ratedCount >= 10 },
    { id: 'collector', label: 'Collector', desc: 'Save 25 quotes', earned: quotesCount >= 25 },
    { id: 'chunky', label: 'Doorstopper', desc: 'Finish a 600+ page book', earned: longestFinished >= 600 },
  ];

  const earnedCount = BADGES.filter((b) => b.earned).length;

  return (
    <div className="rounded-3xl border border-brand-100 bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-display font-semibold text-ink flex items-center gap-2">
          <Trophy size={18} className="text-brand-500" /> Achievements
        </h3>
        <span className="text-sm text-stone-400 font-medium">{earnedCount} / {BADGES.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BADGES.map(({ id, label, desc, earned }) => (
          <div
            key={id}
            className={`relative flex flex-col items-center text-center gap-1.5 rounded-2xl p-4 border transition-colors ${
              earned ? 'bg-brand-50 border-brand-200' : 'bg-stone-50 border-stone-200/70'
            }`}
          >
            {earned && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-status-read text-white flex items-center justify-center shadow-sm">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
            <div className={earned ? '' : 'grayscale opacity-40'}>
              <BadgeCreature id={id} />
            </div>
            <span className={`text-sm font-bold leading-tight ${earned ? 'text-brand-800' : 'text-stone-500'}`}>
              {label}
            </span>
            <span className="text-[11px] leading-tight text-stone-400">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
