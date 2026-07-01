// Non-catalog seed data (coupons, reels, settings, demo orders).
// The product & category catalog is imported straight from the frontend
// (../../Frontend/data/catalog.js) by seed.js so they never drift apart.

export const COUPONS = [
  { code: "WELCOME10", type: "percent", value: 10, minOrder: 0, active: true, expiry: "2026-12-31" },
  { code: "DIWALI200", type: "flat", value: 200, minOrder: 999, active: true, expiry: "2026-11-15" },
  { code: "BUY2GET1", type: "bogo", value: 0, buyQty: 2, freeQty: 1, minOrder: 0, active: true, expiry: "2026-12-31" },
  { code: "FLAT50", type: "flat", value: 50, minOrder: 0, active: false, expiry: "2026-12-31" },
];

export const VIDEOS = [
  {
    id: "v1",
    title: "Resin Art in the making",
    caption: "Watch how each piece is poured by hand",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "v2",
    title: "Crochet flowers",
    caption: "Soft, handmade and forever in bloom",
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    poster: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "v3",
    title: "New phone covers",
    caption: "Fresh designs, made for your phone",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    poster: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=500&q=80",
  },
];

export const SETTINGS = {
  key: "site",
  banner: { on: false, preset: "diwali", text: "", code: "" },
  showDiscounts: false,
};

export const DEMO_ORDERS = [
  {
    id: "DIL-1042",
    createdAt: Date.now() - 86400000 * 1,
    customer: { name: "Aarohi Mehta", phone: "98XXXXXX21", address: "12 Rose Lane, Pune 411001" },
    items: [{ name: "Lilac Daydream Silicon Case", category: "Mobile Covers", options: "Apple · iPhone 15 · Soft Silicon", qty: 1, price: 299 }],
    total: 299,
    payment: "online",
    status: "Processing",
  },
  {
    id: "DIL-1041",
    createdAt: Date.now() - 86400000 * 2,
    customer: { name: "Rohan Verma", phone: "97XXXXXX08", address: "8 Hill View, Mumbai 400050" },
    items: [{ name: "Oversize Tee — Charcoal", category: "Oversize T-Shirts", options: "His · L", qty: 2, price: 699 }],
    total: 1398,
    payment: "half-cod",
    status: "Shipped",
  },
  {
    id: "DIL-1040",
    createdAt: Date.now() - 86400000 * 3,
    customer: { name: "Sara Khan", phone: "90XXXXXX55", address: "4 Lake Rd, Bengaluru 560001" },
    items: [
      { name: "Resin Marble Wall Watch", category: "Resin Art", options: "Colour: lilac & gold · Background: marble white", qty: 1, price: 1299 },
      { name: "Pressed Flower Bookmark", category: "Resin Art", options: "Standard (no customization)", qty: 2, price: 149 },
    ],
    total: 1597,
    payment: "online",
    status: "Delivered",
  },
];
