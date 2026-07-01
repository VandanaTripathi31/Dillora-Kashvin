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
    <div className="container section" style={{ maxWidth: 440 }}>
      <h1 className="pagetitle">Sign in</h1>
      <p className="muted" style={{ marginTop: -16, marginBottom: 22 }}>
        Sign in to see your orders, save addresses and your wishlist.
      </p>
      <div className="card checkout__card">
        <label className="field" style={{ marginBottom: 14 }}>
          <span>Full name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </label>
        <label className="field" style={{ marginBottom: 14 }}>
          <span>Phone (10-digit)</span>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
        </label>
        {err && <p className="opt__err">{err}</p>}
        <button className="btn btn-primary btn-block" onClick={submit}>Continue</button>
        <p className="checkout__demo" style={{ marginTop: 14 }}>
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
      <div className="acct__head">
        <div>
          <h1 className="pagetitle" style={{ marginBottom: 4 }}>Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">{user.phone}</p>
        </div>
        <button className="btn btn-ghost" onClick={logout}>Sign out</button>
      </div>

      <div className="acct__grid">
        <section>
          <h3 className="acct__h">Your orders</h3>
          {!orders ? <Spinner /> :
            orders.length === 0 ? (
              <div className="card acct__empty">
                <p className="muted">No orders yet.</p>
                <button className="btn btn-primary" onClick={() => router.push('/')}>Start shopping</button>
              </div>
            ) : (
              <div className="acct__orders">
                {orders.map(o => (
                  <div key={o.id} className="card acct__order">
                    <div className="acct__orderhead">
                      <div>
                        <strong>{o.id}</strong>
                        <span className="muted"> · {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <StatusPill status={o.status} />
                    </div>
                    <div className="acct__orderitems muted">
                      {o.items.map((it, i) => <span key={i}>{it.name} ×{it.qty}{i < o.items.length - 1 ? ', ' : ''}</span>)}
                    </div>
                    <div className="acct__orderfoot">
                      <span className="price">₹{o.total.toLocaleString('en-IN')}</span>
                      <button className="btn btn-ghost" onClick={() => reorder(o)}>Reorder</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        <aside>
          <h3 className="acct__h">Saved addresses</h3>
          {addresses.length === 0 ? (
            <div className="card acct__empty"><p className="muted">No saved addresses yet. They&apos;ll save when you checkout.</p></div>
          ) : (
            <div className="acct__addrs">
              {addresses.map(a => (
                <div key={a.id} className="card acct__addr">
                  <div>
                    <strong>{a.name}</strong>
                    <p className="muted">{a.address}, {a.city} {a.pincode}</p>
                    <p className="muted">{a.phone}</p>
                  </div>
                  <button className="cartline__rm" onClick={() => removeAddress(a.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
