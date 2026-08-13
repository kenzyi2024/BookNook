import { SPINE_COLORS } from './status';

/**
 * A sample library so anyone can see BookNook populated (great for guests and
 * for screenshots). Statuses, ratings and finish dates are spread out so the
 * Metrics page looks alive. Covers resolve on their own via the cover lookup.
 */

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const color = (i) => SPINE_COLORS[i % SPINE_COLORS.length];

const RAW = [
  ['The Song of Achilles', 'Madeline Miller', 'Historical', 416, 'read', 5, 40],
  ['Circe', 'Madeline Miller', 'Fantasy', 393, 'read', 5, 95],
  ['Project Hail Mary', 'Andy Weir', 'Science Fiction', 496, 'read', 5, 12],
  ['The Silent Patient', 'Alex Michaelides', 'Mystery & Thriller', 336, 'read', 4, 20],
  ['Educated', 'Tara Westover', 'Biography & Memoir', 334, 'read', 5, 60],
  ['Where the Crawdads Sing', 'Delia Owens', 'Fiction', 384, 'read', 4, 150],
  ['The Midnight Library', 'Matt Haig', 'Fiction', 288, 'read', 3, 200],
  ['Klara and the Sun', 'Kazuo Ishiguro', 'Science Fiction', 320, 'read', 4, 75],
  ['A Little Life', 'Hanya Yanagihara', 'Fiction', 720, 'read', 5, 8],
  ['Normal People', 'Sally Rooney', 'Fiction', 273, 'read', 4, 110],
  ['The Name of the Wind', 'Patrick Rothfuss', 'Fantasy', 662, 'read', 5, 30],
  ['Atomic Habits', 'James Clear', 'Self-Help', 320, 'read', 4, 130],
  ['Dune', 'Frank Herbert', 'Science Fiction', 412, 'reading', 0, 220],
  ['Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'Fiction', 401, 'reading', 0, 140],
  ['Babel', 'R. F. Kuang', 'Fantasy', 545, 'want_to_read', 0, 0],
  ['The Priory of the Orange Tree', 'Samantha Shannon', 'Fantasy', 848, 'want_to_read', 0, 0],
  ['Sapiens', 'Yuval Noah Harari', 'History', 443, 'want_to_read', 0, 0],
  ['Crying in H Mart', 'Michelle Zauner', 'Biography & Memoir', 256, 'want_to_read', 0, 0],
  ['Piranesi', 'Susanna Clarke', 'Fantasy', 245, 'dnf', 2, 90],
];

/** Fresh sample-book objects (no _id — the caller assigns/creates them). */
export function buildMockBooks() {
  return RAW.map(([title, author, genre, totalPages, status, rating, daysSinceFinish], i) => {
    const book = {
      title,
      author,
      genre,
      totalPages,
      status,
      coverColor: color(i),
      currentPage: status === 'read' ? totalPages : status === 'reading' ? Math.round(totalPages * (0.3 + (i % 5) * 0.1)) : 0,
    };
    if (status === 'read') {
      if (rating) book.rating = rating;
      book.finishedAt = daysAgo(daysSinceFinish);
    }
    return book;
  });
}
