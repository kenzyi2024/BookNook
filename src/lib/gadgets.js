// Photo-frame styles for the "photo" shelf gadget. (Decor accessories live in
// gadgetArt.jsx as SVG art — no emojis anywhere.)
export const FRAMES = [
  { id: 'classic', label: 'Classic' },
  { id: 'gold', label: 'Gold' },
  { id: 'wood', label: 'Wood' },
  { id: 'polaroid', label: 'Polaroid' },
];

export const frameClass = (id) =>
  ({
    classic: 'p-1.5 bg-white border border-stone-300 shadow-md rounded-sm',
    gold: 'p-1.5 bg-amber-50 border-2 border-amber-400 shadow-md rounded-sm',
    wood: 'p-2 bg-amber-950 border border-amber-900 shadow-md rounded-sm',
    polaroid: 'p-1.5 pb-5 bg-white shadow-md rounded-sm',
  })[id] || 'p-1.5 bg-white border border-stone-300 shadow-md rounded-sm';
