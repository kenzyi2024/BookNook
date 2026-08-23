import { useState } from 'react';
import { Library, Check, X, Pencil, Sparkles, Loader2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../ui/ToastProvider';

const STATUS_DOT = {
  read: '#4c9a76',
  reading: '#e0a13a',
  want_to_read: '#8aa0c4',
  dnf: '#c98a8a',
};

/**
 * Series grouping for a book: name + position, plus a list of the other books
 * in the same series (in reading order) so a reader can see where they are.
 */
export default function SeriesPanel({ book, books, onUpdate, onOpenBook }) {
  const api = useApi();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(book.series || '');
  const [index, setIndex] = useState(book.seriesIndex != null ? String(book.seriesIndex) : '');
  const [busy, setBusy] = useState(false);

  const save = () => {
    onUpdate({ series: name.trim(), seriesIndex: index.trim() === '' ? null : Number(index) });
    setEditing(false);
  };

  const findSeries = async () => {
    setBusy(true);
    try {
      const prompt =
        `Is the book "${book.title}" by ${book.author} part of a book series? ` +
        `If yes, reply EXACTLY:\nSeries: <series name>\nNumber: <book number as a digit>\n` +
        `If it is a standalone book, reply with just: none`;
      const text = await api.generateAI(prompt);
      if (/^\s*none[.!]?\s*$/i.test(text.trim())) {
        toast.success('This looks like a standalone book.');
        return;
      }
      const sName = (text.match(/Series\s*:\s*(.+)/i)?.[1] || '').replace(/\*+/g, '').trim();
      const numRaw = (text.match(/Number\s*:\s*([\d.]+)/i)?.[1] || '').trim();
      if (!sName) { toast.error("Couldn't determine the series."); return; }
      setName(sName);
      setIndex(numRaw);
      setEditing(true);
      toast.success('Found it — review and save.');
    } catch (err) {
      toast.error(err.message || 'AI features need a free account.');
    } finally {
      setBusy(false);
    }
  };

  const siblings = book.series
    ? books
        .filter((b) => b.series && b.series.toLowerCase() === book.series.toLowerCase())
        .sort((a, b) => (a.seriesIndex ?? 999) - (b.seriesIndex ?? 999) || a.title.localeCompare(b.title))
    : [];

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <Library size={14} /> Series
        </span>
        {!editing && (
          <div className="ml-auto flex items-center gap-3">
            <button onClick={findSeries} disabled={busy} className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 disabled:opacity-50">
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Find with AI
            </button>
            <button onClick={() => setEditing(true)} className="text-xs font-semibold text-stone-400 hover:text-brand-600 inline-flex items-center gap-1">
              {book.series ? <><Pencil size={12} /> Edit</> : '+ Add'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Series name"
            className="flex-1 min-w-[160px] bg-surface border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            type="number"
            value={index}
            onChange={(e) => setIndex(e.target.value)}
            placeholder="#"
            className="w-16 bg-surface border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button onClick={save} className="bg-brand-500 hover:bg-brand-600 text-white rounded-full p-2" aria-label="Save series"><Check size={16} /></button>
          <button onClick={() => { setEditing(false); setName(book.series || ''); setIndex(book.seriesIndex != null ? String(book.seriesIndex) : ''); }} className="text-stone-400 hover:text-ink rounded-full p-2" aria-label="Cancel"><X size={16} /></button>
        </div>
      ) : !book.series ? (
        <p className="text-sm text-stone-400 mt-1">Not part of a series.</p>
      ) : (
        <div className="mt-2">
          <p className="text-sm text-ink font-semibold">
            {book.series}{book.seriesIndex != null ? <span className="text-stone-400 font-normal"> · Book {book.seriesIndex}</span> : null}
          </p>
          {siblings.length > 1 && (
            <div className="mt-2 rounded-xl border border-stone-200/70 divide-y divide-stone-100 overflow-hidden bg-surface">
              {siblings.map((b) => {
                const isCurrent = b._id === book._id;
                return (
                  <button
                    key={b._id}
                    onClick={() => !isCurrent && onOpenBook(b)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${isCurrent ? 'bg-brand-50' : 'hover:bg-stone-50'}`}
                  >
                    <span className="w-6 text-center text-xs font-bold text-stone-400 shrink-0">{b.seriesIndex ?? '—'}</span>
                    <span className={`flex-1 min-w-0 truncate ${isCurrent ? 'font-semibold text-brand-700' : 'text-stone-700'}`}>{b.title}</span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT[b.status] || STATUS_DOT.want_to_read }} title={b.status} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
