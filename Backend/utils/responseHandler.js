/**
 * Small helpers for consistent JSON responses.
 * NOTE: the storefront's api.js expects raw resource shapes for reads
 * (e.g. GET /products returns an array, GET /products/:id returns the
 * object). So these wrappers are used mainly for auth/media/errors where
 * an envelope is helpful — resource controllers return raw data directly.
 */

export const ok = (res, data = {}, status = 200) => res.status(status).json(data);

export const created = (res, data = {}) => res.status(201).json(data);

export const fail = (res, message = "Something went wrong", status = 400, extra = {}) =>
  res.status(status).json({ error: message, ...extra });

/**
 * Wrap an async route handler so thrown errors reach the error middleware
 * without a try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
