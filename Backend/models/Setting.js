import mongoose from "mongoose";

// A promotional image banner managed by the admin (separate from the festive
// text `banner`). Shown on the storefront home / category pages.
const adBannerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    image: { type: String, default: "" }, // Cloudinary URL
    link: { type: String, default: "" }, // optional click-through
    alt: { type: String, default: "" },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
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
    // Business WhatsApp number (digits incl. country code, e.g. "919000000000")
    // used for the post-order confirmation deep link.
    whatsappNumber: { type: String, default: "" },
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
      welcome: {
        enabled: { type: Boolean, default: false },
        image: { type: String, default: "" },
        link: { type: String, default: "" },
      },
      order: {
        enabled: { type: Boolean, default: true },
        image: { type: String, default: "" },
        link: { type: String, default: "" },
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
