/**
 * Cookieless, privacy-friendly analytics (Vercel Web Analytics).
 *
 * Injected at runtime rather than hard-coded in index.html so Vite doesn't try
 * to bundle the Vercel-served script. Only loads in production, and skips
 * entirely if the visitor has Do Not Track enabled. Enable "Web Analytics" for
 * the project in the Vercel dashboard for data to be collected.
 */
export function initAnalytics() {
  if (!import.meta.env.PROD) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  window.va =
    window.va ||
    function (...args) {
      (window.vaq = window.vaq || []).push(args);
    };

  const s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
}
