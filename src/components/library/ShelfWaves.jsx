// Decorative wavy wooden shelf edges.
export function ShelfWave1() {
  return (
    <svg
      viewBox="0 0 1000 120"
      preserveAspectRatio="none"
      className="w-full h-16 md:h-24 fill-brand-600/80 drop-shadow-xl absolute top-full left-0 mt-[-10px] pointer-events-none z-0"
    >
      <path d="M0,0 C200,60 300,100 500,60 C700,20 800,0 1000,40 L1000,120 L0,120 Z" />
      <path
        d="M0,20 C200,80 300,120 500,80 C700,40 800,20 1000,60 L1000,120 L0,120 Z"
        fill="var(--color-brand-700)"
      />
    </svg>
  );
}

export function ShelfWave2() {
  return (
    <svg
      viewBox="0 0 1000 120"
      preserveAspectRatio="none"
      className="w-full h-16 md:h-24 fill-brand-600/80 drop-shadow-xl absolute top-full left-0 mt-[-10px] pointer-events-none z-0"
    >
      <path d="M0,40 C200,0 300,20 500,60 C700,100 800,60 1000,0 L1000,120 L0,120 Z" />
      <path
        d="M0,60 C200,20 300,40 500,80 C700,120 800,80 1000,20 L1000,120 L0,120 Z"
        fill="var(--color-brand-700)"
      />
    </svg>
  );
}
