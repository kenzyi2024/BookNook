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
      `https://www.googleapis.com/books/v1/volumes?maxResults=1&printType=books&q=${encodeURIComponent(q)}`
    );
    if (!res.ok) return '';
    const data = await res.json();
    const links = data.items?.[0]?.volumeInfo?.imageLinks;
    const raw = links?.thumbnail || links?.smallThumbnail || '';
    return raw ? raw.replace(/^http:/, 'https:').replace('&edge=curl', '') : '';
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

/**
 * Average color of an image as an `rgb(...)` string, darkened a touch so white
 * spine text stays legible. Requires a CORS-enabled image; returns '' if the
 * canvas is tainted or the image can't load.
 */
export function dominantColor(url) {
  return new Promise((resolve) => {
    if (!url) return resolve('');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const w = (canvas.width = 24);
        const h = (canvas.height = 24);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // skip near-transparent pixels
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n += 1;
        }
        if (!n) return resolve('');
        const f = 0.72; // darken for contrast with white text
        resolve(
          `rgb(${Math.round((r / n) * f)}, ${Math.round((g / n) * f)}, ${Math.round((b / n) * f)})`
        );
      } catch {
        resolve(''); // tainted canvas (no CORS) — fall back to coverColor
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

/**
 * Resolve `{ coverUrl, spineColor }` for a book, cached by title+author.
 * Pass `knownUrl` (e.g. book.coverUrl from the DB) to skip the lookup.
 */
/**
 * TEMPORARY — force a fresh cover lookup, ignoring any stored/cached URL, to
 * repair books that saved a wrong cover. Prefers Google Books, falls back to
 * Open Library, and re-samples the tint. Remove this along with the detail-page
 * "Refresh cover" button once existing covers are cleaned up.
 */
export async function refreshCover(title, author) {
  const olUrl = await lookupCoverUrl(title, author);
  const color = olUrl ? await dominantColor(olUrl) : '';
  const googleUrl = await lookupGoogleCover(title, author);
  const display = googleUrl || olUrl;
  mem[keyOf(title, author)] = { display, olUrl, color };
  saveCacheSoon();
  return { coverUrl: display, spineColor: color };
}

export async function resolveCover(title, author, knownUrl = '') {
  const k = keyOf(title, author);
  const cached = mem[k];
  if (cached && cached.color !== undefined && (!knownUrl || cached.display === knownUrl)) {
    return { coverUrl: knownUrl || cached.display, spineColor: cached.color };
  }
  // Sample the tint from an Open Library image (CORS-friendly, so the canvas
  // isn't tainted); prefer a stored URL, then a nicer/more-current Google Books
  // cover, then Open Library, for the actual display image.
  const olUrl = await lookupCoverUrl(title, author);
  const color = olUrl ? await dominantColor(olUrl) : '';
  const googleUrl = knownUrl ? '' : await lookupGoogleCover(title, author);
  const display = knownUrl || googleUrl || olUrl;
  mem[k] = { display, olUrl, color };
  saveCacheSoon();
  return { coverUrl: display, spineColor: color };
}
