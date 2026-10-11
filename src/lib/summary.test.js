import { describe, it, expect } from 'vitest';
import { isLongSummary, SUMMARY_CLAMP_CHARS } from './summary';
import { renderMarkdown } from './markdown';

describe('summary display', () => {
  it('only clamps summaries that are actually long', () => {
    expect(isLongSummary('')).toBe(false);
    expect(isLongSummary('A short premise.')).toBe(false);
    expect(isLongSummary('x'.repeat(SUMMARY_CLAMP_CHARS + 1))).toBe(true);
    expect(isLongSummary('One.\n\nTwo.\n\nThree.')).toBe(true);
  });

  it('keeps paragraphs and escapes reader-entered HTML', () => {
    const html = renderMarkdown('First para.\n\nSecond <img src=x onerror=alert(1)> para.');
    expect(html.match(/<p>/g)).toHaveLength(2);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});
