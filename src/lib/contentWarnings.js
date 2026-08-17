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
