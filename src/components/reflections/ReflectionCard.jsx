import { useState } from 'react';
import { CornerDownRight, Plus, BookOpen } from 'lucide-react';
import { promptForStage, addFollowUp } from '../../lib/reflections';
import { fmtDate } from '../../lib/format';

/**
 * One reflection: the prompt the reader was asked, their answer, and any
 * follow-up thoughts they've added since. Reflections are append-only — you can
 * always come back and add a later thought, but nothing is edited away.
 */
export default function ReflectionCard({ book, answer, index, onUpdate, showBook = false, onOpenBook }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const prompt = promptForStage(book, answer.stage);
  const followUps = answer.followUps || [];

  const save = () => {
    if (!text.trim()) return;
    onUpdate(addFollowUp(book, index, text));
    setText('');
    setAdding(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200/70 bg-surface shadow-sm overflow-hidden">
      {/* Prompt */}
      <div className="px-5 pt-4 pb-3 bg-brand-50/50 border-b border-brand-100">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          {showBook && book ? (
            <button
              onClick={() => onOpenBook?.(book)}
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-600 hover:text-brand-700 min-w-0"
            >
              <BookOpen size={13} className="shrink-0" />
              <span className="truncate">{book.title}</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Reflection</span>
          )}
          <span className="text-xs text-stone-400 shrink-0">{fmtDate(answer.date)}</span>
        </div>
        <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">
          {prompt ? prompt.prompt : 'A reflection prompt'}
        </p>
      </div>

      {/* Answer */}
      <p className="px-5 py-4 text-ink leading-relaxed whitespace-pre-line">{answer.text}</p>

      {/* Follow-up thoughts */}
      {followUps.length > 0 && (
        <div className="px-5 pb-2 space-y-3">
          {followUps.map((f, i) => (
            <div key={i} className="flex gap-2 pl-3 border-l-2 border-brand-100">
              <CornerDownRight size={15} className="text-brand-400 mt-1 shrink-0" />
              <div className="min-w-0">
                <p className="text-ink leading-relaxed whitespace-pre-line">{f.text}</p>
                <span className="text-xs text-stone-400">{fmtDate(f.date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add a follow-up */}
      <div className="px-5 pb-4 pt-1">
        {adding ? (
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              placeholder="A later thought…"
              className="w-full min-h-[80px] p-3 rounded-xl border border-stone-200 bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 leading-relaxed text-sm"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={save}
                disabled={!text.trim()}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors"
              >
                Add thought
              </button>
              <button
                onClick={() => { setAdding(false); setText(''); }}
                className="text-sm font-medium text-stone-500 hover:text-stone-700 px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <Plus size={15} /> Add a thought
          </button>
        )}
      </div>
    </div>
  );
}
