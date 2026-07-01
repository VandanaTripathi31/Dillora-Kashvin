import jwt from "jsonwebtoken";

/**
 * Sign a JWT for an authenticated admin.
 * @param {string} adminId  the admin's document id
 */
export const generateToken = (adminId) =>
  jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
