const { bcrypt, db, json, normalizeEmail, parseBody, publicUser, setSessionCookie } = require('./auth-lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!email || !password) return json(res, 400, { error: 'Email and password are required' });
    const database = await db();
    const user = await database.collection('users').findOne({ email });
    if (!user) return json(res, 404, { error: 'ACCOUNT_NOT_FOUND' });
    const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) return json(res, 401, { error: 'Invalid email or password' });
    setSessionCookie(req, res, user);
    return json(res, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Login failed' });
  }
};
