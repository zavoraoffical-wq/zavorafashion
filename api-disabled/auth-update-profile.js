const { db, getSessionUser, json, normalizeName, parseBody, publicUser } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-profile', { windowMs: 60_000, max: 20 })) return;
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { error: 'Login required' });
    const name = normalizeName(parseBody(req).name);
    if (!name) return json(res, 400, { error: 'Name is required' });
    const database = await db();
    await database.collection('users').updateOne({ _id: user._id }, { $set: { name, updatedAt: new Date() } });
    const nextUser = await database.collection('users').findOne({ _id: user._id });
    return json(res, 200, { ok: true, user: publicUser(nextUser) });
  } catch (error) {
    logSecurityEvent(req, 'profile_update_error', { message: error.message });
    return json(res, 500, { error: 'Profile update failed' });
  }
};
