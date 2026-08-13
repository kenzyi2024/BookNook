import { SPINE_COLORS } from './status';

/**
 * A rich sample library so anyone can see BookNook fully populated — spines,
 * covers, and a lively Metrics page (streak calendar, pages/month, ratings,
 * genres) plus notes & quotes on some books. Loaded/removed as a toggle.
 */

// Remember which books were added as demo data, so "Load sample library" is a
// reversible toggle that removes exactly those (works for guests and accounts).
const DEMO_KEY = 'booknook_demo_ids';
export const getDemoIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) || [];
  } catch {
    return [];
  }
};
export const setDemoIds = (ids) => {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
};
export const clearDemoIds = () => {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch {
    /* ignore */
  }
};

// Demo shelf gadgets are tagged in `caption` so we can remove exactly these on
// toggle-off (the field is invisible for non-photo decor but persists in the DB).
export const DEMO_TAG = '__demo__';
export function buildMockGadgets() {
  return [
    { type: 'plant', variant: 'succulent', caption: DEMO_TAG, position: 2 },
    { type: 'plant', variant: 'flowers', caption: DEMO_TAG, position: 6 },
    { type: 'plant', variant: 'candle', caption: DEMO_TAG, position: 11 },
    { type: 'plant', variant: 'clock', caption: DEMO_TAG, position: 16 },
  ];
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const color = (i) => SPINE_COLORS[i % SPINE_COLORS.length];

// [title, author, genre, totalPages, status, rating, daysSinceFinish]
const RAW = [
  ['The Song of Achilles', 'Madeline Miller', 'Historical', 416, 'read', 5, 40],
  ['Circe', 'Madeline Miller', 'Fantasy', 393, 'read', 5, 95],
  ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 496, 'read', 5, 12],
  ['The Silent Patient', 'Alex Michaelides', 'Mystery & Thriller', 336, 'read', 4, 20],
  ['Educated', 'Tara Westover', 'Biography & Memoir', 334, 'read', 5, 60],
  ['Where the Crawdads Sing', 'Delia Owens', 'Fiction', 384, 'read', 4, 150],
  ['The Midnight Library', 'Matt Haig', 'Fiction', 288, 'read', 3, 200],
  ['Klara and the Sun', 'Kazuo Ishiguro', 'Science Fiction', 320, 'read', 4, 75],
  ['A Little Life', 'Hanya Yanagihara', 'Fiction', 720, 'read', 5, 8],
  ['Normal People', 'Sally Rooney', 'Fiction', 273, 'read', 4, 110],
  ['The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 662, 'read', 5, 30],
  ['Atomic Habits', 'James Clear', 'Self-Help', 320, 'read', 4, 130],
  ['Dune', 'Frank Herbert', 'Science Fiction', 412, 'reading', 0, 0],
  ['Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'Fiction', 401, 'reading', 0, 0],
  ['Babel', 'R. F. Kuang', 'Fantasy', 545, 'want_to_read', 0, 0],
  ['The Priory of the Orange Tree', 'Samantha Shannon', 'Fantasy', 848, 'want_to_read', 0, 0],
  ['Sapiens', 'Yuval Noah Harari', 'History', 443, 'want_to_read', 0, 0],
  ['Crying in H Mart', 'Michelle Zauner', 'Biography & Memoir', 256, 'want_to_read', 0, 0],
  ['Piranesi', 'Susanna Clarke', 'Fantasy', 245, 'dnf', 2, 90],
];

const NOTES = [
  'Gorgeous, immersive prose — I kept re-reading whole paragraphs.',
  'Slow to start but the payoff was worth every page.',
  'A quiet, aching book. Sat with me for days after.',
  'Clever premise, warm heart. Recommended it to everyone.',
  'The world-building is unreal. Already want to reread.',
];

const JOURNAL = [
  'Halfway in and completely hooked — the middle section is doing something special.',
  'That twist reframed everything I thought I knew. Had to put the book down for a minute.',
  'The relationship at the center feels so real it hurts.',
  'Loving the atmosphere; every chapter feels like a different painting.',
];

const QUOTES = [
  { page: 42, text: 'We are all just stories in the end.' },
  { page: 128, text: 'The measure of intelligence is the ability to change.' },
  { page: 7, text: 'It is our choices that show what we truly are.' },
  { page: 210, text: 'What is grief, if not love persevering?' },
];

// Reading sessions per active book: a recent streak (last few days) plus sessions
// spread across the last ~11 months, so the streak calendar AND the pages/month
// chart both fill in across the whole year.
function sessionsFor(i, status) {
  if (status !== 'read' && status !== 'reading') return [];
  const out = [];
  // recent streak days (0..4 ago) seeded across the first books
  if (i < 5) out.push({ date: daysAgo(i), pagesRead: 24 + i * 6, percent: 0, minutes: 30 + i * 5, format: 'page', endPage: 0 });
  const count = status === 'reading' ? 5 : 4 + (i % 3);
  for (let k = 0; k < count; k++) {
    const day = (i * 13 + k * 47 + 8) % 330; // scattered across ~11 months
    out.push({
      date: daysAgo(day),
      pagesRead: 16 + ((i + k) % 7) * 12,
      percent: 0,
      minutes: 20 + ((i + k) % 5) * 18,
      format: 'page',
      endPage: 0,
    });
  }
  return out;
}

/** Fresh sample-book objects (no _id — the caller creates them). */
export function buildMockBooks() {
  let readCount = 0;
  return RAW.map(([title, author, genre, totalPages, status, rating], i) => {
    const book = {
      title,
      author,
      genre,
      totalPages,
      status,
      coverColor: color(i),
      currentPage:
        status === 'read'
          ? totalPages
          : status === 'reading'
            ? Math.round(totalPages * (0.3 + (i % 5) * 0.1))
            : status === 'dnf'
              ? Math.round(totalPages * 0.35)
              : 0,
      sessions: sessionsFor(i, status),
    };
    if (status === 'read') {
      if (rating) book.rating = rating;
      // Spread finishes ~monthly across the last year so the "finished / month"
      // chart and "This Year" totals look full.
      book.finishedAt = daysAgo(18 + readCount * 27);
      readCount += 1;
    }
    // Notes, journal entries and quotes on most active books so the Notes tab
    // and reading history showcase those features.
    if (status === 'read' || status === 'reading') {
      book.notes = NOTES[i % NOTES.length];
      book.journalEntries = [
        { date: daysAgo(i + 4), text: JOURNAL[i % JOURNAL.length] },
        { date: daysAgo(i + 22), text: JOURNAL[(i + 1) % JOURNAL.length] },
      ];
      book.quotes = [QUOTES[i % QUOTES.length], QUOTES[(i + 2) % QUOTES.length]];
    }
    return book;
  });
}
