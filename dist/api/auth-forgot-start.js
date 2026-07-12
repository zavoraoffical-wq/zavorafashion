const { createOtp, db, json, normalizeEmail, parseBody } = require('../lib/auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    if (!email || !email.includes('@')) return json(res, 400, { error: 'Valid email is required' });
    const database = await db();
    const user = await database.collection('users').findOne({ email });
    if (user) await createOtp(email, 'reset', {});
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Unable to send reset OTP' });
  }
};
