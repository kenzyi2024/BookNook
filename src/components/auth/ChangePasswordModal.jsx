import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import { passwordStrength } from '../../lib/validation';

/**
 * Modal for changing the account password. Talks to /api/auth/change-password.
 */
export default function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(next);
  const mismatch = confirm.length > 0 && next !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 6) return setError('New password must be at least 6 characters.');
    if (next !== confirm) return setError('New passwords do not match.');

    setSubmitting(true);
    try {
      await changePassword(current, next);
      toast.success('Password updated.');
      onClose();
    } catch (err) {
      setError(err.message || 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Change password"
        className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-bold text-lg text-ink mb-1">Change password</h3>
        <p className="text-sm text-stone-500 mb-5">Enter your current password and a new one.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PwField placeholder="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
          <div>
            <PwField placeholder="New password" value={next} onChange={setNext} autoComplete="new-password" />
            {next && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-stone-400 mt-1">{strength.label}</p>
              </div>
            )}
          </div>
          <PwField placeholder="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {mismatch && <p className="text-xs text-status-dnf ml-1">Passwords don't match.</p>}

          {error && (
            <p className="text-sm text-status-dnf bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />} Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PwField({ value, onChange, ...props }) {
  return (
    <div className="relative">
      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
      <input
        {...props}
        type="password"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-ink placeholder:text-stone-400"
      />
    </div>
  );
}
