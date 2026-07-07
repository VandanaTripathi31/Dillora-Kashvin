'use client';
import { createContext, useContext, useEffect, useState } from 'react';

// Demo auth: name + phone, stored locally. No real OTP yet — when OTP is
// added later, replace login() with the verified-OTP flow. The shape of
// `user` ({ name, phone }) stays the same so nothing downstream changes.
const AuthCtx = createContext(null);
const LS = 'dilora_user';
const LS_ADDR = 'dilora_addresses';
const LS_DEF = 'dilora_default_addr';

// The fields that make an address "the same" (used for de-duping saves).
const addrKey = (a) => JSON.stringify({
  name: a?.name || '', phone: a?.phone || '', address: a?.address || '',
  city: a?.city || '', pincode: a?.pincode || '',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS)) || null; } catch { return null; }
  });
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_ADDR)) || []; } catch { return []; }
  });
  const [defaultAddressId, setDefaultAddressId] = useState(() => {
    try { const v = localStorage.getItem(LS_DEF); return v ? JSON.parse(v) : null; } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(LS, JSON.stringify(user));
    else localStorage.removeItem(LS);
  }, [user]);

  useEffect(() => { localStorage.setItem(LS_ADDR, JSON.stringify(addresses)); }, [addresses]);
  useEffect(() => {
    if (defaultAddressId != null) localStorage.setItem(LS_DEF, JSON.stringify(defaultAddressId));
    else localStorage.removeItem(LS_DEF);
  }, [defaultAddressId]);

  const login = (name, phone) => setUser({ name: name.trim(), phone: phone.trim() });
  const logout = () => setUser(null);

  // Save a new address (deduped). Returns the id of the saved/existing entry and
  // makes it the default if it's the first one saved.
  const saveAddress = (addr) => {
    const key = addrKey(addr);
    let savedId = null;
    setAddresses(prev => {
      const existing = prev.find(a => addrKey(a) === key);
      if (existing) { savedId = existing.id; return prev; }
      savedId = Date.now();
      const next = [{ ...addr, id: savedId }, ...prev].slice(0, 5);
      return next;
    });
    // First address becomes the default.
    setDefaultAddressId(prev => (prev == null ? savedId : prev));
    return savedId;
  };

  const updateAddress = (id, addr) => {
    setAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...addr, id } : a)));
  };

  const removeAddress = (id) => {
    setAddresses(prev => {
      const next = prev.filter(a => a.id !== id);
      // If we removed the default, promote the first remaining address.
      setDefaultAddressId(cur => (cur === id ? (next[0]?.id ?? null) : cur));
      return next;
    });
  };

  const setDefaultAddress = (id) => setDefaultAddressId(id);

  return (
    <AuthCtx.Provider value={{
      user, login, logout,
      addresses, defaultAddressId,
      saveAddress, updateAddress, removeAddress, setDefaultAddress,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
