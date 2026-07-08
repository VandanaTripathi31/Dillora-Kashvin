'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';
import { confirmDialog } from '@/components/ConfirmRoot';

// Friendly labels for the known category keys (falls back to the raw key).
const LABELS = {
  general: 'General (store-wide fallback)',
  'mobile-covers': 'Mobile Covers',
  'mobile-charms': 'Mobile Charms',
  crochet: 'Crochet',
  'resin-art': 'Resin Art',
  tshirts: 'T-Shirts & Hoodies',
};

const inputCls =
  'h-11 w-full rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState(null);
  const [saving, setSaving] = useState('');

  const load = () => api.getPolicies().then(setPolicies);
  useEffect(() => { load(); }, []);

  // Edit a specific policy in place (local state only until Save).
  const patchPolicy = (i, patch) =>
    setPolicies((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const patchSection = (i, s, patch) =>
    setPolicies((ps) =>
      ps.map((p, idx) =>
        idx === i
          ? { ...p, sections: p.sections.map((sec, si) => (si === s ? { ...sec, ...patch } : sec)) }
          : p
      )
    );

  const addSection = (i) =>
    setPolicies((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, sections: [...(p.sections || []), { heading: '', clauses: [] }] } : p))
    );

  const removeSection = (i, s) =>
    setPolicies((ps) =>
      ps.map((p, idx) => (idx === i ? { ...p, sections: p.sections.filter((_, si) => si !== s) } : p))
    );

  const save = async (p, i) => {
    setSaving(p.category);
    const payload = {
      title: p.title,
      sections: (p.sections || []).map((s) => ({
        heading: s.heading,
        clauses: Array.isArray(s.clauses) ? s.clauses : String(s.clauses || '').split('\n'),
      })),
    };
    const res = await api.savePolicy(p.category, payload);
    setSaving('');
    if (res?.error) { notify(res.error, 'error'); return; }
    // Reflect the server's cleaned/normalized version.
    setPolicies((ps) => ps.map((x, idx) => (idx === i ? res : x)));
    notify('Policy saved · live on the storefront');
  };

  const del = async (p) => {
    const ok = await confirmDialog({
      title: `Delete the ${LABELS[p.category] || p.category} policy?`,
      message: 'Products in this category will fall back to the general policy.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    const res = await api.deletePolicy(p.category);
    if (res?.error) { notify(res.error, 'error'); return; }
    load(); notify('Policy deleted', 'info');
  };

  if (!policies) return <div className="adm__pad"><Spinner /></div>;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Shipping &amp; Return Policies</h1>
        <p className="muted">
          Edit the Shipping &amp; Return Policy shown on each product page, per category. Products with no
          category-specific policy use the <strong>General</strong> one. Changes go live instantly — no redeploy.
        </p>
      </header>

      <div className="grid gap-5">
        {policies.map((p, i) => (
          <section key={p.category} className="card adm__panel">
            <div className="adm__panelhead flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h3>{LABELS[p.category] || p.category}</h3>
                {p.category === 'general' && (
                  <span className="rounded-full bg-[#f0e6f8] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Fallback</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-primary inline-flex items-center gap-1.5" onClick={() => save(p, i)} disabled={saving === p.category}>
                  <Save className="h-4 w-4" /> {saving === p.category ? 'Saving…' : 'Save'}
                </button>
                {p.category !== 'general' && (
                  <button onClick={() => del(p)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-[#b03a4c] hover:bg-[#fdeaed]">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            </div>

            <label className="mb-3 mt-1 block">
              <span className="mb-1 block text-[13px] font-semibold text-ink-soft">Accordion title</span>
              <input className={inputCls} value={p.title || ''} onChange={(e) => patchPolicy(i, { title: e.target.value })} />
            </label>

            <div className="flex flex-col gap-3">
              {(p.sections || []).map((s, si) => (
                <div key={si} className="rounded-xl border border-[#eee3f3] bg-[#faf7fd] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      className={`${inputCls} h-10 font-semibold`}
                      placeholder="Section heading (e.g. Shipping & Delivery)"
                      value={s.heading || ''}
                      onChange={(e) => patchSection(i, si, { heading: e.target.value })}
                    />
                    <button onClick={() => removeSection(i, si)} aria-label="Remove section" className="shrink-0 rounded-lg p-2 text-[#b03a4c] hover:bg-[#fdeaed]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    className="w-full resize-y rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-2.5 text-[0.9rem] text-ink focus:border-orchid-500 focus:outline-none"
                    rows={Math.max(3, (Array.isArray(s.clauses) ? s.clauses : []).length + 1)}
                    placeholder="One clause per line…"
                    value={(Array.isArray(s.clauses) ? s.clauses : []).join('\n')}
                    onChange={(e) => patchSection(i, si, { clauses: e.target.value.split('\n') })}
                  />
                  <p className="muted mt-1 text-[12px]">One clause per line — blank lines are ignored on save.</p>
                </div>
              ))}
            </div>

            <button onClick={() => addSection(i)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#eadff5] px-3.5 py-2 text-[13px] font-semibold text-orchid-600 hover:bg-[#f9f2fd]">
              <Plus className="h-4 w-4" /> Add section
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
