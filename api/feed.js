'use strict';

/**
 * Google Merchant Center Product Feed — Fully Compliant RSS 2.0
 * Route:   GET /feed.xml
 * Target:  United States (USD only)
 * Spec:    https://support.google.com/merchants/answer/160589
 *
 * Compliance:
 *  ✅ ONE <g:size> per <item>  (variants expanded per size)
 *  ✅ <g:age_group>adult</g:age_group> on every item
 *  ✅ <g:gender>male|female|unisex</g:gender>
 *  ✅ Normalized Google-accepted colors
 *  ✅ Currency: USD only (XX.XX USD)
 *  ✅ <g:shipping> USA only
 *  ✅ <g:item_group_id> links all variants
 *  ✅ Unique <g:id> per variant
 *  ✅ 5-minute in-process cache; auto-invalidated on product writes
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

// ─── GOOGLE TAXONOMY IDs ────────────────────────────────────────────────────────
// Using numeric taxonomy IDs from https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
const GOOGLE_CATEGORY_MAP = {
  'hoodies':                     '5598',  // Apparel > Clothing > Shirts & Tops > Sweatshirts
  'cropped-hoodies':             '5598',
  'zip-hoodies':                 '5598',
  'sweatshirts':                 '5598',
  'oversized-tees':              '212',   // Apparel > Clothing > Shirts & Tops > T-Shirts
  'heavyweight-tees':            '212',
  'baby-tees':                   '212',
  'tees':                        '212',
  'polo-shirts':                 '5546',  // Apparel > Clothing > Shirts & Tops > Polo Shirts
  'long-sleeve-shirts':          '212',
  'three-quarter-sleeve-shirts': '212',
  'all-over-shirts':             '212',
  'embroidered-shirts':          '212',
  'tank-tops':                   '213',   // Apparel > Clothing > Shirts & Tops > Tank Tops
  'crop-tops':                   '213',
  'cargo-pants':                 '207',   // Apparel > Clothing > Pants
  'sweatpants':                  '207',
  'shorts':                      '210',   // Apparel > Clothing > Shorts
  'jackets':                     '205',   // Apparel > Clothing > Outerwear > Coats & Jackets
  'matching-sets':               '1831',  // Apparel > Clothing
  'sportswear':                  '5697',  // Apparel > Clothing > Activewear
  'accessories':                 '166',   // Apparel & Accessories
  'beachwear':                   '214',   // Apparel > Clothing > Swimwear
};

// Human-readable category labels for <g:product_type>
const CATEGORY_LABEL_MAP = {
  'hoodies':                     'Apparel > Hoodies',
  'cropped-hoodies':             'Apparel > Cropped Hoodies',
  'zip-hoodies':                 'Apparel > Zip Hoodies',
  'sweatshirts':                 'Apparel > Sweatshirts',
  'oversized-tees':              'Apparel > Oversized T-Shirts',
  'heavyweight-tees':            'Apparel > Heavyweight T-Shirts',
  'baby-tees':                   'Apparel > Baby Tees',
  'tees':                        'Apparel > T-Shirts',
  'polo-shirts':                 'Apparel > Polo Shirts',
  'long-sleeve-shirts':          'Apparel > Long Sleeve Shirts',
  'three-quarter-sleeve-shirts': 'Apparel > 3/4 Sleeve Shirts',
  'all-over-shirts':             'Apparel > All-Over Shirts',
  'embroidered-shirts':          'Apparel > Embroidered Shirts',
  'tank-tops':                   'Apparel > Tank Tops',
  'crop-tops':                   'Apparel > Crop Tops',
  'cargo-pants':                 'Apparel > Cargo Pants',
  'sweatpants':                  'Apparel > Sweatpants',
  'shorts':                      'Apparel > Shorts',
  'jackets':                     'Apparel > Jackets',
  'matching-sets':               'Apparel > Matching Sets',
  'sportswear':                  'Apparel > Sportswear',
  'accessories':                 'Apparel > Accessories',
  'beachwear':                   'Apparel > Beachwear',
};

// ─── COLOR NORMALIZER ──────────────────────────────────────────────────────────
// Google Merchant only accepts standard English color names.
// Map all common color strings → Google-accepted values.
const COLOR_NORMALIZE_MAP = {
  // Black family
  'black': 'Black', 'jet black': 'Black', 'midnight': 'Black', 'onyx': 'Black',
  'charcoal': 'Charcoal', 'dark grey': 'Dark Gray', 'dark gray': 'Dark Gray',
  // White family
  'white': 'White', 'off-white': 'White', 'off white': 'White', 'cream': 'Cream',
  'ivory': 'Ivory', 'ecru': 'Ivory', 'snow': 'White',
  // Gray family
  'grey': 'Gray', 'gray': 'Gray', 'silver': 'Silver', 'slate': 'Slate',
  'ash': 'Ash', 'heather grey': 'Heather Gray', 'heather gray': 'Heather Gray',
  'light grey': 'Light Gray', 'light gray': 'Light Gray',
  // Brown / Beige
  'brown': 'Brown', 'tan': 'Tan', 'beige': 'Beige', 'khaki': 'Khaki',
  'camel': 'Camel', 'sand': 'Sand', 'coffee': 'Brown', 'mocha': 'Brown',
  'chocolate': 'Brown', 'taupe': 'Taupe', 'nude': 'Beige',
  // Red family
  'red': 'Red', 'crimson': 'Red', 'scarlet': 'Red', 'maroon': 'Maroon',
  'burgundy': 'Burgundy', 'wine': 'Burgundy', 'brick': 'Red', 'rose': 'Pink',
  'blush': 'Pink', 'salmon': 'Pink',
  // Orange
  'orange': 'Orange', 'coral': 'Coral', 'peach': 'Peach', 'rust': 'Orange',
  'terracotta': 'Orange',
  // Yellow
  'yellow': 'Yellow', 'gold': 'Gold', 'mustard': 'Yellow', 'butter': 'Yellow',
  'lemon': 'Yellow',
  // Green family
  'green': 'Green', 'olive': 'Olive', 'forest': 'Green', 'forest green': 'Green',
  'sage': 'Sage', 'mint': 'Mint', 'lime': 'Green', 'emerald': 'Green',
  'hunter green': 'Green', 'army green': 'Green', 'moss': 'Green',
  'dark green': 'Green', 'light green': 'Green',
  // Blue family
  'blue': 'Blue', 'navy': 'Navy', 'navy blue': 'Navy', 'cobalt': 'Blue',
  'sky blue': 'Blue', 'royal blue': 'Blue', 'light blue': 'Blue',
  'baby blue': 'Blue', 'denim': 'Blue', 'steel blue': 'Blue',
  'midnight blue': 'Navy', 'teal': 'Teal', 'turquoise': 'Turquoise',
  'aqua': 'Aqua', 'cyan': 'Teal',
  // Purple family
  'purple': 'Purple', 'violet': 'Purple', 'lavender': 'Lavender',
  'lilac': 'Purple', 'plum': 'Purple', 'mauve': 'Purple', 'indigo': 'Indigo',
  'eggplant': 'Purple',
  // Pink family
  'pink': 'Pink', 'hot pink': 'Pink', 'magenta': 'Pink', 'fuchsia': 'Pink',
  'dusty pink': 'Pink', 'dusty rose': 'Pink',
  // Multicolor / Special
  'multicolor': 'Multicolor', 'multi': 'Multicolor', 'multi-color': 'Multicolor',
  'tie dye': 'Multicolor', 'tie-dye': 'Multicolor', 'camo': 'Multicolor',
  'camouflage': 'Multicolor', 'print': 'Multicolor',
};

function normalizeColor(raw) {
  if (!raw) return 'Black';
  const key = String(raw).toLowerCase().trim();
  if (COLOR_NORMALIZE_MAP[key]) return COLOR_NORMALIZE_MAP[key];
  // Try partial match
  for (const [pattern, value] of Object.entries(COLOR_NORMALIZE_MAP)) {
    if (key.includes(pattern)) return value;
  }
  // Capitalize first letter of each word as fallback
  return String(raw).replace(/\b\w/g, c => c.toUpperCase()).trim();
}

function normalizeColors(product) {
  const rawColors = Array.isArray(product.colors) && product.colors.length
    ? product.colors
    : [product.color || 'Black'];
  return [...new Set(rawColors.map(normalizeColor).filter(Boolean))];
}

// ─── SIZE NORMALIZER ───────────────────────────────────────────────────────────
// Google accepts: XXS, XS, S, M, L, XL, XXL, XXXL, One Size, or numeric sizes.
// ONE size per <item>.
const SIZE_NORMALIZE_MAP = {
  'xxs': 'XXS', 'extra extra small': 'XXS',
  'xs': 'XS', 'extra small': 'XS',
  's': 'S', 'small': 'S',
  'm': 'M', 'medium': 'M',
  'l': 'L', 'large': 'L',
  'xl': 'XL', 'extra large': 'XL', 'x-large': 'XL',
  'xxl': 'XXL', '2xl': 'XXL', '2x-large': 'XXL', 'double xl': 'XXL',
  'xxxl': 'XXXL', '3xl': 'XXXL', '3x-large': 'XXXL',
  '4xl': '4XL', '4x-large': '4XL',
  '5xl': '5XL', '5x-large': '5XL',
  'os': 'One Size', 'one size': 'One Size', 'one size fits all': 'One Size',
  'free size': 'One Size', 'freesize': 'One Size',
  // Numeric / waist sizes
  '28': '28', '30': '30', '32': '32', '34': '34', '36': '36',
  '38': '38', '40': '40', '42': '42', '44': '44',
};

function normalizeSize(raw) {
  if (!raw) return 'One Size';
  const key = String(raw).toLowerCase().trim();
  return SIZE_NORMALIZE_MAP[key] || String(raw).toUpperCase().trim();
}

function normalizeSizes(sizes) {
  if (!Array.isArray(sizes) || sizes.length === 0) return ['One Size'];
  return [...new Set(sizes.map(normalizeSize).filter(Boolean))];
}

// ─── GENDER MAPPER ─────────────────────────────────────────────────────────────
function mapGender(gender) {
  const g = String(gender || '').toLowerCase().trim();
  if (g === 'men' || g === 'male' || g === 'man') return 'male';
  if (g === 'women' || g === 'female' || g === 'woman' || g === 'ladies') return 'female';
  return 'unisex';
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Format price as "XX.XX USD" — always USD, no other currency */
function formatPrice(price) {
  const num = Math.abs(Number(price) || 0);
  return `${num.toFixed(2)} USD`;
}

function productUrl(product) {
  const base = 'https://www.zavorafashion.com';
  const id = String(product.printfulId || product.id || product._id || '');
  const slug = String(product.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id ? `${base}/product.html?id=${encodeURIComponent(id)}` : `${base}/products/${slug}`;
}

function absoluteImage(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('assets/') || url.startsWith('./assets/')) return '';
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('http')) return url;
  return `https://www.zavorafashion.com/${url.replace(/^\//, '')}`;
}

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
  return '';
}

function additionalImages(product) {
  const all = Array.isArray(product.images) ? product.images : [];
  const extras = [];
  for (const img of all.slice(1, 11)) {
    const u = absoluteImage(img);
    if (u) extras.push(u);
  }
  return extras;
}

function mapAvailability(product) {
  const stock = Number(product.stock ?? 5);
  if (product.status === 'archived' || product.published === false) return 'out_of_stock';
  return stock === 0 ? 'out_of_stock' : 'in_stock';
}

// ─── USA SHIPPING XML BLOCK ────────────────────────────────────────────────────
// Required for Google Merchant Center USA feed.
// Shipping: Free Standard + Paid Express — United States only.
const USA_SHIPPING_XML = `
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Shipping</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Express Shipping</g:service>
        <g:price>12.99 USD</g:price>
      </g:shipping>`;

// ─── VARIANT ITEM BUILDER ──────────────────────────────────────────────────────
/**
 * Expand one product into multiple <item> elements — one per (color × size).
 * This is required by Google Merchant: each size/color combo = one unique item.
 */
function buildVariantItems(product) {
  const img = primaryImage(product);
  if (!img) return ''; // No valid CDN image — skip entirely

  const groupId       = String(product.printfulId || product.id || product._id || '');
  const itemGroupId   = `ZAV-${groupId}`;
  const title         = String(product.name || 'Zavora Product');
  const description   = String(
    product.description ||
    product.seoDescription ||
    `${title} — premium streetwear by Zavora Fashion.`
  ).substring(0, 5000); // Google max 5000 chars
  const link          = productUrl(product);
  const avail         = mapAvailability(product);
  const price         = formatPrice(product.price);
  const category      = String(product.category || 'oversized-tees');
  const googleCatId   = GOOGLE_CATEGORY_MAP[category] || '1831';
  const productType   = CATEGORY_LABEL_MAP[category] ||
    category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const gender        = mapGender(product.gender);
  const material      = String(product.material || 'Cotton');
  const extraImgs     = additionalImages(product);

  const sizes  = normalizeSizes(product.sizes);
  const colors = normalizeColors(product);

  const items = [];

  for (const color of colors) {
    for (const size of sizes) {
      // Unique variant ID: ZAV-{groupId}-{color}-{size}
      const safeColor = color.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const safeSize  = size.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const variantId = `ZAV-${groupId}-${safeColor}-${safeSize}`;
      const mpn       = variantId;

      let xml = `
    <item>
      <g:id>${escapeXml(variantId)}</g:id>
      <g:item_group_id>${escapeXml(itemGroupId)}</g:item_group_id>
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
      <g:google_product_category>${escapeXml(googleCatId)}</g:google_product_category>
      <g:product_type>${escapeXml(productType)}</g:product_type>
      <g:gender>${gender}</g:gender>
      <g:age_group>adult</g:age_group>
      <g:color>${escapeXml(color)}</g:color>
      <g:size>${escapeXml(size)}</g:size>
      <g:material>${escapeXml(material)}</g:material>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:shipping_weight>0.5 lb</g:shipping_weight>${USA_SHIPPING_XML}
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

  const allItems = products.map(buildVariantItems).filter(Boolean).join('\n');
  const variantCount = (allItems.match(/<item>/g) || []).length;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Zavora Fashion</title>
    <link>https://www.zavorafashion.com</link>
    <description>Zavora Fashion — Premium Minimal Streetwear. ${products.length} products, ${variantCount} variants.</description>
    <language>en-US</language>
    <copyright>Copyright ${new Date().getFullYear()} Zavora Fashion. All rights reserved.</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>Zavora Feed Engine v4.0</generator>
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
    const nocache = String(req.query?.nocache || '').toLowerCase() === 'true';

    if (nocache || !feedCache || now - feedCacheBuiltAt > FEED_TTL_MS) {
      const built = await buildFeed();
      feedCache = built;
      feedCacheBuiltAt = built.builtAt;
    }

    const { xml, etag } = feedCache;

    // Conditional GET (ETag — allows Google to skip unchanged feeds)
    const clientEtag = req.headers['if-none-match'];
    if (!nocache && clientEtag && clientEtag === etag) {
      res.statusCode = 304;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('ETag', etag);
    res.setHeader('X-Robots-Tag', 'noindex');
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
module.exports.buildFeedXml = async function() {
  const built = await buildFeed();
  return built.xml;
};
