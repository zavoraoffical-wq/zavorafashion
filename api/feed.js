'use strict';

/**
 * Google Merchant Center Product Feed
 * Route:  GET /feed.xml
 * Spec:   Google RSS 2.0 (https://support.google.com/merchants/answer/160589)
 * Cache:  In-process 5-minute memory cache; invalidated on any product write.
 */

const { setSecurityHeaders } = require('../lib/security');
const { ProductRepository } = require('../lib/local-product-engine');

// ─── GLOBAL FEED CACHE ─────────────────────────────────────────────────────────
let feedCache = null;         // { xml, etag, builtAt }
let feedCacheBuiltAt = 0;
const FEED_TTL_MS = 5 * 60 * 1000;   // 5 minutes

/** Called by api/products.js after any product write to invalidate the cache. */
function invalidateFeedCache() {
  feedCache = null;
  feedCacheBuiltAt = 0;
}

// ─── GOOGLE PRODUCT CATEGORY MAP ───────────────────────────────────────────────
const GOOGLE_CATEGORY_MAP = {
  'hoodies':                   'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'cropped-hoodies':           'Apparel & Accessories > Clothing > Activewear > Activewear Tops',
  'zip-hoodies':               'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'sweatshirts':               'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts',
  'oversized-tees':            'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'heavyweight-tees':          'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'baby-tees':                 'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'tees':                      'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'polo-shirts':               'Apparel & Accessories > Clothing > Shirts & Tops > Polo Shirts',
  'long-sleeve-shirts':        'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'three-quarter-sleeve-shirts': 'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'all-over-shirts':           'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'embroidered-shirts':        'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'tank-tops':                 'Apparel & Accessories > Clothing > Shirts & Tops > Tank Tops',
  'crop-tops':                 'Apparel & Accessories > Clothing > Shirts & Tops > Tank Tops',
  'cargo-pants':               'Apparel & Accessories > Clothing > Pants',
  'sweatpants':                'Apparel & Accessories > Clothing > Pants',
  'shorts':                    'Apparel & Accessories > Clothing > Shorts',
  'jackets':                   'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'matching-sets':             'Apparel & Accessories > Clothing',
  'sportswear':                'Apparel & Accessories > Clothing > Activewear',
  'accessories':               'Apparel & Accessories',
  'beachwear':                 'Apparel & Accessories > Clothing > Swimwear',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPrice(price) {
  const num = Number(price) || 0;
  return `${num.toFixed(2)} USD`;
}

function productUrl(product) {
  const base = 'https://www.zavorafashion.com';
  const id = String(product.printfulId || product.id || product._id || '');
  const slug = String(product.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id ? `${base}/product/${id}` : `${base}/products/${slug}`;
}

function primaryImage(product) {
  const img = product.img || (Array.isArray(product.images) ? product.images[0] : '') || '';
  if (!img || img.startsWith('assets/')) {
    return 'https://www.zavorafashion.com/assets/og-image.jpg';
  }
  // Ensure absolute URL
  if (img.startsWith('//')) return `https:${img}`;
  if (img.startsWith('http')) return img;
  return `https://www.zavorafashion.com/${img.replace(/^\//, '')}`;
}

function additionalImages(product) {
  const all = Array.isArray(product.images) ? product.images : [];
  return all.slice(1, 11);  // up to 10 additional
}

function mapGender(gender) {
  const g = String(gender || '').toLowerCase();
  if (g === 'men') return 'male';
  if (g === 'women') return 'female';
  return 'unisex';
}

function mapAvailability(product) {
  const stock = Number(product.stock ?? 5);
  if (product.status === 'archived' || product.published === false) return 'out_of_stock';
  return stock === 0 ? 'out_of_stock' : 'in_stock';
}

function buildItem(product) {
  const id         = String(product.printfulId || product.id || product._id || '');
  const title      = escapeXml(product.name || 'Zavora Product');
  const desc       = escapeXml(
    product.description ||
    product.seoDescription ||
    `${product.name || 'Zavora'} — premium streetwear by Zavora Fashion.`
  );
  const link       = escapeXml(productUrl(product));
  const imgLink    = escapeXml(primaryImage(product));
  const addImgs    = additionalImages(product);
  const avail      = mapAvailability(product);
  const price      = formatPrice(product.price);
  const category   = String(product.category || 'oversized-tees');
  const googleCat  = escapeXml(GOOGLE_CATEGORY_MAP[category] || 'Apparel & Accessories > Clothing');
  const productType = escapeXml(
    product.categoryPath ||
    category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  );
  const gender     = mapGender(product.gender);
  const color      = escapeXml(
    (Array.isArray(product.colors) ? product.colors[0] : product.color) || 'Black'
  );
  const sizes      = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const material   = escapeXml(product.material || 'Cotton');
  const mpn        = id ? escapeXml(`ZAV-${id}`) : '';

  let xml = `
    <item>
      <g:id>${escapeXml(id || title)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imgLink}</g:image_link>`;

  for (const extra of addImgs) {
    const eUrl = primaryImage({ img: extra });
    if (eUrl && eUrl !== imgLink) {
      xml += `\n      <g:additional_image_link>${escapeXml(eUrl)}</g:additional_image_link>`;
    }
  }

  xml += `
      <g:availability>${avail}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Zavora</g:brand>
      <g:google_product_category>${googleCat}</g:google_product_category>
      <g:product_type>${productType}</g:product_type>
      <g:gender>${gender}</g:gender>
      <g:color>${color}</g:color>
      <g:material>${material}</g:material>`;

  for (const sz of sizes) {
    xml += `\n      <g:size>${escapeXml(sz)}</g:size>`;
  }

  if (mpn) {
    xml += `\n      <g:mpn>${mpn}</g:mpn>`;
  }

  // Identifier exists: false only if we don't have GTIN/MPN. We supply MPN + brand = valid.
  xml += `\n      <g:identifier_exists>yes</g:identifier_exists>`;

  xml += `\n    </item>`;
  return xml;
}

// ─── FEED BUILDER ──────────────────────────────────────────────────────────────

async function buildFeed() {
  // Fetch ALL published products (no limit)
  const data = await ProductRepository.findProducts({
    status: 'active',
    limit: 10000,
    page: 1
  });

  const products = Array.isArray(data.products) ? data.products : [];
  const now = new Date().toUTCString();
  const total = products.length;

  const items = products.map(buildItem).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Zavora Fashion</title>
    <link>https://www.zavorafashion.com</link>
    <description>Zavora Fashion — Premium Minimal Streetwear. ${total} products.</description>
    <language>en-US</language>
    <copyright>Copyright ${new Date().getFullYear()} Zavora Fashion</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Zavora Feed Engine v2.0</generator>
    <image>
      <url>https://www.zavorafashion.com/assets/og-image.jpg</url>
      <title>Zavora Fashion</title>
      <link>https://www.zavorafashion.com</link>
    </image>
${items}
  </channel>
</rss>`;

  // Simple ETag = total count + build time second
  const etag = `"zavora-${total}-${Math.floor(Date.now() / 1000)}"`;
  return { xml, etag, builtAt: Date.now(), total };
}

// ─── HANDLER ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }

  setSecurityHeaders(req, res);

  try {
    // Check cache
    const now = Date.now();
    if (!feedCache || now - feedCacheBuiltAt > FEED_TTL_MS) {
      const built = await buildFeed();
      feedCache = built;
      feedCacheBuiltAt = built.builtAt;
    }

    const { xml, etag } = feedCache;

    // Conditional GET (ETag)
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag && clientEtag === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('ETag', etag);
    res.setHeader('X-Feed-Products', String(feedCache.total || 0));

    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', Buffer.byteLength(xml, 'utf8'));
      res.end();
      return;
    }

    res.end(xml);
  } catch (error) {
    console.error('[Feed Error]', error.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.end(`<?xml version="1.0"?><error>${escapeXml(error.message)}</error>`);
  }
};

module.exports.invalidateFeedCache = invalidateFeedCache;
