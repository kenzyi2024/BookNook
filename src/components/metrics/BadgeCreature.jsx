import first from '../../assets/badges/first.png';
import bookworm from '../../assets/badges/bookworm.png';
import voracious from '../../assets/badges/voracious.png';
import marathon from '../../assets/badges/marathon.png';
import streak7 from '../../assets/badges/streak7.png';
import streak30 from '../../assets/badges/streak30.png';
import eclectic from '../../assets/badges/eclectic.png';
import critic from '../../assets/badges/critic.png';
import collector from '../../assets/badges/collector.png';
import chunky from '../../assets/badges/chunky.png';

/**
 * Hand-drawn badge creatures (the reader's own line-art doodles). They're used as
 * CSS masks so they take on `currentColor` — that means the parent decides the
 * color, and they re-tint to whatever theme is active (and lighten in dark mode)
 * instead of being locked to black.
 */
const ART = {
  first, bookworm, voracious, marathon, streak7,
  streak30, eclectic, critic, collector, chunky,
};

export default function BadgeCreature({ id, size = 60 }) {
  const src = ART[id];
  if (!src) return null;
  return (
    <span
      role="img"
      aria-hidden="true"
      style={{
        display: 'block',
        width: size,
        height: size,
        backgroundColor: 'currentColor',
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  );
}
