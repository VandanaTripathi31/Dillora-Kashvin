'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '@/services/api';
import MediaUpload from '@/components/MediaUpload';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

export default function AdminBanners() {
  const [banners, setBanners] = useState(null);
  const [draft, setDraft] = useState({ image: '', link: '', alt: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSettings().then(s => setBanners(s?.adBanners || [])); }, []);

  // Persist the whole list. Returns true on success.
  const publish = async (next) => {
    setSaving(true);
    const res = await api.updateSettings({ adBanners: next });
    setSaving(false);
    if (res?.error) { notify(res.error, 'error'); return false; }
    setBanners(res.adBanners || []);
    return true;
  };

  const addBanner = async () => {
    if (!draft.image) { notify('Upload a banner image first.', 'error'); return; }
    const next = [...banners, { ...draft, active: true, order: banners.length }];
    if (await publish(next)) { setDraft({ image: '', link: '', alt: '' }); notify('Banner added'); }
  };

  const patchLocal = (i, patch) => setBanners(prev => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const toggle = async (i) => {
    const next = banners.map((b, j) => (j === i ? { ...b, active: !(b.active !== false) } : b));
    if (await publish(next)) notify('Banner updated', 'info');
  };

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
    if (!ok) return;
    if (await publish(banners.filter((_, j) => j !== i))) notify('Banner deleted', 'info');
  };

  if (!banners) return <div className="adm__pad"><Spinner /></div>;

  const inputCls = 'h-10 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none';

  return (
    <div className="adm__pad">
      <header className="adm__head"><h1>Advertising banners</h1><p className="muted">Promotional image banners shown on the storefront home page. Add, hide, reorder or remove them — changes go live instantly.</p></header>

      {/* Add new */}
      <div className="card mb-5 p-4">
        <h3 className="mb-3">Add a banner</h3>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div>
            {draft.image
              ? <img src={draft.image} alt="" className="mb-2 w-full rounded-lg object-cover" />
              : <div className="mb-2 grid h-[90px] w-full place-items-center rounded-lg bg-[#f6eefc] text-[12px] text-ink-soft">No image</div>}
            <MediaUpload kind="image" label="Upload image" onUploaded={(url) => setDraft(d => ({ ...d, image: url }))} />
          </div>
          <div className="flex flex-col gap-2">
            <input className={inputCls} placeholder="Link URL (optional) — where the banner clicks to" value={draft.link} onChange={e => setDraft(d => ({ ...d, link: e.target.value }))} />
            <input className={inputCls} placeholder="Alt text (for accessibility)" value={draft.alt} onChange={e => setDraft(d => ({ ...d, alt: e.target.value }))} />
            <div><button className="btn btn-primary" onClick={addBanner} disabled={saving || !draft.image}>Add banner</button></div>
          </div>
        </div>
      </div>

      {/* List */}
      {banners.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft">No banners yet. Add one above to promote offers on your home page.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b, i) => (
            <div key={b.id || i} className={`card p-3 ${b.active !== false ? '' : 'opacity-70'}`}>
              <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto]">
                <img src={b.image} alt={b.alt || ''} className="w-full rounded-lg object-cover" />
                <div className="flex flex-col gap-2">
                  <input className={inputCls} value={b.link || ''} placeholder="Link URL (optional)" onChange={e => patchLocal(i, { link: e.target.value })} onBlur={() => publish(banners)} />
                  <input className={inputCls} value={b.alt || ''} placeholder="Alt text" onChange={e => patchLocal(i, { alt: e.target.value })} onBlur={() => publish(banners)} />
                  {b.active === false && <span className="text-[12px] font-semibold uppercase text-ink-soft">Hidden from storefront</span>}
                </div>
                <div className="flex flex-row gap-1.5 sm:flex-col">
                  <button className="btn btn-ghost px-2" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></button>
                  <button className="btn btn-ghost px-2" title="Move down" onClick={() => move(i, 1)} disabled={i === banners.length - 1}><ArrowDown className="h-4 w-4" /></button>
                  <button className="btn btn-ghost px-2" title={b.active !== false ? 'Hide' : 'Show'} onClick={() => toggle(i)}>{b.active !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button className="btn btn-ghost px-2 text-[#c4495b]" title="Delete" onClick={() => del(i)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
