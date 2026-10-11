import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { preloadImage, isImageReady, isImageFailed, markImageLoaded, _resetImageCache } from './imageCache';

// Minimal Image stand-in: records requests; tests settle them by hand.
let created;
class FakeImage {
  constructor() { created.push(this); }
  set src(url) { this._src = url; }
  get src() { return this._src; }
  decode() { return Promise.resolve(); }
}
const settle = async (img, ok = true) => { (ok ? img.onload : img.onerror)(); await Promise.resolve(); await Promise.resolve(); };

beforeEach(() => { created = []; _resetImageCache(); vi.stubGlobal('Image', FakeImage); });
afterEach(() => vi.unstubAllGlobals());

describe('cover preloading', () => {
  it('requests each URL once, however many callers ask', async () => {
    const a = preloadImage('https://covers/1.jpg');
    const b = preloadImage('https://covers/1.jpg');
    expect(created).toHaveLength(1);
    await settle(created[0]);
    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
    expect(isImageReady('https://covers/1.jpg')).toBe(true);
    await preloadImage('https://covers/1.jpg'); // already loaded — no new request
    expect(created).toHaveLength(1);
  });

  it('caps concurrent requests and lets on-screen covers jump the queue', async () => {
    for (let i = 0; i < 10; i++) preloadImage(`https://covers/low-${i}.jpg`);
    preloadImage('https://covers/visible.jpg', { priority: 'high' });
    expect(created).toHaveLength(6);
    await settle(created[0]);
    expect(created[6].src).toBe('https://covers/visible.jpg');
  });

  it('remembers failures so a broken cover is not retried every render', async () => {
    const p = preloadImage('https://covers/broken.jpg');
    await settle(created[0], false);
    await expect(p).resolves.toBe(false);
    expect(isImageFailed('https://covers/broken.jpg')).toBe(true);
    await preloadImage('https://covers/broken.jpg');
    expect(created).toHaveLength(1);
  });

  it('keeps the registry bounded', () => {
    for (let i = 0; i < 700; i++) markImageLoaded(`https://covers/${i}.jpg`);
    expect(isImageReady('https://covers/0.jpg')).toBe(false); // evicted
    expect(isImageReady('https://covers/699.jpg')).toBe(true);
  });
});
