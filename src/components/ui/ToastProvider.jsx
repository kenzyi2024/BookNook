import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

let idSeq = 0;

const ICONS = {
  success: <CheckCircle size={18} className="text-status-read" />,
  error: <XCircle size={18} className="text-status-dnf" />,
  info: <Info size={18} className="text-status-want" />,
};

/**
 * Lightweight toast system — replaces the old alert() calls with
 * non-blocking, on-brand notifications.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (m, d) => notify(m, 'success', d),
    error: (m, d) => notify(m, 'error', d),
    info: (m, d) => notify(m, 'info', d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-[min(92vw,22rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 bg-surface border border-black/5 shadow-lg shadow-black/5 rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-4 fade-in"
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
            <p className="text-sm text-ink/90 leading-snug flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-stone-400 hover:text-ink transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
