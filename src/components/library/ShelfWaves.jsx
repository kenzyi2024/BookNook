// Decorative wooden shelf edges — a gentle, hand-planed ledge rather than big
// cartoon waves: a soft curve, a thin polished top highlight, and a darker
// under-edge for depth, with a soft shadow.
const SHADOW = { filter: 'drop-shadow(0 7px 9px rgba(0,0,0,0.13))' };

export function ShelfWave1() {
  return (
    <svg
      viewBox="0 0 1000 60"
      preserveAspectRatio="none"
      className="w-full h-9 md:h-12 absolute top-full left-0 -mt-2 pointer-events-none z-0"
      style={SHADOW}
    >
      {/* under-edge for depth */}
      <path d="M0,16 C280,8 420,20 500,15 C640,7 800,19 1000,12 L1000,60 L0,60 Z" fill="var(--color-brand-800)" />
      {/* shelf face */}
      <path d="M0,10 C280,2 420,15 500,9 C640,1 800,13 1000,6 L1000,54 L0,54 Z" fill="var(--color-brand-600)" />
      {/* polished top highlight */}
      <path d="M0,10 C280,2 420,15 500,9 C640,1 800,13 1000,6" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function ShelfWave2() {
  return (
    <svg
      viewBox="0 0 1000 60"
      preserveAspectRatio="none"
      className="w-full h-9 md:h-12 absolute top-full left-0 -mt-2 pointer-events-none z-0"
      style={SHADOW}
    >
      <path d="M0,12 C280,20 420,7 500,13 C640,19 800,7 1000,15 L1000,60 L0,60 Z" fill="var(--color-brand-800)" />
      <path d="M0,6 C280,14 420,1 500,7 C640,13 800,1 1000,9 L1000,54 L0,54 Z" fill="var(--color-brand-600)" />
      <path d="M0,6 C280,14 420,1 500,7 C640,13 800,1 1000,9" fill="none" stroke="var(--color-brand-400)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
