'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/data/api';
import { Spinner } from '@/components/UI';
import { StatusPill } from '@/components/StatusPill';

export default function Account() {
  const { user, login, logout, addresses, removeAddress } = useAuth();
  if (!user) return <LoginForm onLogin={login} />;
  return <Dashboard user={user} logout={logout} addresses={addresses} removeAddress={removeAddress} />;
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

function Dashboard({ user, logout, addresses, removeAddress }) {
  const [orders, setOrders] = useState(null);
  const router = useRouter();
  const { add } = useCart();

  useEffect(() => { api.getOrdersByPhone(user.phone).then(setOrders); }, [user.phone]);

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
                  <div key={o.id} className="card p-4">
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
                    <div className="flex items-center justify-between">
                      <span className="price">₹{o.total.toLocaleString('en-IN')}</span>
                      <button className="btn btn-ghost" onClick={() => reorder(o)}>Reorder</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        <aside>
          <h3 className="mb-3.5 text-[1.1rem]">Saved addresses</h3>
          {addresses.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-7 text-center"><p className="muted">No saved addresses yet. They&apos;ll save when you checkout.</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map(a => (
                <div key={a.id} className="card flex justify-between gap-3 p-4">
                  <div>
                    <strong>{a.name}</strong>
                    <p className="muted mt-1 text-[0.85rem]">{a.address}, {a.city} {a.pincode}</p>
                    <p className="muted mt-1 text-[0.85rem]">{a.phone}</p>
                  </div>
                  <button className="text-[0.82rem] font-semibold text-[#c4495b]" onClick={() => removeAddress(a.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
