/**
 * Book cover helpers.
 *
 * There is no public API of real book *spine* art, so we pull the front cover
 * from Open Library (free, no key, CORS-friendly) by title + author, and derive
 * a spine tint from the cover's dominant color. Results are cached in
 * localStorage so we only hit the network once per book, across reloads.
 *
 * Everything fails soft: if a lookup or color read fails, callers fall back to
 * the book's existing `coverColor` and simply show no cover image.
 */

const CACHE_KEY = 'booknook.covers.v3';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

const mem = loadCache();

let saveTimer = null;
function saveCacheSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(mem));
    } catch {
      /* quota / private mode — in-memory cache still works for the session */
    }
  }, 300);
}

const keyOf = (title, author) => `${title}|${author}`.toLowerCase().trim();

// Per-session guard so we persist a resolved cover to the DB at most once per book.
const persistedIds = new Set();
export const needsPersist = (id) => Boolean(id) && !persistedIds.has(id);
export const markPersisted = (id) => persistedIds.add(id);

/** Look up a (usually better/more current) cover from Google Books. Returns '' if none. */
async function lookupGoogleCover(title, author) {
  if (!title) return '';
  try {
    const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?maxResults=6&printType=books&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    // First result sometimes has no thumbnail — scan a few for a usable one.
    for (const item of data.items || []) {
      const links = item.volumeInfo?.imageLinks;
      const raw = links?.thumbnail || links?.smallThumbnail;
      if (raw) return raw.replace(/^http:/, 'https:').replace('&edge=curl', '');
    }
    return '';
  } catch {
    return '';
  }
}

/** Look up a front-cover image URL from Open Library. Returns '' if none. */
export async function lookupCoverUrl(title, author) {
  if (!title) return '';
  try {
    const q = new URLSearchParams({
      title,
      author: author || '',
      limit: '1',
      fields: 'cover_i',
    });
    const res = await fetch(`https://openlibrary.org/search.json?${q}`);
    if (!res.ok) return '';
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';
  } catch {
    return '';
  }
}

// Throttle outbound cover lookups so opening a library of dozens of books doesn't
// fire dozens of simultaneous requests (which saturate the browser's connection
// pool and trip Google Books rate limits, making every cover crawl in slowly).
const MAX_CONCURRENT = 5;
let active = 0;
const waiters = [];
function drain() {
  while (waiters.length && active < MAX_CONCURRENT) {
    active += 1;
    waiters.shift()();
  }
}
function acquire() {
  return new Promise((resolve) => { waiters.push(resolve); drain(); });
}
function release() { active -= 1; drain(); }

/**
 * TEMPORARY — force a fresh cover lookup, ignoring any stored/cached URL, to
 * repair books that saved a wrong cover.
 */
export async function refreshCover(title, author) {
  await acquire();
  try {
    const googleUrl = await lookupGoogleCover(title, author);
    const display = googleUrl || (await lookupCoverUrl(title, author));
    mem[keyOf(title, author)] = { display, color: '' };
    saveCacheSoon();
    return { coverUrl: display, spineColor: '' };
  } finally {
    release();
  }
}

/**
 * Resolve `{ coverUrl, spineColor }` for a book, cached by title+author.
 *
 * Spines are tinted from the active theme now, so we no longer sample a dominant
 * color (that meant loading + canvas-decoding an extra image per book). We just
 * fetch a single display cover — a stored URL wins with no network at all, else
 * one throttled Google Books lookup (Open Library only as a fallback).
 */
export async function resolveCover(title, author, knownUrl = '') {
  const k = keyOf(title, author);

  if (knownUrl) {
    if (!mem[k]) { mem[k] = { display: knownUrl, color: '' }; saveCacheSoon(); }
    return { coverUrl: knownUrl, spineColor: '' };
  }

  const cached = mem[k];
  if (cached) return { coverUrl: cached.display, spineColor: cached.color || '' };

  await acquire();
  try {
    let display = await lookupGoogleCover(title, author);
    if (!display) display = await lookupCoverUrl(title, author);
    mem[k] = { display, color: '' };
    saveCacheSoon();
    return { coverUrl: display, spineColor: '' };
  } finally {
    release();
  }
}
