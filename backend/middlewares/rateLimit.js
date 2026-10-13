const { createHash } = require('crypto');

/** Per-process limits for both client IP and contact, with bounded memory. */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, maxEntries = 10000, now = Date.now } = {}) {
  const buckets = new Map();
  function prune(time) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= time) buckets.delete(key);
  }
  return (req, res, next) => {
    const time = now();
    prune(time);
    const keys = [`ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`];
    for (const field of ['email', 'phone']) {
      if (typeof req.body?.[field] === 'string') {
        const value = req.body[field].trim().toLowerCase();
        keys.push(`${field}:${createHash('sha256').update(value).digest('hex')}`);
      }
    }
    for (const key of keys) {
      const bucket = buckets.get(key);
      if (bucket?.count >= max || (!bucket && buckets.size >= maxEntries)) {
        const retry = Math.max(1, Math.ceil(((bucket?.resetAt || time + windowMs) - time) / 1000));
        res.setHeader('Retry-After', String(retry));
        return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
      }
    }
    for (const key of keys) {
      const bucket = buckets.get(key) || { count: 0, resetAt: time + windowMs };
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    next();
  };
}
module.exports = rateLimit;
