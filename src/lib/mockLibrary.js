import { SPINE_COLORS } from './status';

/**
 * A rich sample library so anyone can see BookNook fully populated — spines,
 * covers, a lively Metrics page (streak, months of finishes/pages, ratings,
 * genres, authors), notes & quotes, and scattered shelf gadgets. Loaded/removed
 * as a toggle; demo items are detectable so "remove" cleans up exactly them.
 */

export const DEMO_TAG = '__demo__';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const color = (i) => SPINE_COLORS[i % SPINE_COLORS.length];

const NOTES = [
  'Gorgeous, immersive prose — I kept re-reading whole paragraphs.',
  'Slow to start but the payoff was worth every page.',
  'A quiet, aching book. Sat with me for days after.',
  'Clever premise, warm heart. Recommended it to everyone.',
  'The world-building is unreal. Already want to reread.',
  'Funny, sharp, and a little devastating.',
];

const JOURNAL = [
  'Halfway in and completely hooked — the middle section is doing something special.',
  'That twist reframed everything I thought I knew. Had to put the book down for a minute.',
  'The relationship at the center feels so real it hurts.',
  'Loving the atmosphere; every chapter feels like a different painting.',
  'Not sure where this is going but I trust the author completely.',
];

const QUOTES = [
  { page: 42, text: 'We are all just stories in the end.' },
  { page: 128, text: 'The measure of intelligence is the ability to change.' },
  { page: 7, text: 'It is our choices that show what we truly are.' },
  { page: 210, text: 'What is grief, if not love persevering?' },
  { page: 63, text: 'The people we love become woven into who we are.' },
];

// [title, author, genre, totalPages, status, rating]
const RAW = [
  ['The Song of Achilles', 'Madeline Miller', 'Historical', 416, 'read', 5],
  ['Circe', 'Madeline Miller', 'Fantasy', 393, 'read', 5],
  ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 496, 'read', 5],
  ['The Silent Patient', 'Alex Michaelides', 'Mystery & Thriller', 336, 'read', 4],
  ['Educated', 'Tara Westover', 'Biography & Memoir', 334, 'read', 5],
  ['Where the Crawdads Sing', 'Delia Owens', 'Fiction', 384, 'read', 4],
  ['The Midnight Library', 'Matt Haig', 'Fiction', 288, 'read', 3],
  ['Klara and the Sun', 'Kazuo Ishiguro', 'Science Fiction', 320, 'read', 4],
  ['A Little Life', 'Hanya Yanagihara', 'Fiction', 720, 'read', 5],
  ['Normal People', 'Sally Rooney', 'Fiction', 273, 'read', 4],
  ['The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 662, 'read', 5],
  ['Atomic Habits', 'James Clear', 'Self-Help', 320, 'read', 4],
  ['Lessons in Chemistry', 'Bonnie Garmus', 'Fiction', 400, 'read', 4],
  ['The Kite Runner', 'Khaled Hosseini', 'Fiction', 371, 'read', 5],
  ['Beloved', 'Toni Morrison', 'Fiction', 324, 'read', 4],
  ['The Handmaid’s Tale', 'Margaret Atwood', 'Science Fiction', 311, 'read', 5],
  ['The Seven Husbands of Evelyn Hugo', 'Taylor Jenkins Reid', 'Fiction', 400, 'read', 5],
  ['Mexican Gothic', 'Silvia Moreno-Garcia', 'Horror', 301, 'read', 4],
  ['A Gentleman in Moscow', 'Amor Towles', 'Historical', 462, 'read', 5],
  ['Dune', 'Frank Herbert', 'Science Fiction', 412, 'reading', 0],
  ['Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'Fiction', 401, 'reading', 0],
  ['Babel', 'R. F. Kuang', 'Fantasy', 545, 'want_to_read', 0],
  ['The Priory of the Orange Tree', 'Samantha Shannon', 'Fantasy', 848, 'want_to_read', 0],
  ['Sapiens', 'Yuval Noah Harari', 'History', 443, 'want_to_read', 0],
  ['Crying in H Mart', 'Michelle Zauner', 'Biography & Memoir', 256, 'want_to_read', 0],
  ['Piranesi', 'Susanna Clarke', 'Fantasy', 245, 'dnf', 2],
];

const DEMO_KEYS = new Set(RAW.map(([t, a]) => `${t}|${a}`.toLowerCase()));

// Reading sessions per active book: a recent streak plus sessions scattered
// across the last ~11 months, so the streak calendar AND the pages/month chart
// fill in across the whole year.
function sessionsFor(i, status) {
  if (status !== 'read' && status !== 'reading') return [];
  const out = [];
  if (i < 6) out.push({ date: daysAgo(i), pagesRead: 28 + i * 6, percent: 0, minutes: 35 + i * 5, format: 'page', endPage: 0 });
  const count = status === 'reading' ? 6 : 5 + (i % 3);
  for (let k = 0; k < count; k++) {
    const day = (i * 13 + k * 41 + 6) % 330;
    out.push({
      date: daysAgo(day),
      pagesRead: 25 + ((i + k) % 8) * 15,
      percent: 0,
      minutes: 25 + ((i + k) % 5) * 18,
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
      demo: true, // ignored by the backend, but present for local/guest data
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
      // Finishes ~every couple weeks across the last ~10 months → full monthly chart.
      book.finishedAt = daysAgo(10 + readCount * 16);
      readCount += 1;
    }
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

/** Demo gadgets scattered across the shelves (positions depend on library size). */
export function buildMockGadgets(total = 20) {
  const variants = ['succulent', 'flowers', 'candle', 'clock', 'bookends'];
  return variants.map((variant, idx) => {
    const frac = 0.1 + idx * 0.19 + (Math.random() * 0.1 - 0.05); // scattered
    return {
      type: 'plant',
      variant,
      caption: DEMO_TAG,
      position: Math.max(0, Math.min(total, Math.round(total * frac))),
    };
  });
}

/**
 * Detect a demo book so "remove sample data" cleans up exactly those — even
 * legacy ones from before tagging. Matches the demo title+author set, but only
 * when it also carries a demo signature (demo notes, or a want-to-read/DNF demo
 * title), so it never touches a user's own book that shares a famous title.
 */
export function isDemoBook(book) {
  if (!book) return false;
  if (book.demo === true) return true;
  const key = `${book.title}|${book.author}`.toLowerCase();
  if (!DEMO_KEYS.has(key)) return false;
  if (NOTES.includes(book.notes)) return true;
  return book.status === 'want_to_read' || book.status === 'dnf';
}
