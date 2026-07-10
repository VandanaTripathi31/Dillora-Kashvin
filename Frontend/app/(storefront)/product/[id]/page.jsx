'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import { api } from '@/data/api';
import { PHONE_BRANDS, findCategory, galleryFor } from '@/data/catalog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSettings } from '@/context/SettingsContext';
import { Price, Toast, Rating, ProductCard, ErrorRetry } from '@/components/UI';
import Reveal from '@/components/Reveal';
import ProductReviews from '@/components/ProductReviews';
import ProductPolicy from '@/components/ProductPolicy';
import DeliveryInfo from '@/components/DeliveryInfo';
import Pagination from '@/components/Pagination';
import { waLink, customizeMessage } from '@/lib/whatsapp';
import { BLUR } from '@/lib/img';
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
  const { showDiscounts, settings } = useSettings();
  const { has, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [productErr, setProductErr] = useState(null); // failed/timed-out product load
  const [reloadKey, setReloadKey] = useState(0);       // bump to retry the load
  const [material, setMaterial] = useState(null);
  const [brands, setBrands] = useState([]);        // [{id,name,models:[{id,name}]}]
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [modelOther, setModelOther] = useState(false); // "not listed" → free text
  const [size, setSize] = useState('');
  const [color, setColor] = useState(''); // selected colour variant name
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [zoom, setZoom] = useState(null); // {x,y} percent or null
  const [showGuide, setShowGuide] = useState(false);
  const [related, setRelated] = useState(null); // { items, mode, page, totalPages, total }
  const [relPage, setRelPage] = useState(1);
  const [recent, setRecent] = useState([]);
  const [offers, setOffers] = useState([]);      // active promotional offers
  const [ratingSummary, setRatingSummary] = useState(null); // { avg, count }
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
    setProductErr(null);
    setActiveImg(0); setBrand(''); setModel(''); setModelOther(false); setSize('');
    setQty(1); setMaterial(null); setErr(''); setZoom(null);
    setResinColor(''); setResinBg(''); setResinNotes(''); setRefPhoto(null);
    setColor(''); setRelated(null); setRelPage(1);

    api.getProduct(id).then(p => {
      if (!alive || !p) return;
      setProduct(p);
      if (p?.materials?.length) setMaterial(p.materials[0]);

      // recently viewed: read existing, show others, then prepend this id
      try {
        const ids = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        const others = ids.filter(x => x !== p.id);
        if (others.length) {
          api.getProducts().then(all => {
            if (!alive) return;
            const map = new Map(all.map(x => [x.id, x]));
            setRecent(others.map(x => map.get(x)).filter(Boolean).slice(0, 4));
          }).catch(() => {}); // "recently viewed" is optional — ignore failures
        } else { setRecent([]); }
        const next = [p.id, ...others].slice(0, 8);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
    }).catch((e) => { if (alive) setProductErr(e); }); // no more infinite spinner
    return () => { alive = false; };
  }, [id, reloadKey]);

  // Cross-sell: admin-managed pairings (covers → charms) or same-category
  // "you may also like", paginated. Refetches when the page changes.
  useEffect(() => {
    if (!product?.id) return;
    let alive = true;
    api.getRelated(product.id, relPage, 8).then(r => { if (alive) setRelated(r); }).catch(() => {});
    return () => { alive = false; };
  }, [product?.id, relPage]);

  // Active offers (Special Offers box) + rating summary (verified-reviews seal).
  useEffect(() => {
    if (!product?.id) return;
    let alive = true;
    api.getActiveOffers().then(o => { if (alive) setOffers(Array.isArray(o) ? o : []); }).catch(() => {});
    api.getRatingSummary(product.id).then(s => { if (alive) setRatingSummary(s); }).catch(() => {});
    return () => { alive = false; };
  }, [product?.id]);

  if (productErr) {
    // A 404 means the product genuinely doesn't exist; anything else is a
    // network/timeout failure the shopper can retry.
    if (productErr.status === 404) {
      return (
        <div className="container section">
          <h2>Product not found</h2>
          <p className="muted mt-1">This piece may have sold out or been removed.</p>
          <Link href="/" className="btn btn-ghost mt-4">Back home</Link>
        </div>
      );
    }
    return (
      <div className="container section">
        <ErrorRetry error={productErr} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }
  if (!product) return <ProductPageSkeleton />;

  const cat = findCategory(product.category);
  const gallery = galleryFor(product);
  const unitPrice = material ? material.price : product.price;

  // Only mobile-covers track real stock; everything else is made to order and
  // always available. So "Sold out" / low-stock only applies to covers.
  const tracksStock = product.category === 'mobile-covers';
  const outOfStock = tracksStock && (Number(product.stock) || 0) <= 0;
  const lowStock = tracksStock && product.stock > 0 && product.stock <= 5;

  // Admin-managed colour variants (T-shirts, crochet, etc.). Shown as a swatch
  // picker whenever the product has any.
  const colorList = product.colorOptions || [];
  const hasColors = colorList.length > 0;

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
    let base = '';
    if (product.optionType === 'phone') {
      if (!brand) return { ok:false, msg:'Please select your phone brand.' };
      if (!model.trim()) return { ok:false, msg:'Please enter your phone model.' };
      base = `${brand} · ${model.trim()}${material ? ' · ' + material.name : ''}`;
    } else if (product.optionType === 'size') {
      if (!size) return { ok:false, msg:'Please select a size.' };
      base = `${cat.subs.find(s=>s.id===product.sub)?.name || ''} · Size ${size}`;
    } else if (product.optionType === 'resin') {
      const parts = [];
      if (resinColor) parts.push(`Colour: ${resinColor}`);
      if (resinBg) parts.push(`Background: ${resinBg}`);
      if (resinNotes) parts.push(`Note: ${resinNotes}`);
      if (refPhoto) parts.push('Reference photo attached');
      base = parts.length ? parts.join(' · ') : 'Standard (no customization)';
    }

    // Admin-managed colour variants apply to any product that has them.
    if (hasColors && !color) return { ok:false, msg:'Please choose a colour.' };

    const parts = [];
    if (base && base !== '—') parts.push(base);
    if (hasColors && color) parts.push(`Colour: ${color}`);
    return { ok:true, str: parts.length ? parts.join(' · ') : '—' };
  };

  const handleAdd = (buyNow) => {
    if (outOfStock) { setErr('This piece is currently sold out.'); return; }
    const opt = buildOptions();
    if (!opt.ok) { setErr(opt.msg); return; }
    setErr('');
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category, // store the category ID (e.g. "mobile-covers"),
                                  // not the display name — the COD/covers-only
                                  // and offer logic all key off the id.
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
            <Image
              key={activeImg}
              className="pdp__fadeimg"
              src={gallery[activeImg]}
              alt={product.name}
              fill
              sizes="(max-width: 980px) 100vw, 45vw"
              priority
              placeholder="blur"
              blurDataURL={BLUR}
              style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
            <span className="pdp__zoomhint">{zoom ? '⤢ Tap to zoom out' : '⤢ Double-tap to zoom'}</span>
          </div>
          {gallery.length > 1 && (
            <div className="pdp__thumbs">
              {gallery.map((g, i) => (
                <button key={i} className={`pdp__thumb ${i===activeImg?'pdp__thumb--on':''}`} onClick={() => setActiveImg(i)}>
                  <Image src={g} alt="" width={64} height={64} sizes="64px" placeholder="blur" blurDataURL={BLUR} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + options */}
        <div>
          <span className="chip">{cat.name}</span>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__rating flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating id={product.id} />
            {ratingSummary?.count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef7f0] px-2.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wide text-[#2e9e6b]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/></svg>
                {ratingSummary.count} Verified Review{ratingSummary.count === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="pdp__price"><Price price={unitPrice} mrp={product.mrp} /></div>
          {outOfStock ? (
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#f6e9ee] px-3 py-1 text-[0.9rem] font-bold text-[#c4495b]">● Sold out</p>
          ) : lowStock ? (
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#fdf1e3] px-3 py-1 text-[0.9rem] font-bold text-[#c9892f]">● Only {product.stock} left — order soon</p>
          ) : null}
          <p className="mb-4 text-[0.9rem] font-semibold text-[#3f9d6b]">✓ Free shipping · Made to order (3–5 days)</p>

          {/* Special Offers (active promotions) */}
          {offers.length > 0 && (
            <div className="mb-6 rounded-2xl border border-[#eadff5] bg-[linear-gradient(135deg,#faf3fe,#fdf0f8)] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[0.82rem] font-bold uppercase tracking-wide text-orchid-600">🎁 Special offers</p>
              <ul className="m-0 flex flex-col gap-1.5 p-0">
                {offers.map(o => (
                  <li key={o.id} className="flex items-start gap-2 text-[0.9rem] text-ink">
                    <span className="mt-0.5 text-[#2e9e6b]">✓</span>
                    <span><strong>{o.name}</strong>{o.description ? ` — ${o.description}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          {/* Colour variants (admin-managed) — dropdown; colours come dynamically
              from the product's colorOptions set in the admin dashboard. */}
          {hasColors && (
            <div className="mb-5">
              <label className={optLabel}>
                Colour
                {color && (() => {
                  const sel = colorList.find((c) => c.name === color);
                  return (
                    <span className="ml-1.5 inline-flex items-center gap-1.5 normal-case text-ink-soft">
                      ·
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-black/10 bg-cover bg-center align-middle"
                        style={sel?.image ? { backgroundImage: `url(${sel.image})` } : { background: sel?.hex || '#e9e2f2' }}
                        aria-hidden="true"
                      />
                      {color}
                    </span>
                  );
                })()}
              </label>
              <select
                className={optSelect}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Select colour"
              >
                <option value="">Select a colour</option>
                {colorList.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5">
            <label className={optLabel}>Quantity</label>
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q-1))} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => {
                // Cap at available stock for tracked items; a sane max for
                // made-to-order (stock 0 = not tracked).
                const max = product.stock > 0 ? product.stock : 20;
                return Math.min(max, q + 1);
              })} aria-label="Increase">+</button>
            </div>
          </div>

          {err && <p className="my-2 text-[0.9rem] font-semibold text-[#c4495b]">{err}</p>}

          <div className="my-6 flex gap-3">
            <button className="btn btn-primary btn-block" onClick={() => handleAdd(false)} disabled={outOfStock}>{outOfStock ? 'Sold out' : 'Add to cart'}</button>
            {!outOfStock && <button className="btn btn-accent btn-block" onClick={() => handleAdd(true)}>Buy now</button>}
            <button
              onClick={() => toggle(product.id)}
              aria-label={has(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
              title="Save to wishlist"
              className={`inline-flex w-[54px] shrink-0 cursor-pointer items-center justify-center self-stretch rounded-2xl border-[1.5px] transition-colors ${has(product.id) ? 'border-violet-500 bg-[#f5f0ff] text-violet-500' : 'border-[#eee3f3] bg-white text-ink-soft hover:border-violet-300 hover:text-violet-500'}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>

          {/* Want something custom? Chat on WhatsApp (pre-filled with this product) */}
          {settings?.whatsappNumber && (() => {
            const opt = buildOptions();
            const href = waLink(settings.whatsappNumber, customizeMessage(settings.whatsappTemplate, product, opt.ok ? opt.str : ''));
            return (
              <a href={href} target="_blank" rel="noreferrer"
                 className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#25D366] px-4 py-3 font-semibold text-[#128C4B] transition-colors hover:bg-[#25D366]/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Customize on WhatsApp
              </a>
            );
          })()}

          {/* Collapsible info accordions (reference-site layout) */}
          <div className="mt-1">
            <details className="group border-t border-[#eee3f3] py-3" open>
              <summary className="flex cursor-pointer list-none items-center gap-2.5 py-1 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true">📋</span>
                <span className="flex-1">Product details</span>
                <span className="text-ink-soft transition-transform group-open:rotate-180">⌄</span>
              </summary>
              <ul className="m-0 mt-2.5 list-disc pl-[18px] text-[0.92rem] text-ink-soft [&_li]:mb-1.5">
                <li>Handmade, made to order</li>
                {product.optionType === 'phone' && <li>Printed/crafted for your exact phone model</li>}
                {product.optionType === 'size' && <li>Relaxed oversize fit · soft cotton</li>}
                <li>Actual product may slightly differ from photos</li>
              </ul>
            </details>

            {/* Shipping & Return Policy — dynamic, per product category */}
            <ProductPolicy category={product.category} />

            {/* Also available for — supported phones (cover products only) */}
            {product.optionType === 'phone' && brands.length > 0 && (
              <details className="group border-t border-[#eee3f3] py-3">
                <summary className="flex cursor-pointer list-none items-center gap-2.5 py-1 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true">📱</span>
                  <span className="flex-1">Also available for</span>
                  <span className="text-ink-soft transition-transform group-open:rotate-180">⌄</span>
                </summary>
                <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-soft">
                  Made to fit all major phones — {brands.map(b => b.name).join(', ')} and more.
                  Just pick your exact model above and we&apos;ll craft it to fit.
                </p>
              </details>
            )}
          </div>

          {/* Delivery estimate & extra info (admin-managed) */}
          <DeliveryInfo />
        </div>
      </div>

      {/* Customer reviews */}
      <div className="container">
        {/* Authenticity / trust seal */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-[#eadff5] bg-[linear-gradient(135deg,#faf3fe,#fff5ef)] px-5 py-4 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-orchid-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z"/></svg>
            100% Handmade · Authenticity Guaranteed
          </span>
          {ratingSummary?.count > 0 && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2e9e6b]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              {ratingSummary.count} Verified Review{ratingSummary.count === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <ProductReviews productId={product.id} />
      </div>

      {/* Cross-sell: "Pair it with a charm" (covers) or "You may also like" (others) */}
      {related?.items?.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-[clamp(1.4rem,2.4vw,1.9rem)] tracking-[-0.5px]">
            {related.mode === 'charms' ? 'Pair it with a charm ✨' : 'You may also like'}
          </h2>
          <div className="grid">
            {related.items.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
          <Pagination page={related.page} totalPages={related.totalPages} onPage={setRelPage} />
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
        <button className="btn btn-primary stickybar__btn" onClick={() => handleAdd(false)} disabled={outOfStock}>{outOfStock ? 'Sold out' : 'Add to cart'}</button>
      </div>

      <Toast message={toast} />
    </div>
  );
}

// Content-shaped placeholder shown while the product loads — mirrors the .pdp
// gallery + info layout so there's no jump when the real page arrives.
function ProductPageSkeleton() {
  return (
    <div className="container section">
      <div className="pdp">
        <div className="flex flex-col gap-3">
          <div className="skel aspect-square w-full rounded-[18px]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-2">
          <div className="skel h-8 w-3/4" />
          <div className="skel h-5 w-1/3" />
          <div className="skel h-7 w-1/4" />
          <div className="skel h-24 w-full rounded-xl" />
          <div className="skel h-12 w-full max-w-[360px] rounded-xl" />
          <div className="skel h-12 w-44 rounded-full" />
        </div>
      </div>
    </div>
  );
}
