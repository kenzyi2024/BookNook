/**
 * Reflections — spaced retrieval practice on your own reading.
 *
 * Instead of letting insight evaporate, BookNook resurfaces short prompts built
 * from a reader's OWN quotes, notes, and analysis, spaced out over expanding
 * intervals. Recalling and re-articulating an idea (rather than rereading it) is
 * what makes it stick — the testing effect + the spacing effect.
 *
 * State lives in a single `reflection` field on each book:
 *   { stage, dueAt, answers: [{ stage, text, date }] }
 * It's created lazily the first time a reader answers, so nothing needs seeding.
 */

// Expanding review intervals, in days. Each answered reflection schedules the
// next one further out.
export const INTERVALS = [2, 7, 21, 45, 90];

const DAY = 86400000;

/** A finished book, or any book the reader has already annotated, is eligible. */
export function isEligible(book) {
  return book.status === 'read' || (book.quotes?.length || 0) > 0;
}

/**
 * The rotating set of prompts for a book, drawn from what the reader actually
 * captured. Stage N shows pool[N % pool.length], so questions vary over time.
 */
export function buildPool(book) {
  const t = book.title;
  const pool = [];

  (book.quotes || []).slice(0, 3).forEach((q) => {
    if (q?.text) pool.push({ kind: 'quote', prompt: `You saved this line from “${t}”:\n\n“${q.text}”\n\nWhat still resonates about it?` });
  });

  if ((book.journalEntries?.length || 0) > 0 || (book.notes || '').trim()) {
    pool.push({ kind: 'note', prompt: `Think back on “${t}.” What moment or idea has stayed with you most?` });
  }

  if ((book.aiAnalysis || '').trim()) {
    pool.push({ kind: 'theme', prompt: `You explored the themes of “${t}.” Which one feels most true to you now — and why?` });
  }

  if ((book.rating || 0) >= 4) {
    pool.push({ kind: 'recommend', prompt: `You loved “${t}.” Who would you hand it to, and what would you say to sell them on it?` });
  }

  // Always available — a clean closing question.
  pool.push({ kind: 'takeaway', prompt: `In one sentence, what will you carry with you from “${t}”?` });

  return pool;
}

function stageOf(book) {
  return book.reflection?.stage || 0;
}

/** When the next reflection for this book is due (ms epoch). */
function dueAtOf(book) {
  if (book.reflection?.dueAt) return +new Date(book.reflection.dueAt);
  // First one becomes due a couple of days after finishing (or now, if that's
  // already in the past or the book was never dated).
  const base = book.finishedAt ? +new Date(book.finishedAt) + 2 * DAY : Date.now();
  return base;
}

/** The prompt to show for a book right now, based on its stage. */
export function currentPrompt(book) {
  const pool = buildPool(book);
  if (!pool.length) return null;
  return pool[stageOf(book) % pool.length];
}

/**
 * Reflections that are due, soonest first. `limit` caps how many we surface at
 * once so the reader is never overwhelmed.
 */
export function dueReflections(books, { now = Date.now(), limit = 6 } = {}) {
  return books
    .filter(isEligible)
    .map((book) => ({ book, due: dueAtOf(book), stage: stageOf(book), prompt: currentPrompt(book) }))
    .filter((x) => x.prompt && x.due <= now)
    .sort((a, b) => a.due - b.due)
    .slice(0, limit);
}

/** Total number currently due (uncapped) — handy for the banner count. */
export function dueCount(books, now = Date.now()) {
  return books.filter(isEligible).filter((b) => currentPrompt(b) && dueAtOf(b) <= now).length;
}

/**
 * The updated `reflection` object to save after a reader answers. Advances the
 * stage and schedules the next review one interval further out.
 */
export function answerReflection(book, text) {
  const stage = stageOf(book);
  const interval = INTERVALS[Math.min(stage, INTERVALS.length - 1)];
  return {
    stage: stage + 1,
    dueAt: new Date(Date.now() + interval * DAY).toISOString(),
    answers: [
      ...(book.reflection?.answers || []),
      { stage, text: text.trim(), date: new Date().toISOString() },
    ],
  };
}

/** Skip (snooze) a reflection to the next interval without recording an answer. */
export function snoozeReflection(book) {
  const stage = stageOf(book);
  const interval = INTERVALS[Math.min(stage, INTERVALS.length - 1)];
  return {
    stage,
    dueAt: new Date(Date.now() + interval * DAY).toISOString(),
    answers: book.reflection?.answers || [],
  };
}
