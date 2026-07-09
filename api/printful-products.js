const PRINTFUL_API_BASE_URL = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const INCLUDED_SHIPPING_COST = 14.99;
const SELLING_MARKUP = 1.3;
const COMPARE_AT_MARKUP = 2.3;

const categoryRules = [
  { match: /zip|quarter-zip/i, category: 'hoodies', collection: 'limited', label: 'Zip Hoodie' },
  { match: /hoodie|sweatshirt|fleece|pullover/i, category: 'hoodies', collection: 'oversized', label: 'Hoodie' },
  { match: /tee|t-shirt|shirt|polo/i, category: 'tees', collection: 'new', label: 'Heavyweight Tee' },
  { match: /short/i, category: 'pants', collection: 'new', label: 'Short' },
  { match: /pant|sweatpant|jogger|cargo/i, category: 'pants', collection: 'best', label: 'Pant' },
  { match: /jacket|windbreaker|coat/i, category: 'outerwear', collection: 'limited', label: 'Jacket' },
  { match: /shoe|sneaker|flip-flop|flip flop|slide/i, category: 'accessories', collection: 'best', label: 'Footwear' },
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
  const allowed = /(hoodie|zip|quarter-zip|tee|t-shirt|shirt|polo|sweatshirt|pullover|fleece|jacket|windbreaker|coat|pants|sweatpants|jogger|cargo|shorts|shoe|sneaker|flip-flop|flip flop|slide|cap|hat|beanie)/i.test(text);
  const blocked = /(underwear|boxer|brief|trunk|thong|panties|bra|legging|swim|bikini|sock|backpack|bag|tote|duffle|luggage|tag|crop|headband|neck gaiter|rash guard|jersey|women|women's|kids|youth|baby|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function isWomenCatalogProduct(product) {
  const text = `${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(women|women's|ladies|female|crop|cropped|baby tee|hoodie|zip|quarter-zip|tee|t-shirt|shirt|sweatshirt|pullover|fleece|sweatpants|jogger)/i.test(text);
  const blocked = /(men|men's|male|unisex|underwear|boxer|brief|trunk|thong|panties|bra|legging|swim|bikini|sock|backpack|bag|tote|duffle|luggage|tag|headband|neck gaiter|rash guard|jersey|kids|youth|baby clothes|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function catalogPredicate(gender) {
  return String(gender || '').toLowerCase() === 'women' ? isWomenCatalogProduct : isMenCatalogProduct;
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
    .replace(/\b(all-over print|unisex|men'?s|adult|printful|dtg|dtfilm|adidas|a4|yupoong|gildan|bella canvas|bella \+ canvas|champion|hanes|jerzees|econscious|stanley\/stella)\b/gi, '')
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

function colorFromName(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('black')) return 'black';
  if (lower.includes('white')) return 'white';
  if (lower.includes('gray') || lower.includes('grey')) return 'gray';
  if (lower.includes('blue') || lower.includes('navy')) return 'blue';
  if (lower.includes('green')) return 'green';
  if (lower.includes('red')) return 'red';
  if (lower.includes('pink')) return 'pink';
  if (lower.includes('purple')) return 'purple';
  if (lower.includes('brown') || lower.includes('tan') || lower.includes('khaki')) return 'brown';
  if (lower.includes('gold') || lower.includes('yellow')) return 'gold';
  return '';
}

function colorsFromVariants(variants = [], fallbackText = '') {
  const colorOrder = ['black', 'white', 'gray', 'blue', 'green', 'red', 'pink', 'purple', 'brown', 'gold'];
  if (/all[- ]?over|aop/i.test(fallbackText)) return ['white'];
  const found = new Set();
  const texts = variants.map((variant) => `${variant?.name || ''} ${variant?.variant_name || ''}`);
  if (!variants.length && fallbackText) texts.push(fallbackText);
  texts.forEach((text) => {
    const color = colorFromName(text);
    if (color) found.add(color);
  });
  const colors = colorOrder.filter((color) => found.has(color));
  return colors.length ? colors.slice(0, 4) : ['default'];
}

function basePriceFromProduct(product, index) {
  const raw = product?.retail_price || product?.price || product?.sync_variants?.[0]?.retail_price;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return Math.round(value);
  return 58 + (index % 8) * 14;
}

function priceWithIncludedShipping(product, index) {
  return basePriceFromProduct(product, index) + INCLUDED_SHIPPING_COST;
}

function roundedPrice(value) {
  return Math.round(value * 100) / 100;
}

function priceFromProduct(product, index) {
  return roundedPrice(priceWithIncludedShipping(product, index) * SELLING_MARKUP);
}

function compareAtFromProduct(product, index) {
  return roundedPrice(priceWithIncludedShipping(product, index) * COMPARE_AT_MARKUP);
}

function imageFromProduct(product) {
  return product?.sync_variants?.find((variant) => variant?.files?.[0]?.preview_url)?.files?.[0]?.preview_url
    || product?.variants?.find((variant) => variant?.files?.[0]?.preview_url)?.files?.[0]?.preview_url
    || product?.thumbnail_url
    || product?.image
    || product?.files?.[0]?.preview_url
    || 'assets/studio-wide-trouser.png';
}

function imagesFromProduct(product) {
  const urls = [];
  const add = (url) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(product?.thumbnail_url);
  add(product?.image);
  add(product?.mockup_url);
  (product?.files || []).forEach((file) => add(file?.preview_url || file?.thumbnail_url || file?.url));
  [...(product?.sync_variants || []), ...(product?.variants || [])].forEach((variant) => {
    add(variant?.image);
    add(variant?.thumbnail_url);
    add(variant?.product?.image);
    (variant?.files || []).forEach((file) => add(file?.preview_url || file?.thumbnail_url || file?.url));
  });
  add(imageFromProduct(product));
  return urls.slice(0, 6);
}

function variantImage(variant, fallback) {
  return variant?.files?.[0]?.preview_url
    || variant?.files?.find((file) => file?.preview_url)?.preview_url
    || variant?.product?.image
    || fallback;
}

function variantOptionsFromVariants(variants = [], fallbackImage = '', forceColor = '') {
  return variants.slice(0, 24).map((variant, index) => {
    const text = `${variant?.name || ''} ${variant?.variant_name || ''}`;
    const color = forceColor || colorFromName(text) || 'default';
    const sizes = sizesFromVariants([variant]);
    return {
      id: variant?.id || variant?.variant_id || index,
      name: variant?.name || variant?.variant_name || `Variant ${index + 1}`,
    color,
      size: sizes[0] || 'M',
      image: variantImage(variant, fallbackImage),
      stock: 5,
      sku: variant?.sku || variant?.external_id || ''
    };
  });
}

function sizesFromVariants(variants = []) {
  const sizeOrder = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
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
  const rawName = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''}`;
  const forceColor = /all[- ]?over|aop/i.test(rawName) ? 'white' : '';
  const colors = colorsFromVariants(variants, `${rawName} ${name} ${product?.description || ''}`);
  const image = imageFromProduct(product);
  const images = imagesFromProduct(product);
  const sizes = rule.category === 'accessories' ? ['M'] : sizesFromVariants(variants);
  return {
    id: Number(product?.id || product?.template_id || product?.sync_product?.id || Date.now() + index),
    printfulId: product?.id || product?.template_id || product?.sync_product?.id || null,
    name,
    category: rule.category,
    collection: [rule.collection, index < 6 ? 'new' : 'best'],
    color: colors[0] || 'default',
    colors,
    sizes,
    basePrice: basePriceFromProduct(product, index),
    includedShippingCost: INCLUDED_SHIPPING_COST,
    price: priceFromProduct(product, index),
    compareAt: compareAtFromProduct(product, index),
    sale: true,
    popularity: 90 - (index % 10),
    badge: index < 4 ? 'New' : rule.collection === 'limited' ? 'Limited' : 'Zavora',
    img: image,
    alt: image,
    images,
    stock: 5,
    variantOptions: variantOptionsFromVariants(variants, image, forceColor),
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
    const gender = String(req.query.gender || 'men').toLowerCase();
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
      detailed = catalogRows.filter(catalogPredicate(gender)).slice(offset, offset + limit).map(normalizeCatalogProduct);
      source = `printful-catalog:${gender}`;
    }

    const products = detailed.slice(0, limit).map((product, index) => product?.seoTitle ? product : normalizeProduct(product, index));
    response(res, 200, { ok: true, source, page, limit, count: products.length, products });
  } catch (error) {
    response(res, 500, { ok: false, error: error.message || 'Unable to import Printful products.' });
  }
};
