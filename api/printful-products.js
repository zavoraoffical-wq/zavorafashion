const PRINTFUL_API_BASE_URL = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const INCLUDED_SHIPPING_COST = 14.99;
const SELLING_MARKUP = 1.3;
const COMPARE_AT_MARKUP = 2.3;

const categoryRules = [
  { match: /set|matching|tracksuit/i, category: 'matching-sets', collection: 'matching-sets', label: 'Matching Set' },
  { match: /sport|performance|athletic|training|gym|workout|active|jersey/i, category: 'sportswear', collection: 'sportswear', label: 'Sportswear' },
  { match: /beach|swim|board short|boardshort|flip-flop|flip flop|slide/i, category: 'beachwear', collection: 'beachwear', label: 'Beachwear' },
  { match: /zip|quarter-zip/i, category: 'hoodies', collection: 'streetwear', label: 'Zip Hoodie' },
  { match: /hoodie|sweatshirt|fleece|pullover/i, category: 'hoodies', collection: 'streetwear', label: 'Hoodie' },
  { match: /tee|t-shirt|shirt|polo/i, category: 'tees', collection: 'streetwear', label: 'Heavyweight Tee' },
  { match: /short/i, category: 'pants', collection: 'beachwear', label: 'Short' },
  { match: /pant|sweatpant|jogger|cargo/i, category: 'pants', collection: 'streetwear', label: 'Pant' },
  { match: /jacket|windbreaker|coat/i, category: 'outerwear', collection: 'streetwear', label: 'Jacket' },
  { match: /shoe|sneaker/i, category: 'accessories', collection: 'streetwear', label: 'Footwear' },
  { match: /cap|hat|beanie/i, category: 'accessories', collection: 'streetwear', label: 'Accessory' }
];

function response(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
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
  const text = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(hoodie|zip|quarter-zip|tee|t-shirt|shirt|polo|sweatshirt|pullover|fleece|jacket|windbreaker|coat|pants|sweatpants|jogger|cargo|shorts|board short|sport|performance|athletic|training|gym|active|set|matching|tracksuit|shoe|sneaker|flip-flop|flip flop|slide|cap|hat|beanie)/i.test(text);
  const blocked = /(underwear|boxer|brief|trunk|thong|panties|bra|legging|bikini|sock|backpack|bag|tote|duffle|luggage|tag|crop|headband|neck gaiter|rash guard|women|women's|kids|youth|baby|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function isWomenCatalogProduct(product) {
  const text = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(women|women's|ladies|female|crop|cropped|baby tee|hoodie|zip|quarter-zip|tee|t-shirt|shirt|sweatshirt|pullover|fleece|sweatpants|jogger|shorts|sport|performance|athletic|training|gym|active|set|matching|tracksuit|beach|slide)/i.test(text);
  const blocked = /(men|men's|male|unisex|underwear|boxer|brief|trunk|thong|panties|bra|legging|bikini|sock|backpack|bag|tote|duffle|luggage|tag|headband|neck gaiter|rash guard|kids|youth|baby clothes|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function catalogPredicate(gender) {
  return String(gender || '').toLowerCase() === 'women' ? isWomenCatalogProduct : isMenCatalogProduct;
}

function pickRule(name) {
  return categoryRules.find((rule) => rule.match.test(name)) || {
    category: 'tees',
    collection: 'streetwear',
    label: 'Streetwear Essential'
  };
}

function collectionTags(product, rule, index) {
  const raw = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.description || ''}`.toLowerCase();
  const tags = new Set([rule.collection, index < 6 ? 'new' : 'best']);
  if (/sport|performance|athletic|training|gym|workout|active|jersey/.test(raw)) tags.add('sportswear');
  if (/street|hoodie|sweatshirt|tee|t-shirt|cargo|jogger|cap|hat|sneaker/.test(raw)) tags.add('streetwear');
  if (/set|matching|tracksuit/.test(raw)) tags.add('matching-sets');
  if (/beach|swim|board short|boardshort|flip-flop|flip flop|slide|short/.test(raw)) tags.add('beachwear');
  return [...tags].filter(Boolean);
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
  const has = (pattern) => new RegExp(`(^|[^a-z])(${pattern})([^a-z]|$)`, 'i').test(lower);
  if (has('black|jet black|true black')) return 'black';
  if (has('white|optic white|true white')) return 'white';
  if (has('gray|grey|heather gray|heather grey|sport gray|sport grey')) return 'gray';
  if (has('blue|navy|royal')) return 'blue';
  if (has('green|olive|forest')) return 'green';
  return '';
}

function colorFromExplicitValue(value) {
  const lower = String(value || '').toLowerCase().trim();
  if (!lower) return '';
  if (lower.includes('black')) return 'black';
  if (lower.includes('white') || lower.includes('natural')) return 'white';
  if (lower.includes('gray') || lower.includes('grey') || lower.includes('heather') || lower.includes('ash')) return 'gray';
  if (lower.includes('blue') || lower.includes('navy') || lower.includes('royal') || lower.includes('denim')) return 'blue';
  if (lower.includes('green') || lower.includes('olive') || lower.includes('forest')) return 'green';
  if (lower.includes('red') || lower.includes('scarlet') || lower.includes('burgundy') || lower.includes('maroon')) return 'red';
  if (lower.includes('pink') || lower.includes('rose')) return 'pink';
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('lavender')) return 'purple';
  if (lower.includes('brown') || lower.includes('tan') || lower.includes('khaki') || lower.includes('sand') || lower.includes('beige') || lower.includes('cream')) return 'brown';
  if (lower.includes('gold') || lower.includes('yellow') || lower.includes('mustard')) return 'gold';
  const aliases = [
    ['black', /^(black|jet black|true black|black heather)$/],
    ['white', /^(white|optic white|true white|off white|natural)$/],
    ['gray', /^(gray|grey|heather gray|heather grey|sport gray|sport grey|ash)$/],
    ['blue', /^(blue|navy|royal|indigo|denim|light blue|dark blue)$/],
    ['green', /^(green|olive|forest|army|military green)$/],
    ['red', /^(red|scarlet|burgundy|maroon|cardinal)$/],
    ['pink', /^(pink|rose|light pink|hot pink)$/],
    ['purple', /^(purple|violet|lavender)$/],
    ['brown', /^(brown|tan|khaki|sand|beige|cream)$/],
    ['gold', /^(gold|yellow|mustard)$/]
  ];
  const match = aliases.find(([, pattern]) => pattern.test(lower));
  return match ? match[0] : '';
}

function colorFromVariant(variant, forceColor = '') {
  if (forceColor) return forceColor;
  const explicit = colorFromExplicitValue(variant?.color || variant?.color_name || variant?.colorName);
  if (explicit) return explicit;
  const text = `${variant?.name || ''} ${variant?.variant_name || ''}`;
  return colorFromName(text) || 'default';
}

function colorsFromVariants(variants = [], fallbackText = '') {
  const colorOrder = ['black', 'white', 'gray', 'blue', 'green', 'red', 'pink', 'purple', 'brown', 'gold', 'default'];
  if (/all[- ]?over|aop/i.test(fallbackText)) return ['white'];
  const found = new Set();
  variants.forEach((variant) => {
    const color = colorFromVariant(variant);
    if (color) found.add(color);
  });
  if (!variants.length && fallbackText) {
    const color = colorFromName(fallbackText);
    if (color) found.add(color);
  }
  const colors = colorOrder.filter((color) => found.has(color));
  return colors.length && !(colors.length === 1 && colors[0] === 'default') ? colors.slice(0, 4) : ['default'];
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

function variantPools(product) {
  return [
    ...(product?.catalog_variants || []),
    ...(product?.sync_variants || []),
    ...(product?.variants || []),
    ...(product?.printful_detail?.catalog_variants || []),
    ...(product?.printful_detail?.sync_variants || []),
    ...(product?.printful_detail?.variants || [])
  ];
}

function productPools(product) {
  return [
    product,
    product?.catalog_product,
    product?.sync_product,
    product?.printful_detail,
    product?.printful_detail?.catalog_product,
    product?.printful_detail?.sync_product
  ].filter(Boolean);
}

function fileUrl(file) {
  return file?.preview_url || file?.thumbnail_url || file?.url || file?.preview || file?.image_url || '';
}

function imageFromProduct(product) {
  const variantImageUrl = variantPools(product)
    .map((variant) => variantImage(variant, ''))
    .find(Boolean);
  const directImageUrl = productPools(product)
    .flatMap((item) => [item?.thumbnail_url, item?.image, item?.mockup_url, item?.image_url, ...(item?.files || []).map(fileUrl)])
    .find(Boolean);
  return variantImageUrl
    || directImageUrl
    || 'assets/studio-wide-trouser.png';
}

function imagesFromProduct(product) {
  const urls = [];
  const add = (url) => {
    if (url && !urls.includes(url)) urls.push(url);
  };
  productPools(product).forEach((item) => {
    add(item?.thumbnail_url);
    add(item?.image);
    add(item?.mockup_url);
    add(item?.image_url);
    (item?.files || []).forEach((file) => add(fileUrl(file)));
  });
  variantPools(product).forEach((variant) => {
    add(variant?.image);
    add(variant?.thumbnail_url);
    add(variant?.image_url);
    add(variant?.product?.image);
    (variant?.files || []).forEach((file) => add(fileUrl(file)));
  });
  add(imageFromProduct(product));
  return urls.slice(0, 6);
}

function variantImage(variant, fallback) {
  return fileUrl(variant?.files?.[0])
    || fileUrl((variant?.files || []).find((file) => fileUrl(file)))
    || variant?.image_url
    || variant?.image
    || variant?.thumbnail_url
    || variant?.preview_url
    || variant?.product?.image
    || fallback;
}

function variantOptionsFromVariants(variants = [], fallbackImage = '', forceColor = '') {
  const selectedColors = [];
  variants.forEach((variant) => {
    const color = colorFromVariant(variant, forceColor);
    if (!selectedColors.includes(color) && selectedColors.length < 4) selectedColors.push(color);
  });
  const allowedColors = selectedColors.length ? selectedColors : ['default'];
  const seen = new Set();
  const options = [];
  variants.forEach((variant, index) => {
    const color = colorFromVariant(variant, forceColor);
    if (!allowedColors.includes(color)) return;
    const sizes = sizesFromVariants([variant]);
    const size = sizes[0] || 'M';
    const key = `${color}-${size}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      id: variant?.id || variant?.variant_id || index,
      name: variant?.name || variant?.variant_name || `Variant ${index + 1}`,
      color,
      size,
      image: variantImage(variant, fallbackImage),
      stock: 5,
      sku: variant?.sku || variant?.external_id || ''
    });
  });
  return options.slice(0, 32);
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

async function enrichWithCatalogProduct(product) {
  const variantId = variantPools(product).find((variant) => variant?.variant_id || variant?.id)?.variant_id
    || variantPools(product).find((variant) => variant?.variant_id || variant?.id)?.id;
  if (!variantId) return product;

  try {
    const variantDetail = await printfulCatalogFetch(`/products/variant/${variantId}`);
    const variantResult = variantDetail?.result || {};
    const variant = variantResult?.variant || variantResult;
    const productId = variant?.product_id || variantResult?.product?.id || variantResult?.product_id;
    if (!productId) return product;

    const productDetail = await printfulCatalogFetch(`/products/${productId}`);
    const productResult = productDetail?.result || {};
    const catalogProduct = productResult?.product || productResult;
    const catalogVariants = Array.isArray(productResult?.variants) ? productResult.variants : [];
    if (!catalogVariants.length) return product;

    return {
      ...product,
      catalog_product: catalogProduct,
      catalog_variants: catalogVariants,
      catalog_variant: variant
    };
  } catch (error) {
    return product;
  }
}

function normalizeProduct(product, index) {
  const name = seoName(product?.name || product?.external_name || product?.sync_product?.name || product?.title, index);
  const rule = pickRule(name);
  const variants = variantPools(product);
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
    collection: collectionTags(product, rule, index),
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
        const merged = detail.result?.sync_product
          ? {
              ...product,
              ...detail.result.sync_product,
              sync_product: detail.result.sync_product,
              sync_variants: detail.result.sync_variants || [],
              variants: detail.result.sync_variants || [],
              printful_detail: detail.result
            }
          : product;
        return enrichWithCatalogProduct(merged);
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

    const filtered = detailed.filter((product) => product?.seoTitle || catalogPredicate(gender)(product));
    const products = filtered.slice(0, limit).map((product, index) => product?.seoTitle ? product : normalizeProduct(product, index));
    response(res, 200, { ok: true, source, page, limit, count: products.length, products });
  } catch (error) {
    response(res, 500, { ok: false, error: error.message || 'Unable to import Printful products.' });
  }
};
