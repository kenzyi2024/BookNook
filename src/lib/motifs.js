/**
 * Helpers for the theme/motif tracker.
 *
 * A book carries:
 *   motifs: [{ id, name, sightings: [{ id, page, note, date }] }]
 *   motifSynthesis: string   (cached AI closing synthesis)
 */
import { makeId } from './characters';

export { makeId };

const stripMd = (s = '') => s.replace(/\*\*|\*|`|_/g, '').trim();

/**
 * Pull motif / symbol names out of a cached Analysis Kit. Mirrors the theme
 * parser but anchors on a "Motifs" / "Symbols" / "Imagery" header. Returns [] if
 * it can't confidently parse a list.
 */
export function extractMotifs(analysis = '') {
  if (!analysis) return [];
  const lines = analysis.split(/\r?\n/);

  const clean = (s) => stripMd(s).replace(/^[\s\-*••\d.)]+/, '').trim();
  const isSection = (s) =>
    /^(the\s+)?(major|key|central|main|core)?\s*(themes?|motifs?|symbols?|imagery|questions?|a\s+question|characters?|summary|analysis|takeaways?)\b/i.test(clean(s));
  const isMotifHeader = (s) => {
    const c = clean(s).replace(/[:.]+$/, '');
    return /^(key\s+)?(motifs?|symbols?|imagery)(\s*(&|and|\/)\s*(motifs?|symbols?|imagery))?$/i.test(c);
  };

  let idx = lines.findIndex(isMotifHeader);
  if (idx === -1) {
    idx = lines.findIndex((l) => /(motifs?|symbols?)\s*:/i.test(l) && l.split(':').slice(1).join(':').includes(','));
  }
  if (idx === -1) return [];

  const items = [];
  const push = (raw) => {
    const c = clean(raw).split(/[—:–]/)[0].replace(/[.,;]+$/, '').trim();
    if (c && c.length >= 2 && c.length <= 44 && !isSection(c)) items.push(c);
  };

  const afterColon = lines[idx].split(':').slice(1).join(':');
  if (afterColon && afterColon.includes(',')) {
    afterColon.split(/[,;]/).forEach((p) => {
      const c = stripMd(p).trim();
      if (c && c.length <= 44 && !isSection(c)) items.push(c);
    });
  }

  for (let j = idx + 1; j < lines.length && items.length < 6; j++) {
    const raw = lines[j];
    if (!raw.trim()) { if (items.length) break; else continue; }
    if (isSection(raw)) break;
    const looksItem = /^\s*[-*••]/.test(raw) || /^\s*\d+[.)]/.test(raw) || /\*\*/.test(raw);
    if (!looksItem) { if (items.length) break; else continue; }
    push(raw);
  }

  return items.slice(0, 6);
}

/** A fresh motif record. */
export function newMotif(name) {
  return { id: makeId('m'), name: name.trim(), sightings: [] };
}

/** A fresh sighting record. */
export function newSighting(page, note) {
  return { id: makeId('s'), page: parseInt(page, 10) || 0, note: (note || '').trim(), date: new Date().toISOString() };
}
