'use client';
import { useEffect, useState } from 'react';
import { User, Mail, Store, Percent } from 'lucide-react';

import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

export default function SettingsPage() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);

  useEffect(() => { api.getSettings().then(setSettings); }, []);

  const saveShowDiscounts = async (val) => {
    setSettings(s => ({ ...s, showDiscounts: val }));
    await api.updateSettings({ showDiscounts: val });
    notify(`Sale prices ${val ? 'shown' : 'hidden'} on the store`);
  };

  if (!settings) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Settings</h1>
        <p className="muted">Your account and store-wide preferences.</p>
      </header>

      {/* Account */}
      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <h3>Account</h3>
        <div className="formgrid" style={{ marginTop: 14 }}>
          <div className="field field--2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="stat__icon"><User className="w-[18px] h-[18px]" /></span>
            <div><strong>{admin?.name || 'Admin'}</strong><br /><small className="muted">Signed-in admin</small></div>
          </div>
          <div className="field field--2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="stat__icon"><Mail className="w-[18px] h-[18px]" /></span>
            <div><strong>{admin?.email || '—'}</strong><br /><small className="muted">Email</small></div>
          </div>
        </div>
      </section>

      {/* Store preferences */}
      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <div className="adm__panelhead">
          <h3><Percent className="w-[18px] h-[18px]" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />Show sale prices</h3>
          <label className="switch">
            <input type="checkbox" checked={!!settings.showDiscounts} onChange={e => saveShowDiscounts(e.target.checked)} />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint" style={{ marginTop: 0 }}>
          When <strong>off</strong> (default), every product shows a single clean price. Turn this
          <strong> on</strong> only during a sale — then the cut price and “% off” badges appear across the site.
          (Also available on the Offers page.)
        </p>
      </section>

      {/* Store link */}
      <section className="card adm__panel">
        <div className="adm__panelhead">
          <h3><Store className="w-[18px] h-[18px]" style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />Storefront</h3>
          <a className="btn btn-ghost" href={STORE_URL} target="_blank" rel="noreferrer">Open store ↗</a>
        </div>
        <p className="muted adm__hint" style={{ marginTop: 0 }}>The public customer website this dashboard manages.</p>
      </section>
    </div>
  );
}
