/**
 * Reading dates (`startedAt` / `finishedAt`) are calendar days, not moments.
 *
 * We send them to the server as 'YYYY-MM-DD' "date keys"; the server stores them
 * as UTC midnight of that day. Older books may hold a full timestamp in
 * `finishedAt` (it used to be set to "now" on finishing) — those are read as the
 * reader's *local* calendar day. Everything that displays or buckets a reading
 * date goes through `toDateKey` / `readingDate` so nothing is off by a day.
 */

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIDNIGHT_UTC_RE = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.0+)?Z$/;

const pad = (n) => String(n).padStart(2, '0');
const localKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** True for a real calendar date in 'YYYY-MM-DD' form (rejects 2026-02-30). */
export function isDateKey(value) {
  const m = KEY_RE.exec(value || '');
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1000) return false; // e.g. a half-typed year like 0002
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

/**
 * Normalize any stored reading-date value to a 'YYYY-MM-DD' key, or '' if
 * empty/invalid.
 */
export function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (KEY_RE.test(value)) return isDateKey(value) ? value : '';
    const m = MIDNIGHT_UTC_RE.exec(value);
    if (m) return m[1]; // stored calendar date
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : localKey(d); // legacy timestamp → local day
}

/** Today's date key in the reader's local timezone. */
export const todayKey = (now = new Date()) => localKey(now);

/** A local Date (at noon, clear of DST edges) for a reading-date value, or null. */
export function readingDate(value) {
  const key = toDateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** When a finished book was finished, for stats — falls back to its last update. */
export const finishedOn = (book) => readingDate(book?.finishedAt) || (book?.updatedAt ? new Date(book.updatedAt) : null);

/** "Mar 9, 2026" for a reading date. */
export function formatReadingDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = readingDate(value);
  return d ? d.toLocaleDateString(undefined, opts) : '';
}

/**
 * Days spent reading, counting both the start and the finish day — so a book
 * started and finished on the same day took 1 day, and Mar 1 → Mar 3 took 3.
 * Returns null unless both dates are present and in order.
 */
export function readingDays(startedAt, finishedAt) {
  const s = readingDate(startedAt);
  const f = readingDate(finishedAt);
  if (!s || !f || f < s) return null;
  return Math.round((f - s) / 86400000) + 1;
}

/** Validation message for a pair of date keys, or '' if they're fine. */
export function validateReadingDates({ startedAt, finishedAt }) {
  if (startedAt && !isDateKey(startedAt)) return 'Enter a valid start date.';
  if (finishedAt && !isDateKey(finishedAt)) return 'Enter a valid finish date.';
  if (startedAt && finishedAt && finishedAt < startedAt) return 'The finish date can’t be before the start date.';
  return '';
}

/**
 * Extra updates to apply when a book's status changes: record today as the
 * start date when it moves to "reading", and the finish date when it's
 * finished — but only when that date is empty, so a date the reader already
 * entered is never overwritten. Leaving a status never clears a date.
 *
 * Returns `{ updates, filled }`, where `filled` lists which dates were set so
 * the UI can tell the reader.
 */
export function datesForStatus(book, status, now = new Date()) {
  const today = todayKey(now);
  const started = toDateKey(book?.startedAt);
  const finished = toDateKey(book?.finishedAt);
  const updates = {};
  const filled = [];
  // Finishing a book never invents a start date — we don't know when it began.
  if (status === 'reading' && !started) {
    updates.startedAt = today;
    filled.push('start');
  }
  if (status === 'read' && !finished && !(started && started > today)) {
    updates.finishedAt = today;
    filled.push('finish');
  }
  return { updates, filled };
}

/** Human message for auto-filled dates (for a toast). */
export function filledMessage(filled) {
  if (!filled.length) return '';
  const what = filled.length === 2 ? 'Start and finish dates' : filled[0] === 'start' ? 'Start date' : 'Finish date';
  return `${what} set to today — you can change ${filled.length === 2 ? 'them' : 'it'} under Reading dates.`;
}
