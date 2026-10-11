import { describe, it, expect, beforeEach, vi } from 'vitest';

// Fresh module (and fresh in-memory cache) per test.
let covers;
const gb = (items) => ({ ok: true, status: 200, json: async () => ({ items }) });
const ol = (coverId) => ({ ok: true, status: 200, json: async () => ({ docs: coverId ? [{ cover_i: coverId }] : [] }) });
const status = (code) => ({ ok: false, status: code, json: async () => ({}) });

beforeEach(async () => {
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
  covers = await import('./covers');
});

const isGoogle = (url) => url.includes('googleapis');

describe('cover lookup', () => {
  it('prefers Google and caches the result', async () => {
    const fetch = vi.fn(async () => gb([{ volumeInfo: { imageLinks: { thumbnail: 'http://books.google.com/x&edge=curl' } } }]));
    vi.stubGlobal('fetch', fetch);
    const r = await covers.resolveCover('Dune', 'Frank Herbert');
    expect(r.coverUrl).toBe('https://books.google.com/x');
    await covers.resolveCover('Dune', 'Frank Herbert');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('after a 429, skips Google and goes straight to Open Library', async () => {
    const fetch = vi.fn(async (url) => (isGoogle(url) ? status(429) : ol(42)));
    vi.stubGlobal('fetch', fetch);
    expect((await covers.resolveCover('A', 'X')).coverUrl).toBe('https://covers.openlibrary.org/b/id/42-M.jpg');
    expect((await covers.resolveCover('B', 'Y')).coverUrl).toBe('https://covers.openlibrary.org/b/id/42-M.jpg');
    expect(fetch.mock.calls.filter(([u]) => isGoogle(u))).toHaveLength(1); // only the first book tried Google
  });

  it('does not cache a miss when a provider failed, so it retries later', async () => {
    let down = true;
    const fetch = vi.fn(async (url) => (down ? status(503) : isGoogle(url) ? gb([]) : ol(7)));
    vi.stubGlobal('fetch', fetch);
    expect((await covers.resolveCover('Piranesi', 'Susanna Clarke')).coverUrl).toBe('');
    down = false;
    expect((await covers.resolveCover('Piranesi', 'Susanna Clarke')).coverUrl).toBe('https://covers.openlibrary.org/b/id/7-M.jpg');
  });

  it('caches a genuine "no cover" when both providers answered', async () => {
    const fetch = vi.fn(async (url) => (isGoogle(url) ? gb([]) : ol(null)));
    vi.stubGlobal('fetch', fetch);
    await covers.resolveCover('Obscure', 'Nobody');
    await covers.resolveCover('Obscure', 'Nobody');
    expect(fetch).toHaveBeenCalledTimes(2); // one Google + one OL, then cached
  });
});
