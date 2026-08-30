import { useState } from 'react';
import { X, ListOrdered, GripVertical, CalendarDays } from 'lucide-react';
import BookCover from '../ui/BookCover';
import { useDialog } from '../../hooks/useDialog';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => {
  if (!key) return 'Unscheduled';
  const [y, m] = key.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

/**
 * Plan your TBR as a board: drag books between an "Unscheduled" pile and monthly
 * buckets, and drag to reorder within a month. Saving writes each book's planned
 * month + its order.
 */
export default function TBRPlanner({ books, onSave, onClose }) {
  const dialogRef = useDialog(onClose);
  // Build the list of buckets: Unscheduled, this month + next 5, plus any months
  // already used by the books.
  const now = new Date();
  const monthKeys = [];
  for (let i = 0; i < 6; i++) monthKeys.push(ym(new Date(now.getFullYear(), now.getMonth() + i, 1)));
  books.forEach((b) => { if (b.tbrMonth && !monthKeys.includes(b.tbrMonth)) monthKeys.push(b.tbrMonth); });
  monthKeys.sort();
  const buckets = ['', ...monthKeys];

  // items: ordered [{ id, bucket }]; books resolved by id.
  const byId = Object.fromEntries(books.map((b) => [b._id, b]));
  const [items, setItems] = useState(() =>
    [...books]
      .sort((a, b) => (a.tbrMonth || '').localeCompare(b.tbrMonth || '') || (a.tbrRank ?? Infinity) - (b.tbrRank ?? Infinity))
      .map((b) => ({ id: b._id, bucket: b.tbrMonth || '' }))
  );
  const [dragId, setDragId] = useState(null);
  const [overBucket, setOverBucket] = useState(null);

  const move = (id, bucket, beforeId) => {
    setItems((prev) => {
      const rest = prev.filter((i) => i.id !== id);
      const item = { id, bucket };
      if (beforeId != null) {
        const idx = rest.findIndex((i) => i.id === beforeId);
        rest.splice(idx < 0 ? rest.length : idx, 0, item);
      } else {
        rest.push(item);
      }
      return rest;
    });
  };

  const save = () => {
    const updates = [];
    buckets.forEach((bucket) => {
      items.filter((i) => i.bucket === bucket).forEach((i, idx) => {
        const b = byId[i.id];
        if (b && (b.tbrMonth !== bucket || b.tbrRank !== idx)) updates.push({ id: i.id, tbrMonth: bucket, tbrRank: idx });
      });
    });
    onSave(updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Plan your TBR" className="bg-surface w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
            <ListOrdered size={18} className="text-brand-500" /> Plan your TBR
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-ink" aria-label="Close"><X size={20} /></button>
        </div>

        {books.length === 0 ? (
          <p className="px-6 py-10 text-center text-stone-500">Nothing on your Want to Read shelf yet.</p>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            <p className="text-xs text-stone-400 px-1">Drag books to reorder, or into a month to plan when you&rsquo;ll read them.</p>
            {buckets.map((bucket) => {
              const inBucket = items.filter((i) => i.bucket === bucket);
              const isMonth = !!bucket;
              return (
                <div
                  key={bucket || 'unscheduled'}
                  onDragOver={(e) => { e.preventDefault(); setOverBucket(bucket); }}
                  onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, bucket, null); setDragId(null); setOverBucket(null); }}
                  className={`rounded-2xl border p-2.5 transition-colors ${overBucket === bucket ? 'border-brand-400 bg-brand-50/60' : 'border-stone-200/70 bg-stone-50/50'}`}
                >
                  <div className="flex items-center gap-1.5 px-1 pb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {isMonth ? <CalendarDays size={13} className="text-brand-500" /> : null}
                    {monthLabel(bucket)}
                    <span className="text-stone-400 font-normal normal-case">· {inBucket.length}</span>
                  </div>
                  <div className="space-y-1.5 min-h-[8px]">
                    {inBucket.map((it) => {
                      const b = byId[it.id];
                      if (!b) return null;
                      return (
                        <div
                          key={it.id}
                          draggable
                          onDragStart={() => setDragId(it.id)}
                          onDragEnd={() => { setDragId(null); setOverBucket(null); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dragId && dragId !== it.id) move(dragId, bucket, it.id); setDragId(null); setOverBucket(null); }}
                          className={`flex items-center gap-2.5 bg-surface border border-stone-200 rounded-xl px-2.5 py-2 shadow-sm cursor-grab active:cursor-grabbing ${dragId === it.id ? 'opacity-40' : ''}`}
                        >
                          <GripVertical size={15} className="text-stone-300 shrink-0" />
                          <BookCover book={b} rounded="rounded" className="w-7 h-10 shadow-sm shrink-0" showTitle={false} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-ink truncate">{b.title}</span>
                            <span className="block text-xs text-stone-400 truncate">{b.author}</span>
                          </span>
                        </div>
                      );
                    })}
                    {inBucket.length === 0 && (
                      <p className="text-xs text-stone-400 italic px-1 py-1">Drop books here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors">Cancel</button>
          <button onClick={save} disabled={books.length === 0} className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2 rounded-full transition-colors">Save plan</button>
        </div>
      </div>
    </div>
  );
}
