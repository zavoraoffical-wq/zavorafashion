const { getSessionUser, json, publicUser } = require('../lib/auth-lib');

module.exports = async function handler(req, res) {
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { ok: false });
    return json(res, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Session check failed' });
  }
};
