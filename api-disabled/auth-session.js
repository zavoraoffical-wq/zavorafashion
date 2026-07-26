const { json } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-session', { windowMs: 60_000, max: 120 })) return;

  try {
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/zavora_session=([^;]+)/);
    if (!sessionMatch) return json(res, 401, { ok: false });

    const cookieValue = Buffer.from(decodeURIComponent(sessionMatch[1]), 'base64').toString('utf8');
    const session = JSON.parse(cookieValue);
    if (!session || !session.user) return json(res, 401, { ok: false });

    return json(res, 200, { ok: true, session: true, user: session.user });
  } catch (error) {
    return json(res, 401, { ok: false });
  }
};
