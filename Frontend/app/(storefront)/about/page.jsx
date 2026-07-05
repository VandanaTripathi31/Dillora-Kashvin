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
    <div>
      {/* Intro */}
      <section className="relative overflow-hidden bg-[linear-gradient(165deg,#faf5fe_0%,#fdf3fb_55%,#fff5ef_100%)]">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="hero__mesh hero__mesh--1" />
          <div className="hero__mesh hero__mesh--2" />
        </div>
        <div className="container relative z-[2] mx-auto max-w-[820px] pb-14 pt-14 text-center min-[561px]:pb-20 min-[561px]:pt-[84px]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(166,79,214,.18)] bg-white/70 px-4 py-[7px] text-[0.8rem] font-bold uppercase tracking-[0.14em] text-orchid-600 shadow-soft [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-orchid-500"><Sparkles /> Our story</span>
            <h1 className="mb-5 mt-[22px] text-[clamp(2.4rem,5.5vw,4rem)] leading-[1.05] tracking-[-1.5px]">Little things,<br /><span className="about__title-em">made with a lot of love.</span></h1>
            <p className="mx-auto max-w-[640px] text-[1.15rem] leading-[1.7] text-ink-soft">
              Dillora by Kashvin is a small, independent studio for handmade things — mobile covers,
              charms, crochet, resin art and oversize tees. We believe the little things you carry
              every day should feel personal, so we make each one slowly, by hand, just for you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story + image */}
      <section className="container grid grid-cols-1 items-center gap-8 py-14 min-[881px]:grid-cols-2 min-[881px]:gap-[56px] min-[881px]:py-20">
        <Reveal className="shine-img relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[44px] border-[7px] border-white shadow-[0_30px_70px_-20px_rgba(122,79,240,.35)] min-[881px]:max-w-none">
          <img src="/images/crochet/coin-pouch/01.jpg" alt="Handmade crochet piece by Dillora by Kashvin" className="h-full w-full object-cover" />
        </Reveal>
        <Reveal delay={120}>
          <span className="craft__eyebrow">The craft</span>
          <h2 className="mb-4 text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.1] tracking-[-0.8px]">Crafted slowly, by hand.</h2>
          <p className="mb-4 text-[1.05rem] leading-[1.75] text-ink-soft">
            It started with a simple idea — that handmade should feel special, not mass-produced.
            What began as a passion for crochet and resin grew into a little brand making pieces
            people genuinely love to own and gift.
          </p>
          <p className="mb-4 text-[1.05rem] leading-[1.75] text-ink-soft">
            Each piece passes through careful hands — poured and set, stitched and shaped, beaded and
            finished — until it’s ready to become a part of your everyday. No two are ever exactly the
            same, and that’s exactly the point.
          </p>
          <Link href="/c/crochet" className="btn btn-primary craft__btn mt-2">Explore the collection <span aria-hidden="true">→</span></Link>
        </Reveal>
      </section>

      {/* Values */}
      <section className="bg-[linear-gradient(180deg,transparent,#f9f2fd)] py-[60px] min-[881px]:py-[84px]">
        <div className="container">
          <Reveal className="mx-auto mb-11 max-w-[560px] text-center">
            <span className="mb-3 inline-block text-[0.78rem] font-bold uppercase tracking-[0.14em] text-orchid-500">Why Dillora</span>
            <h2 className="mb-2.5 text-[clamp(1.9rem,3.4vw,2.7rem)] tracking-[-0.6px]">Made the right way</h2>
            <p className="muted">A few promises we hold ourselves to with every order.</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-[22px] min-[561px]:grid-cols-2 min-[881px]:grid-cols-3">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 70} className="rounded-[22px] border border-[rgba(166,79,214,.1)] bg-white px-[26px] py-7 shadow-soft transition-[transform,box-shadow,border-color] duration-[350ms] ease-brand hover:-translate-y-1.5 hover:border-[rgba(166,79,214,.2)] hover:shadow-card">
                  <span className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-[15px] bg-[linear-gradient(135deg,#f1e2fb,#fbe2f4)] text-orchid-600 [&_svg]:h-6 [&_svg]:w-6"><Icon /></span>
                  <h3 className="mb-2 text-[1.2rem] tracking-[-0.2px]">{v.title}</h3>
                  <p className="text-[0.96rem] leading-[1.65] text-ink-soft">{v.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[60px] min-[881px]:py-[88px]">
        <div className="container mx-auto max-w-[680px] text-center">
          <Reveal>
            <h2 className="mb-3.5 text-[clamp(2rem,3.8vw,3rem)] leading-[1.1] tracking-[-1px]">Find something that feels like yours.</h2>
            <p className="mb-7 text-[1.1rem] text-ink-soft">Handmade pieces, made to order — ready to become your new favourite little thing.</p>
            <div className="flex flex-wrap justify-center gap-3.5">
              <Link href="/c/mobile-covers" className="btn btn-primary btn-lg">Shop the collection</Link>
              <Link href="/c/resin-art" className="btn btn-ghost btn-lg">Explore Resin Art</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
