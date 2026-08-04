export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_RE.test((email || '').trim());

/**
 * Lightweight password strength estimate. Returns { score 0-4, label, color }.
 * Not a security control (the server enforces the real minimum) — just UX feedback.
 */
export function passwordStrength(password = '') {
  if (!password) return { score: 0, label: '', color: 'bg-stone-200' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(4, score);

  const meta = [
    { label: 'Too short', color: 'bg-status-dnf' },
    { label: 'Weak', color: 'bg-status-dnf' },
    { label: 'Fair', color: 'bg-brand-400' },
    { label: 'Good', color: 'bg-brand-500' },
    { label: 'Strong', color: 'bg-status-read' },
  ];

  return { score, ...meta[score] };
}
