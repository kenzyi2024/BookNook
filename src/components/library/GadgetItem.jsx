import { X } from 'lucide-react';
import { plantEmoji, frameClass } from '../../lib/gadgets';

/**
 * A decorative shelf gadget (plant or framed photo) that sits among the books.
 */
export default function GadgetItem({ gadget, onRemove }) {
  return (
    <div className="relative group/gadget shrink-0 flex items-end justify-center self-end pb-1">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 bg-white text-status-dnf rounded-full p-0.5 shadow border border-stone-200 opacity-0 group-hover/gadget:opacity-100 transition-opacity"
          aria-label="Remove decoration"
        >
          <X size={13} />
        </button>
      )}
      {gadget.type === 'plant' ? (
        <span className="text-5xl leading-none drop-shadow-md select-none">{plantEmoji(gadget.variant)}</span>
      ) : (
        <div className={frameClass(gadget.frame)} title={gadget.caption || ''}>
          <img src={gadget.image} alt={gadget.caption || 'photo'} className="w-16 h-20 object-cover" />
        </div>
      )}
    </div>
  );
}
