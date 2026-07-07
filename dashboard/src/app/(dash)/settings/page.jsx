'use client';
import { useEffect, useState } from 'react';
import { User, Mail, Store, Percent, MessageCircle, Truck } from 'lucide-react';

import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000';

const DEFAULT_DELIVERY = {
  estimatedDaysMin: 3, estimatedDaysMax: 7, returnPolicy: '', rateCard: '',
  qualityInfo: '', packagingInfo: '', paymentInfo: '',
};

export default function SettingsPage() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [waInput, setWaInput] = useState('');
  const [savingWa, setSavingWa] = useState(false);
  const [igInput, setIgInput] = useState('');
  const [savingIg, setSavingIg] = useState(false);
  const [delivery, setDelivery] = useState(DEFAULT_DELIVERY);
  const [savingDel, setSavingDel] = useState(false);

  useEffect(() => {
    api.getSettings().then(s => {
      setSettings(s);
      setWaInput(s?.whatsappNumber || '');
      setIgInput(s?.instagramUrl || '');
      setDelivery({ ...DEFAULT_DELIVERY, ...(s?.delivery || {}) });
    });
  }, []);

  const saveInstagram = async () => {
    setSavingIg(true);
    const res = await api.updateSettings({ instagramUrl: igInput });
    setSavingIg(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    setSettings(res);
    setIgInput(res.instagramUrl || '');
    notify('Instagram link saved');
  };

  const setD = (k) => (e) => setDelivery(d => ({ ...d, [k]: e.target.value }));
  const saveDelivery = async () => {
    setSavingDel(true);
    const payload = {
      ...delivery,
      estimatedDaysMin: Number(delivery.estimatedDaysMin) || 0,
      estimatedDaysMax: Number(delivery.estimatedDaysMax) || 0,
    };
    const res = await api.updateSettings({ delivery: payload });
    setSavingDel(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    setSettings(res);
    setDelivery({ ...DEFAULT_DELIVERY, ...(res.delivery || {}) });
    notify('Delivery & policy info saved');
  };

  const saveShowDiscounts = async (val) => {
    setSettings(s => ({ ...s, showDiscounts: val }));
    await api.updateSettings({ showDiscounts: val });
    notify(`Sale prices ${val ? 'shown' : 'hidden'} on the store`);
  };

  const saveWhatsApp = async () => {
    setSavingWa(true);
    const res = await api.updateSettings({ whatsappNumber: waInput });
    setSavingWa(false);
    if (res?.error) { notify(res.error, 'error'); return; }
    setSettings(res);
    setWaInput(res.whatsappNumber || '');
    notify('WhatsApp number saved');
  };

  if (!settings) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Settings</h1>
        <p className="muted">Your account and store-wide preferences.</p>
      </header>

      {/* Account */}
      <section className="card adm__panel mb-5">
        <h3>Account</h3>
        <div className="mt-3.5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2.5">
            <span className="stat__icon"><User className="h-[18px] w-[18px]" /></span>
            <div><strong>{admin?.name || 'Admin'}</strong><br /><small className="muted">Signed-in admin</small></div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="stat__icon"><Mail className="h-[18px] w-[18px]" /></span>
            <div><strong>{admin?.email || '—'}</strong><br /><small className="muted">Email</small></div>
          </div>
        </div>
      </section>

      {/* Store preferences */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead">
          <h3><Percent className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />Show sale prices</h3>
          <label className="switch">
            <input type="checkbox" checked={!!settings.showDiscounts} onChange={e => saveShowDiscounts(e.target.checked)} />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint mt-0">
          When <strong>off</strong> (default), every product shows a single clean price. Turn this
          <strong> on</strong> only during a sale — then the cut price and “% off” badges appear across the site.
          (Also available on the Offers page.)
        </p>
      </section>

      {/* WhatsApp confirmation */}
      <section className="card adm__panel mb-5">
        <h3><MessageCircle className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />WhatsApp confirmation number</h3>
        <p className="muted adm__hint mt-0 mb-3">
          After checkout, customers get a “Confirm order on WhatsApp” button that opens a chat to this number
          with their order details. Enter digits with country code (e.g. <strong>919000000000</strong>). Leave blank to hide the button.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={waInput}
            onChange={e => setWaInput(e.target.value)}
            placeholder="919000000000"
            className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <button className="btn btn-primary" onClick={saveWhatsApp} disabled={savingWa}>{savingWa ? 'Saving…' : 'Save'}</button>
        </div>

        <h3 className="mt-5">Instagram</h3>
        <p className="muted adm__hint mt-0 mb-3">Shown as the Instagram icon in the storefront footer.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={igInput}
            onChange={e => setIgInput(e.target.value)}
            placeholder="https://www.instagram.com/your_handle"
            className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
          />
          <button className="btn btn-primary" onClick={saveInstagram} disabled={savingIg}>{savingIg ? 'Saving…' : 'Save'}</button>
        </div>
      </section>

      {/* Delivery & policies */}
      <section className="card adm__panel mb-5">
        <h3><Truck className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />Delivery &amp; policies</h3>
        <p className="muted adm__hint mt-0 mb-3">Shown on product pages. Leave a field blank to hide that row.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">Estimated delivery — min days
            <input type="number" min="0" value={delivery.estimatedDaysMin} onChange={setD('estimatedDaysMin')}
              className="h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none" />
          </label>
          <label className="flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">Estimated delivery — max days
            <input type="number" min="0" value={delivery.estimatedDaysMax} onChange={setD('estimatedDaysMax')}
              className="h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none" />
          </label>
        </div>

        {[
          ['returnPolicy', 'Return & refund policy'],
          ['qualityInfo', 'Product quality'],
          ['packagingInfo', 'Packaging information'],
          ['paymentInfo', 'Payment process / instructions'],
          ['rateCard', 'Rate card (optional)'],
        ].map(([k, label]) => (
          <label key={k} className="mt-3 flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">{label}
            <textarea rows={2} value={delivery[k]} onChange={setD(k)}
              className="rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 py-2 text-ink focus:border-orchid-500 focus:outline-none" />
          </label>
        ))}

        <div className="mt-4">
          <button className="btn btn-primary" onClick={saveDelivery} disabled={savingDel}>{savingDel ? 'Saving…' : 'Save delivery info'}</button>
        </div>
      </section>

      {/* Store link */}
      <section className="card adm__panel">
        <div className="adm__panelhead">
          <h3><Store className="mr-1.5 inline h-[18px] w-[18px] align-[-3px]" />Storefront</h3>
          <a className="btn btn-ghost" href={STORE_URL} target="_blank" rel="noreferrer">Open store ↗</a>
        </div>
        <p className="muted adm__hint mt-0">The public customer website this dashboard manages.</p>
      </section>
    </div>
  );
}
