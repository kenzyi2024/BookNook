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

// Google Books' keyless quota is small. After a 429/403, skip it for a while
// and go straight to Open Library instead of paying a doomed round-trip (and
// deepening the rate limit) for every cover.
const GOOGLE_COOLDOWN_MS = 5 * 60 * 1000;
let googleBlockedUntil = 0;

/**
 * Look up a (usually better/more current) cover from Google Books.
 * Returns the URL, '' if Google answered with no cover, or null if it couldn't
 * answer (offline, rate-limited, error) — so callers don't cache a transient
 * failure as "this book has no cover".
 */
async function lookupGoogleCover(title, author) {
  if (!title) return '';
  if (Date.now() < googleBlockedUntil) return null;
  try {
    const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?maxResults=6&printType=books&q=${encodeURIComponent(q)}`
    );
    if (res.status === 429 || res.status === 403) googleBlockedUntil = Date.now() + GOOGLE_COOLDOWN_MS;
    if (!res.ok) return null;
    const data = await res.json();
    // First result sometimes has no thumbnail — scan a few for a usable one.
    for (const item of data.items || []) {
      const links = item.volumeInfo?.imageLinks;
      const raw = links?.thumbnail || links?.smallThumbnail;
      if (raw) return raw.replace(/^http:/, 'https:').replace('&edge=curl', '');
    }
    return '';
  } catch {
    return null;
  }
}

/** Look up a front-cover image URL from Open Library. '' if none, null if it couldn't answer. */
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
    if (!res.ok) return null;
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : '';
  } catch {
    return null;
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
 * Google first (better covers), Open Library as the fallback. Returns a URL,
 * '' only when both providers answered and neither had a cover, or null when
 * either couldn't answer (so the miss isn't cached and is retried later).
 */
async function lookupBoth(title, author) {
  const google = await lookupGoogleCover(title, author);
  if (google) return google;
  const ol = await lookupCoverUrl(title, author);
  if (ol) return ol;
  return google === '' && ol === '' ? '' : null;
}

/**
 * Force a fresh cover lookup, ignoring any stored/cached URL — backs the
 * "Refresh cover" action for replacing a wrong or low-quality cover.
 */
export async function refreshCover(title, author) {
  await acquire();
  try {
    const display = await lookupBoth(title, author);
    if (display !== null) {
      mem[keyOf(title, author)] = { display, color: '' };
      saveCacheSoon();
    }
    return { coverUrl: display || '', spineColor: '' };
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
    const display = await lookupBoth(title, author);
    // Only remember a definitive answer; a failed lookup is retried next time.
    if (display !== null) {
      mem[k] = { display, color: '' };
      saveCacheSoon();
    }
    return { coverUrl: display || '', spineColor: '' };
  } finally {
    release();
  }
}
