import { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import LandingPage from './LandingPage';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, passwordStrength } from '../../lib/validation';

/**
 * Full signed-out screen: brand hero + a login / register card that talks to
 * our own /api/auth endpoints.
 */
export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const emailInvalid = isRegister && email.length > 0 && !isValidEmail(email);
  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && !isValidEmail(email)) return setError('Please enter a valid email address.');
    if (isRegister && password.length < 6) return setError('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email, password, username);
      } else {
        await login(email, password);
      }
      // On success the AuthProvider flips isAuthenticated and App swaps the view.
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const swap = (next) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row">
      {/* Hero */}
      <div className="lg:w-1/2 flex items-center justify-center py-14 lg:py-0 lg:min-h-screen">
        <LandingPage />
      </div>

      {/* Auth card */}
      <div className="lg:w-1/2 flex items-center justify-center px-4 pb-16 lg:pb-0 lg:min-h-screen">
        <div className="w-full max-w-md bg-surface border border-stone-200/70 rounded-3xl shadow-sm p-8">
          <h1 className="font-display font-bold text-3xl text-ink mb-1">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-stone-500 mb-6">
            {isRegister ? 'Start your reading journey.' : 'Sign in to your library.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <Field
                icon={<User size={18} />}
                type="text"
                placeholder="Display name (optional)"
                value={username}
                onChange={setUsername}
                autoComplete="nickname"
              />
            )}
            <div>
              <Field
                icon={<Mail size={18} />}
                type="email"
                placeholder="Email"
                value={email}
                onChange={setEmail}
                required
                autoComplete="email"
              />
              {emailInvalid && (
                <p className="text-xs text-status-dnf mt-1 ml-1">Please enter a valid email address.</p>
              )}
            </div>
            <div>
              <Field
                icon={<Lock size={18} />}
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              {isRegister && password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {strength.label}
                    {password.length < 6 ? ' — at least 6 characters' : ''}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-status-dnf bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-full shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => swap(isRegister ? 'login' : 'register')}
              className="text-brand-600 font-semibold hover:underline"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, hint, value, onChange, ...props }) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">{icon}</span>
        <input
          {...props}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent text-ink placeholder:text-stone-400"
        />
      </div>
      {hint && <p className="text-xs text-stone-400 mt-1 ml-1">{hint}</p>}
    </div>
  );
}
