const { json, parseBody, normalizeEmail, normalizeName, validateEmail } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-start', { windowMs: 60_000, max: 8 })) return;

  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const name = normalizeName(body.name);
    const password = String(body.password || '');

    if (!validateEmail(email)) return json(res, 400, { error: 'Valid email is required' });
    if (!password || password.length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });

    // Return success - account will be stored client-side
    return json(res, 200, { ok: true, mode: 'password', message: 'Account created successfully.' });
  } catch (error) {
    return json(res, 500, { error: 'Unable to create account. Please try again.' });
  }
};
