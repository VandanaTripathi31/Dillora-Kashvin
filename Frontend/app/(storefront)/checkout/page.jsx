'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/data/api';

// NOTE: Payment is mocked for the demo. When Razorpay is integrated later,
// 'online' and the online half of 'half-cod' will open Razorpay checkout
// from here. The order shape sent to api.createOrder stays the same.
const PAYMENTS = [
  { id:'online',  title:'Pay online',        desc:'UPI / Card / Netbanking (full amount)' },
  { id:'half-cod',title:'Half online + COD', desc:'Pay 50% now, rest on delivery' },
];

export default function Checkout() {
  const { items, subtotal, clear, count } = useCart();
  const { user, saveAddress } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email:'', address:'', city:'', pincode:'',
  });
  const [payment, setPayment] = useState('online');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  // coupon state
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);       // { code, discount }
  const [couponMsg, setCouponMsg] = useState('');
  const [checking, setChecking] = useState(false);

  const shipping = subtotal >= 299 ? 0 : 49;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const payNow = payment === 'half-cod' ? Math.round(total/2) : payment === 'online' ? total : 0;

  // Redirect to home only if the cart is empty AND we did not just place an order.
  useEffect(() => {
    if (count === 0 && !placing && !placed) router.push('/');
  }, [count, placing, placed, router]);

  if (count === 0 && !placed) return null;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const applyCoupon = async () => {
    setChecking(true); setCouponMsg('');
    const res = await api.validateCoupon(couponInput, subtotal, items);
    setChecking(false);
    if (!res.ok) { setCoupon(null); setCouponMsg(res.reason); return; }
    setCoupon({ code: res.coupon.code, discount: res.discount });
    setCouponMsg('');
  };

  const removeCoupon = () => { setCoupon(null); setCouponInput(''); setCouponMsg(''); };

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      setError('Please fill in your name, phone, address, city and pincode.'); return;
    }
    if (!/^\d{10}$/.test(form.phone)) { setError('Enter a valid 10-digit phone number.'); return; }
    if (!/^\d{6}$/.test(form.pincode)) { setError('Enter a valid 6-digit pincode.'); return; }
    setError(''); setPlacing(true);

    const order = await api.createOrder({
      customer: { name: form.name, phone: form.phone, email: form.email,
                  address: `${form.address}, ${form.city} ${form.pincode}` },
      userPhone: user?.phone || form.phone,
      items: items.map(l => ({ name:l.name, options:l.options, qty:l.qty, price:l.price, refPhoto:l.refPhoto || null, category:l.category || null, productId:l.productId, image:l.image })),
      subtotal, discount, coupon: coupon?.code || null,
      total, payment,
      payNow,
    });
    // save address for signed-in users
    if (user) saveAddress({ name: form.name, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode });
    clear();
    setPlaced(true);
    router.push(`/order/${order.id}`);
  };

  return (
    <div className="container section">
      <h1 className="pagetitle">Checkout</h1>
      <div className="checkout">
        <div className="checkout__main">
          <section className="card checkout__card">
            <h3>Delivery details</h3>
            <div className="formgrid">
              <Field label="Full name" value={form.name} onChange={set('name')} span2 />
              <Field label="Phone (10-digit)" value={form.phone} onChange={set('phone')} />
              <Field label="Email (optional)" value={form.email} onChange={set('email')} />
              <Field label="Address" value={form.address} onChange={set('address')} span2 />
              <Field label="City" value={form.city} onChange={set('city')} />
              <Field label="Pincode" value={form.pincode} onChange={set('pincode')} />
            </div>
          </section>

          <section className="card checkout__card">
            <h3>Payment method</h3>
            <div className="paylist">
              {PAYMENTS.map(p => (
                <label key={p.id} className={`payopt ${payment===p.id?'payopt--on':''}`}>
                  <input type="radio" name="pay" value={p.id} checked={payment===p.id} onChange={() => setPayment(p.id)} />
                  <div>
                    <strong>{p.title}</strong>
                    <span className="muted">{p.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="checkout__demo">Demo mode — no real payment is charged. Razorpay connects here later.</p>
          </section>
        </div>

        <aside className="summary card">
          <h3>Order summary</h3>
          {items.map(l => (
            <div key={l.lineId} className="summary__item">
              <span>{l.name} <em className="muted">×{l.qty}</em></span>
              <span>₹{(l.price*l.qty).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="summary__row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>

          {/* Coupon */}
          <div className="coupon">
            {!coupon ? (
              <>
                <div className="coupon__row">
                  <input className="coupon__input" value={couponInput}
                         onChange={e => setCouponInput(e.target.value.toUpperCase())}
                         placeholder="Discount code" />
                  <button className="btn btn-ghost coupon__btn" disabled={checking || !couponInput} onClick={applyCoupon}>
                    {checking ? '…' : 'Apply'}
                  </button>
                </div>
                {couponMsg && <p className="coupon__msg">{couponMsg}</p>}
              </>
            ) : (
              <div className="coupon__applied">
                <span>✓ <strong>{coupon.code}</strong> applied</span>
                <button className="cartline__rm" onClick={removeCoupon}>Remove</button>
              </div>
            )}
          </div>

          {discount > 0 && (
            <div className="summary__row summary__discount"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>
          )}
          <div className="summary__row"><span>Shipping</span><span>{shipping===0?'Free':`₹${shipping}`}</span></div>
          <div className="summary__row summary__total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          {payNow > 0 && payNow < total &&
            <div className="summary__row summary__paynow"><span>Pay now</span><span>₹{payNow.toLocaleString('en-IN')}</span></div>}
          {error && <p className="opt__err">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, span2 }) {
  return (
    <label className={`field ${span2 ? 'field--2' : ''}`}>
      <span>{label}</span>
      <input value={value} onChange={onChange} />
    </label>
  );
}
