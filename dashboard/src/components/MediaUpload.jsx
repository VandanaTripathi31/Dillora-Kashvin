'use client';
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '@/services/api';
import { notify } from '@/components/AdminToaster';

/**
 * Small upload button that sends a file to Cloudinary (via the backend) and
 * returns the resulting URL through onUploaded(url).
 *
 * @param {'image'|'video'} kind
 * @param {(url:string)=>void} onUploaded
 * @param {string} label
 */
export default function MediaUpload({ kind = 'image', onUploaded, label }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setBusy(true);
    try {
      const res = kind === 'video' ? await api.uploadVideo(file) : await api.uploadImage(file);
      if (res?.url) { onUploaded?.(res.url); notify('Uploaded to Cloudinary'); }
      else notify(res?.error || 'Upload failed', 'error');
    } catch (err) {
      notify(err.message || 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={kind === 'video' ? 'video/*' : 'image/*'}
        style={{ display: 'none' }}
        onChange={onChange}
      />
      <button type="button" className="btn btn-ghost" onClick={pick} disabled={busy}>
        <UploadCloud className="w-[16px] h-[16px]" />
        {busy ? 'Uploading…' : label || (kind === 'video' ? 'Upload video' : 'Upload image')}
      </button>
    </>
  );
}
