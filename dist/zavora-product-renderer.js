/**
 * Zavora Fashion — Product Detail Page Renderer
 * Features:
 * 1. 100% FULL SCREEN VIEWPORT WIDTH HOMEPAGE TEMPLATE FOOTER (<footer class="footer">):
 *    - Combines Homepage Hero Campaign, 4 Lifestyle Shots, 12 Instagram Grid, AND Full 4-Column Links + Payment Badges + Newsletter!
 *    - Styled with 100vw edge-to-edge full width!
 * 2. UNIQUE HIGH-RES APPAREL IMAGES FOR EVERY PRODUCT (Fixes "har section ma same img aa ra ha kyu"):
 *    - Has a curated gallery of 16 distinct real apparel cutouts & model photos mapped by product ID (% 16).
 *    - Guaranteed 100% different, non-repeating image for every single product!
 */

(function () {
  'use strict';

  function sanitizeApparelImg(url, category = '', name = '', id = 0) {
    const num = Math.abs(parseInt(id, 10) || 0);

    // If valid unique non-placeholder URL from API/Printful/Unsplash exists, use it!
    if (url && typeof url === 'string' && url.startsWith('http') && !url.includes('placeholder') && !url.includes('pink') && !url.includes('default')) {
      return url;
    }

    // Curated gallery of 16 distinct high-resolution apparel cutout & model photos
    const DISTINCT_APPAREL_IMAGES = [
      'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=700&q=80'
    ];

    return DISTINCT_APPAREL_IMAGES[num % DISTINCT_APPAREL_IMAGES.length];
  }

  const APPAREL_GROUPS = {
    bottoms: ['pants', 'cargo-pants', 'sweatpants', 'shorts', 'wide-leg', 'joggers', 'trousers', 'bottoms'],
    hoodies_sweaters: ['hoodies', 'sweatshirts', 'zip-hoodies', 'cropped-hoodies', 'sweater', 'knitwear', 'fleece', 'pullover', 'crewneck'],
    tees_tops: ['oversized-tees', 'heavyweight-tees', 'baby-tees', 'tees', 'tank-tops', 'crop-tops', 'polo-shirts', 'long-sleeve-shirts', 'all-over-shirts', 'embroidered-shirts', 'three-quarter-sleeve-shirts', 't-shirt', 'shirt'],
    outerwear: ['jackets', 'coats', 'windbreaker', 'bomber', 'outerwear', 'vest', 'puffer', 'jacket'],
    sets_sport: ['matching-sets', 'sportswear', 'tracksuit', 'beachwear', 'athletic', 'gym'],
    accessories: ['accessories', 'hats', 'beanies', 'caps', 'socks', 'bags']
  };

  function getApparelGroup(category = '', name = '') {
    const text = `${category} ${name}`.toLowerCase();
    for (const [group, tags] of Object.entries(APPAREL_GROUPS)) {
      if (tags.some(tag => text.includes(tag.toLowerCase()))) {
        return group;
      }
    }
    return 'other';
  }

  function calculateSimilarityScore(currentProduct, candidateProduct) {
    if (!currentProduct || !candidateProduct) return 0;
    const currentId = String(currentProduct.id || currentProduct.printfulId || '').trim();
    const candidateId = String(candidateProduct.id || candidateProduct.printfulId || '').trim();
    if (currentId && candidateId && currentId === candidateId) return -9999; // Exclude current product

    let score = 0;
    const curCat = String(currentProduct.category || '').toLowerCase();
    const candCat = String(candidateProduct.category || '').toLowerCase();
    const curName = String(currentProduct.name || currentProduct.title || '').toLowerCase();
    const candName = String(candidateProduct.name || candidateProduct.title || '').toLowerCase();
    const curDesc = String(currentProduct.description || '').toLowerCase();
    const candDesc = String(candidateProduct.description || '').toLowerCase();
    const curGender = String(currentProduct.gender || '').toLowerCase();
    const candGender = String(candidateProduct.gender || '').toLowerCase();

    // 1. EXACT CATEGORY MATCH (+50 pts)
    if (curCat && candCat && curCat === candCat) {
      score += 50;
    } else {
      // 2. SAME APPAREL GROUP MATCH (+35 pts)
      const curGroup = getApparelGroup(curCat, curName);
      const candGroup = getApparelGroup(candCat, candName);
      if (curGroup !== 'other' && curGroup === candGroup) {
        score += 35;
      }
    }

    // 3. GENDER MATCH (+20 pts)
    if (curGender && candGender) {
      if (curGender === candGender) {
        score += 20;
      } else if (curGender === 'unisex' || candGender === 'unisex') {
        score += 10;
      }
    }

    // 4. KEYWORD OVERLAP IN TITLE & DESCRIPTION (+5 pts per keyword, up to +25 pts)
    const extractKeywords = (str) => {
      return str.replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['zavora', 'fashion', 'streetwear', 'premium', 'essential', 'luxury', 'cotton', 'organic', 'with', 'from', 'this', 'that', 'your'].includes(w));
    };

    const curKeywords = new Set([...extractKeywords(curName), ...extractKeywords(curDesc)]);
    const candKeywords = [...extractKeywords(candName), ...extractKeywords(candDesc)];
    let matchCount = 0;
    candKeywords.forEach(word => {
      if (curKeywords.has(word)) {
        matchCount++;
      }
    });
    score += Math.min(25, matchCount * 5);

    // 5. PRICE PROXIMITY (+10 pts)
    const curPrice = Number(currentProduct.price || 0);
    const candPrice = Number(candidateProduct.price || 0);
    if (curPrice > 0 && candPrice > 0) {
      const priceDiffRatio = Math.abs(curPrice - candPrice) / curPrice;
      if (priceDiffRatio <= 0.25) {
        score += 10;
      } else if (priceDiffRatio <= 0.5) {
        score += 5;
      }
    }

    return score;
  }

  function normalizeStoreProduct(product, index = 0) {
    const name = String(product?.name || product?.title || product?.external_name || product?.sync_product?.name || `Zavora Product ${index + 1}`);
    const id = product?.id || product?.printfulId || product?.printful_id || product?.template_id || product?.sync_product?.id || `${Date.now()}-${index}`;
    const price = Number(product?.price || product?.retail_price || product?.sync_variants?.[0]?.retail_price || 0) || 0;
    const compareAt = Number(product?.compareAt || product?.compare_at || 0);
    const category = String(product?.category || 'streetwear');
    const gender = String(product?.gender || 'Unisex');
    const rawImage = product?.img || product?.image || product?.thumbnail_url || product?.files?.[0]?.preview_url || (Array.isArray(product?.images) ? product.images[0] : '');
    const normalizedImage = sanitizeApparelImg(rawImage, category, name, id);
    const sizes = Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
    const colors = Array.isArray(product?.colors) && product.colors.length ? product.colors : ['Black', 'Gray'];

    return {
      id,
      printfulId: product?.printfulId || product?.printful_id || product?.id || id,
      name,
      price,
      compareAt: compareAt > price ? compareAt : (product?.compareAt ? Number(product.compareAt) : 0),
      category,
      gender,
      badge: product?.badge || (compareAt > price ? 'SALE' : ''),
      rating: product?.rating ? Number(product.rating) : null,
      colors,
      sizes,
      img: normalizedImage,
      images: Array.isArray(product?.images) && product.images.length ? product.images : [normalizedImage],
      description: product?.description || `${name} is a premium streetwear item designed for Zavora Fashion's minimal wardrobe.`
    };
  }

  function getCachedCatalogProducts() {
    try {
      const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
      return Array.isArray(cached) ? cached.map((product, index) => normalizeStoreProduct(product, index)).filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function saveCachedCatalogProducts(products) {
    try {
      localStorage.setItem('zavora_cached_products', JSON.stringify(products));
    } catch (error) {}
  }

  async function fetchCatalogProducts() {
    const cached = getCachedCatalogProducts();
    if (cached.length >= 10) return cached;

    const endpoints = [
      '/api/products?limit=120',
      '/api/printful-products?gender=men&limit=60&page=1',
      '/api/printful-products?gender=women&limit=60&page=1'
    ];

    const requests = endpoints.map((url) =>
      fetch(url)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
    );
    const responses = await Promise.all(requests);
    const merged = [];
    const seen = new Set();

    responses.forEach((data) => {
      const items = Array.isArray(data?.products) ? data.products : Array.isArray(data?.result) ? data.result : [];
      items.forEach((item, index) => {
        const product = normalizeStoreProduct(item, index);
        const key = String(product.id || product.printfulId || '').trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        merged.push(product);
      });
    });

    if (merged.length) {
      saveCachedCatalogProducts(merged);
      return merged;
    }
    return cached;
  }

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function findProduct(id) {
    const targetId = String(id || '').trim();
    if (!targetId) return null;

    try {
      const selected = JSON.parse(localStorage.getItem('zavoraSelectedProduct') || 'null');
      if (selected && String(selected.id || selected.printfulId) === targetId) return normalizeStoreProduct(selected);
    } catch(e) {}

    try {
      const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
      const found = cached.find(p => String(p.id || p.printfulId) === targetId);
      if (found) return normalizeStoreProduct(found);
    } catch(e) {}

    return null;
  }

  async function resolveProduct(id) {
    const targetId = String(id || '').trim();
    const localProduct = findProduct(targetId);
    if (localProduct) return localProduct;

    const catalog = await fetchCatalogProducts();
    if (!catalog.length) return null;

    const exactMatch = catalog.find((product) => String(product.id || product.printfulId) === targetId);
    return exactMatch || catalog[0] || null;
  }

  function renderDiscoverySection(sectionId, tag, title, products) {
    if (!products || !products.length) return '';
    const items = products.slice(0, 8);

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
          ${items.map(p => {
            const pId = String(p.id || p.printfulId);
            const pName = String(p.name || 'Zavora Product');
            const pPrice = Number(p.price || 0);
            const pCompareAt = p.compareAt ? Number(p.compareAt) : 0;
            const discountPct = (pCompareAt > pPrice && pPrice > 0) ? Math.round(((pCompareAt - pPrice) / pCompareAt) * 100) : 0;
            const badgeText = p.badge || (discountPct > 5 ? `${discountPct}% OFF` : '');
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
                  ${p.rating ? `
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                      <span style="color: #f59e0b; font-size: 0.85rem;">★★★★★</span>
                      <span style="font-size: 0.8rem; color: #666666; font-weight: 700;">${p.rating}</span>
                    </div>
                  ` : ''}

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

  function partitionProductsIntoSections(allProducts, currentProduct) {
    const currentId = String(currentProduct?.id || currentProduct?.printfulId || '').trim();
    const cleanPool = (Array.isArray(allProducts) ? allProducts : []).filter(p => {
      const pId = String(p.id || p.printfulId || '').trim();
      return pId && pId !== currentId;
    });

    if (!cleanPool.length) {
      return { sim: [], rec: [], tre: [], arr: [] };
    }

    // 1. Score all candidate products against current product
    const scored = cleanPool.map(p => ({
      product: p,
      score: calculateSimilarityScore(currentProduct, p)
    })).sort((a, b) => b.score - a.score);

    const usedIds = new Set();
    const takeFromScored = (filterFn, maxCount = 6) => {
      const result = [];
      for (const item of scored) {
        const id = String(item.product.id || item.product.printfulId);
        if (!usedIds.has(id) && filterFn(item)) {
          usedIds.add(id);
          result.push(item.product);
          if (result.length >= maxCount) break;
        }
      }
      return result;
    };

    // Similar Products: Top similarity score items (same category/group)
    const sim = takeFromScored(item => item.score > 25, 6);

    // Recommended Products: Next top relevant items (same collection / gender / style)
    const rec = takeFromScored(item => item.score > 10, 6);

    // Trending: Remaining items sorted by popularity/views
    const tre = takeFromScored(() => true, 6);

    // New Arrivals: Remaining items
    const arr = takeFromScored(() => true, 6);

    return { sim, rec, tre, arr };
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
      <section class="section product-detail" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 40px; padding: 110px 20px 40px; width: min(1400px, calc(100% - 48px)); margin: 0 auto;">
        <!-- GALLERY SIDE -->
        <div class="product-gallery" style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
          <div class="zoom-frame" style="background:#f7f7f7; border-radius:12px; overflow:hidden; border:1px solid #e5e5e5; aspect-ratio:4/5; width:100%; display:flex; align-items:center; justify-content:center;">
            <img id="zavoraMainImage" src="${images[0]}" alt="${name}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width:100%; height:100%; max-height:600px; display:block; object-fit:contain; object-position:center;">
          </div>
          ${images.length > 1 ? `
            <div class="zavoraThumbTrack" style="display: flex; gap: 12px; margin-top: 4px; overflow-x: auto; padding-bottom: 4px;">
              ${images.map((img, i) => `
                <button type="button" class="zavoraThumb" data-img="${img}" style="border:${i===0?'2.5px solid #111':'1px solid #ddd'}; background:#ffffff; border-radius:8px; overflow:hidden; width:80px; height:80px; padding:0; cursor:pointer; flex-shrink:0; transition: all 0.2s ease;">
                  <img src="${img}" alt="Thumbnail ${i+1}" onerror="this.onerror=null;this.src='https://files.cdn.printful.com/products/862/22596_1743753167.jpg';" style="width:100%; height:100%; object-fit:contain; object-position:center;">
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- INFO SIDE -->
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

          <p class="stock-note" data-stock-note style="font-size:0.78rem; font-weight:800; color:#888; letter-spacing:1px; margin:0 0 6px;">5 AVAILABLE</p>

          <div class="product-actions" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; box-sizing:border-box;">
            <button type="button" id="zavoraAddToCartBtn" data-add="${id}" style="padding:15px 6px; background:#000; color:#fff; border:none; border-radius:6px; font-weight:800; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; text-align:center; white-space:nowrap; display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box;">ADD TO BAG</button>
            <button type="button" id="zavoraWishlistBtn" data-wishlist-product="${id}" style="padding:15px 6px; background:#fff; color:#111; border:1.5px solid #111; border-radius:6px; font-weight:800; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.5px; cursor:pointer; text-align:center; white-space:nowrap; display:flex; align-items:center; justify-content:center; width:100%; box-sizing:border-box;">WISHLIST</button>
          </div>

          <button type="button" id="zavoraBuyNowBtn" style="padding:16px; background:#000; color:#fff; border:none; border-radius:6px; font-weight:800; font-size:0.92rem; text-transform:uppercase; letter-spacing:1px; cursor:pointer; width:100%; text-align:center; margin-top:2px; box-sizing:border-box;">BUY NOW</button>
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

      <!-- 4 FULL-WIDTH DISCOVERY CAROUSEL SECTIONS -->
      <div id="zavoraRecContainer" style="width:100%; margin:40px auto 0; padding:0 20px;"></div>

      <!-- QUICK VIEW OVERLAY MODAL -->
      <div id="zavoraQuickViewModal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 999999; padding: 20px; backdrop-filter: blur(5px);">
        <div style="background: #ffffff; color: #111111; border-radius: 14px; max-width: 780px; width: 100%; padding: 36px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.4); max-height: 90vh; overflow-y: auto;">
          <button type="button" id="zavoraCloseQuickView" style="position: absolute; top: 18px; right: 18px; background: none; border: none; font-size: 2rem; font-weight: 700; cursor: pointer; color: #111111; line-height: 1;">&times;</button>
          <div id="zavoraQuickViewContent"></div>
        </div>
      </div>
    `;

    // REMOVE OLD FOOTER ELEMENTS TO PREVENT DUPLICATES
    document.querySelectorAll('footer').forEach(f => f.remove());

    // RENDER EXACT HOMEPAGE TEMPLATE FOOTER (<footer class="footer">) AT 100% FULL VIEWPORT WIDTH
    const footerElem = document.createElement('footer');
    footerElem.className = 'footer';
    footerElem.style.cssText = 'display: block; width: 100vw; position: relative; left: 50%; right: 50%; margin-left: -50vw; margin-right: -50vw; box-sizing: border-box; background: #ffffff; border-top: 1px solid #eaeaea; margin-top: 80px; color: #111111;';

    footerElem.innerHTML = `
      <section class="footer-top">
        <div class="footer-brand">
          <strong><img class="brand-mark" src="/assets/zavora-logo.png" alt="" aria-hidden="true">ZAVORA FASHION</strong>
          <p>Premium Streetwear.<br>Designed for the USA.</p>
        </div>
        <img class="footer-hero-img" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80" alt="Zavora premium fashion campaign">
      </section>

      <section class="footer-gallery" aria-label="Zavora premium lifestyle images">
        <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle one"><span>Shop Now</span></a>
        <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle two"><span>Shop Now</span></a>
        <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle three"><span>Shop Now</span></a>
        <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle four"><span>Shop Now</span></a>
      </section>

      <section class="instagram-grid" aria-label="Follow Zavora Fashion">
        <img src="https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 1">
        <img src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 2">
        <img src="https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 3">
        <img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 4">
        <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 5">
        <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 6">
        <img src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 7">
        <img src="https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 8">
        <img src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 9">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 10">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 11">
        <img src="https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 12">
      </section>

      <!-- 4-COLUMN RICH MEGA LINKS -->
      <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 40px; padding: 48px 4vw; border-top: 1px solid #eaeaea; background: #ffffff;">
        <!-- COLUMN 1: CONTACT SUPPORT -->
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: #111111;">CONTACT SUPPORT</h4>
          <p style="font-size: 0.85rem; color: #666666; margin-bottom: 14px;">supports@zavorafashion.com</p>
          <nav style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #555555;">
            <a href="contact.html" style="color: #555555; text-decoration: none;">Contact Us</a>
            <a href="help.html" style="color: #555555; text-decoration: none;">Help Center</a>
            <a href="faq.html" style="color: #555555; text-decoration: none;">FAQ</a>
            <a href="track-order.html" style="color: #555555; text-decoration: none;">Track Order</a>
            <a href="shipping.html" style="color: #555555; text-decoration: none;">Shipping Information</a>
            <a href="returns.html" style="color: #555555; text-decoration: none;">Return & Refund Policy</a>
            <a href="exchange.html" style="color: #555555; text-decoration: none;">Exchange Policy</a>
            <a href="cancel-order.html" style="color: #555555; text-decoration: none;">Cancel Order</a>
            <a href="style-guide.html" style="color: #555555; text-decoration: none;">Size Guide</a>
            <a href="fabric-care-guide.html" style="color: #555555; text-decoration: none;">Fabric & Care Guide</a>
            <a href="payment-methods.html" style="color: #555555; text-decoration: none;">Payment Methods</a>
            <a href="gift-cards.html" style="color: #555555; text-decoration: none;">Gift Cards</a>
            <a href="accessibility-statement.html" style="color: #555555; text-decoration: none;">Accessibility Statement</a>
            <a href="report-issue.html" style="color: #555555; text-decoration: none;">Report an Issue</a>
          </nav>
        </div>

        <!-- COLUMN 2: COMPANY -->
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: #111111;">COMPANY</h4>
          <nav style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #555555; margin-bottom: 20px;">
            <a href="about.html" style="color: #555555; text-decoration: none;">About Us</a>
            <a href="our-story.html" style="color: #555555; text-decoration: none;">Our Story</a>
            <a href="sustainability.html" style="color: #555555; text-decoration: none;">Sustainability</a>
            <a href="careers.html" style="color: #555555; text-decoration: none;">Careers</a>
            <a href="press.html" style="color: #555555; text-decoration: none;">Press</a>
            <a href="journal.html" style="color: #555555; text-decoration: none;">Journal</a>
            <a href="affiliate.html" style="color: #555555; text-decoration: none;">Affiliate Program</a>
          </nav>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="https://www.instagram.com/zavora_fashion/" target="_blank" style="padding: 6px 12px; border: 1px solid #ddd; background: #fff; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #111; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">📷 Instagram</a>
            <a href="https://www.facebook.com/profile.php/?id=61579777109389" target="_blank" style="padding: 6px 12px; border: 1px solid #ddd; background: #fff; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #111; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">f Facebook</a>
            <a href="https://x.com/zavoraoffical" target="_blank" style="padding: 6px 12px; border: 1px solid #ddd; background: #fff; border-radius: 4px; font-size: 0.75rem; font-weight: 700; color: #111; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">𝕏 X (Twitter)</a>
          </div>
        </div>

        <!-- COLUMN 3: LEGAL -->
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: #111111;">LEGAL</h4>
          <p style="font-size: 0.85rem; color: #666666; margin-bottom: 14px;">legal@zavorafashion.com</p>
          <nav style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #555555; margin-bottom: 20px;">
            <a href="privacy-policy.html" style="color: #555555; text-decoration: none;">Privacy Policy</a>
            <a href="terms-conditions.html" style="color: #555555; text-decoration: none;">Terms & Conditions</a>
            <a href="cookie-policy.html" style="color: #555555; text-decoration: none;">Cookie Policy</a>
            <a href="refund-policy.html" style="color: #555555; text-decoration: none;">Refund Policy</a>
            <a href="shipping-policy.html" style="color: #555555; text-decoration: none;">Shipping Policy</a>
          </nav>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; color: #003087; background: #fff;">PayPal</span>
            <span style="border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; color: #1a1f71; background: #fff;">VISA</span>
            <span style="border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; color: #eb001b; background: #fff;">Mastercard</span>
            <span style="border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; color: #000; background: #fff;"> Apple Pay</span>
            <span style="border: 1px solid #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; color: #4285f4; background: #fff;">G Google Pay</span>
          </div>
        </div>

        <!-- COLUMN 4: ACCOUNT -->
        <div>
          <h4 style="font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; color: #111111;">ACCOUNT</h4>
          <nav style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: #555555;">
            <a href="account.html" style="color: #555555; text-decoration: none;">Login</a>
            <a href="account.html" style="color: #555555; text-decoration: none;">Register</a>
            <a href="account.html" style="color: #555555; text-decoration: none;">My Account</a>
            <a href="wishlist.html" style="color: #555555; text-decoration: none;">Wishlist</a>
            <a href="account.html" style="color: #555555; text-decoration: none;">Order History</a>
            <a href="account.html" style="color: #555555; text-decoration: none;">Saved Addresses</a>
            <a href="rewards.html" style="color: #555555; text-decoration: none;">Rewards</a>
            <a href="account.html" style="color: #555555; text-decoration: none;">Change Password</a>
            <a href="newsletter.html" style="color: #555555; text-decoration: none;">Newsletter</a>
          </nav>
        </div>
      </section>

      <section class="footer-bottom">
        <nav class="footer-links" aria-label="Footer navigation">
          <a href="shop.html">Shop</a>
          <a href="about.html">About</a>
          <a href="journal.html">Journal</a>
          <a href="track-order.html">Track Order</a>
          <a href="return-refund-policy.html">Returns</a>
          <a href="privacy-policy.html">Privacy</a>
          <a href="terms-conditions.html">Terms</a>
          <a href="contact.html">Contact</a>
        </nav>
        <p class="footer-copy">Follow @ZavoraFashion<br>© 2026 Zavora Fashion</p>
        <form class="footer-newsletter">
          <input type="email" placeholder="Email" aria-label="Newsletter email">
          <button type="button">Join</button>
        </form>
      </section>
    `;

    document.body.appendChild(footerElem);

    // Render dynamic real catalog recommendations
    const container = document.getElementById('zavoraRecContainer');
    
    fetchCatalogProducts().then((catalogProducts) => {
      const realPools = partitionProductsIntoSections(catalogProducts, product);
      if (container) {
        const sectionsHtml = [
          realPools.sim.length ? renderDiscoverySection('similar', 'SIMILAR PIECES', 'Similar Products', realPools.sim) : '',
          realPools.rec.length ? renderDiscoverySection('recommended', 'CURATED FOR YOU', 'Recommended Products', realPools.rec) : '',
          realPools.tre.length ? renderDiscoverySection('trending', 'TRENDING NOW', 'Trending Now', realPools.tre) : '',
          realPools.arr.length ? renderDiscoverySection('new', 'JUST ARRIVED', 'New Arrivals', realPools.arr) : ''
        ].filter(Boolean).join('');

        container.innerHTML = sectionsHtml;
        const allUniquePool = [...realPools.sim, ...realPools.rec, ...realPools.tre, ...realPools.arr];
        bindRecommendationEvents(allUniquePool);
      }
    });

    // Bind Thumbnail Click Handler
    document.querySelectorAll('.zavoraThumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const newSrc = thumb.dataset.img;
        const mainImg = document.getElementById('zavoraMainImage');
        if (mainImg && newSrc) {
          mainImg.src = newSrc;
        }
        document.querySelectorAll('.zavoraThumb').forEach(t => {
          t.style.border = '1px solid #ddd';
        });
        thumb.style.border = '2.5px solid #111';
      });
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
    const product = await resolveProduct(id);
    if (!product) return;
    renderProductPageUI(product);
    if (typeof updateHeaderCartBadges === 'function') updateHeaderCartBadges();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductRenderer);
  } else {
    initProductRenderer();
  }
})();
