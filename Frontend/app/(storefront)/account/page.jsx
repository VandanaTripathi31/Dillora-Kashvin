'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/data/api';
import { Spinner } from '@/components/UI';
import { StatusPill } from '@/components/StatusPill';

export default function Account() {
  const { user, login, logout } = useAuth();
  // `user` comes from localStorage, so it's null on the server and possibly set
  // on the client — gate the auth-dependent view behind mount to keep the server
  // and first client render identical (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="container section" style={{ minHeight: '50vh' }}><Spinner /></div>;
  if (!user) return <LoginForm onLogin={login} />;
  return <Dashboard user={user} logout={logout} />;
}

const fieldInput = 'rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-[13px] py-[11px] text-ink focus:border-[#cf9eec] focus:outline-none';

function LoginForm({ onLogin }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) { setErr('Please enter your name.'); return; }
    if (!/^\d{10}$/.test(phone.trim())) { setErr('Enter a valid 10-digit phone number.'); return; }
    setErr('');
    onLogin(name, phone);
  };

  return (
    <div className="container section max-w-[440px]">
      <h1 className="pagetitle">Sign in</h1>
      <p className="muted -mt-4 mb-[22px]">
        Sign in to see your orders, save addresses and your wishlist.
      </p>
      <div className="card p-6">
        <label className="mb-3.5 flex flex-col gap-1.5">
          <span className="text-[0.82rem] font-semibold text-ink-soft">Full name</span>
          <input className={fieldInput} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label className="mb-3.5 flex flex-col gap-1.5">
          <span className="text-[0.82rem] font-semibold text-ink-soft">Phone (10-digit)</span>
          <input className={fieldInput} value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
        </label>
        {err && <p className="my-2 text-[0.9rem] font-semibold text-[#c4495b]">{err}</p>}
        <button className="btn btn-primary btn-block" onClick={submit}>Continue</button>
        <p className="mt-3.5 rounded-[10px] bg-cream-2 px-3 py-2.5 text-[0.82rem] text-ink-soft">
          Demo sign-in — phone OTP verification will be added here later.
        </p>
      </div>
    </div>
  );
}

const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000;
const refundText = { pending: 'Refund is being processed', refunded: 'Refund completed', 'not-applicable': '' };

function OrderCard({ o, phone, onReorder, onChanged }) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Time check runs in an effect (Date.now() must not be called during render).
  const [within48, setWithin48] = useState(false);
  useEffect(() => {
    setWithin48((Date.now() - (o.createdAt || 0)) <= CANCEL_WINDOW_MS);
  }, [o.createdAt]);

  const cstate = o.cancellation?.state || 'none';
  const hasCover = o.items?.some(it => it.category === 'mobile-covers');
  const eligible = hasCover && within48 && cstate === 'none' && o.status !== 'Cancelled';
  // Whether the customer has already paid anything (drives the refund warning).
  const paidSomething = o.paymentStatus === 'paid' || o.paymentStatus === 'advance-paid' || (o.advancePaid || 0) > 0;

  const submit = async () => {
    setBusy(true); setErr('');
    const res = await api.requestCancellation(o.id, phone, reason);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setAsking(false); setReason('');
    onChanged();
  };

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <strong>{o.id}</strong>
          <span className="muted"> · {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
        </div>
        <StatusPill status={o.status} />
      </div>
      <div className="muted mb-3 text-[0.85rem]">
        {o.items.map((it, i) => <span key={i}>{it.name} ×{it.qty}{i < o.items.length - 1 ? ', ' : ''}</span>)}
      </div>

      {/* Cancellation status */}
      {cstate === 'requested' && (
        <p className="mb-3 rounded-[10px] bg-[#fff7ed] px-3 py-2 text-[0.82rem] font-semibold text-[#9a5a00]">
          Cancellation requested — we’re reviewing it.
        </p>
      )}
      {cstate === 'approved' && (
        <p className="mb-3 rounded-[10px] bg-[#fdeaed] px-3 py-2 text-[0.82rem] font-semibold text-[#b03a4c]">
          Order cancelled.{o.cancellation?.refundStatus && refundText[o.cancellation.refundStatus] ? ` ${refundText[o.cancellation.refundStatus]}.` : ''}
        </p>
      )}
      {cstate === 'rejected' && (
        <p className="mb-3 rounded-[10px] bg-cream-2 px-3 py-2 text-[0.82rem] font-semibold text-ink-soft">
          Cancellation request was declined. Contact us if you need help.
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="price">₹{o.total.toLocaleString('en-IN')}</span>
        <div className="flex gap-2">
          {eligible && !asking && (
            <button className="btn btn-ghost text-[#c4495b]" onClick={() => setAsking(true)}>Request cancellation</button>
          )}
          <button className="btn btn-ghost" onClick={() => onReorder(o)}>Reorder</button>
        </div>
      </div>

      {/* Cancellation — explicit "are you sure?" confirmation */}
      {asking && (
        <div className="mt-3 rounded-[12px] border border-[#f4d7dd] bg-[#fdf5f6] p-3.5">
          <p className="mb-1 font-display text-[1rem] font-semibold text-[#b03a4c]">Are you sure you want to cancel this order?</p>
          <p className="mb-2.5 text-[0.85rem] text-ink-soft">
            Mobile cover orders can be cancelled within 48 hours of ordering.{' '}
            {paidSomething
              ? 'Since you’ve already paid, your refund will be processed once our team reviews the request.'
              : 'This can’t be undone once approved.'}
          </p>
          <textarea
            className={`${fieldInput} w-full`}
            rows={2}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for cancellation (optional)…"
          />
          {err && <p className="mt-1 text-[0.85rem] font-semibold text-[#c4495b]">{err}</p>}
          <div className="mt-2.5 flex gap-2">
            <button className="btn btn-ghost" onClick={() => { setAsking(false); setErr(''); }}>No, keep order</button>
            <button className="btn !text-white" style={{ background: '#c4495b' }} onClick={submit} disabled={busy}>{busy ? 'Cancelling…' : 'Yes, cancel order'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ user, logout }) {
  const [orders, setOrders] = useState(null);
  const router = useRouter();
  const { add } = useCart();

  const refresh = useCallback(() => api.getOrdersByPhone(user.phone).then(setOrders), [user.phone]);
  useEffect(() => { refresh(); }, [refresh]);

  const reorder = (order) => {
    order.items.forEach(it => add({
      productId: it.productId || it.name, name: it.name, image: it.image || '',
      category: it.category || null, options: it.options || '—',
      refPhoto: null, price: it.price, qty: it.qty,
    }));
    router.push('/cart');
  };

  return (
    <div className="container section">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="pagetitle mb-1">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">{user.phone}</p>
        </div>
        <button className="btn btn-ghost" onClick={logout}>Sign out</button>
      </div>

      <div className="grid grid-cols-1 items-start gap-7 min-[901px]:grid-cols-[1.5fr_1fr]">
        <section>
          <h3 className="mb-3.5 text-[1.1rem]">Your orders</h3>
          {!orders ? <Spinner /> :
            orders.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 p-7 text-center">
                <p className="muted">No orders yet.</p>
                <button className="btn btn-primary" onClick={() => router.push('/')}>Start shopping</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map(o => (
                  <OrderCard key={o.id} o={o} phone={user.phone} onReorder={reorder} onChanged={refresh} />
                ))}
              </div>
            )}
        </section>

        <aside>
          <AddressBook defaultPhone={user.phone} defaultName={user.name} />
        </aside>
      </div>
    </div>
  );
}

const emptyAddr = { name: '', phone: '', address: '', city: '', pincode: '' };

function AddressBook({ defaultName, defaultPhone }) {
  const { addresses, defaultAddressId, saveAddress, updateAddress, removeAddress, setDefaultAddress } = useAuth();
  const [editingId, setEditingId] = useState(null); // id | 'new' | null
  const [form, setForm] = useState(emptyAddr);
  const [err, setErr] = useState('');

  const openNew = () => { setForm({ ...emptyAddr, name: defaultName || '', phone: defaultPhone || '' }); setErr(''); setEditingId('new'); };
  const openEdit = (a) => { setForm({ name: a.name || '', phone: a.phone || '', address: a.address || '', city: a.city || '', pincode: a.pincode || '' }); setErr(''); setEditingId(a.id); };
  const cancel = () => { setEditingId(null); setErr(''); };
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) { setErr('Name, address and city are required.'); return; }
    if (!/^\d{6}$/.test(form.pincode.trim())) { setErr('Enter a valid 6-digit pincode.'); return; }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) { setErr('Enter a valid 10-digit phone.'); return; }
    if (editingId === 'new') saveAddress(form);
    else updateAddress(editingId, form);
    setEditingId(null); setErr('');
  };

  return (
    <>
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[1.1rem]">Saved addresses</h3>
        {editingId === null && <button className="btn btn-ghost text-[0.85rem]" onClick={openNew}>+ Add</button>}
      </div>

      {editingId === 'new' && (
        <AddressForm form={form} set={set} err={err} onSave={submit} onCancel={cancel} title="New address" />
      )}

      {addresses.length === 0 && editingId !== 'new' ? (
        <div className="card flex flex-col items-center gap-3 p-7 text-center"><p className="muted">No saved addresses yet. Add one, or they&apos;ll save when you checkout.</p></div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map(a => editingId === a.id ? (
            <AddressForm key={a.id} form={form} set={set} err={err} onSave={submit} onCancel={cancel} title="Edit address" />
          ) : (
            <div key={a.id} className={`card p-4 ${a.id === defaultAddressId ? 'border-orchid-300 ring-1 ring-orchid-200' : ''}`}>
              <div className="flex justify-between gap-3">
                <div>
                  <strong className="inline-flex items-center gap-1.5">
                    {a.name}
                    {a.id === defaultAddressId && <span className="rounded-full bg-orchid-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orchid-600">Default</span>}
                  </strong>
                  <p className="muted mt-1 text-[0.85rem]">{a.address}, {a.city} {a.pincode}</p>
                  {a.phone && <p className="muted mt-1 text-[0.85rem]">{a.phone}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 border-t border-[#f0e7f8] pt-3 text-[0.82rem] font-semibold">
                {a.id !== defaultAddressId && <button className="text-orchid-600" onClick={() => setDefaultAddress(a.id)}>Set as default</button>}
                <button className="text-ink-soft" onClick={() => openEdit(a)}>Edit</button>
                <button className="text-[#c4495b]" onClick={() => removeAddress(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AddressForm({ form, set, err, onSave, onCancel, title }) {
  return (
    <div className="card mb-3 p-4">
      <p className="mb-3 font-semibold">{title}</p>
      <div className="flex flex-col gap-2.5">
        <input className={fieldInput} value={form.name} onChange={set('name')} placeholder="Full name" />
        <input className={fieldInput} value={form.phone} onChange={set('phone')} placeholder="Phone (10-digit)" />
        <input className={fieldInput} value={form.address} onChange={set('address')} placeholder="Address" />
        <div className="grid grid-cols-2 gap-2.5">
          <input className={fieldInput} value={form.city} onChange={set('city')} placeholder="City" />
          <input className={fieldInput} value={form.pincode} onChange={set('pincode')} placeholder="Pincode" />
        </div>
        {err && <p className="text-[0.85rem] font-semibold text-[#c4495b]">{err}</p>}
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={onSave}>Save</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
