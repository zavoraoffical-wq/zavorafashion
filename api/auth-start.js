const { bcrypt, createOtp, db, json, normalizeEmail, parseBody } = require('./auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    if (!email || !email.includes('@')) return json(res, 400, { error: 'Valid email is required' });
    const database = await db();
    const existing = await database.collection('users').findOne({ email });
    if (existing) return json(res, 200, { ok: true, mode: 'password', message: 'Account exists. Login with password.' });
    if (!password || password.length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });
    const passwordHash = await bcrypt.hash(password, 12);
    await createOtp(email, 'signup', { name: name || email.split('@')[0], passwordHash });
    return json(res, 200, { ok: true, mode: 'otp', purpose: 'signup' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Unable to start signup' });
  }
};
