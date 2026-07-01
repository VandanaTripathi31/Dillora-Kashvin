'use client';
import { createContext, useContext, useEffect, useState } from 'react';

import { CATEGORIES } from '@/data/catalog';
import { api } from '@/data/api';

// Categories are seeded with the static catalog so the first render is
// identical to before (no layout shift, works offline), then refreshed from
// the backend so the navbar/footer/search/home reflect admin changes live.
const CategoriesCtx = createContext({ categories: CATEGORIES, loading: false });

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState(CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .getCategories()
      .then((list) => {
        if (alive && Array.isArray(list) && list.length) setCategories(list);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CategoriesCtx.Provider value={{ categories, loading }}>
      {children}
    </CategoriesCtx.Provider>
  );
}

export const useCategories = () => useContext(CategoriesCtx);
