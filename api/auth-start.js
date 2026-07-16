const { bcrypt, createOtp, db, json, normalizeEmail, normalizeName, parseBody, validateEmail } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-start', { windowMs: 60_000, max: 8 })) return;
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const name = normalizeName(body.name);
    const password = String(body.password || '');
    if (!validateEmail(email)) return json(res, 400, { error: 'Valid email is required' });
    const database = await db();
    const existing = await database.collection('users').findOne({ email });
    if (existing) return json(res, 200, { ok: true, mode: 'password', message: 'Account exists. Login with password.' });
    if (!password) {
      const pending = await database.collection('auth_otps').findOne({ email, purpose: 'signup' }, { sort: { createdAt: -1 } });
      if (pending?.extra?.passwordHash) {
        await createOtp(email, 'signup', pending.extra);
        return json(res, 200, { ok: true, mode: 'otp', purpose: 'signup', resent: true });
      }
    }
    if (!password || password.length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });
    const passwordHash = await bcrypt.hash(password, 12);
    await createOtp(email, 'signup', { name: name || email.split('@')[0], passwordHash });
    return json(res, 200, { ok: true, mode: 'otp', purpose: 'signup' });
  } catch (error) {
    logSecurityEvent(req, 'signup_start_error', { message: error.message });
    return json(res, 500, { error: 'Unable to start signup' });
  }
};
