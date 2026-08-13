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

// A few reading sessions per active book, with recent consecutive days near the
// top so the streak calendar and pages/month chart light up.
function sessionsFor(i, status) {
  if (status !== 'read' && status !== 'reading') return [];
  const out = [];
  // recent streak days (0..4 ago) seeded across the first books
  if (i < 5) out.push({ date: daysAgo(i), pagesRead: 24 + i * 6, percent: 0, minutes: 30 + i * 5, format: 'page', endPage: 0 });
  const count = status === 'reading' ? 3 : 2 + (i % 3);
  for (let k = 0; k < count; k++) {
    const day = (i * 3 + k * 5 + 2) % 55;
    out.push({
      date: daysAgo(day),
      pagesRead: 18 + ((i + k) % 6) * 11,
      percent: 0,
      minutes: 20 + ((i + k) % 4) * 15,
      format: 'page',
      endPage: 0,
    });
  }
  return out;
}

/** Fresh sample-book objects (no _id — the caller creates them). */
export function buildMockBooks() {
  return RAW.map(([title, author, genre, totalPages, status, rating, daysSinceFinish], i) => {
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
      book.finishedAt = daysAgo(daysSinceFinish);
    }
    // Sprinkle notes, journal entries and quotes onto some books so the Notes
    // tab and reading history aren't empty in the demo.
    if ((status === 'read' || status === 'reading') && i % 2 === 0) {
      book.notes = NOTES[i % NOTES.length];
      book.journalEntries = [{ date: daysAgo(i + 3), text: JOURNAL[i % JOURNAL.length] }];
      book.quotes = [QUOTES[i % QUOTES.length]];
    }
    return book;
  });
}
