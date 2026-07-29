const { adminSessionCookie, createAdminSession, verifyAdminCredentials } = require('../lib/admin-auth');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

function json(req, res, status, data) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(String(req.body || '{}'));
  } catch (error) {
    return {};
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(req, res, 405, { ok: false, error: 'Method not allowed' });
  if (!rateLimit(req, res, 'admin-login', { windowMs: 60_000, max: 8 })) return;

  if (!process.env.ADMIN_AUTH_SECRET && !process.env.AUTH_JWT_SECRET) {
    return json(req, res, 500, { ok: false, error: 'ADMIN_AUTH_SECRET is not configured' });
  }

  const body = parseBody(req);
  const result = await verifyAdminCredentials(body.email, body.password);
  if (!result.ok) {
    logSecurityEvent(req, 'admin_login_failed', { email: String(body.email || '').trim().toLowerCase() });
    return json(req, res, result.status || 401, { ok: false, error: result.error || 'Invalid admin credentials' });
  }

  const sessionData = createAdminSession(result.email);
  res.setHeader('Set-Cookie', adminSessionCookie(sessionData));
  return json(req, res, 200, {
    ok: true,
    email: result.email,
    expiresAt: sessionData.expiresAt,
    message: result.legacyPassword
      ? 'Logged in. For stronger security, set ADMIN_PASSWORD_HASH and remove ADMIN_PASSWORD.'
      : 'Logged in securely.'
  });
};
