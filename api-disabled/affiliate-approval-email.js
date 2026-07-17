const { cleanString, setSecurityHeaders, validateEmail } = require('../lib/security');

const RESEND_API_URL = 'https://api.resend.com/emails';

function json(req, res, status, body) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function affiliateSender() {
  const configured = process.env.AFFILIATE_FROM_EMAIL || process.env.AFFILIATES_FROM_EMAIL;
  const fallback = 'Zavora Fashion Affiliates <affiliates@zavorafashion.com>';
  const value = String(configured || fallback).trim();
  if (!value) return fallback;
  if (value.includes('<')) return value;
  return `Zavora Fashion Affiliates <${value}>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(req, res, 405, { ok: false, error: 'Method not allowed' });
  }
  if (!process.env.RESEND_API_KEY) {
    return json(req, res, 500, { ok: false, error: 'RESEND_API_KEY is not configured' });
  }

  let payload = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (error) {
    return json(req, res, 400, { ok: false, error: 'Invalid JSON body' });
  }

  const to = String(payload.email || '').trim().toLowerCase();
  if (!validateEmail(to)) {
    return json(req, res, 400, { ok: false, error: 'Valid affiliate email is required' });
  }

  const name = cleanString(payload.fullName || 'Zavora Partner', 120);
  const password = cleanString(payload.password || '', 120);
  const affiliateId = cleanString(payload.affiliateId || '', 80);
  const link = cleanString(payload.link || 'https://www.zavorafashion.com/affiliate/login', 260);
  const coupon = cleanString(payload.coupon || '', 80);
  const commission = Number(payload.commission || 10);
  if (!password || !affiliateId) {
    return json(req, res, 400, { ok: false, error: 'Affiliate credentials are required' });
  }

  const loginUrl = 'https://www.zavorafashion.com/affiliate-login.html';
  const dashboardUrl = 'https://www.zavorafashion.com/affiliate-dashboard.html';
  const safeName = escapeHtml(name);
  const safePassword = escapeHtml(password);
  const safeAffiliateId = escapeHtml(affiliateId);
  const safeLink = escapeHtml(link);
  const safeCoupon = escapeHtml(coupon);
  const safeCommission = escapeHtml(String(commission));

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f3ef;padding:28px;color:#111">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:32px">
        <p style="letter-spacing:4px;font-weight:800;color:#c9a227">ZAVORA FASHION AFFILIATES</p>
        <h1 style="font-family:Georgia,serif;font-size:42px;line-height:1.05;margin:18px 0">Welcome to the Zavora Fashion Affiliate Program.</h1>
        <p>Hello ${safeName},</p>
        <p>Your affiliate account has been approved. Use the credentials below to access your separate affiliate dashboard.</p>
        <div style="border:1px solid #ddd;background:#f7f7f7;padding:18px;margin:22px 0">
          <p><strong>Affiliate ID:</strong> ${safeAffiliateId}</p>
          <p><strong>Affiliate Password:</strong> ${safePassword}</p>
          <p><strong>Commission Rate:</strong> ${safeCommission}%</p>
          <p><strong>Coupon Code:</strong> ${safeCoupon}</p>
          <p><strong>Affiliate Link:</strong> <a href="${safeLink}">${safeLink}</a></p>
        </div>
        <p><a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 22px;letter-spacing:2px">LOGIN TO DASHBOARD</a></p>
        <p style="color:#666">Dashboard URL: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        <p style="border-top:1px solid #ddd;padding-top:18px;margin-top:24px">Designed in the USA. Crafted for Everyday Luxury.</p>
        <p>Zavora Fashion Affiliate Team</p>
      </div>
    </div>
  `;

  const text = [
    'Welcome to Zavora Fashion Affiliate Program',
    '',
    `Hello ${name},`,
    'Your affiliate account has been approved.',
    '',
    `Login URL: ${loginUrl}`,
    `Affiliate Password: ${password}`,
    `Affiliate ID: ${affiliateId}`,
    `Affiliate Link: ${link}`,
    `Coupon Code: ${coupon}`,
    `Commission Rate: ${commission}%`,
    `Dashboard URL: ${dashboardUrl}`,
    '',
    'Zavora Fashion Affiliate Team'
  ].join('\n');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: affiliateSender(),
      to,
      subject: 'Welcome to Zavora Fashion Affiliate Program',
      html,
      text
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(req, res, response.status, { ok: false, error: data.message || 'Affiliate approval email failed' });
  }
  return json(req, res, 200, { ok: true, id: data.id });
};
