import { useState } from 'react';
import {
  BarChart2, CheckCircle, BookOpen, Star, XCircle, Clock, Book, Timer,
  Trophy, Ruler, Users, Layers, Library, Sparkles, Flame,
} from 'lucide-react';
import WrappedView from './WrappedView';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import BookCover from '../ui/BookCover';
import { STATUSES } from '../../lib/status';
import { monthKey, monthLabel } from '../../lib/format';
import { normalizeGenre } from '../../lib/genres';
import Card from '../ui/Card';
import StreakCalendar from './StreakCalendar';
import Achievements from './Achievements';

// Distinct categorical palette for the genre pie.
const PIE = ['#C05D22', '#2F855A', '#3B6FB0', '#B23A48', '#7C3AED', '#0D9488', '#CA8A04'];

function buildConicStops(data, total) {
  let acc = 0;
  return data
    .map((d, i) => {
      const start = (acc / total) * 100;
      acc += d.value;
      const end = (acc / total) * 100;
      return `${d.color || PIE[i % PIE.length]} ${start}% ${end}%`;
    })
    .join(', ');
}

// A small book cover thumbnail — shared cover with graceful placeholder/fallback.
function BookThumb({ book, className = '' }) {
  if (!book) return <div className={`bg-stone-100 rounded ${className}`} />;
  return <BookCover book={book} rounded="rounded" className={`shadow-sm ${className}`} titleClass="text-[9px]" />;
}

function Highlight({ label, icon, book, meta }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-stone-200/70 p-4 flex gap-3 items-center hover:shadow-md hover:-translate-y-0.5 transition-all">
      <BookThumb book={book} className="w-12 h-[72px] shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 flex items-center gap-1.5 mb-1">
          {icon} {label}
        </p>
        {book ? (
          <>
            <p className="font-display font-semibold text-ink text-sm leading-snug line-clamp-2">{book.title}</p>
            <p className="text-xs text-stone-500 truncate">{meta}</p>
          </>
        ) : (
          <p className="text-stone-400 italic text-sm">Nothing yet</p>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub }) {
  return (
    <div className="bg-surface p-5 rounded-2xl shadow-sm border border-stone-200/70 flex flex-col justify-center">
      <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2">
        {icon} {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display font-bold text-4xl text-ink leading-tight">{value}</span>
        {sub && <span className="text-stone-400 text-sm font-medium">{sub}</span>}
      </div>
    </div>
  );
}

function Pie({ data, donut = false }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="h-44 flex items-center justify-center text-stone-400 italic">No data yet</div>;
  const stops = buildConicStops(data, total);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <div className="w-40 h-40 rounded-full shadow-inner" style={{ background: `conic-gradient(${stops})` }} />
        {donut && (
          <div className="absolute inset-0 m-auto w-20 h-20 bg-surface rounded-full flex items-center justify-center">
            <span className="font-display font-bold text-xl text-ink">{total}</span>
          </div>
        )}
      </div>
      <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-3 text-sm">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: d.color || PIE[i % PIE.length] }} />
            <span className="font-medium text-ink flex-1 min-w-0 truncate">{d.label}</span>
            <span className="text-stone-500 tabular-nums shrink-0">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ data, color = 'var(--color-brand-500)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.some((d) => d.value > 0))
    return <div className="h-44 flex items-center justify-center text-stone-400 italic">No sessions logged yet</div>;
  return (
    <div className="flex items-end gap-1.5 h-44">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] font-semibold text-stone-500 tabular-nums h-3 leading-none">{d.value || ''}</span>
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-md transition-all group-hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: d.value ? '8px' : '0' }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] text-stone-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function HBars({ data, color = 'var(--color-brand-500)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-10 text-stone-500 shrink-0">{d.label}</span>
          <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color, minWidth: d.value ? '6px' : 0 }} />
          </div>
          <span className="w-6 text-right text-stone-500 tabular-nums">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function HeroStat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {icon ? (
        <span className="w-10 h-10 rounded-xl bg-surface/80 border border-brand-100 flex items-center justify-center text-brand-500 shrink-0">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="font-display font-bold text-2xl md:text-3xl text-ink leading-none">{value}</div>
        <div className="text-stone-500 text-[11px] font-semibold uppercase tracking-wider mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

// A wall of the real covers of finished books — the most personal, "alive" view.
function CoverWall({ books }) {
  if (!books.length) return null;
  return (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-stone-200/70">
      <h3 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
        <Library size={18} className="text-brand-500" /> On Your Shelf
        <span className="text-stone-400 text-sm font-normal">· {books.length} finished</span>
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {books.map((b) => (
          <BookThumb
            key={b._id}
            book={b}
            className="w-12 h-[72px] hover:-translate-y-1 transition-transform duration-200"
          />
        ))}
      </div>
    </div>
  );
}

// Auto-generated "reading personality" lines from data that's always present.
function buildInsights({ read, dnf, avgPages, avgRating, topGenre, longestBook }) {
  const out = [];
  if (topGenre) out.push({ icon: <Book size={15} />, text: `You lean toward ${topGenre}` });
  if (avgPages) {
    out.push({
      icon: <Ruler size={15} />,
      text:
        avgPages > 420
          ? `Doorstopper devotee — ~${avgPages} pages a book`
          : avgPages < 260
            ? `Quick reads — ~${avgPages} pages a book`
            : `Steady ~${avgPages} pages a book`,
    });
  }
  if (avgRating !== '—') {
    const r = Number(avgRating);
    out.push({
      icon: <Star size={15} />,
      text: r >= 4.3 ? `Generous rater — ${avgRating}★ average` : r <= 3 ? `Tough critic — ${avgRating}★ average` : `Balanced rater — ${avgRating}★ average`,
    });
  }
  const attempts = read.length + dnf.length;
  if (attempts >= 3) {
    const rate = Math.round((read.length / attempts) * 100);
    out.push({
      icon: <CheckCircle size={15} />,
      text: rate >= 85 ? `A finisher — ${rate}% completion rate` : `You finish ${rate}% of what you start`,
    });
  }
  if (longestBook?.totalPages) {
    out.push({ icon: <Trophy size={15} />, text: `Biggest conquest: ${longestBook.title}` });
  }
  return out;
}

function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}

export default function MetricsView({ books }) {
  const [showWrapped, setShowWrapped] = useState(false);
  const read = books.filter((b) => b.status === 'read');
  const reading = books.filter((b) => b.status === 'reading');
  const dnf = books.filter((b) => b.status === 'dnf');

  const totalPagesRead =
    read.reduce((s, b) => s + (b.totalPages || 0), 0) +
    reading.reduce((s, b) => s + (b.currentPage || 0), 0);

  const rated = read.filter((b) => typeof b.rating === 'number' && b.rating > 0);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—';
  const avgPages = read.length ? Math.round(read.reduce((s, b) => s + (b.totalPages || 0), 0) / read.length) : 0;

  // Total & longest reading time from logged sessions.
  let longest = 0;
  let totalMinutes = 0;
  books.forEach((b) => (b.sessions || []).forEach((s) => {
    totalMinutes += s.minutes || 0;
    if ((s.minutes || 0) > longest) longest = s.minutes;
  }));
  const hoursRead = Math.round(totalMinutes / 60);

  const wantCount = books.filter((b) => b.status === 'want_to_read').length;

  // Current reading streak: consecutive days with a logged session, ending today
  // (or yesterday, so a missed "today" doesn't instantly zero it out).
  const sessionDays = new Set();
  books.forEach((b) => (b.sessions || []).forEach((s) => {
    if (s.date) sessionDays.add(new Date(s.date).toISOString().slice(0, 10));
  }));
  const hasDay = (i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return sessionDays.has(d.toISOString().slice(0, 10));
  };
  let streak = 0;
  const startI = hasDay(0) ? 0 : hasDay(1) ? 1 : -1;
  if (startI >= 0) for (let i = startI; hasDay(i); i++) streak += 1;

  // This calendar year
  const year = new Date().getFullYear();
  const inYear = (d) => d && new Date(d).getFullYear() === year;
  const finishedThisYear = read.filter((b) => inYear(b.finishedAt || b.updatedAt)).length;

  // Playful: a finished-book stack is ~2.3 cm per book.
  const stackCm = Math.round(read.length * 2.3);
  const stack = stackCm >= 100 ? `${(stackCm / 100).toFixed(1)} m` : `${stackCm} cm`;

  // Highlights
  const topRated = [...rated].sort((a, b) => b.rating - a.rating || (b.totalPages || 0) - (a.totalPages || 0))[0];
  const longestBook = [...books].filter((b) => b.totalPages).sort((a, b) => b.totalPages - a.totalPages)[0];
  const latestFinish = [...read].filter((b) => b.finishedAt).sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))[0];
  const currentRead = [...reading].sort(
    (a, b) => (b.currentPage / b.totalPages || 0) - (a.currentPage / a.totalPages || 0)
  )[0];
  const curPct = currentRead ? Math.min(100, Math.round((currentRead.currentPage / currentRead.totalPages) * 100) || 0) : 0;

  // Genre pie (top 6 + Other), normalized
  const counted = books.filter((b) => b.status === 'read' || b.status === 'reading');
  const gc = {};
  counted.forEach((b) => { const g = normalizeGenre(b.genre); gc[g] = (gc[g] || 0) + 1; });
  const sortedG = Object.entries(gc).sort((a, b) => b[1] - a[1]);
  const topG = sortedG.slice(0, 6);
  const otherG = sortedG.slice(6).reduce((s, [, v]) => s + v, 0);
  const genreData = topG.map(([label, value], i) => ({ label, value, color: PIE[i % PIE.length] }));
  if (otherG) genreData.push({ label: 'Other', value: otherG, color: '#9CA3AF' });

  // Top authors
  const ac = {};
  counted.forEach((b) => { const a = (b.author || 'Unknown').split(',')[0].trim(); ac[a] = (ac[a] || 0) + 1; });
  const topAuthors = Object.entries(ac).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Status donut
  const statusData = Object.entries(STATUSES)
    .map(([key, meta]) => ({ label: meta.short, value: books.filter((b) => b.status === key).length, color: meta.color }))
    .filter((d) => d.value > 0);

  // Per-month trends (last 12 months)
  const months = lastMonths(12);
  const finishedByMonth = Object.fromEntries(months.map((m) => [m, 0]));
  read.forEach((b) => { const key = monthKey(b.finishedAt || b.updatedAt); if (key in finishedByMonth) finishedByMonth[key] += 1; });
  const pagesByMonth = Object.fromEntries(months.map((m) => [m, 0]));
  books.forEach((b) => (b.sessions || []).forEach((s) => { const key = monthKey(s.date); if (key in pagesByMonth) pagesByMonth[key] += s.pagesRead || 0; }));
  const booksMonthData = months.map((m) => ({ label: monthLabel(m), value: finishedByMonth[m] }));
  const pagesMonthData = months.map((m) => ({ label: monthLabel(m), value: pagesByMonth[m] }));
  const hasFinishMonths = booksMonthData.some((d) => d.value > 0);
  const hasPagesMonths = pagesMonthData.some((d) => d.value > 0);

  // Rating distribution
  const ratingData = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star}★`,
    value: rated.filter((b) => Math.round(b.rating) === star).length,
  }));

  // Reading pace / projection for the current year
  const monthIdx = new Date().getMonth() + 1; // 1..12
  const projectedYear = finishedThisYear > 0 ? Math.round((finishedThisYear / monthIdx) * 12) : 0;

  // Finished books, newest first, for the cover wall
  const finishedShelf = [...read].sort(
    (a, b) => new Date(b.finishedAt || b.updatedAt || 0) - new Date(a.finishedAt || a.updatedAt || 0)
  );

  // Reading-personality insight chips (all derived from data that's always present)
  const insights = buildInsights({
    read,
    dnf,
    avgPages,
    avgRating,
    topGenre: topG[0]?.[0],
    longestBook,
  });

  if (!books.length) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader icon={BarChart2} title="Your Reading" subtitle="Your reading story, in numbers" />
        <div className="rounded-3xl border border-stone-200/70 bg-surface shadow-sm px-6 py-20 text-center">
          <span className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={30} className="text-brand-400" />
          </span>
          <p className="font-display font-semibold text-lg text-ink">No stats yet</p>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto">
            As you add books, log sessions, and rate what you finish, your reading year fills in here — genres, pace, streaks, and more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {showWrapped && <WrappedView books={books} onClose={() => setShowWrapped(false)} />}
      <PageHeader
        icon={BarChart2}
        title="Your Reading"
        subtitle={`${read.length + reading.length} books tracked · ${totalPagesRead.toLocaleString()} pages`}
        action={
          <Button onClick={() => setShowWrapped(true)}>
            <Sparkles size={16} /> Wrapped
          </Button>
        }
      />

      {/* At a glance — the headline numbers */}
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-surface p-6 md:p-7 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-6">
          <HeroStat icon={<CheckCircle size={18} />} value={read.length} label="Finished" />
          <HeroStat icon={<BookOpen size={18} />} value={reading.length} label="Reading" />
          <HeroStat icon={<Book size={18} />} value={wantCount} label="Want to Read" />
          <HeroStat icon={<Layers size={18} />} value={totalPagesRead.toLocaleString()} label="Pages Read" />
          <HeroStat icon={<Star size={18} />} value={avgRating !== '—' ? `${avgRating}★` : '—'} label="Avg Rating" />
          <HeroStat icon={<Flame size={18} />} value={streak} label="Day Streak" />
          <HeroStat icon={<Trophy size={18} />} value={finishedThisYear} label={`Finished in ${year}`} />
          {projectedYear > 0 && <HeroStat icon={<Sparkles size={18} />} value={`~${projectedYear}`} label={`On Pace for ${year}`} />}
        </div>
        {read.length > 0 && (
          <div className="mt-6 pt-4 border-t border-brand-100/70 flex items-center gap-2 text-sm text-brand-700">
            <Layers size={16} />
            <span>
              Stacked up, that&rsquo;s ~<b>{stack}</b> of books
              {hoursRead > 0 ? <> · <b>{hoursRead}h</b> logged</> : null}
            </span>
          </div>
        )}
      </div>

      {/* Streak nudge — gentle, loss-aversion-friendly (no shaming) */}
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 to-surface p-5 shadow-sm flex items-center gap-4">
        <span className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm shrink-0">
          <Flame size={22} />
        </span>
        <div>
          {streak > 0 ? (
            <>
              <p className="font-display font-semibold text-ink text-lg">{streak}-day reading streak</p>
              <p className="text-sm text-stone-500">Read a little today to keep it glowing.</p>
            </>
          ) : (
            <>
              <p className="font-display font-semibold text-ink text-lg">Start a streak today</p>
              <p className="text-sm text-stone-500">Log a reading session and your streak begins.</p>
            </>
          )}
        </div>
      </div>

      {/* Highlights with covers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Highlight label="Top Rated" icon={<Trophy size={13} />} book={topRated} meta={topRated ? `${topRated.rating}★ · ${topRated.author}` : ''} />
        <Highlight label="Longest Read" icon={<Ruler size={13} />} book={longestBook} meta={longestBook ? `${(longestBook.totalPages || 0).toLocaleString()} pages` : ''} />
        <Highlight label="Latest Finish" icon={<CheckCircle size={13} />} book={latestFinish} meta={latestFinish ? `Finished ${monthLabel(monthKey(latestFinish.finishedAt))}` : ''} />
        <Highlight label="On Your Nightstand" icon={<BookOpen size={13} />} book={currentRead} meta={currentRead ? `${curPct}% · p.${currentRead.currentPage || 0}/${currentRead.totalPages}` : ''} />
      </div>

      {/* Reading personality — warm, always-populated insight chips */}
      {insights.length > 0 && (
        <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-amber-50 to-surface p-6 shadow-sm">
          <h3 className="text-base font-display font-semibold text-ink mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-500" /> Your Reading Personality
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {insights.map((it, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 bg-surface border border-brand-100 rounded-full px-4 py-2 text-sm text-ink shadow-sm"
              >
                <span className="text-brand-500 shrink-0">{it.icon}</span>
                {it.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* On Your Shelf — a wall of the real covers you've finished */}
      <CoverWall books={finishedShelf} />

      {/* Secondary stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={<Star size={15} className="text-brand-400 fill-brand-400" />} label="Avg Rating" value={avgRating} sub={avgRating !== '—' ? '/ 5' : ''} />
        <StatTile icon={<Clock size={15} className="text-brand-500" />} label="Avg Length" value={avgPages || '—'} sub={avgPages ? 'pages' : ''} />
        <StatTile icon={<Timer size={15} className="text-brand-500" />} label="Longest Session" value={longest ? `${longest}` : '—'} sub={longest ? 'min' : ''} />
        <StatTile icon={<XCircle size={15} className="text-status-dnf" />} label="Set Aside (DNF)" value={dnf.length} />
      </div>

      {/* Reading achievements */}
      <Achievements books={books} streak={streak} totalPagesRead={totalPagesRead} />

      {/* Streak + status + this year */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2">
          <StreakCalendar books={books} />
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Library Breakdown" icon={<BookOpen size={18} className="text-brand-500" />}>
            <Pie data={statusData} donut />
          </Card>
          <Card title="This Year" icon={<Sparkles size={18} className="text-brand-500" />} className="flex-1">
            <div className="flex flex-col divide-y divide-stone-100">
              {[
                ['Finished this year', finishedThisYear],
                projectedYear > 0 ? ['On pace for', `~${projectedYear}`] : null,
                ['Pages read', totalPagesRead.toLocaleString()],
                hoursRead > 0 ? ['Time reading', `${hoursRead}h`] : null,
                ['Avg rating', avgRating !== '—' ? `${avgRating}★` : '—'],
              ]
                .filter(Boolean)
                .map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-stone-500">{label}</span>
                    <span className="font-display font-bold text-lg text-ink">{value}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Genres + Ratings + Authors — only cards that have data */}
      {(counted.length > 0 || rated.length > 0 || topAuthors.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counted.length > 0 && (
            <Card title="Genres Read" icon={<Book size={18} className="text-brand-500" />}>
              <Pie data={genreData} />
            </Card>
          )}
          {rated.length > 0 && (
            <Card title="How You Rate" icon={<Star size={18} className="text-brand-500" />}>
              <HBars data={ratingData} />
            </Card>
          )}
          {topAuthors.length > 0 && (
            <Card title="Most-Read Authors" icon={<Users size={18} className="text-brand-500" />}>
              <div className="flex flex-col gap-3">
                {topAuthors.map(([name, count], i) => {
                  const max = topAuthors[0][1];
                  return (
                    <div key={name} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-stone-400 font-display font-bold tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-ink truncate">{name}</span>
                          <span className="text-stone-500 tabular-nums shrink-0 ml-2">{count}</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Per-month trends — hidden until there's something to plot */}
      {(hasFinishMonths || hasPagesMonths) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasFinishMonths && (
            <Card title="Books Finished / Month" icon={<CheckCircle size={18} className="text-brand-500" />}>
              <Bars data={booksMonthData} />
            </Card>
          )}
          {hasPagesMonths && (
            <Card title="Pages Read / Month" icon={<BookOpen size={18} className="text-brand-500" />}>
              <Bars data={pagesMonthData} color="var(--color-status-read)" />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
