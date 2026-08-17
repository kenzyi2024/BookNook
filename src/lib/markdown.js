/**
 * Light markdown → safe HTML. Handles headings (#, ##, ###), unordered and
 * ordered lists, horizontal rules (---), **bold**, *italic*, `code`, and
 * paragraphs — enough to render AI output as a clean document instead of raw
 * markdown with stray hashes and dashes.
 *
 * Wrap the output in an element with the `md-content` class (see index.css) to
 * pick up spacing + heading styles.
 */
export function renderMarkdown(text = '') {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let list = null; // 'ul' | 'ol'
  let para = [];

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br/>')}</p>`); para = []; } };

  for (const raw of lines) {
    const t = raw.trim();

    if (!t) { flushPara(); closeList(); continue; }

    // Horizontal rule (--- / *** / ___)
    if (/^([-*_])\1{2,}$/.test(t)) { flushPara(); closeList(); out.push('<hr/>'); continue; }

    // Heading (# … ######) — drop any leading "1." style numbering in the text
    const h = t.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushPara();
      closeList();
      const lvl = h[1].length;
      const tag = lvl <= 2 ? 'h3' : lvl === 3 ? 'h4' : 'h5';
      out.push(`<${tag}>${inline(h[2].replace(/^\d+[.)]\s*/, ''))}</${tag}>`);
      continue;
    }

    // Unordered list item
    let m = t.match(/^[-*•]\s+(.+)$/);
    if (m) {
      flushPara();
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }

    // Ordered list item
    m = t.match(/^\d+[.)]\s+(.+)$/);
    if (m) {
      flushPara();
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }

    // Plain paragraph line
    closeList();
    para.push(t);
  }

  flushPara();
  closeList();
  return out.join('');
}
