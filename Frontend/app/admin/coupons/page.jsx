'use client';
import { useEffect, useState } from 'react';
import { api, BANNER_PRESETS } from '@/data/api';
import { Spinner } from '@/components/UI';

const blankCoupon = { code:'', type:'percent', value:'', buyQty:'2', freeQty:'1', minOrder:'', expiry:'', active:true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState(blankCoupon);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [showDiscounts, setShowDiscounts] = useState(false);

  const load = () => api.getCoupons().then(setCoupons);
  useEffect(() => { load(); api.getSettings().then(s => { setBanner(s.banner); setShowDiscounts(!!s.showDiscounts); }); }, []);

  const saveShowDiscounts = async (val) => {
    setShowDiscounts(val);
    await api.updateSettings({ showDiscounts: val });
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const add = async () => {
    setErr(''); setSaving(true);
    const res = await api.createCoupon(form);
    setSaving(false);
    if (res?.error) { setErr(res.error); return; }
    setForm(blankCoupon); load();
  };

  const toggle = async (c) => { await api.updateCoupon(c.code, { active: !c.active }); load(); };
  const del = async (c) => { if (confirm(`Delete code ${c.code}?`)) { await api.deleteCoupon(c.code); load(); } };

  const saveBanner = async (patch) => {
    const next = { ...banner, ...patch };
    setBanner(next);
    await api.updateSettings({ banner: next });
    window.dispatchEvent(new CustomEvent('dilora:settings'));
  };

  if (!coupons || !banner) return <div className="adm__pad"><Spinner /></div>;

  const isExpired = (c) => c.expiry && new Date(c.expiry) < new Date(new Date().toDateString());

  return (
    <div className="adm__pad">
      <header className="adm__head"><h1>Offers</h1><p className="muted">Run discount codes and festive banners — switch them on or off anytime.</p></header>

      {/* Show discounts / sale prices toggle */}
      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <div className="adm__panelhead">
          <h3>Show sale prices</h3>
          <label className="switch">
            <input type="checkbox" checked={showDiscounts} onChange={e => saveShowDiscounts(e.target.checked)} />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint" style={{ marginTop: 0 }}>
          When <strong>off</strong> (default), every product shows a single clean price. Turn this <strong>on</strong> only during a sale or offer — then the original (cut) price and “% off” badges appear across the site.
        </p>
      </section>

      {/* Festive banner toggle */}
      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <div className="adm__panelhead">
          <h3>Festive banner</h3>
          <label className="switch">
            <input type="checkbox" checked={banner.on} onChange={e => saveBanner({ on: e.target.checked })} />
            <span className="switch__slider" />
          </label>
        </div>
        <p className="muted adm__hint" style={{ marginTop: 0 }}>
          When on, a banner shows across the whole site (phone &amp; laptop).
        </p>
        <div className="formgrid" style={{ marginTop: 14 }}>
          <label className="field"><span>Occasion</span>
            <select value={banner.preset} onChange={e => saveBanner({ preset: e.target.value })}>
              {Object.entries(BANNER_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Coupon code to show (optional)</span>
            <input value={banner.code || ''} onChange={e => saveBanner({ code: e.target.value.toUpperCase() })} placeholder="e.g. DIWALI200" />
          </label>
          <label className="field field--2"><span>Custom message (optional — overrides default)</span>
            <input value={banner.text || ''} onChange={e => saveBanner({ text: e.target.value })} placeholder={BANNER_PRESETS[banner.preset]?.text} />
          </label>
        </div>
        {/* live preview */}
        <div className="fbanner fbanner--preview" style={{ background: (BANNER_PRESETS[banner.preset] || {}).bg, marginTop: 16 }}>
          <span className="fbanner__text">{banner.text?.trim() || BANNER_PRESETS[banner.preset]?.text}</span>
          {banner.code && <span className="fbanner__code">Use code <strong>{banner.code}</strong></span>}
        </div>
      </section>

      {/* Create coupon */}
      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <h3>Create a discount code</h3>
        <div className="formgrid" style={{ marginTop: 14 }}>
          <label className="field"><span>Code</span><input value={form.code} onChange={e => setForm(f => ({...f, code:e.target.value.toUpperCase()}))} placeholder="DIWALI200" /></label>
          <label className="field"><span>Type</span>
            <select value={form.type} onChange={set('type')}>
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat (₹)</option>
              <option value="bogo">Buy X Get Y Free</option>
            </select>
          </label>
          {form.type === 'bogo' ? (
            <>
              <label className="field"><span>Buy quantity</span><input value={form.buyQty} onChange={set('buyQty')} placeholder="2" /></label>
              <label className="field"><span>Free quantity</span><input value={form.freeQty} onChange={set('freeQty')} placeholder="1" /></label>
            </>
          ) : (
            <label className="field"><span>{form.type === 'percent' ? 'Percent off' : 'Amount off (₹)'}</span><input value={form.value} onChange={set('value')} placeholder={form.type==='percent'?'10':'200'} /></label>
          )}
          <label className="field"><span>Min order (₹, optional)</span><input value={form.minOrder} onChange={set('minOrder')} placeholder="0" /></label>
          <label className="field"><span>Expiry date (optional)</span><input type="date" value={form.expiry} onChange={set('expiry')} /></label>
          <label className="field"><span>Status</span>
            <select value={form.active ? 'yes' : 'no'} onChange={e => setForm(f => ({...f, active: e.target.value === 'yes'}))}>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </label>
        </div>
        {err && <p className="opt__err">{err}</p>}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" disabled={saving} onClick={add}>{saving ? 'Adding…' : '+ Add code'}</button>
        </div>
      </section>

      {/* Coupon list */}
      <h3 style={{ marginBottom: 12 }}>All codes ({coupons.length})</h3>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expiry</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'var(--ink-soft)' }}>No codes yet.</td></tr>
            ) : coupons.map(c => (
              <tr key={c.code}>
                <td><strong>{c.code}</strong></td>
                <td>{c.type === 'bogo' ? `Buy ${c.buyQty} Get ${c.freeQty} Free` : c.type === 'percent' ? `${c.value}% off` : `₹${c.value} off`}</td>
                <td>{c.minOrder ? `₹${c.minOrder}` : '—'}</td>
                <td>{c.expiry ? <span className={isExpired(c) ? 'pill pill--bad' : ''}>{c.expiry}{isExpired(c) ? ' (expired)' : ''}</span> : '—'}</td>
                <td>
                  <button className={`pill ${c.active ? 'pill--ok' : ''}`} onClick={() => toggle(c)} style={{ cursor:'pointer', border:'none' }}>
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="tbl__actions"><button className="tbl__del" onClick={() => del(c)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
