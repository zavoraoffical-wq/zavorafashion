const crypto = require('crypto');
const { cleanString, rateLimit, setSecurityHeaders, validateEmail } = require('../lib/security');
const { db, json, parseBody } = require('../lib/auth-lib');

const RESEND_API_URL = 'https://api.resend.com/emails';

function affiliateId(app) {
  return app.affiliateId || `ZAF-${String(app.email || app.id || Date.now()).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}${String(Date.now()).slice(-4)}`;
}

function publicAffiliate(app) {
  if (!app) return null;
  const { password, resetOtp, resetOtpExpiresAt, ...safe } = app;
  return safe;
}

function affiliateCoupon(id) {
  return `${String(id || 'ZAF').replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase()}10`;
}

function affiliateSender() {
  const configured = process.env.AFFILIATE_FROM_EMAIL || process.env.AFFILIATES_FROM_EMAIL;
  const fallback = 'Zavora Fashion Affiliates <affiliates@zavorafashion.com>';
  const value = String(configured || fallback).trim();
  if (!value) return fallback;
  return value.includes('<') ? value : `Zavora Fashion Affiliates <${value}>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendWelcomeEmail(record) {
  if (!process.env.RESEND_API_KEY || !validateEmail(record.email)) return;
  const loginUrl = 'https://www.zavorafashion.com/affiliate-login.html';
  const dashboardUrl = 'https://www.zavorafashion.com/affiliate-dashboard.html';
  const safeName = escapeHtml(record.fullName || 'Zavora Partner');
  const safePassword = escapeHtml(record.password || '');
  const safeAffiliateId = escapeHtml(record.affiliateId || record.id);
  const safeCoupon = escapeHtml(record.coupon || '');
  const safeLink = escapeHtml(record.link || '');
  const safeCommission = escapeHtml(String(record.commission || 10));
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f3ef;padding:28px;color:#111">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:32px">
        <p style="letter-spacing:4px;font-weight:800;color:#c9a227">ZAVORA FASHION AFFILIATES</p>
        <h1 style="font-family:Georgia,serif;font-size:42px;line-height:1.05;margin:18px 0">Welcome to Zavora Fashion Affiliate Program.</h1>
        <p>Hello ${safeName},</p>
        <p>Your affiliate account is active. Use your password below to access your separate affiliate dashboard.</p>
        <div style="border:1px solid #ddd;background:#f7f7f7;padding:18px;margin:22px 0">
          <p><strong>Affiliate ID:</strong> ${safeAffiliateId}</p>
          <p><strong>Your Password:</strong> ${safePassword}</p>
          <p><strong>Commission Rate:</strong> ${safeCommission}%</p>
          <p><strong>Coupon Code:</strong> ${safeCoupon}</p>
          <p><strong>Affiliate Link:</strong> <a href="${safeLink}">${safeLink}</a></p>
        </div>
        <p><a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 22px;letter-spacing:2px">LOGIN TO DASHBOARD</a></p>
        <p style="color:#666">Dashboard URL: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        <p style="border-top:1px solid #ddd;padding-top:18px;margin-top:24px">Payouts are reviewed every 7 days. Minimum withdrawal is $5.</p>
        <p>Zavora Fashion Affiliate Team</p>
      </div>
    </div>
  `;
  const text = [
    'Welcome to Zavora Fashion Affiliate Program',
    '',
    `Hello ${record.fullName || 'Zavora Partner'},`,
    'Your affiliate account is active.',
    '',
    `Login URL: ${loginUrl}`,
    `Your Password: ${record.password || ''}`,
    `Affiliate ID: ${record.affiliateId || record.id}`,
    `Affiliate Link: ${record.link || ''}`,
    `Coupon Code: ${record.coupon || ''}`,
    `Commission Rate: ${record.commission || 10}%`,
    `Dashboard URL: ${dashboardUrl}`,
    '',
    'Payouts are reviewed every 7 days. Minimum withdrawal is $5.',
    'Zavora Fashion Affiliate Team'
  ].join('\n');
  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: affiliateSender(),
      to: record.email,
      subject: 'Welcome to Zavora Fashion Affiliate Program',
      html,
      text
    })
  }).catch(() => null);
}

async function sendPasswordResetEmail(record, otp) {
  if (!process.env.RESEND_API_KEY || !validateEmail(record.email)) return false;
  const loginUrl = 'https://www.zavorafashion.com/affiliate-login.html';
  const safeName = escapeHtml(record.fullName || 'Zavora Partner');
  const safeOtp = escapeHtml(otp);
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f3ef;padding:28px;color:#111">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:32px">
        <p style="letter-spacing:4px;font-weight:800;color:#c9a227">ZAVORA FASHION AFFILIATES</p>
        <h1 style="font-family:Georgia,serif;font-size:38px;line-height:1.1;margin:18px 0">Reset your affiliate password.</h1>
        <p>Hello ${safeName},</p>
        <p>Your one-time password reset code is:</p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:800;border:1px solid #ddd;background:#f7f7f7;padding:18px;margin:22px 0;text-align:center">${safeOtp}</div>
        <p>This code expires in 10 minutes. If you did not request this reset, ignore this email.</p>
        <p><a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 22px;letter-spacing:2px">OPEN AFFILIATE LOGIN</a></p>
        <p>Zavora Fashion Affiliate Team</p>
      </div>
    </div>
  `;
  const text = [
    'Zavora Fashion Affiliate Password Reset',
    '',
    `Hello ${record.fullName || 'Zavora Partner'},`,
    `Your password reset code is: ${otp}`,
    'This code expires in 10 minutes.',
    `Login URL: ${loginUrl}`,
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
      to: record.email,
      subject: 'Your Zavora Affiliate Password Reset Code',
      html,
      text
    })
  }).catch(() => null);
  return Boolean(response?.ok);
}

function normalizeApplication(body = {}) {
  return {
    fullName: cleanString(body.fullName || body.name || '', 120),
    email: String(body.email || '').trim().toLowerCase(),
    password: cleanString(body.password || '', 120),
    phone: cleanString(body.phone || '', 40),
    country: cleanString(body.country || '', 80),
    website: cleanString(body.website || '', 220),
    instagram: cleanString(body.instagram || '', 160),
    youtube: cleanString(body.youtube || '', 160),
    tiktok: cleanString(body.tiktok || '', 160),
    pinterest: cleanString(body.pinterest || '', 160),
    facebook: cleanString(body.facebook || '', 160),
    x: cleanString(body.x || '', 160),
    followers: cleanString(body.followers || '', 80),
    monthlyTraffic: cleanString(body.monthlyTraffic || '', 80),
    promotionMethod: cleanString(body.promotionMethod || '', 180),
    reason: cleanString(body.reason || body.why || '', 1200)
  };
}

module.exports = async function handler(req, res) {
  setSecurityHeaders(req, res);
  if (!rateLimit(req, res, 'affiliate-api', { windowMs: 60_000, max: 40 })) return;

  const action = String(req.query.action || '').trim();
  const database = await db();
  const collection = database.collection('affiliates');

  if (req.method === 'POST' && action === 'apply') {
    const body = parseBody(req);
    if (!body.agree) return json(res, 400, { ok: false, error: 'Agree to terms before applying.' });
    const app = normalizeApplication(body);
    if (!validateEmail(app.email)) return json(res, 400, { ok: false, error: 'Valid email is required.' });
    if (!app.fullName) return json(res, 400, { ok: false, error: 'Full name is required.' });
    if (!app.password || app.password.length < 6) return json(res, 400, { ok: false, error: 'Create a password with at least 6 characters.' });

    const existing = await collection.findOne({ email: app.email });
    if (existing) {
      return json(res, 200, {
        ok: true,
        exists: true,
        app: publicAffiliate(existing),
        message: existing.status === 'approved' ? 'Affiliate account already exists. Please login.' : `Affiliate profile already exists with status: ${existing.status || 'pending'}.`
      });
    }

    const id = `AFF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newAffiliateId = affiliateId({ ...app, id });
    const coupon = affiliateCoupon(newAffiliateId);
    const record = {
      ...app,
      _id: id,
      id,
      status: 'approved',
      affiliateId: newAffiliateId,
      coupon,
      link: `https://www.zavorafashion.com/?ref=${encodeURIComponent(newAffiliateId)}`,
      commission: 10,
      clicks: 0,
      orders: 0,
      revenue: 0,
      pendingBalance: 0,
      paidBalance: 0,
      availableBalance: 0,
      approvedBalance: 0,
      lifetimeRevenue: 0,
      lifetimeCommission: 0,
      referralLinks: [],
      coupons: [],
      payoutRequests: [],
      notifications: [{ message: 'Affiliate account created. Welcome to Zavora Fashion.', createdAt: new Date().toISOString() }],
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await collection.insertOne(record);
    sendWelcomeEmail(record);
    return json(res, 200, { ok: true, app: publicAffiliate(record), message: 'Affiliate account created. Welcome email sent from affiliates@zavorafashion.com.' });
  }

  if (req.method === 'POST' && action === 'click') {
    const body = parseBody(req);
    const ref = cleanString(body.ref || '', 80);
    const page = cleanString(body.page || '', 180);
    if (!ref) return json(res, 400, { ok: false, error: 'Referral code is required.' });
    const app = await collection.findOne({
      $or: [
        { affiliateId: ref },
        { id: ref },
        { 'coupons.code': ref },
        { coupons: ref }
      ]
    });
    if (!app) return json(res, 200, { ok: true, tracked: false });
    await collection.updateOne(
      { _id: app._id },
      {
        $inc: { clicks: 1 },
        $set: { lastClickAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        $push: {
          clickEvents: {
            $each: [{ ref, page, at: new Date().toISOString() }],
            $slice: -100
          }
        }
      }
    );
    return json(res, 200, { ok: true, tracked: true });
  }

  if (req.method === 'POST' && action === 'login') {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    if (!validateEmail(email) || !password) return json(res, 400, { ok: false, error: 'Email and password are required.' });
    const app = await collection.findOne({ email });
    if (!app || app.status !== 'approved') return json(res, 401, { ok: false, error: 'Affiliate account is not approved yet.' });
    if (!app.password || String(app.password).trim() !== password) return json(res, 401, { ok: false, error: 'Invalid affiliate credentials.' });
    await collection.updateOne({ _id: app._id }, { $set: { lastLoginAt: new Date().toISOString() } });
    return json(res, 200, { ok: true, app: publicAffiliate(app) });
  }

  if (req.method === 'POST' && action === 'forgot-start') {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!validateEmail(email)) return json(res, 400, { ok: false, error: 'Valid affiliate email is required.' });
    const app = await collection.findOne({ email });
    if (!app || app.status !== 'approved') return json(res, 404, { ok: false, error: 'Approved affiliate account not found.' });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await collection.updateOne(
      { _id: app._id },
      {
        $set: {
          resetOtp: otp,
          resetOtpExpiresAt: Date.now() + (10 * 60 * 1000),
          updatedAt: new Date().toISOString()
        }
      }
    );
    const sent = await sendPasswordResetEmail(app, otp);
    if (!sent) {
      return json(res, 503, { ok: false, error: 'Email OTP service is not ready. Please contact affiliates@zavorafashion.com.' });
    }
    return json(res, 200, { ok: true, message: 'OTP sent to your affiliate email.' });
  }

  if (req.method === 'POST' && action === 'forgot-reset') {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const otp = String(body.otp || '').replace(/\D/g, '').slice(0, 6);
    const password = cleanString(body.password || '', 120);
    if (!validateEmail(email) || otp.length !== 6 || password.length < 6) {
      return json(res, 400, { ok: false, error: 'Email, 6-digit OTP, and new password are required.' });
    }
    const app = await collection.findOne({ email });
    if (!app || app.status !== 'approved') return json(res, 404, { ok: false, error: 'Approved affiliate account not found.' });
    if (!app.resetOtp || String(app.resetOtp) !== otp || Date.now() > Number(app.resetOtpExpiresAt || 0)) {
      return json(res, 401, { ok: false, error: 'Invalid or expired OTP.' });
    }
    await collection.updateOne(
      { _id: app._id },
      {
        $set: { password, updatedAt: new Date().toISOString(), passwordChangedAt: new Date().toISOString() },
        $unset: { resetOtp: '', resetOtpExpiresAt: '' }
      }
    );
    return json(res, 200, { ok: true, message: 'Affiliate password updated.' });
  }

  return json(res, 404, { ok: false, error: 'Unknown affiliate action' });
};
