/**
 * "Year in Books" — compute a shareable recap of a reading year from the library.
 */
import { normalizeGenre } from './genres';

const finishedInYear = (book, year) => {
  const d = book.finishedAt || book.updatedAt;
  return book.status === 'read' && d && new Date(d).getFullYear() === year;
};

/** Most frequent value in a list of strings, with its count. */
function topOf(values) {
  const counts = {};
  values.forEach((v) => { if (v) counts[v] = (counts[v] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length ? { label: sorted[0][0], count: sorted[0][1] } : null;
}

/** The reading-streak (consecutive days with a session) ending today/yesterday. */
function currentStreak(books) {
  const days = new Set();
  books.forEach((b) => (b.sessions || []).forEach((s) => {
    if (s.date) days.add(new Date(s.date).toISOString().slice(0, 10));
  }));
  const has = (i) => { const d = new Date(); d.setDate(d.getDate() - i); return days.has(d.toISOString().slice(0, 10)); };
  let streak = 0;
  const start = has(0) ? 0 : has(1) ? 1 : -1;
  if (start >= 0) for (let i = start; has(i); i++) streak += 1;
  return streak;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function buildWrapped(books, year = new Date().getFullYear()) {
  const finished = books.filter((b) => finishedInYear(b, year));
  const pages = finished.reduce((s, b) => s + (b.totalPages || 0), 0);

  const rated = finished.filter((b) => b.rating > 0);
  const avgRating = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length) : 0;

  const topRated = [...rated].sort((a, b) => b.rating - a.rating || (b.totalPages || 0) - (a.totalPages || 0))[0] || null;
  const longest = [...finished].filter((b) => b.totalPages).sort((a, b) => b.totalPages - a.totalPages)[0] || null;

  const topGenre = topOf(finished.map((b) => normalizeGenre(b.genre)));
  const topMood = topOf(finished.flatMap((b) => b.moods || []));
  const topAuthor = topOf(finished.map((b) => b.author));

  // Minutes logged in the year.
  let minutes = 0;
  const monthCounts = new Array(12).fill(0);
  books.forEach((b) => {
    (b.sessions || []).forEach((s) => {
      if (s.date && new Date(s.date).getFullYear() === year) minutes += s.minutes || 0;
    });
  });
  finished.forEach((b) => {
    const d = b.finishedAt || b.updatedAt;
    if (d) monthCounts[new Date(d).getMonth()] += 1;
  });
  const busiestIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const busiestMonth = monthCounts[busiestIdx] > 0 ? { label: MONTHS[busiestIdx], count: monthCounts[busiestIdx] } : null;

  return {
    year,
    count: finished.length,
    pages,
    hours: Math.round(minutes / 60),
    avgRating: avgRating ? Number(avgRating.toFixed(1)) : 0,
    topRated,
    longest,
    topGenre,
    topMood,
    topAuthor,
    busiestMonth,
    streak: currentStreak(books),
    hasData: finished.length > 0,
  };
}

/** Years (desc) that actually have finished books, for a year picker. */
export function readingYears(books) {
  const years = new Set();
  books.forEach((b) => {
    const d = b.finishedAt || b.updatedAt;
    if (b.status === 'read' && d) years.add(new Date(d).getFullYear());
  });
  const list = [...years].sort((a, b) => b - a);
  return list.length ? list : [new Date().getFullYear()];
}
