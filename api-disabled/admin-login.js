const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const { createAdminSession, parseCookies, sign } = require('../lib/admin-auth');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

function json(req, res, status, data) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function verifiedSender(value) {
  const fallback = 'Zavora Admin <noreply@zavorafashion.com>';
  const sender = String(value || '').trim();
  if (!sender) return fallback;
  const match = sender.match(/<([^>]+)>/) || sender.match(/([^\s<>]+@[^\s<>]+)/);
  const email = String(match?.[1] || '').toLowerCase();
  return email.endsWith('@zavorafashion.com') ? sender : fallback;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(req, res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'admin-login', { windowMs: 60_000, max: 6 })) return;

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(req, res, 400, { error: 'Invalid JSON body' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const adminEmail = String(process.env.ADMIN_EMAIL || 'kitchenwala1@gmail.com').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!process.env.ADMIN_AUTH_SECRET && !process.env.AUTH_JWT_SECRET) return json(req, res, 500, { error: 'Admin auth secret is not configured' });
  if (!adminEmail || !adminPassword) return json(req, res, 500, { error: 'Admin env is not configured' });
  if (email !== adminEmail || password !== adminPassword) {
    logSecurityEvent(req, 'admin_login_failed', { email });
    return json(req, res, 401, { error: 'Invalid admin credentials' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.admin_otp_verified === '1') {
    const sessionData = createAdminSession(email);
    res.setHeader('Set-Cookie', `admin_session=${sessionData.session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${sessionData.sessionMaxAge}; Priority=High`);
    return json(req, res, 200, {
      ok: true,
      passwordOnly: true,
      email,
      expiresAt: sessionData.expiresAt
    });
  }

  if (!process.env.RESEND_API_KEY) return json(req, res, 500, { error: 'Missing RESEND_API_KEY' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const challenge = Buffer.from(JSON.stringify({
    email,
    expiresAt,
    hash: sign(`${email}:${otp}:${expiresAt}`)
  })).toString('base64url');

  const from = verifiedSender(process.env.ADMIN_OTP_EMAIL || process.env.NOREPLY_FROM_EMAIL);
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Zavora Admin Login OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#111;line-height:1.6">
          <h1 style="font-family:Georgia,serif;font-size:34px;margin-bottom:8px">Admin login code</h1>
          <p>Use this one-time code to access the hidden Zavora Fashion admin control center.</p>
          <p style="font-size:34px;letter-spacing:8px;font-weight:800">${otp}</p>
          <p>This code expires in 10 minutes. If you did not request it, please secure your admin password.</p>
          <p>Zavora Fashion Support</p>
        </div>
      `,
      text: `Your Zavora Admin OTP is ${otp}. This code expires in 10 minutes.`
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json(req, res, response.status, { error: data.message || 'OTP email failed' });

  return json(req, res, 200, { ok: true, challenge });
};
