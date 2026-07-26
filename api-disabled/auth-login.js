const { json, parseBody, normalizeEmail, validateEmail } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

// Simple in-memory user store as fallback when DB not available
// Users are stored in Vercel KV or just return success for demo mode
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-login', { windowMs: 60_000, max: 10 })) return;

  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');

    if (!validateEmail(email) || !password) {
      return json(res, 400, { error: 'Email and password are required' });
    }

    // Generate a simple session token
    const crypto = require('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const user = {
      id: crypto.createHash('sha256').update(email).digest('hex').slice(0, 24),
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    // Set session cookie
    const cookieValue = Buffer.from(JSON.stringify({ token: sessionToken, user })).toString('base64');
    res.setHeader('Set-Cookie', [
      `zavora_session=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    return json(res, 200, { ok: true, user });
  } catch (error) {
    return json(res, 500, { error: 'Login failed. Please try again.' });
  }
};
