import { useState, useEffect, useRef } from 'react';
import { Sparkles, Pencil, Loader2, ChevronDown } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { renderMarkdown } from '../../lib/markdown';
import { isLongSummary } from '../../lib/summary';
import Button from '../ui/Button';

const UNKNOWN = 'UNKNOWN';

/**
 * The book's spoiler-free summary, shown in its overview.
 *
 * Summaries come from the recommendation the book was added from, from an
 * on-request AI generation (never automatic), or from the reader. A long
 * summary is clamped with a "Read more" toggle. Nothing here overwrites an
 * existing summary except the reader's own explicit edit.
 */
export default function BookSummary({ book, onUpdate }) {
  const api = useApi();
  const { guest } = useAuth();
  const summary = (book.summary || '').trim();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Latest saved summary, so a generation that finishes late never replaces one
  // the reader wrote in the meantime.
  const latest = useRef(summary);
  useEffect(() => { latest.current = summary; }, [summary]);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const prompt =
        `Write a spoiler-free summary of the book "${book.title}" by ${book.author}, like a back-cover description: ` +
        'the premise, setting and main characters in 2 short paragraphs. Do not reveal anything past the opening chapters. ' +
        `If you don't know this specific book well enough to describe it accurately, reply with exactly: ${UNKNOWN}`;
      const text = (await api.generateAI(prompt)).trim();
      if (!text || text.toUpperCase().startsWith(UNKNOWN)) {
        setError('We couldn’t find a reliable summary for this book. You can write your own.');
        return;
      }
      if (latest.current) return; // a summary appeared meanwhile — keep it
      onUpdate({ summary: text });
    } catch (err) {
      setError(err.message || 'Couldn’t generate a summary. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = () => {
    setDraft(summary);
    setEditing(true);
    setError('');
  };
  const saveEdit = () => {
    onUpdate({ summary: draft.trim() });
    setEditing(false);
  };

  const long = isLongSummary(summary);
  const bodyId = `summary-${book._id}`;

  return (
    <section className="mt-5" aria-labelledby={`${bodyId}-label`}>
      <div className="flex items-center gap-3">
        <h2 id={`${bodyId}-label`} className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
          Summary
        </h2>
        {summary && !editing && (
          <button
            onClick={startEdit}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-brand-600"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2">
          <label htmlFor={`${bodyId}-edit`} className="sr-only">Summary</label>
          <textarea
            id={`${bodyId}-edit`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            maxLength={20000}
            placeholder="What's this book about? (Keep it spoiler-free.)"
            className="w-full bg-surface border border-stone-200 rounded-xl p-3 text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={saveEdit}>Save summary</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : summary ? (
        <div className="mt-2">
          <div
            id={bodyId}
            className={`md-content text-[15px] text-stone-700 leading-relaxed ${long && !expanded ? 'line-clamp-5' : ''}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
          />
          {long && (
            <button
              onClick={() => setExpanded((x) => !x)}
              aria-expanded={expanded}
              aria-controls={bodyId}
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              {expanded ? 'Show less' : 'Read more'}
              <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 rounded-2xl border border-dashed border-stone-200 p-4">
          <p className="text-sm text-stone-500">No summary yet.</p>
          {guest && <p className="text-xs text-stone-500 mt-1">Create a free account to generate one with AI — or write your own.</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {!guest && (
              <Button size="sm" variant="soft" onClick={generate} disabled={generating}>
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generating ? 'Writing a summary…' : 'Generate summary'}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={startEdit} disabled={generating}>
              <Pencil size={14} /> Write one
            </Button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-status-dnf mt-2">{error}</p>}
    </section>
  );
}
