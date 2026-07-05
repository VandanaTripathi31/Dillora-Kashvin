import mongoose from "mongoose";

// Site-wide customer feedback / testimonials (distinct from per-product Reviews).
// Submitted by signed-in customers; only shows on the storefront once an admin
// approves it.
const feedbackSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, default: "Customer" },
    phone: { type: String, index: true },
    location: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
    approved: { type: Boolean, default: false, index: true },
    // Numeric ms timestamp to match the rest of the storefront's shapes.
    createdAt: { type: Number, default: () => Date.now() },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Feedback", feedbackSchema);
