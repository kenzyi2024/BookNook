/**
 * Turn a pasted Spotify or YouTube link into an embeddable iframe URL.
 * Returns { url, kind } or null if it can't be parsed.
 */
export function toEmbedUrl(raw = '') {
  const link = raw.trim();
  if (!link) return null;

  // Spotify: playlist / album / track
  const sp = link.match(/open\.spotify\.com\/(playlist|album|track|episode|show)\/([A-Za-z0-9]+)/);
  if (sp) {
    return { kind: 'spotify', url: `https://open.spotify.com/embed/${sp[1]}/${sp[2]}` };
  }

  // YouTube playlist
  const list = link.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (list) {
    return { kind: 'youtube', url: `https://www.youtube.com/embed/videoseries?list=${list[1]}` };
  }

  // YouTube single video (watch?v=, youtu.be/, /embed/)
  const yt =
    link.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    link.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||
    link.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (yt) {
    return { kind: 'youtube', url: `https://www.youtube.com/embed/${yt[1]}` };
  }

  return null;
}
