'use client';
import { useEffect, useState } from 'react';
import { api } from '@/data/api';
import { Spinner } from '@/components/UI';

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
    setForm(blank); setAdding(false); load();
  };

  const del = async (v) => {
    if (confirm(`Remove "${v.title}"?`)) { await api.deleteVideo(v.id); load(); }
  };

  if (!videos) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Reels &amp; Videos</h1>
        <p className="muted">Upload promo videos that play on the storefront home page.</p>
      </header>

      <section className="card adm__panel" style={{ marginBottom: 20 }}>
        <h3>Add a video</h3>
        <div className="formgrid" style={{ marginTop: 14 }}>
          <label className="field"><span>Title</span><input value={form.title} onChange={set('title')} placeholder="e.g. Resin Art in the making" /></label>
          <label className="field"><span>Caption (optional)</span><input value={form.caption} onChange={set('caption')} placeholder="Short line shown under the title" /></label>
          <label className="field field--2"><span>Video link (MP4 URL / Cloudinary)</span><input value={form.src} onChange={set('src')} placeholder="https://..." /></label>
          <label className="field field--2"><span>Cover image link (optional)</span><input value={form.poster} onChange={set('poster')} placeholder="https://... (shown before the video plays)" /></label>
        </div>
        <p className="muted adm__hint">
          For the demo, paste a direct video link (ending in .mp4). When the backend is connected,
          this becomes a real file upload to Cloudinary.
        </p>
        {err && <p className="opt__err">{err}</p>}
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" disabled={adding} onClick={add}>{adding ? 'Adding…' : '+ Add video'}</button>
        </div>
      </section>

      <h3 style={{ marginBottom: 14 }}>Live videos ({videos.length})</h3>
      {videos.length === 0 ? (
        <div className="empty"><p>No videos yet — add your first reel above.</p></div>
      ) : (
        <div className="vidgrid">
          {videos.map(v => (
            <div key={v.id} className="vidcard card">
              <div className="vidcard__media">
                <video src={v.src} poster={v.poster} muted loop playsInline preload="metadata"
                       onMouseEnter={e => e.target.play()} onMouseLeave={e => e.target.pause()} />
              </div>
              <div className="vidcard__body">
                <strong>{v.title}</strong>
                {v.caption && <span className="muted">{v.caption}</span>}
                <button className="vidcard__del" onClick={() => del(v)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
