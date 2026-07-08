const PRINTFUL_API_BASE_URL = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;

const categoryRules = [
  { match: /zip|quarter-zip/i, category: 'hoodies', collection: 'limited', label: 'Zip Hoodie' },
  { match: /hoodie|sweatshirt|fleece|pullover/i, category: 'hoodies', collection: 'oversized', label: 'Hoodie' },
  { match: /tee|t-shirt|shirt|polo/i, category: 'tees', collection: 'new', label: 'Heavyweight Tee' },
  { match: /pant|sweatpant|jogger|cargo/i, category: 'pants', collection: 'best', label: 'Pant' },
  { match: /jacket|windbreaker|coat/i, category: 'outerwear', collection: 'limited', label: 'Jacket' },
  { match: /cap|hat|beanie/i, category: 'accessories', collection: 'best', label: 'Accessory' }
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

async function printfulCatalogFetch(path) {
  const result = await fetch(`${PRINTFUL_API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(body?.error?.message || body?.message || `Printful catalog request failed: ${result.status}`);
  }
  return body;
}

function isMenCatalogProduct(product) {
  const text = `${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(hoodie|zip|quarter-zip|tee|t-shirt|shirt|polo|sweatshirt|pullover|fleece|jacket|windbreaker|coat|pants|sweatpants|jogger|cargo|cap|hat|beanie)/i.test(text);
  const blocked = /(underwear|boxer|brief|trunk|thong|panties|bra|legging|shorts|swim|bikini|sock|shoe|sandal|slide|backpack|bag|tote|duffle|luggage|tag|women|women's|kids|youth|baby|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|bottle|mouse pad|notebook|card)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
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
    .replace(/\s*\|\s*[^|]+$/g, '')
    .replace(/\b(unisex|men'?s|adult|printful|dtg|dtfilm|adidas|a4|yupoong|gildan|bella canvas|bella \+ canvas|champion|hanes|jerzees|econscious|stanley\/stella)\b/gi, '')
    .replace(/\b[A-Z]{1,4}\d{2,5}[A-Z]?\b/g, '')
    .trim();
  const rule = pickRule(clean);
  const prefix = /zavora/i.test(clean) ? '' : 'Zavora ';
  const base = clean
    .replace(/\s{2,}/g, ' ')
    .replace(/^[-–| ]+|[-–| ]+$/g, '')
    || rule.label;
  if (/hoodie|tee|shirt|polo|pant|jogger|jacket|cap|hat|beanie/i.test(base)) return `${prefix}${base}`;
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

function normalizeCatalogProduct(product, index) {
  return normalizeProduct({
    id: product.id,
    name: product.title || product.type_name,
    title: product.title,
    image: product.image,
    price: product.retail_price,
    description: product.description
  }, index);
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
      try {
        const templateResponse = await tryPrintfulFetch([
          `/product-templates?limit=${limit}&offset=${offset}`,
          `/v2/product-templates?limit=${limit}&offset=${offset}`,
          `/products/templates?limit=${limit}&offset=${offset}`
        ]);
        const result = templateResponse.body.result || templateResponse.body.data || [];
        detailed = Array.isArray(result) ? result : (result.items || result.templates || []);
        source = `printful-templates:${templateResponse.path}`;
      } catch (error) {
        detailed = [];
      }
    }

    if (!detailed.length) {
      const catalog = await printfulCatalogFetch('/products');
      const catalogRows = Array.isArray(catalog.result) ? catalog.result : [];
      detailed = catalogRows.filter(isMenCatalogProduct).slice(offset, offset + limit).map(normalizeCatalogProduct);
      source = 'printful-catalog';
    }

    const products = detailed.slice(0, limit).map((product, index) => product?.seoTitle ? product : normalizeProduct(product, index));
    response(res, 200, { ok: true, source, page, limit, count: products.length, products });
  } catch (error) {
    response(res, 500, { ok: false, error: error.message || 'Unable to import Printful products.' });
  }
};
