import { Feather, CalendarClock, Sparkles } from 'lucide-react';
import { promptForStage, isDue, nextDueAt } from '../../lib/reflections';
import { fmtDate } from '../../lib/format';

/**
 * A book's reflection log — the questions the reader was asked over time and the
 * answers they wrote back, newest first. This is where reflections "live" so a
 * reader can watch their own thinking about a book deepen.
 */
export default function ReflectionsHistory({ book, onReflect }) {
  const answers = [...(book.reflection?.answers || [])].reverse();
  const ready = isDue(book);
  const next = nextDueAt(book);

  return (
    <div className="max-w-2xl">
      {/* Status line */}
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

      {answers.length === 0 ? (
        <div className="text-center py-14 bg-surface rounded-2xl border border-stone-200/70">
          <Sparkles size={34} className="mx-auto text-stone-300 mb-3" />
          <p className="font-display font-semibold text-ink">No reflections yet</p>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto text-sm">
            When a reflection comes due, BookNook asks you a short question drawn from your own notes and quotes.
            Your answers collect here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {answers.map((a, i) => {
            const prompt = promptForStage(book, a.stage);
            return (
              <div key={i} className="rounded-2xl border border-stone-200/70 bg-surface shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 bg-brand-50/50 border-b border-brand-100">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Reflection</span>
                    <span className="text-xs text-stone-400">{fmtDate(a.date)}</span>
                  </div>
                  <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                    {prompt ? prompt.prompt : 'A reflection prompt'}
                  </p>
                </div>
                <p className="px-5 py-4 text-ink leading-relaxed whitespace-pre-line">{a.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
