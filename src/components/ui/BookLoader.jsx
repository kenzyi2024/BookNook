/**
 * A little book riffling its pages — used in place of a spinner wherever the app
 * is working (AI generating, covers loading). Inherits theme colors so it looks
 * right in the candlelit dark theme too.
 */
export default function BookLoader({ label = '', size = 'md' }) {
  const s = size === 'sm' ? 0.7 : 1; // scale factor
  const W = 120 * s;
  const H = 86 * s;
  const pageW = 56 * s;
  const pageH = 76 * s;
  const pageLeft = 60 * s;

  const leaf = {
    position: 'absolute',
    top: 5 * s,
    left: pageLeft,
    width: pageW,
    height: pageH,
    borderRadius: `${2 * s}px ${6 * s}px ${6 * s}px ${2 * s}px`,
    background: 'linear-gradient(90deg, var(--color-surface), var(--color-stone-100))',
    boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div style={{ perspective: 900 }}>
        <div style={{ position: 'relative', width: W, height: H, transformStyle: 'preserve-3d' }}>
          {/* cover */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--color-brand-500)',
              borderRadius: `${5 * s}px ${8 * s}px ${8 * s}px ${5 * s}px`,
              boxShadow: '0 10px 22px rgba(60,30,10,0.32)',
              borderLeft: `${7 * s}px solid var(--color-brand-700)`,
            }}
          />
          {/* resting page block */}
          <div
            style={{
              position: 'absolute',
              top: 5 * s,
              left: pageLeft,
              width: pageW,
              height: pageH,
              background: 'var(--color-surface)',
              borderRadius: `${2 * s}px ${6 * s}px ${6 * s}px ${2 * s}px`,
            }}
          />
          {/* flipping leaves */}
          <div className="bn-leaf" style={leaf} />
          <div className="bn-leaf" style={{ ...leaf, animationDelay: '0.28s' }} />
          <div className="bn-leaf" style={{ ...leaf, animationDelay: '0.56s' }} />
        </div>
      </div>
      {label && <p className="text-sm text-stone-500 italic">{label}</p>}
    </div>
  );
}
