import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import BookSpine from './BookSpine';
import { GadgetArt } from '../../lib/gadgetArt';
import { frameClass } from '../../lib/gadgets';

// Approximate max slot width used to estimate how many items fit per shelf.
const SLOT = 82;

function GadgetSlot({ gadget, onMoveLeft, onMoveRight, onRemove }) {
  return (
    <div className="relative group/gadget shrink-0 w-20 flex items-end justify-center self-end pb-1">
      {gadget.type === 'photo' ? (
        <div className={frameClass(gadget.frame)} title={gadget.caption || ''}>
          <img src={gadget.image} alt={gadget.caption || 'photo'} className="w-20 h-28 object-cover" />
        </div>
      ) : (
        <div className="w-full h-28 flex items-end justify-center">
          <GadgetArt variant={gadget.variant} className="w-full h-full drop-shadow-md" />
        </div>
      )}

      {/* hover controls: nudge left/right along the shelf, or remove */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/gadget:opacity-100 transition-opacity">
        <button onClick={onMoveLeft} aria-label="Move left" className="bg-surface text-stone-600 hover:text-brand-600 rounded-full p-1 shadow border border-stone-200">
          <ChevronLeft size={12} />
        </button>
        <button onClick={onMoveRight} aria-label="Move right" className="bg-surface text-stone-600 hover:text-brand-600 rounded-full p-1 shadow border border-stone-200">
          <ChevronRight size={12} />
        </button>
        <button onClick={onRemove} aria-label="Remove decoration" className="bg-surface text-status-dnf rounded-full p-1 shadow border border-stone-200">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

/**
 * A real multi-shelf bookcase: books (and any decor gadgets) flow left-to-right
 * and wrap onto a new shelf below instead of scrolling. Decor gadgets carry a
 * `position` (how many books precede them) and can be nudged along the shelves.
 */
export default function Bookcase({ books, decor = [], onSelect, onPersistCover, onMoveGadget, onRemoveGadget }) {
  const ref = useRef(null);
  const [perRow, setPerRow] = useState(8);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setPerRow(Math.max(3, Math.floor((el.clientWidth - 24) / SLOT)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Interleave books + gadgets by gadget position.
  const seq = [];
  const gAt = {};
  decor.forEach((g, i) => {
    const p = Math.max(0, Math.min(books.length, g.position ?? books.length));
    (gAt[p] = gAt[p] || []).push({ g, i });
  });
  for (let bi = 0; bi <= books.length; bi++) {
    (gAt[bi] || []).forEach(({ g, i }) => seq.push({ kind: 'gadget', g, idx: i }));
    if (bi < books.length) seq.push({ kind: 'book', book: books[bi] });
  }

  const rows = [];
  for (let i = 0; i < seq.length; i += perRow) rows.push(seq.slice(i, i + perRow));

  return (
    <div ref={ref} className="space-y-2">
      {rows.map((row, ri) => (
        <div key={ri}>
          <div className="flex items-end gap-3 px-3 min-h-[248px]">
            {row.map((it) =>
              it.kind === 'book' ? (
                <BookSpine key={it.book._id} book={it.book} onSelect={onSelect} onPersistCover={onPersistCover} />
              ) : (
                <GadgetSlot
                  key={`g${it.idx}`}
                  gadget={it.g}
                  onMoveLeft={() => onMoveGadget(it.idx, -1)}
                  onMoveRight={() => onMoveGadget(it.idx, 1)}
                  onRemove={() => onRemoveGadget(it.idx)}
                />
              )
            )}
          </div>
          {/* wooden shelf plank */}
          <div
            className="h-4 rounded-sm shadow-md"
            style={{ background: 'linear-gradient(#7a4a2b, #5f3720)' }}
          />
        </div>
      ))}
    </div>
  );
}
