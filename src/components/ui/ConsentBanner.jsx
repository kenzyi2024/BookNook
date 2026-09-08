import { useState } from 'react';

const KEY = 'booknook_consent';

/**
 * Honest, one-time storage notice. BookNook uses no advertising or tracking
 * cookies — just localStorage (to keep you signed in / remember preferences)
 * and cookieless analytics. This banner discloses that and dismisses for good.
 */
export default function ConsentBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return true; // storage blocked — nothing to disclose, don't nag
    }
  });

  if (dismissed) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div
      role="dialog"
      aria-label="Storage notice"
      className="fixed bottom-0 inset-x-0 z-[80] p-3 sm:p-4 animate-in slide-in-from-bottom-4"
    >
      <div className="mx-auto max-w-2xl bg-surface border border-stone-200 rounded-2xl shadow-lg px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-stone-600 flex-1 leading-relaxed">
          BookNook uses your browser&rsquo;s local storage to keep you signed in and remember
          preferences, plus cookieless analytics. No tracking cookies.{' '}
          <a href="/privacy" className="text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap">
            Learn more
          </a>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
