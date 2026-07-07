'use client';
import { useEffect, useState } from 'react';
import { Search, Download, Mail } from 'lucide-react';
import { api } from '@/services/api';
import { Spinner } from '@/components/UI';
import { notify } from '@/components/AdminToaster';

const payLabel = { online: 'Paid online', 'half-cod': 'Half + COD', cod: 'COD' };
const rupee = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState(null);
  const [query, setQuery] = useState('');
  const [payFilter, setPayFilter] = useState('All');
  const [open, setOpen] = useState(null);       // invoice in modal
  const [emailDraft, setEmailDraft] = useState('');
  const [busy, setBusy] = useState('');

  const load = () => api.getInvoices().then(setInvoices);
  useEffect(() => { load(); }, []);

  const downloadPdf = async (inv) => {
    setBusy(`dl-${inv.id}`);
    try {
      const blob = await api.downloadInvoice(inv.orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${inv.id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      notify('Invoice downloaded');
    } catch {
      notify('Could not download invoice', 'error');
    } finally { setBusy(''); }
  };

  const openInvoice = (inv) => { setOpen(inv); setEmailDraft(inv.customer?.email || ''); };

  const sendEmail = async (inv) => {
    const to = (emailDraft || inv.customer?.email || '').trim();
    if (!to) { notify('Enter an email address first', 'error'); return; }
    setBusy(`em-${inv.id}`);
    const res = await api.emailInvoice(inv.orderId, to);
    setBusy('');
    if (res?.error) { notify(res.error, 'error'); return; }
    notify(`Invoice emailed to ${to}`);
    load();
    setOpen((o) => (o && o.id === inv.id ? { ...o, emailedAt: Date.now(), emailedTo: to } : o));
  };

  if (!invoices) return <div className="adm__pad"><Spinner /></div>;

  const byPay = payFilter === 'All' ? invoices : invoices.filter((i) => i.payment === payFilter);
  const q = query.trim().toLowerCase();
  const shown = q
    ? byPay.filter((i) =>
        i.id.toLowerCase().includes(q) ||
        (i.orderId || '').toLowerCase().includes(q) ||
        (i.customer?.name || '').toLowerCase().includes(q) ||
        (i.customer?.phone || '').includes(q))
    : byPay;

  return (
    <div className="adm__pad">
      <header className="adm__head">
        <h1>Invoices</h1>
        <p className="muted">Every order generates an invoice automatically. Search, download the PDF, or email it to the customer.</p>
      </header>

      <div className="subtabs">
        {['All', 'online', 'half-cod'].map((p) => (
          <button key={p} className={`subtab ${payFilter === p ? 'subtab--on' : ''}`} onClick={() => setPayFilter(p)}>
            {p === 'All' ? 'All' : payLabel[p]}
          </button>
        ))}
      </div>

      <div className="adm__searchrow">
        <div className="adm__search">
          <Search className="h-[18px] w-[18px]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by invoice no, order ID, name or phone…" />
          {query && <button className="adm__searchclear" onClick={() => setQuery('')} aria-label="Clear search">✕</button>}
        </div>
        <span className="muted text-[0.85rem]">{shown.length} {shown.length === 1 ? 'invoice' : 'invoices'}</span>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr>
            <th>Invoice</th><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Emailed</th><th></th>
          </tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} className="p-7 text-center text-ink-soft">No invoices yet — they’re created when orders are placed.</td></tr>
            ) : shown.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.id}<br/><small className="muted">{new Date(inv.issuedAt).toLocaleDateString('en-IN')}</small></td>
                <td><small>{inv.orderId}</small></td>
                <td>{inv.customer?.name}<br/><small className="muted">{inv.customer?.phone}</small></td>
                <td>{rupee(inv.total)}</td>
                <td><small>{payLabel[inv.payment] || inv.payment}</small></td>
                <td>
                  {inv.emailedAt ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Sent</span>
                  ) : (
                    <span className="muted text-[12px]">—</span>
                  )}
                </td>
                <td className="tbl__actions whitespace-nowrap">
                  <button onClick={() => downloadPdf(inv)} disabled={busy === `dl-${inv.id}`} title="Download PDF">
                    {busy === `dl-${inv.id}` ? '…' : 'PDF'}
                  </button>
                  <button onClick={() => openInvoice(inv)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Invoice {open.id}</h3>
              <button className="modal__x" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>

            <div className="p-1">
              <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
                <div>
                  <strong>{open.customer?.name}</strong><br/>
                  <span className="muted">{open.customer?.phone}</span><br/>
                  {open.customer?.email && <span className="muted">{open.customer.email}</span>}
                  {open.customer?.address && <><br/><span className="muted">{open.customer.address}</span></>}
                </div>
                <div className="text-right text-[13px] muted">
                  Order {open.orderId}<br/>
                  {new Date(open.issuedAt).toLocaleString('en-IN')}<br/>
                  {payLabel[open.payment] || open.payment}
                </div>
              </div>

              <table className="tbl mb-3">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
                <tbody>
                  {open.items?.map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}{it.options ? <><br/><small className="muted">{it.options}</small></> : null}</td>
                      <td>{it.qty}</td>
                      <td>{rupee(it.price)}</td>
                      <td>{rupee((it.price || 0) * (it.qty || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto max-w-[260px] text-sm">
                <div className="flex justify-between py-0.5"><span className="muted">Subtotal</span><span>{rupee(open.subtotal)}</span></div>
                {open.discount > 0 && <div className="flex justify-between py-0.5 text-emerald-700"><span>Discount</span><span>- {rupee(open.discount)}</span></div>}
                {open.gst?.percent > 0 && open.gst?.amount > 0 && (
                  <div className="flex justify-between py-0.5 muted"><span>GST @ {open.gst.percent}% (incl.)</span><span>{rupee(open.gst.amount)}</span></div>
                )}
                <div className="mt-1 flex justify-between border-t border-[#eadff5] pt-1.5 font-bold text-orchid-600"><span>Total</span><span>{rupee(open.total)}</span></div>
              </div>

              {/* Email + download actions */}
              <div className="mt-5 border-t border-[#eee3f3] pt-4">
                {open.emailedAt && (
                  <p className="muted mb-2 text-[13px]">Last emailed to <strong>{open.emailedTo}</strong> on {new Date(open.emailedAt).toLocaleString('en-IN')}.</p>
                )}
                <label className="mb-1.5 block text-[0.8rem] font-bold uppercase tracking-wide text-ink-soft">Email invoice to</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="customer@email.com"
                    className="h-11 flex-1 rounded-[10px] border-[1.5px] border-[#eee3f3] bg-white px-3.5 text-ink focus:border-orchid-500 focus:outline-none"
                  />
                  <button className="btn inline-flex items-center gap-2" onClick={() => downloadPdf(open)} disabled={busy === `dl-${open.id}`}>
                    <Download className="h-4 w-4" /> PDF
                  </button>
                  <button className="btn btn-primary inline-flex items-center gap-2" onClick={() => sendEmail(open)} disabled={busy === `em-${open.id}`}>
                    <Mail className="h-4 w-4" /> {busy === `em-${open.id}` ? 'Sending…' : open.emailedAt ? 'Resend' : 'Send'}
                  </button>
                </div>
                <p className="muted mt-2 text-[12px]">Emailing requires SMTP to be configured on the backend.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
