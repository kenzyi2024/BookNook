import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_THEME } from '../lib/themes';
import { localBooks, localProfile, hasGuestBooks, clearGuestData } from '../lib/localBooks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const TOKEN_KEY = 'booknook_token';
const GUEST_KEY = 'booknook_guest';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

const makeGuestUser = () => {
  const p = localProfile.get() || {};
  return {
    _id: 'guest',
    name: p.name || 'Guest',
    username: p.name || 'Guest',
    email: '',
    theme: p.theme || DEFAULT_THEME,
    shelfDecor: p.shelfDecor || [],
    profilePicture: p.profilePicture || '',
    isGuest: true,
  };
};

/**
 * App-wide auth state. Supports three modes: signed-out, a real account (JWT +
 * backend), and a device-local "guest" mode whose data lives in localStorage and
 * can be migrated into a real account later.
 */
export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const guestStored = !storedToken && localStorage.getItem(GUEST_KEY) === '1';
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(guestStored ? makeGuestUser() : null);
  const [guest, setGuest] = useState(guestStored);
  const [converting, setConverting] = useState(false); // guest → account flow
  const [loading, setLoading] = useState(Boolean(storedToken));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUEST_KEY); // keep local books so "continue as guest" can restore them
    setToken(null);
    setUser(null);
    setGuest(false);
    setConverting(false);
  }, []);

  // Hydrate a real user whenever the token changes.
  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
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

  const loginAsGuest = useCallback(() => {
    localStorage.setItem(GUEST_KEY, '1');
    const u = makeGuestUser();
    localProfile.set({ theme: u.theme, shelfDecor: u.shelfDecor, name: u.name, profilePicture: u.profilePicture });
    setGuest(true);
    setUser(u);
    setLoading(false);
  }, []);

  const startAccountSave = useCallback(() => setConverting(true), []);
  const cancelAccountSave = useCallback(() => setConverting(false), []);

  // Upload any guest books + profile into a freshly-authenticated account.
  const migrateGuest = useCallback(async (newToken) => {
    const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${newToken}` };
    const gbooks = localBooks.all();
    if (gbooks.length) {
      await Promise.allSettled(
        gbooks.map((b) => {
          const fields = { ...b };
          delete fields._id;
          delete fields.createdAt;
          delete fields.updatedAt;
          return fetch(`${API_URL}/api/books`, { method: 'POST', headers: auth, body: JSON.stringify(fields) });
        })
      );
    }
    let mergedUser = null;
    const gp = localProfile.get();
    if (gp && (gp.theme || (gp.shelfDecor && gp.shelfDecor.length) || gp.name || gp.profilePicture)) {
      try {
        const r = await fetch(`${API_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: auth,
          body: JSON.stringify({ theme: gp.theme, shelfDecor: gp.shelfDecor, name: gp.name, profilePicture: gp.profilePicture }),
        });
        if (r.ok) mergedUser = await r.json();
      } catch {
        /* ignore */
      }
    }
    clearGuestData();
    localStorage.removeItem(GUEST_KEY);
    setGuest(false);
    setConverting(false);
    return mergedUser;
  }, []);

  const authenticate = useCallback(
    async (path, payload) => {
      const res = await fetch(`${API_URL}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      let finalUser = data.user;
      if (hasGuestBooks() || localStorage.getItem(GUEST_KEY) === '1') {
        const merged = await migrateGuest(data.token);
        if (merged) finalUser = merged;
      }
      setUser(finalUser);
      setLoading(false);
      return finalUser;
    },
    [migrateGuest]
  );

  const login = useCallback((email, password) => authenticate('login', { email, password }), [authenticate]);
  const register = useCallback(
    (email, password, username) => authenticate('register', { email, password, username }),
    [authenticate]
  );
  const googleLogin = useCallback((credential) => authenticate('google', { credential }), [authenticate]);

  const updateProfile = useCallback(
    async (updates) => {
      if (guest) {
        setUser((prev) => {
          const next = { ...(prev || {}), ...updates };
          localProfile.set({ theme: next.theme, shelfDecor: next.shelfDecor, name: next.name, profilePicture: next.profilePicture });
          return next;
        });
        return;
      }
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save profile.');
      setUser(data);
      return data;
    },
    [token, guest]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not change password.');
      return data;
    },
    [token]
  );

  const value = useMemo(() => ({
    token,
    user,
    loading,
    guest,
    isGuest: guest,
    converting,
    isAuthenticated: Boolean(user),
    login,
    register,
    googleLogin,
    loginAsGuest,
    startAccountSave,
    cancelAccountSave,
    updateProfile,
    logout,
    changePassword,
  }), [token, user, loading, guest, converting, login, register, googleLogin, loginAsGuest, startAccountSave, cancelAccountSave, updateProfile, logout, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
