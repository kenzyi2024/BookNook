import { useTheme } from '../../context/ThemeContext';

// Precompute mote positions/timings once (module scope keeps render pure).
const MOTES = Array.from({ length: 18 }, () => ({
  left: Math.random() * 100,
  size: 1.5 + Math.random() * 2.5,
  delay: -Math.random() * 18,
  duration: 16 + Math.random() * 16,
  drift: (Math.random() * 2 - 1) * 40,
  opacity: 0.1 + Math.random() * 0.18,
}));

/**
 * Slow-drifting dust motes, like flecks catching candlelight. Dark mode only,
 * pointer-events-none, and collapsed by the global reduced-motion rule.
 */
export default function DustMotes() {
  const { dark } = useTheme();
  if (!dark) return null;

  return (
    <div className="fixed inset-0 z-[35] pointer-events-none overflow-hidden" aria-hidden="true">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="bn-mote"
          style={{
            left: `${m.left}%`,
            width: `${m.size}px`,
            height: `${m.size}px`,
            opacity: m.opacity,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            '--mote-drift': `${m.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
