/**
 * Export a reader's annotations (quotes + their notes/tags) to Markdown.
 */

/** Build a Markdown string from the given books' annotations. */
export function annotationsToMarkdown(books, { title = 'BookNook Highlights' } = {}) {
  const lines = [`# ${title}`, ''];
  let any = false;

  books.forEach((book) => {
    const quotes = (book.quotes || []).filter((q) => q && q.text);
    if (!quotes.length) return;
    any = true;
    lines.push(`## ${book.title}${book.author ? ` — ${book.author}` : ''}`, '');
    quotes.forEach((q) => {
      q.text.split('\n').forEach((ln) => lines.push(`> ${ln}`));
      const meta = [];
      if (q.page) meta.push(`p.${q.page}`);
      (q.tags || []).forEach((t) => meta.push(`#${t}`));
      if (meta.length) lines.push(`> — *${meta.join(' · ')}*`);
      if (q.note) lines.push('', q.note);
      lines.push('');
    });
  });

  if (!any) lines.push('_No highlights saved yet._', '');
  return lines.join('\n');
}

/** Trigger a browser download of a Markdown file. */
export function downloadMarkdown(md, filename = 'booknook-highlights.md') {
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
