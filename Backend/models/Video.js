import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // e.g. "v1"
    title: { type: String, default: "" },
    caption: { type: String, default: "" },
    src: { type: String, default: "" },
    poster: { type: String, default: "" },
    srcPublicId: { type: String, default: undefined },
    posterPublicId: { type: String, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        if (ret.srcPublicId == null) delete ret.srcPublicId;
        if (ret.posterPublicId == null) delete ret.posterPublicId;
        return ret;
      },
    },
  }
);

export default mongoose.model("Video", videoSchema);
