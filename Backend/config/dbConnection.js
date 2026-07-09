import mongoose from "mongoose";

// The application must use EXACTLY ONE database. Some Atlas connection strings
// omit the database path (e.g. ".../mongodb.net/?ssl=true..."), which makes
// Mongoose silently fall back to the default "test" database — that is how data
// ended up split across "dillora" and "test". We pin the name here via the
// `dbName` option so it is ALWAYS "dillora", regardless of what the URI says.
// Override only if you truly need a different DB by setting MONGO_DB_NAME.
const DB_NAME = process.env.MONGO_DB_NAME || "dillora";

/**
 * Connect to MongoDB. Exits the process on failure so we never run the
 * API against a disconnected database.
 */
export const dbConnection = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[db] ❌ MONGO_URI is not set — check your .env file.");
    process.exit(1);
  }
  try {
    // `dbName` overrides any database in the URI (or the "test" default),
    // guaranteeing a single source of truth.
    const conn = await mongoose.connect(uri, { dbName: DB_NAME });
    const name = conn.connection.name;
    console.log("========================================");
    console.log(`[db] ✅ Connected to MongoDB database: "${name}"`);
    console.log(`[db]    host: ${conn.connection.host}`);
    console.log("========================================");
    if (name !== DB_NAME) {
      console.warn(
        `[db] ⚠️  Connected DB "${name}" does not match expected "${DB_NAME}". ` +
          `Check MONGO_URI / MONGO_DB_NAME.`,
      );
    }
    return conn;
  } catch (err) {
    console.error("[db] ❌ Connection failed:");
    console.dir(err, { depth: null });
    process.exit(1);
  }
};
