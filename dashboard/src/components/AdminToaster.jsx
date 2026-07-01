'use client';
import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

// Tiny event-bus toast for the admin panel. Call notify('Saved') from anywhere.
const EV = 'dilora:admin-toast';
export function notify(message, type = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EV, { detail: { message, type } }));
}

const ICONS = { success: Check, error: AlertCircle, info: Info };

export default function AdminToaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let id = 0;
    const onToast = (e) => {
      const t = { id: ++id, ...e.detail };
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 2600);
    };
    window.addEventListener(EV, onToast);
    return () => window.removeEventListener(EV, onToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="admtoast__wrap">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`admtoast admtoast--${t.type}`} role="status">
            <span className="admtoast__icon"><Icon className="w-[18px] h-[18px]" /></span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
