/* eslint-disable react-refresh/only-export-components -- entry file, not HMR-refreshed */
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ConsentBanner from './components/ui/ConsentBanner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { initAnalytics } from './lib/analytics';

// Public pages are only needed on their own routes — load them on demand so
// they stay out of the main app bundle.
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));
const NotFound = lazy(() => import('./components/legal/NotFound'));

/**
 * Minimal path routing. Public pages (Privacy, Terms) and the 404 fallback use
 * real URLs; Vercel rewrites every path to index.html (see vercel.json) and we
 * pick the view here. Navigation between these uses plain <a> links (full page
 * loads), which keeps things simple and avoids a router dependency.
 */
function pickRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return (<><App /><ConsentBanner /></>);
  const page =
    path === '/privacy' ? <PrivacyPolicy /> : path === '/terms' ? <TermsOfService /> : <NotFound />;
  return <Suspense fallback={<div className="min-h-screen bg-paper" />}>{page}</Suspense>;
}

initAnalytics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>{pickRoute()}</ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
