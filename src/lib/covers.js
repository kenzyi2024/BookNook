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

const CACHE_KEY = 'booknook.covers.v2';

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
export async function resolveCover(title, author, knownUrl = '') {
  const k = keyOf(title, author);
  const cached = mem[k];
  if (cached && cached.color !== undefined && (!knownUrl || cached.url === knownUrl)) {
    return { coverUrl: cached.url, spineColor: cached.color };
  }
  const url = knownUrl || (await lookupCoverUrl(title, author));
  const color = url ? await dominantColor(url) : '';
  mem[k] = { url, color };
  saveCacheSoon();
  return { coverUrl: url, spineColor: color };
}
