/**
 * A string of hanging fairy lights draped across the top of a shelf.
 * The wire + bulbs are always present (a soft, unlit string in light mode); when
 * dark mode is on the bulbs light up warm + on-hue and gently twinkle. All of the
 * lit/glow behaviour lives in index.css under `.dark .fairy-bulb`.
 */
const BULBS = 26;

export default function FairyLights() {
  return (
    <div className="fairy-lights" aria-hidden="true">
      {Array.from({ length: BULBS }).map((_, i) => (
        <span key={i} className="fairy-node" style={{ '--i': i }}>
          <span className="fairy-cord" />
          <span className={`fairy-bulb ${i % 2 ? 'fairy-bulb--gold' : 'fairy-bulb--hue'}`} />
        </span>
      ))}
    </div>
  );
}
