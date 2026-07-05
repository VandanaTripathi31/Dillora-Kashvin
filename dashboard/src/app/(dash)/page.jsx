'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Wallet, ShoppingBag, Package, TrendingUp } from 'lucide-react';

import { api } from '@/services/api';
import { Spinner } from '@/components/UI';

import { StatusPill } from '@/components/StatusPill';

export default function Dashboard() {
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api.getOrders().then(setOrders);
    api.getProducts().then(setProducts);
  }, []);

  if (!orders || !products) return <div className="adm__pad"><Spinner /></div>;

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'Processing').length;
  const lowStock = products.filter(p => (p.stock ?? 0) <= 8).length;

  // simple 7-bar trend from order dates
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const total = orders.filter(o => new Date(o.createdAt).toDateString() === key)
                        .reduce((s, o) => s + o.total, 0);
    return { label: d.toLocaleDateString('en-IN', { weekday:'short' }), total };
  });
  const max = Math.max(...days.map(d => d.total), 1);

  // Top products by units sold + revenue (from order items)
  const prodMap = new Map();
  const catMap = new Map();
  for (const o of orders) {
    for (const it of o.items) {
      const p = prodMap.get(it.name) || { name: it.name, units: 0, revenue: 0 };
      p.units += it.qty; p.revenue += it.price * it.qty; prodMap.set(it.name, p);
      const cat = it.category || 'Other';
      const c = catMap.get(cat) || { cat, units: 0, revenue: 0 };
      c.units += it.qty; c.revenue += it.price * it.qty; catMap.set(cat, c);
    }
  }
  const topProducts = Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topCats = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);
  const catMaxRev = Math.max(...topCats.map(c => c.revenue), 1);

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Overview</h1>
        <p className="muted">A quick look at how the store is doing.</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 min-[901px]:grid-cols-4">
        <Stat icon={Wallet} label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} hint="All orders" />
        <Stat icon={ShoppingBag} label="Orders" value={orders.length} hint={`${pending} processing`} />
        <Stat icon={Package} label="Products" value={products.length} hint={`${lowStock} low on stock`} />
        <Stat icon={TrendingUp} label="Avg. order" value={`₹${Math.round(revenue/orders.length || 0).toLocaleString('en-IN')}`} hint="Per order" />
      </div>

      <div className="adm__row">
        <section className="card adm__panel">
          <h3>Last 7 days</h3>
          <div className="flex h-[180px] items-end gap-3 pt-4">
            {days.map((d, i) => (
              <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="min-h-1 w-full max-w-[36px] rounded-t-lg bg-[linear-gradient(#bd7ce2,#cf9eec)] transition-[height,filter] duration-[400ms] group-hover:brightness-[1.08] group-hover:saturate-[1.1]" style={{ height: `${(d.total/max)*100}%` }} title={`₹${d.total}`} />
                <span className="text-[0.72rem] text-ink-soft">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card adm__panel">
          <div className="adm__panelhead">
            <h3>Recent orders</h3>
            <Link href="/orders" className="adm__seeall">See all →</Link>
          </div>
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer?.name}</td>
                  <td>₹{o.total.toLocaleString('en-IN')}</td>
                  <td><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="adm__row">
        <section className="card adm__panel">
          <h3>Top products</h3>
          {topProducts.length === 0 ? <p className="muted mt-2.5">No sales yet.</p> : (
            <table className="tbl mt-1.5">
              <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map(p => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.units}</td>
                    <td>₹{p.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card adm__panel">
          <h3>Best categories</h3>
          <div className="mt-2.5 flex flex-col gap-3.5">
            {topCats.length === 0 ? <p className="muted mt-2.5">No sales yet.</p> : topCats.map(c => (
              <div key={c.cat}>
                <div className="mb-1.5 flex justify-between text-[0.88rem] font-semibold">
                  <span>{c.cat}</span>
                  <span className="muted">₹{c.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f9f2fd]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#bd7ce2,#8b63ef)] transition-[width] duration-500" style={{ width: `${(c.revenue/catMaxRev)*100}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, icon: Icon }) {
  return (
    <div className="card relative flex flex-col gap-1 rounded-[18px] border border-[rgba(122,79,240,.08)] px-[22px] py-5 transition-[transform,box-shadow] duration-[250ms] ease-brand hover:-translate-y-[3px] hover:shadow-[0_14px_30px_-14px_rgba(122,79,240,.28)]">
      {Icon && <span className="absolute right-4 top-4 grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-[linear-gradient(135deg,#f9f2fd,#f1e2fb)] text-orchid-600"><Icon className="h-[19px] w-[19px]" /></span>}
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-ink-soft">{label}</span>
      <span className="bg-grad-brand bg-clip-text font-display text-[1.9rem] font-semibold text-transparent">{value}</span>
      <span className="muted text-[0.82rem]">{hint}</span>
    </div>
  );
}

