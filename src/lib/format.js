// Small formatting helpers shared across components.

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtShortDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// "1:30:00" or "45:00" -> seconds
export const hmsToSeconds = (str = '') => {
  const parts = String(str).split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

// seconds -> "1:30:00"
export const secondsToHms = (sec = 0) => {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// YYYY-MM key for grouping by month
export const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

export const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'short' });
};
