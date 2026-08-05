/**
 * Zavora Fashion — Product Detail Page Renderer (Ultra-Refined Luxury & Features)
 * Clean URLs (?id=...), Premium Wishlist Button, Interactive Size Guide Modal, & Best Sellers Recommendations.
 */

(function () {
  'use strict';

  const DEFAULT_FALLBACK_PRODUCTS = [
    {
      id: 862,
      printfulId: 862,
      name: "Zavora Women's Heavyweight Boxy T-Shirt",
      price: 94.89,
      compareAt: 120.00,
      category: "oversized-tees",
      badge: "BEST SELLER",
      colors: ["black", "heather gray", "white"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://files.cdn.printful.com/products/862/22596_1743753167.jpg",
      images: [
        "https://files.cdn.printful.com/products/862/22596_1743753167.jpg",
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "Crafted from 100% organic French Terry cotton (480 GSM), this boxy tee features drop shoulders, reinforced double-stitched collar, and a modern architectural silhouette. Pre-shrunk for maximum wash durability."
    },
    {
      id: 1412,
      printfulId: 1412,
      name: "Zavora Women's Relax Hoodie",
      price: 166.17,
      compareAt: 198.00,
      category: "hoodies",
      badge: "BEST SELLER",
      colors: ["black", "heather gray", "pink", "brown", "light pink"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "The Zavora Women's Relax Hoodie is a signature minimal streetwear silhouette. Crafted from 480 GSM heavyweight organic French Terry cotton for supreme warmth, structural drape, and everyday USA fulfillment."
    },
    {
      id: 411,
      printfulId: 411,
      name: "Zavora Premium Organic Sweatshirt",
      price: 129.73,
      compareAt: 155.00,
      category: "sweatshirts",
      badge: "TRENDING",
      colors: ["black", "white", "heather gray"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "Ultra-comfortable 480 GSM organic cotton crewneck sweatshirt built with reinforced ribbed cuffs, drop shoulders, and timeless streetwear proportions."
    },
    {
      id: 604,
      printfulId: 604,
      name: "Zavora Wide-Leg Organic Pants",
      price: 112.77,
      compareAt: 135.00,
      category: "pants",
      badge: "NEW",
      colors: ["white", "black", "khaki"],
      sizes: ["XS", "S", "M", "L", "XL", "2XL"],
      img: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=85",
      images: [
        "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "Elevated wide-leg organic cotton sweatpants featuring deep side pockets, flexible drawstring waist, and relaxed architectural drape."
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
      'heather gray': '#aaaaaa',
      navy: '#1b263b',
      khaki: '#c2b280',
      pink: '#ec4899',
      brown: '#78350f',
      'light pink': '#fbcfe8',
      red: '#9b1c1c',
      green: '#2d5a27'
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

    const fallback = DEFAULT_FALLBACK_PRODUCTS.find(p => String(p.id) === targetId);
    if (fallback) return fallback;

    return {
      ...DEFAULT_FALLBACK_PRODUCTS[0],
      id: targetId || 862,
      name: targetId ? `Zavora Premium Item #${targetId}` : DEFAULT_FALLBACK_PRODUCTS[0].name
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
      ? product.images
      : [product.img || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg'];

    const rawColors = Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'Black'];
    const colors = rawColors.map(c => String(c).trim()).filter(Boolean);
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

    const recommendedProducts = DEFAULT_FALLBACK_PRODUCTS.filter(p => String(p.id) !== id).slice(0, 4);

    main.innerHTML = `
      <section class="section" style="max-width: 1240px; margin: 0 auto 80px; padding: 90px 24px 0; color: #111111;">
        <!-- BREADCRUMBS -->
        <p style="color: #c9a227; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">
          ${categoryLabel}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 50px; align-items: start;">
          
          <!-- GALLERY SIDE -->
          <div>
            <div style="position: relative; background: #f8f8f8; border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid #e5e5e5;">
              <img id="zavoraMainImage" src="${images[0]}" alt="Zavora ${name}" style="width: 100%; height: auto; display: block; object-fit: cover;">
              ${badge ? `<span style="position: absolute; top: 16px; left: 16px; background: #111; color: #fff; border: 1px solid #111; padding: 4px 12px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">${badge}</span>` : ''}
            </div>

            ${images.length > 1 ? `
              <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
                ${images.map((img, i) => `
                  <button type="button" class="zavoraThumb" data-img="${img}" style="border: ${i===0?'2px solid #111':'1px solid #e0e0e0'}; background: #f8f8f8; border-radius: 8px; overflow: hidden; width: 76px; height: 76px; padding: 0; cursor: pointer; flex-shrink: 0;">
                    <img src="${img}" alt="Thumbnail ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
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
              <label style="display: block; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #111111;">COLOR: <span id="zavoraSelectedColor" style="color: #111111; font-weight: 800; margin-left: 6px;">${String(colors[0]).toUpperCase()}</span></label>
              <div style="display: flex; gap: 12px; flex-wrap:wrap;">
                ${colors.map((c, i) => `
                  <button type="button" class="zavoraColorBtn" data-color="${c}" style="width: 36px; height: 36px; border-radius: 50%; background: ${swatchColor(c)}; border: ${i===0?'2px solid #111111':'1px solid #cccccc'}; cursor: pointer; transition: transform 0.15s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <!-- SIZE SELECTION -->
            <div style="margin-bottom: 32px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #111111;">SIZE: <span id="zavoraSelectedSize" style="color: #111111; font-weight: 800; margin-left: 6px;">${sizes[0]}</span></label>
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

        <!-- RECOMMENDED PRODUCTS / BEST SELLERS SECTION -->
        <div style="margin-top: 80px; padding-top: 50px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
              <p style="color: #c9a227; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">CURATED STREETWEAR</p>
              <h2 style="font-size: 1.8rem; font-weight: 800; color: #111111; margin: 0;">You May Also Like & Best Sellers</h2>
            </div>
            <a href="best-sellers.html" style="font-size: 0.9rem; font-weight: 700; color: #111111; text-decoration: underline;">View All Best Sellers &rarr;</a>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px;">
            ${recommendedProducts.map(p => `
              <article style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff; transition: transform 0.2s, box-shadow 0.2s;">
                <a href="product?id=${encodeURIComponent(p.id)}" style="display: block; position: relative; aspect-ratio: 4/5; overflow: hidden; background: #f8f8f8;">
                  <img src="${p.img || p.images?.[0]}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                  ${p.badge ? `<span style="position: absolute; top: 12px; left: 12px; background: #111; color: #fff; padding: 4px 10px; font-size: 0.7rem; font-weight: 800; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">${p.badge}</span>` : ''}
                </a>
                <div style="padding: 18px;">
                  <h3 style="font-size: 1rem; font-weight: 800; margin: 0 0 8px; line-height: 1.3;"><a href="product?id=${encodeURIComponent(p.id)}" style="color: #111111; text-decoration: none;">${p.name}</a></h3>
                  <p style="font-size: 0.82rem; color: #666666; margin: 0 0 12px; text-transform: uppercase; font-weight: 600;">${p.category || 'streetwear'}</p>
                  <strong class="sale-price" data-price="${p.price}" style="font-size: 1.15rem; font-weight: 800; color: #111111;">$${Number(p.price || 89.99).toFixed(2)}</strong>
                  <div style="margin-top: 14px;">
                    <a href="product?id=${encodeURIComponent(p.id)}" style="display: block; text-align: center; padding: 10px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">View Product</a>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>

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

    // Bind Gallery Thumbnails
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
        const label = document.getElementById('zavoraSelectedColor');
        if (label) label.textContent = String(btn.dataset.color).toUpperCase();
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
        const label = document.getElementById('zavoraSelectedSize');
        if (label) label.textContent = btn.dataset.size;
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
            wishlist.push({ id, name, price, img: images[0] });
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
        if (typeof addToCart === 'function') {
          addToCart(id);
        } else {
          try {
            let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
            const found = cart.find(i => String(i.id) === id);
            if (found) found.qty += 1;
            else cart.push({ id, name, price, img: images[0], qty: 1 });
            localStorage.setItem('zavoraCart', JSON.stringify(cart));
            alert(`${name} added to your bag!`);
          } catch(e) {}
        }
        if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackAddToCart(product, 1);
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

  async function initProductRenderer() {
    const isProductPage = window.location.pathname.includes('product') || 
                          document.body.classList.contains('product-page-pending') || 
                          (document.querySelector('main p')?.textContent || '').includes('No product selected');
    if (!isProductPage) return;

    const id = getQueryParam('id') || getQueryParam('product') || getQueryParam('printfulId');
    let product = findProduct(id);

    // Initial render
    renderProductPageUI(product);

    // If API ID is present, attempt background fetch to get full fresh DB data
    if (id) {
      const dbProduct = await fetchProductFromAPI(id);
      if (dbProduct) {
        renderProductPageUI(dbProduct);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductRenderer);
  } else {
    initProductRenderer();
  }
})();
