const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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

function configuredAdminEmail() {
  return String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
}

async function verifyAdminCredentials(email, password) {
  const suppliedEmail = String(email || '').trim().toLowerCase();
  const suppliedPassword = String(password || '');
  const adminEmail = configuredAdminEmail();
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim();
  const legacyPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!adminEmail) return { ok: false, status: 500, error: 'ADMIN_EMAIL is not configured' };
  if (!passwordHash && !legacyPassword) return { ok: false, status: 500, error: 'ADMIN_PASSWORD_HASH is not configured' };
  if (!suppliedEmail || !suppliedPassword) return { ok: false, status: 400, error: 'Admin email and password are required' };
  if (suppliedEmail !== adminEmail) return { ok: false, status: 401, error: 'Invalid admin credentials' };

  if (passwordHash) {
    const matches = await bcrypt.compare(suppliedPassword, passwordHash);
    return matches
      ? { ok: true, email: suppliedEmail }
      : { ok: false, status: 401, error: 'Invalid admin credentials' };
  }

  return safeEqual(suppliedPassword, legacyPassword)
    ? { ok: true, email: suppliedEmail, legacyPassword: true }
    : { ok: false, status: 401, error: 'Invalid admin credentials' };
}

function adminSessionCookie(sessionData) {
  return `admin_session=${sessionData.session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${sessionData.sessionMaxAge}; Priority=High`;
}

function clearAdminSessionCookies() {
  return [
    'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Priority=High',
    'admin_otp_verified=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Priority=High'
  ];
}

function requireAdminSession(req, res) {
  const session = validAdminSession(req);
  if (session) return session;
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify({ ok: false, error: 'Admin authentication required' }));
  return null;
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
  adminSessionCookie,
  clearAdminSessionCookies,
  configuredAdminEmail,
  createAdminSession,
  parseCookies,
  requireAdminSession,
  safeEqual,
  sign,
  validAdminSession,
  verifyAdminCredentials
};
