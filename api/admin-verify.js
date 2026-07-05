const crypto = require('crypto');

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function secret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.RESEND_API_KEY || 'zavora-admin-demo-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const otp = String(body.otp || '').trim();
  let payload = {};
  try {
    payload = JSON.parse(Buffer.from(String(body.challenge || ''), 'base64url').toString('utf8'));
  } catch (error) {
    return json(res, 400, { error: 'Invalid login challenge' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const expiresAt = Number(payload.expiresAt || 0);
  if (!email || !expiresAt || Date.now() > expiresAt) return json(res, 401, { error: 'OTP expired' });

  const expected = sign(`${email}:${otp}:${expiresAt}`);
  if (!safeEqual(expected, payload.hash)) return json(res, 401, { error: 'Invalid OTP' });

  const sessionExpiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const session = Buffer.from(JSON.stringify({
    email,
    expiresAt: sessionExpiresAt,
    signature: sign(`${email}:${sessionExpiresAt}:admin`)
  })).toString('base64url');

  res.setHeader('Set-Cookie', `admin_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`);
  return json(res, 200, { ok: true, session, email, expiresAt: sessionExpiresAt });
};
