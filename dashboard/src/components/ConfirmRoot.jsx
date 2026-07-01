'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Promise-based confirm dialog. Usage:
//   if (await confirmDialog({ title, message, confirmLabel, danger })) { ... }
// or simply: await confirmDialog('Are you sure?')
let resolver = null;
export function confirmDialog(opts) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const detail = typeof opts === 'string' ? { message: opts } : (opts || {});
  return new Promise((resolve) => {
    resolver = resolve;
    window.dispatchEvent(new CustomEvent('dilora:confirm', { detail }));
  });
}

export default function ConfirmRoot() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const onAsk = (e) => setState(e.detail || {});
    window.addEventListener('dilora:confirm', onAsk);
    return () => window.removeEventListener('dilora:confirm', onAsk);
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') done(false);
      if (e.key === 'Enter') done(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  if (!state) return null;

  const done = (val) => { setState(null); if (resolver) { resolver(val); resolver = null; } };
  const danger = state.danger !== false; // default to danger styling

  return (
    <div className="modal" onClick={() => done(false)}>
      <div className="modal__box modal__box--sm confirmdlg" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <span className={`confirmdlg__icon ${danger ? 'confirmdlg__icon--danger' : ''}`}>
          <AlertTriangle className="w-6 h-6" />
        </span>
        <h3 className="confirmdlg__title">{state.title || 'Are you sure?'}</h3>
        {state.message && <p className="confirmdlg__msg">{state.message}</p>}
        <div className="confirmdlg__actions">
          <button className="btn btn-ghost" onClick={() => done(false)} autoFocus>
            {state.cancelLabel || 'Cancel'}
          </button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => done(true)}>
            {state.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
