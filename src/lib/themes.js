/**
 * Color themes. Each overrides the brand ramp + paper tint via CSS variables,
 * so the whole app re-skins instantly. Surfaces/ink stay light for readability.
 */
export const THEMES = {
  terracotta: {
    label: 'Terracotta',
    swatch: '#C05D22',
    vars: {
      '--color-brand-50': '#FBF1EA', '--color-brand-100': '#F6E1D0', '--color-brand-200': '#EAC0A0',
      '--color-brand-300': '#DD9E72', '--color-brand-400': '#CE7A45', '--color-brand-500': '#C05D22',
      '--color-brand-600': '#A34B18', '--color-brand-700': '#833B12', '--color-brand-800': '#632C0D',
      '--color-brand-900': '#4A2109', '--color-paper': '#FBF7EF',
    },
  },
  forest: {
    label: 'Forest',
    swatch: '#417B2E',
    vars: {
      '--color-brand-50': '#EEF4EC', '--color-brand-100': '#D6E7CF', '--color-brand-200': '#AECDA0',
      '--color-brand-300': '#82B06E', '--color-brand-400': '#5E9448', '--color-brand-500': '#417B2E',
      '--color-brand-600': '#326022', '--color-brand-700': '#274C1B', '--color-brand-800': '#1E3A15',
      '--color-brand-900': '#162B10', '--color-paper': '#F3F6EE',
    },
  },
  plum: {
    label: 'Plum',
    swatch: '#833C81',
    vars: {
      '--color-brand-50': '#F5EEF5', '--color-brand-100': '#E8D6E8', '--color-brand-200': '#D0AAD0',
      '--color-brand-300': '#B77CB6', '--color-brand-400': '#9E559C', '--color-brand-500': '#833C81',
      '--color-brand-600': '#6B2E69', '--color-brand-700': '#552453', '--color-brand-800': '#331532',
      '--color-brand-900': '#260F26', '--color-paper': '#F7F0F5',
    },
  },
  ocean: {
    label: 'Ocean',
    swatch: '#1F7C8C',
    vars: {
      '--color-brand-50': '#E9F3F5', '--color-brand-100': '#CBE6EA', '--color-brand-200': '#9CCED6',
      '--color-brand-300': '#66B2BE', '--color-brand-400': '#3C97A6', '--color-brand-500': '#1F7C8C',
      '--color-brand-600': '#166470', '--color-brand-700': '#114E58', '--color-brand-800': '#0D3C44',
      '--color-brand-900': '#0A2D33', '--color-paper': '#EEF5F5',
    },
  },
  sage: {
    label: 'Sage',
    swatch: '#67754A',
    vars: {
      '--color-brand-50': '#F0F2EC', '--color-brand-100': '#DEE3D3', '--color-brand-200': '#C0C9AD',
      '--color-brand-300': '#9FAC85', '--color-brand-400': '#829063', '--color-brand-500': '#67754A',
      '--color-brand-600': '#515D3A', '--color-brand-700': '#3F492E', '--color-brand-800': '#2F3722',
      '--color-brand-900': '#232819', '--color-paper': '#F4F5EE',
    },
  },
  rose: {
    label: 'Rose',
    swatch: '#BE4157',
    vars: {
      '--color-brand-50': '#FBEEF0', '--color-brand-100': '#F6D8DD', '--color-brand-200': '#ECB0BA',
      '--color-brand-300': '#E08696', '--color-brand-400': '#D15E73', '--color-brand-500': '#BE4157',
      '--color-brand-600': '#9E3145', '--color-brand-700': '#7E2637', '--color-brand-800': '#601D2A',
      '--color-brand-900': '#47151F', '--color-paper': '#FBF1F1',
    },
  },

};

export const DEFAULT_THEME = 'terracotta';

// --- tiny color helpers so dark mode + spines can be derived from the ramp ---
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(rgb) {
  return '#' + rgb.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
/** Linear blend of two hex colors. t=0 → a, t=1 → b. */
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t));
}

/**
 * Dark mode is a TOGGLE, not a separate palette — but instead of a fixed amber
 * wash it's now a DARK VERSION OF THE CHOSEN THEME. Surfaces become a near-black
 * tinted with the theme's deepest hue, tint-backgrounds go dark, and the mid
 * tones stay the chosen color (brightened a touch) so buttons + accents read as
 * "the theme, at night" rather than black/yellow.
 */
export function darkVarsFor(theme) {
  const v = theme.vars || THEMES[DEFAULT_THEME].vars;
  const b = (n) => v[`--color-brand-${n}`];
  const INK = '#0A0705'; // warm near-black we blend toward
  const deep = b(900);
  return {
    // Surfaces + primary text — dark, hue-tinted, not pure black
    '--color-paper': mix(deep, INK, 0.74),
    '--color-surface': mix(deep, INK, 0.58),
    '--color-ink': mix(b(50), '#FFFFFF', 0.5),

    // Brand ramp: tint-backgrounds (50–200) go deep; 300–500 stay the chosen
    // color for buttons/accents; 600–900 become light tints for text.
    '--color-brand-50': mix(deep, INK, 0.52),
    '--color-brand-100': mix(deep, INK, 0.4),
    '--color-brand-200': mix(b(800), INK, 0.25),
    '--color-brand-300': b(600),
    '--color-brand-400': b(500),
    '--color-brand-500': b(400),
    '--color-brand-600': b(300),
    '--color-brand-700': mix(b(200), '#FFFFFF', 0.12),
    '--color-brand-800': mix(b(100), '#FFFFFF', 0.25),
    '--color-brand-900': mix(b(50), '#FFFFFF', 0.4),

    // Stone ramp: 50–300 warm dark surfaces/borders (hue-tinted), 400–800 warm
    // light text.
    '--color-stone-50': mix(deep, INK, 0.58),
    '--color-stone-100': mix(deep, INK, 0.48),
    '--color-stone-200': mix(b(800), INK, 0.32),
    '--color-stone-300': mix(b(700), INK, 0.15),
    '--color-stone-400': mix(b(300), '#FFFFFF', 0.15),
    '--color-stone-500': mix(b(200), '#FFFFFF', 0.28),
    '--color-stone-600': mix(b(100), '#FFFFFF', 0.4),
    '--color-stone-700': mix(b(50), '#FFFFFF', 0.55),
    '--color-stone-800': mix(b(50), '#FFFFFF', 0.75),

    // Warm wash for the hero/insight gradient stops.
    '--color-amber-50': mix(deep, INK, 0.5),
    '--color-amber-100': mix(deep, INK, 0.36),

    // Status accents, brightened for legibility on dark surfaces.
    '--color-status-reading': '#E0912F', '--color-status-read': '#46A578',
    '--color-status-want': '#6C9BD2', '--color-status-dnf': '#D66A6A',
  };
}

/**
 * Spine shades — six dark/saturated tones drawn from the chosen theme's LIGHT
 * ramp. Kept constant across light + dark so every book on the shelf is a shade
 * of the theme color (cohesive) and white spine text stays legible in both modes.
 */
function spineVarsFor(theme) {
  const v = theme.vars || THEMES[DEFAULT_THEME].vars;
  const order = [400, 500, 600, 700, 800, 300];
  const out = {};
  order.forEach((n, i) => { out[`--spine-${i + 1}`] = v[`--color-brand-${n}`]; });
  return out;
}

// Tracks the custom properties set last time so we can clear them on change.
let appliedKeys = [];

export function applyTheme(id, dark = false) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  appliedKeys.forEach((k) => root.style.removeProperty(k));
  const vars = {
    ...(theme.vars || {}),
    ...spineVarsFor(theme),            // spine palette — same in light + dark
    ...(dark ? darkVarsFor(theme) : {}),
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  appliedKeys = Object.keys(vars);
  root.classList.toggle('dark', Boolean(dark));
}
