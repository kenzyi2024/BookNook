import { BarChart2, CheckCircle, BookOpen, Star, XCircle, Clock, Book, Timer } from 'lucide-react';
import { STATUSES } from '../../lib/status';
import { monthKey, monthLabel } from '../../lib/format';
import StreakCalendar from './StreakCalendar';

// Distinct categorical palette for the genre pie.
const PIE = ['#C05D22', '#2F855A', '#3B6FB0', '#B23A48', '#7C3AED', '#0D9488', '#CA8A04'];

// Build a conic-gradient stop string (kept out of render to avoid mutating during render).
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

function Card({ title, icon, children, className = '' }) {
  return (
    <div className={`bg-surface p-6 rounded-2xl shadow-sm border border-stone-200/70 ${className}`}>
      <h3 className="text-base font-display font-semibold text-ink mb-5 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// Pie / donut from a conic-gradient
function Pie({ data, donut = false }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="h-44 flex items-center justify-center text-stone-400 italic">No data yet</div>;

  const stops = buildConicStops(data, total);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <div
          className="w-40 h-40 rounded-full shadow-inner"
          style={{ background: `conic-gradient(${stops})` }}
        />
        {donut && (
          <div className="absolute inset-0 m-auto w-20 h-20 bg-surface rounded-full flex items-center justify-center">
            <span className="font-display font-bold text-xl text-ink">{total}</span>
          </div>
        )}
      </div>
      <div className="flex-1 w-full flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-3 text-sm">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: d.color || PIE[i % PIE.length] }} />
            <span className="font-medium text-ink flex-1 truncate">{d.label}</span>
            <span className="text-stone-500 tabular-nums">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Vertical bars for time series
function Bars({ data, color = 'var(--color-brand-500)' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.some((d) => d.value > 0))
    return <div className="h-40 flex items-center justify-center text-stone-400 italic">No data yet</div>;
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-md transition-all group-hover:opacity-80 relative"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: d.value ? '3px' : '0' }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] text-stone-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal bars (rating distribution)
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

// Build the last N month buckets ending this month
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
  const read = books.filter((b) => b.status === 'read');
  const reading = books.filter((b) => b.status === 'reading');
  const dnf = books.filter((b) => b.status === 'dnf');

  const totalPagesRead =
    read.reduce((s, b) => s + (b.totalPages || 0), 0) +
    reading.reduce((s, b) => s + (b.currentPage || 0), 0);

  const rated = read.filter((b) => typeof b.rating === 'number' && b.rating > 0);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—';
  const avgPages = read.length ? Math.round(read.reduce((s, b) => s + (b.totalPages || 0), 0) / read.length) : 0;

  // Longest timed session across all books
  let longest = 0;
  books.forEach((b) => (b.sessions || []).forEach((s) => { if ((s.minutes || 0) > longest) longest = s.minutes; }));

  // Genre pie (top 6 + Other)
  const counted = books.filter((b) => b.status === 'read' || b.status === 'reading');
  const gc = {};
  counted.forEach((b) => { const g = b.genre || 'Unknown'; gc[g] = (gc[g] || 0) + 1; });
  const sortedG = Object.entries(gc).sort((a, b) => b[1] - a[1]);
  const topG = sortedG.slice(0, 6);
  const otherG = sortedG.slice(6).reduce((s, [, v]) => s + v, 0);
  const genreData = topG.map(([label, value], i) => ({ label, value, color: PIE[i % PIE.length] }));
  if (otherG) genreData.push({ label: 'Other', value: otherG, color: '#9CA3AF' });

  // Status donut
  const statusData = Object.entries(STATUSES)
    .map(([key, meta]) => ({ label: meta.short, value: books.filter((b) => b.status === key).length, color: meta.color }))
    .filter((d) => d.value > 0);

  // Per-month: books finished + pages read (last 12 months)
  const months = lastMonths(12);
  const finishedByMonth = Object.fromEntries(months.map((m) => [m, 0]));
  read.forEach((b) => {
    const key = monthKey(b.finishedAt || b.updatedAt);
    if (key in finishedByMonth) finishedByMonth[key] += 1;
  });
  const pagesByMonth = Object.fromEntries(months.map((m) => [m, 0]));
  books.forEach((b) => (b.sessions || []).forEach((s) => {
    const key = monthKey(s.date);
    if (key in pagesByMonth) pagesByMonth[key] += s.pagesRead || 0;
  }));
  const booksMonthData = months.map((m) => ({ label: monthLabel(m), value: finishedByMonth[m] }));
  const pagesMonthData = months.map((m) => ({ label: monthLabel(m), value: pagesByMonth[m] }));

  // Rating distribution (round to nearest star)
  const ratingData = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star}★`,
    value: rated.filter((b) => Math.round(b.rating) === star).length,
  }));

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="mb-2 flex items-center gap-3">
        <BarChart2 size={34} className="text-brand-600 drop-shadow-sm shrink-0" />
        <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
          Your Year in Books
        </h2>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={<CheckCircle size={15} className="text-status-read" />} label="Finished" value={read.length} />
        <StatTile icon={<BookOpen size={15} className="text-status-want" />} label="Pages Read" value={totalPagesRead.toLocaleString()} />
        <StatTile icon={<Star size={15} className="text-brand-400 fill-brand-400" />} label="Avg Rating" value={avgRating} />
        <StatTile icon={<Timer size={15} className="text-brand-500" />} label="Longest Session" value={longest ? `${longest}` : '—'} sub={longest ? 'min' : ''} />
      </div>

      {/* Streak + status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <StreakCalendar books={books} />
        </div>
        <Card title="Library Breakdown" icon={<BookOpen size={18} className="text-brand-500" />}>
          <Pie data={statusData} donut />
        </Card>
      </div>

      {/* Genre pie */}
      <div className="grid grid-cols-1 gap-6">
        <Card title="Genres Read" icon={<Book size={18} className="text-brand-500" />}>
          <Pie data={genreData} />
        </Card>
      </div>

      {/* Per-month trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Books Finished / Month" icon={<CheckCircle size={18} className="text-brand-500" />}>
          <Bars data={booksMonthData} />
        </Card>
        <Card title="Pages Read / Month" icon={<BookOpen size={18} className="text-brand-500" />}>
          <Bars data={pagesMonthData} color="var(--color-status-read)" />
        </Card>
      </div>

      {/* Ratings + insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Rating Distribution" icon={<Star size={18} className="text-brand-500" />} className="md:col-span-2">
          {rated.length ? <HBars data={ratingData} /> : <p className="text-stone-400 italic py-6 text-center">Rate some finished books to see this.</p>}
        </Card>
        <div className="flex flex-col gap-6">
          <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 flex-1 flex flex-col justify-center">
            <span className="text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={15} /> Avg. Book Length
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-4xl text-ink leading-tight">{avgPages}</span>
              <span className="text-stone-500 font-medium">pages</span>
            </div>
          </div>
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex-1 flex flex-col justify-center">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <XCircle size={15} /> Abandoned (DNF)
            </span>
            <span className="font-display font-bold text-4xl text-ink leading-tight">{dnf.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
