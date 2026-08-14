/**
 * Hand-drawn badge creatures — one little character per achievement, all custom
 * SVG (no emojis, no stock icons). Colors reference the active theme via CSS
 * variables so the critters re-skin with the app; locked badges are greyed by the
 * parent with a `grayscale` filter.
 */
const INK = '#2A1D14';
const LEAF = '#6BA368';
const LEAF_D = '#4E7E4C';
const FIRE = '#E8913A';
const GLOW = '#F4C542';
const BLUE = '#3B6FB0';

export default function BadgeCreature({ id, size = 60 }) {
  const svg = (children) => (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-hidden="true">
      {children}
    </svg>
  );

  switch (id) {
    case 'first': // sprout rising from an open book
      return svg(
        <g>
          <path d="M10 40 L32 46 L54 40 L54 50 L32 56 L10 50 Z" fill="var(--color-brand-600)" />
          <path d="M32 26 C24 22 16 22 12 24 L12 44 C16 42 24 42 32 46 Z" fill="#fff" stroke="var(--color-brand-300)" strokeWidth="1.5" />
          <path d="M32 26 C40 22 48 22 52 24 L52 44 C48 42 40 42 32 46 Z" fill="#fff" stroke="var(--color-brand-300)" strokeWidth="1.5" />
          <path d="M32 45 L32 30" stroke={LEAF_D} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 33 C28 31 24 32 22 35 C26 37 30 36 32 34 Z" fill={LEAF} />
          <path d="M32 31 C36 28 40 28 43 30 C40 34 35 34 32 32 Z" fill={LEAF} />
        </g>
      );

    case 'bookworm': // worm poking through a book
      return svg(
        <g>
          <rect x="16" y="20" width="32" height="30" rx="3" fill="var(--color-brand-500)" />
          <rect x="16" y="20" width="6" height="30" fill="var(--color-brand-700)" />
          <path d="M30 50 C28 40 40 40 38 30 C37 25 43 23 47 26" fill="none" stroke={LEAF} strokeWidth="6" strokeLinecap="round" />
          <circle cx="47" cy="24" r="6.5" fill={LEAF} />
          <circle cx="45.5" cy="23" r="1.4" fill={INK} />
          <circle cx="49.5" cy="23" r="1.4" fill={INK} />
          <path d="M45 27 Q48 29 51 27" stroke={INK} strokeWidth="1" fill="none" />
        </g>
      );

    case 'voracious': // hungry little monster devouring a book
      return svg(
        <g>
          <rect x="38" y="24" width="15" height="20" rx="2" fill="var(--color-brand-200)" transform="rotate(14 45 34)" />
          <circle cx="28" cy="34" r="18" fill="var(--color-brand-500)" />
          <path d="M18 33 Q28 47 40 31 Z" fill="#7A1F1F" />
          <path d="M21 34 l3 4 3 -4 z M29 37 l3 4 3 -5 z" fill="#fff" />
          <circle cx="22" cy="25" r="3" fill="#fff" /><circle cx="22" cy="25" r="1.5" fill={INK} />
          <circle cx="33" cy="24" r="3" fill="#fff" /><circle cx="33" cy="24" r="1.5" fill={INK} />
        </g>
      );

    case 'marathon': // tortoise carrying a book as its shell (endurance)
      return svg(
        <g>
          <rect x="16" y="40" width="6" height="9" rx="3" fill="var(--color-brand-700)" />
          <rect x="40" y="40" width="6" height="9" rx="3" fill="var(--color-brand-700)" />
          <circle cx="50" cy="35" r="6" fill={LEAF} />
          <circle cx="52" cy="34" r="1.3" fill={INK} />
          <path d="M14 42 Q32 18 50 42 Z" fill={LEAF} />
          <path d="M18 42 Q32 23 46 42 Z" fill="var(--color-brand-500)" />
          <path d="M32 25 L32 42" stroke="var(--color-brand-200)" strokeWidth="2" />
          <path d="M25 31 L25 42 M39 31 L39 42" stroke="var(--color-brand-200)" strokeWidth="1.5" />
        </g>
      );

    case 'streak7': // flame sprite with a face
      return svg(
        <g>
          <path d="M32 10 C41 23 47 28 43 41 C41 51 23 51 21 41 C19 33 26 31 26 21 C29 26 30 23 32 10 Z" fill={FIRE} />
          <path d="M32 26 C36 32 39 37 36 43 C34 48 28 48 27 43 C26 39 30 37 30 30 C31 33 31 31 32 26 Z" fill={GLOW} />
          <circle cx="29" cy="39" r="1.7" fill={INK} /><circle cx="35" cy="39" r="1.7" fill={INK} />
          <path d="M30 43 Q32 45 34 43" stroke={INK} strokeWidth="1" fill="none" />
        </g>
      );

    case 'streak30': // devoted candle keeping its flame
      return svg(
        <g>
          <path d="M32 6 C38 15 39 20 36 24 C34 27 30 27 28 24 C25 20 27 15 32 6 Z" fill={FIRE} />
          <path d="M32 13 C35 18 35 21 33 23 C31 25 30 22 30 20 C31 18 31 16 32 13 Z" fill={GLOW} />
          <rect x="31" y="24" width="2" height="6" fill={INK} />
          <rect x="23" y="30" width="18" height="26" rx="3" fill="var(--color-brand-300)" />
          <rect x="23" y="30" width="18" height="6" rx="3" fill="var(--color-brand-200)" />
          <circle cx="29" cy="43" r="1.5" fill={INK} /><circle cx="35" cy="43" r="1.5" fill={INK} />
          <path d="M30 47 Q32 49 34 47" stroke={INK} strokeWidth="1" fill="none" />
        </g>
      );

    case 'eclectic': // chameleon with many-colored spots (variety)
      return svg(
        <g>
          <path d="M18 40 C9 40 9 29 16 29 C21 29 21 34 18 34" fill="none" stroke="var(--color-brand-500)" strokeWidth="5" strokeLinecap="round" />
          <path d="M26 42 L24 50 M36 42 L38 50" stroke="var(--color-brand-700)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M17 39 C24 26 40 26 47 34 C42 41 25 43 17 39 Z" fill="var(--color-brand-500)" />
          <path d="M44 29 C53 27 55 34 50 38 C47 40 44 38 44 34 Z" fill="var(--color-brand-600)" />
          <circle cx="49" cy="33" r="2.6" fill="#fff" /><circle cx="49" cy="33" r="1.2" fill={INK} />
          <circle cx="27" cy="33" r="2.2" fill={LEAF} />
          <circle cx="34" cy="35" r="2.2" fill={GLOW} />
          <circle cx="40" cy="33" r="2.2" fill={BLUE} />
        </g>
      );

    case 'critic': // wise owl in glasses, holding a rating star
      return svg(
        <g>
          <path d="M18 23 L23 30 L15 30 Z" fill="var(--color-brand-600)" />
          <path d="M42 23 L45 30 L37 30 Z" fill="var(--color-brand-600)" />
          <ellipse cx="30" cy="37" rx="14" ry="16" fill="var(--color-brand-500)" />
          <ellipse cx="30" cy="41" rx="8" ry="10" fill="var(--color-brand-200)" />
          <circle cx="24" cy="33" r="5" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <circle cx="36" cy="33" r="5" fill="#fff" stroke={INK} strokeWidth="1.5" />
          <circle cx="24" cy="33" r="1.8" fill={INK} /><circle cx="36" cy="33" r="1.8" fill={INK} />
          <path d="M30 36 l-2 4 4 0 z" fill={FIRE} />
          <path d="M48 15 l1.4 3 3.2 .3 -2.4 2.1 .7 3.1 -2.9 -1.6 -2.9 1.6 .7 -3.1 -2.4 -2.1 3.2 -.3 z" fill={GLOW} />
        </g>
      );

    case 'collector': // little magpie gathering shiny things
      return svg(
        <g>
          <path d="M14 47 H40" stroke="var(--color-brand-700)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M27 45 C20 45 18 34 27 30 C35 26 43 31 43 37 C43 43 34 47 27 45 Z" fill="var(--color-brand-500)" />
          <path d="M31 34 C35 34 39 36 39 41 C35 41 31 39 31 34 Z" fill="var(--color-brand-700)" />
          <circle cx="24" cy="33" r="1.7" fill="#fff" /><circle cx="24" cy="33" r="0.9" fill={INK} />
          <path d="M20 34 l-5 1 5 2 z" fill={FIRE} />
          <path d="M28 45 L28 49 M34 45 L34 49" stroke="var(--color-brand-700)" strokeWidth="1.5" />
          <circle cx="47" cy="23" r="2.2" fill={GLOW} />
          <circle cx="53" cy="29" r="1.6" fill={GLOW} />
        </g>
      );

    case 'chunky': // hefty book pulling doorstop duty
      return svg(
        <g>
          <path d="M14 51 L30 51 L30 46 Z" fill="var(--color-brand-700)" />
          <rect x="20" y="12" width="24" height="36" rx="3" fill="var(--color-brand-500)" />
          <rect x="41" y="14" width="4" height="32" fill="#fff" />
          <rect x="20" y="12" width="24" height="36" rx="3" fill="none" stroke="var(--color-brand-700)" strokeWidth="2" />
          <path d="M24 20 H39 M24 40 H39" stroke="var(--color-brand-200)" strokeWidth="2" />
          <circle cx="29" cy="29" r="1.7" fill={INK} /><circle cx="35" cy="29" r="1.7" fill={INK} />
          <path d="M29 34 Q32 37 35 34" stroke={INK} strokeWidth="1.2" fill="none" />
        </g>
      );

    default:
      return null;
  }
}
