const rateBuckets = new Map();

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.paypalobjects.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https://api.resend.com https://api.printful.com https://*.supabase.co https://*.paypal.com https://www.paypal.com https://*.paypalobjects.com",
  "frame-src 'self' https://www.paypal.com",
  'upgrade-insecure-requests'
].join('; ');

function isLocal(req) {
  const host = String(req?.headers?.host || '').toLowerCase();
  return host.includes('localhost') || host.includes('127.0.0.1');
}

function setSecurityHeaders(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', CSP);
  if (!isLocal(req)) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimit(req, res, key, options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const max = Number(options.max || 30);
  const id = `${key}:${getClientIp(req)}`;
  const now = Date.now();
  const bucket = rateBuckets.get(id) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(id, bucket);
  res.setHeader('RateLimit-Limit', String(max));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.count > max) {
    res.statusCode = 429;
    setSecurityHeaders(req, res);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.end(JSON.stringify({ error: 'Too many requests. Please try again soon.' }));
    return false;
  }
  return true;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || '').trim());
}

function cleanString(value, max = 300) {
  return String(value || '').replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, max);
}

function safeError(fallback) {
  return process.env.NODE_ENV === 'development' ? fallback : fallback;
}

function logSecurityEvent(req, type, meta = {}) {
  const safeMeta = { ...meta };
  for (const key of Object.keys(safeMeta)) {
    if (/token|secret|password|key|authorization/i.test(key)) safeMeta[key] = '[redacted]';
  }
  console.warn(JSON.stringify({
    type,
    ip: getClientIp(req),
    path: req.url,
    method: req.method,
    at: new Date().toISOString(),
    ...safeMeta
  }));
}

module.exports = {
  CSP,
  cleanString,
  getClientIp,
  logSecurityEvent,
  rateLimit,
  setSecurityHeaders,
  safeError,
  validateEmail
};
