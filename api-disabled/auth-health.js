const { db, json } = require('../lib/auth-lib');
const { setSecurityHeaders } = require('../lib/security');

function hasAnyEnv(...names) {
  return names.some((name) => Boolean(String(process.env[name] || '').trim()));
}

module.exports = async function handler(req, res) {
  setSecurityHeaders(req, res);
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const status = {
    ok: false,
    env: {
      authJwtSecret: hasAnyEnv('AUTH_JWT_SECRET', 'JWT_SECRET'),
      mongo: hasAnyEnv('MONGODB_URI', 'MONGO_URI'),
      supabaseUrl: hasAnyEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
      supabaseKey: hasAnyEnv(
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SERVICE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ),
      postgres: hasAnyEnv(
        'POSTGRES_URL',
        'POSTGRES_URL_NON_POOLING',
        'POSTGRES_PRISMA_URL',
        'DATABASE_URL',
        'SUPABASE_DB_URL',
        'SUPABASE_POSTGRES_URL'
      ),
      resend: hasAnyEnv('RESEND_API_KEY', 'RESEND_KEY', 'RESEND_TOKEN')
    },
    storage: null
  };

  try {
    const database = await db();
    await database.collection('users').findOne({ email: '__healthcheck__@zavorafashion.com' });
    status.ok = true;
    status.storage = 'ready';
    return json(res, 200, status);
  } catch (error) {
    status.storage = 'error';
    status.error = String(error.message || '').slice(0, 500);
    return json(res, 500, status);
  }
};
