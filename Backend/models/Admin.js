import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // Access level. Defaults to "owner" so existing (pre-role) admins keep full
    // access. New team members are created as least-privilege "staff" and can be
    // promoted. Used by the stock-lock system (owner/manager manage locks).
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      default: "owner",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash the password whenever it is set/changed.
// (Mongoose 9 async pre-hooks don't receive `next` — just return/throw.)
adminSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.matchPassword = function matchPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("Admin", adminSchema);
