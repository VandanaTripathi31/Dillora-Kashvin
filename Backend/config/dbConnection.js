import mongoose from "mongoose";

/**
 * Connect to MongoDB. Exits the process on failure so we never run the
 * API against a disconnected database (the frontend has its own fallback).
 */
export const dbConnection = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[db] MONGO_URI is not set — check your .env file.");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error("[db] Connection error:", err.message);
    process.exit(1);
  }
};
