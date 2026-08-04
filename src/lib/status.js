// Single source of truth for reading statuses — labels, order, and accent colors.
export const STATUSES = {
  want_to_read: { label: 'Want to Read', short: 'Unread', color: 'var(--color-status-want)' },
  reading: { label: 'Currently Reading', short: 'Reading', color: 'var(--color-status-reading)' },
  read: { label: 'Finished', short: 'Finished', color: 'var(--color-status-read)' },
  dnf: { label: 'Did Not Finish', short: 'DNF', color: 'var(--color-status-dnf)' },
};

export const STATUS_OPTIONS = Object.entries(STATUSES).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

// Preset spine colors (kept as literal Tailwind classes so they get generated).
export const SPINE_COLORS = [
  'bg-amber-700',
  'bg-red-800',
  'bg-blue-800',
  'bg-emerald-800',
  'bg-purple-900',
  'bg-slate-800',
  'bg-stone-800',
  'bg-teal-700',
  'bg-orange-800',
];

export const randomSpine = () =>
  SPINE_COLORS[Math.floor(Math.random() * SPINE_COLORS.length)];
