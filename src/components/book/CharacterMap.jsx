import { useRef, useState } from 'react';
import { Users, Plus, Trash2, Sparkles, Loader2, Link2, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../ui/ToastProvider';
import { makeId, posOf, initials, parseCast, CANVAS_W, CANVAS_H } from '../../lib/characters';

/**
 * A per-book character & relationship map. Characters are nodes you can drag
 * around a canvas; relationships are labeled lines between them. The AI can seed
 * the cast, bounded to how far the reader has read so it never spoils ahead.
 */
export default function CharacterMap({ book, onUpdate }) {
  const api = useApi();
  const toast = useToast();
  const svgRef = useRef(null);

  const characters = book.characters || [];
  const relationships = book.relationships || [];

  const [drag, setDrag] = useState(null); // { id, x, y }
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [relFrom, setRelFrom] = useState('');
  const [relTo, setRelTo] = useState('');
  const [relLabel, setRelLabel] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  // --- geometry ---
  const posMap = {};
  characters.forEach((c, i) => {
    posMap[c.id] = drag && drag.id === c.id ? { x: drag.x, y: drag.y } : posOf(c, i, characters.length);
  });

  const toCanvas = (e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return {
      x: Math.max(46, Math.min(CANVAS_W - 46, p.x)),
      y: Math.max(46, Math.min(CANVAS_H - 60, p.y)),
    };
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const { x, y } = toCanvas(e);
    setDrag((d) => (d ? { ...d, x, y } : d));
  };
  const endDrag = () => {
    if (!drag) return;
    onUpdate({ characters: characters.map((c) => (c.id === drag.id ? { ...c, x: drag.x, y: drag.y } : c)) });
    setDrag(null);
  };

  // --- mutations ---
  const addCharacter = () => {
    if (!name.trim()) return;
    onUpdate({ characters: [...characters, { id: makeId(), name: name.trim(), role: role.trim(), note: '' }] });
    setName('');
    setRole('');
  };

  const removeCharacter = (id) => {
    onUpdate({
      characters: characters.filter((c) => c.id !== id),
      relationships: relationships.filter((r) => r.from !== id && r.to !== id),
    });
  };

  const addRelationship = () => {
    if (!relFrom || !relTo || relFrom === relTo) return;
    const exists = relationships.some(
      (r) => (r.from === relFrom && r.to === relTo) || (r.from === relTo && r.to === relFrom)
    );
    if (exists) { toast.error('These two are already connected.'); return; }
    onUpdate({ relationships: [...relationships, { id: makeId('r'), from: relFrom, to: relTo, label: relLabel.trim() }] });
    setRelLabel('');
  };

  const removeRelationship = (id) => onUpdate({ relationships: relationships.filter((r) => r.id !== id) });

  const suggestCast = async () => {
    setAiBusy(true);
    try {
      const prompt =
        `List the main characters of "${book.title}" by ${book.author} as they appear up to about page ${book.currentPage || 0} of ${book.totalPages}. ` +
        `Do not reveal anything beyond that point — no spoilers. Use EXACTLY this format for each character, separated by a line of ---:\n` +
        `Name: <name>\nRole: <2 to 5 word role>\nConnections: <comma-separated list of "Other Name (relationship)"> or none\n---\n` +
        `Limit to 8 characters.`;
      const text = await api.generateAI(prompt);
      const { characters: cast, edges } = parseCast(text);
      if (!cast.length) { toast.error('Could not read a cast list. Try again.'); return; }

      const merged = characters.slice();
      const byName = new Map(merged.map((c) => [c.name.toLowerCase(), c]));
      cast.forEach((c) => {
        if (!byName.has(c.name.toLowerCase())) {
          const nc = { id: makeId(), name: c.name, role: c.role || '', note: c.note || '' };
          merged.push(nc);
          byName.set(c.name.toLowerCase(), nc);
        }
      });

      const rels = relationships.slice();
      const key = (a, b) => [a, b].sort().join('|');
      const have = new Set(rels.map((r) => key(r.from, r.to)));
      edges.forEach((e) => {
        const from = byName.get(e.fromName.toLowerCase());
        const to = byName.get(e.toName.toLowerCase());
        if (from && to && from.id !== to.id && !have.has(key(from.id, to.id))) {
          rels.push({ id: makeId('r'), from: from.id, to: to.id, label: e.label || '' });
          have.add(key(from.id, to.id));
        }
      });

      onUpdate({ characters: merged, relationships: rels });
      toast.success(`Added ${merged.length - characters.length} character${merged.length - characters.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err.message || 'AI features need a free account.');
    } finally {
      setAiBusy(false);
    }
  };

  const nameOf = (id) => characters.find((c) => c.id === id)?.name || '?';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm text-stone-500">
          Map who&rsquo;s who. Drag to arrange, connect relationships, or let AI seed the cast up to where you&rsquo;ve read.
        </p>
        <button
          onClick={suggestCast}
          disabled={aiBusy}
          className="shrink-0 inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 disabled:opacity-50 font-semibold text-sm px-4 py-2 rounded-full transition-colors"
        >
          {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Suggest cast
        </button>
      </div>

      {/* Map canvas */}
      <div className="rounded-2xl border border-stone-200/70 bg-gradient-to-br from-brand-50/40 to-surface shadow-sm overflow-hidden">
        {characters.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Users size={38} className="mx-auto text-stone-300 mb-3" />
            <p className="font-display font-semibold text-ink">No characters yet</p>
            <p className="text-stone-500 mt-1 text-sm max-w-sm mx-auto">
              Add a character below, or use <b>Suggest cast</b> to have AI list the main characters so far.
            </p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full touch-none select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {/* edges */}
            {relationships.map((r) => {
              const a = posMap[r.from];
              const b = posMap[r.to];
              if (!a || !b) return null;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <g key={r.id}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-brand-300)" strokeWidth="2.5" />
                  {r.label && (
                    <>
                      <rect x={mx - r.label.length * 4.6 - 8} y={my - 15} width={r.label.length * 9.2 + 16} height="26" rx="13" fill="var(--color-surface)" stroke="var(--color-brand-200)" />
                      <text x={mx} y={my + 4} textAnchor="middle" fontSize="16" fill="var(--color-brand-700)" style={{ fontWeight: 600 }}>{r.label}</text>
                    </>
                  )}
                </g>
              );
            })}
            {/* nodes */}
            {characters.map((c) => {
              const p = posMap[c.id];
              return (
                <g
                  key={c.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); const cur = posMap[c.id]; setDrag({ id: c.id, x: cur.x, y: cur.y }); }}
                >
                  <circle r="34" fill="var(--color-brand-500)" stroke="#fff" strokeWidth="3" />
                  <text textAnchor="middle" y="6" fontSize="24" fill="#fff" style={{ fontWeight: 700 }}>{initials(c.name)}</text>
                  <text textAnchor="middle" y="56" fontSize="19" fill="var(--color-ink)" style={{ fontWeight: 700 }}>
                    {c.name.length > 18 ? `${c.name.slice(0, 17)}…` : c.name}
                  </text>
                  {c.role && (
                    <text textAnchor="middle" y="78" fontSize="15" fill="var(--color-stone-500)">
                      {c.role.length > 24 ? `${c.role.slice(0, 23)}…` : c.role}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        {/* Add character */}
        <div className="bg-surface border border-stone-200/70 rounded-2xl p-4">
          <h4 className="text-sm font-display font-semibold text-ink mb-3 flex items-center gap-2"><Plus size={16} className="text-brand-500" /> Add character</h4>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
            placeholder="Name"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
            placeholder="Role (optional) — e.g. rival, mentor"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={addCharacter}
            disabled={!name.trim()}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-full transition-colors"
          >
            Add to map
          </button>

          {characters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {characters.map((c) => (
                <span key={c.id} className="group inline-flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-full pl-3 pr-1.5 py-1 text-sm text-brand-800">
                  {c.name}
                  <button onClick={() => removeCharacter(c.id)} aria-label={`Remove ${c.name}`} className="text-brand-400 hover:text-status-dnf rounded-full p-0.5">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Relationships */}
        <div className="bg-surface border border-stone-200/70 rounded-2xl p-4">
          <h4 className="text-sm font-display font-semibold text-ink mb-3 flex items-center gap-2"><Link2 size={16} className="text-brand-500" /> Connect two</h4>
          <div className="flex gap-2 mb-2">
            <select value={relFrom} onChange={(e) => setRelFrom(e.target.value)} className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">From…</option>
              {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={relTo} onChange={(e) => setRelTo(e.target.value)} className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">To…</option>
              {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input
            value={relLabel}
            onChange={(e) => setRelLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRelationship()}
            placeholder="Relationship — e.g. sister, rival, mentor"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={addRelationship}
            disabled={!relFrom || !relTo || relFrom === relTo}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-full transition-colors"
          >
            Connect
          </button>

          {relationships.length > 0 && (
            <div className="space-y-1.5 mt-4">
              {relationships.map((r) => (
                <div key={r.id} className="group flex items-center justify-between gap-2 text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-1.5">
                  <span className="min-w-0 truncate">
                    <b className="text-ink">{nameOf(r.from)}</b>
                    <span className="text-stone-400">{r.label ? ` — ${r.label} — ` : ' — '}</span>
                    <b className="text-ink">{nameOf(r.to)}</b>
                  </span>
                  <button onClick={() => removeRelationship(r.id)} aria-label="Remove relationship" className="shrink-0 text-stone-300 hover:text-status-dnf">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
