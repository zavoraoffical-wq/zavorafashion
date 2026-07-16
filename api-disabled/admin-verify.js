const { createAdminSession, safeEqual, sign } = require('../lib/admin-auth');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

function json(req, res, status, data) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(req, res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'admin-verify', { windowMs: 60_000, max: 8 })) return;

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(req, res, 400, { error: 'Invalid JSON body' });
  }

  const otp = String(body.otp || '').trim();
  let payload = {};
  try {
    payload = JSON.parse(Buffer.from(String(body.challenge || ''), 'base64url').toString('utf8'));
  } catch (error) {
    return json(req, res, 400, { error: 'Invalid login challenge' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const expiresAt = Number(payload.expiresAt || 0);
  if (!email || !expiresAt || Date.now() > expiresAt) return json(req, res, 401, { error: 'OTP expired' });

  const expected = sign(`${email}:${otp}:${expiresAt}`);
  if (!safeEqual(expected, payload.hash)) {
    logSecurityEvent(req, 'admin_otp_failed', { email });
    return json(req, res, 401, { error: 'Invalid OTP' });
  }

  const sessionData = createAdminSession(email);

  res.setHeader('Set-Cookie', [
    `admin_session=${sessionData.session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${sessionData.sessionMaxAge}; Priority=High`,
    'admin_otp_verified=1; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000; Priority=High'
  ]);
  return json(req, res, 200, { ok: true, session: sessionData.session, email, expiresAt: sessionData.expiresAt });
};
