// Summary display helpers shared by the book overview.

// Roughly five lines of the overview column — longer summaries get a
// "Read more" toggle instead of pushing the rest of the overview down.
export const SUMMARY_CLAMP_CHARS = 420;

export function isLongSummary(text = '') {
  const t = String(text || '').trim();
  return t.length > SUMMARY_CLAMP_CHARS || t.split(/\n\s*\n/).length > 2;
}
