/**
 * Highlighter colors for annotations. Fixed, warm highlighter tones (not tied to
 * the app theme) so a quote's highlight reads the same everywhere. `key` is what
 * gets stored on the annotation.
 */
export const HIGHLIGHTS = [
  { key: 'amber', label: 'Amber', bg: '#FDE8A8', accent: '#D98A15' },
  { key: 'rose', label: 'Rose', bg: '#FAD1DE', accent: '#DB2777' },
  { key: 'green', label: 'Green', bg: '#C7EFCF', accent: '#15A34A' },
  { key: 'blue', label: 'Blue', bg: '#CBE0FB', accent: '#2563EB' },
  { key: 'purple', label: 'Purple', bg: '#E6D6FB', accent: '#7C3AED' },
];

const MAP = Object.fromEntries(HIGHLIGHTS.map((h) => [h.key, h]));
export const DEFAULT_HIGHLIGHT = 'amber';

/** Look up a highlight by key, falling back to the default. */
export function highlight(key) {
  return MAP[key] || MAP[DEFAULT_HIGHLIGHT];
}

/** Normalize a comma/space separated tag string into a clean array. */
export function parseTags(input = '') {
  return [...new Set(
    input
      .split(/[,]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
  )].slice(0, 6);
}
