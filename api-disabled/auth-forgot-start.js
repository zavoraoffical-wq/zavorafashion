const crypto = require('crypto');
const { json, parseBody, normalizeEmail, validateEmail } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

const RESEND_API_URL = 'https://api.resend.com/emails';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-forgot', { windowMs: 60_000, max: 8 })) return;

  try {
    const body = parseBody(req);
    const email = normalizeEmail(body.email);
    if (!validateEmail(email)) return json(res, 400, { error: 'Valid email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || 'zavora-auth-jwt-secret-key-2026';
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const hmac = crypto.createHmac('sha256', secret).update(`${email}:reset:${otp}:${expiresAt}`).digest('hex');
    const token = `${expiresAt}.${hmac}`;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.NEWSLETTER_FROM_EMAIL || process.env.WELCOME_EMAIL || 'Zavora Fashion <hello@zavorafashion.com>';

    if (apiKey) {
      const html = `
        <div style="font-family:Arial,sans-serif;background:#fafafa;padding:32px 16px;color:#111">
          <div style="max-width:540px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;padding:36px 28px;text-align:center">
            <p style="letter-spacing:4px;font-weight:700;color:#888;font-size:12px;margin:0 0 14px 0">ZAVORA FASHION</p>
            <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px 0;color:#111">Password Reset Code</h1>
            <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px 0">Use this 6-digit code to reset your Zavora Fashion account password:</p>
            <div style="font-size:36px;letter-spacing:10px;font-weight:800;color:#111;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:8px;padding:16px 24px;display:inline-block;margin:0 auto 24px auto">${otp}</div>
            <p style="font-size:13px;color:#777;margin:0 0 8px 0">This code expires in 10 minutes.</p>
            <p style="font-size:12px;color:#999;margin:0">If you did not request a password reset, you can safely ignore this email.</p>
            <div style="border-top:1px solid #eee;margin-top:28px;padding-top:16px;font-size:12px;color:#aaa">
              &copy; 2026 Zavora Fashion &bull; Designed in the USA
            </div>
          </div>
        </div>
      `;

      await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: `Your Zavora Fashion Password Reset Code: ${otp}`,
          html,
          text: `Your password reset code is: ${otp}. This code expires in 10 minutes.`
        })
      });
    }

    return json(res, 200, {
      ok: true,
      email,
      purpose: 'reset',
      token,
      message: `Password reset code sent to ${email}`
    });
  } catch (error) {
    return json(res, 500, { error: 'Unable to send reset OTP. Please try again.' });
  }
};
