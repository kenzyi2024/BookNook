import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const TOKEN_KEY = 'booknook_token';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

/**
 * App-wide auth state. Holds the JWT (persisted in localStorage) and the current
 * user. On load, if a token exists, it hydrates the user from /api/auth/me and
 * signs out automatically if the token is stale.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Hydrate the user whenever the token changes. (Clearing on logout is handled
  // by logout() itself, so there's nothing to do here when there's no token.)
  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const me = await res.json();
        if (active) setUser(me);
      } catch {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const authenticate = useCallback(async (path, payload) => {
    const res = await fetch(`${API_URL}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    (email, password) => authenticate('login', { email, password }),
    [authenticate]
  );
  const register = useCallback(
    (email, password, username) => authenticate('register', { email, password, username }),
    [authenticate]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not change password.');
      return data;
    },
    [token]
  );

  const value = {
    token,
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
