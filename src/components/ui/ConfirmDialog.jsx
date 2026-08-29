import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Accessible confirmation modal — replaces window.confirm().
 * Rendered only when `open` is true.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Escape-to-close, focus the (safe) Cancel button on open, restore focus after.
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previouslyFocused?.focus?.(); };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
              danger ? 'bg-red-50 text-status-dnf' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <AlertTriangle size={22} />
          </span>
          <div className="flex-1">
            <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
            {message && <p className="text-sm text-stone-500 mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full font-semibold text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-full font-semibold text-sm text-white transition-colors ${
              danger ? 'bg-status-dnf hover:brightness-95' : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
