import Link from 'next/link';
import { Sparkles, Heart, Truck, ShieldCheck, Gift, Leaf } from 'lucide-react';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'About us',
  description:
    'The story behind Dillora by Kashvin — handmade mobile covers, charms, crochet, resin art and oversize tees, lovingly made to order in India.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Dillora by Kashvin',
    description:
      'Handmade with love in India. Phone covers, charms, crochet and resin art — each piece crafted slowly, by hand, just for you.',
    url: '/about',
    type: 'website',
  },
};

const VALUES = [
  { icon: Sparkles, title: 'Handmade in-house', text: 'Every piece is poured, stitched, beaded and finished by hand — never outsourced, never rushed.' },
  { icon: Heart, title: 'Made to order', text: 'We craft each order after you place it, so what you receive is truly made for you.' },
  { icon: Gift, title: 'Perfect for gifting', text: 'Thoughtful, personal and one-of-a-kind — the kind of gift people remember.' },
  { icon: ShieldCheck, title: 'Crafted to last', text: 'Quality materials and careful finishing, so your little things stay lovely for longer.' },
  { icon: Truck, title: 'Delivered pan-India', text: 'Lovingly packed and shipped across the country, right to your doorstep.' },
  { icon: Leaf, title: 'Small-batch & mindful', text: 'No mass production and no shortcuts — just little things made with a lot of love.' },
];

export default function AboutPage() {
  return (
    <div className="about">
      {/* Intro */}
      <section className="about__intro">
        <div className="about__intro-bg" aria-hidden="true">
          <div className="hero__mesh hero__mesh--1" />
          <div className="hero__mesh hero__mesh--2" />
        </div>
        <div className="container about__intro-inner">
          <Reveal>
            <span className="about__eyebrow"><Sparkles /> Our story</span>
            <h1 className="about__title">Little things,<br /><span className="about__title-em">made with a lot of love.</span></h1>
            <p className="about__lead">
              Dillora by Kashvin is a small, independent studio for handmade things — mobile covers,
              charms, crochet, resin art and oversize tees. We believe the little things you carry
              every day should feel personal, so we make each one slowly, by hand, just for you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story + image */}
      <section className="container about__story">
        <Reveal className="about__storyimg shine-img">
          <img src="/images/crochet/coin-pouch/01.jpg" alt="Handmade crochet piece by Dillora by Kashvin" />
        </Reveal>
        <Reveal className="about__storytext" delay={120}>
          <span className="craft__eyebrow">The craft</span>
          <h2>Crafted slowly, by hand.</h2>
          <p>
            It started with a simple idea — that handmade should feel special, not mass-produced.
            What began as a passion for crochet and resin grew into a little brand making pieces
            people genuinely love to own and gift.
          </p>
          <p>
            Each piece passes through careful hands — poured and set, stitched and shaped, beaded and
            finished — until it’s ready to become a part of your everyday. No two are ever exactly the
            same, and that’s exactly the point.
          </p>
          <Link href="/c/crochet" className="btn btn-primary craft__btn">Explore the collection <span aria-hidden="true">→</span></Link>
        </Reveal>
      </section>

      {/* Values */}
      <section className="about__values">
        <div className="container">
          <Reveal className="about__valhead">
            <span className="eyebrow">Why Dillora</span>
            <h2>Made the right way</h2>
            <p className="muted">A few promises we hold ourselves to with every order.</p>
          </Reveal>
          <div className="about__valgrid">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 70} className="about__val">
                  <span className="about__valicon"><Icon /></span>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about__cta">
        <div className="container about__cta-inner">
          <Reveal>
            <h2>Find something that feels like yours.</h2>
            <p>Handmade pieces, made to order — ready to become your new favourite little thing.</p>
            <div className="about__cta-actions">
              <Link href="/c/mobile-covers" className="btn btn-primary btn-lg">Shop the collection</Link>
              <Link href="/c/resin-art" className="btn btn-ghost btn-lg">Explore Resin Art</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
