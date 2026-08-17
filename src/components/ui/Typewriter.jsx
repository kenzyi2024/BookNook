import { useEffect, useState } from 'react';
import { renderMarkdown } from '../../lib/markdown';

const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveals markdown text with a soft typewriter effect, as if it's being written
 * onto the page. Give it a changing `key` in the parent so each new result
 * animates from the start. Finishes in ~1.8s max regardless of length. Users who
 * prefer reduced motion get the full text immediately.
 */
export default function Typewriter({ text = '', className = '' }) {
  const [count, setCount] = useState(0);
  const [reduced] = useState(prefersReduced);

  useEffect(() => {
    if (reduced) return;
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
  }, [text, reduced]);

  const shown = reduced ? text : text.slice(0, count);
  const done = reduced || count >= text.length;

  return (
    <div className={className}>
      <div className="md-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(shown) }} />
      {!done && <span className="bn-caret text-brand-500 font-bold">▍</span>}
    </div>
  );
}
