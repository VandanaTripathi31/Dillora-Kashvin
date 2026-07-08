import mongoose from "mongoose";

// A promotional image banner managed by the admin (separate from the festive
// text `banner`). Shown on the storefront home / category pages.
const adBannerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    // Rich content (all optional — a purely-image banner leaves these blank).
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    offerText: { type: String, default: "" },
    couponCode: { type: String, default: "" },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    countdownEndsAt: { type: Number, default: 0 }, // epoch ms; 0 = no timer
    bgColor: { type: String, default: "" },
    imageDesktop: { type: String, default: "" },
    imageMobile: { type: String, default: "" },
    // Scheduling window (epoch ms; 0 = no bound).
    startDate: { type: Number, default: 0 },
    endDate: { type: Number, default: 0 },
    // Legacy fields kept for back-compat (image → desktop fallback, link → CTA).
    image: { type: String, default: "" },
    link: { type: String, default: "" },
    alt: { type: String, default: "" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // also used as priority
  },
  { _id: false }
);

// A single "How to order" step (admin-editable).
const popupStepSchema = new mongoose.Schema(
  { title: { type: String, default: "" }, text: { type: String, default: "" }, icon: { type: String, default: "" } },
  { _id: false }
);

// A single settings document holds site-wide config (banner, discounts…).
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site", unique: true },
    banner: {
      on: { type: Boolean, default: false },
      preset: { type: String, default: "diwali" },
      text: { type: String, default: "" },
      code: { type: String, default: "" },
    },
    showDiscounts: { type: Boolean, default: false },
    // Auto-reward a coupon after a customer submits a product review.
    reviewReward: {
      enabled: { type: Boolean, default: false },
      percent: { type: Number, default: 10 },
      days: { type: Number, default: 30 },
    },
    // Post-delivery feedback popup ("How was your experience?").
    feedbackPopup: {
      enabled: { type: Boolean, default: false },
      question: { type: String, default: "How was your experience?" },
    },
    // Admin-managed homepage hero (overrides the built-in editorial hero).
    hero: {
      enabled: { type: Boolean, default: false },
      headline: { type: String, default: "" },
      subheadline: { type: String, default: "" },
      ctaText: { type: String, default: "" },
      ctaLink: { type: String, default: "" },
      cta2Text: { type: String, default: "" },
      cta2Link: { type: String, default: "" },
      imageDesktop: { type: String, default: "" },
      imageMobile: { type: String, default: "" },
      bgColor: { type: String, default: "" },
      overlay: { type: Number, default: 35 }, // 0–100 dark overlay for text contrast
    },
    // Top countdown sale bar (admin-managed). Shows a live timer until `endsAt`.
    saleCountdown: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: "Hurry! Sale ends in" },
      endsAt: { type: Number, default: 0 }, // epoch ms; past/0 hides the bar
    },
    // Business WhatsApp number (digits incl. country code, e.g. "919000000000")
    // used for the post-order confirmation deep link + floating chat + customize button.
    whatsappNumber: { type: String, default: "" },
    // Opening line for the product "Customize on WhatsApp" deep link. Product
    // name / SKU / selected options are appended automatically.
    whatsappTemplate: {
      type: String,
      default: "Hi Dillora! 💜 I'd love to customise this product — can you help?",
    },
    // Instagram profile URL shown in the footer.
    instagramUrl: { type: String, default: "https://www.instagram.com/dillora_by_kashvin" },
    // Delivery / policy info surfaced on product & info pages (admin-managed).
    delivery: {
      estimatedDaysMin: { type: Number, default: 3 },
      estimatedDaysMax: { type: Number, default: 7 },
      returnPolicy: { type: String, default: "" },
      rateCard: { type: String, default: "" },
      qualityInfo: { type: String, default: "" },
      packagingInfo: { type: String, default: "" },
      paymentInfo: { type: String, default: "" },
    },
    // Admin-managed promotional image banners.
    adBanners: { type: [adBannerSchema], default: [] },
    // Image-based popups the admin can change anytime.
    //  welcome — shown when a visitor opens the website.
    //  order   — shown on a product page (falls back to the built-in illustrated
    //            "how to order" design when no image is set).
    popups: {
      // Welcome popup — shown once when a visitor opens the site.
      welcome: {
        enabled: { type: Boolean, default: false },
        image: { type: String, default: "" },
        link: { type: String, default: "" },
        heading: { type: String, default: "" },
        description: { type: String, default: "" },
        buttonText: { type: String, default: "" },
        bgColor: { type: String, default: "" },
        couponCode: { type: String, default: "" },
        startDate: { type: Number, default: 0 },
        endDate: { type: Number, default: 0 },
      },
      // How-to-order popup — shown on product pages (image / structured steps /
      // built-in illustrated fallback).
      order: {
        enabled: { type: Boolean, default: true },
        image: { type: String, default: "" },
        link: { type: String, default: "" },
        heading: { type: String, default: "" },
        buttonText: { type: String, default: "" },
        steps: { type: [popupStepSchema], default: undefined },
      },
      // General promotional popup — admin can run anytime, site-wide.
      promo: {
        enabled: { type: Boolean, default: false },
        image: { type: String, default: "" },
        heading: { type: String, default: "" },
        description: { type: String, default: "" },
        couponCode: { type: String, default: "" },
        ctaText: { type: String, default: "" },
        ctaLink: { type: String, default: "" },
        countdownEndsAt: { type: Number, default: 0 },
        bgColor: { type: String, default: "" },
        startDate: { type: Number, default: 0 },
        endDate: { type: Number, default: 0 },
      },
    },
    // Seller / tax details printed on invoices. GST is optional — when
    // gstPercent is 0 (or no number set) the invoice omits the tax section.
    invoice: {
      sellerName: { type: String, default: "Dillora by Kashvin" },
      sellerAddress: { type: String, default: "" },
      sellerPhone: { type: String, default: "" },
      sellerEmail: { type: String, default: "" },
      gstNumber: { type: String, default: "" },
      gstPercent: { type: Number, default: 0 },
      logoUrl: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.key;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export default mongoose.model("Setting", settingSchema);
