/**
 * Cover image preloading + "already decoded" registry.
 *
 * The browser's HTTP/memory cache holds the bytes; this module just tracks which
 * cover URLs have finished loading (or failed) in this session, so a freshly
 * mounted <BookCover> can paint an already-loaded cover immediately instead of
 * starting from a placeholder and fading in — that fade is what made covers
 * look like they reloaded when a hover card re-opened.
 *
 * `preloadImage` warms covers before they're shown (e.g. a spine's hover-card
 * cover while it sits on the shelf). It dedupes concurrent requests per URL and
 * caps how many run at once so a big shelf can't saturate the connection pool.
 * The status registry is bounded (LRU); at most MAX_RETAINED small cover
 * images are kept referenced (see below).
 */

const MAX_ENTRIES = 600;
const MAX_CONCURRENT = 6;
// Preloaded <img> objects kept referenced so the browser keeps them in its
// in-memory image cache. Without this the preload can be garbage-collected and
// the first real <img> re-requests the URL — and Open Library covers redirect
// through a non-cacheable hop, so that costs a full network round-trip.
const MAX_RETAINED = 200;
const retained = new Map(); // url -> HTMLImageElement

const status = new Map(); // url -> 'loaded' | 'error'
const inflight = new Map(); // url -> Promise<boolean>
const queue = []; // { url, priority, resolve }
let active = 0;

function remember(url, value) {
  status.delete(url); // re-insert to refresh LRU order
  status.set(url, value);
  if (status.size > MAX_ENTRIES) status.delete(status.keys().next().value);
}

/** True once this URL has loaded successfully in this session. */
export const isImageReady = (url) => Boolean(url) && status.get(url) === 'loaded';
/** True if this URL already failed in this session (don't keep retrying it). */
export const isImageFailed = (url) => Boolean(url) && status.get(url) === 'error';

/** Called by <BookCover> when its <img> settles, so every view shares the result. */
export const markImageLoaded = (url) => url && remember(url, 'loaded');
export const markImageFailed = (url) => url && remember(url, 'error');

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    // High-priority (on-screen) work jumps the queue.
    const idx = queue.findIndex((q) => q.priority === 'high');
    const job = queue.splice(idx === -1 ? 0 : idx, 1)[0];
    if (isImageReady(job.url) || isImageFailed(job.url)) {
      job.resolve(isImageReady(job.url));
      continue;
    }
    active += 1;
    const img = new Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) img.fetchPriority = job.priority === 'high' ? 'high' : 'low';
    const done = (ok) => {
      active -= 1;
      if (ok) {
        retained.delete(job.url);
        retained.set(job.url, img);
        if (retained.size > MAX_RETAINED) retained.delete(retained.keys().next().value);
        remember(job.url, 'loaded');
      } else remember(job.url, 'error');
      job.resolve(ok);
      pump();
    };
    img.onload = () => {
      // Decode off the main thread so the first paint of the cover is instant.
      (img.decode ? img.decode() : Promise.resolve()).then(() => done(true), () => done(true));
    };
    img.onerror = () => done(false);
    img.src = job.url;
  }
}

/**
 * Warm a cover URL. Resolves true when it's loaded, false if it failed.
 * Safe to call repeatedly — one request per URL per session.
 */
export function preloadImage(url, { priority = 'low' } = {}) {
  if (!url || typeof Image === 'undefined') return Promise.resolve(false);
  if (isImageReady(url)) return Promise.resolve(true);
  if (isImageFailed(url)) return Promise.resolve(false);
  if (inflight.has(url)) {
    if (priority === 'high') {
      const q = queue.find((j) => j.url === url);
      if (q) q.priority = 'high';
    }
    return inflight.get(url);
  }
  const p = new Promise((resolve) => {
    queue.push({ url, priority, resolve });
    pump();
  }).finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

/** Test hook. */
export function _resetImageCache() {
  status.clear();
  inflight.clear();
  retained.clear();
  queue.length = 0;
  active = 0;
}
