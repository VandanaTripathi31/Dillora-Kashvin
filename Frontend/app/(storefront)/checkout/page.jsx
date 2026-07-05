'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/data/api';
import { loadRazorpayScript } from '@/lib/razorpay';

// Both options collect an online payment now (full amount, or the 50% "pay now"
// for half-cod), so both open Razorpay Checkout. The order is only persisted
// after the payment signature is verified on the backend.
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

  // Build the order payload sent to the backend (shape unchanged).
  const buildOrderPayload = () => ({
    customer: { name: form.name, phone: form.phone, email: form.email,
                address: `${form.address}, ${form.city} ${form.pincode}` },
    userPhone: user?.phone || form.phone,
    items: items.map(l => ({ name:l.name, options:l.options, qty:l.qty, price:l.price, refPhoto:l.refPhoto || null, category:l.category || null, productId:l.productId, image:l.image })),
    subtotal, discount, coupon: coupon?.code || null,
    total, payment, payNow,
  });

  const finishOrder = (order) => {
    // save address for signed-in users
    if (user) saveAddress({ name: form.name, phone: form.phone, address: form.address, city: form.city, pincode: form.pincode });
    // Stash the just-placed order so the confirmation page can show it without
    // needing an admin token (GET /api/orders is admin-only).
    try { sessionStorage.setItem('dilora_last_order', JSON.stringify(order)); } catch { /* ignore */ }
    setPlaced(true);
    clear();
    router.push(`/order/${order.id}`);
  };

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      setError('Please fill in your name, phone, address, city and pincode.'); return;
    }
    if (!/^\d{10}$/.test(form.phone)) { setError('Enter a valid 10-digit phone number.'); return; }
    if (!/^\d{6}$/.test(form.pincode)) { setError('Enter a valid 6-digit pincode.'); return; }
    setError(''); setPlacing(true);

    const orderPayload = buildOrderPayload();

    try {
      // 1) Make sure the Razorpay Checkout script is available.
      const ready = await loadRazorpayScript();
      if (!ready) throw new Error('Could not load the payment gateway. Check your connection and try again.');

      // 2) Ask the backend to create a Razorpay order for the "pay now" amount.
      const rzp = await api.createPaymentOrder(payNow);

      // 3) Open Razorpay Checkout.
      const options = {
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency,
        order_id: rzp.orderId,
        name: 'Dillora by Kashvin',
        description: payment === 'half-cod' ? 'Pay 50% now — balance on delivery' : 'Order payment',
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#a64fd6' },
        // 4) On success, verify the signature server-side; the order is created only if valid.
        handler: async (response) => {
          try {
            const order = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order: orderPayload,
            });
            finishOrder(order);
          } catch (err) {
            setPlacing(false);
            setError(err.message || 'We could not confirm your payment. If you were charged, contact us with your payment id.');
          }
        },
        modal: {
          // User closed the popup without paying.
          ondismiss: () => { setPlacing(false); setError('Payment cancelled. Your cart is saved — you can try again.'); },
        },
      };

      const rzpCheckout = new window.Razorpay(options);
      rzpCheckout.on('payment.failed', (resp) => {
        setPlacing(false);
        setError(resp?.error?.description || 'Payment failed. Please try again.');
      });
      rzpCheckout.open();
    } catch (err) {
      setPlacing(false);
      setError(err.message || 'Something went wrong while starting the payment.');
    }
  };

  return (
    <div className="container section">
      <h1 className="pagetitle">Checkout</h1>
      <div className="grid grid-cols-1 items-start gap-7 min-[981px]:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          <section className="card p-6">
            <h3 className="mb-[18px]">Delivery details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.name} onChange={set('name')} span2 />
              <Field label="Phone (10-digit)" value={form.phone} onChange={set('phone')} />
              <Field label="Email (optional)" value={form.email} onChange={set('email')} />
              <Field label="Address" value={form.address} onChange={set('address')} span2 />
              <Field label="City" value={form.city} onChange={set('city')} />
              <Field label="Pincode" value={form.pincode} onChange={set('pincode')} />
            </div>
          </section>

          <section className="card p-6">
            <h3 className="mb-[18px]">Payment method</h3>
            <div className="flex flex-col gap-3">
              {PAYMENTS.map(p => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] border-[1.5px] p-4 transition-colors duration-150 ${payment===p.id ? 'border-orchid-500 bg-[#f9f2fd]' : 'border-[#eee3f3]'}`}>
                  <input type="radio" name="pay" value={p.id} checked={payment===p.id} onChange={() => setPayment(p.id)} className="h-[18px] w-[18px] accent-orchid-500" />
                  <div className="flex flex-col">
                    <strong>{p.title}</strong>
                    <span className="muted text-[0.85rem]">{p.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-3.5 rounded-[10px] bg-cream-2 px-3 py-2.5 text-[0.82rem] text-ink-soft">🔒 Secure payment powered by Razorpay — UPI, cards &amp; netbanking supported.</p>
          </section>
        </div>

        <aside className="card static p-[22px] min-[981px]:sticky min-[981px]:top-[90px]">
          <h3 className="mb-4">Order summary</h3>
          {items.map(l => (
            <div key={l.lineId} className="flex justify-between gap-2.5 border-b border-dashed border-[#eee3f3] py-2 text-[0.9rem]">
              <span>{l.name} <em className="muted">×{l.qty}</em></span>
              <span>₹{(l.price*l.qty).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-[0.95rem]"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>

          {/* Coupon */}
          <div className="mb-1 border-b border-dashed border-[#eee3f3] py-3">
            {!coupon ? (
              <>
                <div className="flex gap-2">
                  <input className="flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] px-3 py-2.5 font-semibold uppercase tracking-[0.05em]" value={couponInput}
                         onChange={e => setCouponInput(e.target.value.toUpperCase())}
                         placeholder="Discount code" />
                  <button className="btn btn-ghost px-4 py-2.5" disabled={checking || !couponInput} onClick={applyCoupon}>
                    {checking ? '…' : 'Apply'}
                  </button>
                </div>
                {couponMsg && <p className="mt-2 text-[0.82rem] text-[#c4495b]">{couponMsg}</p>}
              </>
            ) : (
              <div className="flex items-center justify-between rounded-[10px] bg-[#f9f2fd] px-3.5 py-2.5 text-[0.9rem] text-orchid-600">
                <span>✓ <strong>{coupon.code}</strong> applied</span>
                <button className="text-[0.82rem] font-semibold text-[#c4495b]" onClick={removeCoupon}>Remove</button>
              </div>
            )}
          </div>

          {discount > 0 && (
            <div className="flex justify-between py-2 text-[0.95rem] font-semibold text-[#3f9d6b]"><span>Discount</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>
          )}
          <div className="flex justify-between py-2 text-[0.95rem]"><span>Shipping</span><span>{shipping===0?'Free':`₹${shipping}`}</span></div>
          <div className="mt-2 flex justify-between border-t-[1.5px] border-[#eee3f3] pb-2 pt-3.5 text-[1.1rem] font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          {payNow > 0 && payNow < total &&
            <div className="flex justify-between py-2 text-[0.95rem] font-bold text-orchid-600"><span>Pay now</span><span>₹{payNow.toLocaleString('en-IN')}</span></div>}
          {error && <p className="my-2 text-[0.9rem] font-semibold text-[#c4495b]">{error}</p>}
          <button className="btn btn-primary btn-block mt-4" disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, span2 }) {
  return (
    <label className={`flex flex-col gap-1.5 ${span2 ? 'sm:col-span-2' : ''}`}>
      <span className="text-[0.82rem] font-semibold text-ink-soft">{label}</span>
      <input value={value} onChange={onChange}
             className="rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-[13px] py-[11px] text-ink focus:border-[#cf9eec] focus:outline-none" />
    </label>
  );
}
