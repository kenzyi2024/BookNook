import { BarChart2, CheckCircle, BookOpen, Star, XCircle, Clock, Book, Layers } from 'lucide-react';

/** A single headline stat tile. */
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

/**
 * Reading dashboard.
 *
 * The old rainbow conic-gradient pie chart is replaced with a ranked horizontal
 * bar chart: this is magnitude-by-category data, so bars (one hue, direct-labeled,
 * sorted) read far more accurately than a multi-slice pie — and sidestep the
 * colorblind issues of a 10-color wheel.
 */
export default function MetricsView({ books }) {
  const readBooks = books.filter((b) => b.status === 'read');
  const readingBooks = books.filter((b) => b.status === 'reading');
  const dnfBooks = books.filter((b) => b.status === 'dnf');

  const totalRead = readBooks.length;
  const totalPagesRead =
    readBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0) +
    readingBooks.reduce((sum, b) => sum + (b.currentPage || 0), 0);

  const avgRating = readBooks.length
    ? (readBooks.reduce((sum, b) => sum + (b.rating || 0), 0) / readBooks.length).toFixed(1)
    : '—';

  const avgPages = readBooks.length
    ? Math.round(readBooks.reduce((sum, b) => sum + (b.totalPages || 0), 0) / readBooks.length)
    : 0;

  // Genre breakdown across read + reading
  const counted = books.filter((b) => b.status === 'read' || b.status === 'reading');
  const genreCounts = {};
  counted.forEach((b) => {
    const g = b.genre || 'Unknown';
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genres = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const total = counted.length;
  const maxCount = genres[0]?.count || 1;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="mb-2 flex items-center gap-3">
        <BarChart2 size={34} className="text-brand-600 drop-shadow-sm shrink-0" />
        <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
          Your Year in Books
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={<CheckCircle size={15} className="text-status-read" />} label="Finished" value={totalRead} />
        <StatTile icon={<BookOpen size={15} className="text-status-want" />} label="Pages Read" value={totalPagesRead.toLocaleString()} />
        <StatTile icon={<Star size={15} className="text-brand-400 fill-brand-400" />} label="Avg Rating" value={avgRating} />
        <StatTile icon={<XCircle size={15} className="text-status-dnf" />} label="Abandoned" value={dnfBooks.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Genre bar chart */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-stone-200/70 md:col-span-2">
          <h3 className="text-base font-display font-semibold text-ink mb-6 flex items-center gap-2">
            <Layers className="text-brand-500" size={18} /> Top Genres Read
          </h3>

          {total > 0 ? (
            <div className="flex flex-col gap-3.5">
              {genres.map((g) => {
                const pct = Math.round((g.count / total) * 100);
                const barPct = Math.round((g.count / maxCount) * 100);
                return (
                  <div key={g.name} className="group">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-semibold text-ink truncate pr-3">{g.name}</span>
                      <span className="text-xs text-stone-500 font-medium tabular-nums shrink-0">
                        {g.count} {g.count === 1 ? 'book' : 'books'} · {pct}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500 group-hover:bg-brand-600"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-40 flex items-center justify-center text-stone-400 italic">
              Read some books to see your genre breakdown!
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100 flex-1 flex flex-col justify-center">
            <span className="text-brand-700 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={15} /> Avg. Book Length
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-4xl text-ink leading-tight">{avgPages}</span>
              <span className="text-stone-500 font-medium">pages</span>
            </div>
            <p className="text-sm text-stone-600 mt-2">The average length of books you've completed.</p>
          </div>

          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex-1 flex flex-col justify-center">
            <span className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Book size={15} /> Total in Library
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-4xl text-ink leading-tight">{books.length}</span>
              <span className="text-stone-500 font-medium">books</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
