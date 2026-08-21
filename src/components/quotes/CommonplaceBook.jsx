import { useMemo, useState } from 'react';
import { Quote, Search, Copy, Check, BookOpen, Feather, Share2, Download } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import ReflectionCard from '../reflections/ReflectionCard';
import ShareCard from '../book/ShareCard';
import { highlight } from '../../lib/highlights';
import { annotationsToMarkdown, downloadMarkdown } from '../../lib/exportMd';
import PageHeader from '../ui/PageHeader';

/**
 * The Commonplace Book — the reader's own writing about their books, gathered in
 * one place. Two views: the quotes they've saved, and their reflections (with the
 * ability to add later thoughts). Click anything to jump to its book.
 */
export default function CommonplaceBook({ books, onSelect, onUpdateBook }) {
  const toast = useToast();
  const [view, setView] = useState('quotes'); // 'quotes' | 'reflections'
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(null);
  const [shareQuote, setShareQuote] = useState(null);
  const [tagFilter, setTagFilter] = useState('');

  const allTags = useMemo(() => {
    const set = new Set();
    books.forEach((b) => (b.quotes || []).forEach((qt) => (qt.tags || []).forEach((t) => set.add(t))));
    return [...set].sort();
  }, [books]);

  // Every saved quote, with its source book attached.
  const quotes = useMemo(() => {
    const out = [];
    books.forEach((book) => {
      (book.quotes || []).forEach((q, i) => {
        if (q && q.text) out.push({ ...q, book, key: `${book._id || book.title}-${i}` });
      });
    });
    return out;
  }, [books]);

  // Every reflection answer, newest first, keeping the answer's index for follow-ups.
  const reflections = useMemo(() => {
    const out = [];
    books.forEach((book) => {
      (book.reflection?.answers || []).forEach((answer, index) => {
        out.push({ book, answer, index, date: answer.date, key: `${book._id || book.title}-r${index}` });
      });
    });
    return out.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [books]);

  const q = query.trim().toLowerCase();
  const shownQuotes = quotes.filter((it) => {
    if (tagFilter && !(it.tags || []).includes(tagFilter)) return false;
    if (!q) return true;
    return `${it.text} ${it.note || ''} ${(it.tags || []).join(' ')} ${it.book.title} ${it.book.author}`.toLowerCase().includes(q);
  });
  const shownReflections = q
    ? reflections.filter((it) =>
        `${it.answer.text} ${(it.answer.followUps || []).map((f) => f.text).join(' ')} ${it.book.title} ${it.book.author}`
          .toLowerCase()
          .includes(q)
      )
    : reflections;

  const copy = async (item) => {
    const text = `“${item.text}” — ${item.book.title}, ${item.book.author}${item.page ? ` (p.${item.page})` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(item.key);
      setTimeout(() => setCopied((c) => (c === item.key ? null : c)), 1500);
    } catch {
      toast.error('Could not copy the quote.');
    }
  };

  const totalCount = view === 'quotes' ? quotes.length : reflections.length;

  const Segmented = (
    <div className="inline-flex bg-surface border border-stone-200 rounded-full p-1">
      {[
        { id: 'quotes', label: 'Quotes', icon: Quote, n: quotes.length },
        { id: 'reflections', label: 'Reflections', icon: Feather, n: reflections.length },
      ].map((t) => {
        const active = view === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active ? 'bg-brand-500 text-white' : 'text-stone-600 hover:text-brand-600'
            }`}
          >
            <Icon size={14} /> {t.label}
            <span className={active ? 'text-white/80' : 'text-stone-400'}>{t.n}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="mt-8 mb-20 animate-in fade-in duration-500">
      <PageHeader
        icon={Quote}
        title="Commonplace Book"
        subtitle="The lines you loved and the thoughts you kept, all in one place"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {Segmented}
        {totalCount > 0 && (
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={view === 'quotes' ? 'Search quotes…' : 'Search reflections…'}
              className="w-full bg-surface border border-stone-200 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}
      </div>

      {view === 'quotes' && quotes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {allTags.length > 0 && (
            <>
              <button
                onClick={() => setTagFilter('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!tagFilter ? 'bg-brand-500 text-white' : 'bg-surface border border-stone-200 text-stone-600 hover:border-brand-300'}`}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter((cur) => (cur === t ? '' : t))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${tagFilter === t ? 'bg-brand-500 text-white' : 'bg-surface border border-stone-200 text-stone-600 hover:border-brand-300'}`}
                >
                  #{t}
                </button>
              ))}
            </>
          )}
          <button
            onClick={() => downloadMarkdown(annotationsToMarkdown(books), 'booknook-highlights.md')}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 rounded-full px-4 py-1.5 transition-colors"
          >
            <Download size={14} /> Export .md
          </button>
        </div>
      )}

      {view === 'quotes' ? (
        quotes.length === 0 ? (
          <EmptyState
            icon={<Quote size={40} className="mx-auto text-stone-300 mb-4" />}
            title="No quotes yet"
            body="Open a book, go to its Journal, and save a highlight under Quotes. Everything you keep will collect here."
          />
        ) : shownQuotes.length === 0 ? (
          <p className="text-center text-stone-400 italic py-16">No quotes match “{query}”.</p>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5 [column-fill:_balance]">
            {shownQuotes.map((item) => {
              const hl = highlight(item.color);
              return (
              <div
                key={item.key}
                className="group relative mb-5 break-inside-avoid bg-surface border border-stone-200/70 rounded-2xl shadow-sm p-5 pl-6 transition-shadow hover:shadow-md"
              >
                <div className="absolute left-0 top-5 bottom-5 w-1.5 rounded-full" style={{ backgroundColor: hl.accent }} />
                <p className="font-display italic text-lg leading-relaxed text-ink">
                  <span style={{ backgroundColor: `${hl.bg}66`, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', padding: '0 2px' }}>“{item.text}”</span>
                </p>
                {item.note && <p className="mt-2.5 text-sm text-stone-500 leading-relaxed">{item.note}</p>}
                {(item.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map((t) => (
                      <button key={t} onClick={() => setTagFilter(t)} className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ backgroundColor: hl.bg, color: hl.accent }}>#{t}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
                  <button onClick={() => onSelect(item.book)} className="flex items-center gap-2 min-w-0 text-left group/src" title={`Open ${item.book.title}`}>
                    <BookOpen size={15} className="text-brand-500 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-stone-700 truncate group-hover/src:text-brand-600 transition-colors">{item.book.title}</span>
                      <span className="block text-xs text-stone-400 truncate">{item.book.author}{item.page ? ` · p.${item.page}` : ''}</span>
                    </span>
                  </button>
                  <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShareQuote(item)}
                      aria-label="Share quote"
                      className="p-2 rounded-full text-stone-400 hover:text-brand-600 hover:bg-stone-100 transition-colors"
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      onClick={() => copy(item)}
                      aria-label="Copy quote"
                      className="p-2 rounded-full text-stone-400 hover:text-brand-600 hover:bg-stone-100 transition-colors"
                    >
                      {copied === item.key ? <Check size={15} className="text-status-read" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )
      ) : reflections.length === 0 ? (
        <EmptyState
          icon={<Feather size={40} className="mx-auto text-stone-300 mb-4" />}
          title="No reflections yet"
          body="When a reflection comes due, it appears on your home page. Your answers — and any later thoughts — will gather here."
        />
      ) : shownReflections.length === 0 ? (
        <p className="text-center text-stone-400 italic py-16">No reflections match “{query}”.</p>
      ) : (
        <div className="columns-1 lg:columns-2 gap-5 [column-fill:_balance]">
          {shownReflections.map((item) => (
            <div key={item.key} className="mb-5 break-inside-avoid">
              <ReflectionCard
                book={item.book}
                answer={item.answer}
                index={item.index}
                showBook
                onOpenBook={onSelect}
                onUpdate={(reflection) => onUpdateBook(item.book._id, { reflection })}
              />
            </div>
          ))}
        </div>
      )}

      {shareQuote && (
        <ShareCard kind="quote" book={shareQuote.book} quote={shareQuote} onClose={() => setShareQuote(null)} />
      )}
    </div>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="text-center py-20 bg-surface rounded-3xl border border-stone-200/70">
      {icon}
      <p className="text-lg font-display font-semibold text-ink">{title}</p>
      <p className="text-stone-500 mt-1 max-w-sm mx-auto">{body}</p>
    </div>
  );
}
