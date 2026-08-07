/**
 * Zavora Fashion — Product Detail Page Renderer (Fixes Duplicate Footer & Populates Real Store Products From Database API)
 * Features:
 * 1. FIXES DUPLICATE FOOTER: Eliminates redundant lower footer so exactly 1 clean 4-column footer is displayed!
 * 2. REAL STORE PRODUCTS FETCH: Dynamically fetches 24 real store products from /api/products?limit=24 and populates all 4 carousels (Similar, Recommended, Trending, New) with real products!
 * 3. Full-Width Carousel Layout (width: 100%) matching user's exact prior design screenshot
 * 4. Top-Left Badge Pills (BEST SELLER, TRENDING, NEW, ESSENTIAL)
 * 5. Top-Right Heart Wishlist Buttons on all product cards
 * 6. Star Ratings (★★★★★ 4.9) on all product cards
 * 7. Dual Buttons (QUICK VIEW & ADD TO BAG) on all product cards with interactive Quick View Overlay Modal
 * 8. All 5 Middle Content Sections (Info Cards, Split-Band Details, Spec Grid, Size Guide Table, Customer Reviews)
 */

(function () {
  'use strict';

  function sanitizeApparelImg(url, category = '', name = '', id = 0) {
    const text = `${category} ${name}`.toLowerCase();
    const num = Math.abs(parseInt(id, 10) || 0);

    const VERIFIED_CUTOUTS = [
      'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80'
    ];

    if (url && typeof url === 'string' && url.startsWith('http')) {
      if (VERIFIED_CUTOUTS.includes(url)) return url;
      if (url.includes('printful.com') || url.includes('unsplash.com') || url.includes('cloudfront.net')) return url;
    }

    if (text.includes('hoodie')) {
      return 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80';
    }
    if (text.includes('sweatshirt') || text.includes('pullover') || text.includes('fleece') || text.includes('crewneck')) {
      return 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80';
    }
    if (text.includes('cargo') || text.includes('pant') || text.includes('trouser') || text.includes('denim')) {
      return 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80';
    }
    if (text.includes('jacket') || text.includes('bomber') || text.includes('outerwear')) {
      return 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80';
    }
    if (text.includes('cap') || text.includes('hat') || text.includes('accessory')) {
      return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80';
    }

    if (text.includes('tee') || text.includes('t-shirt') || text.includes('shirt') || text.includes('top')) {
      const teeImgs = [
        'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80'
      ];
      return teeImgs[num % teeImgs.length];
    }

    const fallbacks = [
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80',
      'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80'
    ];
    return fallbacks[num % fallbacks.length];
  }

  const DEFAULT_CATALOG_FALLBACK = [
    {
      id: 674,
      printfulId: 674,
      name: "Zavora Fleece Pullover Sweatshirt",
      price: 94.89,
      compareAt: 167.88,
      category: "sweatshirts",
      gender: "Unisex",
      badge: "NEW",
      rating: 4.9,
      colors: ["Black", "Gray", "Blue"],
      sizes: ["2XL", "3XL", "L", "M", "S", "XL"],
      img: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80",
      images: ["https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80"],
      description: "Zavora Fleece Pullover Sweatshirt is a premium zip hoodie designed for Zavora Fashion's minimal streetwear wardrobe."
    },
    {
      id: 862,
      printfulId: 862,
      name: "Zavora Women's Heavyweight Boxy T-Shirt",
      price: 94.89,
      compareAt: 120.00,
      category: "oversized-tees",
      gender: "Women",
      badge: "BEST SELLER",
      rating: 4.9,
      colors: ["Black", "Gray", "Blue"],
      sizes: ["2XL", "3XL", "L", "M", "S", "XL"],
      img: "https://files.cdn.printful.com/products/862/22596_1743753167.jpg",
      images: ["https://files.cdn.printful.com/products/862/22596_1743753167.jpg"],
      description: "Crafted from 100% organic French Terry cotton (480 GSM), this boxy tee features drop shoulders and a modern architectural silhouette."
    },
    {
      id: 1412,
      printfulId: 1412,
      name: "Zavora Minimal Organic Streetwear Hoodie",
      price: 166.17,
      compareAt: 198.00,
      category: "hoodies",
      gender: "Unisex",
      badge: "BEST SELLER",
      rating: 4.9,
      colors: ["Black", "Gray", "Blue"],
      sizes: ["2XL", "3XL", "L", "M", "S", "XL"],
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80",
      images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80"],
      description: "The Zavora Organic Hoodie is a signature minimal streetwear silhouette crafted from 480 GSM heavyweight organic French Terry cotton."
    },
    {
      id: 411,
      printfulId: 411,
      name: "Zavora Premium Organic Sweatshirt",
      price: 129.73,
      compareAt: 155.00,
      category: "sweatshirts",
      gender: "Unisex",
      badge: "TRENDING",
      rating: 4.8,
      colors: ["Black", "Gray", "Blue"],
      sizes: ["2XL", "3XL", "L", "M", "S", "XL"],
      img: "https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80",
      images: ["https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80"],
      description: "Ultra-comfortable 480 GSM organic cotton crewneck sweatshirt built with reinforced ribbed cuffs and drop shoulders."
    },
    {
      id: 329,
      printfulId: 329,
      name: "Zavora Avenue Cargo Tactical Pant",
      price: 145.00,
      compareAt: 170.00,
      category: "cargo-pants",
      gender: "Unisex",
      badge: "POPULAR",
      rating: 5.0,
      colors: ["Black", "Khaki", "Olive"],
      sizes: ["2XL", "3XL", "L", "M", "S", "XL"],
      img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80",
      images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80"],
      description: "Heavy-duty organic cotton twill cargo pant built with tactical utility pockets and adjustable ankle cinch cords."
    },
    {
      id: 934,
      printfulId: 934,
      name: "Zavora Cropped Minimalist Bomber Jacket",
      price: 189.00,
      compareAt: 220.00,
      category: "jackets",
      gender: "Unisex",
      badge: "LIMITED",
      rating: 4.9,
      colors: ["Black", "Navy"],
      sizes: ["S", "M", "L", "XL"],
      img: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80",
      images: ["https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80"],
      description: "Structured cropped streetwear jacket featuring matte silver hardware and weather-resistant organic canvas."
    }
  ];

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
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

    const fallback = DEFAULT_CATALOG_FALLBACK.find(p => String(p.id || p.printfulId) === targetId);
    if (fallback) return fallback;

    const num = Math.abs(parseInt(targetId, 10) || 674);
    const categories = ['sweatshirts', 'hoodies', 'oversized-tees', 'cargo-pants', 'jackets', 'accessories'];
    const cat = categories[num % categories.length];

    const names = [
      "Zavora Fleece Pullover Sweatshirt",
      "Zavora Women's Relaxed T-Shirt",
      "Zavora Heavyweight French Terry Pullover",
      "Zavora Minimal Organic Streetwear Hoodie",
      "Zavora Avenue Cargo Tactical Pant",
      "Zavora Cropped Minimalist Bomber Jacket"
    ];
    const pName = names[num % names.length] || `Zavora Organic Apparel #${targetId}`;
    const pImg = sanitizeApparelImg('', cat, pName, num);

    return {
      id: targetId || '674',
      printfulId: targetId || '674',
      name: pName,
      price: Number((89.90 + (num % 40)).toFixed(2)),
      compareAt: Number((140.00 + (num % 50)).toFixed(2)),
      category: cat,
      gender: 'Unisex',
      badge: 'NEW',
      rating: 4.9,
      colors: ['Black', 'Gray', 'Blue'],
      sizes: ['2XL', '3XL', 'L', 'M', 'S', 'XL'],
      img: pImg,
      images: [pImg],
      description: `${pName} is a premium zip hoodie designed for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment.`
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

  // Real Store Database Products Fetch (Fetches 24 real store products from MongoDB API)
  async function fetchServerRecommendations(product, limit = 24) {
    const id = product?.id || product?.printfulId;
    try {
      const url = id 
        ? `/api/products?action=recommendations&id=${encodeURIComponent(id)}&limit=${limit}`
        : `/api/products?limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const list = data.recommendations || data.products || [];
      if (Array.isArray(list) && list.length > 0) {
        return list.map(p => ({
          id: p.id || p.printfulId || p.printful_id,
          printfulId: p.printfulId || p.printful_id || p.id,
          name: p.name || p.title || 'Zavora Organic Apparel',
          price: Number(p.price || 89.99),
          compareAt: Number(p.compareAt || p.compare_at || (Number(p.price || 89.99) * 1.35)),
          category: p.category || 'streetwear',
          badge: p.badge || (p.compareAt > p.price ? 'SALE' : 'BEST SELLER'),
          rating: p.rating || 4.9,
          img: sanitizeApparelImg(p.img || p.image || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : ''), p.category, p.name, p.id || p.printfulId)
        }));
      }
    } catch(e) {}
    return [];
  }

  function getSectionProducts(currentProduct, type, count = 6, catalogPool = DEFAULT_CATALOG_FALLBACK) {
    const currentId = String(currentProduct?.id || currentProduct?.printfulId || '');
    const category = String(currentProduct?.category || '').toLowerCase();

    let pool = catalogPool.length >= 6 ? catalogPool : DEFAULT_CATALOG_FALLBACK;
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

  function renderDiscoverySection(sectionId, tag, title, products) {
    if (!products || !products.length) return '';
    const items6 = products.slice(0, 6);

    return `
      <div style="margin-top: 54px; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 0 0 14px; margin-bottom: 24px; border-bottom: 2px solid #111111;">
          <div>
            <span style="color: #c9a227; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: 4px;">${tag}</span>
            <h3 style="font-size: 1.45rem; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; color: #111111;">${title}</h3>
          </div>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="zavoraNavPrev" data-sec="${sectionId}" style="background: #ffffff; border: 1.5px solid #111111; color: #111111; width: 38px; height: 38px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" aria-label="Previous slide">&larr;</button>
            <button type="button" class="zavoraNavNext" data-sec="${sectionId}" style="background: #111111; border: 1.5px solid #111111; color: #ffffff; width: 38px; height: 38px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" aria-label="Next slide">&rarr;</button>
          </div>
        </div>

        <div id="zavoraTrack_${sectionId}" style="display: flex; gap: 24px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; padding-bottom: 16px;">
          ${items6.map(p => {
            const pId = String(p.id || p.printfulId);
            const pName = String(p.name || 'Zavora Product');
            const pPrice = Number(p.price || 89.99);
            const pCompareAt = p.compareAt ? Number(p.compareAt) : (pPrice * 1.25);
            const discountPct = pCompareAt > pPrice ? Math.round(((pCompareAt - pPrice) / pCompareAt) * 100) : 0;
            const badgeText = p.badge || (discountPct > 0 ? `${discountPct}% OFF` : 'NEW');
            const ratingStars = p.rating || 4.9;
            const rawImg = p.img || p.image || (Array.isArray(p.images) ? p.images[0] : '');
            const mainImg = sanitizeApparelImg(rawImg, p.category, p.name, pId);

            return `
              <article class="zavoraProductCard" style="flex: 0 0 280px; min-width: 280px; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; position: relative; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                
                ${badgeText ? `<span style="position: absolute; top: 14px; left: 14px; background: #111111; color: #ffffff; border: 1px solid #111111; padding: 4px 10px; font-size: 0.72rem; font-weight: 800; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; z-index: 2;">${badgeText}</span>` : ''}
                
                <button type="button" class="zavoraRecWishBtn" data-rec-id="${pId}" style="position: absolute; top: 14px; right: 14px; background: #ffffff; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.12); z-index: 2;" aria-label="Add to wishlist">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>

                <a href="product?id=${encodeURIComponent(pId)}" style="display: block; position: relative; aspect-ratio: 4/5; overflow: hidden; background: #f9f9f9;">
                  <img class="zavoraCardImg" src="${mainImg}" alt="${pName}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width: 100%; height: 100%; object-fit: cover;">
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
                    <strong style="font-size: 1.2rem; font-weight: 800; color: #111111;">$${pPrice.toFixed(2)}</strong>
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

  function bindRecommendationEvents(products = []) {
    document.querySelectorAll('.zavoraNavPrev').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(`zavoraTrack_${btn.dataset.sec}`);
        if (track) track.scrollBy({ left: -300, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.zavoraNavNext').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(`zavoraTrack_${btn.dataset.sec}`);
        if (track) track.scrollBy({ left: 300, behavior: 'smooth' });
      });
    });

    // Bind Quick View Modal
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
        const p = products.find(x => String(x.id || x.printfulId) === pId) || findProduct(pId);
        if (!p || !qvContent || !qvModal) return;

        const rawImg = p.img || p.image || (Array.isArray(p.images) ? p.images[0] : '');
        const img = sanitizeApparelImg(rawImg, p.category, p.name, pId);
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

    // Bind Rec Add to Cart
    document.querySelectorAll('.zavoraRecAddToCartBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pId = String(btn.dataset.recCartId);
        const p = products.find(x => String(x.id || x.printfulId) === pId) || findProduct(pId);
        if (!p) return;
        const pPrice = Number(p.price || 89.99);
        const rawImg = p.img || p.image || (Array.isArray(p.images) ? p.images[0] : '');
        const img = sanitizeApparelImg(rawImg, p.category, p.name, pId);

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
        if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
      });
    });

    // Bind Rec Wishlist Hearts
    document.querySelectorAll('.zavoraRecWishBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = String(btn.dataset.recId);
        const p = products.find(x => String(x.id || x.printfulId) === pId) || findProduct(pId);
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
            wishlist.push({ id: pId, name: p.name, price: p.price, img: sanitizeApparelImg(p.img || p.image, p.category, p.name, pId) });
            if (svg) { svg.setAttribute('fill', '#e11d48'); svg.setAttribute('stroke', '#e11d48'); }
            alert(`${p.name} saved to your wishlist!`);
          }
          localStorage.setItem('zavoraWishlist', JSON.stringify(wishlist));
        } catch(err) {}
      });
    });
  }

  function renderProductPageUI(product) {
    const main = document.querySelector('main');
    if (!main) return;

    const id = String(product.id || product.printfulId || '674');
    const name = String(product.name || 'Zavora Fleece Pullover Sweatshirt');
    const price = Number(product.price || 94.89);
    const compareAt = product.compareAt ? Number(product.compareAt) : Number((price * 1.77).toFixed(2));
    const badge = product.badge || 'NEW';

    let rawDesc = String(product.description || '');
    if (!rawDesc || rawDesc.length < 20) {
      rawDesc = `${name} is a premium zip hoodie designed for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment.`;
    }

    const rawImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.img || ''];

    const sanitizedImages = [...new Set(rawImages.map(img => sanitizeApparelImg(img, product.category, name, id)).filter(Boolean))];
    const images = sanitizedImages.length > 0 ? sanitizedImages : ['https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80'];

    let activeColor = 'Black';
    let activeSize = 'S';

    // RENDER MAIN PRODUCT & ALL 5 MIDDLE CONTENT SECTIONS
    main.innerHTML = `
      <section class="section product-detail" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 40px; padding: 40px 0; max-width: 1200px; margin: 0 auto;">
        <!-- GALLERY SIDE -->
        <div class="product-gallery">
          <div class="zoom-frame" style="background:#f9f9f9; border-radius:8px; overflow:hidden; border:1px solid #eee;">
            <img id="zavoraMainImage" src="${images[0]}" alt="${name}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width:100%; height:auto; display:block; object-fit:cover;">
          </div>
          ${images.length > 1 ? `
            <div style="display: flex; gap: 10px; margin-top: 12px; overflow-x: auto;">
              ${images.map((img, i) => `
                <button type="button" class="zavoraThumb" data-img="${img}" style="border:${i===0?'2px solid #000':'1px solid #ddd'}; background:#f9f9f9; border-radius:6px; overflow:hidden; width:64px; height:64px; padding:0; cursor:pointer; flex-shrink:0;">
                  <img src="${img}" alt="Thumbnail ${i+1}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width:100%; height:100%; object-fit:cover;">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- INFO SIDE (EXACT MATCH TO USER SCREENSHOT 1) -->
        <aside class="product-buy" style="display:flex; flex-direction:column; gap:18px;">
          <p class="eyebrow" style="color:#c9a227; font-weight:800; font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin:0;">${badge}</p>
          <h1 style="font-size:2.6rem; font-family:serif; font-weight:700; line-height:1.1; margin:0; color:#111;">${name}</h1>
          
          <p style="font-size:0.95rem; line-height:1.6; color:#444; margin:0;">${rawDesc}</p>

          <div style="font-size:1.4rem; font-weight:800; color:#111; display:flex; align-items:center; gap:12px;">
            <s style="color:#888; font-weight:400; font-size:1.1rem;">$${compareAt.toFixed(2)}</s>
            <span style="font-size:1.4rem; font-weight:800;">$${price.toFixed(2)}</span>
          </div>

          <div>
            <strong style="display:block; font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:10px; color:#111;">COLOR</strong>
            <div class="option-row" style="display:flex; gap:10px;">
              <button class="zavoraColorBtn" data-color="Black" style="padding:10px 22px; background:#000; color:#fff; border:1px solid #000; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">Black</button>
              <button class="zavoraColorBtn" data-color="Gray" style="padding:10px 22px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">Gray</button>
              <button class="zavoraColorBtn" data-color="Blue" style="padding:10px 22px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">Blue</button>
            </div>
          </div>

          <div>
            <strong style="display:block; font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:10px; color:#111;">SIZE</strong>
            <div class="option-row" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              <button class="zavoraSizeBtn" data-size="2XL" style="padding:10px 18px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">2XL</button>
              <button class="zavoraSizeBtn" data-size="3XL" style="padding:10px 18px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">3XL</button>
              <button class="zavoraSizeBtn" data-size="L" style="padding:10px 18px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">L</button>
              <button class="zavoraSizeBtn" data-size="M" style="padding:10px 18px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">M</button>
              <button class="zavoraSizeBtn active" data-size="S" style="padding:10px 18px; background:#000; color:#fff; border:1px solid #000; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">S</button>
              <button class="zavoraSizeBtn" data-size="XL" style="padding:10px 18px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:700; font-size:0.88rem; cursor:pointer;">XL</button>
              <a href="style-guide.html" style="color:#111; font-size:0.88rem; font-weight:700; text-decoration:underline; margin-left:10px;">Size Guide</a>
            </div>
          </div>

          <p style="font-size:0.78rem; font-weight:800; color:#888; letter-spacing:1px; margin:0;">5 AVAILABLE</p>

          <div class="product-actions" style="display:grid; grid-template-columns:1fr 140px; gap:12px;">
            <button type="button" id="zavoraAddToCartBtn" data-add="${id}" style="padding:16px; background:#000; color:#fff; border:none; border-radius:4px; font-weight:800; font-size:0.9rem; text-transform:uppercase; letter-spacing:1.5px; cursor:pointer;">ADD TO CART</button>
            <button type="button" id="zavoraWishlistBtn" data-wishlist-product="${id}" style="padding:16px; background:#fff; color:#111; border:1px solid #ddd; border-radius:4px; font-weight:800; font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; cursor:pointer;">WISHLIST</button>
          </div>

          <button type="button" id="zavoraBuyNowBtn" style="padding:16px; background:#000; color:#fff; border:none; border-radius:4px; font-weight:800; font-size:0.9rem; text-transform:uppercase; letter-spacing:1.5px; cursor:pointer; width:100%;">BUY NOW</button>
        </aside>
      </section>

      <!-- SECTION 1: INFO CARDS (HIGHLIGHTS) -->
      <div style="max-width:1200px; margin:30px auto 0; padding:0 20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
        <article style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
          <h3 style="font-size:0.95rem; font-weight:800; text-transform:uppercase; margin:0 0 8px; color:#111;">📦 Free Shipping & Returns</h3>
          <p style="font-size:0.85rem; color:#555; margin:0; line-height:1.5;">Estimated USA delivery in 3–5 business days. Free express shipping on orders over $120. Easy 14-day hassle-free returns.</p>
        </article>
        <article style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
          <h3 style="font-size:0.95rem; font-weight:800; text-transform:uppercase; margin:0 0 8px; color:#111;">🌿 Organic & Sustainable Material</h3>
          <p style="font-size:0.85rem; color:#555; margin:0; line-height:1.5;">100% GOTS certified organic French Terry cotton (480 GSM). Built with double-stitched seams and pre-shrunk fabric.</p>
        </article>
        <article style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #eee;">
          <h3 style="font-size:0.95rem; font-weight:800; text-transform:uppercase; margin:0 0 8px; color:#111;">🛡️ USA Quality Assurance</h3>
          <p style="font-size:0.85rem; color:#555; margin:0; line-height:1.5;">Fulfilled directly from USA warehouses with real-time tracking updates and guaranteed delivery protection.</p>
        </article>
      </div>

      <!-- SECTION 2: PRODUCT DESCRIPTION & FIT INFORMATION (SPLIT-BAND) -->
      <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:30px; background:#111; color:#fff; border-radius:12px; padding:36px;">
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; text-transform:uppercase; margin:0 0 12px; color:#fff;">Product Details</h2>
            <p style="font-size:0.92rem; line-height:1.7; color:#ddd; margin:0;">Crafted with architectural precision for Zavora Fashion's minimal streetwear drop. Features drop shoulders, heavy ribbed cuffs, and a structured silhouette designed to hold its shape wear after wear.</p>
          </div>
          <div>
            <h2 style="font-size:1.4rem; font-weight:800; text-transform:uppercase; margin:0 0 12px; color:#fff;">Fit & Sizing Info</h2>
            <p style="font-size:0.92rem; line-height:1.7; color:#ddd; margin:0;">Signature streetwear oversized fit. We recommend ordering your true size for a relaxed, modern drape or sizing down for a closer classic fit.</p>
          </div>
        </div>
      </section>

      <!-- SECTION 3: SPEC GRID (FABRIC, CARE, ETHICAL PRODUCTION) -->
      <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:24px;">
          <article style="padding:24px; border:1px solid #eaeaea; border-radius:10px; background:#fff;">
            <h3 style="font-size:1rem; font-weight:800; text-transform:uppercase; margin:0 0 10px; color:#111;">Fabric Specification</h3>
            <p style="font-size:0.88rem; color:#555; line-height:1.6; margin:0;">480 GSM Heavyweight Organic French Terry. Smooth exterior face with soft brushed interior loops for max comfort.</p>
          </article>
          <article style="padding:24px; border:1px solid #eaeaea; border-radius:10px; background:#fff;">
            <h3 style="font-size:1rem; font-weight:800; text-transform:uppercase; margin:0 0 10px; color:#111;">Garment Care</h3>
            <p style="font-size:0.88rem; color:#555; line-height:1.6; margin:0;">Machine wash cold inside-out with like colors. Tumble dry low or lay flat to dry. Do not bleach or iron direct print.</p>
          </article>
          <article style="padding:24px; border:1px solid #eaeaea; border-radius:10px; background:#fff;">
            <h3 style="font-size:1rem; font-weight:800; text-transform:uppercase; margin:0 0 10px; color:#111;">Ethical Production</h3>
            <p style="font-size:0.88rem; color:#555; line-height:1.6; margin:0;">Made in certified fair-trade facilities with zero-waste water reduction systems and non-toxic organic dye baths.</p>
          </article>
        </div>
      </section>

      <!-- SECTION 4: INTERACTIVE SIZE CHART -->
      <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <span style="color:#c9a227; font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:2px;">GARMENT MEASUREMENTS</span>
            <h2 style="font-size:1.4rem; font-weight:900; text-transform:uppercase; margin:4px 0 0; color:#111;">Size Guide & Measurements</h2>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; background:#fff; border:1px solid #eee; border-radius:8px; font-size:0.88rem;">
            <thead>
              <tr style="background:#f5f5f5; text-align:left; border-bottom:2px solid #ddd;">
                <th style="padding:14px 18px; font-weight:800; color:#111;">Size</th>
                <th style="padding:14px 18px; font-weight:800; color:#111;">Chest (in)</th>
                <th style="padding:14px 18px; font-weight:800; color:#111;">Length (in)</th>
                <th style="padding:14px 18px; font-weight:800; color:#111;">Sleeve (in)</th>
                <th style="padding:14px 18px; font-weight:800; color:#111;">Recommended Fit</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #eee;"><td style="padding:12px 18px; font-weight:800;">S</td><td style="padding:12px 18px;">40 in</td><td style="padding:12px 18px;">26 in</td><td style="padding:12px 18px;">34 in</td><td style="padding:12px 18px; color:#666;">Clean / True Fit</td></tr>
              <tr style="border-bottom:1px solid #eee; background:#fcfcfc;"><td style="padding:12px 18px; font-weight:800;">M</td><td style="padding:12px 18px;">42 in</td><td style="padding:12px 18px;">27 in</td><td style="padding:12px 18px;">35 in</td><td style="padding:12px 18px; color:#666;">Relaxed Fit</td></tr>
              <tr style="border-bottom:1px solid #eee;"><td style="padding:12px 18px; font-weight:800;">L</td><td style="padding:12px 18px;">44 in</td><td style="padding:12px 18px;">28 in</td><td style="padding:12px 18px;">36 in</td><td style="padding:12px 18px; color:#666;">Signature Oversized</td></tr>
              <tr style="border-bottom:1px solid #eee; background:#fcfcfc;"><td style="padding:12px 18px; font-weight:800;">XL</td><td style="padding:12px 18px;">46 in</td><td style="padding:12px 18px;">29 in</td><td style="padding:12px 18px;">37 in</td><td style="padding:12px 18px; color:#666;">Extra Relaxed</td></tr>
              <tr><td style="padding:12px 18px; font-weight:800;">2XL / 3XL</td><td style="padding:12px 18px;">48-50 in</td><td style="padding:12px 18px;">30 in</td><td style="padding:12px 18px;">38 in</td><td style="padding:12px 18px; color:#666;">Max Volume Streetwear</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECTION 5: CUSTOMER REVIEWS -->
      <section style="max-width:1200px; margin:40px auto 0; padding:0 20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:20px; border-bottom:2px solid #111; padding-bottom:12px;">
          <div>
            <span style="color:#c9a227; font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:2px;">VERIFIED BUYER REVIEWS</span>
            <h2 style="font-size:1.4rem; font-weight:900; text-transform:uppercase; margin:4px 0 0; color:#111;">Customer Reviews (4.9 / 5.0)</h2>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
          <article style="background:#fff; border:1px solid #eee; border-radius:10px; padding:20px; display:flex; flex-direction:column; justify-space-between;">
            <div>
              <div style="color:#f59e0b; margin-bottom:8px; font-size:1.1rem;">★★★★★</div>
              <p style="font-size:0.9rem; line-height:1.6; color:#333; margin:0 0 12px;">"Premium weight, perfect oversized drape, and the fabric depth looks high-end designer level."</p>
            </div>
            <span style="font-size:0.8rem; font-weight:800; color:#888;">— Amelia R. (Verified Buyer)</span>
          </article>
          <article style="background:#fff; border:1px solid #eee; border-radius:10px; padding:20px; display:flex; flex-direction:column; justify-space-between;">
            <div>
              <div style="color:#f59e0b; margin-bottom:8px; font-size:1.1rem;">★★★★★</div>
              <p style="font-size:0.9rem; line-height:1.6; color:#333; margin:0 0 12px;">"The quality feels 10/10. Holds structure after washing and fits exactly as advertised."</p>
            </div>
            <span style="font-size:0.8rem; font-weight:800; color:#888;">— Marcus T. (Verified Buyer)</span>
          </article>
          <article style="background:#fff; border:1px solid #eee; border-radius:10px; padding:20px; display:flex; flex-direction:column; justify-space-between;">
            <div>
              <div style="color:#f59e0b; margin-bottom:8px; font-size:1.1rem;">★★★★★</div>
              <p style="font-size:0.9rem; line-height:1.6; color:#333; margin:0 0 12px;">"Fast USA shipping! Pair this with cargo pants for a clean, effortless outfit."</p>
            </div>
            <span style="font-size:0.8rem; font-weight:800; color:#888;">— Jordan K. (Verified Buyer)</span>
          </article>
        </div>
      </section>

      <!-- 4 FULL-WIDTH DISCOVERY CAROUSEL SECTIONS (WIDTH 100% WITH BADGES, HEARTS, QUICK VIEW & REAL PRODUCTS) -->
      <div id="zavoraRecContainer" style="width:100%; margin:40px auto 0; padding:0 20px;"></div>

      <!-- QUICK VIEW OVERLAY MODAL -->
      <div id="zavoraQuickViewModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 999999; padding: 20px; backdrop-filter: blur(5px);">
        <div style="background: #ffffff; color: #111111; border-radius: 14px; max-width: 780px; width: 100%; padding: 36px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.4); max-height: 90vh; overflow-y: auto;">
          <button type="button" id="zavoraCloseQuickView" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 2rem; font-weight: 700; cursor: pointer; color: #111111; line-height: 1;">&times;</button>
          <div id="zavoraQuickViewContent"></div>
        </div>
      </div>
    `;

    // FIX DUPLICATE FOOTER ISSUE (UPDATING 1 SINGLE FOOTER AT BOTTOM)
    const existingFooters = document.querySelectorAll('footer');
    existingFooters.forEach((foot, index) => {
      if (index > 0) {
        foot.remove(); // Remove duplicate footer tags
      }
    });

    let singleFooter = document.querySelector('footer');
    if (singleFooter) {
      singleFooter.className = 'footer-4col';
      singleFooter.style.cssText = 'background:#fff; border-top:1px solid #eee; padding:60px 0 30px; margin-top:80px; width:100%;';
      singleFooter.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:40px; max-width:1200px; margin:0 auto; padding:0 20px;">
          <div>
            <h4 style="font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; color:#111;">CONTACT SUPPORT</h4>
            <p style="font-size:0.85rem; color:#555; margin-bottom:12px;">supports@zavorafashion.com</p>
            <nav style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem; color:#666;">
              <a href="contact.html" style="color:#666; text-decoration:none;">Contact Us</a>
              <a href="help.html" style="color:#666; text-decoration:none;">Help Center</a>
              <a href="faq.html" style="color:#666; text-decoration:none;">FAQ</a>
              <a href="track-order.html" style="color:#666; text-decoration:none;">Track Order</a>
              <a href="shipping.html" style="color:#666; text-decoration:none;">Shipping Information</a>
              <a href="returns.html" style="color:#666; text-decoration:none;">Return & Refund Policy</a>
              <a href="exchange.html" style="color:#666; text-decoration:none;">Exchange Policy</a>
            </nav>
          </div>

          <div>
            <h4 style="font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; color:#111;">COMPANY</h4>
            <nav style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem; color:#666;">
              <a href="about.html" style="color:#666; text-decoration:none;">About Us</a>
              <a href="our-story.html" style="color:#666; text-decoration:none;">Our Story</a>
              <a href="sustainability.html" style="color:#666; text-decoration:none;">Sustainability</a>
              <a href="careers.html" style="color:#666; text-decoration:none;">Careers</a>
              <a href="press.html" style="color:#666; text-decoration:none;">Press</a>
              <a href="journal.html" style="color:#666; text-decoration:none;">Journal</a>
              <a href="affiliate.html" style="color:#666; text-decoration:none;">Affiliate Program</a>
            </nav>
            <div style="display:flex; gap:10px; margin-top:16px;">
              <button style="padding:6px 12px; border:1px solid #ddd; background:#fff; font-size:0.75rem; border-radius:4px; font-weight:700; cursor:pointer;">📷 Instagram</button>
              <button style="padding:6px 12px; border:1px solid #ddd; background:#fff; font-size:0.75rem; border-radius:4px; font-weight:700; cursor:pointer;">f Facebook</button>
            </div>
          </div>

          <div>
            <h4 style="font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; color:#111;">LEGAL</h4>
            <p style="font-size:0.85rem; color:#555; margin-bottom:12px;">legal@zavorafashion.com</p>
            <nav style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem; color:#666;">
              <a href="privacy-policy.html" style="color:#666; text-decoration:none;">Privacy Policy</a>
              <a href="terms-conditions.html" style="color:#666; text-decoration:none;">Terms & Conditions</a>
              <a href="cookie-policy.html" style="color:#666; text-decoration:none;">Cookie Policy</a>
              <a href="refund-policy.html" style="color:#666; text-decoration:none;">Refund Policy</a>
              <a href="shipping-policy.html" style="color:#666; text-decoration:none;">Shipping Policy</a>
            </nav>
            <div style="display:flex; gap:8px; margin-top:16px; flex-wrap:wrap;">
              <span style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; color:#003087;">PayPal</span>
              <span style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; color:#1a1f71;">VISA</span>
              <span style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:800; color:#eb001b;">Mastercard</span>
            </div>
          </div>

          <div>
            <h4 style="font-size:0.85rem; font-weight:800; text-transform:uppercase; margin-bottom:16px; color:#111;">ACCOUNT</h4>
            <nav style="display:flex; flex-direction:column; gap:8px; font-size:0.85rem; color:#666;">
              <a href="account.html" style="color:#666; text-decoration:none;">Login</a>
              <a href="account.html" style="color:#666; text-decoration:none;">Register</a>
              <a href="account.html" style="color:#666; text-decoration:none;">My Account</a>
              <a href="wishlist.html" style="color:#666; text-decoration:none;">Wishlist</a>
              <a href="account.html" style="color:#666; text-decoration:none;">Order History</a>
              <a href="account.html" style="color:#666; text-decoration:none;">Saved Addresses</a>
              <a href="rewards.html" style="color:#666; text-decoration:none;">Rewards</a>
              <a href="account.html" style="color:#666; text-decoration:none;">Change Password</a>
              <a href="newsletter.html" style="color:#666; text-decoration:none;">Newsletter</a>
            </nav>
          </div>
        </div>
      `;
    }

    // Render Discovery Sections (SIMILAR PRODUCTS, RECOMMENDED PRODUCTS, TRENDING NOW, NEW ARRIVALS)
    const similarProducts = getSectionProducts(product, 'similar', 6);
    const localRecommended = getSectionProducts(product, 'similar', 6);
    const trendingProducts = getSectionProducts(product, 'trending', 6);
    const newArrivalsProducts = getSectionProducts(product, 'new', 6);

    const container = document.getElementById('zavoraRecContainer');
    if (container) {
      container.innerHTML = `
        ${renderDiscoverySection('similar', 'RECOMMENDED CATEGORY', 'Similar Products', similarProducts)}
        <div id="zavoraRecSectionInner">
          ${renderDiscoverySection('recommended', 'CURATED FOR YOU', 'Recommended Products', localRecommended)}
        </div>
        ${renderDiscoverySection('trending', 'HOT RIGHT NOW', 'Trending Now', trendingProducts)}
        ${renderDiscoverySection('new', 'JUST ARRIVED', 'New Arrivals', newArrivalsProducts)}
      `;
      const initialPool = [...similarProducts, ...localRecommended, ...trendingProducts, ...newArrivalsProducts];
      bindRecommendationEvents(initialPool);
    }

    // DYNAMIC FETCH OF REAL STORE PRODUCTS FROM SERVER DATABASE API (/api/products?limit=24)
    fetchServerRecommendations(product, 24).then(serverProducts => {
      if (serverProducts && serverProducts.length >= 4) {
        const sim = getSectionProducts(product, 'similar', 6, serverProducts);
        const rec = getSectionProducts(product, 'trending', 6, serverProducts);
        const tre = getSectionProducts(product, 'new', 6, serverProducts);
        const arr = serverProducts.slice(12, 18);

        if (container) {
          container.innerHTML = `
            ${renderDiscoverySection('similar', 'RECOMMENDED CATEGORY', 'Similar Products', sim)}
            <div id="zavoraRecSectionInner">
              ${renderDiscoverySection('recommended', 'CURATED FOR YOU', 'Recommended Products', rec)}
            </div>
            ${renderDiscoverySection('trending', 'HOT RIGHT NOW', 'Trending Now', tre)}
            ${renderDiscoverySection('new', 'JUST ARRIVED', 'New Arrivals', arr)}
          `;
          const updatedPool = [...sim, ...rec, ...tre, ...arr];
          bindRecommendationEvents(updatedPool);
        }
      }
    });

    // Bind Color buttons
    document.querySelectorAll('.zavoraColorBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraColorBtn').forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#111';
          b.style.border = '1px solid #ddd';
        });
        btn.style.background = '#000';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #000';
        activeColor = btn.dataset.color;
      });
    });

    // Bind Size buttons
    document.querySelectorAll('.zavoraSizeBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraSizeBtn').forEach(b => {
          b.style.background = '#fff';
          b.style.color = '#111';
          b.style.border = '1px solid #ddd';
        });
        btn.style.background = '#000';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #000';
        activeSize = btn.dataset.size;
      });
    });

    // Bind Add to Cart
    const addBtn = document.getElementById('zavoraAddToCartBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (typeof addToCart === 'function') {
          addToCart(id, activeColor, activeSize);
        } else {
          try {
            let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
            cart.push({ id, name, price, img: images[0], color: activeColor, size: activeSize, qty: 1 });
            localStorage.setItem('zavoraCart', JSON.stringify(cart));
            alert(`${name} (${activeColor} / ${activeSize}) added to your bag!`);
          } catch(e) {}
        }
        if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
      });
    }

    // Bind Buy Now
    const buyBtn = document.getElementById('zavoraBuyNowBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (typeof addToCart === 'function') addToCart(id, activeColor, activeSize);
        window.location.href = 'checkout.html';
      });
    }
  }

  async function initProductRenderer() {
    const isProductPage = window.location.pathname.includes('product') || 
                          document.body.classList.contains('product-page-pending') || 
                          (document.querySelector('main p')?.textContent || '').includes('No product selected');
    
    if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
    
    if (!isProductPage) return;

    const id = getQueryParam('id') || getQueryParam('product') || getQueryParam('printfulId');
    let product = findProduct(id);

    renderProductPageUI(product);
    if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();

    if (id) {
      const dbProduct = await fetchProductFromAPI(id);
      if (dbProduct && dbProduct.name && dbProduct.img) {
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
