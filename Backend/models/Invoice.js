import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    options: String,
    qty: Number,
    price: Number, // unit price
  },
  { _id: false }
);

/**
 * A generated invoice. Stores a self-contained snapshot of the order + seller
 * details at issue time, so the PDF can always be regenerated identically even
 * if the order or settings change later. One invoice per order (unique orderId).
 */
const invoiceSchema = new mongoose.Schema(
  {
    // Human-friendly invoice number, e.g. "INV-00001".
    id: { type: String, required: true, unique: true },
    orderId: { type: String, required: true, unique: true, index: true },
    issuedAt: { type: Number, default: () => Date.now() },

    customer: {
      name: String,
      phone: { type: String, index: true },
      email: String,
      address: String,
    },
    items: { type: [lineSchema], default: [] },

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    // GST is informational and inclusive: `amount` is the tax already contained
    // in `total` (nothing is added on top of what the customer paid).
    gst: {
      number: { type: String, default: "" },
      percent: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    total: { type: Number, default: 0 },
    payment: { type: String, default: "online" },

    // Seller snapshot printed on the invoice header.
    seller: {
      name: String,
      address: String,
      phone: String,
      email: String,
      gstNumber: String,
      logoUrl: String,
    },

    emailedAt: { type: Number, default: 0 },
    emailedTo: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Invoice", invoiceSchema);
