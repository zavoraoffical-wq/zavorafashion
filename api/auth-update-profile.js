const { db, getSessionUser, json, parseBody, publicUser } = require('./auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { error: 'Login required' });
    const name = String(parseBody(req).name || '').trim();
    if (!name) return json(res, 400, { error: 'Name is required' });
    const database = await db();
    await database.collection('users').updateOne({ _id: user._id }, { $set: { name, updatedAt: new Date() } });
    const nextUser = await database.collection('users').findOne({ _id: user._id });
    return json(res, 200, { ok: true, user: publicUser(nextUser) });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Profile update failed' });
  }
};
