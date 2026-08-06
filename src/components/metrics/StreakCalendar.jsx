import { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

const keyOf = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

/**
 * Reading streak calendar: a month heatmap of days you logged reading (from
 * session dates), with the book(s) per day on hover, plus current/longest streak.
 */
export default function StreakCalendar({ books }) {
  const [offset, setOffset] = useState(0); // month offset from current

  // Map day -> Set of titles read that day
  const dayMap = {};
  books.forEach((b) =>
    (b.sessions || []).forEach((s) => {
      const k = keyOf(s.date);
      (dayMap[k] = dayMap[k] || new Set()).add(b.title);
    })
  );

  const hasDay = (d) => {
    const set = dayMap[keyOf(d)];
    return set && set.size > 0;
  };

  // Current streak (counts today, or from yesterday if today has none yet)
  let current = 0;
  const cursor = new Date();
  if (!hasDay(cursor)) cursor.setDate(cursor.getDate() - 1);
  while (hasDay(cursor)) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak across all logged days
  const days = Object.keys(dayMap).filter((k) => dayMap[k].size).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  days.forEach((k) => {
    const d = new Date(k);
    if (prev && (d - prev) / 86400000 === 1) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  });

  // Build the visible month grid
  const now = new Date();
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const monthName = view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const isFuture = (d) => d > now;

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-stone-200/70">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-display font-semibold text-ink flex items-center gap-2">
          <Flame size={18} className="text-brand-500" /> Reading Streak
        </h3>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-display font-bold text-2xl text-brand-600 leading-none">{current}</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider">day streak</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-2xl text-ink leading-none">{longest}</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider">longest</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setOffset((o) => o - 1)} className="p-1 text-stone-400 hover:text-brand-600" aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold text-stone-600">{monthName}</span>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="p-1 text-stone-400 hover:text-brand-600 disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-stone-400 font-semibold pb-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const set = dayMap[keyOf(d)];
          const read = set && set.size > 0;
          const titles = read ? Array.from(set).join(', ') : '';
          return (
            <div
              key={i}
              title={read ? `${d.getDate()}: ${titles}` : ''}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                read
                  ? 'bg-brand-500 text-white'
                  : isFuture(d)
                    ? 'bg-stone-50 text-stone-300'
                    : 'bg-stone-100 text-stone-400'
              }`}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
