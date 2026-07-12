const { bcrypt, db, getSessionUser, json, parseBody } = require('../lib/auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { error: 'Login required' });
    const body = parseBody(req);
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    if (newPassword.length < 6) return json(res, 400, { error: 'New password must be at least 6 characters' });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!valid) return json(res, 401, { error: 'Current password is incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const database = await db();
    await database.collection('users').updateOne({ _id: user._id }, { $set: { passwordHash, updatedAt: new Date() } });
    return json(res, 200, { ok: true });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Password update failed' });
  }
};
