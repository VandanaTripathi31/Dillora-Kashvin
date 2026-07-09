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
// `coversOnly` options only appear when every item in the cart is a mobile
// cover (standard stock). Full COD is not offered for handmade / made-to-order
// items — those need an online or 50% advance payment.
const PAYMENTS = [
  { id:'online',  title:'Pay online',        desc:'UPI, QR, Cards, Net Banking & Wallets (full amount)' },
  { id:'half-cod',title:'Half online + COD', desc:'Pay 50% now, rest on delivery' },
  { id:'cod',     title:'Cash on Delivery',  desc:'Pay the full amount in cash when your order arrives', coversOnly:true },
];

export default function Checkout() {
  const { items, subtotal, clear, count } = useCart();
  const { user, saveAddress, addresses, defaultAddressId } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', email:'', address:'', city:'', pincode:'',
  });
  const [prefilled, setPrefilled] = useState(false);

  // Prefill from the default (or most recent) saved address, once.
  useEffect(() => {
    if (prefilled || !addresses.length) return;
    const def = addresses.find(a => a.id === defaultAddressId) || addresses[0];
    if (def) setForm(f => ({
      ...f,
      name: f.name || def.name || '', phone: f.phone || def.phone || '',
      address: def.address || '', city: def.city || '', pincode: def.pincode || '',
    }));
    setPrefilled(true);
  }, [addresses, defaultAddressId, prefilled]);

  const applySavedAddress = (a) => setForm(f => ({
    ...f, name: a.name || f.name, phone: a.phone || f.phone,
    address: a.address || '', city: a.city || '', pincode: a.pincode || '',
  }));
  const [payment, setPayment] = useState('online');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);

  // coupon state
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);       // { code, discount }
  const [couponMsg, setCouponMsg] = useState('');
  const [checking, setChecking] = useState(false);

  // auto-applied promotional offers
  const [offers, setOffers] = useState([]);          // [{ id, name, discount }]
  const [offerDiscount, setOfferDiscount] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!items.length) { setOffers([]); setOfferDiscount(0); return; }
    const payload = items.map(l => ({ productId: l.productId, category: l.category, price: l.price, qty: l.qty }));
    api.evaluateOffers(payload)
      .then(r => { if (alive) { setOffers(r.offers || []); setOfferDiscount(r.discount || 0); } })
      .catch(() => { if (alive) { setOffers([]); setOfferDiscount(0); } });
    return () => { alive = false; };
  }, [items]);

  const shipping = subtotal >= 299 ? 0 : 49;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount - offerDiscount) + shipping;
  const payNow = payment === 'half-cod' ? Math.round(total/2) : payment === 'cod' ? 0 : payment === 'online' ? total : 0;
  // Customized items (resin / reference-photo orders) can be reserved with 50% advance.
  const hasCustom = items.some(l => l.refPhoto || l.category === 'resin-art');
  // Full COD is offered only when the whole cart is mobile covers (standard stock).
  const allCovers = items.length > 0 && items.every(l => l.category === 'mobile-covers');
  const availablePayments = PAYMENTS.filter(p => !p.coversOnly || allCovers);

  // If COD was selected but the cart is no longer covers-only, fall back to online.
  useEffect(() => {
    if (payment === 'cod' && !allCovers) setPayment('online');
  }, [allCovers, payment]);

  // Cart count comes from localStorage (0 on the server), so gate the cart-empty
  // logic behind mount to keep server + first client render consistent.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Redirect to home only if the cart is empty AND we did not just place an order.
  useEffect(() => {
    if (mounted && count === 0 && !placing && !placed) router.push('/');
  }, [mounted, count, placing, placed, router]);

  if (!mounted) return null;
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
    offers: offers.map(o => ({ id:o.id, name:o.name, discount:o.discount })), offerDiscount,
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

    // Full Cash on Delivery — no online payment, place the order directly.
    if (payment === 'cod') {
      try {
        const order = await api.createOrder(orderPayload);
        finishOrder(order);
      } catch (err) {
        setPlacing(false);
        setError(err.message || 'Could not place your order. Please try again.');
      }
      return;
    }

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
        // Surface every enabled method (UPI incl. QR, cards, net banking, wallets).
        // We don't restrict methods, so Razorpay shows all that are enabled on the
        // account; show_default_blocks keeps them all visible & grouped.
        config: { display: { preferences: { show_default_blocks: true } } },
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

            {addresses.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[0.82rem] font-semibold text-ink-soft">Use a saved address</p>
                <div className="flex flex-wrap gap-2">
                  {addresses.map(a => {
                    const active = form.address === a.address && form.pincode === a.pincode;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => applySavedAddress(a)}
                        className={`rounded-xl border-[1.5px] px-3 py-2 text-left text-[0.82rem] transition-colors ${active ? 'border-orchid-500 bg-[#f9f2fd]' : 'border-[#eee3f3] hover:border-[#cf9eec]'}`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-ink">
                          {a.name}
                          {a.id === defaultAddressId && <span className="rounded-full bg-orchid-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orchid-600">Default</span>}
                        </span>
                        <span className="mt-0.5 block text-ink-soft">{a.address}, {a.city} {a.pincode}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
              {availablePayments.map(p => (
                <label key={p.id} className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] border-[1.5px] p-4 transition-colors duration-150 ${payment===p.id ? 'border-orchid-500 bg-[#f9f2fd]' : 'border-[#eee3f3]'}`}>
                  <input type="radio" name="pay" value={p.id} checked={payment===p.id} onChange={() => setPayment(p.id)} className="h-[18px] w-[18px] accent-orchid-500" />
                  <div className="flex flex-col">
                    <strong>{p.title}</strong>
                    <span className="muted text-[0.85rem]">{p.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {hasCustom && (
              <p className="mt-3.5 rounded-[10px] bg-[#fdf8ec] px-3 py-2.5 text-[0.82rem] font-medium text-[#8a6d1a]">
                🎨 You have a customised item — reserve it by paying just <strong>50% now</strong> with “Half online + COD”, and pay the balance on delivery.
              </p>
            )}
            {!allCovers && (
              <p className="mt-3.5 rounded-[10px] bg-cream-2 px-3 py-2.5 text-[0.82rem] text-ink-soft">
                💵 Cash on Delivery is available only for orders containing <strong>mobile covers</strong> alone.
              </p>
            )}
            {payment === 'cod' && (
              <p className="mt-3.5 rounded-[10px] bg-[#eef7f0] px-3 py-2.5 text-[0.82rem] font-medium text-[#2e7d52]">
                💵 You&apos;ll pay <strong>₹{total.toLocaleString('en-IN')}</strong> in cash when your order is delivered. No online payment needed now.
              </p>
            )}
            <p className="mt-3.5 rounded-[10px] bg-cream-2 px-3 py-2.5 text-[0.82rem] text-ink-soft">🔒 Secure payment powered by Razorpay — pay by <strong>UPI / QR scan, cards, net banking &amp; wallets</strong>. Choose your method in the payment window.</p>
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
          {offers.map(o => (
            <div key={o.id} className="flex justify-between gap-2 py-2 text-[0.9rem] font-semibold text-[#3f9d6b]">
              <span>🎁 {o.name}</span><span className="whitespace-nowrap">−₹{o.discount.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between py-2 text-[0.95rem]"><span>Shipping</span><span>{shipping===0?'Free':`₹${shipping}`}</span></div>
          <div className="mt-2 flex justify-between border-t-[1.5px] border-[#eee3f3] pb-2 pt-3.5 text-[1.1rem] font-bold"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          {payNow > 0 && payNow < total &&
            <div className="flex justify-between py-2 text-[0.95rem] font-bold text-orchid-600"><span>Pay now (50% advance)</span><span>₹{payNow.toLocaleString('en-IN')}</span></div>}
          {payment === 'half-cod' && (total - payNow) > 0 &&
            <div className="flex justify-between py-2 text-[0.9rem] text-ink-soft"><span>Balance on delivery</span><span>₹{(total - payNow).toLocaleString('en-IN')}</span></div>}
          {payment === 'cod' &&
            <div className="flex justify-between py-2 text-[0.95rem] font-bold text-[#2e7d52]"><span>Pay on delivery</span><span>₹{total.toLocaleString('en-IN')}</span></div>}
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
