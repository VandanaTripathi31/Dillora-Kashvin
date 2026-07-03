'use client';
import Link from 'next/link';

import { useCart } from '@/context/CartContext';

export default function Cart() {
  const { items, remove, setQty, subtotal, count } = useCart();
  const shipping = subtotal >= 299 || subtotal === 0 ? 0 : 49;

  if (count === 0) return (
    <div className="container section empty">
      <h2>Your cart is empty</h2>
      <p className="muted">Pick something handmade to get started.</p>
      <Link href="/" className="btn btn-primary">Start shopping</Link>
    </div>
  );

  return (
    <div className="container section">
      <h1 className="pagetitle">Your cart</h1>
      <div className="grid grid-cols-1 min-[981px]:grid-cols-[1fr_340px] items-start gap-7">
        <div className="flex flex-col gap-3.5">
          {items.map(l => (
            <div key={l.lineId} className="card flex items-center gap-4 p-4">
              <img src={l.image} alt={l.name} className="h-[88px] w-[88px] rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-body text-[1.02rem] font-semibold">{l.name}</h3>
                <p className="muted mb-2.5 mt-1 text-[0.85rem]">{l.options}</p>
                <div className="qty qty--sm">
                  <button onClick={() => setQty(l.lineId, l.qty-1)} aria-label="Decrease">−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => setQty(l.lineId, l.qty+1)} aria-label="Increase">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="price">₹{(l.price*l.qty).toLocaleString('en-IN')}</span>
                <button className="text-[0.82rem] font-semibold text-[#c4495b]" onClick={() => remove(l.lineId)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="card static p-[22px] min-[981px]:sticky min-[981px]:top-[90px]">
          <h3 className="mb-4">Order summary</h3>
          <div className="flex justify-between py-2 text-[0.95rem]"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between py-2 text-[0.95rem]"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
          <div className="mt-2 flex justify-between border-t-[1.5px] border-[#eee3f3] pb-2 pt-3.5 text-[1.1rem] font-bold"><span>Total</span><span>₹{(subtotal+shipping).toLocaleString('en-IN')}</span></div>
          <Link href="/checkout" className="btn btn-primary btn-block mt-4">Checkout</Link>
          <Link href="/" className="mt-3.5 block text-center text-[0.88rem] text-ink-soft">← Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
