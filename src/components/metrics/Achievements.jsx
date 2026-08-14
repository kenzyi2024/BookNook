import { BookOpen, Library, Trophy, Layers, Flame, Compass, Star, Quote, Ruler, Lock } from 'lucide-react';
import { normalizeGenre } from '../../lib/genres';

/**
 * Reading achievements — a gentle, cozy badge wall. Earned badges glow in the
 * theme color; locked ones are dimmed with a hint on how to earn them. No emojis:
 * every badge uses the app's line-icon art.
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
    { id: 'first', label: 'First Page', Icon: BookOpen, earned: finished >= 1, hint: 'Finish your first book' },
    { id: 'bookworm', label: 'Bookworm', Icon: Library, earned: finished >= 10, hint: 'Finish 10 books' },
    { id: 'voracious', label: 'Voracious', Icon: Trophy, earned: finished >= 25, hint: 'Finish 25 books' },
    { id: 'marathon', label: 'Marathoner', Icon: Layers, earned: totalPagesRead >= 10000, hint: 'Read 10,000 pages' },
    { id: 'streak7', label: 'On Fire', Icon: Flame, earned: streak >= 7, hint: 'Reach a 7-day streak' },
    { id: 'streak30', label: 'Devoted', Icon: Flame, earned: streak >= 30, hint: 'Reach a 30-day streak' },
    { id: 'eclectic', label: 'Eclectic', Icon: Compass, earned: genres >= 5, hint: 'Read across 5 genres' },
    { id: 'critic', label: 'Critic', Icon: Star, earned: ratedCount >= 10, hint: 'Rate 10 books' },
    { id: 'collector', label: 'Collector', Icon: Quote, earned: quotesCount >= 25, hint: 'Save 25 quotes' },
    { id: 'chunky', label: 'Doorstopper', Icon: Ruler, earned: longestFinished >= 600, hint: 'Finish a 600+ page book' },
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
        {BADGES.map(({ id, label, Icon, earned, hint }) => (
          <div
            key={id}
            title={earned ? label : hint}
            className={`relative flex flex-col items-center text-center gap-2 rounded-2xl p-4 border transition-colors ${
              earned
                ? 'bg-brand-50 border-brand-200'
                : 'bg-stone-50 border-stone-200/70 opacity-70'
            }`}
          >
            <span
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                earned ? 'bg-brand-500 text-white shadow-sm' : 'bg-stone-200 text-stone-400'
              }`}
            >
              {earned ? <Icon size={20} /> : <Lock size={16} />}
            </span>
            <span className={`text-xs font-semibold leading-tight ${earned ? 'text-brand-800' : 'text-stone-400'}`}>
              {label}
            </span>
            {!earned && <span className="text-[10px] text-stone-400 leading-tight">{hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
