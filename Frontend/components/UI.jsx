"use client";
import Link from "next/link";
import Image from "next/image";
import { BLUR } from "@/lib/img";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { api } from "@/data/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useSettings } from "@/context/SettingsContext";

export function Logo({ size = 26, light = false }) {
  // On dark / purple backgrounds (footer, mobile drawer) the brand logo PNG —
  // purple artwork + dark script — wouldn't read, so we keep a white wordmark
  // there. On the light header we show the real brand logo image.
  if (light) {
    return (
      <Link
        href="/"
        className="dilora-logo"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
        }}
      >
        <span
          style={{ display: "flex", flexDirection: "column", lineHeight: 1.02 }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: size,
              letterSpacing: ".3px",
              color: "#fff",
            }}
          >
            Dillora
          </span>
          <span
            style={{
              fontSize: size * 0.38,
              color: "rgba(255,255,255,.8)",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            by Kashvin
          </span>
        </span>
      </Link>
    );
  }

  // Dillora.png is a 500×500 wordmark with a lot of transparent padding, so
  // shown raw it looks tiny. We crop to the wordmark band via an overflow-hidden
  // box (see LogoMark) so it renders large & crisp. `size` = visible height.
  return (
    <Link
      href="/"
      className="dilora-logo group"
      style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
      aria-label="Dillora by Kashvin — home"
    >
      <LogoMark size={size} className="transition-transform duration-300 group-hover:scale-[1.04]" />
    </Link>
  );
}

// Cropped Dillora.png wordmark (no link). The source is a 500×500 image with the
// wordmark in the x[87–415], y[204–280] band (measured from its alpha channel);
// these offsets crop to that band so it renders large & crisp at height `size`.
// Used inside the header logo link and the footer chip for one consistent mark.
export function LogoMark({ size = 40, className = "" }) {
  return (
    <span
      className={`block overflow-hidden ${className}`}
      style={{ height: size, width: size * 3.7, position: "relative" }}
    >
      <img
        src="/Dillora.png"
        alt="Dillora by Kashvin"
        style={{
          position: "absolute",
          height: size * 5.26,
          width: size * 5.26,
          left: -size * 0.79,
          top: -size * 2.05,
          maxWidth: "none",
        }}
      />
    </span>
  );
}

export function Price({ price, mrp }) {
  const { showDiscounts } = useSettings();
  const showMrp = showDiscounts && mrp && mrp > price;
  return (
    <span>
      <span className="price">₹{price.toLocaleString("en-IN")}</span>
      {showMrp && (
        <span className="strike">₹{mrp.toLocaleString("en-IN")}</span>
      )}
    </span>
  );
}

// Real rating from customer reviews. Shows "New" until a product has reviews.
export function Rating({ id, showCount = true }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    let on = true;
    api
      .getRatingSummary(id)
      .then((s) => {
        if (on) setSummary(s);
      })
      .catch(() => {}); // a missing rating just shows "New" — never blocks the card
    return () => {
      on = false;
    };
  }, [id]);

  if (!summary || summary.count === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[0.82rem]"
        aria-label="No reviews yet"
      >
        <span className="text-[0.9rem] tracking-[1px] text-[#e8a93a]">
          ☆☆☆☆☆
        </span>
        <span className="text-[0.78rem] text-ink-soft opacity-75">New</span>
      </span>
    );
  }

  const full = Math.round(summary.avg);
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.82rem]"
      aria-label={`Rated ${summary.avg} out of 5`}
    >
      <span className="text-[0.9rem] tracking-[1px] text-[#e8a93a]">
        {"★".repeat(full)}
        {"☆".repeat(5 - full)}
      </span>
      <span className="text-[0.78rem] text-ink-soft">
        {summary.avg}
        {showCount ? ` (${summary.count})` : ""}
      </span>
    </span>
  );
}

export function ProductCard({ product }) {
  const router = useRouter();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { showDiscounts } = useSettings();
  const off =
    showDiscounts && product.mrp && product.mrp > product.price
      ? Math.round((1 - product.price / product.mrp) * 100)
      : 0;
  const needsOptions = product.optionType && product.optionType !== "none";
  const wished = has(product.id);

  const quickAdd = (e) => {
    e.preventDefault();
    if (needsOptions) {
      router.push(`/product/${product.id}`);
      return;
    }
    add({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      options: "—",
      refPhoto: null,
      price: product.price,
      qty: 1,
    });
    router.push("/cart");
  };

  const heart = (e) => {
    e.preventDefault();
    toggle(product.id);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-transparent bg-white shadow-card transition-[transform,box-shadow] duration-300 ease-brand hover:-translate-y-1.5 hover:border-orchid-100 hover:shadow-glow-brand"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 600px) 50vw, 25vw"
          placeholder="blur"
          blurDataURL={BLUR}
          className="object-cover transition-transform duration-[550ms] ease-brand group-hover:scale-[1.07]"
        />
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-violet-500 px-[11px] py-[5px] text-[0.72rem] font-bold text-white shadow-[0_4px_12px_rgba(122,79,240,.3)]">
            {off}% off
          </span>
        )}
        <button
          onClick={heart}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2.5 top-2.5 z-[3] grid h-[34px] w-[34px] place-items-center rounded-full bg-white/[.92] shadow-soft backdrop-blur-[6px] transition duration-150 hover:scale-[1.08] hover:text-violet-500 ${wished ? "text-violet-500" : "text-ink-soft"}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={wished ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <button
          onClick={quickAdd}
          className="absolute inset-x-3 bottom-3 z-[3] translate-y-0 rounded-full bg-white/[.96] py-[9px] text-[0.85rem] font-semibold text-ink opacity-100 shadow-[0_8px_20px_rgba(80,40,140,.18)] backdrop-blur-[8px] transition duration-200 [@media(hover:hover)]:translate-y-3.5 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 hover:bg-grad-brand hover:text-white"
        >
          {needsOptions ? "Choose options" : "+ Quick add"}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-[18px] pb-5 pt-4">
        <h3 className="mb-1.5 line-clamp-2 min-h-[2.6em] font-body text-[1.02rem] font-semibold leading-[1.3] tracking-[-0.2px]">
          {product.name}
        </h3>
        <div className="mb-1.5 mt-0.5">
          <Rating id={product.id} showCount={false} />
        </div>
        <div className="mt-auto">
          <Price price={product.price} mrp={product.mrp} />
        </div>
      </div>
    </Link>
  );
}

export function Spinner({ label = "Loading" }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <div className="spinner__dot" />
      <div className="spinner__dot" />
      <div className="spinner__dot" />
      <span className="sr-only" style={{ position: "absolute", left: -9999 }}>
        {label}
      </span>
    </div>
  );
}

// Friendly failure state with an explicit retry — shown instead of an endless
// spinner when a request fails or times out on a flaky mobile network.
export function ErrorRetry({ error, onRetry }) {
  const msg =
    error?.message && !/->|API |fetch/i.test(error.message)
      ? error.message
      : "We couldn't load this right now.";
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-10 text-center"
    >
      <p className="max-w-[300px] text-[0.92rem] text-ink-soft">{msg}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-primary">
          Try again
        </button>
      )}
    </div>
  );
}

// Renders one of: error+retry, loading fallback, or the loaded children.
// Pass the object returned by useAsync plus what to show when loaded.
export function Loader({ loading, error, onRetry, fallback, children }) {
  if (error) return <ErrorRetry error={error} onRetry={onRetry} />;
  if (loading) return fallback ?? <Spinner />;
  return children;
}

// Content-shaped placeholder that mirrors <ProductCard> exactly so swapping in
// the real card causes no layout shift.
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-[18px] border border-transparent bg-white shadow-card"
    >
      <div className="skel aspect-square w-full !rounded-none" />
      <div className="flex flex-1 flex-col gap-2 px-[18px] pb-5 pt-4">
        <div className="skel h-[0.95rem] w-[85%]" />
        <div className="skel h-[0.95rem] w-[55%]" />
        <div className="skel mt-1 h-[0.8rem] w-[40%]" />
        <div className="skel mt-auto h-[1.1rem] w-1/2" />
      </div>
    </div>
  );
}

// A grid of card skeletons — drop-in loading fallback for a product section.
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid" role="status" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}
