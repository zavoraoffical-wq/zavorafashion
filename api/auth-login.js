const { bcrypt, db, json, normalizeEmail, parseBody, publicUser, setSessionCookie, validateEmail } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-login', { windowMs: 60_000, max: 10 })) return;
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!validateEmail(email) || !password) return json(res, 400, { error: 'Email and password are required' });
    const database = await db();
    const attempts = database.collection('login_attempts');
    const attempt = await attempts.findOne({ email });
    const lockedUntil = attempt?.lockedUntil ? new Date(attempt.lockedUntil) : null;
    if (lockedUntil && lockedUntil > new Date()) {
      logSecurityEvent(req, 'login_locked', { email });
      return json(res, 423, { error: 'Too many failed attempts. Please try again later.' });
    }
    const user = await database.collection('users').findOne({ email });
    if (!user) {
      await attempts.updateOne(
        { email },
        { $inc: { count: 1 }, $set: { updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      logSecurityEvent(req, 'login_failed_unknown_user', { email });
      return json(res, 401, { error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) {
      const failed = Number(attempt?.count || 0) + 1;
      await attempts.updateOne(
        { email },
        { $set: { count: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      logSecurityEvent(req, 'login_failed_bad_password', { email, failed });
      return json(res, 401, { error: 'Invalid email or password' });
    }
    await attempts.deleteOne({ email }).catch(() => {});
    setSessionCookie(req, res, user);
    return json(res, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    logSecurityEvent(req, 'login_error', { message: error.message });
    return json(res, 500, { error: 'Login failed' });
  }
};
