'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const CartCtx = createContext(null);
const LS = 'dilora_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(LS, JSON.stringify(items)); }, [items]);

  const add = (line) => {
    setItems(prev => {
      // merge identical lines (same product + same options)
      const key = (l) => `${l.productId}|${l.options}`;
      const idx = prev.findIndex(l => key(l) === key(line));
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + line.qty };
        return copy;
      }
      return [...prev, { ...line, lineId: Date.now() + Math.random() }];
    });
  };
  const remove = (lineId) => setItems(prev => prev.filter(l => l.lineId !== lineId));
  const setQty = (lineId, qty) => setItems(prev =>
    prev.map(l => l.lineId === lineId ? { ...l, qty: Math.max(1, qty) } : l));
  const clear = () => setItems([]);

  const count = items.reduce((n, l) => n + l.qty, 0);
  const subtotal = items.reduce((n, l) => n + l.price * l.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
