import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * Protect admin-only routes. Expects `Authorization: Bearer <token>`.
 * Attaches the authenticated admin to req.admin.
 */
export const protect = async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) token = header.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Not authorised — no token." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(401).json({ error: "Not authorised — admin not found." });
    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Not authorised — invalid or expired token." });
  }
};

/**
 * Restrict a route to specific admin roles. Chain AFTER `protect`.
 * Usage: router.put("/lock", protect, requireRole("owner", "manager"), handler)
 * A missing role falls back to "owner" (pre-role admins keep full access).
 */
export const requireRole = (...roles) => (req, res, next) => {
  const role = req.admin?.role || "owner";
  if (!roles.includes(role)) {
    return res.status(403).json({ error: "You do not have permission to do that." });
  }
  next();
};
