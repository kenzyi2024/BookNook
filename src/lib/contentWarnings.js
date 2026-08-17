/**
 * Content warnings — reader-contributed, opt-in flags about a book's content,
 * graded by intensity (like StoryGraph). Warnings are stored per book as
 *   contentWarnings: [{ name, level }]   where level ∈ minor | moderate | graphic
 * and are kept hidden behind a reveal in the UI, since a warning can be a spoiler.
 */

export const LEVELS = [
  { key: 'minor', label: 'Minor', accent: '#5E8C4E', bg: '#E6F0DE' },
  { key: 'moderate', label: 'Moderate', accent: '#C4881F', bg: '#FBEED2' },
  { key: 'graphic', label: 'Graphic', accent: '#C0492F', bg: '#FADFD8' },
];

const LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.key, l]));
export const level = (key) => LEVEL_MAP[key] || LEVELS[0];
export const LEVEL_ORDER = { minor: 0, moderate: 1, graphic: 2 };

/**
 * A curated, commonly-used set of categories. Kept factual and neutral — these
 * are labels for tagging a book so other readers can make an informed choice.
 */
export const CW_CATEGORIES = [
  'Violence',
  'Gun violence',
  'War',
  'Death',
  'Death of a parent',
  'Death of a child',
  'Grief',
  'Gore',
  'Body horror',
  'Torture',
  'Kidnapping',
  'Sexual content',
  'Sexual assault',
  'Physical abuse',
  'Emotional abuse',
  'Domestic abuse',
  'Child abuse',
  'Self-harm',
  'Suicide',
  'Suicidal thoughts',
  'Eating disorders',
  'Substance abuse',
  'Addiction',
  'Mental illness',
  'Medical trauma',
  'Pregnancy',
  'Miscarriage',
  'Animal cruelty',
  'Racism',
  'Homophobia',
  'Transphobia',
  'Misogyny',
  'Hate speech',
  'Profanity',
];

/** Map a free-text intensity word to one of our three levels. */
export function normalizeLevel(s = '') {
  const t = s.toLowerCase();
  if (/graphic|severe|heavy|explicit|extreme|high/.test(t)) return 'graphic';
  if (/minor|mild|light|brief|low|slight/.test(t)) return 'minor';
  return 'moderate';
}

/** Prefer the curated spelling of a category if it matches case-insensitively. */
export function canonicalName(name = '') {
  const n = name.trim();
  return CW_CATEGORIES.find((c) => c.toLowerCase() === n.toLowerCase()) || n;
}

/**
 * Parse an AI content-warning suggestion. Handles the labeled-line format
 *   Name: Violence
 *   Level: moderate
 *   ---
 * and an inline "Violence (moderate), Death (graphic)" fallback. Returns [].
 */
export function parseWarnings(text = '') {
  if (/^\s*none[.!]?\s*$/i.test(text.trim())) return [];
  const out = [];

  text
    .split(/\n?-{3,}\n?|\n(?=\s*Name\s*:)/i)
    .map((b) => b.trim())
    .filter(Boolean)
    .forEach((b) => {
      const nameM = b.match(/Name\s*:\s*(.+)/i);
      const lvlM = b.match(/Level\s*:\s*(.+)/i);
      if (nameM) {
        const name = canonicalName(nameM[1].replace(/\*+/g, '').replace(/^[-*•\d.)\s]+/, '').trim());
        if (name) out.push({ name, level: normalizeLevel(lvlM ? lvlM[1] : '') });
      }
    });

  if (!out.length) {
    text.split(/[,;\n]/).forEach((part) => {
      const m = part.trim().match(/^(.+?)\s*\((minor|moderate|graphic|mild|severe|explicit|heavy|brief|light)\)\s*$/i);
      if (m) out.push({ name: canonicalName(m[1].replace(/^[-*•\d.)\s]+/, '')), level: normalizeLevel(m[2]) });
    });
  }

  // Dedupe by name, keeping the highest level seen.
  const order = { minor: 0, moderate: 1, graphic: 2 };
  const map = new Map();
  out.forEach((w) => {
    const cur = map.get(w.name.toLowerCase());
    if (!cur || order[w.level] > order[cur.level]) map.set(w.name.toLowerCase(), w);
  });
  return [...map.values()].slice(0, 20);
}
