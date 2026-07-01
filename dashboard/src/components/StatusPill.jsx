'use client';

// Shared status badge used in admin (dashboard, orders) and customer account.
export function StatusPill({ status }) {
  const cls = { Processing:'pill--warn', Shipped:'pill--info', Delivered:'pill--ok', Cancelled:'pill--bad' }[status] || '';
  return <span className={`pill ${cls}`}>{status}</span>;
}
