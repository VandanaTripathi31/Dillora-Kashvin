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
import DeliveryInfo from '@/components/DeliveryInfo';
import HowToOrderPopup from '@/components/HowToOrderPopup';

const RECENT_KEY = 'dilora_recent';
const SIZE_GUIDE = [
  { size: 'S',   chest: 38, length: 27 },
  { size: 'M',   chest: 40, length: 28 },
  { size: 'L',   chest: 42, length: 29 },
  { size: 'XL',  chest: 44, length: 30 },
  { size: 'XXL', chest: 46, length: 31 },
];

// Reusable option styles (Tailwind) shared across the option groups.
const optLabel = 'mb-2 block text-[0.8rem] font-bold uppercase tracking-[0.05em] text-ink-soft';
const optNote = 'mb-4 mt-1 text-[0.9rem] text-ink-soft';
const optSelect = 'w-full max-w-[360px] rounded-xl border-[1.5px] border-[#eee3f3] bg-white px-3.5 py-3 text-ink transition-[border-color,box-shadow] duration-[180ms] focus:border-orchid-500 focus:shadow-[0_0_0_3px_rgba(166,79,214,.15)] focus:outline-none';
const pillBase = 'rounded-xl border-[1.5px] px-4 py-2.5 text-[0.9rem] font-semibold transition-all duration-[180ms] ease-brand';
const pillOff = 'border-[#eee3f3] bg-white text-ink hover:-translate-y-0.5 hover:border-[#cf9eec] hover:shadow-soft';
const pillOn = 'border-orchid-500 bg-[#f9f2fd] text-orchid-600 shadow-[0_0_0_1px_#a64fd6]';

export default function Product() {
  const { id } = useParams();
  const router = useRouter();
  const { add } = useCart();
  const { showDiscounts } = useSettings();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [material, setMaterial] = useState(null);
  const [brands, setBrands] = useState([]);        // [{id,name,models:[{id,name}]}]
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelOther, setModelOther] = useState(false); // "not listed" → free text
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

  // Active phone brands + models — admin-managed, fetched once on mount.
  useEffect(() => {
    let alive = true;
    api.getBrands()
      .then((list) => { if (alive) setBrands(Array.isArray(list) ? list : []); })
      .catch(() => { /* keep static fallback */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setActiveImg(0); setBrand(''); setModel(''); setModelOther(false); setSize('');
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

  // Phone brand/model dropdown data (admin-managed, with a static fallback if
  // the backend has no brands seeded yet). "Other" always stays available so an
  // unlisted phone can still be ordered via free text.
  const brandNames = brands.length ? brands.map((b) => b.name) : PHONE_BRANDS.filter((b) => b !== 'Other');
  const selBrand = brands.find((b) => b.name === brand);
  const brandModels = selBrand?.models || [];
  // Fall back to a text field when the brand is "Other", has no models listed,
  // or the customer explicitly chose "not listed".
  const useModelText = brand === 'Other' || (!!brand && brandModels.length === 0) || modelOther;

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
      if (!brand) return { ok:false, msg:'Please select your phone brand.' };
      if (!model.trim()) return { ok:false, msg:'Please enter your phone model.' };
      return { ok:true, str:`${brand} · ${model.trim()}${material ? ' · ' + material.name : ''}` };
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
      {/* How-to-order popup (admin image or built-in illustrated design) */}
      <HowToOrderPopup />
      <nav className="mb-[18px] flex flex-wrap gap-2 text-[0.85rem] text-ink-soft [&_a:hover]:text-orchid-600">
        <Link href="/">Home</Link> <span>/</span>
        <Link href={`/c/${cat.id}`}>{cat.name}</Link> <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-7 min-[981px]:grid-cols-2 min-[981px]:gap-12">
        {/* Gallery — kept as scoped CSS (bespoke zoom + fade animation) */}
        <div className="pdp__media">
          <div
            className={`pdp__main pdp__main--zoom ${zoom ? 'pdp__main--zoomed' : ''}`}
            ref={mainRef}
            onDoubleClick={onZoomToggle}
            onClick={() => { if (zoom) setZoom(null); }}
          >
            <img
              key={activeImg}
              className="pdp__fadeimg"
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
        <div>
          <span className="chip">{cat.name}</span>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__rating"><Rating id={product.id} /></div>
          <div className="pdp__price"><Price price={unitPrice} mrp={product.mrp} /></div>
          <p className="mb-6 text-[0.9rem] font-semibold text-[#3f9d6b]">✓ Free shipping · Made to order (3–5 days)</p>

          {/* Material (covers) */}
          {product.materials?.length > 0 && (
            <div className="mb-5">
              <label className={optLabel}>Material</label>
              <div className="flex flex-wrap gap-2.5">
                {product.materials.map(m => (
                  <button key={m.name}
                    className={`${pillBase} ${material?.name===m.name?pillOn:pillOff}`}
                    onClick={() => setMaterial(m)}>
                    {m.name} · ₹{m.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phone brand + model — brand→model dropdowns (admin-managed) */}
          {product.optionType === 'phone' && (
            <>
              <p className={optNote}>Pick your phone — the same design is made to fit your exact model.</p>
              <div className="mb-5">
                <label className={optLabel}>Phone brand</label>
                <select className={optSelect} value={brand}
                        onChange={e => { setBrand(e.target.value); setModel(''); setModelOther(false); }}>
                  <option value="">Choose brand</option>
                  {brandNames.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="Other">Other (not listed)</option>
                </select>
              </div>
              {brand && (
                <div className="mb-5">
                  <label className={optLabel}>Phone model</label>
                  {useModelText ? (
                    <input
                      className={optSelect}
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder={
                        brand === 'Apple' ? 'e.g. iPhone 16 Pro Max'
                        : brand === 'Samsung' ? 'e.g. Galaxy S25 Ultra'
                        : brand === 'OnePlus' ? 'e.g. OnePlus 13'
                        : brand === 'Other' ? 'e.g. brand + model'
                        : 'e.g. your exact model'
                      }
                    />
                  ) : (
                    <select
                      className={optSelect}
                      value={model}
                      onChange={e => {
                        if (e.target.value === '__other__') { setModelOther(true); setModel(''); }
                        else setModel(e.target.value);
                      }}
                    >
                      <option value="">Choose model</option>
                      {brandModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      <option value="__other__">My model isn’t listed…</option>
                    </select>
                  )}
                  <p className="mt-2 text-[0.9rem] text-ink-soft">
                    {useModelText
                      ? 'Type your exact model so we craft the cover to fit perfectly.'
                      : 'Select your exact model so we craft the cover to fit perfectly.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Size (t-shirts) */}
          {product.optionType === 'size' && (
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <label className={optLabel}>Size</label>
                <button type="button" className="cursor-pointer border-none bg-transparent p-0 text-[0.82rem] font-semibold text-orchid-600 hover:text-violet-500" onClick={() => setShowGuide(true)}>📏 Size guide</button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map(s => (
                  <button key={s} className={`${pillBase} min-w-[48px] ${size===s?pillOn:pillOff}`}
                          onClick={() => setSize(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Resin customization */}
          {product.optionType === 'resin' && (
            <div className="mb-5 rounded-[18px] border-[1.5px] border-[#f1e2fb] bg-[#f9f2fd] p-[18px]">
              <p className="mb-4 text-[0.9rem] text-ink-soft">
                Make it yours — tell us your colours and share a reference. Our team will confirm details before crafting.
              </p>
              <div className="mb-5">
                <label className={optLabel}>Preferred colour</label>
                <input className={optSelect} value={resinColor} onChange={e => setResinColor(e.target.value)}
                       placeholder="e.g. lilac & gold, ocean blue" />
              </div>
              <div className="mb-5">
                <label className={optLabel}>Background / theme</label>
                <input className={optSelect} value={resinBg} onChange={e => setResinBg(e.target.value)}
                       placeholder="e.g. marble white, floral, galaxy" />
              </div>
              <div className="mb-5">
                <label className={optLabel}>Anything else you&apos;d like</label>
                <textarea className={`${optSelect} min-h-[70px] resize-y leading-[1.5]`} value={resinNotes} onChange={e => setResinNotes(e.target.value)}
                          placeholder="Names, dates, size, ideas — anything that helps us make it perfect" rows={3} />
              </div>
              <div className="mb-5">
                <label className={optLabel}>Reference photo (optional)</label>
                {!refPhoto ? (
                  <label className="flex cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-[#cf9eec] bg-white p-[18px] text-[0.9rem] font-semibold text-orchid-600 transition-all duration-150 hover:border-orchid-500 hover:bg-[#f9f2fd]">
                    <input type="file" accept="image/*" onChange={onRefPhoto} hidden />
                    <span>＋ Upload a photo of what you want</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-3.5">
                    <img src={refPhoto.dataUrl} alt="reference" className="h-[72px] w-[72px] rounded-xl object-cover" />
                    <div className="flex flex-col gap-1.5">
                      <span className="muted">{refPhoto.name}</span>
                      <button className="text-left text-[0.82rem] font-semibold text-[#c4495b]" onClick={() => setRefPhoto(null)}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5">
            <label className={optLabel}>Quantity</label>
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q-1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q+1)} aria-label="Increase">+</button>
            </div>
          </div>

          {err && <p className="my-2 text-[0.9rem] font-semibold text-[#c4495b]">{err}</p>}

          <div className="my-6 flex gap-3">
            <button className="btn btn-primary btn-block" onClick={() => handleAdd(false)}>Add to cart</button>
            <button className="btn btn-accent btn-block" onClick={() => handleAdd(true)}>Buy now</button>
            <button className={`btn btn-ghost w-[52px] shrink-0 grow-0 basis-auto py-3 ${has(product.id) ? 'border-violet-500 text-violet-500' : 'text-ink-soft'}`}
                    onClick={() => toggle(product.id)} aria-label="Save to wishlist" title="Save to wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill={has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7.5-4.7-10-9.3C.5 8.5 2 5 5.3 5c2 0 3.3 1.2 4.2 2.4C10.4 6.2 11.7 5 13.7 5 17 5 18.5 8.5 17 11.7 14.5 16.3 12 21 12 21z"/>
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="border-t border-[#eee3f3] pt-5">
            <h4 className="mb-2.5">Product details</h4>
            <ul className="m-0 list-disc pl-[18px] text-[0.92rem] text-ink-soft [&_li]:mb-1.5">
              <li>Handmade, made to order</li>
              {product.optionType === 'phone' && <li>Printed/crafted for your exact phone model</li>}
              {product.optionType === 'size' && <li>Relaxed oversize fit · soft cotton</li>}
              <li>Actual product may slightly differ from photos</li>
            </ul>
          </div>

          {/* Delivery, returns & policies (admin-managed) */}
          <DeliveryInfo />
        </div>
      </div>

      {/* Customer reviews */}
      <div className="container">
        <ProductReviews productId={product.id} />
      </div>

      {/* You may also like */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-[clamp(1.4rem,2.4vw,1.9rem)] tracking-[-0.5px]">You may also like</h2>
          <div className="grid">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recent.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-[clamp(1.4rem,2.4vw,1.9rem)] tracking-[-0.5px]">Recently viewed</h2>
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
              <button className="modal__x" onClick={() => setShowGuide(false)} aria-label="Close">✕</button>
            </div>
            <p className="muted" style={{ fontSize: '.88rem', marginBottom: 12 }}>
              Measurements in inches. Oversize fit — if you&apos;re between sizes, size down for a less roomy look.
            </p>
            <table className="sizeguide">
              <thead><tr><th>Size</th><th>Chest</th><th>Length</th></tr></thead>
              <tbody>
                {SIZE_GUIDE.map(r => (
                  <tr key={r.size}><td><strong>{r.size}</strong></td><td>{r.chest}&quot;</td><td>{r.length}&quot;</td></tr>
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
