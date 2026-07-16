const { bcrypt, db, json, normalizeEmail, parseBody, publicUser, setSessionCookie, verifyOtp } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-otp', { windowMs: 60_000, max: 10 })) return;
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const otp = String(body.otp || '').trim();
    const purpose = String(body.purpose || 'signup');
    if (!email || !otp) return json(res, 400, { error: 'Email and OTP are required' });
    if (!['signup', 'reset'].includes(purpose)) return json(res, 400, { error: 'Invalid OTP purpose' });
    const extra = await verifyOtp(email, purpose, otp);
    if (!extra) return json(res, 401, { error: 'Invalid or expired OTP' });
    const database = await db();
    let user;
    if (purpose === 'signup') {
      user = await database.collection('users').findOne({ email });
      if (!user) {
        const now = new Date();
        const result = await database.collection('users').insertOne({
          email,
          name: extra.name || email.split('@')[0],
          passwordHash: extra.passwordHash,
          createdAt: now,
          updatedAt: now
        });
        user = await database.collection('users').findOne({ _id: result.insertedId });
      }
    } else {
      const newPassword = String(body.newPassword || '');
      if (newPassword.length < 6) return json(res, 400, { error: 'New password must be at least 6 characters' });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await database.collection('users').updateOne({ email }, { $set: { passwordHash, updatedAt: new Date() } });
      user = await database.collection('users').findOne({ email });
      if (!user) return json(res, 404, { error: 'Account not found' });
    }
    setSessionCookie(req, res, user);
    return json(res, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    logSecurityEvent(req, 'otp_verify_error', { message: error.message });
    return json(res, 500, { error: 'OTP verification failed' });
  }
};
