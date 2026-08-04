/**
 * Zavora Fashion — Product Detail Page Renderer
 * Handles URL parameter parsing (?id=...), API fallback, full interactive product page UI & SEO/Analytics updates.
 */

(function () {
  'use strict';

  const BASE_URL = 'https://www.zavorafashion.com';

  const DEFAULT_FALLBACK_PRODUCTS = [
    {
      id: 862,
      printfulId: 862,
      name: "Zavora Women's Heavyweight Boxy T-Shirt",
      price: 94.89,
      compareAt: 120.00,
      category: "oversized-tees",
      badge: "BESTSELLER",
      colors: ["black", "white", "heather gray"],
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
      id: 869,
      printfulId: 869,
      name: "Zavora Signature Embroidered Dad Hat",
      price: 42.00,
      compareAt: 55.00,
      category: "accessories",
      badge: "NEW DROP",
      colors: ["black", "navy", "khaki"],
      sizes: ["One Size"],
      img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=85",
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85"
      ],
      description: "Signature 6-panel unstructured dad cap featuring high-density gold crest logo embroidery, brass buckle closure, and 100% washed cotton twill construction."
    }
  ];

  function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  function swatchColor(color) {
    const map = { black: '#050505', white: '#ffffff', gray: '#888888', 'heather gray': '#aaaaaa', navy: '#1b263b', khaki: '#c2b280', green: '#2d5a27', red: '#9b1c1c' };
    return map[String(color).toLowerCase()] || '#333333';
  }

  function findProduct(id) {
    const targetId = String(id || '').trim();

    // 1. Try selected product in localStorage
    try {
      const selected = JSON.parse(localStorage.getItem('zavoraSelectedProduct') || 'null');
      if (selected && String(selected.id || selected.printfulId) === targetId) return selected;
    } catch(e) {}

    // 2. Try cached products array
    try {
      const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
      const found = cached.find(p => String(p.id || p.printfulId) === targetId);
      if (found) return found;
    } catch(e) {}

    // 3. Try in-memory catalog
    if (window.__zavoraCatalogProducts?.length) {
      const found = window.__zavoraCatalogProducts.find(p => String(p.id || p.printfulId) === targetId);
      if (found) return found;
    }

    // 4. Default fallback list
    const fallback = DEFAULT_FALLBACK_PRODUCTS.find(p => String(p.id) === targetId);
    if (fallback) return fallback;

    // 5. Default first product if ID exists but not found
    return {
      ...DEFAULT_FALLBACK_PRODUCTS[0],
      id: targetId || 862,
      name: targetId ? `Zavora Studio Product #${targetId}` : DEFAULT_FALLBACK_PRODUCTS[0].name
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
    const badge = product.badge || 'BESTSELLER';
    const category = String(product.category || 'streetwear');
    const description = String(product.description || 'Premium organic streetwear by Zavora Fashion.');

    const images = Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.img || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg'];

    const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'Black'];
    const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];

    main.innerHTML = `
      <section class="section" style="max-width:1200px; margin: 20px auto 60px; padding:0 20px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 50px; align-items: start;">
          
          <!-- IMAGE GALLERY -->
          <div>
            <div style="position:relative; background:#111; border-radius:12px; overflow:hidden; margin-bottom:16px;">
              <img id="zavoraMainImage" src="${images[0]}" alt="Zavora ${name}" style="width:100%; height:auto; display:block; object-fit:cover;">
              ${badge ? `<span style="position:absolute; top:16px; left:16px; background:#fff; color:#000; padding:4px 12px; font-size:0.75rem; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:1px;">${badge}</span>` : ''}
            </div>

            ${images.length > 1 ? `
              <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
                ${images.map((img, i) => `
                  <button type="button" class="zavoraThumb" data-img="${img}" style="border:${i===0?'2px solid #fff':'1px solid rgba(255,255,255,0.2)'}; background:#111; border-radius:6px; overflow:hidden; width:80px; height:80px; padding:0; cursor:pointer; flex-shrink:0;">
                    <img src="${img}" alt="Thumbnail ${i+1}" style="width:100%; height:100%; object-fit:cover;">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- PRODUCT DETAILS & BUY ACTIONS -->
          <div style="padding-top:10px;">
            <p style="color:#c9a227; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">${category} • Premium Organic Streetwear</p>
            <h1 style="font-size:2.2rem; font-weight:700; margin-bottom:12px; line-height:1.2;">${name}</h1>

            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
              <span style="color:#f59e0b; font-size:1.1rem;">★★★★★</span>
              <span style="font-size:0.9rem; opacity:0.8;">4.9 (34 customer reviews)</span>
            </div>

            <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:24px;">
              <span style="font-size:1.8rem; font-weight:700; color:#fff;">$${price.toFixed(2)} USD</span>
              ${compareAt ? `<s style="font-size:1.1rem; opacity:0.5;">$${compareAt.toFixed(2)}</s>` : ''}
              <span style="background:rgba(34,197,94,0.15); color:#4ade80; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">In Stock • Ships in 24h</span>
            </div>

            <p style="font-size:0.98rem; line-height:1.65; opacity:0.9; margin-bottom:28px;">${description}</p>

            <!-- COLOR SELECTOR -->
            <div style="margin-bottom:24px;">
              <label style="display:block; font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">Color: <span id="zavoraSelectedColor">${colors[0]}</span></label>
              <div style="display:flex; gap:10px;">
                ${colors.map((c, i) => `
                  <button type="button" class="zavoraColorBtn" data-color="${c}" style="width:32px; height:32px; border-radius:50%; background:${swatchColor(c)}; border:${i===0?'2px solid #fff':'1px solid rgba(255,255,255,0.3)'}; cursor:pointer;" title="${c}"></button>
                `).join('')}
              </div>
            </div>

            <!-- SIZE SELECTOR -->
            <div style="margin-bottom:30px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <label style="font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Size: <span id="zavoraSelectedSize">${sizes[0]}</span></label>
                <a href="#size-guide" style="font-size:0.8rem; color:#aaa; text-decoration:underline;">Size Guide</a>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                ${sizes.map((s, i) => `
                  <button type="button" class="zavoraSizeBtn" data-size="${s}" style="min-width:48px; padding:10px 16px; border-radius:6px; background:${i===0?'#fff':'rgba(255,255,255,0.05)'}; color:${i===0?'#000':'#fff'}; border:1px solid rgba(255,255,255,0.2); font-weight:600; cursor:pointer;">${s}</button>
                `).join('')}
              </div>
            </div>

            <!-- ADD TO CART & BUY NOW BUTTONS -->
            <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:30px;">
              <button type="button" id="zavoraAddToCartBtn" data-add="${id}" style="width:100%; padding:16px; background:#fff; color:#000; border:none; border-radius:8px; font-weight:700; font-size:1.05rem; cursor:pointer; text-transform:uppercase; letter-spacing:1px;">Add to Bag</button>
              <button type="button" id="zavoraBuyNowBtn" style="width:100%; padding:16px; background:#c9a227; color:#000; border:none; border-radius:8px; font-weight:700; font-size:1.05rem; cursor:pointer; text-transform:uppercase; letter-spacing:1px;">Buy Now with Fast USA Checkout</button>
            </div>

            <!-- USA SHIPPING & RETURNS BANNER -->
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px; display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div>
                <strong style="display:block; font-size:0.9rem; margin-bottom:4px;">🚚 Free USA Shipping</strong>
                <span style="font-size:0.8rem; opacity:0.75;">Orders $75+ receive free 2-3 day express delivery.</span>
              </div>
              <div>
                <strong style="display:block; font-size:0.9rem; margin-bottom:4px;">🔄 30-Day Easy Returns</strong>
                <span style="font-size:0.8rem; opacity:0.75;">Hassle-free exchanges & returns guaranteed.</span>
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
        document.querySelectorAll('.zavoraColorBtn').forEach(b => b.style.border = '1px solid rgba(255,255,255,0.3)');
        btn.style.border = '2px solid #fff';
        const label = document.getElementById('zavoraSelectedColor');
        if (label) label.textContent = btn.dataset.color;
      });
    });

    // Bind Size Buttons
    document.querySelectorAll('.zavoraSizeBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.zavoraSizeBtn').forEach(b => {
          b.style.background = 'rgba(255,255,255,0.05)';
          b.style.color = '#fff';
        });
        btn.style.background = '#fff';
        btn.style.color = '#000';
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

    // Update SEO & Analytics
    if (window.ZavoraSEO && typeof window.ZavoraSEO.updateProductSEO === 'function') {
      window.ZavoraSEO.updateProductSEO(product);
    }
    if (window.ZavoraAnalytics && typeof window.ZavoraAnalytics.trackViewItem === 'function') {
      window.ZavoraAnalytics.trackViewItem(product);
    }
  }

  async function initProductRenderer() {
    if (!window.location.pathname.includes('product')) return;

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
