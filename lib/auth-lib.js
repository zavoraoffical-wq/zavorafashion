const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const { Pool } = require('pg');
const { cleanString, setSecurityHeaders, validateEmail } = require('./security');

let cachedClient;
let cachedDb;
let cachedSupabaseDb;
let cachedPostgresDb;
let cachedPostgresPool;
const ensuredPostgresTables = new Set();

function json(res, status, data) {
  res.statusCode = status;
  setSecurityHeaders({ headers: {} }, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > 64 * 1024) throw new Error('Request body too large');
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

function normalizeName(name) {
  return cleanString(name, 80) || 'Zavora customer';
}

function jwtSecret() {
  return envValue('AUTH_JWT_SECRET', 'JWT_SECRET');
}

function mongoUri() {
  return envValue('MONGODB_URI', 'MONGO_URI');
}

function postgresUri() {
  return envValue(
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'DATABASE_URL',
    'SUPABASE_DB_URL',
    'SUPABASE_POSTGRES_URL'
  );
}

function postgresConnectionString() {
  const uri = postgresUri();
  if (!uri) return '';
  try {
    const parsed = new URL(uri);
    ['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].forEach((key) => parsed.searchParams.delete(key));
    return parsed.toString();
  } catch (error) {
    return uri.replace(/[?&](sslmode|sslcert|sslkey|sslrootcert)=[^&]*/gi, '');
  }
}

async function db() {
  const uri = mongoUri();
  if (!uri) {
    if (postgresUri()) {
      cachedPostgresDb = cachedPostgresDb || postgresDocumentDb();
      return cachedPostgresDb;
    }
    if (supabaseUrl() && supabaseKey()) {
      cachedSupabaseDb = cachedSupabaseDb || supabaseDocumentDb();
      return cachedSupabaseDb;
    }
    throw new Error('Missing database connection. Add MONGODB_URI, Vercel Supabase POSTGRES_URL/POSTGRES_PRISMA_URL, or SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (cachedDb) return cachedDb;
  cachedClient = cachedClient || new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'zavora_fashion');
  await cachedDb.collection('users').createIndex({ email: 1 }, { unique: true });
  await cachedDb.collection('auth_otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await cachedDb.collection('auth_otps').createIndex({ email: 1, purpose: 1, createdAt: -1 });
  return cachedDb;
}

function supabaseUrl() {
  return envValue('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
}

function supabaseKey() {
  return envValue(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SECRET_KEY'
  );
}

function supabaseHeaders(extra = {}) {
  const key = supabaseKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...extra
  };
}

function docTable() {
  return envValue('SUPABASE_DOCUMENTS_TABLE') || 'app_documents';
}

function postgresTableName() {
  const table = docTable().replace(/[^a-zA-Z0-9_]/g, '');
  return table || 'app_documents';
}

function cleanEnvValue(value = '') {
  return String(value || '')
    .trim()
    .replace(/^[A-Z0-9_]+\s*=\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function envValue(...names) {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return '';
}

function resendApiKey() {
  return envValue('RESEND_API_KEY', 'RESEND_KEY', 'RESEND_TOKEN');
}

function reviveDocument(value = {}) {
  const doc = { ...value };
  ['createdAt', 'updatedAt', 'expiresAt', 'availableAt', 'redeemedAt', 'invalidatedAt'].forEach((key) => {
    if (doc[key] && !(doc[key] instanceof Date)) doc[key] = new Date(doc[key]);
  });
  return doc;
}

function readPath(doc, path) {
  return String(path || '').split('.').reduce((value, key) => {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value.map((item) => item?.[key]).filter((item) => item !== undefined);
    return value[key];
  }, doc);
}

function writePath(doc, path, value) {
  const keys = String(path || '').split('.').filter(Boolean);
  if (!keys.length) return;
  let cursor = doc;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
}

function deletePath(doc, path) {
  const keys = String(path || '').split('.').filter(Boolean);
  if (!keys.length) return;
  let cursor = doc;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor || typeof cursor !== 'object') return;
    cursor = cursor[key];
  });
  if (cursor && typeof cursor === 'object') delete cursor[keys[keys.length - 1]];
}

function matchesValue(actual, expected) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if ('$in' in expected) {
      const values = Array.isArray(expected.$in) ? expected.$in : [expected.$in];
      return values.some((value) => matchesValue(actual, value));
    }
    if ('$ne' in expected) return !matchesValue(actual, expected.$ne);
    if ('$exists' in expected) return Boolean(expected.$exists) ? actual !== undefined : actual === undefined;
  }
  if (Array.isArray(actual)) return actual.some((value) => matchesValue(value, expected));
  return String(actual) === String(expected);
}

function matchesFilter(doc, filter = {}) {
  return Object.entries(filter || {}).every(([key, value]) => {
    if (key === '$or') return Array.isArray(value) && value.some((item) => matchesFilter(doc, item));
    if (key === '$and') return Array.isArray(value) && value.every((item) => matchesFilter(doc, item));
    if (key === '_id') return matchesValue(doc._id, value);
    return matchesValue(readPath(doc, key), value);
  });
}

function sortDocuments(rows, sort = {}) {
  const entries = Object.entries(sort || {});
  if (!entries.length) return rows;
  return [...rows].sort((a, b) => {
    for (const [key, direction] of entries) {
      const av = a[key] instanceof Date ? a[key].getTime() : a[key];
      const bv = b[key] instanceof Date ? b[key].getTime() : b[key];
      if (av === bv) continue;
      return (av > bv ? 1 : -1) * (Number(direction) < 0 ? -1 : 1);
    }
    return 0;
  });
}

function supabaseDocumentDb() {
  return {
    collection(name) {
      return new SupabaseCollection(name);
    }
  };
}

function postgresDocumentDb() {
  return {
    collection(name) {
      return new PostgresCollection(name);
    }
  };
}

function postgresPool() {
  if (cachedPostgresPool) return cachedPostgresPool;
  cachedPostgresPool = new Pool({
    connectionString: postgresConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000
  });
  return cachedPostgresPool;
}

class PostgresCollection {
  constructor(name) {
    this.name = name;
  }

  async createIndex() {
    await this.ensureTable();
    return null;
  }

  async ensureTable() {
    const table = postgresTableName();
    if (ensuredPostgresTables.has(table)) return;
    await postgresPool().query(`
      create table if not exists public.${table} (
        id bigserial primary key,
        collection text not null,
        doc_id text not null,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique(collection, doc_id)
      )
    `);
    await postgresPool().query(`create index if not exists ${table}_collection_idx on public.${table} (collection)`);
    await postgresPool().query(`create index if not exists ${table}_email_idx on public.${table} ((payload->>'email'))`);
    ensuredPostgresTables.add(table);
  }

  async rows() {
    await this.ensureTable();
    const table = postgresTableName();
    const result = await postgresPool().query(
      `select id, doc_id, payload from public.${table} where collection = $1 order by id asc`,
      [this.name]
    );
    return result.rows.map((row) => ({
      ...reviveDocument(row.payload || {}),
      _id: row.doc_id,
      _rowId: row.id
    }));
  }

  async findOne(filter = {}, options = {}) {
    let rows = await this.rows();
    rows = rows.filter((doc) => matchesFilter(doc, filter));
    rows = sortDocuments(rows, options.sort || {});
    return rows[0] || null;
  }

  find(filter = {}) {
    const collection = this;
    const state = { sort: {}, limit: 0 };
    return {
      sort(sort) {
        state.sort = sort || {};
        return this;
      },
      limit(limit) {
        state.limit = Number(limit || 0);
        return this;
      },
      async toArray() {
        let rows = (await collection.rows()).filter((doc) => matchesFilter(doc, filter));
        rows = sortDocuments(rows, state.sort);
        return state.limit ? rows.slice(0, state.limit) : rows;
      }
    };
  }

  async countDocuments(filter = {}) {
    return (await this.rows()).filter((doc) => matchesFilter(doc, filter)).length;
  }

  async insertOne(doc = {}) {
    await this.ensureTable();
    const table = postgresTableName();
    const id = String(doc._id || crypto.randomUUID());
    const payload = { ...doc, _id: id };
    const result = await postgresPool().query(
      `insert into public.${table} (collection, doc_id, payload)
       values ($1, $2, $3::jsonb)
       on conflict (collection, doc_id)
       do update set payload = excluded.payload, updated_at = now()
       returning id`,
      [this.name, id, JSON.stringify(payload)]
    );
    return { insertedId: id, insertedRow: result.rows[0] };
  }

  applyUpdate(doc, update = {}, insertDoc = {}) {
    return SupabaseCollection.prototype.applyUpdate.call(this, doc, update, insertDoc);
  }

  async updateOne(filter = {}, update = {}, options = {}) {
    const existing = await this.findOne(filter);
    if (!existing && !options.upsert) return { matchedCount: 0, modifiedCount: 0 };
    if (!existing) {
      const base = { ...filter, _id: filter._id || crypto.randomUUID() };
      const next = this.applyUpdate(null, update, base);
      await this.insertOne(next);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: next._id };
    }
    const next = this.applyUpdate(existing, update);
    delete next._rowId;
    await this.ensureTable();
    const table = postgresTableName();
    await postgresPool().query(
      `update public.${table} set payload = $3::jsonb, updated_at = now() where collection = $1 and doc_id = $2`,
      [this.name, String(existing._id), JSON.stringify(next)]
    );
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter = {}) {
    const existing = await this.findOne(filter);
    if (!existing) return { deletedCount: 0 };
    await this.ensureTable();
    const table = postgresTableName();
    await postgresPool().query(
      `delete from public.${table} where collection = $1 and doc_id = $2`,
      [this.name, String(existing._id)]
    );
    return { deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const rows = (await this.rows()).filter((doc) => matchesFilter(doc, filter));
    await Promise.all(rows.map((row) => this.deleteOne({ _id: row._id })));
    return { deletedCount: rows.length };
  }
}

class SupabaseCollection {
  constructor(name) {
    this.name = name;
  }

  async createIndex() {
    return null;
  }

  endpoint(query = '') {
    const base = supabaseUrl().replace(/\/$/, '');
    return `${base}/rest/v1/${docTable()}${query}`;
  }

  async parseSupabaseResponse(response, fallback) {
    const text = await response.text().catch(() => '');
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      data = null;
    }
    if (!response.ok) {
      const message = data?.message || text || fallback;
      const hint = /schema cache|app_documents|does not exist|Could not find/i.test(message)
        ? ` Auth storage is not ready. Run supabase-app-documents.sql in Supabase SQL Editor for table "${docTable()}" and verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel.`
        : '';
      throw new Error(`${message}${hint}`);
    }
    return data;
  }

  async rows() {
    const response = await fetch(this.endpoint(`?select=*&collection=eq.${encodeURIComponent(this.name)}`), {
      headers: supabaseHeaders()
    });
    const data = await this.parseSupabaseResponse(response, `Supabase table ${docTable()} is missing`);
    return data.map((row) => ({
      ...reviveDocument(row.payload || {}),
      _id: row.doc_id,
      _rowId: row.id || row.doc_id
    }));
  }

  async findOne(filter = {}, options = {}) {
    let rows = await this.rows();
    rows = rows.filter((doc) => matchesFilter(doc, filter));
    rows = sortDocuments(rows, options.sort || {});
    return rows[0] || null;
  }

  find(filter = {}) {
    const collection = this;
    const state = { sort: {}, limit: 0 };
    return {
      sort(sort) {
        state.sort = sort || {};
        return this;
      },
      limit(limit) {
        state.limit = Number(limit || 0);
        return this;
      },
      async toArray() {
        let rows = (await collection.rows()).filter((doc) => matchesFilter(doc, filter));
        rows = sortDocuments(rows, state.sort);
        return state.limit ? rows.slice(0, state.limit) : rows;
      }
    };
  }

  async countDocuments(filter = {}) {
    return (await this.rows()).filter((doc) => matchesFilter(doc, filter)).length;
  }

  async insertOne(doc = {}) {
    const id = String(doc._id || crypto.randomUUID());
    const payload = { ...doc, _id: id };
    const row = {
      collection: this.name,
      doc_id: id,
      email: normalizeEmail(payload.email) || null,
      payload
    };
    const response = await fetch(this.endpoint(), {
      method: 'POST',
      headers: supabaseHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(row)
    });
    const data = await this.parseSupabaseResponse(response, `Could not insert ${this.name}`);
    return { insertedId: id, insertedRow: data?.[0] };
  }

  applyUpdate(doc, update = {}, insertDoc = {}) {
    const next = { ...insertDoc, ...doc };
    if (update.$setOnInsert && !doc?._id) {
      Object.entries(update.$setOnInsert).forEach(([key, value]) => writePath(next, key, value));
    }
    if (update.$set) {
      Object.entries(update.$set).forEach(([key, value]) => writePath(next, key, value));
    }
    if (update.$unset) {
      Object.keys(update.$unset).forEach((key) => {
        deletePath(next, key);
      });
    }
    if (update.$inc) {
      Object.entries(update.$inc).forEach(([key, amount]) => {
        writePath(next, key, Number(readPath(next, key) || 0) + Number(amount || 0));
      });
    }
    if (update.$push) {
      Object.entries(update.$push).forEach(([key, value]) => {
        const currentValue = readPath(next, key);
        const current = Array.isArray(currentValue) ? [...currentValue] : [];
        if (value && typeof value === 'object' && '$each' in value) {
          const incoming = Array.isArray(value.$each) ? value.$each : [value.$each];
          current.push(...incoming);
          writePath(next, key, typeof value.$slice === 'number'
            ? (value.$slice < 0 ? current.slice(value.$slice) : current.slice(0, value.$slice))
            : current);
        } else {
          current.push(value);
          writePath(next, key, current);
        }
      });
    }
    if (update.$addToSet) {
      Object.entries(update.$addToSet).forEach(([key, value]) => {
        const currentValue = readPath(next, key);
        const current = Array.isArray(currentValue) ? [...currentValue] : [];
        const incoming = value && typeof value === 'object' && '$each' in value
          ? (Array.isArray(value.$each) ? value.$each : [value.$each])
          : [value];
        incoming.forEach((item) => {
          if (!current.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) current.push(item);
        });
        writePath(next, key, current);
      });
    }
    return next;
  }

  async updateOne(filter = {}, update = {}, options = {}) {
    const existing = await this.findOne(filter);
    if (!existing && !options.upsert) return { matchedCount: 0, modifiedCount: 0 };
    if (!existing) {
      const base = { ...filter, _id: filter._id || crypto.randomUUID() };
      const next = this.applyUpdate(null, update, base);
      await this.insertOne(next);
      return { matchedCount: 0, modifiedCount: 0, upsertedId: next._id };
    }
    const next = this.applyUpdate(existing, update);
    delete next._rowId;
    const response = await fetch(this.endpoint(`?collection=eq.${encodeURIComponent(this.name)}&doc_id=eq.${encodeURIComponent(existing._id)}`), {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        email: normalizeEmail(next.email) || null,
        payload: next
      })
    });
    if (!response.ok) {
      await this.parseSupabaseResponse(response, `Could not update ${this.name}`);
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter = {}) {
    const existing = await this.findOne(filter);
    if (!existing) return { deletedCount: 0 };
    const response = await fetch(this.endpoint(`?collection=eq.${encodeURIComponent(this.name)}&doc_id=eq.${encodeURIComponent(existing._id)}`), {
      method: 'DELETE',
      headers: supabaseHeaders()
    });
    if (!response.ok) await this.parseSupabaseResponse(response, `Could not delete ${this.name}`);
    return { deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    const rows = (await this.rows()).filter((doc) => matchesFilter(doc, filter));
    await Promise.all(rows.map((row) => this.deleteOne({ _id: row._id })));
    return { deletedCount: rows.length };
  }
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
  const sender = cleanEnvValue(value || fallback);
  if (!sender) return fallback;
  const match = sender.match(/<([^>]+)>/) || sender.match(/([^\s<>]+@[^\s<>]+)/);
  const email = String(match?.[1] || '').toLowerCase();
  if (!email.endsWith('@zavorafashion.com')) return fallback;
  if (sender.includes('<')) return sender;
  return `Zavora Fashion <${email}>`;
}

async function sendOtpEmail(to, otp, purpose) {
  const apiKey = resendApiKey();
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const reset = purpose === 'reset';
  const subject = reset ? 'Your Zavora Fashion Password Reset Code' : 'Your Zavora Fashion Verification Code';
  const action = reset ? 'reset your password' : 'verify your account';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: verifiedSender(envValue('NOREPLY_FROM_EMAIL', 'EMAIL_FROM', 'FROM_EMAIL', 'RESEND_FROM_EMAIL')),
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
  const expiresAt = record?.expiresAt instanceof Date ? record.expiresAt : new Date(record?.expiresAt || 0);
  if (!record || expiresAt < new Date()) return null;
  if (record.attempts >= 5) return null;
  const cleanOtp = String(otp || '').replace(/\D/g, '').slice(0, 6);
  const valid = record.otpHash === hashOtp(email, purpose, cleanOtp);
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
  const maxAge = 7 * 24 * 60 * 60;
  const token = jwt.sign({ sub: String(user._id || user.id), email: user.email }, jwtSecret(), { expiresIn: maxAge });
  res.setHeader('Set-Cookie', `zavora_session=${encodeURIComponent(token)}; HttpOnly${cookieSecureFlag(req)}; SameSite=Lax; Path=/; Max-Age=${maxAge}; Priority=High`);
}

function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `zavora_session=; HttpOnly${cookieSecureFlag(req)}; SameSite=Lax; Path=/; Max-Age=0; Priority=High`);
}

async function getSessionUser(req) {
  const token = parseCookies(req.headers.cookie || '').zavora_session;
  if (!token || !jwtSecret()) return null;
  try {
    const payload = jwt.verify(token, jwtSecret());
    const database = await db();
    const id = mongoUri() ? new ObjectId(payload.sub) : payload.sub;
    const user = await database.collection('users').findOne({ _id: id });
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
  normalizeName,
  parseBody,
  publicUser,
  setSessionCookie,
  validateEmail,
  verifyOtp
};
