function initHomeLaunchGate() {
  return false;
}

function showMaintenancePage() {
  return false;
}

if (showMaintenancePage()) {
  document.documentElement.classList.remove('maintenance-mode');
}

if (!initHomeLaunchGate()) {
const products = [];

const CART_KEY = 'zavoraCart';
const ADMIN_PRODUCTS_KEY = 'zavoraAdminProducts';
const SELECTED_PRODUCT_KEY = 'zavoraSelectedProduct';
const WISHLIST_KEY = 'zavoraWishlist';
const state = { cart: [], visible: 23, printfulProducts: (function() { try { return JSON.parse(localStorage.getItem('zavora_cached_products') || '[]'); } catch(e) { return []; } })(), printfulLoaded: false };
let homeAuthUser = null;
let homeAuthChecked = false;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const homeIcons = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"></path></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.2c-1.8-1.7-4.7-1.6-6.4.2L12 6.6l-1.1-1.2c-1.7-1.8-4.6-1.9-6.4-.2-1.9 1.8-2 4.8-.2 6.7L12 19.7l7.7-7.8c1.8-1.9 1.7-4.9-.2-6.7Z"></path></svg>'
};

async function homeAuthSession(force = false) {
  if (homeAuthChecked && !force) return homeAuthUser;
  try {
    const response = await fetch('/api/auth-session', { credentials: 'include' });
    homeAuthUser = response.ok ? (await response.json()).user : null;
  } catch (error) {
    homeAuthUser = null;
  }
  homeAuthChecked = true;
  return homeAuthUser;
}

function hydrateHomeHeaderIcons() {
  document.querySelectorAll('[data-search]').forEach((button) => { button.innerHTML = homeIcons.search; });
  document.querySelectorAll('[data-dark]').forEach((button) => { button.innerHTML = homeIcons.moon; });
  document.querySelectorAll('[data-panel]').forEach((button) => { button.innerHTML = homeIcons.heart; });
}

document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.style.display = 'none'; image.closest('.product-img-wrap, .product-figure, .card-media, .daily-feature-media') && (image.closest('.product-img-wrap, .product-figure, .card-media, .daily-feature-media').style.background = '#111');
}, true);

const header = $('#siteHeader');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24));

function money(value) {
  return `$${value.toLocaleString('en-US')}`;
}

function loadSavedCart() {
  try {
    state.cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    state.cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function rememberSelectedProduct(product) {
  if (!product) return;
  if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackViewItem(product);
  localStorage.setItem(SELECTED_PRODUCT_KEY, JSON.stringify(product));
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveWishlist(items) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function addWishlistProduct(product) {
  if (!product) return;
  const wishlist = getWishlist();
  const id = String(product.printfulId || product.id || product.name);
  if (!wishlist.some((item) => String(item.printfulId || item.id || item.name) === id)) {
    wishlist.push(product);
    saveWishlist(wishlist);
  }
  syncHomeWishlistCount();
  if (typeof renderWishlistDrawer === 'function') renderWishlistDrawer();
}

function homeProductKey(product) {
  return String(product?.printfulId || product?.id || product?.name || '');
}

function homeWishlistHas(product) {
  const key = homeProductKey(product);
  return getWishlist().some((item) => homeProductKey(item) === key);
}

function normalizedSearch(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function homeProductMatchesSearch(product, term = '') {
  const clean = normalizedSearch(term);
  if (!clean) return true;
  const raw = `${product.name || ''} ${product.category || ''} ${(product.collection || []).join(' ')} ${(product.colors || []).join(' ')}`;
  const aliases = /t-?shirt|tee|tees/i.test(raw) ? ' tshirt tshirts tee tees' : '';
  return normalizedSearch(`${raw}${aliases}`).includes(clean);
}

function normalizeAdminProduct(product, index) {
  const image = product.img || product.image || product.thumbnail || product.images?.[0] || 'assets/studio-wide-trouser.png';
  const collections = Array.isArray(product.collection)
    ? product.collection
    : (product.collection ? [product.collection, 'new'] : ['new', 'streetwear']);

  return {
    ...product,
    id: product.id || product.printfulId || `ZVR-${Date.now() + index}`,
    name: product.name || product.title || 'Zavora Product',
    category: product.category || 'new',
    collection: collections,
    color: product.color || 'black',
    sizes: product.sizes || ['S', 'M', 'L', 'XL'],
    price: Number(product.price || 54.89),
    sale: Boolean(product.sale),
    popularity: Number(product.popularity || 100),
    badge: product.badge || 'NEW',
    img: image,
    alt: product.alt || image,
    description: product.description || ''
  };
}


function uniqueHomeProducts(productsList = []) {
  const seen = new Set();
  return productsList.filter((product) => {
    const key = String(product.printfulId || product.id || product.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRealHomeProduct(product = {}) {
  if (!product || !product.name) return false;
  const text = `${product.name || ''} ${product.title || ''} ${product.category || ''}`.toLowerCase();
  const blockedProduct = /(napkin|placemat|place\s*mat|tablecloth|table\s*cloth|coaster|towel|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|apron|pet|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|drinkware|water bottle|card|postcard|puzzle|flag)/i;
  return !blockedProduct.test(text);
}

function isCapHatProduct(product = {}) {
  const text = `${product.name || ''} ${product.title || ''} ${product.description || ''} ${product.category || ''} ${(product.collection || []).join ? product.collection.join(' ') : product.collection || ''}`.toLowerCase();
  return /(cap|hat|beanie|dad\s*hat|snapback|trucker|bucket\s*hat|visor)/i.test(text);
}

const STOREFRONT_APPAREL_CATALOG = [];

function clearDemoProductCaches() {
  [
    'zavoraImportedCatalog',
    'zavora_imported_products',
    'printful_staged_products',
    'zavoraProducts',
    'zavoraSelectedProduct'
  ].forEach((key) => {
    try { localStorage.removeItem(key); } catch (error) {}
  });
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith('zavoraCatalog_'))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {}
}

function getHomeProducts() {
  const removedIds = new Set(JSON.parse(localStorage.getItem('zavoraRemovedProducts') || '[]'));
  const rawList = uniqueHomeProducts(state.printfulProducts.map(normalizeAdminProduct));

  const homeList = rawList
    .filter(p => p && p.id && isRealHomeProduct(p) && !removedIds.has(String(p.id)) && !removedIds.has(String(p.printfulId)))
    .map((product) => ({
      ...product,
      img: product.img || product.image || product.images?.[0] || 'assets/studio-wide-trouser.png',
      alt: product.alt || product.images?.[1] || product.image || product.img || product.images?.[0] || 'assets/studio-wide-trouser.png',
      collection: Array.isArray(product.collection) ? product.collection : [product.collection || 'new'],
      colors: Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'default'],
      sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL']
    }));
  let capHatCount = 0;
  return homeList
    .sort((a, b) => Number(isCapHatProduct(a)) - Number(isCapHatProduct(b)))
    .filter((product) => {
      if (!isCapHatProduct(product)) return true;
      capHatCount += 1;
      return capHatCount <= 2;
    });
}




async function loadPrintfulProducts() {
  if (state.printfulLoaded) return;
  state.printfulLoaded = true;

  try {
    const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
    if (cached && cached.length) {
      state.printfulProducts = cached;
      renderHomeProductSections();
      renderProducts();
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/products?status=all&limit=100', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length) {
        state.printfulProducts = data.products;
        try { localStorage.setItem('zavora_cached_products', JSON.stringify(data.products)); } catch(e) {}
        renderHomeProductSections();
        renderProducts();
      }
    }
  } catch (error) {}
}



function dailyProduct(productsForDay) {
  if (!productsForDay.length) return null;
  const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  return productsForDay[dayNumber % productsForDay.length];
}

function renderDailyFeature() {
  const anchor = document.querySelector('.home-product-sections');
  if (!anchor || document.querySelector('.daily-feature')) return;
  const product = dailyProduct(getHomeProducts());
  if (!product) return;
  anchor.insertAdjacentHTML('beforebegin', `
    <section class="daily-feature section" aria-label="Daily featured product">
      <div class="daily-feature-copy">
        <p class="eyebrow">Daily Product Edit</p>
        <h2>${product.name}</h2>
        <p>${product.description || "Today rotating Zavora feature, selected for premium streetwear styling."}</p>
        <div class="daily-feature-meta">
          <span>${product.badge}</span>
          <strong>${money(product.price)}</strong>
        </div>
        <div class="daily-feature-actions">
          <button data-add="${product.id}">Add to Bag</button>
          <a href="product.html?id=${encodeURIComponent(product.id)}" data-home-open-product="${product.id}">View Product</a>
        </div>
      </div>
      <a class="daily-feature-media" href="product.html?id=${encodeURIComponent(product.id)}" data-home-open-product="${product.id}" aria-label="Open ${product.name}">
        <img src="${product.img}" alt="${product.name}" loading="lazy" decoding="async">
      </a>
    </section>
  `);
}

const homeShelfDefinitions = [
  { title: 'New Arrivals', href: 'new-arrivals.html', match: (product, index) => index < 12 },
  { title: 'Trending Now', href: 'trending.html', match: (product, index) => index >= 4 && index < 16 },
  { title: 'Best Sellers', href: 'best-sellers.html', match: (product, index) => index >= 8 && index < 20 },
  { title: 'Premium Hoodies', href: 'shop.html?category=hoodies', match: (product) => ['hoodies', 'cropped-hoodies', 'zip-hoodies'].includes(product.category) || /hoodie/i.test(product.name || '') },
  { title: 'Premium Sweatshirts', href: 'shop.html?category=sweatshirts', match: (product) => product.category === 'sweatshirts' || /sweatshirt|crewneck/i.test(product.name || '') },
  { title: 'Luxury T-Shirts', href: 'shop.html?category=tees', match: (product) => ['tees', 'oversized-tees', 'heavyweight-tees', 'baby-tees'].includes(product.category) || /tee|t-shirt/i.test(product.name || '') },
  { title: 'Staff Picks', href: 'shop.html?sort=popular', match: (product, index) => index % 2 === 0 },
  { title: 'Recommended For You', href: 'recommended-products.html', match: (product, index) => index < 24 },
  { title: 'Recently Added', href: 'new-arrivals.html', match: (product, index) => index < 24 },
  { title: 'Under $100', href: 'shop.html?under=100', match: (product) => Number(product.price || 0) <= 100 }
];

function renderHomeProductSections() {
  const container = document.querySelector('#homeProductSections');
  if (!container) return;
  const catalog = getHomeProducts();
  if (!catalog.length) {
    container.innerHTML = state.printfulLoaded
      ? '<p class="catalog-loading"></p>'
      : '<p class="catalog-loading"></p>';
    return;
  }
  const used = new Set();
  const shelves = homeShelfDefinitions.map((section) => {
    const items = catalog
      .filter((product, index) => section.match(product, index))
      .filter((product) => !used.has(String(product.printfulId || product.id || product.name)))
      .slice(0, 10);
    items.forEach((product) => used.add(String(product.printfulId || product.id || product.name)));
    if (!items.length) return '';
    return `
      <section class="home-product-shelf" aria-label="${section.title}">
        <div class="section-title">
          <div><p class="eyebrow">${section.title}</p><h2>${section.title}</h2></div>
          <a class="text-link" href="${section.href}">View all</a>
        </div>
        <div class="home-product-slider">
          ${items.map(productCard).join('')}
        </div>
      </section>
    `;
  }).filter(Boolean);
  container.innerHTML = shelves.length ? shelves.join('') : (catalog.length ? '<div class="home-product-slider">' + catalog.slice(0, 12).map(productCard).join('') + '</div>' : '');
}

function renderProducts() {
  const grid = document.querySelector('#productGrid');
  if (!grid) return; // Only execute if product grid exists (on shop pages)

  const category = $('#categoryFilter')?.value || 'all';
  const collection = $('#collectionFilter')?.value || 'all';
  const color = $('#colorFilter')?.value || 'all';
  const size = $('#sizeFilter')?.value || 'all';
  const under = Number($('#priceFilter')?.value || 999);
  const sale = $('#saleFilter')?.checked || false;
  const sort = $('#sortFilter')?.value || 'new';

  let filtered = getHomeProducts().filter((product) => {
    return (category === 'all' || product.category === category)
      && (collection === 'all' || product.collection.includes(collection))
      && (color === 'all' || (product.colors || [product.color]).includes(color))
      && (size === 'all' || product.sizes.includes(size))
      && product.price <= under
      && (!sale || product.sale);
  });

  filtered.sort((a, b) => {
    if (sort === 'low') return a.price - b.price;
    if (sort === 'high') return b.price - a.price;
    if (sort === 'popular') return b.popularity - a.popularity;
    if (sort === 'best') return Number(b.collection.includes('best')) - Number(a.collection.includes('best'));
    return Number(b.id || b.printfulId || 0) - Number(a.id || a.printfulId || 0);
  });

  const countBadge = $('#productCount');
  if (countBadge) countBadge.textContent = filtered.length;

  if (!state.printfulLoaded && !filtered.length) {
    grid.innerHTML = '<p class="catalog-loading"></p>';
    return;
  }
  grid.innerHTML = filtered.length ? filtered.slice(0, state.visible).map(productCard).join('') : '<p class="catalog-loading">No products are live yet. Import a Printful product from admin to show it here.</p>';
}


function productCard(product) {
  const rawColors = (product.colors || [product.color || 'default']).filter(c => c && c !== 'default' && c !== 'original');
  const colors = rawColors.length ? rawColors : ['black'];
  const visibleColors = colors.slice(0, 5);
  const extraColors = colors.length - 5;

  const sizes = (product.sizes || ['S', 'M', 'L', 'XL']).filter(Boolean);
  const visibleSizes = sizes.slice(0, 5);
  const extraSizes = sizes.length - 5;

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-media">
        <img src="${product.img}" alt="${product.name}" loading="lazy" decoding="async">
        <img class="alt" src="${product.alt || product.img}" alt="${product.name} alternate view" loading="lazy" decoding="async">
        <span class="badge">${product.badge || 'NEW'}</span>
        <button class="wish ${homeWishlistHas(product) ? 'active' : ''}" data-home-wishlist="${product.id}" aria-label="Add ${product.name} to wishlist">♡</button>
      </div>
      <div class="product-info">
        <div class="product-info-top">
          <h3>${product.name}</h3>
          <div class="meta">
            <span style="font-size:12px;color:var(--muted);text-transform:capitalize;">${product.category || 'luxury'}</span>
            <strong class="${product.sale ? 'sale' : ''}">${product.compareAt ? `<s>${money(product.compareAt)}</s> ` : ''}${money(product.price)}</strong>
          </div>
          <div class="swatches" aria-label="Color variants">
            ${visibleColors.map(color => `<span class="swatch" title="${color}" style="background:${swatch(color)}"></span>`).join('')}
            ${extraColors > 0 ? `<span style="font-size:10px;color:#666;font-weight:600;">+${extraColors}</span>` : ''}
          </div>
          <div class="sizes" aria-label="Size selector">
            ${visibleSizes.map(size => `<button class="size" type="button">${size}</button>`).join('')}
            ${extraSizes > 0 ? `<span style="font-size:10px;color:#666;font-weight:600;">+${extraSizes}</span>` : ''}
          </div>
        </div>
        <div class="card-actions">
          <button type="button" data-add="${product.id}">Quick add</button>
          <button type="button" data-view="${product.id}">Quick view</button>
        </div>
      </div>
    </article>
  `;
}

function swatch(color) {
  return { black: '#050505', white: '#fff', gray: '#aaa', blue: '#2d5f9a', green: '#4f6f52', red: '#9b1c1c', pink: '#e6a4b4', purple: '#6a4c93', brown: '#8b6f47', default: 'linear-gradient(135deg,#111 0 50%,#fff 50% 100%)', gold: '#c9a227' }[color] || color || '#111';
}

function updateHeaderCartBadges() {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem('zavoraCart') || localStorage.getItem('zavora_cart') || '[]');
  } catch(e) {}

  const totalQty = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.qty || 1), 0) : 0;

  document.querySelectorAll('[data-page-cart], .cart-button, #cartCount').forEach(el => {
    if (el.tagName === 'A' || el.tagName === 'BUTTON') {
      el.textContent = `Bag ${totalQty}`;
    } else {
      el.textContent = String(totalQty);
    }
  });
}

function showCartToast(item) {
  let toast = document.getElementById('zavoraCartToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zavoraCartToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #111111;
      color: #ffffff;
      padding: 16px 22px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: inherit;
      font-size: 14px;
      border: 1px solid #333;
      transform: translateY(100px);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <img src="${item.img}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #444;">
    <div>
      <strong style="display:block;color:#fff;font-weight:700;font-size:13px;">Added to Bag!</strong>
      <span style="color:#aaa;font-size:12px;">${item.name} (${item.color || 'Original'} / ${item.size || 'M'})</span>
    </div>
    <a href="checkout.html" style="background:#ffffff;color:#111;padding:6px 14px;border-radius:6px;font-weight:800;font-size:12px;text-decoration:none;margin-left:8px;text-transform:uppercase;letter-spacing:0.5px;">Checkout &rarr;</a>
  `;

  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';
  }, 4000);
}

function addToCart(id, color, size, qty = 1) {
  let itemToAdd = null;

  const homeProd = getHomeProducts().find(item => String(item.id) === String(id));
  if (homeProd) {
    itemToAdd = {
      id: String(homeProd.id),
      name: homeProd.name,
      price: homeProd.price,
      img: homeProd.img,
      color: color || homeProd.color || 'Black',
      size: size || homeProd.sizes?.[0] || 'M',
      qty: Number(qty) || 1
    };
  } else {
    const mainName = document.querySelector('h1')?.textContent?.trim();
    const mainPriceEl = document.querySelector('.sale-price');
    const mainPrice = mainPriceEl ? Number(mainPriceEl.dataset.price || mainPriceEl.textContent.replace(/[^0-9.]/g, '')) : 94.89;
    const mainImg = document.querySelector('#zavoraMainImage')?.src || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg';
    const selColor = color || document.getElementById('zavoraSelectedColor')?.textContent?.trim() || 'Black';
    const selSize = size || document.getElementById('zavoraSelectedSize')?.textContent?.trim() || 'M';

    itemToAdd = {
      id: String(id || '862'),
      name: mainName || `Zavora Product #${id}`,
      price: mainPrice,
      img: mainImg,
      color: selColor,
      size: selSize,
      qty: Number(qty) || 1
    };
  }

  try {
    let cart = JSON.parse(localStorage.getItem('zavoraCart') || '[]');
    const existingIdx = cart.findIndex(i => String(i.id) === String(itemToAdd.id) && String(i.color || '').toLowerCase() === String(itemToAdd.color || '').toLowerCase() && String(i.size || '').toLowerCase() === String(itemToAdd.size || '').toLowerCase());
    if (existingIdx > -1) {
      cart[existingIdx].qty += itemToAdd.qty;
    } else {
      cart.push(itemToAdd);
    }
    localStorage.setItem('zavoraCart', JSON.stringify(cart));
    localStorage.setItem('zavora_cart', JSON.stringify(cart));

    if (Array.isArray(state?.cart)) {
      const stateIdx = state.cart.findIndex(i => String(i.id) === String(itemToAdd.id));
      if (stateIdx > -1) state.cart[stateIdx].qty += itemToAdd.qty;
      else state.cart.push(itemToAdd);
    }
  } catch(e) {}

  updateHeaderCartBadges();

  if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackAddToCart(itemToAdd, 1);

  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer) {
    if (typeof renderCart === 'function') renderCart();
    cartDrawer.classList.add('open');
  } else {
    showCartToast(itemToAdd);
  }
}

function renderCart() {
  const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $('#cartCount').textContent = state.cart.reduce((sum, item) => sum + item.qty, 0);
  $('#cartTotal').textContent = money(total);
  $('#shippingText').textContent = total >= 120 ? 'Free shipping unlocked' : `Add ${money(120 - total)} for free shipping`;
  $('#shippingProgress').style.width = `${Math.min(100, total / 120 * 100)}%`;
  $('#cartItems').innerHTML = state.cart.length ? state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div><h3>${item.name}</h3><span>${item.qty} × ${money(item.price)}</span></div>
      <button data-remove="${item.id}" aria-label="Remove ${item.name}">×</button>
    </div>
  `).join('') : '<p>Your bag is ready for something iconic.</p>';
}

function syncHomeWishlistCount() {
  const wishlistButton = $('[data-panel]');
  if (!wishlistButton) return;
  let count = wishlistButton.querySelector('.header-count');
  if (!count) {
    count = document.createElement('span');
    count.className = 'header-count';
    wishlistButton.appendChild(count);
  }
  count.className = 'header-count';
  count.textContent = String(getWishlist().length);
  count.hidden = getWishlist().length === 0;
  wishlistButton.setAttribute('aria-label', 'Wishlist');
}

function openQuickView(id) {
  const product = getHomeProducts().find(item => item.id === Number(id));
  if (!product) return;
  $('#quickViewContent').innerHTML = `
    <img src="${product.img}" alt="${product.name}">
    <p class="eyebrow">${product.badge}</p>
    <h2>${product.name}</h2>
    <p>${money(product.price)} • Estimated USA delivery in 3-5 business days.</p>
    <div class="sizes">${product.sizes.map(size => `<button class="size">${size}</button>`).join('')}</div>
    <p>Size guide, customer reviews, recently viewed, and frequently bought together modules are prepared in this premium product flow.</p>
    <button class="primary-cta" data-add="${product.id}">Add to cart</button>
  `;
  $('#quickView').classList.add('open');
}

function renderSuggestions(term = '') {
  if (term && term.length > 2 && window.ZavoraAnalytics) window.ZavoraAnalytics.trackSearch(term);
  const catalog = getHomeProducts();
  const matches = catalog
    .filter(product => homeProductMatchesSearch(product, term))
    .slice(0, 6);
  $('#suggestions').innerHTML = (matches.length ? matches : catalog.slice(0, 4)).map(product => `
    <button class="search-product" data-search-product="${product.id}">
      <img src="${product.img || 'assets/studio-wide-trouser.png'}" alt="${product.name}">
      <span><strong>${product.name}</strong><br>${money(product.price)} • ${product.category}</span>
    </button>
  `).join('');
}

$$('select, input[type="range"], input[type="checkbox"]').forEach(control => {
  control.addEventListener('input', () => {
    $('#priceValue').textContent = money(Number($('#priceFilter').value));
    state.visible = 23;
    renderProducts();
  });
});

document.addEventListener('click', async (event) => {
  const accountLink = event.target.closest('a[href*="dashboard.html"], a[href="account.html"], a[href="my-account.html"], a[href="wishlist.html"], a[href="orders.html"], a[href="order-history.html"], a[href="addresses.html"], a[href="saved-addresses.html"], a[href="profile.html"], a[href="change-password.html"], [data-profile]');
  if (accountLink && !accountLink.closest('.auth-card')) {
    event.preventDefault();
    const rawHref = accountLink.getAttribute('href') || 'dashboard.html';
    const next = rawHref.includes('dashboard.html') ? rawHref : 'dashboard.html';
    const user = await homeAuthSession(true);
    window.location.href = user ? next : `login.html?next=${encodeURIComponent(next)}`;
    return;
  }

  const searchProduct = event.target.closest('[data-search-product]');
  if (searchProduct) {
    event.preventDefault();
    const product = getHomeProducts().find(item => String(item.id) === String(searchProduct.dataset.searchProduct));
    if (product) rememberSelectedProduct(product);
    window.location.href = product ? `product.html?id=${encodeURIComponent(product.id)}` : 'product.html';
    return;
  }

  const homeWishlist = event.target.closest('[data-home-wishlist]');
  if (homeWishlist) {
    event.preventDefault();
    const product = getHomeProducts().find(item => String(item.id) === String(homeWishlist.dataset.homeWishlist));
    addWishlistProduct(product);
    homeWishlist.classList.add('active');
    const drawer = typeof ensureWishlistDrawer === 'function' ? ensureWishlistDrawer() : null;
    if (drawer) drawer.classList.add('open');
    return;
  }
  const homeOpenProduct = event.target.closest('[data-home-open-product]');
  if (homeOpenProduct) {
    const product = getHomeProducts().find(item => String(item.id) === String(homeOpenProduct.dataset.homeOpenProduct));
    if (product) rememberSelectedProduct(product);
    return;
  }
  const add = event.target.closest('[data-add]');
  const view = event.target.closest('[data-view]');
  const remove = event.target.closest('[data-remove]');
  const checkout = event.target.closest('.checkout, a[href="checkout.html"], [data-buy-now]');
  if (checkout) {
    event.preventDefault();
    const user = await homeAuthSession(true);
    window.location.href = user ? 'checkout.html' : `login.html?next=${encodeURIComponent('checkout.html')}`;
    return;
  }
  if (add) addToCart(add.dataset.add);
  if (view) openQuickView(view.dataset.view);
  if (remove) {
    const targetId = String(remove.dataset.remove || '').trim();
    state.cart = state.cart.filter(item => {
      const itemId = String(item.id || item.printfulId || item._id || '').trim();
      const itemName = String(item.name || '').trim();
      return itemId !== targetId && itemName !== targetId;
    });
    saveCart();
    renderCart();
  }
  if (add || view || remove || event.target.closest('a, button, input, select, textarea')) return;
  const card = event.target.closest('.product-card');
  if (card) {
    const product = getHomeProducts().find(item => String(item.id) === String(card.dataset.productId));
    if (product) rememberSelectedProduct(product);
    window.location.href = product ? `product.html?id=${encodeURIComponent(product.id)}` : 'product.html';
  }
});

$('#clearFilters')?.addEventListener('click', () => {
  $('#categoryFilter').value = 'all';
  $('#collectionFilter').value = 'all';
  $('#colorFilter').value = 'all';
  $('#sizeFilter').value = 'all';
  $('#priceFilter').value = 400;
  $('#saleFilter').checked = false;
  $('#sortFilter').value = 'newest';
  $('#priceValue').textContent = '$400';
  renderProducts();
});

$('#loadMore')?.addEventListener('click', () => {
  state.visible += 4;
  renderProducts();
});

$('[data-cart]')?.addEventListener('click', () => $('#cartDrawer').classList.add('open'));
$('[data-close-cart]')?.addEventListener('click', () => $('#cartDrawer').classList.remove('open'));
$('[data-close-view]')?.addEventListener('click', () => $('#quickView').classList.remove('open'));
const panelButton = $('[data-panel]');
if (panelButton) {
  panelButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (typeof ensureWishlistDrawer === 'function') {
      ensureWishlistDrawer().classList.add('open');
    } else {
      window.location.href = 'wishlist.html';
    }
  });
}
$('[data-close-panel]').addEventListener('click', () => $('#accountPanel').classList.remove('open'));
$('[data-search]').addEventListener('click', () => {
  $('#searchOverlay').classList.add('open');
  renderSuggestions();
  $('#searchInput').focus();
});
$('[data-close-search]').addEventListener('click', () => $('#searchOverlay').classList.remove('open'));
function unlockBodyScroll() {
  document.body.classList.remove('mobile-menu-open');
  document.documentElement.classList.remove('mobile-menu-open');
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
}

function openMobileMenu() {
  $('#mobilePanel').classList.add('open');
  document.body.classList.add('mobile-menu-open');
}

function closeMobileMenu() {
  $('#mobilePanel').classList.remove('open');
  unlockBodyScroll();
}

window.addEventListener('pageshow', unlockBodyScroll);
window.addEventListener('hashchange', unlockBodyScroll);

const megaMenuData = {
  women: {
    label: 'Women edit',
    title: 'Premium women streetwear, clean fits, everyday luxury.',
    href: 'women.html',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    items: [
      ['Oversized Tees', 'oversized-tees'],
      ['Baby Tees', 'baby-tees'],
      ['Hoodies', 'hoodies'],
      ['Cropped Hoodies', 'cropped-hoodies'],
      ['Sweatpants', 'sweatpants'],
      ['Jackets', 'jackets'],
      ['Accessories', 'accessories']
    ]
  },
  men: {
    label: 'Men edit',
    title: 'Structured essentials, heavyweight layers, and relaxed streetwear.',
    href: 'men.html',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    items: [
      ['Oversized Tees', 'oversized-tees'],
      ['Heavyweight Tees', 'heavyweight-tees'],
      ['Hoodies', 'hoodies'],
      ['Zip Hoodies', 'zip-hoodies'],
      ['Cargo Pants', 'cargo-pants'],
      ['Sweatpants', 'sweatpants'],
      ['Jackets', 'jackets'],
      ['Shorts', 'shorts'],
      ['Accessories', 'accessories']
    ]
  }
};

function updateMegaMenu(type) {
  const data = megaMenuData[type] || megaMenuData.women;
  const menu = $('#megaMenu');
  const eyebrow = menu.querySelector('.eyebrow');
  const title = menu.querySelector('h2');
  const grid = menu.querySelector('.mega-grid');
  let visual = menu.querySelector('.mega-visual');
  if (!visual) {
    visual = document.createElement('a');
    visual.className = 'mega-visual';
    visual.setAttribute('aria-label', 'Shop Zavora edit');
    visual.innerHTML = '<img src="" alt="">';
    menu.appendChild(visual);
  }
  if (eyebrow) eyebrow.textContent = data.label;
  if (title) title.textContent = data.title;
  if (visual) {
    visual.href = data.href;
    const img = visual.querySelector('img');
    if (img) {
      img.src = data.image;
      img.alt = `${data.label} Zavora Fashion`;
    }
  }
  if (grid) {
    grid.innerHTML = data.items.map((item) => {
      const label = Array.isArray(item) ? item[0] : item;
      const category = Array.isArray(item) ? item[1] : 'all';
      return `<a href="${data.href}?category=${encodeURIComponent(category)}&label=${encodeURIComponent(label)}">${label}</a>`;
    }).join('');
  }
}

$('[data-open-menu]').addEventListener('click', openMobileMenu);
$('[data-close-mobile]').addEventListener('click', closeMobileMenu);
$$('#mobilePanel a').forEach((link) => link.addEventListener('click', closeMobileMenu));
$('#searchInput').addEventListener('input', (event) => renderSuggestions(event.target.value));
$('#searchInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const term = event.target.value.trim();
    if (term) window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
  }
});

$$('[data-mega]').forEach(button => {
  button.addEventListener('mouseenter', () => {
    updateMegaMenu(button.dataset.mega);
    $('#megaMenu').classList.add('open');
  });
  button.addEventListener('focus', () => {
    updateMegaMenu(button.dataset.mega);
    $('#megaMenu').classList.add('open');
  });
});
$('#megaMenu')?.addEventListener('mouseleave', () => $('#megaMenu').classList.remove('open'));

$('[data-recommend]')?.addEventListener('click', () => {
  $('#collectionFilter').value = 'best';
  $('#sortFilter').value = 'popular';
  location.hash = '#shop';
  renderProducts();
});

hydrateHomeHeaderIcons();
clearDemoProductCaches();
loadSavedCart();
renderDailyFeature();
renderHomeProductSections();
renderProducts();
loadPrintfulProducts();
renderCart();
syncHomeWishlistCount();
}
