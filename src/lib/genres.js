/**
 * Genre normalization.
 *
 * Book APIs return wildly inconsistent category strings ("Fiction, general",
 * "Juvenile Fiction", "New York Times bestseller", long comma lists). Left raw,
 * these bloat and break the Metrics genre chart. We map anything to a small,
 * clean, canonical set so charts and filters stay tidy.
 */

// Canonical genres offered in the picker and used everywhere downstream.
export const GENRE_OPTIONS = [
  'Fiction',
  'Nonfiction',
  'Fantasy',
  'Science Fiction',
  'Mystery & Thriller',
  'Romance',
  'Historical',
  'Horror',
  'Biography & Memoir',
  'History',
  'Science',
  'Philosophy',
  'Poetry',
  'Young Adult',
  "Children's",
  'Self-Help',
  'Business',
  'Religion & Spirituality',
  'Comics & Graphic Novels',
  'Cooking',
  'Other',
];

// Keyword → canonical genre. First match wins, so order from specific to broad.
const RULES = [
  [/graphic novel|comic|manga/, 'Comics & Graphic Novels'],
  [/young adult|\bya\b/, 'Young Adult'],
  [/juvenile|children|picture book/, "Children's"],
  [/science fiction|sci-?fi|dystopia|space opera/, 'Science Fiction'],
  [/fantasy|mytholog|fairy tale|magic/, 'Fantasy'],
  [/mystery|thriller|detective|crime|suspense|noir/, 'Mystery & Thriller'],
  [/romance|romantic/, 'Romance'],
  [/horror|ghost|vampire|gothic/, 'Horror'],
  [/biograph|memoir|autobiograph/, 'Biography & Memoir'],
  [/self-?help|personal development|self-?improvement|productivity/, 'Self-Help'],
  [/business|econom|management|finance|marketing/, 'Business'],
  [/religio|spiritual|christian|islam|buddh|theolog/, 'Religion & Spirituality'],
  [/philosoph/, 'Philosophy'],
  [/poetry|poems/, 'Poetry'],
  [/cook|food|recipe|culinary/, 'Cooking'],
  [/historical fiction/, 'Historical'],
  [/history|historical/, 'History'],
  [/science|physics|biology|technolog|mathematic|nature/, 'Science'],
  [/non-?fiction/, 'Nonfiction'],
  [/fiction|literary|novel/, 'Fiction'],
];

/** Map any raw genre/category string to a canonical genre. */
export function normalizeGenre(raw) {
  if (!raw || typeof raw !== 'string') return 'Unknown';
  const s = raw.toLowerCase();
  for (const [re, label] of RULES) {
    if (re.test(s)) return label;
  }
  return 'Other';
}

/* -------------------------------------------------------------------------- */
/* AI genre self-heal                                                         */
/*                                                                            */
/* Metadata APIs give unreliable genres, so we let the app's own AI classify  */
/* each book into the canonical list. Books tagged with a generic/unknown     */
/* bucket get reclassified once; the result is remembered per-device so we    */
/* never re-spend an AI call on the same book.                                */
/* -------------------------------------------------------------------------- */

const HEAL_KEY = 'booknook.genreHealed.v1';
// These buckets are treated as "not confidently classified" and get one AI pass.
const AMBIGUOUS = new Set(['Fiction', 'Nonfiction', 'Other', 'Unknown', '']);

function loadHealed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HEAL_KEY)) || []);
  } catch {
    return new Set();
  }
}
const healed = loadHealed();

function saveHealed() {
  try {
    localStorage.setItem(HEAL_KEY, JSON.stringify([...healed]));
  } catch {
    /* ignore quota */
  }
}

/** Does this book still need an AI genre pass? */
export function genreNeedsHeal(book) {
  if (!book?._id || healed.has(book._id)) return false;
  return AMBIGUOUS.has(book.genre) || !GENRE_OPTIONS.includes(book.genre);
}

export function markGenreHealed(id) {
  healed.add(id);
  saveHealed();
}

/**
 * Classify a book into exactly one canonical genre via the AI. `generateAI` is
 * the function from useApi(). Returns a canonical genre string.
 */
export async function classifyGenre(generateAI, title, author) {
  const prompt =
    `Classify the book "${title}"${author ? ` by ${author}` : ''} into exactly ONE genre ` +
    `from this list: ${GENRE_OPTIONS.join(', ')}. ` +
    `Reply with only the genre name exactly as written, nothing else.`;
  const raw = await generateAI(prompt);
  const cleaned = (raw || '').trim().replace(/^["'.]+|["'.]+$/g, '');
  return GENRE_OPTIONS.includes(cleaned) ? cleaned : normalizeGenre(cleaned);
}
