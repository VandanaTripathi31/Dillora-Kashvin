import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  { name: String, price: Number },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Public string id, e.g. "p1". Auto-generated on create if not supplied.
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true }, // category.id
    sub: { type: String, default: "", index: true }, // sub.id
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    optionType: {
      type: String,
      enum: ["none", "phone", "size", "resin"],
      default: "none",
    },
    image: { type: String, default: "" },
    gallery: { type: [String], default: undefined },
    materials: { type: [materialSchema], default: undefined },
    sizes: { type: [String], default: undefined },
    imagePublicId: { type: String, default: undefined }, // Cloudinary public_id
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        // Drop empty optional arrays so the shape matches the original catalog.
        if (ret.gallery == null) delete ret.gallery;
        if (ret.materials == null) delete ret.materials;
        if (ret.sizes == null) delete ret.sizes;
        if (ret.imagePublicId == null) delete ret.imagePublicId;
        return ret;
      },
    },
  }
);

export default mongoose.model("Product", productSchema);
