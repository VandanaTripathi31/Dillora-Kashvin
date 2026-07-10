import mongoose from "mongoose";

// Newsletter / email-capture subscribers (footer + welcome popup). One row per
// email; used to build an owned audience for launch/marketing emails.
const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "footer" }, // where they signed up
    createdAt: { type: Number, default: () => Date.now() },
  },
  {
    timestamps: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Subscriber", subscriberSchema);
