const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function secret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.RESEND_API_KEY || 'zavora-admin-demo-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((item) => {
    const [key, ...rest] = item.trim().split('=');
    return [key, rest.join('=')];
  }).filter(([key]) => key));
}

function validSession(raw) {
  if (!raw) return null;
  let payload = {};
  try {
    payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch (error) {
    return null;
  }
  const email = String(payload.email || '').trim().toLowerCase();
  const expiresAt = Number(payload.expiresAt || 0);
  const signature = String(payload.signature || '');
  if (!email || !expiresAt || Date.now() > expiresAt) return null;
  const expected = sign(`${email}:${expiresAt}:admin`);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  return { email, expiresAt };
}

module.exports = function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = validSession(cookies.admin_session);
  return json(res, 200, { ok: Boolean(session), session });
};
