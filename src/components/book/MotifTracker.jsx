import { useState } from 'react';
import { Eye, Plus, Trash2, Sparkles, Loader2, Wand2, MapPin } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../ui/ToastProvider';
import { renderMarkdown } from '../../lib/markdown';
import { fmtDate } from '../../lib/format';
import { extractMotifs, newMotif, newSighting } from '../../lib/motifs';

/**
 * The theme/motif tracker. Pull motifs from the Analysis Kit (or add your own),
 * then log where you spot each one as you read. When you're done, the AI weaves
 * your own observations into a short closing synthesis.
 */
export default function MotifTracker({ book, onUpdate }) {
  const api = useApi();
  const toast = useToast();

  const motifs = book.motifs || [];
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const addMotif = (n) => {
    const val = (n ?? name).trim();
    if (!val) return;
    if (motifs.some((m) => m.name.toLowerCase() === val.toLowerCase())) { toast.error('Already tracking that one.'); return; }
    onUpdate({ motifs: [...motifs, newMotif(val)] });
    setName('');
  };

  const removeMotif = (id) => onUpdate({ motifs: motifs.filter((m) => m.id !== id) });

  const addSighting = (id, page, note) => {
    onUpdate({
      motifs: motifs.map((m) => (m.id === id ? { ...m, sightings: [...m.sightings, newSighting(page, note)] } : m)),
    });
  };

  const removeSighting = (motifId, sightingId) => {
    onUpdate({
      motifs: motifs.map((m) => (m.id === motifId ? { ...m, sightings: m.sightings.filter((s) => s.id !== sightingId) } : m)),
    });
  };

  const pullFromAnalysis = () => {
    if (!(book.aiAnalysis || '').trim()) {
      toast.error('Generate an Analysis Kit first (AI Tools tab), then pull its motifs here.');
      return;
    }
    const found = extractMotifs(book.aiAnalysis);
    if (!found.length) { toast.error("Couldn't find a motifs list in the Analysis Kit."); return; }
    const have = new Set(motifs.map((m) => m.name.toLowerCase()));
    const added = found.filter((f) => !have.has(f.toLowerCase())).map(newMotif);
    if (!added.length) { toast.error('Those motifs are already tracked.'); return; }
    onUpdate({ motifs: [...motifs, ...added] });
    toast.success(`Added ${added.length} motif${added.length === 1 ? '' : 's'} to watch for.`);
  };

  const weave = async () => {
    const withNotes = motifs.filter((m) => m.sightings.length);
    if (!withNotes.length) { toast.error('Log a sighting or two first, then weave them together.'); return; }
    setBusy(true);
    try {
      const body = motifs
        .map((m) => `- ${m.name}: ${m.sightings.map((s) => `${s.page ? `p.${s.page} ` : ''}${s.note}`.trim()).join('; ') || '(noticed, no note)'}`)
        .join('\n');
      const prompt =
        `For "${book.title}" by ${book.author}, a reader tracked these motifs and where they noticed them:\n${body}\n\n` +
        `Weave the reader's own observations into a short, thoughtful synthesis (2–3 short paragraphs) about how these motifs work together in the book. ` +
        `Ground it in their notes; don't add plot spoilers beyond what the notes imply. Plain prose, warm but insightful.`;
      const text = await api.generateAI(prompt);
      onUpdate({ motifSynthesis: text });
      toast.success('Synthesis ready.');
    } catch (err) {
      toast.error(err.message || 'AI features need a free account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-stone-500">
          Watch for motifs and symbols, and note where they surface. Reading actively is what makes them stick.
        </p>
        <button
          onClick={pullFromAnalysis}
          className="shrink-0 inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 font-semibold text-sm px-4 py-2 rounded-full transition-colors"
        >
          <Wand2 size={15} /> Pull from Analysis Kit
        </button>
      </div>

      {/* Add motif */}
      <div className="flex gap-2 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addMotif()}
          placeholder="Add a motif or symbol to watch — e.g. water, mirrors, hunger"
          className="flex-1 bg-surface border border-stone-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          onClick={() => addMotif()}
          disabled={!name.trim()}
          className="shrink-0 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm px-4 rounded-full transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {motifs.length === 0 ? (
        <div className="text-center py-14 bg-surface rounded-2xl border border-stone-200/70">
          <Eye size={36} className="mx-auto text-stone-300 mb-3" />
          <p className="font-display font-semibold text-ink">Nothing tracked yet</p>
          <p className="text-stone-500 mt-1 text-sm max-w-sm mx-auto">
            Add a motif above, or pull the ones the Analysis Kit flagged and tick them off as you read.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {motifs.map((m) => <MotifCard key={m.id} motif={m} onAddSighting={addSighting} onRemoveSighting={removeSighting} onRemove={removeMotif} />)}
        </div>
      )}

      {/* Synthesis */}
      {motifs.length > 0 && (
        <div className="mt-6">
          <button
            onClick={weave}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {book.motifSynthesis ? 'Re-weave synthesis' : 'Weave my observations'}
          </button>

          {book.motifSynthesis && (
            <div className="mt-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-surface p-6 shadow-sm">
              <h4 className="text-sm font-display font-semibold text-ink mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-brand-500" /> Your motifs, woven together
              </h4>
              <div
                className="prose-sm max-w-none text-ink leading-relaxed [&_strong]:text-ink [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(book.motifSynthesis) }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MotifCard({ motif, onAddSighting, onRemoveSighting, onRemove }) {
  const [page, setPage] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  const save = () => {
    if (!note.trim() && !page.trim()) return;
    onAddSighting(motif.id, page, note);
    setPage('');
    setNote('');
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200/70 bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Eye size={16} className="text-brand-500 shrink-0" />
          <span className="font-semibold text-ink truncate">{motif.name}</span>
          <span className="text-xs text-stone-400 shrink-0">
            {motif.sightings.length} {motif.sightings.length === 1 ? 'sighting' : 'sightings'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setOpen((o) => !o)} className="text-sm font-semibold text-brand-600 hover:text-brand-700 px-2 py-1 rounded-full hover:bg-brand-50 transition-colors">
            + Spotted it
          </button>
          <button onClick={() => onRemove(motif.id)} aria-label={`Stop tracking ${motif.name}`} className="text-stone-300 hover:text-status-dnf p-1.5">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 flex flex-col sm:flex-row gap-2">
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page"
            className="w-full sm:w-24 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="What did you notice?"
            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button onClick={save} className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2 rounded-full transition-colors">
            Log
          </button>
        </div>
      )}

      {motif.sightings.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {motif.sightings.map((s) => (
            <div key={s.id} className="group flex items-start gap-2 text-sm bg-stone-50 rounded-lg px-3 py-1.5">
              <MapPin size={13} className="text-brand-400 mt-1 shrink-0" />
              <span className="min-w-0 flex-1">
                {s.page ? <b className="text-ink">p.{s.page} </b> : null}
                <span className="text-stone-600">{s.note}</span>
                <span className="text-xs text-stone-400 ml-1.5">· {fmtDate(s.date)}</span>
              </span>
              <button onClick={() => onRemoveSighting(motif.id, s.id)} aria-label="Remove sighting" className="shrink-0 text-stone-300 hover:text-status-dnf opacity-0 group-hover:opacity-100">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
