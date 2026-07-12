const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

let cachedClient;
let cachedDb;

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (error) {
      return {};
    }
  }
  return {};
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function jwtSecret() {
  return process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';
}

function mongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || '';
}

async function db() {
  const uri = mongoUri();
  if (!uri) throw new Error('Missing MONGODB_URI');
  if (cachedDb) return cachedDb;
  cachedClient = cachedClient || new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'zavora_fashion');
  await cachedDb.collection('users').createIndex({ email: 1 }, { unique: true });
  await cachedDb.collection('auth_otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await cachedDb.collection('auth_otps').createIndex({ email: 1, purpose: 1, createdAt: -1 });
  return cachedDb;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id || ''),
    email: user.email,
    name: user.name || 'Zavora Customer',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function hashOtp(email, purpose, otp) {
  return crypto.createHmac('sha256', jwtSecret()).update(`${email}:${purpose}:${otp}`).digest('hex');
}

function otpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function verifiedSender(value) {
  const fallback = 'Zavora Fashion <noreply@zavorafashion.com>';
  const sender = String(value || '').trim();
  if (!sender) return fallback;
  const match = sender.match(/<([^>]+)>/) || sender.match(/([^\s<>]+@[^\s<>]+)/);
  const email = String(match?.[1] || '').toLowerCase();
  return email.endsWith('@zavorafashion.com') ? sender : fallback;
}

async function sendOtpEmail(to, otp, purpose) {
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  const reset = purpose === 'reset';
  const subject = reset ? 'Your Zavora Fashion Password Reset Code' : 'Your Zavora Fashion Verification Code';
  const action = reset ? 'reset your password' : 'verify your account';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: verifiedSender(process.env.NOREPLY_FROM_EMAIL || process.env.EMAIL_FROM || process.env.FROM_EMAIL),
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Zavora Fashion</h2>
          <p>Use this code to ${action}:</p>
          <p style="font-size:32px;letter-spacing:8px;font-weight:700">${otp}</p>
          <p>This code expires in 10 minutes. If you did not request it, please ignore this email.</p>
        </div>
      `
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || 'Email delivery failed');
  }
}

async function createOtp(email, purpose, extra = {}) {
  if (!jwtSecret()) throw new Error('Missing AUTH_JWT_SECRET');
  const database = await db();
  const otp = otpCode();
  await database.collection('auth_otps').deleteMany({ email, purpose });
  await database.collection('auth_otps').insertOne({
    email,
    purpose,
    otpHash: hashOtp(email, purpose, otp),
    extra,
    attempts: 0,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  await sendOtpEmail(email, otp, purpose);
}

async function verifyOtp(email, purpose, otp) {
  if (!jwtSecret()) throw new Error('Missing AUTH_JWT_SECRET');
  const database = await db();
  const record = await database.collection('auth_otps').findOne({ email, purpose }, { sort: { createdAt: -1 } });
  if (!record || record.expiresAt < new Date()) return null;
  if (record.attempts >= 5) return null;
  const valid = record.otpHash === hashOtp(email, purpose, otp);
  if (!valid) {
    await database.collection('auth_otps').updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return null;
  }
  await database.collection('auth_otps').deleteOne({ _id: record._id });
  return record.extra || {};
}

function parseCookies(header = '') {
  return String(header).split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
    return cookies;
  }, {});
}

function cookieSecureFlag(req) {
  const host = String(req.headers.host || '');
  return host.includes('localhost') || host.startsWith('127.0.0.1') ? '' : '; Secure';
}

function setSessionCookie(req, res, user) {
  if (!jwtSecret()) throw new Error('Missing AUTH_JWT_SECRET');
  const maxAge = 30 * 24 * 60 * 60;
  const token = jwt.sign({ sub: String(user._id), email: user.email }, jwtSecret(), { expiresIn: maxAge });
  res.setHeader('Set-Cookie', `zavora_session=${encodeURIComponent(token)}; HttpOnly${cookieSecureFlag(req)}; SameSite=Lax; Path=/; Max-Age=${maxAge}`);
}

function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `zavora_session=; HttpOnly${cookieSecureFlag(req)}; SameSite=Lax; Path=/; Max-Age=0`);
}

async function getSessionUser(req) {
  const token = parseCookies(req.headers.cookie || '').zavora_session;
  if (!token || !jwtSecret()) return null;
  try {
    const payload = jwt.verify(token, jwtSecret());
    const database = await db();
    const user = await database.collection('users').findOne({ _id: new ObjectId(payload.sub) });
    return user || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  bcrypt,
  clearSessionCookie,
  createOtp,
  db,
  getSessionUser,
  json,
  normalizeEmail,
  parseBody,
  publicUser,
  setSessionCookie,
  verifyOtp
};
