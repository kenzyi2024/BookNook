import { BookOpen } from 'lucide-react';
import LegalLayout from './LegalLayout';

/**
 * Branded 404. Rendered whenever the path isn't a known route. Vercel rewrites
 * all paths to index.html, so this handles unknown deep links in the SPA.
 */
export default function NotFound() {
  return (
    <LegalLayout>
      <div className="flex flex-col items-center text-center py-16 md:py-24">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-6">
          <BookOpen size={30} className="text-brand-500" />
        </div>
        <p className="font-display font-bold text-6xl md:text-7xl text-brand-500">404</p>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-ink mt-4">
          This page slipped off the shelf
        </h1>
        <p className="text-stone-500 mt-3 max-w-sm">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Let&rsquo;s get you
          back to your reading nook.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors"
        >
          Back to BookNook
        </a>
      </div>
    </LegalLayout>
  );
}
