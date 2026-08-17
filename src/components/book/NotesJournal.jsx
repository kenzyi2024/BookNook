import { useState, useRef } from 'react';
import { NotebookPen, Quote, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { fmtDate } from '../../lib/format';
import { renderMarkdown } from '../../lib/markdown';
import { HIGHLIGHTS, highlight, parseTags, DEFAULT_HIGHLIGHT } from '../../lib/highlights';

/**
 * The Notes tab, styled as a real leather journal (à la Louis Carmen): a grained
 * cover with a ribbon marker and elastic band, tabbed dividers, and lined
 * cream pages. The book "opens" when you enter the tab, and turning between the
 * Journal and Quotes sections flips a page.
 *
 * The journal keeps its own fixed cream/ink palette so it reads identically in
 * both the light and candlelit themes.
 */

const PAPER = '#FBF7EC';
const LINE = '#E8DFC8';
const INK = '#3A2E26';
const MUTE = '#8A7A66';
const CARD = '#FFFDF7';
const ACCENT = '#A8551F';

const leatherStyle = {
  background:
    'radial-gradient(130% 90% at 18% 0%, rgba(255,255,255,0.07), transparent 42%),' +
    'radial-gradient(100% 120% at 100% 100%, rgba(0,0,0,0.28), transparent 55%),' +
    'linear-gradient(145deg, #5C3A23 0%, #472C18 55%, #37220F 100%)',
  boxShadow:
    'inset 0 0 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06), 0 22px 44px rgba(0,0,0,0.35)',
};

// Lined-paper surface
const paperStyle = {
  backgroundColor: PAPER,
  color: INK,
  backgroundImage: `repeating-linear-gradient(${PAPER}, ${PAPER} 31px, ${LINE} 31px, ${LINE} 32px)`,
  backgroundAttachment: 'local',
};

export default function NotesJournal({ book, onUpdate }) {
  const [view, setView] = useState('journal'); // 'journal' | 'quotes'

  const tabs = [
    { id: 'journal', label: 'Journal', icon: NotebookPen },
    { id: 'quotes', label: 'Quotes', icon: Quote, count: book.quotes?.length || 0 },
  ];

  return (
    <div className="bn-open relative rounded-[26px] p-3 md:p-4 shadow-2xl" style={leatherStyle}>
      {/* elastic closure band */}
      <div className="pointer-events-none absolute top-2 bottom-2 right-7 w-2.5 rounded bg-black/35 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]" />
      {/* ribbon bookmark */}
      <div className="pointer-events-none absolute -top-1 right-16 w-3 h-24 bg-gradient-to-b from-[#9A2B2B] to-[#7C1F1F] shadow-md"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)' }} />

      {/* gold-rule stitch border */}
      <div className="rounded-[20px] border border-dashed border-amber-100/25 ring-1 ring-[#C9A24B]/10 flex overflow-hidden min-h-[520px]">
        {/* Section dividers down the side */}
        <div className="flex flex-col gap-2 p-3 bg-black/20">
          {tabs.map((t) => {
            const active = view === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex items-center gap-2 px-3 py-3 rounded-l-xl text-sm font-semibold transition-all ${
                  active
                    ? '-mr-3 pr-6 shadow text-[#7C3B12]'
                    : 'bg-amber-900/30 text-amber-100/80 hover:bg-amber-900/50'
                }`}
                style={active ? { backgroundColor: PAPER } : undefined}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.count ? <span className={active ? 'text-[#A8551F] text-xs' : 'text-amber-200/60 text-xs'}>{t.count}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Page — remounts on view change so the page-turn animation replays */}
        <div key={view} className="bn-page-turn flex-1 p-5 md:p-7 min-w-0" style={{ backgroundColor: PAPER }}>
          {view === 'journal' ? (
            <JournalView book={book} onUpdate={onUpdate} />
          ) : (
            <QuotesView book={book} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}

function JournalView({ book, onUpdate }) {
  const entries = [...(book.journalEntries || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [draft, setDraft] = useState('');

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
    const target = entries[idx];
    onUpdate({ journalEntries: original.filter((e) => e !== target && e._id !== target._id) });
  };

  return (
    <div className="space-y-6">
      {/* Overview note (autosave) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold uppercase tracking-wider" style={{ color: MUTE }}>Overview</label>
          <span className="text-xs flex items-center gap-1 h-4" style={{ color: MUTE }}>
            {saveState === 'saving' && (<><Loader2 size={12} className="animate-spin" /> Saving…</>)}
            {saveState === 'saved' && (<><Check size={12} className="text-status-read" /> Saved</>)}
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="A running note about this book…"
          className="w-full min-h-[90px] p-4 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 leading-relaxed font-serif shadow-inner border"
          style={{ ...paperStyle, borderColor: LINE }}
        />
      </div>

      {/* New journal entry */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: LINE }}>
        <div className="flex items-stretch" style={paperStyle}>
          <div className="w-10 shrink-0 border-r-2 border-red-300/50" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Dear journal… what happened / what you're thinking. **bold** and *italic* supported."
            className="flex-1 min-h-[130px] p-4 bg-transparent resize-none focus:outline-none leading-8 font-serif text-lg"
            style={{ color: INK }}
          />
        </div>
        <div className="flex justify-end p-3 border-t" style={{ backgroundColor: CARD, borderColor: LINE }}>
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
          <div key={e._id || i} className="rounded-2xl border shadow-sm overflow-hidden group" style={{ borderColor: LINE }}>
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ backgroundColor: CARD, borderColor: LINE }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>{fmtDate(e.date)}</span>
              <button
                onClick={() => deleteEntry(i)}
                className="text-stone-300 hover:text-status-dnf transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete entry"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div
              className="p-4 font-serif leading-8 text-lg"
              style={{ ...paperStyle, color: INK }}
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
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [color, setColor] = useState(DEFAULT_HIGHLIGHT);

  const addQuote = () => {
    if (!text.trim()) return;
    const q = {
      text: text.trim(),
      page: parseInt(page, 10) || 0,
      note: note.trim(),
      tags: parseTags(tagInput),
      color,
    };
    onUpdate({ quotes: [...quotes, q] });
    setText('');
    setPage('');
    setNote('');
    setTagInput('');
    setColor(DEFAULT_HIGHLIGHT);
  };

  const removeQuote = (idx) => onUpdate({ quotes: quotes.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-4" style={{ backgroundColor: CARD, borderColor: LINE }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a passage to highlight…"
          className="w-full min-h-[80px] p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 font-serif italic"
          style={{ backgroundColor: '#fff', borderColor: LINE, color: INK }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Your note on this passage (optional)"
          className="w-full mt-2 p-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm font-serif"
          style={{ backgroundColor: '#fff', borderColor: LINE, color: INK }}
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page #"
            className="w-24 border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            style={{ backgroundColor: '#fff', borderColor: LINE, color: INK }}
          />
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Tags, comma separated"
            className="flex-1 min-w-[140px] border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            style={{ backgroundColor: '#fff', borderColor: LINE, color: INK }}
          />
          {/* highlight color */}
          <div className="flex items-center gap-1.5">
            {HIGHLIGHTS.map((h) => (
              <button
                key={h.key}
                onClick={() => setColor(h.key)}
                aria-label={h.label}
                title={h.label}
                className={`w-6 h-6 rounded-full transition-transform ${color === h.key ? 'ring-2 ring-offset-1 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: h.bg, ...(color === h.key ? { boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${h.accent}` } : {}) }}
              />
            ))}
          </div>
          <button
            onClick={addQuote}
            disabled={!text.trim()}
            className="ml-auto bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors"
          >
            <Plus size={16} /> Save highlight
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {quotes.length === 0 && (
          <p className="text-center italic py-6" style={{ color: MUTE }}>No highlights yet.</p>
        )}
        {quotes.map((q, i) => {
          const hl = highlight(q.color);
          return (
            <div key={i} className="relative border rounded-2xl p-5 pl-6 shadow-sm group" style={{ backgroundColor: CARD, borderColor: LINE }}>
              <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-full" style={{ backgroundColor: hl.accent }} />
              <p className="font-serif italic text-lg leading-relaxed" style={{ color: INK, backgroundColor: q.text ? `${hl.bg}66` : 'transparent', boxDecorationBreak: 'clone', padding: '0 2px' }}>
                “{q.text}”
              </p>
              {q.note && <p className="mt-2 text-sm font-serif" style={{ color: MUTE }}>{q.note}</p>}
              <div className="flex items-center justify-between gap-3 mt-3">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {q.page ? <span className="text-xs" style={{ color: MUTE }}>page {q.page}</span> : null}
                  {(q.tags || []).map((t) => (
                    <span key={t} className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: hl.bg, color: hl.accent }}>#{t}</span>
                  ))}
                </div>
                <button
                  onClick={() => removeQuote(i)}
                  className="shrink-0 text-stone-300 hover:text-status-dnf transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete highlight"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
