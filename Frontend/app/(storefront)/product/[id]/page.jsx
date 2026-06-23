'use client';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { api } from '@/data/api';
import { PHONE_BRANDS, findCategory, galleryFor } from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import { Price, Spinner, Toast, Rating, ProductCard } from '@/components/UI';
import Reveal from '@/components/Reveal';
import ProductReviews from '@/components/ProductReviews';

const RECENT_KEY = 'dilora_recent';
const SIZE_GUIDE = [
  { size: 'S',   chest: 38, length: 27 },
  { size: 'M',   chest: 40, length: 28 },
  { size: 'L',   chest: 42, length: 29 },
  { size: 'XL',  chest: 44, length: 30 },
  { size: 'XXL', chest: 46, length: 31 },
];

export default function Product() {
  const { id } = useParams();
  const router = useRouter();
  const { add } = useCart();
  const { showDiscounts } = useSettings();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [material, setMaterial] = useState(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [zoom, setZoom] = useState(null); // {x,y} percent or null
  const [showGuide, setShowGuide] = useState(false);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);
  const mainRef = useRef(null);

  // resin customization
  const [resinColor, setResinColor] = useState('');
  const [resinBg, setResinBg] = useState('');
  const [resinNotes, setResinNotes] = useState('');
  const [refPhoto, setRefPhoto] = useState(null); // { name, dataUrl }

  const onRefPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Reference photo must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setRefPhoto({ name: file.name, dataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setActiveImg(0); setBrand(''); setModel(''); setSize('');
    setQty(1); setMaterial(null); setErr(''); setZoom(null);
    setResinColor(''); setResinBg(''); setResinNotes(''); setRefPhoto(null);

    api.getProduct(id).then(p => {
      if (!alive || !p) return;
      setProduct(p);
      if (p?.materials?.length) setMaterial(p.materials[0]);

      // related products: same category, excluding this one
      api.getByCategory(p.category).then(list => {
        if (!alive) return;
        setRelated(list.filter(x => x.id !== p.id).slice(0, 4));
      });

      // recently viewed: read existing, show others, then prepend this id
      try {
        const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        const others = ids.filter(x => x !== p.id);
        if (others.length) {
          api.getProducts().then(all => {
            if (!alive) return;
            const map = new Map(all.map(x => [x.id, x]));
            setRecent(others.map(x => map.get(x)).filter(Boolean).slice(0, 4));
          });
        } else { setRecent([]); }
        const next = [p.id, ...others].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
    });
    return () => { alive = false; };
  }, [id]);

  if (!product) return <div className="container section"><Spinner /></div>;

  const cat = findCategory(product.category);
  const gallery = galleryFor(product);
  const unitPrice = material ? material.price : product.price;

  // Double-tap / double-click to zoom in at that point; tap again to zoom out.
  // No hover zoom — it was distracting while just browsing.
  const onZoomToggle = (e) => {
    if (zoom) { setZoom(null); return; }      // already zoomed -> zoom out
    const r = mainRef.current?.getBoundingClientRect();
    if (!r) return;
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const x = ((point.clientX - r.left) / r.width) * 100;
    const y = ((point.clientY - r.top) / r.height) * 100;
    setZoom({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  // build the human-readable option string + validate
  const buildOptions = () => {
    if (product.optionType === 'phone') {
      if (!brand || !model) return { ok:false, msg:'Please select your phone brand and model.' };
      return { ok:true, str:`${brand} · ${model}${material ? ' · ' + material.name : ''}` };
    }
    if (product.optionType === 'size') {
      if (!size) return { ok:false, msg:'Please select a size.' };
      return { ok:true, str:`${cat.subs.find(s=>s.id===product.sub)?.name || ''} · Size ${size}` };
    }
    if (product.optionType === 'resin') {
      const parts = [];
      if (resinColor) parts.push(`Colour: ${resinColor}`);
      if (resinBg) parts.push(`Background: ${resinBg}`);
      if (resinNotes) parts.push(`Note: ${resinNotes}`);
      if (refPhoto) parts.push('Reference photo attached');
      return { ok:true, str: parts.length ? parts.join(' · ') : 'Standard (no customization)' };
    }
    return { ok:true, str:'—' };
  };

  const handleAdd = (buyNow) => {
    const opt = buildOptions();
    if (!opt.ok) { setErr(opt.msg); return; }
    setErr('');
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: cat.name,
      options: opt.str,
      refPhoto: refPhoto?.dataUrl || null,
      price: unitPrice,
      qty,
    });
    if (buyNow) { router.push('/cart'); return; }
    setToast('Added to cart');
    setTimeout(() => setToast(''), 1600);
  };

  return (
    <div className="container section">
      <nav className="crumbs">
        <Link href="/">Home</Link> <span>/</span>
        <Link href={`/c/${cat.id}`}>{cat.name}</Link> <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        {/* Gallery */}
        <div className="pdp__media">
          <div
            className={`pdp__main pdp__main--zoom ${zoom ? 'pdp__main--zoomed' : ''}`}
            ref={mainRef}
            onDoubleClick={onZoomToggle}
            onClick={() => { if (zoom) setZoom(null); }}
          >
            <img
              src={gallery[activeImg]}
              alt={product.name}
              style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
            <span className="pdp__zoomhint">{zoom ? '⤢ Tap to zoom out' : '⤢ Double-tap to zoom'}</span>
          </div>
          {gallery.length > 1 && (
            <div className="pdp__thumbs">
              {gallery.map((g, i) => (
                <button key={i} className={`pdp__thumb ${i===activeImg?'pdp__thumb--on':''}`} onClick={() => setActiveImg(i)}>
                  <img src={g} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + options */}
        <div className="pdp__info">
          <span className="chip">{cat.name}</span>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__rating"><Rating id={product.id} /></div>
          <div className="pdp__price"><Price price={unitPrice} mrp={product.mrp} /></div>
          <p className="pdp__free">✓ Free shipping · Made to order (3–5 days)</p>

          {/* Material (covers) */}
          {product.materials?.length > 0 && (
            <div className="opt">
              <label className="opt__label">Material</label>
              <div className="opt__row">
                {product.materials.map(m => (
                  <button key={m.name}
                    className={`opt__pill ${material?.name===m.name?'opt__pill--on':''}`}
                    onClick={() => setMaterial(m)}>
                    {m.name} · ₹{m.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phone brand + model */}
          {product.optionType === 'phone' && (
            <>
              <p className="opt__note">Select your phone — the same design is made for your model.</p>
              <div className="opt">
                <label className="opt__label">Phone brand</label>
                <select className="opt__select" value={brand}
                        onChange={e => { setBrand(e.target.value); setModel(''); }}>
                  <option value="">Choose brand</option>
                  {Object.keys(PHONE_BRANDS).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {brand && (
                <div className="opt">
                  <label className="opt__label">Model</label>
                  <select className="opt__select" value={model} onChange={e => setModel(e.target.value)}>
                    <option value="">Choose model</option>
                    {PHONE_BRANDS[brand].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Size (t-shirts) */}
          {product.optionType === 'size' && (
            <div className="opt">
              <div className="opt__labelrow">
                <label className="opt__label">Size</label>
                <button type="button" className="opt__guidelink" onClick={() => setShowGuide(true)}>📏 Size guide</button>
              </div>
              <div className="opt__row">
                {product.sizes.map(s => (
                  <button key={s} className={`opt__pill opt__pill--sq ${size===s?'opt__pill--on':''}`}
                          onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Resin customization */}
          {product.optionType === 'resin' && (
            <div className="resinbox">
              <p className="opt__note" style={{ marginTop: 0 }}>
                Make it yours — tell us your colours and share a reference. Our team will confirm details before crafting.
              </p>
              <div className="opt">
                <label className="opt__label">Preferred colour</label>
                <input className="opt__select" value={resinColor} onChange={e => setResinColor(e.target.value)}
                       placeholder="e.g. lilac & gold, ocean blue" />
              </div>
              <div className="opt">
                <label className="opt__label">Background / theme</label>
                <input className="opt__select" value={resinBg} onChange={e => setResinBg(e.target.value)}
                       placeholder="e.g. marble white, floral, galaxy" />
              </div>
              <div className="opt">
                <label className="opt__label">Anything else you'd like</label>
                <textarea className="opt__select opt__textarea" value={resinNotes} onChange={e => setResinNotes(e.target.value)}
                          placeholder="Names, dates, size, ideas — anything that helps us make it perfect" rows={3} />
              </div>
              <div className="opt">
                <label className="opt__label">Reference photo (optional)</label>
                {!refPhoto ? (
                  <label className="refupload">
                    <input type="file" accept="image/*" onChange={onRefPhoto} hidden />
                    <span>＋ Upload a photo of what you want</span>
                  </label>
                ) : (
                  <div className="refpreview">
                    <img src={refPhoto.dataUrl} alt="reference" />
                    <div>
                      <span className="muted">{refPhoto.name}</span>
                      <button className="cartline__rm" onClick={() => setRefPhoto(null)}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="opt">
            <label className="opt__label">Quantity</label>
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q-1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q+1)} aria-label="Increase">+</button>
            </div>
          </div>

          {err && <p className="opt__err">{err}</p>}

          <div className="pdp__actions">
            <button className="btn btn-primary btn-block" onClick={() => handleAdd(false)}>Add to cart</button>
            <button className="btn btn-accent btn-block" onClick={() => handleAdd(true)}>Buy now</button>
            <button className={`btn btn-ghost pdp__wish ${has(product.id) ? 'pdp__wish--on' : ''}`}
                    onClick={() => toggle(product.id)} aria-label="Save to wishlist" title="Save to wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7.5-4.7-10-9.3C.5 8.5 2 5 5.3 5c2 0 3.3 1.2 4.2 2.4C10.4 6.2 11.7 5 13.7 5 17 5 18.5 8.5 17 11.7 14.5 16.3 12 21 12 21z"/>
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="pdp__details">
            <h4>Product details</h4>
            <ul>
              <li>Handmade, made to order</li>
              {product.optionType === 'phone' && <li>Printed/crafted for your exact phone model</li>}
              {product.optionType === 'size' && <li>Relaxed oversize fit · soft cotton</li>}
              <li>Actual product may slightly differ from photos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Customer reviews */}
      <div className="container">
        <ProductReviews productId={product.id} />
      </div>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="pdp__rel">
          <h2 className="pdp__relh">You may also like</h2>
          <div className="grid">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recent.length > 0 && (
        <section className="pdp__rel">
          <h2 className="pdp__relh">Recently viewed</h2>
          <div className="grid">
            {recent.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Size guide modal */}
      {showGuide && (
        <div className="modal" onClick={() => setShowGuide(false)}>
          <div className="modal__box modal__box--sm" onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Size guide</h3>
              <button className="modal__x" onClick={() => setShowGuide(false)}>✕</button>
            </div>
            <p className="muted" style={{ fontSize: '.88rem', marginBottom: 12 }}>
              Measurements in inches. Oversize fit — if you're between sizes, size down for a less roomy look.
            </p>
            <table className="sizeguide">
              <thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead>
              <tbody>
                {SIZE_GUIDE.map(r => (
                  <tr key={r.size}><td><strong>{r.size}</strong></td><td>{r.chest}"</td><td>{r.length}"</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticky mobile add-to-cart bar */}
      <div className="stickybar">
        <div className="stickybar__info">
          <span className="stickybar__price">₹{unitPrice.toLocaleString('en-IN')}</span>
          {showDiscounts && product.mrp > unitPrice && <span className="stickybar__mrp">₹{product.mrp.toLocaleString('en-IN')}</span>}
        </div>
        <button className="btn btn-primary stickybar__btn" onClick={() => handleAdd(false)}>Add to cart</button>
      </div>

      <Toast message={toast} />
    </div>
  );
}
