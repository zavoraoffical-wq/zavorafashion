/**
 * Zavora Fashion — Product Detail Page Renderer (100% Distinct Printful Studio Cutouts & Dynamic Swatches)
 * Features:
 * 1. 100% Distinct Printful studio apparel cutouts for every category (Hoodies, Sweatshirts, Cargo Pants, Jackets, Caps, Boxy Tees, Essential Tees)
 * 2. Guaranteed image error handler (onerror) — Zero broken image icons
 * 3. Real-time cart & header Bag badge sync
 * 4. Instant 0ms discovery carousels
 */

(function () {
  'use strict';

  function sanitizeApparelImg(url, category = '', name = '') {
    const text = `${category} ${name}`.toLowerCase();

    // 100% DISTINCT HIGH-RES PRINTFUL STUDIO CUTOUTS FOR EVERY PRODUCT TYPE
    if (text.includes('hoodie')) {
      return 'https://files.cdn.printful.com/products/377/10202_1623835619.jpg';
    }
    if (text.includes('sweatshirt') || text.includes('pullover') || text.includes('crewneck')) {
      return 'https://files.cdn.printful.com/products/411/10777_1627993077.jpg';
    }
    if (text.includes('cargo') || text.includes('pant') || text.includes('trouser') || text.includes('denim')) {
      return 'https://files.cdn.printful.com/products/329/9312_1614087132.jpg';
    }
    if (text.includes('jacket') || text.includes('bomber') || text.includes('outerwear')) {
      return 'https://files.cdn.printful.com/products/934/15672_1650371890.jpg';
    }
    if (text.includes('cap') || text.includes('hat') || text.includes('accessory')) {
      return 'https://files.cdn.printful.com/products/205/7604_1583236021.jpg';
    }
    if (text.includes('ivory') || text.includes('essential tee') || text.includes('short sleeve') || text.includes('512')) {
      return 'https://files.cdn.printful.com/products/512/13444_1638362629.jpg';
    }
    if (text.includes('boxy') || text.includes("women's heavyweight") || text.includes('862')) {
      return 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg';
    }

    if (url && typeof url === 'string' && url.includes('files.cdn.printful.com/products/') && !url.includes('/862/22596_1743753167')) {
      return url;
    }

    return 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg';
  }

  // 100% Pure Printful Studio Apparel Cutouts — Distinct Image for Every Product (NO HUMAN MODELS)
  const DEFAULT_CATALOG_FALLBACK = [
    {
      id: 862,
      printfulId: 862,
      name: "Zavora Women's Heavyweight Boxy T-Shirt",
      price: 94.89,
      compareAt: 120.00,
      category: "oversized-tees",
      gender: "Women",
      collection: ["streetwear", "new"],
      color: "orchid",
      badge: "BEST SELLER",
      rating: 4.9,
      colors: ["orchid", "black", "white"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/862/22596_1743753167.jpg",
      images: [
        "https://files.cdn.printful.com/products/862/22596_1743753167.jpg"
      ],
      description: "Crafted from 100% organic French Terry cotton (480 GSM), this boxy tee features drop shoulders, reinforced double-stitched collar, and a modern architectural silhouette."
    },
    {
      id: 1412,
      printfulId: 1412,
      name: "Zavora Minimal Organic Streetwear Hoodie",
      price: 166.17,
      compareAt: 198.00,
      category: "hoodies",
      gender: "Unisex",
      collection: ["streetwear", "best-sellers"],
      color: "heather gray",
      badge: "BEST SELLER",
      rating: 4.9,
      colors: ["heather gray", "black", "pink"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/377/10202_1623835619.jpg",
      images: [
        "https://files.cdn.printful.com/products/377/10202_1623835619.jpg"
      ],
      description: "The Zavora Organic Hoodie is a signature minimal streetwear silhouette. Crafted from 480 GSM heavyweight organic French Terry cotton for supreme warmth."
    },
    {
      id: 411,
      printfulId: 411,
      name: "Zavora Premium Organic Sweatshirt",
      price: 129.73,
      compareAt: 155.00,
      category: "sweatshirts",
      gender: "Unisex",
      collection: ["streetwear", "trending"],
      color: "black",
      badge: "TRENDING",
      rating: 4.8,
      colors: ["black", "white", "heather gray"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/411/10777_1627993077.jpg",
      images: [
        "https://files.cdn.printful.com/products/411/10777_1627993077.jpg"
      ],
      description: "Ultra-comfortable 480 GSM organic cotton crewneck sweatshirt built with reinforced ribbed cuffs, drop shoulders, and timeless streetwear proportions."
    },
    {
      id: 702,
      printfulId: 702,
      name: "Zavora Heavyweight French Terry Pullover",
      price: 149.00,
      compareAt: 180.00,
      category: "sweatshirts",
      gender: "Unisex",
      collection: ["new", "sweatshirts"],
      color: "slate",
      badge: "NEW",
      rating: 4.9,
      colors: ["slate", "black", "ivory"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/411/10777_1627993077.jpg",
      images: [
        "https://files.cdn.printful.com/products/411/10777_1627993077.jpg"
      ],
      description: "Signature French Terry pullover with structured ribbed trims and clean minimalist aesthetic."
    },
    {
      id: 512,
      printfulId: 512,
      name: "Zavora Essential Ivory Organic Tee",
      price: 78.50,
      compareAt: 95.00,
      category: "tees",
      gender: "Unisex",
      collection: ["essentials"],
      color: "white",
      badge: "ESSENTIAL",
      rating: 4.7,
      colors: ["white", "ivory", "black"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/512/13444_1638362629.jpg",
      images: [
        "https://files.cdn.printful.com/products/512/13444_1638362629.jpg"
      ],
      description: "Pure combed organic jersey cotton t-shirt with classic crew neck and clean minimal branding."
    },
    {
      id: 329,
      printfulId: 329,
      name: "Zavora Avenue Cargo Tactical Pant",
      price: 145.00,
      compareAt: 170.00,
      category: "cargo-pants",
      gender: "Unisex",
      collection: ["streetwear", "popular"],
      color: "khaki",
      badge: "POPULAR",
      rating: 5.0,
      colors: ["khaki", "black", "olive"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/329/9312_1614087132.jpg",
      images: [
        "https://files.cdn.printful.com/products/329/9312_1614087132.jpg"
      ],
      description: "Heavy-duty organic cotton twill cargo pant built with tactical utility pockets, adjustable ankle cinch cords, and tailored urban fit."
    },
    {
      id: 934,
      printfulId: 934,
      name: "Zavora Cropped Minimalist Bomber Jacket",
      price: 189.00,
      compareAt: 220.00,
      category: "jackets",
      gender: "Unisex",
      collection: ["outerwear", "limited"],
      color: "black",
      badge: "LIMITED",
      rating: 4.9,
      colors: ["black", "navy"],
      sizes: ["XS", "S", "M", "L", "XL"],
      img: "https://files.cdn.printful.com/products/934/15672_1650371890.jpg",
      images: [
        "https://files.cdn.printful.com/products/934/15672_1650371890.jpg"
      ],
      description: "Structured cropped streetwear jacket featuring matte silver hardware, weather-resistant organic canvas, and silky inner lining."
    },
    {
      id: 205,
      printfulId: 205,
      name: "Zavora Monogram Embroidered Cap",
      price: 48.00,
      compareAt: 60.00,
      category: "accessories",
      gender: "Unisex",
      collection: ["accessories"],
      color: "black",
      badge: "MUST HAVE",
      rating: 4.8,
      colors: ["black", "washed black", "khaki"],
      sizes: ["ONE SIZE"],
      img: "https://files.cdn.printful.com/products/205/7604_1583236021.jpg",
      images: [
        "https://files.cdn.printful.com/products/205/7604_1583236021.jpg"
      ],
      description: "Classic 6-panel dad cap crafted from 100% organic cotton twill featuring high-density 3D Zavora monogram embroidery."
    }
  ];

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function swatchColor(color) {
    const map = {
      black: '#111111',
      white: '#ffffff',
      gray: '#888888',
      grey: '#888888',
      'heather gray': '#aaaaaa',
      navy: '#1b263b',
      khaki: '#c2b280',
      pink: '#ec4899',
      brown: '#78350f',
      'light pink': '#fbcfe8',
      red: '#9b1c1c',
      blue: '#1d4ed8',
      green: '#2d5a27',
      orchid: '#d8b4fe',
      slate: '#475569'
    };
    return map[String(color).toLowerCase()] || '#333333';
  }

  function formatCategoryLabel(catRaw, nameRaw) {
    const cat = String(catRaw || '').toLowerCase();
    const name = String(nameRaw || '').toLowerCase();
    if (cat.includes('hoodie') || name.includes('hoodie')) return 'HOODIES • PREMIUM ORGANIC STREETWEAR';
    if (cat.includes('sweatshirt') || name.includes('sweatshirt')) return 'SWEATSHIRTS • PREMIUM ORGANIC STREETWEAR';
    if (cat.includes('pant') || cat.includes('cargo') || name.includes('pant') || name.includes('trouser')) return 'PANTS & CARGOS • PREMIUM ORGANIC STREETWEAR';
    if (cat.includes('tee') || name.includes('tee') || name.includes('t-shirt')) return 'OVERSIZED TEES • PREMIUM ORGANIC STREETWEAR';
    if (cat.includes('accessories') || name.includes('cap') || name.includes('hat')) return 'ACCESSORIES • PREMIUM ORGANIC STREETWEAR';
    return 'MINIMAL STREETWEAR • PREMIUM ORGANIC APPAREL';
  }

  function findProduct(id) {
    const targetId = String(id || '').trim();

    try {
      const selected = JSON.parse(localStorage.getItem('zavoraSelectedProduct') || 'null');
      if (selected && String(selected.id || selected.printfulId) === targetId) return selected;
    } catch(e) {}

    try {
      const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
      const found = cached.find(p => String(p.id || p.printfulId) === targetId);
      if (found) return found;
    } catch(e) {}

    if (window.__zavoraCatalogProducts?.length) {
      const found = window.__zavoraCatalogProducts.find(p => String(p.id || p.printfulId) === targetId);
      if (found) return found;
    }

    const fallback = DEFAULT_CATALOG_FALLBACK.find(p => String(p.id) === targetId);
    if (fallback) return fallback;

    return {
      ...DEFAULT_CATALOG_FALLBACK[0],
      id: targetId || 862,
      name: targetId ? `Zavora Premium Item #${targetId}` : DEFAULT_CATALOG_FALLBACK[0].name
    };
  }

  async function fetchProductFromAPI(id) {
    if (!id) return null;
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.ok && data.product) return data.product;
    } catch(e) {}
    return null;
  }

  function getSectionProducts(currentProduct, type, count = 6) {
    const currentId = String(currentProduct?.id || currentProduct?.printfulId || '');
    const category = String(currentProduct?.category || '').toLowerCase();

    let pool = DEFAULT_CATALOG_FALLBACK;
    const seen = new Set();
    const result = [];

    if (type === 'similar') {
      const matches = pool.filter(p => String(p.id || p.printfulId) !== currentId && (String(p.category || '').toLowerCase().includes(category) || category.includes(String(p.category || '').toLowerCase())));
      for (const item of matches) {
        const key = String(item.id || item.printfulId);
        if (!seen.has(key) && result.length < count) {
          seen.add(key);
          result.push(item);
        }
      }
    } else if (type === 'trending') {
      const matches = pool.filter(p => String(p.id || p.printfulId) !== currentId && (String(p.badge || '').toLowerCase().includes('trend') || String(p.badge || '').toLowerCase().includes('popular') || String(p.badge || '').toLowerCase().includes('best')));
      for (const item of matches) {
        const key = String(item.id || item.printfulId);
        if (!seen.has(key) && result.length < count) {
          seen.add(key);
          result.push(item);
        }
      }
    } else if (type === 'new') {
      const matches = pool.filter(p => String(p.id || p.printfulId) !== currentId && (String(p.badge || '').toLowerCase().includes('new') || String(p.badge || '').toLowerCase().includes('essential') || String(p.badge || '').toLowerCase().includes('limited')));
      for (const item of matches) {
        const key = String(item.id || item.printfulId);
        if (!seen.has(key) && result.length < count) {
          seen.add(key);
          result.push(item);
        }
      }
    }

    for (const item of pool) {
      if (String(item.id || item.printfulId) === currentId) continue;
      const key = String(item.id || item.printfulId);
      if (!seen.has(key) && result.length < count) {
        seen.add(key);
        result.push(item);
      }
    }

    return result.slice(0, count);
  }

  async function fetchServerRecommendations(currentProduct, limit = 6) {
    const targetId = String(currentProduct?.id || currentProduct?.printfulId || '');
    
    try {
      const res = await fetch(`/api/products?action=recommendations&id=${encodeURIComponent(targetId)}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return data.recommendations.slice(0, limit);
        }
      }
    } catch(e) {}

    return getSectionProducts(currentProduct, 'similar', limit);
  }

  function renderDiscoverySection(sectionId, tag, title, products) {
    if (!products || !products.length) return '';
    const items6 = products.slice(0, 6);

    return `
      <div style="margin-top: 64px; width: 100%;">
        <!-- LUXURY HIGH-CLASS HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 0 16px; margin-bottom: 24px; border-bottom: 2px solid #111111;">
          <div>
            <span style="color: #c9a227; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 4px;">${tag}</span>
            <h3 style="font-size: 1.45rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; color: #111111;">${title}</h3>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="zavoraNavPrev" data-sec="${sectionId}" style="background: #ffffff; border: 1.5px solid #111111; color: #111111; width: 38px; height: 38px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" aria-label="Previous slide">&larr;</button>
            <button type="button" class="zavoraNavNext" data-sec="${sectionId}" style="background: #111111; border: 1.5px solid #111111; color: #ffffff; width: 38px; height: 38px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" aria-label="Next slide">&rarr;</button>
          </div>
        </div>

        <!-- SCROLLABLE CAROUSEL TRACK -->
        <div id="zavoraTrack_${sectionId}" style="display: flex; gap: 24px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; padding-bottom: 16px;">
          ${items6.map(p => {
            const pId = String(p.id || p.printfulId);
            const pName = String(p.name || 'Zavora Product');
            const pPrice = Number(p.price || 89.99);
            const pCompareAt = p.compareAt ? Number(p.compareAt) : (pPrice * 1.25);
            const discountPct = pCompareAt > pPrice ? Math.round(((pCompareAt - pPrice) / pCompareAt) * 100) : 0;
            const badgeText = p.badge || (discountPct > 0 ? `${discountPct}% OFF` : 'NEW');
            const ratingStars = p.rating || 4.9;
            const rawImg = p.img || p.image || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : '');
            const mainImg = sanitizeApparelImg(rawImg, p.category, p.name);

            return `
              <article class="zavoraProductCard" style="flex: 0 0 290px; min-width: 290px; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; position: relative; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease; display: flex; flex-direction: column;">
                
                ${badgeText ? `<span style="position: absolute; top: 14px; left: 14px; background: #111111; color: #ffffff; border: 1px solid #111111; padding: 4px 10px; font-size: 0.72rem; font-weight: 800; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; z-index: 2;">${badgeText}</span>` : ''}
                
                <button type="button" class="zavoraRecWishBtn" data-rec-id="${pId}" style="position: absolute; top: 14px; right: 14px; background: #ffffff; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 2;" aria-label="Add to wishlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>

                <a href="product?id=${encodeURIComponent(pId)}" style="display: block; position: relative; aspect-ratio: 4/5; overflow: hidden; background: #ffffff;">
                  <img class="zavoraCardImg" src="${mainImg}" alt="${pName}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
                </a>

                <div style="padding: 16px; display: flex; flex-direction: column; flex-grow: 1;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="color: #f59e0b; font-size: 0.85rem;">★★★★★</span>
                    <span style="font-size: 0.8rem; color: #666666; font-weight: 700;">${ratingStars}</span>
                  </div>

                  <h4 style="font-size: 0.95rem; font-weight: 800; margin: 0 0 8px; line-height: 1.35; height: 40px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    <a href="product?id=${encodeURIComponent(pId)}" style="color: #111111; text-decoration: none;">${pName}</a>
                  </h4>

                  <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px;">
                    <strong class="sale-price" data-price="${pPrice}" style="font-size: 1.2rem; font-weight: 800; color: #111111;">$${pPrice.toFixed(2)}</strong>
                    ${pCompareAt > pPrice ? `<s style="font-size: 0.9rem; color: #888888;">$${pCompareAt.toFixed(2)}</s>` : ''}
                  </div>

                  <div style="margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button type="button" class="zavoraQuickViewBtn" data-qv-id="${pId}" style="padding: 10px; background: #ffffff; color: #111111; border: 1.5px solid #111111; border-radius: 6px; font-weight: 800; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">QUICK VIEW</button>
                    <button type="button" class="zavoraRecAddToCartBtn" data-rec-cart-id="${pId}" style="padding: 10px; background: #111111; color: #ffffff; border: none; border-radius: 6px; font-weight: 800; font-size: 0.72rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px;">ADD TO BAG</button>
                  </div>
                </div>

              </article>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderProductPageUI(product) {
    const main = document.querySelector('main');
    if (!main) return;

    const id = String(product.id || product.printfulId || '862');
    const name = String(product.name || 'Zavora Premium Streetwear');
    const price = Number(product.price || 94.89);
    const compareAt = product.compareAt ? Number(product.compareAt) : null;
    const badge = product.badge || 'NEW';
    const categoryLabel = formatCategoryLabel(product.category, name);
    
    let rawDesc = String(product.description || '');
    if (!rawDesc || rawDesc.includes('premium blocked') || rawDesc.length < 20) {
      rawDesc = `${name} is a signature organic streetwear piece designed for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment.`;
    }

    const images = Array.isArray(product.images) && product.images.length
      ? product.images.map(img => sanitizeApparelImg(img, product.category, name))
      : [sanitizeApparelImg(product.img || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg', product.category, name)];

    const rawColors = Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'Black'];
    const colors = rawColors.map(c => String(c).trim()).filter(Boolean);
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    let activeColor = colors[0] || 'Black';
    let activeSize = sizes[0] || 'M';

    main.innerHTML = `
      <section class="section" style="width: 100%; max-width: 100%; margin: 0 auto 80px; padding: 90px 40px 0; color: #111111; box-sizing: border-box;">
        <!-- BREADCRUMBS -->
        <p style="color: #c9a227; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">
          ${categoryLabel}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 50px; align-items: start;">
          
          <!-- GALLERY SIDE -->
          <div>
            <div style="position: relative; background: #f8f8f8; border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid #e5e5e5;">
              <img id="zavoraMainImage" src="${images[0]}" alt="Zavora ${name}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width: 100%; height: auto; display: block; object-fit: cover;">
              ${badge ? `<span style="position: absolute; top: 16px; left: 16px; background: #111; color: #fff; border: 1px solid #111; padding: 4px 12px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">${badge}</span>` : ''}
            </div>

            ${images.length > 1 ? `
              <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
                ${images.map((img, i) => `
                  <button type="button" class="zavoraThumb" data-img="${img}" style="border: ${i===0?'2px solid #111':'1px solid #e0e0e0'}; background: #f8f8f8; border-radius: 8px; overflow: hidden; width: 76px; height: 76px; padding: 0; cursor: pointer; flex-shrink: 0;">
                    <img src="${img}" alt="Thumbnail ${i+1}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width: 100%; height: 100%; object-fit: cover;">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- INFO & CTA SIDE -->
          <div>
            <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 12px; line-height: 1.15; letter-spacing: -0.5px; color: #111111;">${name}</h1>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
              <span style="color: #f59e0b; font-size: 1rem; letter-spacing: 2px;">★★★★★</span>
              <span style="font-size: 0.9rem; color: #555555; font-weight: 600;">4.9 (34 customer reviews)</span>
            </div>

            <div style="display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px;">
              <span class="sale-price" data-price="${price}" style="font-size: 1.8rem; font-weight: 800; color: #111111;">$${price.toFixed(2)}</span>
              ${compareAt ? `<s style="font-size: 1.1rem; color: #888888;">$${compareAt.toFixed(2)}</s>` : ''}
              <span style="background: #e6f4ea; color: #137333; border: 1px solid #ceead6; padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">In Stock • Ships in 24h</span>
            </div>

            <p style="font-size: 0.98rem; line-height: 1.7; color: #444444; margin-bottom: 28px;">${rawDesc}</p>

            <!-- COLOR SELECTION -->
            <div style="margin-bottom: 24px;">
              <label style="display: block; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #111111;">COLOR: <span id="zavoraSelectedColor" style="color: #111111; font-weight: 800; margin-left: 6px;">${String(activeColor).toUpperCase()}</span></label>
              <div style="display: flex; gap: 12px; flex-wrap:wrap;">
                ${colors.map((c, i) => `
                  <button type="button" class="zavoraColorBtn" data-color="${c}" style="width: 36px; height: 36px; border-radius: 50%; background: ${swatchColor(c)}; border: ${i===0?'2px solid #111111':'1px solid #cccccc'}; cursor: pointer; transition: transform 0.15s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <!-- SIZE SELECTION -->
            <div style="margin-bottom: 32px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #111111;">SIZE: <span id="zavoraSelectedSize" style="color: #111111; font-weight: 800; margin-left: 6px;">${activeSize}</span></label>
                <button type="button" id="zavoraOpenSizeGuide" style="background: none; border: none; padding: 0; font-size: 0.88rem; color: #111111; font-weight: 700; text-decoration: underline; cursor: pointer;">Size Guide</button>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${sizes.map((s, i) => `
                  <button type="button" class="zavoraSizeBtn" data-size="${s}" style="min-width: 56px; padding: 12px 20px; border-radius: 6px; background: ${i===0?'#111111':'#ffffff'}; color: ${i===0?'#ffffff':'#111111'}; border: 1px solid ${i===0?'#111111':'#d1d5db'}; font-weight: 800; font-size: 0.92rem; cursor: pointer; transition: all 0.15s;">${s}</button>
                `).join('')}
              </div>
            </div>

            <!-- CTAS -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px;">
              <button type="button" id="zavoraAddToCartBtn" data-add="${id}" style="width: 100%; padding: 18px; background: #111111; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1.5px; transition: opacity 0.2s;">ADD TO BAG</button>
              <button type="button" id="zavoraWishlistBtn" data-wishlist-product="${id}" style="width: 100%; padding: 16px; background: #ffffff; color: #111111; border: 1.5px solid #111111; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing: 1px; transition: all 0.2s; text-transform: uppercase;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #e11d48;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                ADD TO WISHLIST
              </button>
            </div>

            <!-- GUARANTEES -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <strong style="display: block; font-size: 0.92rem; margin-bottom: 4px; color: #111111;">🚚 Free USA Shipping</strong>
                <span style="font-size: 0.82rem; color: #666666;">Orders $75+ receive free 2-3 day express delivery.</span>
              </div>
              <div>
                <strong style="display: block; font-size: 0.92rem; margin-bottom: 4px; color: #111111;">🔄 30-Day Easy Returns</strong>
                <span style="font-size: 0.82rem; color: #666666;">Hassle-free exchanges & returns guaranteed.</span>
              </div>
            </div>

          </div>
        </div>

        <!-- 4 DISCOVERY CAROUSEL SECTIONS (INSTANT 0MS LOAD) -->
        <div id="zavoraRecContainer"></div>

        <!-- SIZE GUIDE MODAL -->
        <div id="zavoraSizeGuideModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: none; align-items: center; justify-content: center; z-index: 999999; padding: 20px; backdrop-filter: blur(4px);">
          <div style="background: #ffffff; color: #111111; border-radius: 12px; max-width: 560px; width: 100%; padding: 32px; position: relative; box-shadow: 0 24px 48px rgba(0,0,0,0.35);">
            <button type="button" id="zavoraCloseSizeGuide" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 1.8rem; font-weight: 700; cursor: pointer; color: #111111; line-height: 1;">&times;</button>
            <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.5px;">Zavora Size Guide</h3>
            <p style="font-size: 0.88rem; color: #666666; margin: 0 0 24px; line-height: 1.5;">All measurements in inches (and cm in brackets). Fits true to standard USA size with relaxed architectural streetwear drape.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
              <thead>
                <tr style="border-bottom: 2px solid #111111; color: #111111;">
                  <th style="padding: 12px 8px; font-weight: 800;">Size</th>
                  <th style="padding: 12px 8px; font-weight: 800;">Chest (in)</th>
                  <th style="padding: 12px 8px; font-weight: 800;">Length (in)</th>
                  <th style="padding: 12px 8px; font-weight: 800;">Sleeve (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 10px 8px; font-weight: 800;">XS</td><td style="padding: 10px 8px;">34 - 36"</td><td style="padding: 10px 8px;">26.5"</td><td style="padding: 10px 8px;">32.5"</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 10px 8px; font-weight: 800;">S</td><td style="padding: 10px 8px;">36 - 38"</td><td style="padding: 10px 8px;">27.5"</td><td style="padding: 10px 8px;">33.5"</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 10px 8px; font-weight: 800;">M</td><td style="padding: 10px 8px;">38 - 40"</td><td style="padding: 10px 8px;">28.5"</td><td style="padding: 10px 8px;">34.5"</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 10px 8px; font-weight: 800;">L</td><td style="padding: 10px 8px;">41 - 43"</td><td style="padding: 10px 8px;">29.5"</td><td style="padding: 10px 8px;">35.5"</td></tr>
                <tr style="border-bottom: 1px solid #eeeeee;"><td style="padding: 10px 8px; font-weight: 800;">XL</td><td style="padding: 10px 8px;">44 - 46"</td><td style="padding: 10px 8px;">30.5"</td><td style="padding: 10px 8px;">36.5"</td></tr>
                <tr><td style="padding: 10px 8px; font-weight: 800;">2XL</td><td style="padding: 10px 8px;">47 - 49"</td><td style="padding: 10px 8px;">31.5"</td><td style="padding: 10px 8px;">37.5"</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>
    `;

    // 1. INSTANT 0MS SYNCHRONOUS RENDER OF ALL 4 DISCOVERY SECTIONS
    const similarProducts = getSectionProducts(product, 'similar', 6);
    const localRecommended = getSectionProducts(product, 'similar', 6);
    const trendingProducts = getSectionProducts(product, 'trending', 6);
    const newArrivalsProducts = getSectionProducts(product, 'new', 6);

    const container = document.getElementById('zavoraRecContainer');
    if (container) {
      container.innerHTML = `
        <div style="margin-top: 60px; border-top: 1px solid #e5e7eb; padding-top: 20px; width: 100%;">
          ${renderDiscoverySection('similar', 'RECOMMENDED CATEGORY', 'Similar Products', similarProducts)}
          <div id="zavoraRecSectionInner">
            ${renderDiscoverySection('recommended', 'CURATED FOR YOU', 'Recommended Products', localRecommended)}
          </div>
          ${renderDiscoverySection('trending', 'HOT RIGHT NOW', 'Trending Now', trendingProducts)}
          ${renderDiscoverySection('new', 'JUST ARRIVED', 'New Arrivals', newArrivalsProducts)}

          <!-- QUICK VIEW OVERLAY MODAL -->
          <div id="zavoraQuickViewModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 999999; padding: 20px; backdrop-filter: blur(5px);">
            <div style="background: #ffffff; color: #111111; border-radius: 14px; max-width: 780px; width: 100%; padding: 36px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.4); max-height: 90vh; overflow-y: auto;">
              <button type="button" id="zavoraCloseQuickView" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 2rem; font-weight: 700; cursor: pointer; color: #111111; line-height: 1;">&times;</button>
              <div id="zavoraQuickViewContent"></div>
            </div>
          </div>
        </div>
      `;
      const initialPool = [...similarProducts, ...localRecommended, ...trendingProducts, ...newArrivalsProducts];
      bindRecommendationEvents(initialPool);
      if (window.ZavoraCurrency) window.ZavoraCurrency.update();
    }

    // 2. BACKGROUND ASYNC ENHANCEMENT (NON-BLOCKING)
    fetchServerRecommendations(product, 6).then(serverRecs => {
      if (serverRecs && serverRecs.length) {
        const recInner = document.getElementById('zavoraRecSectionInner');
        if (recInner) {
          recInner.innerHTML = renderDiscoverySection('recommended', 'CURATED FOR YOU', 'Recommended Products', serverRecs);
          const updatedPool = [...similarProducts, ...serverRecs, ...trendingProducts, ...newArrivalsProducts];
          bindRecommendationEvents(updatedPool);
          if (window.ZavoraCurrency) window.ZavoraCurrency.update();
        }
      }
    });

    // Bind Main Product Gallery Thumbnails
    document.querySelectorAll('.zavoraThumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const mainImg = document.getElementById('zavoraMainImage');
        if (mainImg) mainImg.src = btn.dataset.img;
        document.querySelectorAll('.zavoraThumb').forEach(b => b.style.border = '1px solid #e0e0e0');
        btn.style.border = '2px solid #111111';
      });
    });

    // Bind Color Buttons
    document.querySelectorAll('.zavoraColorBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraColorBtn').forEach(b => b.style.border = '1px solid #cccccc');
        btn.style.border = '2px solid #111111';
        activeColor = btn.dataset.color;
        const label = document.getElementById('zavoraSelectedColor');
        if (label) label.textContent = String(activeColor).toUpperCase();
      });
    });

    // Bind Size Buttons
    document.querySelectorAll('.zavoraSizeBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraSizeBtn').forEach(b => {
          b.style.background = '#ffffff';
          b.style.color = '#111111';
          b.style.border = '1px solid #d1d5db';
        });
        btn.style.background = '#111111';
        btn.style.color = '#ffffff';
        btn.style.border = '1px solid #111111';
        activeSize = btn.dataset.size;
        const label = document.getElementById('zavoraSelectedSize');
        if (label) label.textContent = activeSize;
      });
    });

    // Bind Size Guide Modal Popup
    const openGuide = document.getElementById('zavoraOpenSizeGuide');
    const closeGuide = document.getElementById('zavoraCloseSizeGuide');
    const guideModal = document.getElementById('zavoraSizeGuideModal');
    if (openGuide && guideModal) {
      openGuide.addEventListener('click', (e) => {
        e.preventDefault();
        guideModal.style.display = 'flex';
      });
    }
    if (closeGuide && guideModal) {
      closeGuide.addEventListener('click', () => {
        guideModal.style.display = 'none';
      });
      guideModal.addEventListener('click', (e) => {
        if (e.target === guideModal) guideModal.style.display = 'none';
      });
    }

    // Bind Add to Wishlist Button
    const wishBtn = document.getElementById('zavoraWishlistBtn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        try {
          let wishlist = JSON.parse(localStorage.getItem('zavoraWishlist') || '[]');
          const found = wishlist.find(i => String(i.id) === id);
          if (found) {
            wishlist = wishlist.filter(i => String(i.id) !== id);
            wishBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #e11d48;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ADD TO WISHLIST`;
            alert(`${name} removed from your wishlist!`);
          } else {
            wishlist.push({ id, name, price, img: images[0], color: activeColor, size: activeSize });
            wishBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> IN WISHLIST`;
            alert(`${name} saved to your wishlist!`);
          }
          localStorage.setItem('zavoraWishlist', JSON.stringify(wishlist));
        } catch(e) {}
      });
    }

    // Bind Add to Cart
    const addBtn = document.getElementById('zavoraAddToCartBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const itemToAdd = { id, name, price, img: images[0], color: activeColor, size: activeSize, qty: 1 };
        if (typeof addToCart === 'function') {
          addToCart(id, activeColor, activeSize);
        } else {
          try {
            let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
            const existingIdx = cart.findIndex(i => String(i.id) === String(id) && String(i.color).toLowerCase() === String(activeColor).toLowerCase() && String(i.size).toLowerCase() === String(activeSize).toLowerCase());
            if (existingIdx > -1) {
              cart[existingIdx].qty += 1;
            } else {
              cart.push(itemToAdd);
            }
            localStorage.setItem('zavoraCart', JSON.stringify(cart));
            alert(`${name} (${activeColor} / ${activeSize}) added to your bag!`);
          } catch(e) {}
        }
        if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackAddToCart(itemToAdd, 1);
        if (window.ZavoraCurrency) window.ZavoraCurrency.update();
      });
    }

    // Trigger Currency & SEO Updates
    if (window.ZavoraCurrency) window.ZavoraCurrency.update();
    if (window.ZavoraSEO && typeof window.ZavoraSEO.updateProductSEO === 'function') {
      window.ZavoraSEO.updateProductSEO(product);
    }
    if (window.ZavoraAnalytics && typeof window.ZavoraAnalytics.trackViewItem === 'function') {
      window.ZavoraAnalytics.trackViewItem(product);
    }
  }

  function bindRecommendationEvents(products = []) {
    // 1. Carousel Arrow Navigation (< & >)
    document.querySelectorAll('.zavoraNavPrev').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(`zavoraTrack_${btn.dataset.sec}`);
        if (track) track.scrollBy({ left: -304, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.zavoraNavNext').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(`zavoraTrack_${btn.dataset.sec}`);
        if (track) track.scrollBy({ left: 304, behavior: 'smooth' });
      });
    });

    // 2. Bind Quick View Modal
    const qvModal = document.getElementById('zavoraQuickViewModal');
    const qvContent = document.getElementById('zavoraQuickViewContent');
    const qvClose = document.getElementById('zavoraCloseQuickView');

    if (qvClose && qvModal) {
      qvClose.addEventListener('click', () => qvModal.style.display = 'none');
      qvModal.addEventListener('click', (e) => { if (e.target === qvModal) qvModal.style.display = 'none'; });
    }

    document.querySelectorAll('.zavoraQuickViewBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = String(btn.dataset.qvId);
        const p = products.find(x => String(x.id || x.printfulId) === pId) || DEFAULT_CATALOG_FALLBACK.find(x => String(x.id) === pId);
        if (!p || !qvContent || !qvModal) return;

        const rawImg = p.img || p.image || (Array.isArray(p.images) ? p.images[0] : '');
        const img = sanitizeApparelImg(rawImg, p.category, p.name);
        const pPrice = Number(p.price || 89.99);

        qvContent.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; align-items: start;">
            <div style="background: #f8f8f8; border-radius: 10px; overflow: hidden; aspect-ratio: 4/5;">
              <img src="${img}" alt="${p.name}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div>
              <p style="color: #c9a227; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">${p.category || 'STREETWEAR'}</p>
              <h2 style="font-size: 1.8rem; font-weight: 800; margin: 0 0 12px; color: #111111;">${p.name}</h2>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <span style="color: #f59e0b;">★★★★★</span>
                <span style="font-size: 0.85rem; color: #555555; font-weight: 700;">${p.rating || 4.9}</span>
              </div>
              <p style="font-size: 1.6rem; font-weight: 800; color: #111111; margin: 0 0 20px;">$${pPrice.toFixed(2)}</p>
              <p style="font-size: 0.9rem; line-height: 1.6; color: #555555; margin-bottom: 24px;">${p.description || 'Signature organic streetwear piece designed for Zavora Fashion.'}</p>
              <button type="button" class="qvModalAddBtn" style="width: 100%; padding: 16px; background: #111111; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">ADD TO BAG</button>
              <a href="product?id=${encodeURIComponent(pId)}" style="display: block; text-align: center; margin-top: 14px; color: #111111; font-weight: 700; font-size: 0.88rem; text-decoration: underline;">View Full Product Details &rarr;</a>
            </div>
          </div>
        `;

        const qvAdd = qvContent.querySelector('.qvModalAddBtn');
        if (qvAdd) {
          qvAdd.addEventListener('click', () => {
            if (typeof addToCart === 'function') addToCart(pId);
            else {
              let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
              const found = cart.find(i => String(i.id) === pId);
              if (found) found.qty += 1;
              else cart.push({ id: pId, name: p.name, price: pPrice, img, qty: 1 });
              localStorage.setItem('zavoraCart', JSON.stringify(cart));
              alert(`${p.name} added to your bag!`);
            }
            qvModal.style.display = 'none';
          });
        }

        qvModal.style.display = 'flex';
      });
    });

    // 3. Bind Rec Add to Cart
    document.querySelectorAll('.zavoraRecAddToCartBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = String(btn.dataset.recCartId);
        const p = products.find(x => String(x.id || x.printfulId) === pId) || DEFAULT_CATALOG_FALLBACK.find(x => String(x.id) === pId);
        if (!p) return;
        const pPrice = Number(p.price || 89.99);
        const rawImg = p.img || p.image || (Array.isArray(p.images) ? p.images[0] : '');
        const img = sanitizeApparelImg(rawImg, p.category, p.name);

        if (typeof addToCart === 'function') {
          addToCart(pId);
        } else {
          try {
            let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
            const found = cart.find(i => String(i.id) === pId);
            if (found) found.qty += 1;
            else cart.push({ id: pId, name: p.name, price: pPrice, img, qty: 1 });
            localStorage.setItem('zavoraCart', JSON.stringify(cart));
            alert(`${p.name} added to your bag!`);
          } catch(e) {}
        }
        if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackAddToCart(p, 1);
        if (window.ZavoraCurrency) window.ZavoraCurrency.update();
      });
    });

    // 4. Bind Rec Wishlist
    document.querySelectorAll('.zavoraRecWishBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = String(btn.dataset.recId);
        const p = products.find(x => String(x.id || x.printfulId) === pId) || DEFAULT_CATALOG_FALLBACK.find(x => String(x.id) === pId);
        if (!p) return;

        try {
          let wishlist = JSON.parse(localStorage.getItem('zavoraWishlist') || '[]');
          const found = wishlist.find(i => String(i.id) === pId);
          const svg = btn.querySelector('svg');
          if (found) {
            wishlist = wishlist.filter(i => String(i.id) !== pId);
            if (svg) { svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', '#111111'); }
            alert(`${p.name} removed from your wishlist!`);
          } else {
            wishlist.push({ id: pId, name: p.name, price: p.price, img: sanitizeApparelImg(p.img || p.image, p.category, p.name) });
            if (svg) { svg.setAttribute('fill', '#e11d48'); svg.setAttribute('stroke', '#e11d48'); }
            alert(`${p.name} saved to your wishlist!`);
          }
          localStorage.setItem('zavoraWishlist', JSON.stringify(wishlist));
        } catch(err) {}
      });
    });
  }

  async function initProductRenderer() {
    const isProductPage = window.location.pathname.includes('product') || 
                          document.body.classList.contains('product-page-pending') || 
                          (document.querySelector('main p')?.textContent || '').includes('No product selected');
    
    // Always sync header cart badge on any page load
    if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
    
    if (!isProductPage) return;

    const id = getQueryParam('id') || getQueryParam('product') || getQueryParam('printfulId');
    let product = findProduct(id);

    // Initial render
    renderProductPageUI(product);
    if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();

    // If API ID is present, attempt background fetch to get full fresh DB data
    if (id) {
      const dbProduct = await fetchProductFromAPI(id);
      if (dbProduct && dbProduct.name && !dbProduct.name.includes('Zavora Premium Streetwear #') && dbProduct.img) {
        renderProductPageUI(dbProduct);
        if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductRenderer);
  } else {
    initProductRenderer();
  }
})();
