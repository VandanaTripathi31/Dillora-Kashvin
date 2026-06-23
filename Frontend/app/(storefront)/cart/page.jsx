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
      <div className="cartlayout">
        <div className="cartlist">
          {items.map(l => (
            <div key={l.lineId} className="cartline card">
              <img src={l.image} alt={l.name} className="cartline__img" />
              <div className="cartline__info">
                <h3>{l.name}</h3>
                <p className="muted">{l.options}</p>
                <div className="qty qty--sm">
                  <button onClick={() => setQty(l.lineId, l.qty-1)} aria-label="Decrease">−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => setQty(l.lineId, l.qty+1)} aria-label="Increase">+</button>
                </div>
              </div>
              <div className="cartline__right">
                <span className="price">₹{(l.price*l.qty).toLocaleString('en-IN')}</span>
                <button className="cartline__rm" onClick={() => remove(l.lineId)}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="summary card">
          <h3>Order summary</h3>
          <div className="summary__row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div className="summary__row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
          <div className="summary__row summary__total"><span>Total</span><span>₹{(subtotal+shipping).toLocaleString('en-IN')}</span></div>
          <Link href="/checkout" className="btn btn-primary btn-block">Checkout</Link>
          <Link href="/" className="summary__cont">← Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
