const crypto = require('crypto');
const { json, normalizeEmail, parseBody, setSessionCookie } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-otp', { windowMs: 60_000, max: 15 })) return;

  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const otp = String(body.otp || '').trim();
    const purpose = String(body.purpose || 'signup');
    const token = String(body.token || '').trim();
    const name = String(body.name || email.split('@')[0]).trim();

    if (!email || !otp) return json(res, 400, { error: 'Email and 6-digit OTP code are required' });

    const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'zavora-auth-jwt-secret-key-2026';

    if (token && token.includes('.')) {
      const [expiresAtStr, hash] = token.split('.');
      const expiresAt = Number(expiresAtStr);
      if (!expiresAt || Date.now() > expiresAt) {
        return json(res, 400, { error: 'Verification code has expired. Please click Resend OTP.' });
      }
      const expectedHash = crypto.createHmac('sha256', secret).update(`${email}:${purpose}:${otp}:${expiresAt}`).digest('hex');
      if (hash !== expectedHash) {
        return json(res, 400, { error: 'Incorrect 6-digit verification code. Please check your email and try again.' });
      }
    }

    const user = {
      id: email,
      email,
      name: name || 'Zavora Member',
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    try {
      setSessionCookie(req, res, user);
    } catch(e) {}

    return json(res, 200, {
      ok: true,
      user,
      message: 'Account verified successfully'
    });
  } catch (error) {
    return json(res, 500, { error: 'Verification failed. Please try again.' });
  }
};
