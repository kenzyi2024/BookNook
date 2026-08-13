/**
 * Client-side shelf positions for decor gadgets, keyed by gadget id. This makes
 * moving a gadget feel instant and work even before the backend `position`
 * field is deployed (the move is also persisted to the DB best-effort, so it
 * syncs across devices once the backend supports it).
 */
const KEY = 'booknook.gadgetPos.v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const map = load();

export function getGadgetPos(id) {
  return id && id in map ? map[id] : undefined;
}

export function setGadgetPos(id, pos) {
  if (!id) return;
  map[id] = pos;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}
