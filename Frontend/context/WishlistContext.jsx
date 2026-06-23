'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const WishCtx = createContext(null);
const LS = 'dilora_wishlist';

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(LS, JSON.stringify(ids)); }, [ids]);

  const has = (id) => ids.includes(id);
  const toggle = (id) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [id, ...prev]);
  const remove = (id) => setIds(prev => prev.filter(x => x !== id));

  return (
    <WishCtx.Provider value={{ ids, has, toggle, remove, count: ids.length }}>
      {children}
    </WishCtx.Provider>
  );
}

export const useWishlist = () => useContext(WishCtx);
