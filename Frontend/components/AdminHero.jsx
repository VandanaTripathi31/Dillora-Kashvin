'use client';
import Link from 'next/link';

const ext = (url) => (/^https?:/i.test(url) ? { target: '_blank', rel: 'noreferrer' } : {});

// Admin-managed homepage hero. Uses separate mobile/desktop background images
// (so mobile is a purpose-built crop, not a scaled desktop), an adjustable dark
// overlay for text contrast, and staggered entrance animations.
export default function AdminHero({ hero }) {
  const desktop = hero.imageDesktop || '';
  const mobile = hero.imageMobile || hero.imageDesktop || '';
  const overlay = Math.max(0, Math.min(100, hero.overlay ?? 35)) / 100;
  const hasImage = !!(desktop || mobile);
  const bg = hero.bgColor || 'linear-gradient(135deg,#7a4ff0,#a64fd6,#e57fc4)';

  return (
    <section
      className="relative isolate flex min-h-[78vh] items-center overflow-hidden sm:min-h-[82vh]"
      style={{ background: bg }}
    >
      {desktop && <img src={desktop} alt="" className="absolute inset-0 hidden h-full w-full object-cover sm:block" aria-hidden="true" />}
      {mobile && <img src={mobile} alt="" className="absolute inset-0 h-full w-full object-cover sm:hidden" aria-hidden="true" />}
      {hasImage && (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(0,0,0,${overlay * 0.55}) 0%, rgba(0,0,0,${overlay}) 100%)` }}
          aria-hidden="true"
        />
      )}

      <div className="container relative z-[1] flex flex-col items-center gap-5 py-16 text-center text-white sm:items-start sm:py-24 sm:text-left">
        {hero.headline && (
          <h1 className="max-w-[18ch] font-display text-[clamp(2.2rem,7vw,4.6rem)] font-bold leading-[1.05] tracking-[-1px] [animation:heroUp_.6s_ease_both]">
            {hero.headline}
          </h1>
        )}
        {hero.subheadline && (
          <p className="max-w-[46ch] text-[clamp(1rem,2.4vw,1.3rem)] leading-relaxed opacity-95 [animation:heroUp_.6s_.1s_ease_both]">
            {hero.subheadline}
          </p>
        )}
        {(hero.ctaText || hero.cta2Text) && (
          <div className="mt-2 flex w-full flex-col gap-3 [animation:heroUp_.6s_.2s_ease_both] sm:w-auto sm:flex-row">
            {hero.ctaText && (
              <Link href={hero.ctaLink || '#'} {...ext(hero.ctaLink)} className="rounded-full bg-white px-8 py-3.5 text-center font-semibold text-orchid-600 shadow-[0_10px_30px_rgba(0,0,0,.2)] transition-transform hover:-translate-y-0.5">
                {hero.ctaText}
              </Link>
            )}
            {hero.cta2Text && (
              <Link href={hero.cta2Link || '#'} {...ext(hero.cta2Link)} className="rounded-full border-2 border-white/80 px-8 py-3.5 text-center font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15">
                {hero.cta2Text}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
