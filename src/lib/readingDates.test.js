import { describe, it, expect, afterEach } from 'vitest';
import {
  isDateKey,
  toDateKey,
  todayKey,
  readingDate,
  readingDays,
  validateReadingDates,
  datesForStatus,
  filledMessage,
  finishedOn,
} from './readingDates';

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => { process.env.TZ = ORIGINAL_TZ; });

describe('date keys', () => {
  it('accepts only real calendar dates', () => {
    expect(isDateKey('2026-02-28')).toBe(true);
    expect(isDateKey('2024-02-29')).toBe(true); // leap year
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('0002-10-01')).toBe(false); // half-typed year
    expect(isDateKey('10/01/2026')).toBe(false);
    expect(isDateKey('')).toBe(false);
  });

  it('normalizes stored values to a key', () => {
    expect(toDateKey('2026-03-09')).toBe('2026-03-09');
    expect(toDateKey('2026-03-09T00:00:00.000Z')).toBe('2026-03-09'); // server's stored form
    expect(toDateKey('')).toBe('');
    expect(toDateKey(null)).toBe('');
    expect(toDateKey('garbage')).toBe('');
    expect(toDateKey('2026-02-30')).toBe('');
  });

  // A calendar date stored as UTC midnight must not shift a day in any zone.
  it.each(['America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Tokyo', 'Pacific/Kiritimati'])(
    'stored dates stay on the same day in %s',
    (tz) => {
      process.env.TZ = tz;
      expect(toDateKey('2026-01-01T00:00:00.000Z')).toBe('2026-01-01');
      const d = readingDate('2026-01-01T00:00:00.000Z');
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 0, 1]);
    }
  );

  it('reads legacy timestamps as the local calendar day', () => {
    process.env.TZ = 'America/Los_Angeles';
    // 8pm Dec 31 in LA is already Jan 1 in UTC.
    expect(toDateKey('2026-01-01T04:00:00.000Z')).toBe('2025-12-31');
    process.env.TZ = 'Asia/Tokyo';
    expect(toDateKey('2026-01-01T04:00:00.000Z')).toBe('2026-01-01');
  });

  it('todayKey uses the local date, not UTC', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(todayKey(new Date('2026-10-12T03:00:00Z'))).toBe('2026-10-11');
  });

  it('finishedOn falls back to updatedAt for undated finished books', () => {
    expect(finishedOn({ finishedAt: '2026-05-04' }).getDate()).toBe(4);
    expect(finishedOn({ updatedAt: '2026-05-04T12:00:00Z' })).toBeInstanceOf(Date);
    expect(finishedOn({})).toBe(null);
  });
});

describe('validation', () => {
  it('allows empty, start-only, finish-only and ordered pairs', () => {
    expect(validateReadingDates({ startedAt: '', finishedAt: '' })).toBe('');
    expect(validateReadingDates({ startedAt: '2026-05-01', finishedAt: '' })).toBe('');
    expect(validateReadingDates({ startedAt: '', finishedAt: '2026-05-01' })).toBe('');
    expect(validateReadingDates({ startedAt: '2026-05-01', finishedAt: '2026-05-01' })).toBe('');
    expect(validateReadingDates({ startedAt: '2026-05-01', finishedAt: '2026-06-01' })).toBe('');
  });

  it('rejects finish before start and malformed dates', () => {
    expect(validateReadingDates({ startedAt: '2026-05-02', finishedAt: '2026-05-01' })).toMatch(/before the start/);
    expect(validateReadingDates({ startedAt: '2026-02-30', finishedAt: '' })).toMatch(/valid start/);
    expect(validateReadingDates({ startedAt: '', finishedAt: 'soon' })).toMatch(/valid finish/);
  });
});

describe('reading duration', () => {
  it('counts both the start and finish day', () => {
    expect(readingDays('2026-03-01', '2026-03-01')).toBe(1);
    expect(readingDays('2026-03-01', '2026-03-03')).toBe(3);
  });
  it('is not thrown off by a DST change', () => {
    process.env.TZ = 'America/New_York';
    expect(readingDays('2026-03-07', '2026-03-09')).toBe(3); // spans spring-forward
  });
  it('is null when a date is missing or out of order', () => {
    expect(readingDays('2026-03-01', '')).toBe(null);
    expect(readingDays('2026-03-05', '2026-03-01')).toBe(null);
  });
});

describe('status changes', () => {
  const now = new Date(2026, 9, 11, 15); // Oct 11 2026, local

  it('starting a book records today as the start date', () => {
    const { updates, filled } = datesForStatus({ status: 'want_to_read' }, 'reading', now);
    expect(updates).toEqual({ startedAt: '2026-10-11' });
    expect(filled).toEqual(['start']);
    expect(filledMessage(filled)).toMatch(/^Start date set to today/);
  });

  it('finishing a book records today as the finish date without inventing a start', () => {
    const { updates } = datesForStatus({ status: 'reading' }, 'read', now);
    expect(updates).toEqual({ finishedAt: '2026-10-11' });
  });

  it('never overwrites dates the reader already entered', () => {
    const book = { startedAt: '2026-09-01', finishedAt: '2026-09-20' };
    expect(datesForStatus(book, 'reading', now).updates).toEqual({});
    expect(datesForStatus(book, 'read', now).updates).toEqual({});
  });

  it('never clears dates when leaving a status', () => {
    const book = { startedAt: '2026-09-01', finishedAt: '2026-09-20' };
    for (const status of ['want_to_read', 'dnf', 'reading']) {
      expect(datesForStatus(book, status, now).updates).toEqual({});
    }
  });

  it('does not auto-finish before a future start date', () => {
    expect(datesForStatus({ startedAt: '2026-12-01' }, 'read', now).updates).toEqual({});
  });
});
