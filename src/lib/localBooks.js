/**
 * Guest (local-only) data store. When someone chooses "Continue as guest", their
 * books and profile live entirely in this device's localStorage — no backend, no
 * account. They can convert to a real account later, which uploads this data.
 */

const BOOKS_KEY = 'booknook_guest_books';
const PROFILE_KEY = 'booknook_guest_profile';

const rid = () => `local-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* quota / private mode */
  }
}

export const localBooks = {
  all: () => read(BOOKS_KEY, []),
  set: (arr) => write(BOOKS_KEY, arr),
  create(book) {
    const now = new Date().toISOString();
    const b = {
      currentPage: 0,
      sessions: [],
      journalEntries: [],
      quotes: [],
      ...book,
      _id: rid(),
      createdAt: book.createdAt || now,
      updatedAt: now,
    };
    write(BOOKS_KEY, [b, ...this.all()]);
    return b;
  },
  update(id, updates) {
    const now = new Date().toISOString();
    const arr = this.all().map((b) => (b._id === id ? { ...b, ...updates, updatedAt: now } : b));
    write(BOOKS_KEY, arr);
    return arr.find((b) => b._id === id);
  },
  remove(id) {
    write(BOOKS_KEY, this.all().filter((b) => b._id !== id));
  },
  clear() {
    write(BOOKS_KEY, []);
  },
};

export const localProfile = {
  get: () => read(PROFILE_KEY, null),
  set: (p) => write(PROFILE_KEY, p),
};

export const hasGuestBooks = () => read(BOOKS_KEY, []).length > 0;

export function clearGuestData() {
  try {
    localStorage.removeItem(BOOKS_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}
