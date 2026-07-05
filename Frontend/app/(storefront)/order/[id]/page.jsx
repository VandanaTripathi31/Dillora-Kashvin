'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/data/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/UI';

export default function OrderConfirm() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null); // null = loading, false = not found

  useEffect(() => {
    // 1) Prefer the order we just placed (stashed at checkout) — no auth needed.
    try {
      const cached = JSON.parse(sessionStorage.getItem('dilora_last_order') || 'null');
      if (cached && cached.id === id) { setOrder(cached); return; }
    } catch { /* ignore */ }
    // 2) Otherwise find it among the signed-in customer's own orders (public by-phone endpoint).
    if (user?.phone) {
      api.getOrdersByPhone(user.phone).then(list => setOrder(list.find(o => o.id === id) || false)).catch(() => setOrder(false));
    } else {
      setOrder(false);
    }
  }, [id, user]);

  if (order === null) return <div className="container section"><Spinner /></div>;
  if (!order) return (
    <div className="container section">
      <h2>Order not found</h2>
      <p className="muted">We couldn&apos;t find this order. If you just placed it, check your account for order history.</p>
      <Link href="/" className="btn btn-ghost">Back home</Link>
    </div>
  );

  const label = { online:'Paid online', 'half-cod':'Half online + COD', cod:'Cash on delivery' }[order.payment];

  return (
    <div className="container section max-w-[560px] text-center">
      <div className="mx-auto mb-[18px] grid h-16 w-16 place-items-center rounded-full bg-[#3f9d6b] text-[1.8rem] text-white">✓</div>
      <h1 className="mb-2 text-[1.8rem]">Thank you{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}!</h1>
      <p className="muted">Your order <strong>{order.id}</strong> is placed and now in production.</p>

      <div className="card my-7 p-[22px] text-left">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between gap-2.5 border-b border-dashed border-[#eee3f3] py-2 text-[0.9rem]">
            <span>{it.name} <em className="muted">×{it.qty}</em><br/><small className="muted">{it.options}</small></span>
            <span>₹{(it.price*it.qty).toLocaleString('en-IN')}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t-[1.5px] border-[#eee3f3] pb-2 pt-3.5 text-[1.1rem] font-bold"><span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between py-2 text-[0.95rem]"><span>Payment</span><span>{label}</span></div>
        <div className="flex justify-between py-2 text-[0.95rem]"><span>Deliver to</span><span className="text-right">{order.customer?.address}</span></div>
      </div>

      <Link href="/" className="btn btn-primary">Continue shopping</Link>
    </div>
  );
}
