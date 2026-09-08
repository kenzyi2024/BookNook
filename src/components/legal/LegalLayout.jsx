import logoImg from '../../assets/logo.png';

/**
 * Shared chrome for the standalone public pages (Privacy, Terms, 404).
 * Uses plain <a> links so navigation works without a client router — Vercel
 * rewrites every path to index.html and the app reads window.location.pathname.
 */
export default function LegalLayout({ title, subtitle, children, maxWidth = 'max-w-3xl' }) {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-stone-200/70 bg-surface/70 backdrop-blur-sm">
        <div className={`${maxWidth} mx-auto w-full px-5 py-4 flex items-center justify-between`}>
          <a href="/" className="flex items-center gap-2" aria-label="BookNook home">
            <img src={logoImg} alt="BookNook" className="h-10 w-auto object-contain" />
          </a>
          <a
            href="/"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            &larr; Back to app
          </a>
        </div>
      </header>

      <main className={`${maxWidth} mx-auto w-full px-5 py-10 md:py-14 flex-1`}>
        {title && (
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-stone-500">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-stone-200/70 bg-surface/70">
        <div className={`${maxWidth} mx-auto w-full px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-stone-500`}>
          <span>&copy; {new Date().getFullYear()} BookNook</span>
          <nav className="flex items-center gap-4">
            <a href="/" className="hover:text-ink transition-colors">Home</a>
            <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
