'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/data/api';

const SettingsContext = createContext({ settings: null, showDiscounts: false, refresh: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const load = () => { api.getSettings().then(setSettings); };
  useEffect(() => { load(); }, []);

  const value = {
    settings,
    showDiscounts: !!(settings && settings.showDiscounts),
    refresh: load,
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
