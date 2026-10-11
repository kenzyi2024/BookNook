/**
 * Recommendation selection shared by Up Next (Library) and Discover.
 *
 * AI suggestions arrive as bare { title, author } — no ISBN or provider id —
 * and shelf books have no stable cross-provider id either, so "is this book
 * already on the shelf?" is decided by normalized title + author:
 *
 *  - Titles are compared case/diacritic/punctuation-insensitively, ignoring a
 *    leading article and any "(Series, #1)" note. A subtitle after ":" is also
 *    ignored, so "Dune: Deluxe Edition" is the same work as "Dune".
 *  - Authors must also be compatible: they share at least one full name token
 *    ("J.R.R. Tolkien" ~ "Tolkien, J. R. R."), or one side has no author.
 *    Initials alone never match, so "Beloved" by a different author stays a
 *    different book. Different titles never match ("Dune" ≠ "Dune Messiah").
 *
 * This is deliberately conservative: it collapses formatting and edition noise
 * without fuzzy-matching genuinely different books.
 */
import { parseSuggestions } from './aiBooks';

const ARTICLE_RE = /^(the|a|an)\s+/;
const IGNORED_AUTHOR_TOKENS = new Set(['unknown', 'author', 'jr', 'sr', 'ii', 'iii', 'phd', 'dr']);

function fold(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, ''); // "sorcerer's" → "sorcerers"
}

/** Full normalized title ("The Hobbit, or There and Back Again" → "hobbit or there and back again"). */
export function normalizeTitle(title) {
  return fold(title)
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ') // "(Kingkiller Chronicle #1)"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(ARTICLE_RE, '');
}

/** Title without a subtitle ("Dune: Deluxe Edition" → "dune"). */
export function coreTitle(title) {
  const main = String(title || '').split(/\s*[:—–]\s+|\s+-\s+/)[0];
  return normalizeTitle(main);
}

/** Significant name tokens (initials and suffixes dropped). */
export function authorTokens(author) {
  return new Set(
    fold(author)
      .split(/[^a-z]+/)
      .filter((t) => t.length > 1 && !IGNORED_AUTHOR_TOKENS.has(t))
  );
}

export function authorsCompatible(a, b) {
  const ta = authorTokens(a);
  const tb = authorTokens(b);
  if (!ta.size || !tb.size) return true; // unknown author — decide on title alone
  for (const t of ta) if (tb.has(t)) return true;
  return false;
}

/** Same work, per the identity rules above. */
export function isSameBook(a, b) {
  if (!a?.title || !b?.title) return false;
  const titleMatch =
    normalizeTitle(a.title) === normalizeTitle(b.title) || coreTitle(a.title) === coreTitle(b.title);
  return titleMatch && authorsCompatible(a.author, b.author);
}

/**
 * Build a fast `(candidate) => boolean` membership test for a list of books
 * (e.g. the reader's whole shelf, every status included).
 */
export function createBookMatcher(books = []) {
  const index = new Map();
  const add = (key, book) => {
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(book);
  };
  books.forEach((b) => {
    if (!b?.title) return;
    add(normalizeTitle(b.title), b);
    add(coreTitle(b.title), b);
  });
  return (candidate) => {
    if (!candidate?.title) return false;
    const pool = [
      ...(index.get(normalizeTitle(candidate.title)) || []),
      ...(index.get(coreTitle(candidate.title)) || []),
    ];
    return pool.some((b) => isSameBook(b, candidate));
  };
}

/**
 * Keep only candidates that aren't on the shelf, aren't in `exclude` (already
 * shown or dismissed), and aren't duplicates of each other. Order is preserved.
 */
export function filterRecommendations(candidates, { shelf = [], exclude = [] } = {}) {
  const onShelf = createBookMatcher(shelf);
  const excluded = createBookMatcher(exclude);
  const kept = [];
  for (const c of candidates || []) {
    if (!c?.title || onShelf(c) || excluded(c)) continue;
    if (kept.some((k) => isSameBook(k, c))) continue;
    kept.push(c);
  }
  return kept;
}

/**
 * Ask the AI for recommendations and return up to `want` eligible ones.
 *
 * Shelf books (any status) and `exclude`d ones are filtered out *before*
 * anything is returned, so they never flash on screen or count toward the
 * total. If too few survive, one more round is requested (capped by
 * `maxRounds` so a single click costs at most that many AI calls). Never pads
 * with shelf books — an empty array means "nothing new".
 *
 * @param {object} opts
 * @param {(prompt: string) => Promise<string>} opts.generate  AI text call
 * @param {(avoidTitles: string[], count: number) => string} opts.buildPrompt
 * @param {object[]} opts.shelf    the current reader's books
 * @param {object[]} [opts.exclude] suggestions already shown/dismissed
 * @param {number} opts.want
 * @param {number} [opts.maxRounds=2]
 */
export async function fetchRecommendations({ generate, buildPrompt, shelf = [], exclude = [], want, maxRounds = 2 }) {
  const results = [];
  for (let round = 0; round < maxRounds && results.length < want; round++) {
    const avoid = [...shelf, ...exclude, ...results].map((b) => b.title).filter(Boolean);
    let raw;
    try {
      raw = await generate(buildPrompt([...new Set(avoid)], want - results.length));
    } catch (err) {
      if (round === 0) throw err; // nothing to show — let the caller report it
      break; // keep what the first round found
    }
    const fresh = filterRecommendations(parseSuggestions(raw), {
      shelf,
      exclude: [...exclude, ...results],
    });
    results.push(...fresh);
  }
  return results.slice(0, want);
}

/** Stable React key for a suggestion. */
export const suggestionKey = (s) => `${coreTitle(s.title)}|${[...authorTokens(s.author)].sort().join(' ')}`;
