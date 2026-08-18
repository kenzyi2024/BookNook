// Library sort options + logic, including a "cover color" rainbow sort.

export const SORT_OPTIONS = [
  { id: 'added_desc', label: 'Recently added' },
  { id: 'added_asc', label: 'Oldest first' },
  { id: 'title', label: 'Title A–Z' },
  { id: 'author', label: 'Author A–Z' },
  { id: 'color', label: 'Cover color' },
  { id: 'rating', label: 'Top rated' },
  { id: 'pages', label: 'Longest' },
  { id: 'tbr', label: 'TBR order' },
];

/** TBR ordering: by planned month (unscheduled last), then rank within it. */
const tbrMonthKey = (b) => b.tbrMonth || '9999-99';
const tbrRankKey = (b) => (b.tbrRank == null ? Infinity : b.tbrRank);

function parseRgb(s) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(s || '');
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function rgbHue([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (!d) return 999; // greyscale sorts to the end
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

// Approx hue for the preset Tailwind spine classes (fallback when no spineColor).
const COVER_HUE = {
  'bg-red-800': 0,
  'bg-orange-800': 25,
  'bg-amber-700': 38,
  'bg-emerald-800': 152,
  'bg-teal-700': 175,
  'bg-slate-800': 215,
  'bg-blue-800': 222,
  'bg-purple-900': 275,
  'bg-stone-800': 900,
};

function colorKey(b) {
  const rgb = parseRgb(b.spineColor);
  if (rgb) return rgbHue(rgb);
  return COVER_HUE[b.coverColor] ?? 950;
}

const ts = (b) => new Date(b.createdAt || b.updatedAt || 0).getTime();

export function sortBooks(list, key) {
  const a = [...list];
  switch (key) {
    case 'added_asc':
      return a.sort((x, y) => ts(x) - ts(y));
    case 'title':
      return a.sort((x, y) => x.title.localeCompare(y.title));
    case 'author':
      return a.sort((x, y) => (x.author || '').localeCompare(y.author || ''));
    case 'color':
      return a.sort((x, y) => colorKey(x) - colorKey(y));
    case 'rating':
      return a.sort((x, y) => (y.rating || 0) - (x.rating || 0));
    case 'pages':
      return a.sort((x, y) => (y.totalPages || 0) - (x.totalPages || 0));
    case 'tbr':
      return a.sort((x, y) =>
        tbrMonthKey(x).localeCompare(tbrMonthKey(y)) || tbrRankKey(x) - tbrRankKey(y) || ts(y) - ts(x)
      );
    case 'added_desc':
    default:
      return a.sort((x, y) => ts(y) - ts(x));
  }
}
