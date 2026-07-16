const { getSessionUser, json, publicUser } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-session', { windowMs: 60_000, max: 120 })) return;
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { ok: false });
    return json(res, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    logSecurityEvent(req, 'session_error', { message: error.message });
    return json(res, 500, { error: 'Session check failed' });
  }
};
