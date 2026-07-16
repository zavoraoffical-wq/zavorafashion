const crypto = require('crypto');

function adminSecret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.AUTH_JWT_SECRET || '';
}

function sign(value) {
  const secret = adminSecret();
  if (!secret) throw new Error('Missing ADMIN_AUTH_SECRET');
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function parseCookies(header = '') {
  return String(header).split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return cookies;
  }, {});
}

function createAdminSession(email) {
  const sessionMaxAge = 24 * 60 * 60;
  const expiresAt = Date.now() + sessionMaxAge * 1000;
  const session = Buffer.from(JSON.stringify({
    email,
    expiresAt,
    signature: sign(`${email}:${expiresAt}:admin`)
  })).toString('base64url');
  return { session, expiresAt, sessionMaxAge };
}

function validAdminSession(req) {
  const raw = parseCookies(req.headers.cookie || '').admin_session;
  if (!raw) return null;
  let payload = {};
  try {
    payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
  const email = String(payload.email || '').trim().toLowerCase();
  const expiresAt = Number(payload.expiresAt || 0);
  const signature = String(payload.signature || '');
  if (!email || !expiresAt || Date.now() > expiresAt) return null;
  const expected = sign(`${email}:${expiresAt}:admin`);
  if (!safeEqual(signature, expected)) return null;
  return { email, expiresAt };
}

module.exports = {
  createAdminSession,
  parseCookies,
  safeEqual,
  sign,
  validAdminSession
};
