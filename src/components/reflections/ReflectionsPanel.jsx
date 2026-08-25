import { useState } from 'react';
import { X, Feather, ArrowRight, Check, Clock3, Sparkles } from 'lucide-react';
import { answerReflection, snoozeReflection } from '../../lib/reflections';

/**
 * A calm, one-at-a-time reflection flow. It steps through the reflections that
 * are due, showing a prompt built from the reader's own notes/quotes and letting
 * them recall + re-articulate before scheduling the next spaced review.
 */
export default function ReflectionsPanel({ items, onSave, onClose }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  const current = items[idx];
  const advance = () => {
    setText('');
    if (idx + 1 < items.length) setIdx(idx + 1);
    else setDone(true);
  };

  const save = () => {
    if (!text.trim() || !current) return;
    onSave(current.book._id, answerReflection(current.book, text));
    advance();
  };

  const snooze = () => {
    if (!current) return;
    onSave(current.book._id, snoozeReflection(current.book));
    advance();
  };

  const pastCount = current ? (current.book.reflection?.answers?.length || 0) : 0;
  const promptText = current?.prompt?.prompt || '';

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
            <Feather size={18} className="text-brand-500" /> Reflections
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="p-10 text-center">
            <span className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={26} />
            </span>
            <p className="font-display font-semibold text-xl text-ink">That&rsquo;s all for now</p>
            <p className="text-stone-500 mt-1 max-w-xs mx-auto">
              Nicely done. These will resurface again, spaced out, so they settle in for the long run.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        ) : current ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {idx + 1} of {items.length}
              </span>
              <span className="text-sm font-semibold text-brand-700 truncate ml-3">{current.book.title}</span>
            </div>

            <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-5 mb-4">
              <p className="text-ink leading-relaxed whitespace-pre-line font-display">{promptText}</p>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              placeholder="Take a moment… write whatever comes to mind."
              className="w-full min-h-[130px] p-4 rounded-2xl border border-stone-200 bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 leading-relaxed"
            />

            {pastCount > 0 && (
              <p className="text-xs text-stone-400 mt-2">
                You&rsquo;ve reflected on this book {pastCount} {pastCount === 1 ? 'time' : 'times'} before.
              </p>
            )}

            <div className="flex items-center justify-between mt-5">
              <button
                onClick={snooze}
                className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
              >
                <Clock3 size={15} /> Later
              </button>
              <button
                onClick={save}
                disabled={!text.trim()}
                className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                {idx + 1 < items.length ? <>Save &amp; next <ArrowRight size={16} /></> : <>Save <Check size={16} /></>}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
