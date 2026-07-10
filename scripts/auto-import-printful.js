const siteUrl = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://www.zavorafashion.com').replace(/\/$/, '');
const pages = Number(process.env.AUTO_IMPORT_PAGES || 9);
const limit = Number(process.env.AUTO_IMPORT_LIMIT || 60);
const genders = String(process.env.AUTO_IMPORT_GENDERS || 'men,women')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const secret = process.env.CRON_SECRET || '';

async function main() {
  const params = new URLSearchParams({
    pages: String(pages),
    limit: String(limit),
    genders: genders.join(',')
  });
  if (secret) params.set('secret', secret);
  const url = `${siteUrl}/api/auto-import-printful?${params.toString()}`;
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 207) {
    throw new Error(body.error || `Auto import failed: ${response.status}`);
  }
  console.log(JSON.stringify(body, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
