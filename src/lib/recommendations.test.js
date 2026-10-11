import { describe, it, expect, vi } from 'vitest';
import {
  isSameBook,
  createBookMatcher,
  filterRecommendations,
  fetchRecommendations,
  normalizeTitle,
  coreTitle,
} from './recommendations';

// Serialize suggestions in the labeled-line format the AI is asked for.
const aiText = (list) =>
  list
    .map((s) => `Title: ${s.title}\nAuthor: ${s.author}\nPages: 300\nGenre: Fiction\nBlurb: b\nSummary: ${s.title} summary.`)
    .join('\n---\n');

const shelf = [
  { _id: '1', title: 'Project Hail Mary', author: 'Andy Weir', status: 'want_to_read' },
  { _id: '2', title: 'The Name of the Wind', author: 'Patrick Rothfuss', status: 'reading' },
  { _id: '3', title: 'Dune', author: 'Frank Herbert', status: 'read' },
  { _id: '4', title: 'Infinite Jest', author: 'David Foster Wallace', status: 'dnf' },
];
const onShelf = createBookMatcher(shelf);

describe('shelf exclusion — every status', () => {
  it('excludes a Want to Read book', () => expect(onShelf({ title: 'Project Hail Mary', author: 'Andy Weir' })).toBe(true));
  it('excludes a Currently Reading book', () => expect(onShelf({ title: 'The Name of the Wind', author: 'Patrick Rothfuss' })).toBe(true));
  it('excludes a Finished book', () => expect(onShelf({ title: 'Dune', author: 'Frank Herbert' })).toBe(true));
  it('excludes a Did Not Finish book', () => expect(onShelf({ title: 'Infinite Jest', author: 'David Foster Wallace' })).toBe(true));
  it('keeps a book that is not on the shelf', () => expect(onShelf({ title: 'Piranesi', author: 'Susanna Clarke' })).toBe(false));
});

describe('identity rules — editions and formatting', () => {
  it.each([
    ['case and whitespace', { title: '  project  HAIL mary ', author: 'andy weir' }],
    ['subtitle / edition', { title: 'Dune: Deluxe Edition', author: 'Frank Herbert' }],
    ['series note', { title: 'The Name of the Wind (The Kingkiller Chronicle, #1)', author: 'Patrick Rothfuss' }],
    ['leading article dropped', { title: 'Name of the Wind', author: 'Patrick Rothfuss' }],
    ['"Last, First" author', { title: 'Dune', author: 'Herbert, Frank' }],
    ['author with initials', { title: 'Infinite Jest', author: 'D. F. Wallace' }],
    ['missing author', { title: 'Dune', author: '' }],
  ])('treats %s as the same book', (_, candidate) => {
    expect(onShelf(candidate)).toBe(true);
  });

  it('folds diacritics, punctuation and "&"', () => {
    expect(isSameBook(
      { title: 'Cien años de soledad', author: 'Gabriel García Márquez' },
      { title: 'Cien Anos de Soledad', author: 'Gabriel Garcia Marquez' }
    )).toBe(true);
    expect(normalizeTitle('Pride & Prejudice')).toBe(normalizeTitle('Pride and Prejudice'));
    expect(normalizeTitle("Harry Potter and the Sorcerer's Stone")).toBe('harry potter and the sorcerers stone');
  });

  it('matches initials-style author names on a shared surname', () => {
    expect(isSameBook(
      { title: 'The Hobbit', author: 'J.R.R. Tolkien' },
      { title: 'The Hobbit', author: 'Tolkien, J. R. R.' }
    )).toBe(true);
  });
});

describe('similar but different books stay eligible', () => {
  it.each([
    ['a sequel with a longer title', { title: 'Dune Messiah', author: 'Frank Herbert' }],
    ['a sequel after a colon-less title', { title: 'Children of Dune', author: 'Frank Herbert' }],
    ['a near-identical title', { title: 'The Name of the Rose', author: 'Umberto Eco' }],
    ['same title, different author', { title: 'Dune', author: 'Someone Else' }],
  ])('%s', (_, candidate) => {
    expect(onShelf(candidate)).toBe(false);
  });

  it('an initials-only author carries no name to compare, so the title decides', () => {
    expect(onShelf({ title: 'Infinite Jest', author: 'D. F. W.' })).toBe(true);
    expect(onShelf({ title: 'Finite Jest', author: 'D. F. W.' })).toBe(false);
  });

  it('keeps the core title distinct from a longer title', () => {
    expect(coreTitle('Dune: Deluxe Edition')).toBe('dune');
    expect(coreTitle('Dune Messiah')).toBe('dune messiah');
  });
});

describe('filterRecommendations', () => {
  it('drops shelf books, excluded books and duplicates, preserving order', () => {
    const out = filterRecommendations(
      [
        { title: 'Piranesi', author: 'Susanna Clarke' },
        { title: 'Dune', author: 'Frank Herbert' }, // finished
        { title: 'Project Hail Mary', author: 'Andy Weir' }, // want to read
        { title: 'Piranesi', author: 'Clarke, Susanna' }, // duplicate edition
        { title: 'Circe', author: 'Madeline Miller' },
        { title: 'Recursion', author: 'Blake Crouch' }, // already shown
        { title: '', author: 'Nobody' }, // malformed
      ],
      { shelf, exclude: [{ title: 'Recursion', author: 'Blake Crouch' }] }
    );
    expect(out.map((s) => s.title)).toEqual(['Piranesi', 'Circe']);
  });
});

describe('fetchRecommendations (shared by Up Next and Discover)', () => {
  const prompt = (avoid, n) => `want ${n}; avoid ${avoid.join('|')}`;

  it('never returns shelf books, even if the AI ignores the avoid list', async () => {
    const generate = vi.fn().mockResolvedValue(aiText([
      { title: 'Dune', author: 'Frank Herbert' },
      { title: 'Project Hail Mary', author: 'Andy Weir' },
      { title: 'Piranesi', author: 'Susanna Clarke' },
    ]));
    const out = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, want: 1, maxRounds: 1 });
    expect(out.map((s) => s.title)).toEqual(['Piranesi']);
  });

  it('asks again to fill the requested count, but at most maxRounds times', async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce(aiText([{ title: 'Dune', author: 'Frank Herbert' }, { title: 'Circe', author: 'Madeline Miller' }]))
      .mockResolvedValueOnce(aiText([{ title: 'Circe', author: 'Madeline Miller' }, { title: 'Piranesi', author: 'Susanna Clarke' }]))
      .mockResolvedValueOnce(aiText([{ title: 'Never Called', author: 'X Y' }]));
    const out = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, want: 3 });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(out.map((s) => s.title)).toEqual(['Circe', 'Piranesi']); // no duplicate Circe
    // The second prompt avoids the shelf and what round one already found.
    expect(generate.mock.calls[1][0]).toContain('Circe');
    expect(generate.mock.calls[1][0]).toContain('Dune');
    expect(generate.mock.calls[1][0]).toMatch(/^want 2;/);
  });

  it('returns an empty list instead of padding with shelf books', async () => {
    const generate = vi.fn().mockResolvedValue(aiText(shelf));
    const out = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, want: 3 });
    expect(out).toEqual([]);
  });

  it('refresh / "show more" never reintroduces already-shown books', async () => {
    const generate = vi.fn().mockResolvedValue(aiText([
      { title: 'Circe', author: 'Madeline Miller' },
      { title: 'Piranesi', author: 'Susanna Clarke' },
    ]));
    const page1 = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, want: 1, maxRounds: 1 });
    const page2 = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, exclude: page1, want: 1, maxRounds: 1 });
    const page3 = await fetchRecommendations({ generate, buildPrompt: prompt, shelf, exclude: [...page1, ...page2], want: 1, maxRounds: 1 });
    expect(page1.map((s) => s.title)).toEqual(['Circe']);
    expect(page2.map((s) => s.title)).toEqual(['Piranesi']);
    expect(page3).toEqual([]);
  });

  it('filters each reader against their own shelf', async () => {
    const generate = vi.fn().mockResolvedValue(aiText([
      { title: 'Dune', author: 'Frank Herbert' },
      { title: 'Circe', author: 'Madeline Miller' },
    ]));
    const alice = [{ title: 'Dune', author: 'Frank Herbert', status: 'want_to_read' }];
    const bob = [{ title: 'Circe', author: 'Madeline Miller', status: 'read' }];
    const forAlice = await fetchRecommendations({ generate, buildPrompt: prompt, shelf: alice, want: 2, maxRounds: 1 });
    const forBob = await fetchRecommendations({ generate, buildPrompt: prompt, shelf: bob, want: 2, maxRounds: 1 });
    expect(forAlice.map((s) => s.title)).toEqual(['Circe']);
    expect(forBob.map((s) => s.title)).toEqual(['Dune']);
  });

  it('surfaces a first-round failure, but keeps results if only a top-up fails', async () => {
    const fail = vi.fn().mockRejectedValue(new Error('AI down'));
    await expect(fetchRecommendations({ generate: fail, buildPrompt: prompt, shelf, want: 2 })).rejects.toThrow('AI down');

    const partial = vi.fn()
      .mockResolvedValueOnce(aiText([{ title: 'Circe', author: 'Madeline Miller' }]))
      .mockRejectedValueOnce(new Error('rate limited'));
    const out = await fetchRecommendations({ generate: partial, buildPrompt: prompt, shelf, want: 2 });
    expect(out.map((s) => s.title)).toEqual(['Circe']);
  });
});
