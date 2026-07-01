import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. "r170..."
    productId: { type: String, required: true, index: true },
    name: { type: String, default: "Customer" },
    phone: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
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
