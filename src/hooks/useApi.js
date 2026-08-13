import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { localBooks } from '../lib/localBooks';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Authenticated API client. Attaches our JWT to every request and signs the user
 * out automatically if the server reports the session is no longer valid (401).
 */
export function useApi() {
  const { token, logout, guest } = useAuth();

  const request = useCallback(
    async (path, options = {}) => {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (res.status === 401) {
        logout();
        throw new Error('Your session expired. Please sign in again.');
      }

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          message = body.message || message;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(message);
      }

      return res.status === 204 ? null : res.json();
    },
    [token, logout]
  );

  return useMemo(() => {
    // Guest mode: everything is local; AI stays a signed-in perk.
    if (guest) {
      return {
        getBooks: async () => localBooks.all(),
        createBook: async (book) => localBooks.create(book),
        updateBook: async (id, updates) => localBooks.update(id, updates),
        deleteBook: async (id) => { localBooks.remove(id); return null; },
        generateAI: async () => { throw new Error('Create a free account to use AI features.'); },
      };
    }
    return {
      getBooks: () => request('/api/books'),
      createBook: (book) =>
        request('/api/books', { method: 'POST', body: JSON.stringify(book) }),
      updateBook: (id, updates) =>
        request(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
      deleteBook: (id) => request(`/api/books/${id}`, { method: 'DELETE' }),
      // AI text generation via the backend (keeps the provider key server-side).
      generateAI: (prompt) =>
        request('/api/ai', { method: 'POST', body: JSON.stringify({ prompt }) }).then(
          (r) => r.text
        ),
    };
  }, [request, guest]);
}
