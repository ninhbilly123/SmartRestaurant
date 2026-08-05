const buckets = new Map();

const getClientIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";

export const createRateLimiter = ({
  keyGenerator,
  keyPrefix = "rate-limit",
  max = 20,
  message = "Qua nhieu yeu cau. Vui long thu lai sau.",
  windowMs = 15 * 60 * 1000,
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const rawKey = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const key = `${keyPrefix}:${rawKey || getClientIp(req)}`;
    const bucket = buckets.get(key) || [];
    const recentRequests = bucket.filter((timestamp) => now - timestamp < windowMs);

    if (recentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        error: message,
      });
    }

    recentRequests.push(now);
    buckets.set(key, recentRequests);
    return next();
  };
};

export default createRateLimiter;
