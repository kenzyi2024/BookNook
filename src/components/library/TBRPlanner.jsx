import { useState } from 'react';
import { X, ChevronUp, ChevronDown, ListOrdered } from 'lucide-react';

/**
 * Plan your to-be-read pile: reorder the "Want to Read" books into the order you
 * actually intend to read them. Saving writes a tbrRank to each so the shelf can
 * sort by "TBR order".
 */
export default function TBRPlanner({ books, onSave, onClose }) {
  // Start from current tbr order (rank asc, then recently added).
  const initial = [...books].sort(
    (a, b) => (a.tbrRank ?? Infinity) - (b.tbrRank ?? Infinity) ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const [order, setOrder] = useState(initial);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = order.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const save = () => {
    onSave(order);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
            <ListOrdered size={18} className="text-brand-500" /> Plan your TBR
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        {order.length === 0 ? (
          <p className="px-6 py-10 text-center text-stone-500">Nothing on your Want to Read shelf yet.</p>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {order.map((b, i) => (
              <div key={b._id} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                <span className="w-6 text-center text-sm font-bold text-brand-500 shrink-0">{i + 1}</span>
                {b.coverUrl ? (
                  <img src={b.coverUrl} alt="" className="w-8 h-11 object-cover rounded shadow-sm shrink-0" />
                ) : (
                  <span className="w-8 h-11 rounded bg-brand-200 shrink-0" />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-ink truncate">{b.title}</span>
                  <span className="block text-xs text-stone-400 truncate">{b.author}</span>
                </span>
                <div className="flex flex-col shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-stone-400 hover:text-brand-600 disabled:opacity-30 p-0.5" aria-label="Move up"><ChevronUp size={16} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === order.length - 1} className="text-stone-400 hover:text-brand-600 disabled:opacity-30 p-0.5" aria-label="Move down"><ChevronDown size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors">Cancel</button>
          <button onClick={save} disabled={order.length === 0} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors">Save order</button>
        </div>
      </div>
    </div>
  );
}
