'use client';
import { Star, Quote } from 'lucide-react';

const REVIEWS = [
  { q: 'The resin wall clock is even prettier in person. You can tell it was made by hand.', n: 'Aarohi M.', t: 'Pune' },
  { q: 'My phone cover is exactly the design I wanted. So many compliments already!', n: 'Sara K.', t: 'Bengaluru' },
  { q: 'Ordered crochet flowers for my mom — packaging and quality were lovely.', n: 'Rohan V.', t: 'Mumbai' },
  { q: 'The charm is so dainty and cute. Exactly like the photos, shipped fast too.', n: 'Ishita R.', t: 'Delhi' },
  { q: 'Oversize tee fits perfectly and the print quality is premium. Will reorder.', n: 'Karan S.', t: 'Jaipur' },
  { q: 'You can feel the love in every stitch. My new favourite small brand.', n: 'Meera P.', t: 'Kochi' },
];

function Card({ q, n, t }) {
  return (
    <div className="w-[300px] sm:w-[340px] shrink-0 rounded-3xl p-6 mx-3"
         style={{ background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(6px)', boxShadow: '0 10px 40px rgba(122,79,240,.12)', border: '1px solid rgba(166,79,214,.10)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-0.5" style={{ color: '#f5a623' }}>
          {[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4" fill="#f5a623" />)}
        </div>
        <Quote className="w-7 h-7" style={{ color: '#e7d3f6' }} />
      </div>
      <p className="font-display italic text-[1.02rem] leading-relaxed" style={{ color: '#2c2336' }}>&ldquo;{q}&rdquo;</p>
      <p className="mt-4 text-sm font-semibold" style={{ color: '#6f2c98' }}>
        {n} <span className="font-normal" style={{ color: '#6b5f78' }}>· {t}</span>
      </p>
    </div>
  );
}

export default function Testimonials() {
  // duplicate the list so the marquee can loop seamlessly
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <section className="relative py-16 overflow-hidden"
             style={{ background: 'linear-gradient(135deg,#faf5fe 0%,#f3e9fb 50%,#e7d3f6 100%)' }}>
      {/* soft colour blobs for depth */}
      <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background:'rgba(166,79,214,.12)' }} />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background:'rgba(122,79,240,.12)' }} />

      <div className="relative text-center mb-10 px-5">
        <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#a64fd6' }}>Loved &amp; shared</span>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2" style={{ color: '#2c2336' }}>What our customers say</h2>
      </div>

      {/* marquee row 1 */}
      <div className="relative flex w-max animate-[marquee_38s_linear_infinite] hover:[animation-play-state:paused]">
        {loop.map((r, i) => <Card key={i} {...r} />)}
      </div>

      {/* edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20" style={{ background:'linear-gradient(90deg,#faf5fe,transparent)' }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20" style={{ background:'linear-gradient(270deg,#e7d3f6,transparent)' }} />
    </section>
  );
}
