'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { api } from '@/services/api';
import MediaUpload from '@/components/MediaUpload';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';

const toLocal = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (v) => (v ? new Date(v).getTime() : 0);

const DEF = {
  welcome: { enabled: false, image: '', heading: '', description: '', buttonText: '', couponCode: '', bgColor: '', startDate: 0, endDate: 0, link: '' },
  order: { enabled: true, image: '', heading: '', buttonText: '', steps: [] },
  promo: { enabled: false, image: '', heading: '', description: '', couponCode: '', ctaText: '', ctaLink: '', countdownEndsAt: 0, bgColor: '', startDate: 0, endDate: 0 },
};

const input = 'h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none';
const lbl = 'mb-1 block text-[12px] font-semibold text-ink-soft';

export default function AdminPopups() {
  const [p, setP] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    api.getSettings().then((s) => setP({
      welcome: { ...DEF.welcome, ...(s?.popups?.welcome || {}) },
      order: { ...DEF.order, ...(s?.popups?.order || {}), steps: s?.popups?.order?.steps || [] },
      promo: { ...DEF.promo, ...(s?.popups?.promo || {}) },
    }));
    api.getCoupons().then((c) => setCoupons(Array.isArray(c) ? c : [])).catch(() => {});
  }, []);

  const patch = (key, up) => setP((prev) => ({ ...prev, [key]: { ...prev[key], ...up } }));

  const save = async (key, override) => {
    setSaving(key);
    if (override) patch(key, override);
    const value = override ? { ...p[key], ...override } : p[key];
    const res = await api.updateSettings({ popups: { [key]: value } });
    setSaving('');
    if (res?.error) { notify(res.error, 'error'); return; }
    notify('Popup saved · live on the storefront');
  };

  if (!p) return <div className="adm__pad"><Spinner /></div>;

  // Lowercase render-helpers (not components) so nothing remounts / trips the
  // react-hooks static-components rule.
  const couponSelect = (value, onChange) => (
    <select className={input} value={coupons.some((c) => c.code === value) ? value : ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">No coupon</option>
      {coupons.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.type === 'percent' ? `${c.value}% off` : c.type === 'flat' ? `₹${c.value} off` : 'BOGO'}</option>)}
    </select>
  );
  const toggle = (k) => (
    <label className="switch"><input type="checkbox" checked={!!p[k].enabled} onChange={(e) => save(k, { enabled: e.target.checked })} /><span className="switch__slider" /></label>
  );
  const imageField = (k) => (
    <div className="rounded-xl border border-[#eee3f3] p-2">
      {p[k].image
        ? <img src={p[k].image} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" />
        : <div className="mb-2 grid h-28 w-full place-items-center rounded-lg bg-[#f6eefc] text-[12px] text-ink-soft">No image</div>}
      <div className="flex gap-2">
        <MediaUpload kind="image" label={p[k].image ? 'Replace' : 'Upload image'} onUploaded={(url) => save(k, { image: url })} />
        {p[k].image && <button className="text-[12px] font-semibold text-ink-soft hover:text-ink" onClick={() => save(k, { image: '' })}>Remove</button>}
      </div>
    </div>
  );

  return (
    <div className="adm__pad">
      <header className="adm__head"><h1>Popups</h1><p className="muted">Manage the Welcome, How-to-order and Promo popups. Each shows once per visitor; changing the content shows it again.</p></header>

      {/* WELCOME */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead"><h3>👋 Welcome popup</h3>{toggle('welcome')}</div>
        <p className="muted adm__hint mt-0 mb-3">Shown once when a visitor opens the site. Fill in text/coupon for a rich popup, or just upload an image.</p>
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          {imageField('welcome')}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={lbl}>Heading</span><input className={input} value={p.welcome.heading} onChange={(e) => patch('welcome', { heading: e.target.value })} placeholder="Welcome to Dillora 💜" /></label>
            <label className="sm:col-span-2"><span className={lbl}>Description</span><input className={input} value={p.welcome.description} onChange={(e) => patch('welcome', { description: e.target.value })} placeholder="You're getting 10% OFF your first order." /></label>
            <label><span className={lbl}>Coupon</span>{couponSelect(p.welcome.couponCode, (v) => patch('welcome', { couponCode: v }))}</label>
            <label><span className={lbl}>Button text</span><input className={input} value={p.welcome.buttonText} onChange={(e) => patch('welcome', { buttonText: e.target.value })} placeholder="Claim coupon" /></label>
            <label className="flex items-end gap-2"><span className={lbl}>Background</span><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(p.welcome.bgColor) ? p.welcome.bgColor : '#f4ecff'} onChange={(e) => patch('welcome', { bgColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-[1.5px] border-[#eee3f3]" /></label>
            <label><span className={lbl}>Show from</span><input type="datetime-local" className={input} value={toLocal(p.welcome.startDate)} onChange={(e) => patch('welcome', { startDate: fromLocal(e.target.value) })} /></label>
            <label><span className={lbl}>Show until</span><input type="datetime-local" className={input} value={toLocal(p.welcome.endDate)} onChange={(e) => patch('welcome', { endDate: fromLocal(e.target.value) })} /></label>
          </div>
        </div>
        <button className="btn btn-primary mt-3 inline-flex items-center gap-1.5" onClick={() => save('welcome')} disabled={saving === 'welcome'}><Save className="h-4 w-4" /> Save welcome popup</button>
      </section>

      {/* HOW-TO-ORDER */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead"><h3>📦 How-to-order popup</h3>{toggle('order')}</div>
        <p className="muted adm__hint mt-0 mb-3">Shown on product pages. Add steps for a custom guide, or upload an image. Leave both empty for the built-in illustrated design.</p>
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          {imageField('order')}
          <div className="flex flex-col gap-2">
            <label><span className={lbl}>Heading</span><input className={input} value={p.order.heading} onChange={(e) => patch('order', { heading: e.target.value })} placeholder="📦 How to order" /></label>
            <span className={lbl}>Steps</span>
            {(p.order.steps || []).map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-2">
                <input className={`${input} w-14 shrink-0 text-center`} value={s.icon || ''} onChange={(e) => patch('order', { steps: p.order.steps.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })} placeholder="1" title="Icon or number" />
                <input className={`${input} min-w-0 flex-1`} value={s.title || ''} onChange={(e) => patch('order', { steps: p.order.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Step title (e.g. Choose product)" />
                <input className={`${input} min-w-0 flex-1 basis-full sm:basis-auto`} value={s.text || ''} onChange={(e) => patch('order', { steps: p.order.steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} placeholder="Description (optional)" />
                <button className="shrink-0 rounded-lg p-2 text-[#b03a4c] hover:bg-[#fdeaed]" onClick={() => patch('order', { steps: p.order.steps.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#eadff5] px-3.5 py-2 text-[13px] font-semibold text-orchid-600 hover:bg-[#f9f2fd]" onClick={() => patch('order', { steps: [...(p.order.steps || []), { icon: '', title: '', text: '' }] })}><Plus className="h-4 w-4" /> Add step</button>
            <label><span className={lbl}>Button text</span><input className={input} value={p.order.buttonText} onChange={(e) => patch('order', { buttonText: e.target.value })} placeholder="Got it — let's shop ✨" /></label>
          </div>
        </div>
        <button className="btn btn-primary mt-3 inline-flex items-center gap-1.5" onClick={() => save('order')} disabled={saving === 'order'}><Save className="h-4 w-4" /> Save how-to-order popup</button>
      </section>

      {/* PROMO */}
      <section className="card adm__panel mb-5">
        <div className="adm__panelhead"><h3>🎉 Promo popup</h3>{toggle('promo')}</div>
        <p className="muted adm__hint mt-0 mb-3">A general promotional popup you can run anytime, site-wide. Defers to the welcome popup when both are on.</p>
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          {imageField('promo')}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={lbl}>Heading</span><input className={input} value={p.promo.heading} onChange={(e) => patch('promo', { heading: e.target.value })} placeholder="🎉 Flat 20% OFF" /></label>
            <label className="sm:col-span-2"><span className={lbl}>Description</span><input className={input} value={p.promo.description} onChange={(e) => patch('promo', { description: e.target.value })} placeholder="Offer ends tonight!" /></label>
            <label><span className={lbl}>Coupon</span>{couponSelect(p.promo.couponCode, (v) => patch('promo', { couponCode: v }))}</label>
            <label><span className={lbl}>Button text</span><input className={input} value={p.promo.ctaText} onChange={(e) => patch('promo', { ctaText: e.target.value })} placeholder="Shop now" /></label>
            <label><span className={lbl}>Button link</span><input className={input} value={p.promo.ctaLink} onChange={(e) => patch('promo', { ctaLink: e.target.value })} placeholder="/c/mobile-covers" /></label>
            <label className="flex items-end gap-2"><span className={lbl}>Background</span><input type="color" value={/^#[0-9a-fA-F]{6}$/.test(p.promo.bgColor) ? p.promo.bgColor : '#f4ecff'} onChange={(e) => patch('promo', { bgColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-[1.5px] border-[#eee3f3]" /></label>
            <label><span className={lbl}>Countdown ends</span><input type="datetime-local" className={input} value={toLocal(p.promo.countdownEndsAt)} onChange={(e) => patch('promo', { countdownEndsAt: fromLocal(e.target.value) })} /></label>
            <label><span className={lbl}>Show from</span><input type="datetime-local" className={input} value={toLocal(p.promo.startDate)} onChange={(e) => patch('promo', { startDate: fromLocal(e.target.value) })} /></label>
            <label><span className={lbl}>Show until</span><input type="datetime-local" className={input} value={toLocal(p.promo.endDate)} onChange={(e) => patch('promo', { endDate: fromLocal(e.target.value) })} /></label>
          </div>
        </div>
        <button className="btn btn-primary mt-3 inline-flex items-center gap-1.5" onClick={() => save('promo')} disabled={saving === 'promo'}><Save className="h-4 w-4" /> Save promo popup</button>
      </section>
    </div>
  );
}
