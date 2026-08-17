/**
 * Helpers for the per-book character & relationship map.
 *
 * A book carries:
 *   characters:    [{ id, name, role, note, x, y }]   (x,y in a 1000×600 canvas)
 *   relationships: [{ id, from, to, label }]           (from/to are character ids)
 */

let counter = 0;
export function makeId(prefix = 'c') {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

export const CANVAS_W = 1000;
export const CANVAS_H = 600;

/** Default position for the i-th of n nodes — arranged evenly on a circle. */
export function circlePos(i, n) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const r = Math.min(CANVAS_W, CANVAS_H) * 0.36;
  const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** A character's position: its stored x/y, or a circle slot as a fallback. */
export function posOf(char, index, total) {
  if (typeof char.x === 'number' && typeof char.y === 'number') return { x: char.x, y: char.y };
  return circlePos(index, total);
}

/** Initials for a node badge (up to two letters). */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Parse an AI "cast list" in the labeled-line format:
 *
 *   Name: Achilles
 *   Role: Greek warrior
 *   Connections: Patroclus (companion), Thetis (mother)
 *   ---
 *
 * Returns { characters:[{name,role,note}], edges:[{fromName,toName,label}] }.
 */
export function parseCast(text = '') {
  const blocks = text
    .split(/\n?-{3,}\n?|\n(?=\s*Name\s*:)/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const characters = [];
  const edges = [];

  blocks.forEach((block) => {
    const grab = (label) => {
      const m = block.match(new RegExp(`${label}\\s*:\\s*(.+)`, 'i'));
      return m ? m[1].replace(/\*+/g, '').trim() : '';
    };
    const name = grab('Name').replace(/^[-*•\d.)\s]+/, '').trim();
    if (!name) return;
    const role = grab('Role');
    const note = grab('Note');
    characters.push({ name, role, note });

    const conn = grab('Connections') || grab('Relationships');
    if (conn && !/^none$/i.test(conn)) {
      conn.split(/[,;]/).forEach((part) => {
        const m = part.trim().match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (m) edges.push({ fromName: name, toName: m[1].trim(), label: m[2].trim() });
        else if (part.trim()) edges.push({ fromName: name, toName: part.trim(), label: '' });
      });
    }
  });

  return { characters: characters.slice(0, 12), edges };
}
