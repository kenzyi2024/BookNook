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

const stripMd = (s = '') => s.replace(/\*\*|\*|`|_/g, '').trim();

/** A short, clean excerpt of a longer note/entry for use inside a prompt. */
function snippet(text = '', max = 160) {
  const t = stripMd(text).replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max).trim()}…` : t;
}

/**
 * Pull the actual theme names out of a cached Analysis Kit so prompts can name
 * them back to the reader instead of saying a vague "the themes." Tolerant of the
 * bold-header / bulleted format the kit produces; returns [] if it can't tell.
 */
export function extractThemes(analysis = '') {
  if (!analysis) return [];
  const lines = analysis.split(/\r?\n/);

  // Strip markdown + any leading bullet/number so we can inspect a line's text.
  const clean = (s) => stripMd(s).replace(/^[\s\-*••\d.)]+/, '').trim();
  // A line that's really a *section header* (Themes / Motifs / Question / etc.) —
  // never a theme itself.
  const isSection = (s) =>
    /^(the\s+)?(major|key|central|main|core)?\s*(themes?|motifs?|symbols?|imagery|questions?|a\s+question|characters?|summary|analysis|takeaways?)\b/i.test(clean(s));
  // The specific header that introduces the theme list.
  const isThemeHeader = (s) => {
    const c = clean(s).replace(/[:.]+$/, '');
    return /^(the\s+)?(major|key|central|main|core)?\s*themes?$/i.test(c);
  };

  // Find the themes header — a dedicated header line first, else an inline
  // "Themes: a, b, c" line. Anything vaguer is ignored (avoids grabbing prose).
  let idx = lines.findIndex(isThemeHeader);
  if (idx === -1) {
    idx = lines.findIndex((l) => /themes?\s*:/i.test(l) && l.split(':').slice(1).join(':').includes(','));
  }
  if (idx === -1) return [];

  const items = [];
  const push = (raw) => {
    const c = clean(raw).split(/[—:–]/)[0].replace(/[.,;]+$/, '').trim();
    if (c && c.length >= 3 && c.length <= 44 && !isSection(c)) items.push(c);
  };

  // Inline list on the header line itself.
  const afterColon = lines[idx].split(':').slice(1).join(':');
  if (afterColon && afterColon.includes(',')) {
    afterColon.split(/[,;]/).forEach((p) => {
      const c = stripMd(p).trim();
      if (c && c.length <= 44 && !isSection(c)) items.push(c);
    });
  }

  // Otherwise, the listed items that follow, stopping at the next section.
  for (let j = idx + 1; j < lines.length && items.length < 4; j++) {
    const raw = lines[j];
    if (!raw.trim()) { if (items.length) break; else continue; }
    if (isSection(raw)) break;
    const looksItem = /^\s*[-*••]/.test(raw) || /^\s*\d+[.)]/.test(raw) || /\*\*/.test(raw);
    if (!looksItem) { if (items.length) break; else continue; }
    push(raw);
  }

  return items.slice(0, 4);
}

/**
 * The rotating set of prompts for a book, drawn from what the reader actually
 * captured. Stage N shows pool[N % pool.length], so questions vary over time.
 */
export function buildPool(book) {
  const t = book.title;
  const pool = [];

  (book.quotes || []).slice(0, 3).forEach((q) => {
    if (q?.text) pool.push({ kind: 'quote', prompt: `You saved this line from “${t}”${q.page ? ` (p.${q.page})` : ''}:\n\n“${q.text}”\n\nWhat still resonates about it?` });
  });

  // Reference the reader's actual journal entry / note, not a vague "your notes."
  const lastEntry = (book.journalEntries || []).slice(-1)[0];
  if (lastEntry?.text) {
    pool.push({ kind: 'note', prompt: `You wrote in your journal about “${t}”:\n\n“${snippet(lastEntry.text)}”\n\nReading it back now, what stands out?` });
  } else if ((book.notes || '').trim()) {
    pool.push({ kind: 'note', prompt: `Your note on “${t}” reads:\n\n“${snippet(book.notes)}”\n\nWhat would you add to it now?` });
  }

  // Name the actual themes from the Analysis Kit when we can parse them.
  if ((book.aiAnalysis || '').trim()) {
    const themes = extractThemes(book.aiAnalysis);
    if (themes.length) {
      pool.push({ kind: 'theme', prompt: `In your Analysis Kit for “${t}” you flagged these themes:\n\n${themes.map((x) => `• ${x}`).join('\n')}\n\nWhich one resonates most with you now — and where did you feel it in the story?` });
    } else {
      pool.push({ kind: 'theme', prompt: `Looking back at “${t},” what do you think it was really about — and what in the story makes you say so?` });
    }
  }

  if ((book.rating || 0) >= 4) {
    pool.push({ kind: 'recommend', prompt: `You rated “${t}” ${book.rating}★. Who would you hand it to, and what one line would you use to sell them on it?` });
  }

  // Always available — a clean closing question.
  pool.push({ kind: 'takeaway', prompt: `In one sentence, what will you carry with you from “${t}”?` });

  return pool;
}

/** The prompt object a given stage maps to (used to label saved answers). */
export function promptForStage(book, stage) {
  const pool = buildPool(book);
  if (!pool.length) return null;
  return pool[stage % pool.length];
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

/** Is a single book's next reflection ready right now? */
export function isDue(book, now = Date.now()) {
  return isEligible(book) && !!currentPrompt(book) && dueAtOf(book) <= now;
}

/** When this book's next reflection is due (Date), or null if it has none. */
export function nextDueAt(book) {
  return isEligible(book) && currentPrompt(book) ? new Date(dueAtOf(book)) : null;
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

/**
 * Append a follow-up thought to an existing answer (by its index in
 * book.reflection.answers). Nothing is ever overwritten or removed — later
 * thoughts simply stack under the original, so a reflection can keep growing.
 */
export function addFollowUp(book, index, text) {
  const answers = (book.reflection?.answers || []).map((a, i) =>
    i === index
      ? { ...a, followUps: [...(a.followUps || []), { text: text.trim(), date: new Date().toISOString() }] }
      : a
  );
  return { ...(book.reflection || { stage: 0 }), answers };
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
