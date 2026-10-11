import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { toDateKey, todayKey, validateReadingDates, readingDays, formatReadingDate } from '../../lib/readingDates';
import { useToast } from '../ui/ToastProvider';

/**
 * Start / finish date controls for a book. Both are optional calendar dates.
 *
 * Edits are kept as a draft while typing and saved when the field is left (or
 * Enter is pressed), so a half-typed date is never saved. Invalid combinations
 * (finish before start) show an inline error and aren't saved. Saving sends
 * both dates as 'YYYY-MM-DD', which also normalizes any legacy timestamp.
 */
export default function ReadingDates({ book, onUpdate }) {
  const toast = useToast();
  const stored = { startedAt: toDateKey(book.startedAt), finishedAt: toDateKey(book.finishedAt) };
  const storedSig = `${stored.startedAt}|${stored.finishedAt}`;

  const [draft, setDraft] = useState(stored);
  const [error, setError] = useState('');
  // When the saved dates change underneath us (status auto-fill, a rollback),
  // reset the draft to match.
  const [syncedSig, setSyncedSig] = useState(storedSig);
  if (syncedSig !== storedSig) {
    setSyncedSig(storedSig);
    setDraft(stored);
    setError('');
  }

  const commit = async (next) => {
    if (next.startedAt === stored.startedAt && next.finishedAt === stored.finishedAt) {
      setError('');
      return;
    }
    const problem = validateReadingDates(next);
    setError(problem);
    if (problem) return;
    const ok = await onUpdate({ startedAt: next.startedAt || null, finishedAt: next.finishedAt || null });
    if (ok !== false) toast.success('Reading dates saved.');
  };

  const setField = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const commitField = (field, value) => {
    const next = { ...draft, [field]: value };
    setDraft(next);
    commit(next);
  };

  const days = readingDays(stored.startedAt, stored.finishedAt);
  const today = todayKey();

  const field = (key, label, extra = {}) => {
    const id = `${key}-${book._id}`;
    const value = draft[key];
    return (
      <div className="min-w-0">
        <label htmlFor={id} className="block text-xs font-semibold text-stone-500 mb-1">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="date"
            value={value}
            onChange={(e) => setField(key, e.target.value)}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(draft); } }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `dates-error-${book._id}` : undefined}
            className="w-full min-w-0 bg-surface border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-400"
            {...extra}
          />
          {value ? (
            <button
              type="button"
              onClick={() => commitField(key, '')}
              className="text-xs font-semibold text-stone-500 hover:text-status-dnf shrink-0"
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              Clear
            </button>
          ) : (
            <button
              type="button"
              onClick={() => commitField(key, today)}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 shrink-0"
              aria-label={`Set ${label.toLowerCase()} to today`}
            >
              Today
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <CalendarDays size={15} className="text-stone-400" />
        <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Reading dates</span>
        {days != null && (
          <span
            className="ml-auto text-xs font-medium text-stone-500"
            title="Counting both the start and the finish day"
          >
            {days} day{days === 1 ? '' : 's'} of reading
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 max-w-md">
        {field('startedAt', 'Started')}
        {field('finishedAt', 'Finished', { min: draft.startedAt || undefined })}
      </div>
      {error ? (
        <p id={`dates-error-${book._id}`} role="alert" className="text-xs text-status-dnf mt-1.5">
          {error}
        </p>
      ) : !stored.startedAt && !stored.finishedAt ? (
        <p className="text-xs text-stone-500 mt-1.5">Optional — add them if you want to track when you read this.</p>
      ) : (
        <p className="text-xs text-stone-500 mt-1.5 sr-only">
          {stored.startedAt ? `Started ${formatReadingDate(stored.startedAt)}. ` : ''}
          {stored.finishedAt ? `Finished ${formatReadingDate(stored.finishedAt)}.` : ''}
        </p>
      )}
    </div>
  );
}
