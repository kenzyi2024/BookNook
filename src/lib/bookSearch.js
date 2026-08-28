/**
 * Book search.
 *
 * Primary source is the Google Books API — faster, better title relevance, and
 * richer metadata (authors, page count, categories, nicer covers) than Open
 * Library. If Google returns nothing (or errors), we fall back to Open Library
 * so search still works.
 *
 * Every result is normalized to: { id, title, author, totalPages, coverUrl, genre }.
 */

import { normalizeGenre } from './genres';

// Google's cover URLs come back as http with a page-curl overlay; clean them up.
function cleanGoogleCover(links) {
  if (!links) return '';
  const raw = links.thumbnail || links.smallThumbnail || '';
  if (!raw) return '';
  return raw.replace(/^http:/, 'https:').replace('&edge=curl', '');
}

async function searchGoogle(query) {
  const url =
    'https://www.googleapis.com/books/v1/volumes?printType=books&maxResults=20&q=' +
    encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const data = await res.json();
  return (data.items || [])
    .map((item) => {
      const v = item.volumeInfo || {};
      if (!v.title) return null;
      return {
        id: item.id,
        title: v.title + (v.subtitle ? `: ${v.subtitle}` : ''),
        author: v.authors?.length ? v.authors.join(', ') : 'Unknown Author',
        totalPages: v.pageCount || 0,
        coverUrl: cleanGoogleCover(v.imageLinks),
        genre: normalizeGenre(v.categories?.[0]),
      };
    })
    .filter(Boolean);
}

async function searchOpenLibrary(query) {
  const url =
    'https://openlibrary.org/search.json?limit=20&fields=key,title,author_name,number_of_pages_median,cover_i,subject&q=' +
    encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = await res.json();
  return (data.docs || [])
    .filter((d) => d.title)
    .map((d) => ({
      id: d.key || d.title,
      title: d.title,
      author: d.author_name?.length ? d.author_name.join(', ') : 'Unknown Author',
      totalPages: d.number_of_pages_median || 0,
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : '',
      genre: normalizeGenre(d.subject?.[0]),
    }));
}

/**
 * Search books by title/author. Returns a normalized result array. Throws only
 * when BOTH providers are unreachable, so the UI can tell a real outage from a
 * genuine "no matches" result and offer a retry.
 */
export async function searchBooks(query) {
  const q = (query || '').trim();
  if (q.length <= 2) return [];
  let googleOk = false;
  try {
    const g = await searchGoogle(q);
    googleOk = true;
    if (g.length) return g;
  } catch {
    /* google unreachable — fall through to Open Library */
  }
  try {
    return await searchOpenLibrary(q);
  } catch {
    if (googleOk) return []; // Google responded with nothing; OL just failed — treat as no matches.
    throw new Error('Book search is unavailable right now. Please try again.');
  }
}
