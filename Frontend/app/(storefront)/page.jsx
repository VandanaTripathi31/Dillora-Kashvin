'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Heart, Truck } from 'lucide-react';

import { useCategories } from '@/context/CategoriesContext';
import { api } from '@/data/api';
import { ProductCard, Spinner } from '@/components/UI';
import Reveal from '@/components/Reveal';
import Testimonials from '@/components/Testimonials';
import CategoryStrip from '@/components/CategoryStrip';
import Reels from '@/components/Reels';
import HeroSparkles from '@/components/HeroSparkles';
import AnimatedCounter from '@/components/AnimatedCounter';

const statNum = 'bg-grad-brand bg-clip-text font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none text-transparent';
const statLabel = 'text-[0.85rem] font-medium text-ink-soft';

export default function Home() {
  const [best, setBest] = useState(null);
  const { categories } = useCategories();
  useEffect(() => { api.getBestsellers(8).then(setBest); }, []);

  return (
    <div className="home">
      {/* Hero — editorial */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__mesh hero__mesh--1" />
          <div className="hero__mesh hero__mesh--2" />
          <div className="hero__mesh hero__mesh--3" />
        </div>
        <HeroSparkles count={18} />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow"><Sparkles /> Handmade in India · Made to order</span>
            <h1 className="hero__title">Little things,<br/><span className="hero__title-italic">made with love.</span></h1>
            <p className="hero__sub">
              Phone covers, charms, crochet &amp; resin art — each piece crafted by hand,
              just for you. Find something that feels like yours.
            </p>
            <div className="hero__cta">
              <Link href="/c/mobile-covers" className="btn btn-primary btn-lg">Shop the collection</Link>
              <Link href="/c/resin-art" className="btn btn-ghost btn-lg">Explore Resin Art</Link>
            </div>
            <div className="hero__social">
              <div className="hero__avatars" aria-hidden="true">
                {[['A','#a64fd6','#7a4ff0'],['K','#e57fc4','#a64fd6'],['M','#8b63ef','#bd80e0'],['R','#f5a623','#e57fc4']].map(([l,c1,c2]) => (
                  <span key={l} style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>{l}</span>
                ))}
              </div>
              <div className="hero__socialtext">
                <strong>8,000+</strong><span>happy customers</span>
              </div>
              <div className="hero__socialdiv" />
              <div className="hero__rate">
                <b>★★★★★</b><span>4.8 average rating</span>
              </div>
            </div>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero__halo" />
            <div className="hero__blob hero__blob--main">
              <img src="/images/resin-art/wall-clock/01.jpg" alt="" />
            </div>
            <div className="hero__blob hero__blob--2">
              <img src="/images/mobile-covers/soft-case/01.jpg" alt="" />
            </div>
            <div className="hero__blob hero__blob--3">
              <img src="/images/crochet/coin-pouch/01.jpg" alt="" />
            </div>
            <div className="hero__badge hero__badge--rating">
              <span className="hero__badgeicon">★</span>
              <div><b>4.8 / 5</b><span>2,000+ reviews</span></div>
            </div>
            <div className="hero__badge hero__badge--made">🧶 100% Handmade</div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <CategoryStrip />

      {/* About us / craft story band */}
      <section className="craft" id="about">
        <div className="container craft__inner">
          <Reveal className="craft__media shine-img">
            <img src="https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&w=700&q=80" alt="Handmade crafting" />
          </Reveal>
          <Reveal className="craft__copy" delay={120}>
            <span className="craft__eyebrow">About us · Our craft</span>
            <h2>Made by hand,<br/>made to last.</h2>
            <p>
              Dillora by Kashvin began with a simple idea — that the little things we carry
              every day should feel personal. Each piece is shaped slowly, by hand — poured,
              stitched, beaded and finished with care. No mass production, no shortcuts.
              Just little things made with a lot of love.
            </p>
            <ul className="craft__points">
              <li><span className="craft__ico"><Sparkles /></span> Hand-poured, stitched &amp; beaded in-house</li>
              <li><span className="craft__ico"><Heart /></span> Made to order — crafted just for you</li>
              <li><span className="craft__ico"><Truck /></span> Lovingly packed &amp; delivered pan-India</li>
            </ul>
            <Link href="/about" className="btn btn-primary craft__btn">See how it&apos;s made <ArrowRight /></Link>
          </Reveal>
        </div>
      </section>

      {/* Animated stats band */}
      <section className="bg-[linear-gradient(120deg,#f9f2fd,#fdf3fb)] py-14">
        <div className="container grid grid-cols-2 gap-x-4 gap-y-7 text-center sm:grid-cols-4 sm:gap-6">
          <div className="flex flex-col gap-1">
            <AnimatedCounter end={8000} suffix="+" className={statNum} />
            <span className={statLabel}>Happy customers</span>
          </div>
          <div className="flex flex-col gap-1">
            <AnimatedCounter end={1200} suffix="+" className={statNum} />
            <span className={statLabel}>Handmade pieces</span>
          </div>
          <div className="flex flex-col gap-1">
            <AnimatedCounter end={50} suffix="+" className={statNum} />
            <span className={statLabel}>Cities delivered</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={statNum}>4.8<span className="ml-0.5 text-[0.7em] text-[#e8a93a] [-webkit-text-fill-color:#e8a93a]">★</span></span>
            <span className={statLabel}>Average rating</span>
          </div>
        </div>
      </section>

      {/* Reels / promo videos */}
      <Reels />

      {/* Per-category sections */}
      {categories.map(cat => <CategorySection key={cat.id} cat={cat} />)}

      {/* Bestsellers */}
      <section className="container section">
        <div className="section__head">
          <h2>Loved by everyone</h2>
          <span className="muted">Our most-ordered pieces</span>
        </div>
        {!best ? <Spinner /> : (
          <div className="grid">
            {best.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Reassurance band */}
      <section className="mx-auto mt-6 max-w-[1240px] rounded-[28px] bg-[linear-gradient(120deg,#f1e2fb,#fbe2f4_50%,#ffe7d8)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-10 py-10">
          {[
            ['Made to order', 'Every piece crafted after you order'],
            ['Free shipping', 'On prepaid orders over ₹299'],
            ['Pan-India delivery', 'Delivered across the country'],
            ['Pay your way', 'Online or half-COD'],
          ].map(([title, desc]) => (
            <div key={title} className="flex flex-col gap-1">
              <strong className="font-display text-[1.05rem] text-orchid-600">{title}</strong>
              <span className="text-[0.88rem] text-ink-soft">{desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Each category gets a soft, on-brand panel theme so the homepage reads as a
// sequence of distinct collections instead of one long white canvas.
const CAT_THEME = {
  'mobile-covers': { panel: 'linear-gradient(135deg,#faf5fe 0%,#f3e9fb 100%)', border: 'rgba(166,79,214,.16)', blob: 'rgba(166,79,214,.22)', accent: '#7a2c98', bar: 'linear-gradient(90deg,#a64fd6,#7a4ff0)' },
  'mobile-charms': { panel: 'linear-gradient(135deg,#fdf5fb 0%,#fbe6f3 100%)', border: 'rgba(229,127,196,.20)', blob: 'rgba(229,127,196,.24)', accent: '#a32c83', bar: 'linear-gradient(90deg,#e57fc4,#a64fd6)' },
  'crochet':       { panel: 'linear-gradient(135deg,#f6f2fe 0%,#ece4fd 100%)', border: 'rgba(139,99,239,.18)', blob: 'rgba(139,99,239,.22)', accent: '#5a34c2', bar: 'linear-gradient(90deg,#8b63ef,#a64fd6)' },
  'resin-art':     { panel: 'linear-gradient(135deg,#f3f1fe 0%,#eaeefb 100%)', border: 'rgba(122,79,240,.18)', blob: 'rgba(122,79,240,.22)', accent: '#5733c9', bar: 'linear-gradient(90deg,#7a4ff0,#e57fc4)' },
  'tshirts':       { panel: 'linear-gradient(135deg,#fff8f2 0%,#ffe9da 100%)', border: 'rgba(247,181,138,.30)', blob: 'rgba(247,181,138,.30)', accent: '#9a5a2a', bar: 'linear-gradient(90deg,#f7b58a,#e57fc4)' },
};

function CategorySection({ cat }) {
  const [items, setItems] = useState(null);
  useEffect(() => { api.getByCategory(cat.id).then(list => setItems(list.slice(0, 4))); }, [cat.id]);

  const t = CAT_THEME[cat.id] || CAT_THEME['mobile-covers'];

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
      <div
        className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] border px-5 sm:px-10 py-9 sm:py-12"
        style={{ background: t.panel, borderColor: t.border, boxShadow: '0 12px 40px -18px rgba(122,79,240,.28)' }}
      >
        {/* decorative colour blob */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full blur-3xl"
             style={{ background: t.blob }} aria-hidden="true" />

        {/* header */}
        <div className="relative flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h2 className="font-display text-[1.7rem] sm:text-4xl font-semibold leading-tight" style={{ color: '#2c2336' }}>{cat.name}</h2>
            <div className="h-[3px] w-11 rounded-full mt-3 mb-2.5" style={{ background: t.bar }} />
            <p className="text-sm" style={{ color: '#6b5f78' }}>{cat.tagline}</p>
          </div>
          <Link
            href={`/c/${cat.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white/80 backdrop-blur border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
            style={{ color: t.accent, borderColor: t.border }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* sub-category chips */}
        <div className="relative flex flex-wrap gap-2.5 mb-8">
          {cat.subs.map(s => (
            <Link
              key={s.id}
              href={`/c/${cat.id}/${s.id}`}
              className="px-4 py-2 rounded-full text-[0.84rem] font-semibold text-ink-soft bg-white/85 backdrop-blur border border-white/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:border-transparent hover:shadow-lg hover:bg-gradient-to-br hover:from-orchid-500 hover:to-violet-500"
            >
              {s.name}
            </Link>
          ))}
        </div>

        {/* products */}
        {!items ? <Spinner /> : (
          <div className="grid relative">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
