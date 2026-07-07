import Admin from "../models/Admin.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/responseHandler.js";
import { isEmail, isNonEmptyString } from "../utils/validators.js";

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin || !(await admin.matchPassword(password))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = generateToken(admin._id);
  res.json({ token, admin: admin.toJSON() });
});

// GET /api/auth/me  (protected)
export const me = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin.toJSON() });
});

// GET /api/auth/admins  (protected, owner/manager) — team list for assignments
export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().select("name email role").sort({ createdAt: 1 });
  res.json(admins.map((a) => a.toJSON()));
});

const ROLES = ["owner", "manager", "staff"];

// POST /api/auth/register  (protected — an existing admin can add another)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!isNonEmptyString(name) || !isEmail(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: "Name, valid email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const exists = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (exists) return res.status(409).json({ error: "An admin with that email already exists." });

  // New team members default to least-privilege "staff"; an explicit valid role
  // may be supplied by the creating admin.
  const nextRole = ROLES.includes(role) ? role : "staff";

  const admin = await Admin.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: nextRole,
  });
  res.status(201).json({ admin: admin.toJSON() });
});
