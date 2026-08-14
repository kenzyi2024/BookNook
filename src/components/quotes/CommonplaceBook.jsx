import { useMemo, useState } from 'react';
import { Quote, Search, Copy, Check, BookOpen } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

/**
 * The Commonplace Book — every quote a reader has saved, gathered from every book
 * into one searchable wall. Click a quote to jump to its book. This is the kind of
 * page readers keep coming back to, so it lives in its own nav tab.
 */
export default function CommonplaceBook({ books, onSelect }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(null);

  // Flatten every book's quotes into one list, keeping the source book attached.
  const quotes = useMemo(() => {
    const out = [];
    books.forEach((book) => {
      (book.quotes || []).forEach((q, i) => {
        if (q && q.text) out.push({ ...q, book, key: `${book._id || book.title}-${i}` });
      });
    });
    return out;
  }, [books]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? quotes.filter((item) =>
        `${item.text} ${item.book.title} ${item.book.author}`.toLowerCase().includes(q)
      )
    : quotes;

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

  return (
    <div className="mt-8 mb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Quote size={30} className="text-brand-600 drop-shadow-sm shrink-0" />
          <div>
            <h2 className="font-display italic font-bold text-4xl md:text-5xl text-brand-600 tracking-tight drop-shadow-sm">
              Commonplace Book
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {quotes.length > 0
                ? `${quotes.length} quote${quotes.length === 1 ? '' : 's'} gathered from your reading`
                : 'The lines you loved, all in one place'}
            </p>
          </div>
        </div>

        {quotes.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quotes, titles, authors…"
              className="w-full bg-surface border border-stone-200 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        )}
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-3xl border border-stone-200/70">
          <Quote size={40} className="mx-auto text-stone-300 mb-4" />
          <p className="text-lg font-display font-semibold text-ink">No quotes yet</p>
          <p className="text-stone-500 mt-1 max-w-sm mx-auto">
            Open a book, go to its Journal, and save a line under Quotes. Everything you keep will collect here.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-center text-stone-400 italic py-16">No quotes match “{query}”.</p>
      ) : (
        <div className="columns-1 md:columns-2 xl:columns-3 gap-5 [column-fill:_balance]">
          {shown.map((item) => (
            <div
              key={item.key}
              className="group relative mb-5 break-inside-avoid bg-surface border border-stone-200/70 rounded-2xl shadow-sm p-5 pl-6 transition-shadow hover:shadow-md"
            >
              <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full bg-brand-300" />
              <p className="font-display italic text-lg leading-relaxed text-ink">“{item.text}”</p>
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-stone-100">
                <button
                  onClick={() => onSelect(item.book)}
                  className="flex items-center gap-2 min-w-0 text-left group/src"
                  title={`Open ${item.book.title}`}
                >
                  <BookOpen size={15} className="text-brand-500 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-700 truncate group-hover/src:text-brand-600 transition-colors">
                      {item.book.title}
                    </span>
                    <span className="block text-xs text-stone-400 truncate">
                      {item.book.author}{item.page ? ` · p.${item.page}` : ''}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => copy(item)}
                  aria-label="Copy quote"
                  className="shrink-0 p-2 rounded-full text-stone-400 hover:text-brand-600 hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  {copied === item.key ? <Check size={15} className="text-status-read" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
