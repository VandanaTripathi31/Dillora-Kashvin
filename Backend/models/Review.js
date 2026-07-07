import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. "r170..."
    productId: { type: String, required: true, index: true },
    name: { type: String, default: "Customer" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    title: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
    images: { type: [String], default: [] }, // Cloudinary URLs
    video: { type: String, default: "" }, // Cloudinary URL
    // Verified = the reviewer received this product (gated at submit time).
    verified: { type: Boolean, default: true },
    // Moderation: default approved (verified buyers auto-approve); admin can hide.
    approved: { type: Boolean, default: true },
    // Optional admin reply.
    reply: {
      text: { type: String, default: "" },
      at: { type: Number, default: 0 },
    },
    createdAt: { type: Number, default: () => Date.now() },
  },
  {
    timestamps: { createdAt: false, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Review", reviewSchema);
