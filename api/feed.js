'use strict';

/**
 * Google Merchant Center Product Feed — Google RSS 2.0 Compliant
 * Route:  GET /feed.xml
 * Spec:   https://support.google.com/merchants/answer/160589
 *
 * Key compliance:
 *  - ONE <g:size> per <item> (variants expanded)
 *  - <g:age_group>adult</g:age_group> on every apparel item
 *  - <g:item_group_id> links all variants of a product
 *  - Unique <g:id> per variant: ZAV-{printfulId}-{COLOR}-{SIZE}
 *  - <g:gender>male|female|unisex</g:gender>
 *  - 5-minute in-memory cache; invalidated on any product write
 */

const { setSecurityHeaders } = require('../lib/security');
const { ProductRepository } = require('../lib/local-product-engine');

// ─── CACHE ─────────────────────────────────────────────────────────────────────
let feedCache = null;
let feedCacheBuiltAt = 0;
const FEED_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateFeedCache() {
  feedCache = null;
  feedCacheBuiltAt = 0;
}

// ─── GOOGLE PRODUCT CATEGORY MAP ───────────────────────────────────────────────
const GOOGLE_CATEGORY_MAP = {
  'hoodies':                     'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts',
  'cropped-hoodies':             'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts',
  'zip-hoodies':                 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts',
  'sweatshirts':                 'Apparel & Accessories > Clothing > Shirts & Tops > Sweatshirts',
  'oversized-tees':              'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'heavyweight-tees':            'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'baby-tees':                   'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'tees':                        'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'polo-shirts':                 'Apparel & Accessories > Clothing > Shirts & Tops > Polo Shirts',
  'long-sleeve-shirts':          'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'three-quarter-sleeve-shirts': 'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'all-over-shirts':             'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'embroidered-shirts':          'Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts',
  'tank-tops':                   'Apparel & Accessories > Clothing > Shirts & Tops > Tank Tops',
  'crop-tops':                   'Apparel & Accessories > Clothing > Shirts & Tops > Tank Tops',
  'cargo-pants':                 'Apparel & Accessories > Clothing > Pants',
  'sweatpants':                  'Apparel & Accessories > Clothing > Pants',
  'shorts':                      'Apparel & Accessories > Clothing > Shorts',
  'jackets':                     'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  'matching-sets':               'Apparel & Accessories > Clothing',
  'sportswear':                  'Apparel & Accessories > Clothing > Activewear',
  'accessories':                 'Apparel & Accessories',
  'beachwear':                   'Apparel & Accessories > Clothing > Swimwear',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function escapeXml(value) {
  return String(value ?? '')
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

/** Canonical product page URL */
function productUrl(product) {
  const base = 'https://www.zavorafashion.com';
  const id = String(product.printfulId || product.id || product._id || '');
  const slug = String(product.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id ? `${base}/product/${id}` : `${base}/products/${slug}`;
}

/** Return absolute CDN URL for an image path */
function absoluteImage(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('assets/') || url.startsWith('./assets/')) return ''; // skip local assets
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return `https://www.zavorafashion.com/${url.replace(/^\//, '')}`;
}

/** Primary image — must be an absolute CDN URL, never a local asset */
function primaryImage(product) {
  const candidates = [
    product.img,
    Array.isArray(product.images) ? product.images[0] : null,
    product.image,
    product.thumbnail,
  ];
  for (const c of candidates) {
    const u = absoluteImage(c);
    if (u) return u;
  }
  // last resort: no image = skip variant (handled in caller)
  return '';
}

/** Additional images (up to 10) */
function additionalImages(product) {
  const all = Array.isArray(product.images) ? product.images : [];
  const extras = [];
  for (const img of all.slice(1, 11)) {
    const u = absoluteImage(img);
    if (u) extras.push(u);
  }
  return extras;
}

/**
 * Map product gender to Google Merchant value.
 * Google accepts: male | female | unisex
 */
function mapGender(gender) {
  const g = String(gender || '').toLowerCase().trim();
  if (g === 'men' || g === 'male') return 'male';
  if (g === 'women' || g === 'female') return 'female';
  return 'unisex';
}

function mapAvailability(product) {
  const stock = Number(product.stock ?? 5);
  if (product.status === 'archived' || product.published === false) return 'out_of_stock';
  return stock === 0 ? 'out_of_stock' : 'in_stock';
}

/**
 * Normalise sizes to Google-acceptable values.
 * Google accepts: XS, S, M, L, XL, XXL, XXXL, One Size, and numeric sizes.
 * Returns array of individual size strings.
 */
function normalizeSizes(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) {
    return ['One Size'];
  }
  const SIZE_MAP = {
    'xxs': 'XXS', 'xs': 'XS', 's': 'S', 'm': 'M', 'l': 'L',
    'xl': 'XL', 'xxl': 'XXL', '2xl': 'XXL', 'xxxl': 'XXXL', '3xl': 'XXXL',
    '4xl': '4XL', '5xl': '5XL', 'os': 'One Size', 'one size': 'One Size'
  };
  const result = [];
  for (const sz of sizes) {
    const key = String(sz).toLowerCase().trim();
    result.push(SIZE_MAP[key] || String(sz).toUpperCase().trim());
  }
  return [...new Set(result)]; // deduplicate
}

/**
 * Normalise colors — return array of individual color strings.
 */
function normalizeColors(product) {
  const colors = Array.isArray(product.colors) && product.colors.length
    ? product.colors
    : [product.color || 'Black'];
  return [...new Set(colors.map(c => String(c).trim()).filter(Boolean))];
}

/**
 * Build all <item> XML blocks for one product.
 * Each (color × size) combination becomes a separate <item>.
 */
function buildVariantItems(product) {
  const img = primaryImage(product);
  if (!img) return ''; // skip products with no valid image

  const groupId       = String(product.printfulId || product.id || product._id || '');
  const title         = String(product.name || 'Zavora Product');
  const description   = String(
    product.description ||
    product.seoDescription ||
    `${title} — premium streetwear by Zavora Fashion.`
  );
  const link          = productUrl(product);
  const avail         = mapAvailability(product);
  const price         = formatPrice(product.price);
  const category      = String(product.category || 'oversized-tees');
  const googleCat     = GOOGLE_CATEGORY_MAP[category] || 'Apparel & Accessories > Clothing';
  const productType   = product.categoryPath ||
    category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const gender        = mapGender(product.gender);
  const material      = String(product.material || 'Cotton');
  const extraImgs     = additionalImages(product);

  const sizes  = normalizeSizes(product.sizes);
  const colors = normalizeColors(product);

  const items = [];

  for (const color of colors) {
    for (const size of sizes) {
      // Unique variant ID: ZAV-{groupId}-{COLOR}-{SIZE}
      const safeColor = color.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeSize  = size.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const variantId = `ZAV-${groupId}-${safeColor}-${safeSize}`;
      const mpn       = `ZAV-${groupId}`;

      let xml = `
    <item>
      <g:id>${escapeXml(variantId)}</g:id>
      <g:item_group_id>${escapeXml(groupId ? `ZAV-${groupId}` : variantId)}</g:item_group_id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(img)}</g:image_link>`;

      for (const extra of extraImgs) {
        if (extra !== img) {
          xml += `\n      <g:additional_image_link>${escapeXml(extra)}</g:additional_image_link>`;
        }
      }

      xml += `
      <g:availability>${avail}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>Zavora</g:brand>
      <g:google_product_category>${escapeXml(googleCat)}</g:google_product_category>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:gender>${gender}</g:gender>
      <g:age_group>adult</g:age_group>
      <g:color>${escapeXml(color)}</g:color>
      <g:size>${escapeXml(size)}</g:size>
      <g:material>${escapeXml(material)}</g:material>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
    </item>`;

      items.push(xml);
    }
  }

  return items.join('\n');
}

// ─── FEED BUILDER ──────────────────────────────────────────────────────────────

async function buildFeed() {
  const data = await ProductRepository.findProducts({
    status: 'active',
    limit: 10000,
    page: 1,
  });

  const products = Array.isArray(data.products) ? data.products : [];
  const now = new Date().toUTCString();

  // Expand all products into variant items
  const allItems = products.map(buildVariantItems).filter(Boolean).join('\n');
  const variantCount = (allItems.match(/<item>/g) || []).length;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Zavora Fashion</title>
    <link>https://www.zavorafashion.com</link>
    <description>Zavora Fashion — Premium Minimal Streetwear. ${products.length} products, ${variantCount} variants.</description>
    <language>en-US</language>
    <copyright>Copyright ${new Date().getFullYear()} Zavora Fashion</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Zavora Feed Engine v3.0</generator>
    <image>
      <url>https://www.zavorafashion.com/assets/og-image.jpg</url>
      <title>Zavora Fashion</title>
      <link>https://www.zavorafashion.com</link>
    </image>
${allItems}
  </channel>
</rss>`;

  const etag = `"zavora-${variantCount}-${Math.floor(Date.now() / 1000)}"`;
  return { xml, etag, builtAt: Date.now(), total: products.length, variants: variantCount };
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
    res.setHeader('X-Feed-Variants', String(feedCache.variants || 0));

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
