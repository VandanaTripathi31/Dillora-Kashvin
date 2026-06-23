'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CATEGORIES } from '@/data/catalog';
import { api } from '@/data/api';
import { ProductCard, Spinner } from '@/components/UI';
import Reveal from '@/components/Reveal';
import Reels from '@/components/Reels';
import HeroSparkles from '@/components/HeroSparkles';
import AnimatedCounter from '@/components/AnimatedCounter';

const CAT_IMG = {
  'mobile-covers': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80',
  'mobile-charms': 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80',
  'tshirts':       'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  'crochet':       'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
  'resin-art':     'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80',
};

export default function Home() {
  const [best, setBest] = useState(null);
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
        <HeroSparkles count={16} />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__eyebrow">Handmade in India · Made to order</span>
            <h1 className="hero__title">Little things,<br/><span className="hero__title-italic">made with love.</span></h1>
            <p className="hero__sub">
              Phone covers, charms, crochet &amp; resin art — each piece crafted by hand,
              just for you. Find something that feels like yours.
            </p>
            <div className="hero__cta">
              <Link href="/c/mobile-covers" className="btn btn-primary btn-lg">Shop the collection</Link>
              <Link href="/c/resin-art" className="btn btn-ghost btn-lg">Explore Resin Art</Link>
            </div>
            <div className="hero__trust">
              <span>★ 4.8 rated</span><i/><span>8,000+ happy customers</span><i/><span>Free shipping ₹299+</span>
            </div>
          </div>
          <div className="hero__art" aria-hidden="true">
            <div className="hero__card hero__card--1">
              <img src="https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80" alt="" />
            </div>
            <div className="hero__card hero__card--2">
              <img src="https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=400&q=80" alt="" />
            </div>
            <div className="hero__card hero__card--3">
              <img src="https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=400&q=80" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="container catstrip">
        {CATEGORIES.map(c => (
          <Link key={c.id} href={`/c/${c.id}`} className="catstrip__item">
            <div className="catstrip__circle"><img src={CAT_IMG[c.id]} alt={c.name} /></div>
            <span>{c.name}</span>
          </Link>
        ))}
      </section>

      {/* Craft story band */}
      <section className="craft">
        <div className="container craft__inner">
          <Reveal className="craft__media">
            <img src="https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15?auto=format&fit=crop&w=700&q=80" alt="Handmade crafting" />
          </Reveal>
          <Reveal className="craft__copy" delay={120}>
            <span className="eyebrow">Our craft</span>
            <h2>Made by hand,<br/>made to last.</h2>
            <p>
              Every Dillora piece begins as an idea and is shaped slowly, by hand — poured,
              stitched, beaded and finished with care. No mass production, no shortcuts.
              Just little things made with a lot of love.
            </p>
            <Link href="/c/crochet" className="craft__link">See how it's made →</Link>
          </Reveal>
        </div>
      </section>

      {/* Animated stats band */}
      <section className="stats-band">
        <div className="container stats-band__grid">
          <div className="stat-item">
            <AnimatedCounter end={8000} suffix="+" className="stat-item__num" />
            <span className="stat-item__label">Happy customers</span>
          </div>
          <div className="stat-item">
            <AnimatedCounter end={1200} suffix="+" className="stat-item__num" />
            <span className="stat-item__label">Handmade pieces</span>
          </div>
          <div className="stat-item">
            <AnimatedCounter end={50} suffix="+" className="stat-item__num" />
            <span className="stat-item__label">Cities delivered</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__num">4.8<span className="stat-item__star">★</span></span>
            <span className="stat-item__label">Average rating</span>
          </div>
        </div>
      </section>

      {/* Reels / promo videos */}
      <Reels />

      {/* Per-category sections */}
      {CATEGORIES.map(cat => <CategorySection key={cat.id} cat={cat} />)}

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
      <section className="testi">
        <div className="container">
          <div className="testi__head">
            <span className="eyebrow">Loved &amp; shared</span>
            <h2>What our customers say</h2>
          </div>
          <div className="testi__grid">
            {[
              { q: 'The resin wall clock is even prettier in person. You can tell it was made by hand.', n: 'Aarohi M.', t: 'Pune' },
              { q: 'My phone cover is exactly the design I wanted. So many compliments already!', n: 'Sara K.', t: 'Bengaluru' },
              { q: 'Ordered crochet flowers for my mom — packaging and quality were lovely.', n: 'Rohan V.', t: 'Mumbai' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 90} className="testi__card">
                <div className="testi__stars">★★★★★</div>
                <p>"{t.q}"</p>
                <span className="testi__name">{t.n} · <em>{t.t}</em></span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Reassurance band */}
      <section className="band">
        <div className="container band__grid">
          <div><strong>Made to order</strong><span>Every piece crafted after you order</span></div>
          <div><strong>Free shipping</strong><span>On prepaid orders over ₹299</span></div>
          <div><strong>Pan-India delivery</strong><span>Delivered across the country</span></div>
          <div><strong>Pay your way</strong><span>Online or half-COD</span></div>
        </div>
      </section>
    </div>
  );
}

function CategorySection({ cat }) {
  const [items, setItems] = useState(null);
  useEffect(() => { api.getByCategory(cat.id).then(list => setItems(list.slice(0, 4))); }, [cat.id]);

  return (
    <section className="container section">
      <div className="section__head">
        <div>
          <h2>{cat.name}</h2>
          <span className="muted">{cat.tagline}</span>
        </div>
        <Link href={`/c/${cat.id}`} className="section__all">View all →</Link>
      </div>
      <div className="subpills">
        {cat.subs.map(s => (
          <Link key={s.id} href={`/c/${cat.id}/${s.id}`} className="subpill">{s.name}</Link>
        ))}
      </div>
      {!items ? <Spinner /> : (
        <div className="grid">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
