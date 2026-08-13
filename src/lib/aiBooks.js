/**
 * Shared helpers for AI book recommendations. We ask the model for a labeled
 * line format (not JSON) because it's far more robust to quotes/newlines in the
 * longer summary field, and parse it tolerantly.
 */

export const SUGGEST_FORMAT =
  'For EACH recommended book output exactly these labeled lines and nothing else, ' +
  'with a line containing only "---" between books:\n' +
  'Title: <title>\n' +
  'Author: <author>\n' +
  'Pages: <approximate page count, a number>\n' +
  'Genre: <a single genre>\n' +
  'Blurb: <one enticing spoiler-free sentence, max 14 words>\n' +
  'Summary: <2-3 sentence spoiler-free description>';

/** Parse the labeled-line format into suggestion objects. */
export function parseSuggestions(raw) {
  const items = [];
  let cur = null;
  const commit = () => {
    if (cur && cur.title) {
      delete cur._last;
      items.push(cur);
    }
  };
  for (const line of (raw || '').split(/\r?\n/)) {
    const m = line.match(/^\s*(Title|Author|Pages|Genre|Blurb|Summary)\s*:\s*(.*)$/i);
    if (!m) {
      const t = line.trim();
      if (/^-{2,}$/.test(t)) {
        if (cur) cur._last = null; // book separator
        continue;
      }
      if (cur && cur._last === 'summary' && t) cur.summary += ' ' + t;
      continue;
    }
    const key = m[1].toLowerCase();
    const val = m[2].trim().replace(/^["'<]+|["'>]+$/g, '');
    if (key === 'title') {
      commit();
      cur = { title: val, author: '', totalPages: 0, genre: '', blurb: '', summary: '', _last: 'title' };
    } else if (cur) {
      if (key === 'pages') cur.totalPages = parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
      else cur[key] = val;
      cur._last = key;
    }
  }
  commit();
  return items;
}
