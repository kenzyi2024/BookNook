import { useState, useRef } from 'react';
import { NotebookPen, Quote, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { fmtDate } from '../../lib/format';
import { renderMarkdown } from '../../lib/markdown';

/**
 * Journal-style Notes tab: an autosaving overview note, dated journal entries
 * (with light **markdown** formatting), and saved quotes tied to page numbers.
 * Styled to feel like writing in a real journal.
 */
export default function NotesJournal({ book, onUpdate }) {
  const [view, setView] = useState('journal'); // 'journal' | 'quotes'

  return (
    <div className="animate-in fade-in">
      <div className="flex gap-2 mb-5">
        <TabBtn active={view === 'journal'} onClick={() => setView('journal')} icon={<NotebookPen size={16} />}>
          Journal
        </TabBtn>
        <TabBtn active={view === 'quotes'} onClick={() => setView('quotes')} icon={<Quote size={16} />}>
          Quotes {book.quotes?.length ? `(${book.quotes.length})` : ''}
        </TabBtn>
      </div>

      {view === 'journal' ? (
        <JournalView book={book} onUpdate={onUpdate} />
      ) : (
        <QuotesView book={book} onUpdate={onUpdate} />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {icon} {children}
    </button>
  );
}

// Lined-paper journal surface
const paperStyle = {
  backgroundColor: '#FBF7EC',
  backgroundImage:
    'repeating-linear-gradient(#FBF7EC, #FBF7EC 31px, #E8DFC8 31px, #E8DFC8 32px)',
  backgroundAttachment: 'local',
};

function JournalView({ book, onUpdate }) {
  const entries = [...(book.journalEntries || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [draft, setDraft] = useState('');

  // Autosaving "overview" note. NotesJournal remounts when a different book is
  // opened, so initializing from props once is enough.
  const [note, setNote] = useState(book.notes || '');
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const timer = useRef(null);

  const onNoteChange = (val) => {
    setNote(val);
    setSaveState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onUpdate({ notes: val });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }, 700);
  };

  const addEntry = () => {
    if (!draft.trim()) return;
    const entry = { date: new Date().toISOString(), text: draft.trim() };
    onUpdate({ journalEntries: [...(book.journalEntries || []), entry] });
    setDraft('');
  };

  const deleteEntry = (idx) => {
    const original = book.journalEntries || [];
    // entries are sorted desc; map back by identity
    const target = entries[idx];
    onUpdate({ journalEntries: original.filter((e) => e !== target && e._id !== target._id) });
  };

  return (
    <div className="space-y-6">
      {/* Overview note (autosave) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Overview</label>
          <span className="text-xs text-stone-400 flex items-center gap-1 h-4">
            {saveState === 'saving' && (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving…
              </>
            )}
            {saveState === 'saved' && (
              <>
                <Check size={12} className="text-status-read" /> Saved
              </>
            )}
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="A running note about this book…"
          className="w-full min-h-[90px] p-4 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 text-stone-800 leading-relaxed font-serif shadow-inner border border-stone-200"
          style={paperStyle}
        />
      </div>

      {/* New journal entry */}
      <div className="rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex items-stretch" style={paperStyle}>
          <div className="w-10 shrink-0 border-r-2 border-red-300/50 bg-transparent" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dear journal… what happened / what you're thinking. **bold** and *italic* supported."
            className="flex-1 min-h-[130px] p-4 bg-transparent resize-none focus:outline-none text-stone-800 leading-8 font-serif text-lg"
          />
        </div>
        <div className="flex justify-end p-3 bg-white border-t border-stone-100">
          <button
            onClick={addEntry}
            disabled={!draft.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} /> Add entry
          </button>
        </div>
      </div>

      {/* Past entries */}
      <div className="space-y-4">
        {entries.map((e, i) => (
          <div key={e._id || i} className="rounded-2xl border border-stone-200 shadow-sm overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-stone-100">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{fmtDate(e.date)}</span>
              <button
                onClick={() => deleteEntry(i)}
                className="text-stone-300 hover:text-status-dnf transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete entry"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div
              className="p-4 font-serif text-stone-800 leading-8 text-lg"
              style={paperStyle}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(e.text) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function QuotesView({ book, onUpdate }) {
  const quotes = book.quotes || [];
  const [text, setText] = useState('');
  const [page, setPage] = useState('');

  const addQuote = () => {
    if (!text.trim()) return;
    const q = { text: text.trim(), page: parseInt(page, 10) || 0 };
    onUpdate({ quotes: [...quotes, q] });
    setText('');
    setPage('');
  };

  const removeQuote = (idx) => onUpdate({ quotes: quotes.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-5">
      <div className="bg-paper border border-stone-200 rounded-2xl p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a favorite quote…"
          className="w-full min-h-[80px] p-3 bg-white border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 font-serif italic text-stone-800"
        />
        <div className="flex items-center gap-3 mt-3">
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page #"
            className="w-28 bg-white border border-stone-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
          />
          <button
            onClick={addQuote}
            disabled={!text.trim()}
            className="ml-auto bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} /> Save quote
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {quotes.length === 0 && (
          <p className="text-center text-stone-400 italic py-6">No saved quotes yet.</p>
        )}
        {quotes.map((q, i) => (
          <div key={i} className="relative bg-white border border-stone-200 rounded-2xl p-5 pl-6 shadow-sm group">
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-brand-300 rounded-full" />
            <p className="font-serif italic text-lg text-stone-800 leading-relaxed">“{q.text}”</p>
            <div className="flex items-center justify-between mt-2">
              {q.page ? <span className="text-xs text-stone-400">page {q.page}</span> : <span />}
              <button
                onClick={() => removeQuote(i)}
                className="text-stone-300 hover:text-status-dnf transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete quote"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
