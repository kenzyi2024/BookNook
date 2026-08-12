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
