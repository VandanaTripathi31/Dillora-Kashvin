// 404 for unmatched routes.
export const notFound = (req, res, next) => {
  res.status(404).json({ error: `Not found — ${req.method} ${req.originalUrl}` });
};

// Central error handler — last middleware in the chain.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (process.env.NODE_ENV !== "test") {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  // Duplicate key (e.g. unique code/email/id already exists).
  if (err.code === 11000) {
    return res.status(409).json({ error: "That record already exists." });
  }
  // Mongoose validation error.
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: Object.values(err.errors).map((e) => e.message).join(", ") });
  }

  res.status(status).json({
    error: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
