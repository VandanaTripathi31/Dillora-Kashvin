'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { api } from '@/data/api';
import { Spinner } from '@/components/UI';

export default function OrderConfirm() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { api.getOrders().then(list => setOrder(list.find(o => o.id === id))); }, [id]);

  if (!order) return <div className="container section"><Spinner /></div>;

  const label = { online:'Paid online', 'half-cod':'Half online + COD', cod:'Cash on delivery' }[order.payment];

  return (
    <div className="container section confirm">
      <div className="confirm__tick">✓</div>
      <h1>Thank you{order.customer?.name ? `, ${order.customer.name.split(' ')[0]}` : ''}!</h1>
      <p className="muted">Your order <strong>{order.id}</strong> is placed and now in production.</p>

      <div className="card confirm__card">
        {order.items.map((it, i) => (
          <div key={i} className="summary__item">
            <span>{it.name} <em className="muted">×{it.qty}</em><br/><small className="muted">{it.options}</small></span>
            <span>₹{(it.price*it.qty).toLocaleString('en-IN')}</span>
          </div>
        ))}
        <div className="summary__row summary__total"><span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span></div>
        <div className="summary__row"><span>Payment</span><span>{label}</span></div>
        <div className="summary__row"><span>Deliver to</span><span style={{textAlign:'right'}}>{order.customer?.address}</span></div>
      </div>

      <Link href="/" className="btn btn-primary">Continue shopping</Link>
    </div>
  );
}
