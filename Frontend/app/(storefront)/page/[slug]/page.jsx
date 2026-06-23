'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const PAGES = {
  shipping: { title:'Shipping', body:'Free shipping on prepaid orders over ₹299. Products are made to order — please allow 3–5 days for production before dispatch. A tracking link is shared once your order ships. Metros: 4–7 days · Rest of India: 6–10 days.' },
  returns:  { title:'Returns & Refund', body:'As items are handmade and made to order, we accept returns or replacements only for manufacturing defects or transit damage. Email support@kashvin.in within 48 hours of delivery with an unboxing video. We can exchange for fitting issues or wrong items delivered.' },
  privacy:  { title:'Privacy Policy', body:'We collect only the details needed to fulfil your order — name, phone, address and payment status. We never sell your data. Payment is processed securely by our payment partner.' },
  terms:    { title:'Terms of Service', body:'By placing an order you agree that handmade items may vary slightly from photos, and that orders moved to production cannot be cancelled. Prices and offers may change without notice.' },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const p = PAGES[slug];
  if (!p) return <div className="container section"><h2>Page not found</h2><Link href="/" className="btn btn-ghost">Home</Link></div>;
  return (
    <div className="container section policy">
      <h1 className="pagetitle">{p.title}</h1>
      <p>{p.body}</p>
      <p className="muted" style={{marginTop:24}}>Final policy text will be provided by Kashvin before launch (required for payment approval).</p>
    </div>
  );
}
