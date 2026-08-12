import { useEffect, useState } from 'react';
import { renderMarkdown } from '../../lib/markdown';

/**
 * Reveals markdown text with a soft typewriter effect, as if it's being written
 * onto the page. Give it a changing `key` in the parent so each new result
 * animates from the start. Finishes in ~1.8s max regardless of length.
 */
export default function Typewriter({ text = '', className = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const total = text.length;
    if (!total) return;
    const duration = Math.min(1800, Math.max(500, total * 7));
    const start = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      setCount(Math.floor(p * total));
      if (p < 1) raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [text]);

  const shown = text.slice(0, count);
  const done = count >= text.length;

  return (
    <div className={className}>
      <span dangerouslySetInnerHTML={{ __html: renderMarkdown(shown) }} />
      {!done && <span className="bn-caret text-brand-500 font-bold">▍</span>}
    </div>
  );
}
