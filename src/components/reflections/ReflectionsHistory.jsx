import { Feather, CalendarClock, Sparkles } from 'lucide-react';
import { isDue, nextDueAt } from '../../lib/reflections';
import { fmtDate } from '../../lib/format';
import ReflectionCard from './ReflectionCard';

/**
 * A book's reflection log — the questions the reader was asked over time, the
 * answers they wrote back, and any follow-up thoughts they've added since.
 * Newest first. Reflections are append-only, so a reader can always come back
 * and add a later thought.
 */
export default function ReflectionsHistory({ book, onUpdate, onReflect }) {
  const all = book.reflection?.answers || [];
  // Keep each answer's original index (for appending follow-ups) while showing
  // the newest first.
  const ordered = all.map((answer, index) => ({ answer, index })).reverse();
  const ready = isDue(book);
  const next = nextDueAt(book);

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <CalendarClock size={16} className="text-brand-500" />
          {ready ? (
            <span>A reflection is ready for this book.</span>
          ) : next ? (
            <span>Next reflection {fmtDate(next)}.</span>
          ) : (
            <span>Reflections begin once you finish this book or save a quote.</span>
          )}
        </div>
        {ready && onReflect && (
          <button
            onClick={onReflect}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors self-start"
          >
            <Feather size={15} /> Reflect now
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <div className="text-center py-14 bg-surface rounded-2xl border border-stone-200/70">
          <Sparkles size={34} className="mx-auto text-stone-300 mb-3" />
          <p className="font-display font-semibold text-ink">No reflections yet</p>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto text-sm">
            When a reflection comes due, BookNook asks you a short question drawn from your own notes and quotes.
            Your answers — and any later thoughts — collect here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordered.map(({ answer, index }) => (
            <ReflectionCard
              key={index}
              book={book}
              answer={answer}
              index={index}
              onUpdate={(reflection) => onUpdate({ reflection })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
