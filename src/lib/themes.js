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

export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
