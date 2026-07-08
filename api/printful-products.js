const PRINTFUL_API_BASE_URL = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;

const categoryRules = [
  { match: /hoodie|sweatshirt|fleece/i, category: 'hoodies', collection: 'oversized', label: 'Hoodie' },
  { match: /zip/i, category: 'hoodies', collection: 'limited', label: 'Zip Hoodie' },
  { match: /tee|t-shirt|shirt/i, category: 'tees', collection: 'new', label: 'Heavyweight Tee' },
  { match: /pant|sweatpant|jogger|cargo/i, category: 'pants', collection: 'best', label: 'Pant' },
  { match: /jacket|windbreaker|coat/i, category: 'outerwear', collection: 'limited', label: 'Jacket' },
  { match: /cap|hat|beanie|bag|tote|accessory/i, category: 'accessories', collection: 'best', label: 'Accessory' }
];

function response(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
  res.end(JSON.stringify(body));
}

async function printfulFetch(path) {
  const separator = path.includes('?') ? '&' : '?';
  const scopedPath = PRINTFUL_STORE_ID ? `${path}${separator}store_id=${encodeURIComponent(PRINTFUL_STORE_ID)}` : path;
  const headers = {
    Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json'
  };
  if (PRINTFUL_STORE_ID) {
    headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;
  }
  const result = await fetch(`${PRINTFUL_API_BASE_URL}${scopedPath}`, {
    headers
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(body?.error?.message || body?.message || `Printful request failed: ${result.status}`);
  }
  return body;
}

async function tryPrintfulFetch(paths) {
  const errors = [];
  for (const path of paths) {
    try {
      const body = await printfulFetch(path);
      return { body, path };
    } catch (error) {
      errors.push(`${path}: ${error.message}`);
    }
  }
  throw new Error(errors.join(' | '));
}

function pickRule(name) {
  return categoryRules.find((rule) => rule.match.test(name)) || {
    category: 'tees',
    collection: 'new',
    label: 'Streetwear Essential'
  };
}

function seoName(rawName, index) {
  const clean = String(rawName || `Printful Product ${index + 1}`)
    .replace(/\s+/g, ' ')
    .replace(/\b(unisex|men'?s|adult|printful|dtg)\b/gi, '')
    .trim();
  const rule = pickRule(clean);
  const prefix = /zavora/i.test(clean) ? '' : 'Zavora ';
  const base = clean || rule.label;
  if (/hoodie|tee|shirt|pant|jacket|cap|beanie|bag|tote/i.test(base)) return `${prefix}${base}`;
  return `${prefix}${base} ${rule.label}`;
}

function colorFromName(name, index) {
  const colors = ['black', 'white', 'gray', 'gold'];
  const lower = String(name || '').toLowerCase();
  if (lower.includes('black')) return 'black';
  if (lower.includes('white')) return 'white';
  if (lower.includes('gray') || lower.includes('grey')) return 'gray';
  if (lower.includes('gold') || lower.includes('yellow')) return 'gold';
  return colors[index % colors.length];
}

function priceFromProduct(product, index) {
  const raw = product?.retail_price || product?.price || product?.sync_variants?.[0]?.retail_price;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return Math.round(value);
  return 58 + (index % 8) * 14;
}

function imageFromProduct(product) {
  return product?.thumbnail_url
    || product?.image
    || product?.files?.[0]?.preview_url
    || product?.sync_variants?.find((variant) => variant?.files?.[0]?.preview_url)?.files?.[0]?.preview_url
    || 'assets/studio-wide-trouser.png';
}

function sizesFromVariants(variants = []) {
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  const found = new Set();
  variants.forEach((variant) => {
    const text = `${variant?.name || ''} ${variant?.variant_name || ''}`;
    sizeOrder.forEach((size) => {
      if (new RegExp(`\\b${size}\\b`, 'i').test(text)) found.add(size);
    });
  });
  const sizes = sizeOrder.filter((size) => found.has(size));
  return sizes.length ? sizes.slice(0, 5) : ['S', 'M', 'L', 'XL'];
}

function normalizeProduct(product, index) {
  const name = seoName(product?.name || product?.external_name || product?.sync_product?.name || product?.title, index);
  const rule = pickRule(name);
  const variants = product?.sync_variants || product?.variants || [];
  return {
    id: Number(product?.id || product?.template_id || product?.sync_product?.id || Date.now() + index),
    printfulId: product?.id || product?.template_id || product?.sync_product?.id || null,
    name,
    category: rule.category,
    collection: [rule.collection, index < 6 ? 'new' : 'best'],
    color: colorFromName(`${name} ${variants[0]?.name || ''}`, index),
    colors: ['black', 'white', 'gray', 'gold'],
    sizes: sizesFromVariants(variants),
    price: priceFromProduct(product, index),
    sale: false,
    popularity: 90 - (index % 10),
    badge: index < 4 ? 'New' : rule.collection === 'limited' ? 'Limited' : 'Zavora',
    img: imageFromProduct(product),
    alt: imageFromProduct(product),
    description: `Premium ${rule.label.toLowerCase()} styled for modern Zavora Fashion streetwear. Clean proportions, everyday comfort, and USA-ready fulfillment.`,
    seoTitle: `${name} | Zavora Fashion Premium Streetwear`,
    seoDescription: `Shop ${name} from Zavora Fashion. Premium men streetwear with clean fit, fast USA delivery, and luxury minimal styling.`
  };
}

module.exports = async function handler(req, res) {
  if (!PRINTFUL_API_KEY) {
    return response(res, 500, { ok: false, error: 'PRINTFUL_API_KEY is missing in Vercel environment variables.' });
  }
  if (!PRINTFUL_STORE_ID) {
    return response(res, 500, { ok: false, error: 'PRINTFUL_STORE_ID is missing in Vercel environment variables.' });
  }

  try {
    const limit = Math.min(Number(req.query.limit || 23), 60);
    const page = Math.max(Number(req.query.page || 1), 1);
    const offset = (page - 1) * limit;
    const list = await printfulFetch(`/store/products?limit=${limit}&offset=${offset}`);
    const rows = Array.isArray(list.result) ? list.result : [];

    let detailed = await Promise.all(rows.map(async (product) => {
      try {
        const detail = await printfulFetch(`/store/products/${product.id}`);
        return detail.result?.sync_product ? { ...detail.result.sync_product, sync_variants: detail.result.sync_variants || [] } : product;
      } catch (error) {
        return product;
      }
    }));

    let source = 'printful-store';

    if (!detailed.length) {
      const templateResponse = await tryPrintfulFetch([
        `/product-templates?limit=${limit}&offset=${offset}`,
        `/v2/product-templates?limit=${limit}&offset=${offset}`,
        `/products/templates?limit=${limit}&offset=${offset}`
      ]);
      const result = templateResponse.body.result || templateResponse.body.data || [];
      detailed = Array.isArray(result) ? result : (result.items || result.templates || []);
      source = `printful-templates:${templateResponse.path}`;
    }

    const products = detailed.slice(0, limit).map(normalizeProduct);
    response(res, 200, { ok: true, source, page, limit, count: products.length, products });
  } catch (error) {
    response(res, 500, { ok: false, error: error.message || 'Unable to import Printful products.' });
  }
};
