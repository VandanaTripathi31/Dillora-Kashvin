'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown, Plus, Save } from 'lucide-react';
import { api } from '@/services/api';
import MediaUpload from '@/components/MediaUpload';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

// epoch ms <-> <input type="datetime-local"> value (local time).
const toLocal = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (v) => (v ? new Date(v).getTime() : 0);

const inputCls = 'h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none';
const blank = {
  title: '', subtitle: '', offerText: '', couponCode: '', ctaText: '', ctaLink: '',
  countdownEndsAt: 0, bgColor: '#7a4ff0', imageDesktop: '', imageMobile: '', startDate: 0, endDate: 0, active: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { api.getSettings().then((s) => setBanners(s?.adBanners || [])); }, []);

  const publish = async (next) => {
    setSaving(true);
    const res = await api.updateSettings({ adBanners: next });
    setSaving(false);
    if (res?.error) { notify(res.error, 'error'); return false; }
    setBanners(res.adBanners || []);
    setDirty(false);
    return true;
  };

  const patchLocal = (i, patch) => { setBanners((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b))); setDirty(true); };

  const addBanner = async () => { await publish([...banners, { ...blank, order: banners.length }]); notify('Banner added — fill in the details below'); };
  const saveAll = async () => { if (await publish(banners)) notify('Banners saved · live on the storefront'); };
  const toggle = async (i) => { await publish(banners.map((b, j) => (j === i ? { ...b, active: !(b.active !== false) } : b))); };
  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= banners.length) return;
    const next = [...banners];
    [next[i], next[j]] = [next[j], next[i]];
    next.forEach((b, k) => { b.order = k; });
    await publish(next);
  };
  const del = async (i) => {
    const ok = await confirmDialog({ title: 'Delete banner?', message: 'This banner will be removed from the storefront.', confirmLabel: 'Delete' });
    if (ok) { await publish(banners.filter((_, j) => j !== i)); notify('Banner deleted', 'info'); }
  };

  if (!banners) return <div className="adm__pad"><Spinner /></div>;

  // Inline (not a component) so inputs don't remount + lose focus while typing.
  const field = (i, k, ph, full) => (
    <label className={full ? 'sm:col-span-2' : ''}>
      <input className={inputCls} placeholder={ph} value={banners[i][k] || ''} onChange={(e) => patchLocal(i, { [k]: e.target.value })} />
    </label>
  );

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Promo Banners</h1>
        <p className="muted">Rich home-page banners: headline, offer, coupon, countdown, CTA and separate mobile/desktop images. Leave the content blank for a plain image banner. Set active dates to schedule.</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className="btn btn-primary inline-flex items-center gap-1.5" onClick={addBanner} disabled={saving}><Plus className="h-4 w-4" /> Add banner</button>
        <button className="btn inline-flex items-center gap-1.5" onClick={saveAll} disabled={saving || !dirty}><Save className="h-4 w-4" /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button>
      </div>

      {banners.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft">No banners yet. Click “Add banner” to create one.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {banners.map((b, i) => (
            <section key={b.id || i} className={`card p-4 ${b.active !== false ? '' : 'opacity-70'}`}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <strong className="text-ink">{b.offerText || b.title || `Banner ${i + 1}`}</strong>
                <div className="flex gap-1.5">
                  <button className="btn btn-ghost px-2" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></button>
                  <button className="btn btn-ghost px-2" title="Move down" onClick={() => move(i, 1)} disabled={i === banners.length - 1}><ArrowDown className="h-4 w-4" /></button>
                  <button className="btn btn-ghost px-2" title={b.active !== false ? 'Hide' : 'Show'} onClick={() => toggle(i)}>{b.active !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button className="btn btn-ghost px-2 text-[#c4495b]" title="Delete" onClick={() => del(i)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Images */}
              <div className="mb-3 grid gap-3 sm:grid-cols-2">
                {['imageDesktop', 'imageMobile'].map((key) => (
                  <div key={key} className="rounded-xl border border-[#eee3f3] p-2">
                    <p className="mb-1.5 text-[12px] font-semibold text-ink-soft">{key === 'imageDesktop' ? 'Desktop image' : 'Mobile image'}</p>
                    {b[key]
                      ? <img src={b[key]} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
                      : <div className="mb-2 grid h-24 w-full place-items-center rounded-lg bg-[#f6eefc] text-[12px] text-ink-soft">No image</div>}
                    <div className="flex items-center gap-2">
                      <MediaUpload kind="image" label="Upload" onUploaded={(url) => publish(banners.map((x, j) => (j === i ? { ...x, [key]: url } : x)))} />
                      {b[key] && <button className="text-[12px] font-semibold text-ink-soft hover:text-ink" onClick={() => publish(banners.map((x, j) => (j === i ? { ...x, [key]: '' } : x)))}>Remove</button>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="grid gap-2 sm:grid-cols-2">
                {field(i, 'offerText', 'Offer headline (e.g. Buy 2 Get 1 FREE)', true)}
                {field(i, 'title', 'Title (optional)')}
                {field(i, 'subtitle', 'Subtitle (e.g. Free shipping above ₹499)')}
                {field(i, 'couponCode', 'Coupon code (e.g. FIRST10)')}
                {field(i, 'ctaText', 'Button text (e.g. Shop Now)')}
                {field(i, 'ctaLink', 'Button link (e.g. /c/mobile-covers)')}
                <label className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-ink-soft">Background</span>
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(b.bgColor || '') ? b.bgColor : '#7a4ff0'} onChange={(e) => patchLocal(i, { bgColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-[1.5px] border-[#eee3f3]" />
                </label>
                <label>
                  <span className="mb-1 block text-[12px] font-semibold text-ink-soft">Countdown ends (optional)</span>
                  <input type="datetime-local" className={inputCls} value={toLocal(b.countdownEndsAt)} onChange={(e) => patchLocal(i, { countdownEndsAt: fromLocal(e.target.value) })} />
                </label>
                <label>
                  <span className="mb-1 block text-[12px] font-semibold text-ink-soft">Schedule from (optional)</span>
                  <input type="datetime-local" className={inputCls} value={toLocal(b.startDate)} onChange={(e) => patchLocal(i, { startDate: fromLocal(e.target.value) })} />
                </label>
                <label>
                  <span className="mb-1 block text-[12px] font-semibold text-ink-soft">Schedule until (optional)</span>
                  <input type="datetime-local" className={inputCls} value={toLocal(b.endDate)} onChange={(e) => patchLocal(i, { endDate: fromLocal(e.target.value) })} />
                </label>
              </div>
            </section>
          ))}
          <div><button className="btn btn-primary inline-flex items-center gap-1.5" onClick={saveAll} disabled={saving || !dirty}><Save className="h-4 w-4" /> {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</button></div>
        </div>
      )}
    </div>
  );
}
