/**
 * Zavora Fashion — Product Detail Page Renderer (Luxury Theme Matching)
 * Renders URL parameter products (?id=...) using Zavora's exact design system & styling.
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
      badge: "NEW",
      colors: ["black", "heather gray", "white"],
      sizes: ["XS", "S", "M", "L", "XL"],
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
      badge: "NEW",
      colors: ["black", "heather gray", "pink", "brown", "light pink"],
      sizes: ["XS", "S", "M", "L", "XL"],
      img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "Zavora Women's Relax Hoodie is a premium hoodie designed for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment."
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
      'light pink': '#fbcfe8'
    };
    return map[String(color).toLowerCase()] || '#333333';
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
      name: targetId ? `Zavora Studio Item #${targetId}` : DEFAULT_FALLBACK_PRODUCTS[0].name
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
    const name = String(product.name || 'Zavora Product');
    const price = Number(product.price || 94.89);
    const compareAt = product.compareAt ? Number(product.compareAt) : null;
    const badge = product.badge || 'NEW';
    const category = String(product.category || 'hoodies').toUpperCase();
    const description = String(product.description || `${name} is a premium design for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment.`);

    const images = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.img || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg'];

    const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'BLACK'];
    const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['XS', 'S', 'M', 'L', 'XL'];

    main.innerHTML = `
      <section class="section" style="max-width: 1240px; margin: 0 auto 80px; padding: 100px 24px 0;">
        <!-- BREADCRUMBS -->
        <p style="color: #c9a227; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 24px;">
          ${category} • PREMIUM ORGANIC STREETWEAR
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 60px; align-items: start;">
          
          <!-- GALLERY SIDE -->
          <div>
            <div style="position: relative; background: #0d0d0d; border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.08);">
              <img id="zavoraMainImage" src="${images[0]}" alt="Zavora ${name}" style="width: 100%; height: auto; display: block; object-fit: cover;">
              ${badge ? `<span style="position: absolute; top: 16px; left: 16px; background: #000; color: #fff; border: 1px solid #fff; padding: 4px 10px; font-size: 0.75rem; font-weight: 700; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">${badge}</span>` : ''}
            </div>

            ${images.length > 1 ? `
              <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px;">
                ${images.map((img, i) => `
                  <button type="button" class="zavoraThumb" data-img="${img}" style="border: ${i===0?'2px solid #fff':'1px solid rgba(255,255,255,0.2)'}; background: #0d0d0d; border-radius: 8px; overflow: hidden; width: 76px; height: 76px; padding: 0; cursor: pointer; flex-shrink: 0;">
                    <img src="${img}" alt="Thumbnail ${i+1}" style="width: 100%; height: 100%; object-fit: cover;">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- INFO & CTA SIDE -->
          <div>
            <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 14px; line-height: 1.15; letter-spacing: -0.5px;">${name}</h1>

            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <span style="color: #f59e0b; font-size: 1rem; letter-spacing: 2px;">★★★★★</span>
              <span style="font-size: 0.9rem; opacity: 0.8; font-weight: 500;">4.9 (34 customer reviews)</span>
            </div>

            <div style="display: flex; align-items: baseline; gap: 16px; margin-bottom: 28px;">
              <span class="sale-price" data-price="${price}" style="font-size: 1.8rem; font-weight: 700; color: #fff;">$${price.toFixed(2)}</span>
              ${compareAt ? `<s style="font-size: 1.1rem; opacity: 0.5;">$${compareAt.toFixed(2)}</s>` : ''}
              <span style="background: rgba(34, 197, 94, 0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">In Stock • Ships in 24h</span>
            </div>

            <p style="font-size: 0.98rem; line-height: 1.7; opacity: 0.85; margin-bottom: 32px;">${description}</p>

            <!-- COLOR SELECTION -->
            <div style="margin-bottom: 28px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">COLOR: <span id="zavoraSelectedColor" style="color: #fff;">${String(colors[0]).toUpperCase()}</span></label>
              <div style="display: flex; gap: 12px;">
                ${colors.map((c, i) => `
                  <button type="button" class="zavoraColorBtn" data-color="${c}" style="width: 34px; height: 34px; border-radius: 50%; background: ${swatchColor(c)}; border: ${i===0?'2px solid #fff':'1px solid rgba(255,255,255,0.25)'}; cursor: pointer; transition: transform 0.15s;" title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <!-- SIZE SELECTION -->
            <div style="margin-bottom: 36px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <label style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">SIZE: <span id="zavoraSelectedSize" style="color: #fff;">${sizes[0]}</span></label>
                <a href="#size-guide" style="font-size: 0.82rem; color: #aaa; text-decoration: underline;">Size Guide</a>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${sizes.map((s, i) => `
                  <button type="button" class="zavoraSizeBtn" data-size="${s}" style="min-width: 52px; padding: 12px 18px; border-radius: 6px; background: ${i===0?'#fff':'rgba(255,255,255,0.04)'}; color: ${i===0?'#000':'#fff'}; border: 1px solid ${i===0?'#fff':'rgba(255,255,255,0.2)'}; font-weight: 700; font-size: 0.9rem; cursor: pointer;">${s}</button>
                `).join('')}
              </div>
            </div>

            <!-- CTAS -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px;">
              <button type="button" id="zavoraAddToCartBtn" data-add="${id}" style="width: 100%; padding: 18px; background: #fff; color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1.5px;">ADD TO BAG</button>
              <button type="button" id="zavoraBuyNowBtn" style="width: 100%; padding: 18px; background: #c9a227; color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 1rem; cursor: pointer; text-transform: uppercase; letter-spacing: 1.5px;">BUY NOW WITH FAST USA CHECKOUT</button>
            </div>

            <!-- GUARANTEES -->
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <strong style="display: block; font-size: 0.92rem; margin-bottom: 4px; color: #fff;">🚚 Free USA Shipping</strong>
                <span style="font-size: 0.82rem; opacity: 0.7;">Orders $75+ receive free 2-3 day express delivery.</span>
              </div>
              <div>
                <strong style="display: block; font-size: 0.92rem; margin-bottom: 4px; color: #fff;">🔄 30-Day Easy Returns</strong>
                <span style="font-size: 0.82rem; opacity: 0.7;">Hassle-free exchanges & returns guaranteed.</span>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;

    // Bind Gallery Thumbnails
    document.querySelectorAll('.zavoraThumb').forEach(btn => {
      btn.addEventListener('click', () => {
        const mainImg = document.getElementById('zavoraMainImage');
        if (mainImg) mainImg.src = btn.dataset.img;
        document.querySelectorAll('.zavoraThumb').forEach(b => b.style.border = '1px solid rgba(255,255,255,0.2)');
        btn.style.border = '2px solid #fff';
      });
    });

    // Bind Color Buttons
    document.querySelectorAll('.zavoraColorBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraColorBtn').forEach(b => b.style.border = '1px solid rgba(255,255,255,0.25)');
        btn.style.border = '2px solid #fff';
        const label = document.getElementById('zavoraSelectedColor');
        if (label) label.textContent = String(btn.dataset.color).toUpperCase();
      });
    });

    // Bind Size Buttons
    document.querySelectorAll('.zavoraSizeBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraSizeBtn').forEach(b => {
          b.style.background = 'rgba(255,255,255,0.04)';
          b.style.color = '#fff';
          b.style.border = '1px solid rgba(255,255,255,0.2)';
        });
        btn.style.background = '#fff';
        btn.style.color = '#000';
        btn.style.border = '1px solid #fff';
        const label = document.getElementById('zavoraSelectedSize');
        if (label) label.textContent = btn.dataset.size;
      });
    });

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

    // Bind Buy Now
    const buyBtn = document.getElementById('zavoraBuyNowBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (typeof addToCart === 'function') addToCart(id);
        window.location.href = 'checkout.html';
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
