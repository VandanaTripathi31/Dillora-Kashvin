'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';
import MediaUpload from '@/components/MediaUpload';

const blank = { title:'', caption:'', src:'', poster:'' };

export default function AdminVideos() {
  const [videos, setVideos] = useState(null);
  const [form, setForm] = useState(blank);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.getVideos().then(setVideos);
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const add = async () => {
    if (!form.title || !form.src) { setErr('A title and a video link are required.'); return; }
    setErr(''); setAdding(true);
    await api.createVideo(form);
    setForm(blank); setAdding(false); load(); notify('Video added');
  };

  const del = async (v) => {
    const ok = await confirmDialog({ title: 'Remove video?', message: `“${v.title}” will be removed from the storefront.`, confirmLabel: 'Remove' });
    if (ok) { await api.deleteVideo(v.id); load(); notify('Video removed', 'info'); }
  };

  if (!videos) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Reels &amp; Videos</h1>
        <p className="muted">Upload promo videos that play on the storefront home page.</p>
      </header>

      <section className="card adm__panel mb-5">
        <h3>Add a video</h3>
        <div className="formgrid mt-3.5">
          <label className="field"><span>Title</span><input value={form.title} onChange={set('title')} placeholder="e.g. Resin Art in the making" /></label>
          <label className="field"><span>Caption (optional)</span><input value={form.caption} onChange={set('caption')} placeholder="Short line shown under the title" /></label>
          <label className="field field--2"><span>Video (MP4 URL or upload)</span>
            <div className="flex items-center gap-2">
              <input className="flex-1" value={form.src} onChange={set('src')} placeholder="https://… or upload to Cloudinary" />
              <MediaUpload kind="video" onUploaded={(url) => setForm(f => ({ ...f, src: url }))} label="Upload" />
            </div>
          </label>
          <label className="field field--2"><span>Cover image (optional)</span>
            <div className="flex items-center gap-2">
              <input className="flex-1" value={form.poster} onChange={set('poster')} placeholder="https://… (shown before the video plays)" />
              <MediaUpload kind="image" onUploaded={(url) => setForm(f => ({ ...f, poster: url }))} label="Upload" />
            </div>
          </label>
        </div>
        <p className="muted adm__hint">
          Paste a direct video link (ending in .mp4) or upload a file — uploads go straight to Cloudinary.
        </p>
        {err && <p className="opt__err">{err}</p>}
        <div className="mt-3.5">
          <button className="btn btn-primary" disabled={adding} onClick={add}>{adding ? 'Adding…' : '+ Add video'}</button>
        </div>
      </section>

      <h3 className="mb-3.5">Live videos ({videos.length})</h3>
      {videos.length === 0 ? (
        <div className="empty"><p>No videos yet — add your first reel above.</p></div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {videos.map(v => (
            <div key={v.id} className="card overflow-hidden">
              <div className="aspect-[9/16] bg-orchid-100">
                <video className="h-full w-full object-cover" src={v.src} poster={v.poster} muted loop playsInline preload="metadata"
                       onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
              </div>
              <div className="flex flex-col gap-1 px-3.5 py-3">
                <strong className="text-[0.9rem]">{v.title}</strong>
                {v.caption && <span className="muted text-[0.78rem]">{v.caption}</span>}
                <button className="mt-1.5 self-start border-none bg-transparent p-0 text-[0.8rem] font-semibold text-[#c4495b]" onClick={() => del(v)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
