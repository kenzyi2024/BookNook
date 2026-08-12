/**
 * On-brand shelf accessories, drawn as SVG (no emoji). Pots pick up the theme's
 * brand color via CSS variables; foliage/wood/brass use fixed warm tones that
 * read well on both the light and candlelit shelves.
 */

const GREEN = '#5B8C5A';
const GREEN2 = '#6FA36A';
const WOOD = '#B08D57';
const WOOD_DK = '#8A6A3A';
const CREAM = '#F1E6D0';
const FLAME = '#F0A94B';
const INK = '#3A2E26';

function Succulent(props) {
  return (
    <svg viewBox="0 0 48 56" fill="none" {...props}>
      <g fill={GREEN}>
        <path d="M24 34C20 24 16 22 18 13c6 5 7 12 6 21Z" />
        <path d="M24 34c4-10 8-12 6-21-6 5-7 12-6 21Z" />
        <path d="M24 35c-6-4-12-3-13-9 6-1 11 3 13 9Z" />
        <path d="M24 35c6-4 12-3 13-9-6-1-11 3-13 9Z" />
      </g>
      <path d="M24 35C24 26 24 21 24 12c2 8 2 16 0 23Z" fill={GREEN2} />
      <path d="M14 34h20l-3 17H17z" fill="var(--color-brand-500)" />
      <rect x="12" y="31" width="24" height="6" rx="2" fill="var(--color-brand-600)" />
    </svg>
  );
}

function LeafyPlant(props) {
  return (
    <svg viewBox="0 0 48 60" fill="none" {...props}>
      <g stroke={GREEN} strokeWidth="2.5" strokeLinecap="round">
        <path d="M24 42C24 31 22 20 18 11" />
        <path d="M24 42C24 31 26 20 30 12" />
        <path d="M24 42C22 34 16 27 10 23" />
        <path d="M24 42C26 34 32 27 38 23" />
        <path d="M24 42V22" />
      </g>
      <g fill={GREEN2}>
        <ellipse cx="18" cy="12" rx="3.5" ry="6" transform="rotate(-18 18 12)" />
        <ellipse cx="30" cy="13" rx="3.5" ry="6" transform="rotate(18 30 13)" />
        <ellipse cx="24" cy="9" rx="3.5" ry="6.5" />
      </g>
      <path d="M15 40h18l-3 18H18z" fill="var(--color-brand-500)" />
      <rect x="13" y="37" width="22" height="6" rx="2" fill="var(--color-brand-600)" />
    </svg>
  );
}

function Flowers(props) {
  return (
    <svg viewBox="0 0 48 60" fill="none" {...props}>
      <g stroke={GREEN} strokeWidth="2" strokeLinecap="round">
        <path d="M24 42V15" />
        <path d="M24 30 16 21" />
        <path d="M24 27 33 18" />
      </g>
      <circle cx="24" cy="12" r="5.5" fill="#C96B6B" />
      <circle cx="15" cy="18" r="4.5" fill="#E0A13A" />
      <circle cx="33" cy="16" r="4.5" fill="#B77CB6" />
      <circle cx="24" cy="12" r="2" fill={CREAM} />
      <path d="M16 40q-2 9 2 16h12q4-7 2-16z" fill="var(--color-brand-400)" />
      <rect x="15" y="37" width="18" height="5" rx="2" fill="var(--color-brand-500)" />
    </svg>
  );
}

function Candle(props) {
  return (
    <svg viewBox="0 0 40 60" fill="none" {...props}>
      <path d="M20 6c4 6 3 11 0 13-3-2-4-8 0-13Z" fill={FLAME} />
      <path d="M20 11c2 3 1.5 6 0 7-1.5-1-2-4 0-7Z" fill="#F6D49B" />
      <rect x="15" y="19" width="10" height="24" rx="2" fill={CREAM} />
      <path d="M13 41h14l-2 11H15z" fill="#C9A24B" />
      <ellipse cx="20" cy="53" rx="12" ry="4" fill={WOOD} />
    </svg>
  );
}

function Bookends(props) {
  return (
    <svg viewBox="0 0 58 54" fill="none" {...props}>
      <path d="M6 18h5v32H6z" fill={WOOD} />
      <path d="M47 12h5v38h-5z" fill={WOOD} />
      <path d="M6 46h46v4H6z" fill={WOOD_DK} />
      <rect x="13" y="18" width="7" height="30" rx="1" fill="#8C5A3B" />
      <rect x="20" y="15" width="7" height="33" rx="1" fill="#3E6B57" />
      <rect x="27" y="17" width="7" height="31" rx="1" fill="#7C4A52" transform="rotate(3 30 32)" />
      <rect x="35" y="15" width="7" height="33" rx="1" fill="#B5843C" transform="rotate(6 38 31)" />
    </svg>
  );
}

function DeskClock(props) {
  return (
    <svg viewBox="0 0 48 52" fill="none" {...props}>
      <rect x="8" y="8" width="32" height="34" rx="9" fill={WOOD} />
      <rect x="13" y="42" width="6" height="6" rx="1" fill={WOOD_DK} />
      <rect x="29" y="42" width="6" height="6" rx="1" fill={WOOD_DK} />
      <circle cx="24" cy="25" r="12" fill={CREAM} />
      <circle cx="24" cy="25" r="12" stroke={WOOD_DK} strokeWidth="1.5" />
      <path d="M24 25V17" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M24 25l6 3" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="25" r="1.6" fill={INK} />
    </svg>
  );
}

// Catalog. `id` is stored on the gadget; keep ids stable.
// eslint-disable-next-line react-refresh/only-export-components
export const ACCESSORIES = [
  { id: 'succulent', label: 'Succulent', Art: Succulent },
  { id: 'plant', label: 'Leafy plant', Art: LeafyPlant },
  { id: 'flowers', label: 'Flowers', Art: Flowers },
  { id: 'candle', label: 'Candle', Art: Candle },
  { id: 'bookends', label: 'Bookends', Art: Bookends },
  { id: 'clock', label: 'Clock', Art: DeskClock },
];

/** Render the art for a stored variant (falls back to the first accessory). */
export function GadgetArt({ variant, className, style }) {
  const item = ACCESSORIES.find((a) => a.id === variant) || ACCESSORIES[0];
  const Art = item.Art;
  return <Art className={className} style={style} />;
}
