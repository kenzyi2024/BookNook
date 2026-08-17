import { useMemo, useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { CW_CATEGORIES, LEVELS } from '../../lib/contentWarnings';

/**
 * Editor for a book's content warnings. Each category can be flagged at one of
 * three intensities (or left off). The reader can also add a custom one.
 */
export default function ContentWarningsModal({ current = [], onSave, onClose }) {
  // name -> level
  const [selected, setSelected] = useState(() => {
    const m = {};
    current.forEach((w) => { if (w?.name) m[w.name] = w.level || 'moderate'; });
    return m;
  });
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');

  // Curated categories + any custom ones already selected.
  const categories = useMemo(() => {
    const extra = Object.keys(selected).filter((n) => !CW_CATEGORIES.includes(n));
    return [...extra, ...CW_CATEGORIES];
  }, [selected]);

  const filtered = query.trim()
    ? categories.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : categories;

  const setLevel = (name, lvl) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[name] === lvl) delete next[name]; // click active level again = off
      else next[name] = lvl;
      return next;
    });
  };

  const addCustom = () => {
    const n = customName.trim();
    if (!n) return;
    setSelected((prev) => ({ ...prev, [n]: prev[n] || 'moderate' }));
    setCustomName('');
    setQuery('');
  };

  const save = () => {
    const list = Object.entries(selected).map(([name, lvl]) => ({ name, level: lvl }));
    onSave(list);
    onClose();
  };

  const count = Object.keys(selected).length;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-lg text-ink">Content warnings</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="px-6 pt-4">
          <p className="text-sm text-stone-500 mb-3">
            Flag anything future readers might want to know about, and how intense it is. Left off = not present.
          </p>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full bg-stone-50 border border-stone-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {filtered.map((name) => (
            <div key={name} className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 last:border-0">
              <span className="text-sm text-ink min-w-0 truncate">{name}</span>
              <div className="flex items-center gap-1 shrink-0">
                {LEVELS.map((l) => {
                  const active = selected[name] === l.key;
                  return (
                    <button
                      key={l.key}
                      onClick={() => setLevel(name, l.key)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors"
                      style={active
                        ? { backgroundColor: l.bg, color: l.accent, borderColor: l.accent }
                        : { backgroundColor: 'transparent', color: 'var(--color-stone-400)', borderColor: 'var(--color-stone-200)' }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-4 flex items-center gap-2">
              <input
                value={customName || query}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Add your own…"
                className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button onClick={addCustom} className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-4 py-2 rounded-full">
                <Plus size={15} /> Add
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="Add a custom warning…"
              className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button onClick={addCustom} disabled={!customName.trim()} className="shrink-0 inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-600 font-semibold text-sm px-3 rounded-full">
              <Plus size={15} />
            </button>
          </div>
          <button onClick={save} className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors">
            Save{count ? ` (${count})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
