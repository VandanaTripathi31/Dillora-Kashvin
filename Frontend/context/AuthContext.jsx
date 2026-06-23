'use client';
import { createContext, useContext, useEffect, useState } from 'react';

// Demo auth: name + phone, stored locally. No real OTP yet — when OTP is
// added later, replace login() with the verified-OTP flow. The shape of
// `user` ({ name, phone }) stays the same so nothing downstream changes.
const AuthCtx = createContext(null);
const LS = 'dilora_user';
const LS_ADDR = 'dilora_addresses';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS)) || null; } catch { return null; }
  });
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_ADDR)) || []; } catch { return []; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(LS, JSON.stringify(user));
    else localStorage.removeItem(LS);
  }, [user]);

  useEffect(() => { localStorage.setItem(LS_ADDR, JSON.stringify(addresses)); }, [addresses]);

  const login = (name, phone) => setUser({ name: name.trim(), phone: phone.trim() });
  const logout = () => setUser(null);

  const saveAddress = (addr) => {
    setAddresses(prev => {
      // de-dupe by full string
      const key = JSON.stringify(addr);
      if (prev.some(a => JSON.stringify(a) === key)) return prev;
      return [{ ...addr, id: Date.now() }, ...prev].slice(0, 5);
    });
  };
  const removeAddress = (id) => setAddresses(prev => prev.filter(a => a.id !== id));

  return (
    <AuthCtx.Provider value={{ user, login, logout, addresses, saveAddress, removeAddress }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
