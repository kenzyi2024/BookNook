import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import BookSpine from './BookSpine';
import FairyLights from './FairyLights';
import { ShelfWave1, ShelfWave2 } from './ShelfWaves';
import { GadgetArt } from '../../lib/gadgetArt';
import { frameClass } from '../../lib/gadgets';

// Approximate max slot width used to estimate how many items fit per shelf.
const SLOT = 82;

function GadgetSlot({ gadget, dragging, onDragStart, onDragEnd, onRemove, onNudge }) {
  return (
    <div
      draggable
      tabIndex={0}
      role="button"
      aria-label="Shelf decoration — drag, or press the left/right arrow keys to move it"
      title="Drag, or use ← → to move"
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'gadget');
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); onNudge(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); onNudge(1); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); onRemove(); }
      }}
      className={`relative group/gadget shrink-0 w-20 flex items-end justify-center self-end pb-1 cursor-grab active:cursor-grabbing rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 ${dragging ? 'opacity-40' : ''}`}
    >
      {gadget.type === 'photo' ? (
        <div className={`${frameClass(gadget.frame)} pointer-events-none`} title={gadget.caption || ''}>
          <img src={gadget.image} alt={gadget.caption || 'photo'} className="w-20 h-28 object-cover" />
        </div>
      ) : (
        <div className="w-full h-28 flex items-end justify-center pointer-events-none">
          <GadgetArt variant={gadget.variant} className="w-full h-full drop-shadow-md" />
        </div>
      )}

      <button
        onClick={onRemove}
        aria-label="Remove decoration"
        className="absolute -top-2 -right-1 z-10 bg-surface text-status-dnf rounded-full p-1.5 shadow border border-stone-200 opacity-0 group-hover/gadget:opacity-100 focus:opacity-100 transition-opacity"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/**
 * A real multi-shelf bookcase: books (and decor gadgets) flow left-to-right and
 * wrap onto a new shelf below. Gadgets can be dragged and dropped between books;
 * their shelf position is stored as "how many books precede them".
 */
export default function Bookcase({ books, decor = [], onSelect, onPersistCover, onPlaceGadget, onRemoveGadget }) {
  const ref = useRef(null);
  const [perRow, setPerRow] = useState(8);
  const [dragIdx, setDragIdx] = useState(null);
  const [overPos, setOverPos] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setPerRow(Math.max(3, Math.floor((el.clientWidth - 24) / SLOT)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Interleave books + gadgets, tracking how many books precede each slot.
  const seq = [];
  const gAt = {};
  decor.forEach((g, i) => {
    const p = Math.max(0, Math.min(books.length, g.position ?? books.length));
    (gAt[p] = gAt[p] || []).push({ g, i });
  });
  for (let bi = 0; bi <= books.length; bi++) {
    (gAt[bi] || []).forEach(({ g, i }) => seq.push({ kind: 'gadget', g, idx: i, booksBefore: bi }));
    if (bi < books.length) seq.push({ kind: 'book', book: books[bi], booksBefore: bi });
  }

  const rows = [];
  for (let i = 0; i < seq.length; i += perRow) rows.push(seq.slice(i, i + perRow));

  const onOver = (pos) => (e) => {
    if (dragIdx == null) return;
    e.preventDefault();
    setOverPos(pos);
  };
  const onDropAt = (pos) => (e) => {
    e.preventDefault();
    if (dragIdx != null) onPlaceGadget(dragIdx, pos);
    setDragIdx(null);
    setOverPos(null);
  };

  return (
    <div ref={ref}>
      {rows.map((row, ri) => (
        <div key={ri} className="relative mb-16 md:mb-24">
          <FairyLights />
          <div className="flex items-end gap-3 px-3 min-h-[248px]">
            {row.map((it) => {
              const key = it.kind === 'book' ? it.book._id : `g${it.idx}`;
              const marker = dragIdx != null && overPos === it.booksBefore;
              return (
                <div
                  key={key}
                  onDragOver={onOver(it.booksBefore)}
                  onDrop={onDropAt(it.booksBefore)}
                  className={`flex items-end shrink-0 ${marker ? 'border-l-2 border-brand-500 pl-1 -ml-1' : ''}`}
                >
                  {it.kind === 'book' ? (
                    <BookSpine book={it.book} index={it.booksBefore} onSelect={onSelect} onPersistCover={onPersistCover} />
                  ) : (
                    <GadgetSlot
                      gadget={it.g}
                      dragging={dragIdx === it.idx}
                      onDragStart={() => setDragIdx(it.idx)}
                      onDragEnd={() => { setDragIdx(null); setOverPos(null); }}
                      onRemove={() => onRemoveGadget(it.idx)}
                      onNudge={(dir) => onPlaceGadget(it.idx, it.booksBefore + dir)}
                    />
                  )}
                </div>
              );
            })}
            {/* drop-at-the-very-end zone (last shelf only) */}
            {ri === rows.length - 1 && (
              <div
                onDragOver={onOver(books.length)}
                onDrop={onDropAt(books.length)}
                className={`self-stretch w-10 ${dragIdx != null && overPos === books.length ? 'border-l-2 border-brand-500' : ''}`}
              />
            )}
          </div>
          {ri % 2 === 0 ? <ShelfWave1 /> : <ShelfWave2 />}
        </div>
      ))}
    </div>
  );
}
