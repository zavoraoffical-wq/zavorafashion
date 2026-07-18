const { createOtp, db, json, normalizeEmail, parseBody, validateEmail } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-forgot', { windowMs: 60_000, max: 5 })) return;
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    if (!validateEmail(email)) return json(res, 400, { error: 'Valid email is required' });
    const database = await db();
    const user = await database.collection('users').findOne({ email });
    if (user) await createOtp(email, 'reset', {});
    return json(res, 200, { ok: true });
  } catch (error) {
    logSecurityEvent(req, 'forgot_start_error', { message: error.message });
    return json(res, 500, { error: 'Unable to send reset OTP' });
  }
};
