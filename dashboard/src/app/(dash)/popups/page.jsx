'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import MediaUpload from '@/components/MediaUpload';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';

const DEF = {
  welcome: { enabled: false, image: '', link: '' },
  order: { enabled: true, image: '', link: '' },
};

// One popup editor card (module-level so it isn't recreated each render).
function PopupCard({ title, desc, note, data, onPatch, onPersist, onSaveNow, busy }) {
  return (
    <section className="card adm__panel mb-5">
      <div className="adm__panelhead">
        <h3>{title}</h3>
        <label className="switch">
          <input type="checkbox" checked={!!data.enabled} onChange={(e) => onSaveNow({ enabled: e.target.checked })} />
          <span className="switch__slider" />
        </label>
      </div>
      <p className="muted adm__hint mt-0 mb-3">{desc}</p>

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div>
          {data.image
            ? <img src={data.image} alt="" className="mb-2 w-full rounded-xl object-cover" />
            : <div className="mb-2 grid h-[130px] w-full place-items-center rounded-xl bg-[#f6eefc] text-[12px] text-ink-soft">No image uploaded</div>}
          <div className="flex gap-2">
            <MediaUpload kind="image" label={data.image ? 'Replace image' : 'Upload image'} onUploaded={(url) => onSaveNow({ image: url })} />
            {data.image && <button className="btn btn-ghost" onClick={() => onSaveNow({ image: '' })}>Remove</button>}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[0.8rem] font-semibold text-ink-soft">
            Click-through link (optional)
            <input
              value={data.link || ''}
              onChange={(e) => onPatch({ link: e.target.value })}
              onBlur={onPersist}
              placeholder="https://… (where the popup image links to)"
              className="h-10 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3 text-ink focus:border-orchid-500 focus:outline-none"
            />
          </label>
          <p className="muted text-[12px]">{note}</p>
          {busy && <span className="muted text-[12px]">Saving…</span>}
        </div>
      </div>
    </section>
  );
}

export default function AdminPopups() {
  const [popups, setPopups] = useState(null);
  const [busy, setBusy] = useState('');

  const hydrate = (s) => ({
    welcome: { ...DEF.welcome, ...(s?.popups?.welcome || {}) },
    order: { ...DEF.order, ...(s?.popups?.order || {}) },
  });

  useEffect(() => { api.getSettings().then((s) => setPopups(hydrate(s))); }, []);

  const patchLocal = (key, patch) => setPopups((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  const persist = async (key, override) => {
    setBusy(key);
    const value = override ? { ...popups[key], ...override } : popups[key];
    if (override) patchLocal(key, override);
    const res = await api.updateSettings({ popups: { [key]: value } });
    setBusy('');
    if (res?.error) { notify(res.error, 'error'); return; }
    setPopups(hydrate(res));
    notify('Popup saved');
  };

  if (!popups) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Popups</h1>
        <p className="muted">Upload an image for each popup and change it anytime. When you upload a new image, every visitor sees it once.</p>
      </header>

      <PopupCard
        title="Welcome popup"
        desc="Shown when a visitor opens the website. Turn it on and upload an image (e.g. a welcome offer or announcement)."
        note="Recommended: a square or portrait image. Turned off by default."
        data={popups.welcome}
        onPatch={(patch) => patchLocal('welcome', patch)}
        onPersist={() => persist('welcome')}
        onSaveNow={(patch) => persist('welcome', patch)}
        busy={busy === 'welcome'}
      />

      <PopupCard
        title="How-to-order popup (product pages)"
        desc="Shown on a product page. Upload your own image (e.g. an ordering-steps graphic). If left empty, a built-in illustrated 'How to order' design is shown instead."
        note="Leave the image empty to use the built-in illustrated steps. Turn off to hide it entirely."
        data={popups.order}
        onPatch={(patch) => patchLocal('order', patch)}
        onPersist={() => persist('order')}
        onSaveNow={(patch) => persist('order', patch)}
        busy={busy === 'order'}
      />
    </div>
  );
}
