'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '@/services/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [ready, setReady] = useState(false); // finished restoring session?

  // Restore session on mount: if a token exists, verify it via /auth/me.
  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((res) => {
        if (!alive) return;
        if (res && res.admin) setAdmin(res.admin);
        else setToken(null);
      })
      .catch(() => setToken(null))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res && res.token) {
      setToken(res.token);
      setAdmin(res.admin || null);
      return { ok: true };
    }
    return { ok: false, error: (res && res.error) || 'Login failed.' };
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthCtx.Provider value={{ admin, ready, isAuthed: !!admin, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
