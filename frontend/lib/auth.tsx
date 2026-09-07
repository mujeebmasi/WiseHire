'use client';

// Holds the logged-in user so every page can read it without
// fetching /auth/me again. Wrapped around the app in app/layout.tsx.

import { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, api, getToken, setToken } from './api';
import type { User } from './types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    name: string,
    role: 'CANDIDATE' | 'EMPLOYER',
  ) => Promise<User>;
  logout: () => void;
  // Called after verifying an ID so the new badge shows immediately.
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, if there is a saved token, ask the API who it belongs to.
  // The token might be expired, so we cannot just trust that it is valid.
  useEffect(() => {
    // Returns null when there is no saved token, so there is a single
    // path through .then/.catch/.finally either way.
    function loadUser() {
      if (!getToken()) return Promise.resolve(null);
      return api.me();
    }

    loadUser()
      .then(setUser)
      .catch((error: unknown) => {
        // Only forget the token if the server actually rejected it. A network
        // blip or a restarting API would otherwise log the person out for no
        // good reason, losing their session on a temporary problem.
        if (error instanceof ApiError && error.status === 401) {
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const result = await api.login({ email, password });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function register(
    email: string,
    password: string,
    name: string,
    role: 'CANDIDATE' | 'EMPLOYER',
  ) {
    const result = await api.register({ email, password, name, role });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  async function refresh() {
    setUser(await api.me());
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
