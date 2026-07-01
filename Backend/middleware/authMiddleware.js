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
