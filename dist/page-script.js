const pageHeader = document.querySelector('.page-header');
const quickProducts = [
  'Oversized Tees',
  'Heavyweight Tees',
  'Hoodies',
  'Zip Hoodies',
  'Cargo Pants',
  'Sweatpants',
  'Jackets',
  'Accessories',
  'Gift Cards'
];

const icons = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16.5 16.5 4 4"></path></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"></path></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.2c-1.8-1.7-4.7-1.6-6.4.2L12 6.6l-1.1-1.2c-1.7-1.8-4.6-1.9-6.4-.2-1.9 1.8-2 4.8-.2 6.7L12 19.7l7.7-7.8c1.8-1.9 1.7-4.9-.2-6.7Z"></path></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>'
};

const plainCommercePages = ['login.html', 'dashboard.html', 'sign-up.html', 'forgot-password.html', 'checkout.html', 'order-success.html', 'track-order.html', 'contact.html', 'about.html', 'journal.html', 'return-refund-policy.html', 'returns.html', 'privacy-policy.html', 'terms-conditions.html', 'faq.html'];
const catalogOnlyPages = ['women.html', 'men.html', 'new-arrivals.html', 'collections.html', 'best-sellers.html', 'limited.html', 'shop.html', 'product-filters.html', 'recommended-products.html', 'recently-viewed.html', 'trending.html', 'oversized.html'];
const PAGE_CART_KEY = 'zavoraCart';
const GIFT_CARD_KEY = 'zavoraGiftCards';
const WISHLIST_KEY = 'zavoraWishlist';
const APPLIED_GIFT_KEY = 'zavoraAppliedGiftCard';
const AUTH_OTP_PENDING_KEY = 'zavoraAuthOtpPending';
const ORDER_HISTORY_KEY = 'zavoraOrders';
const SUPPORT_EMAIL = 'support@zavorafashion.com';
const NOREPLY_EMAIL = 'noreply@zavorafashion.com';
const LEGAL_EMAIL = 'legal@zavorafashion.com';
const OFFICIAL_EMAIL = 'zavoraofficial@zavorafashion.com';
const ZAVORA_LOGO = 'assets/zavora-logo.png';
const LAUNCH_PREVIEW_CODE = 'zavora-live';
const ADMIN_PRODUCTS_KEY = 'zavoraAdminProducts';
const SELECTED_PRODUCT_KEY = 'zavoraSelectedProduct';
const PRODUCT_STOCK_KEY = 'zavoraProductStock';
const PENDING_COMMERCE_ACTION_KEY = 'zavoraPendingCommerceAction';
const accountRedirects = {
  'my-account.html': 'dashboard',
  'wishlist.html': 'wishlist',
  'order-history.html': 'orders',
  'saved-addresses.html': 'addresses',
  'change-password.html': 'change-password'
};

function initLaunchGate() {
  return false;
}

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function getSavedCart() {
  try {
    return JSON.parse(localStorage.getItem(PAGE_CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveSavedCart(cart) {
  localStorage.setItem(PAGE_CART_KEY, JSON.stringify(cart));
}

function getLoginUrl(next = window.location.href) {
  const target = String(next || window.location.href);
  return `login.html?next=${encodeURIComponent(target)}`;
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

let authUser = null;
let authSessionLoaded = false;
let authDashboardData = null;

async function fetchAuthSession(force = false) {
  if (authSessionLoaded && !force) return authUser;
  try {
    const response = await fetch('/api/auth-session', { credentials: 'include' });
    if (!response.ok) {
      authUser = null;
    } else {
      const data = await response.json();
      authUser = data.user || null;
    }
  } catch (error) {
    authUser = null;
  }
  authSessionLoaded = true;
  updateAccountLinks();
  return authUser;
}

function getUserAccount() {
  return authUser;
}

function saveUserAccount(account) {
  authUser = account || authUser;
  authSessionLoaded = true;
  updateAccountLinks();
}

function isUserLoggedIn() {
  return !!authUser;
}

function loginUser(account) {
  if (!account) return;
  saveUserAccount(account);
}

function savePendingCommerceAction(type, product, destination = 'cart.html') {
  const payload = {
    type,
    product,
    destination,
    from: window.location.href,
    createdAt: Date.now()
  };
  sessionStorage.setItem(PENDING_COMMERCE_ACTION_KEY, JSON.stringify(payload));
}

function getPendingCommerceAction() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_COMMERCE_ACTION_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function clearPendingCommerceAction() {
  sessionStorage.removeItem(PENDING_COMMERCE_ACTION_KEY);
}

function showLoginRequiredModal(destination = window.location.href) {
  let modal = document.querySelector('[data-login-required-modal]');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'login-required-modal';
    modal.dataset.loginRequiredModal = 'true';
    modal.innerHTML = `
      <div class="login-required-panel">
        <button type="button" class="close" data-close-login-required aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Account required</p>
        <h2>Login to continue.</h2>
        <p>Cart, wishlist, checkout, and rewards are protected for your Zavora account.</p>
        <div class="login-required-actions">
          <a class="primary-cta" data-login-required-link href="#">Login</a>
          <a class="secondary-btn" data-register-required-link href="#">Register</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  const loginUrl = getLoginUrl(destination);
  modal.querySelector('[data-login-required-link]').href = loginUrl;
  modal.querySelector('[data-register-required-link]').href = `sign-up.html?next=${encodeURIComponent(destination)}`;
  modal.classList.add('open');
}

function showOfferClaimedPopup(balance) {
  let modal = document.querySelector('[data-offer-claimed-modal]');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'login-required-modal offer-claimed-modal';
    modal.dataset.offerClaimedModal = 'true';
    modal.innerHTML = `
      <div class="login-required-panel">
        <button type="button" class="close" data-close-offer-claimed aria-label="Close">${icons.close}</button>
        <p class="eyebrow">Zavora rewards</p>
        <h2>Wow offer claimed.</h2>
        <p>$10 Store Credit has been added to your wallet. Confirmation email sent to your account.</p>
        <p><strong data-offer-wallet-balance></strong> wallet balance</p>
        <div class="login-required-actions">
          <a class="primary-cta" href="shop.html">Shop Now</a>
          <button class="secondary-btn" type="button" data-close-offer-claimed>Done</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.querySelector('[data-offer-wallet-balance]').textContent = money(balance || 0);
  modal.classList.add('open');
}

async function requireCommerceAuth(type, product, destination = window.location.href) {
  const user = await fetchAuthSession(true);
  if (user) return true;
  savePendingCommerceAction(type, product || getSelectedProduct(), destination);
  showLoginRequiredModal(destination);
  return false;
}

function cartLineFromProduct(product, overrides = {}) {
  if (!product) return null;
  const color = overrides.color || product.colors?.[0] || product.color || 'Original';
  const size = overrides.size || product.sizes?.[0] || 'M';
  const variant = getVariant(product, color, size);
  const group = productVariantGroup(product, color);
  return {
    id: overrides.id || `${productKey(product)}-${color}-${size}`,
    printfulId: product.printfulId || product.id || null,
    name: product.name,
    price: Number(product.price || 0),
    color,
    sizes: [size],
    qty: 1,
    img: variant?.image || group?.images?.[0] || product.images?.[0] || product.img || product.image
  };
}

function addProductToCart(product, overrides = {}) {
  const line = cartLineFromProduct(product, overrides);
  if (!line) return false;
  const cart = getSavedCart();
  const found = cart.find((item) => String(item.id) === String(line.id));
  if (found) found.qty = Number(found.qty || 1) + 1;
  else cart.push(line);
  saveSavedCart(cart);
  renderSavedCart(document);
  renderSavedCart(document.querySelector('#pageCartDrawer') || document);
  hydrateCheckoutSummary();
  syncHeaderCounts();
  return true;
}

function completePendingCommerceAction() {
  const pending = getPendingCommerceAction();
  if (!pending?.type) return '';
  const product = pending.product || getSelectedProduct();
  clearPendingCommerceAction();
  if (pending.type === 'wishlist') {
    addWishlistProduct(product);
    return 'wishlist.html';
  }
  if (pending.type === 'buy-now') {
    addProductToCart(product);
    return 'checkout.html';
  }
  if (pending.type === 'cart') {
    addProductToCart(product);
    return 'cart.html';
  }
  if (pending.type === 'cart-open' || pending.type === 'checkout') {
    return pending.destination || (pending.type === 'checkout' ? 'checkout.html' : 'cart.html');
  }
  return pending.destination || 'dashboard.html';
}

async function logoutUser() {
  try {
    await fetch('/api/auth-logout', { method: 'POST', credentials: 'include' });
  } catch (error) {
    // Session cookie will still be cleared on the next server-side logout attempt.
  }
  authUser = null;
  authSessionLoaded = true;
  updateAccountLinks();
}

function accountHref(view = 'dashboard') {
  const target = `dashboard.html#${view}`;
  return isUserLoggedIn()
    ? target
    : `login.html?next=${encodeURIComponent(target)}`;
}

function updateAccountLinks() {
  const loggedIn = isUserLoggedIn();
  document.querySelectorAll('[data-profile]').forEach((profile) => {
    profile.href = loggedIn ? 'dashboard.html' : `login.html?next=${encodeURIComponent('dashboard.html')}`;
  });
  document.querySelectorAll('a[data-account-route]').forEach((link) => {
    const view = link.dataset.accountRoute || 'dashboard';
    const target = `dashboard.html#${view}`;
    link.href = loggedIn ? target : `login.html?next=${encodeURIComponent(target)}`;
  });
}

async function loadDashboardData() {
  if (!window.location.pathname.endsWith('dashboard.html')) return null;
  try {
    const response = await fetch('/api/auth-dashboard', { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    authDashboardData = data;
    if (data.user) saveUserAccount(data.user);
    return data;
  } catch (error) {
    return null;
  }
}

function addWishlistProduct(product) {
  if (!product) return;
  const wishlist = getWishlist();
  const id = productKey(product);
  if (!wishlist.some((item) => productKey(item) === id)) {
    wishlist.push(product);
    saveWishlist(wishlist);
  }
  syncHeaderCounts();
  renderWishlistDrawer();
  refreshWishlistButtons();
}

function refreshWishlistButtons() {
  const ids = new Set(getWishlist().map((item) => productKey(item)));
  document.querySelectorAll('[data-home-wishlist], [data-wishlist-product], [data-add-selected-wishlist]').forEach((button) => {
    const id = button.dataset.homeWishlist || button.dataset.wishlistProduct || '';
    const product = id
      ? [...(window.__zavoraCatalogProducts || []), ...(window.__zavoraSearchProducts || [])]
        .find((item) => String(item.id) === String(id) || String(item.printfulId) === String(id))
      : getSelectedProduct();
    const key = product ? productKey(product) : String(id);
    const active = ids.has(key);
    button.classList.toggle('active', active);
    button.setAttribute('aria-label', active ? 'Remove from wishlist' : 'Add to wishlist');
    if (button.dataset.addSelectedWishlist) button.textContent = active ? 'Wishlisted' : 'Wishlist';
  });
}

function productKey(product) {
  return String(product?.printfulId || product?.id || product?.name || 'zavora-product');
}

function rememberSelectedProduct(product) {
  if (!product) return;
  localStorage.setItem(SELECTED_PRODUCT_KEY, JSON.stringify(product));
}

function getSelectedProduct() {
  try {
    return JSON.parse(localStorage.getItem(SELECTED_PRODUCT_KEY));
  } catch (error) {
    return null;
  }
}

function getProductStockMap() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCT_STOCK_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function getProductStock(product) {
  const stockMap = getProductStockMap();
  const saved = Number(stockMap[productKey(product)]);
  if (Number.isFinite(saved)) return saved;
  return Number(product?.stock || 5);
}

function setProductStock(product, stock) {
  const stockMap = getProductStockMap();
  stockMap[productKey(product)] = Math.max(0, Number(stock || 0));
  localStorage.setItem(PRODUCT_STOCK_KEY, JSON.stringify(stockMap));
}

function getVariant(product, color, size) {
  const variants = Array.isArray(product?.variantOptions) ? product.variantOptions : [];
  const normalizedColor = String(color || '').toLowerCase() === 'original' ? 'default' : String(color || '').toLowerCase();
  const normalizedSize = String(size || '').toUpperCase();
  return variants.find((variant) => String(variant.color || '').toLowerCase() === normalizedColor && String(variant.size || '').toUpperCase() === normalizedSize)
    || variants.find((variant) => String(variant.color || '').toLowerCase() === normalizedColor)
    || variants.find((variant) => String(variant.size || '').toUpperCase() === normalizedSize)
    || variants[0];
}

function getSavedOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveSavedOrders(orders) {
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders));
}

function createTestOrder(method = 'PayPal') {
  const cart = getSavedCart();
  if (!cart.length) return null;
  const shippingCost = Number(document.querySelector('input[name="shipping"]:checked')?.value || 0);
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0) + shippingCost;
  const email = document.querySelector('.checkout-form input[type="email"]')?.value.trim().toLowerCase()
    || authUser?.email
    || 'customer@zavorafashion.com';
  const order = {
    id: `ZAV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    email,
    method,
    total,
    shipping: shippingCost,
    items: cart,
    status: method === 'COD' ? 'Order confirmed - Cash on Delivery' : 'Payment received',
    tracking: `ZV${String(Date.now()).slice(-8)}`,
    createdAt: new Date().toISOString()
  };
  const orders = getSavedOrders().filter((item) => item.id !== order.id);
  orders.unshift(order);
  saveSavedOrders(orders);
  localStorage.setItem('zavoraLastOrder', JSON.stringify(order));
  return order;
}

async function requestOrderConfirmation(order) {
  try {
    const response = await fetch('/api/send-order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.email,
        orderId: order.id,
        method: order.method,
        total: order.total,
        items: order.items
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function persistOrder(order) {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        email: order.email,
        customer: authUser?.name || 'Zavora customer',
        payment: order.method,
        method: order.method,
        status: order.status,
        tracking: order.tracking,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt
      })
    });
  } catch (error) {}
}

function cartQuantity() {
  return getSavedCart().reduce((sum, item) => sum + Number(item.qty || 1), 0);
}

function normalizeHeaderSelectors() {
  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = ZAVORA_LOGO;
    document.head.appendChild(favicon);
  }
  if (pageHeader && !pageHeader.querySelector('[data-page-open-menu]')) {
    const menu = document.createElement('button');
    menu.className = 'icon-button mobile-menu';
    menu.type = 'button';
    menu.dataset.pageOpenMenu = 'true';
    menu.setAttribute('aria-label', 'Open menu');
    menu.innerHTML = '<span></span><span></span>';
    pageHeader.prepend(menu);
  }
  if (pageHeader && !document.querySelector('#mobilePanel')) {
    const panel = document.createElement('div');
    panel.className = 'mobile-panel';
    panel.id = 'mobilePanel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <button class="close" data-page-close-mobile aria-label="Close menu"></button>
      <a href="index.html">Home</a>
      <a href="women.html">Women</a>
      <a href="men.html">Men</a>
      <a href="new-arrivals.html">New</a>
      <a href="collections.html">Collections</a>
      <a href="best-sellers.html">Best Sellers</a>
      <a href="limited.html">Limited</a>
      <a href="journal.html">Journal</a>
      <a href="track-order.html">Order Tracking</a>
    `;
    pageHeader.insertAdjacentElement('afterend', panel);
  }
  document.querySelectorAll('.brand').forEach((brand) => {
    if (brand.querySelector('.brand-mark')) return;
    brand.innerHTML = `<img class="brand-mark" src="${ZAVORA_LOGO}" alt="" aria-hidden="true"><span>ZAVORA FASHION</span>`;
  });
  document.querySelectorAll('.footer-brand strong').forEach((brand) => {
    if (brand.querySelector('.brand-mark')) return;
    brand.innerHTML = `<img class="brand-mark" src="${ZAVORA_LOGO}" alt="" aria-hidden="true"><span>ZAVORA FASHION</span>`;
  });
  document.querySelectorAll('.header-actions select').forEach((select) => {
    const values = [...select.options].map((option) => option.textContent.trim()).filter(Boolean);
    const wrapper = document.createElement('div');
    wrapper.className = 'header-dropdown';
    wrapper.innerHTML = `
      <button class="header-select-label" type="button" aria-label="${select.getAttribute('aria-label') || select.value}">
        <span>${select.value || values[0] || ''}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"></path></svg>
      </button>
      <div class="header-dropdown-menu">
        ${values.slice(0, 3).map((value) => `<button type="button" data-dropdown-value="${value}">${value}</button>`).join('')}
      </div>
    `;
    select.replaceWith(wrapper);
  });
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    if (label === 'women') link.dataset.mega = 'women';
    if (label === 'men') link.dataset.mega = 'men';
  });
  if (pageHeader && !document.querySelector('#megaMenu')) {
    pageHeader.insertAdjacentHTML('afterend', `
      <div class="mega-menu" id="megaMenu" aria-hidden="true">
        <div>
          <p class="eyebrow">Women edit</p>
          <h2>Premium women streetwear, clean fits, everyday luxury.</h2>
          <div class="mega-grid"></div>
        </div>
        <a class="mega-visual" href="women.html" aria-label="Shop women">
          <img src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80" alt="Zavora women streetwear" loading="lazy">
        </a>
      </div>
    `);
  }
}

const pageMegaMenuData = {
  women: {
    label: 'Women edit',
    title: 'Oversized tees, hoodies, sweat sets, jackets, and accessories for premium everyday styling.',
    href: 'women.html',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    items: [['Oversized Tees', 'oversized-tees'], ['Baby Tees', 'baby-tees'], ['Hoodies', 'hoodies'], ['Cropped Hoodies', 'cropped-hoodies'], ['Sweatpants', 'sweatpants'], ['Jackets', 'jackets'], ['Accessories', 'accessories']]
  },
  men: {
    label: 'Men edit',
    title: 'Heavyweight layers, oversized fits, cargos, sweatpants, jackets, and accessories.',
    href: 'men.html',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    items: [['Oversized Tees', 'oversized-tees'], ['Heavyweight Tees', 'heavyweight-tees'], ['Hoodies', 'hoodies'], ['Zip Hoodies', 'zip-hoodies'], ['Cargo Pants', 'cargo-pants'], ['Sweatpants', 'sweatpants'], ['Jackets', 'jackets'], ['Shorts', 'shorts'], ['Accessories', 'accessories']]
  }
};

function initPageMegaMenu() {
  const menu = document.querySelector('#megaMenu');
  if (!menu || menu.dataset.ready) return;
  menu.dataset.ready = 'true';
  function update(type) {
    const data = pageMegaMenuData[type] || pageMegaMenuData.women;
    menu.querySelector('.eyebrow').textContent = data.label;
    menu.querySelector('h2').textContent = data.title;
    const visual = menu.querySelector('.mega-visual');
    if (visual) {
      visual.href = data.href;
      const img = visual.querySelector('img');
      if (img) {
        img.src = data.image;
        img.alt = `${data.label} Zavora Fashion`;
      }
    }
    menu.querySelector('.mega-grid').innerHTML = data.items.map((item) => {
      const label = Array.isArray(item) ? item[0] : item;
      const category = Array.isArray(item) ? item[1] : String(item).toLowerCase().replace(/\s+/g, '-');
      return `<a href="${data.href}?category=${encodeURIComponent(category)}&label=${encodeURIComponent(label)}">${label}</a>`;
    }).join('');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
  }
  document.querySelectorAll('[data-mega]').forEach((link) => {
    link.addEventListener('mouseenter', () => update(link.dataset.mega));
    link.addEventListener('focus', () => update(link.dataset.mega));
  });
  menu.addEventListener('mouseleave', () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  });
}

function hydrateHeaderIcons() {
  document.querySelectorAll('[data-search], [data-page-search], a[aria-label="Search"], button[aria-label="Search"]').forEach((button) => {
    button.innerHTML = icons.search;
  });
  document.querySelectorAll('[data-dark]').forEach((button) => {
    button.innerHTML = icons.moon;
  });
  document.querySelectorAll('.header-actions a[aria-label="Account"], .header-actions button[aria-label="Account"], .header-actions a[aria-label="Wishlist"], .header-actions button[aria-label="Wishlist"], .header-actions a[href="account.html"]').forEach((button) => {
    button.innerHTML = icons.heart;
  });
  document.querySelectorAll('.header-actions').forEach((actions) => {
    if (actions.querySelector('[data-profile]')) return;
    const profile = document.createElement('a');
    profile.className = 'icon-button';
    profile.href = accountHref('dashboard');
    profile.dataset.profile = 'true';
    profile.setAttribute('aria-label', 'User profile');
    profile.innerHTML = icons.user;
    const cart = actions.querySelector('.cart-button');
    actions.insertBefore(profile, cart || null);
  });
}

function syncHeaderCounts() {
  document.querySelectorAll('.header-actions .cart-button').forEach((cart) => {
    const homeCount = cart.querySelector('#cartCount');
    if (homeCount) return;
    cart.textContent = `Bag ${cartQuantity()}`;
  });

  document.querySelectorAll('.header-actions a[aria-label="Account"], .header-actions button[aria-label="Account"], .header-actions a[aria-label="Wishlist"], .header-actions button[aria-label="Wishlist"], .header-actions a[href="account.html"]').forEach((button) => {
    if (button.dataset.profile) return;
    let count = button.querySelector('.header-count');
    if (!count) {
      count = document.createElement('span');
      count.className = 'header-count';
      button.appendChild(count);
    }
    count.className = 'header-count';
    count.textContent = String(getWishlist().length);
    count.hidden = getWishlist().length === 0;
    button.setAttribute('aria-label', 'Wishlist');
  });
}

function hydrateCloseIcons(scope = document) {
  scope.querySelectorAll('.close').forEach((button) => {
    button.innerHTML = icons.close;
  });
}

function initPageMobileMenu() {
  const panel = document.querySelector('#mobilePanel');
  if (!panel) return;
  const open = () => {
    panel.classList.add('open');
    document.body.classList.add('mobile-menu-open');
  };
  const close = () => {
    panel.classList.remove('open');
    document.body.classList.remove('mobile-menu-open');
  };
  document.querySelectorAll('[data-page-open-menu], [data-open-menu]').forEach((button) => {
    button.addEventListener('click', open);
  });
  document.querySelectorAll('[data-page-close-mobile], [data-close-mobile]').forEach((button) => {
    button.addEventListener('click', close);
  });
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
}

function syncPageHeader() {
  if (pageHeader) {
    pageHeader.classList.toggle('scrolled', window.scrollY > 24);
  }
}

async function enforceAuthState() {
  await fetchAuthSession(true);
  const pageName = window.location.pathname.split('/').pop();
  const protectedCommercePages = ['cart.html', 'checkout.html', 'wishlist.html', 'rewards.html'];
  if (pageName === 'logout.html') {
    await logoutUser();
    window.location.replace('login.html');
    return;
  }
  if (protectedCommercePages.includes(pageName) && !isUserLoggedIn()) {
    window.location.replace(`login.html?next=${encodeURIComponent(pageName)}`);
    return;
  }
  if (pageName === 'dashboard.html' && !isUserLoggedIn()) {
    window.location.replace('login.html?next=dashboard.html');
    return;
  }
  if (accountRedirects[pageName]) {
    if (isUserLoggedIn()) {
      window.location.replace(`dashboard.html#${accountRedirects[pageName]}`);
    } else {
      window.location.replace(`login.html?next=${encodeURIComponent(`dashboard.html#${accountRedirects[pageName]}`)}`);
    }
    return;
  }
  if ((pageName === 'login.html' || pageName === 'sign-up.html' || pageName === 'register.html') && isUserLoggedIn()) {
    window.location.href = 'dashboard.html';
  }
  updateAccountLinks();
  document.querySelectorAll('.login-hint').forEach((hint) => hint.remove());
}

const accountViews = {
  dashboard: `
    <article class="dashboard-card"><span>01</span><h3>Recent Order</h3><p>No orders yet. Your first checkout will appear here.</p><a class="text-link" href="track-order.html">Track order</a></article>
    <article class="dashboard-card"><span>02</span><h3>Wishlist</h3><p>No saved products yet.</p><button class="text-link" type="button" data-dashboard-view="wishlist">Open wishlist</button></article>
    <article class="dashboard-card"><span>03</span><h3>Saved Addresses</h3><p>No saved address yet.</p><button class="text-link" type="button" data-dashboard-view="addresses">Manage addresses</button></article>
    <article class="dashboard-card"><span>04</span><h3>Profile</h3><p>Your secure Zavora profile is ready.</p><button class="text-link" type="button" data-dashboard-view="profile">Edit profile</button></article>
  `,
  orders: `
    <article class="dashboard-card dashboard-wide"><span>Orders</span><h3>No orders yet</h3><p>Your order history appears here after checkout.</p></article>
  `,
  wishlist: `
    <article class="dashboard-card dashboard-wide"><span>Wishlist</span><h3>Saved Zavora pieces</h3><p>Wishlist items show here and stay inside dashboard.</p><button class="secondary-btn slim-btn" type="button" data-add-wishlist>Add product</button></article>
  `,
  addresses: `
    <article class="dashboard-card dashboard-wide"><span>Primary Address</span><h3>No saved address</h3><p>Add a delivery address for faster checkout.</p></article>
    <article class="dashboard-card dashboard-wide address-form"><span>Add Address</span><h3>Add new delivery address</h3><div class="mini-form"><input placeholder="Full name"><input placeholder="Street address"><input placeholder="City"><input placeholder="ZIP code"></div><button class="secondary-btn slim-btn" type="button" data-add-address>Add address</button></article>
  `,
  profile: `
    <article class="dashboard-card dashboard-wide"><span>Profile</span><h3 data-profile-name>Zavora Customer</h3><p>Email: <strong data-profile-email></strong> / Country: USA / Currency: USD</p><div class="mini-form"><input data-profile-name-input placeholder="Full name"></div><button class="text-link" type="button" data-profile-save>Save profile</button></article>
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Password protected</h3><p>Your email stays locked. Only your profile name can be edited here.</p></article>
  `,
  'change-password': `
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Change Password</h3><p>Update your Zavora account password for secure checkout and saved address access.</p><div class="mini-form"><input type="password" placeholder="Current password"><input type="password" placeholder="New password"><input type="password" placeholder="Confirm password"></div><button class="secondary-btn slim-btn" type="button" data-password-save>Update password</button></article>
    <article class="dashboard-card dashboard-wide"><span>Protected Account</span><h3>Secure session</h3><p>Your login is protected by an encrypted server session cookie.</p></article>
  `
};

function getGiftCards() {
  try {
    return JSON.parse(localStorage.getItem(GIFT_CARD_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveGiftCards(cards) {
  localStorage.setItem(GIFT_CARD_KEY, JSON.stringify(cards));
}

function getPendingSignupOtp() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_OTP_PENDING_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function savePendingSignupOtp(payload) {
  sessionStorage.setItem(AUTH_OTP_PENDING_KEY, JSON.stringify(payload));
}

function clearPendingSignupOtp() {
  sessionStorage.removeItem(AUTH_OTP_PENDING_KEY);
}

function otpErrorNode(form) {
  let node = form.querySelector('[data-signup-error]');
  if (!node) {
    node = document.createElement('p');
    node.className = 'login-error';
    node.dataset.signupError = 'true';
    form.appendChild(node);
  }
  return node;
}

async function requestWelcomeEmail(email, name) {
  try {
    const response = await fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, name })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function requestNewsletterEmail(email) {
  try {
    const response = await fetch('/api/send-newsletter-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function requestAuthStart(payload) {
  try {
    const response = await fetch('/api/auth-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to send OTP');
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function requestPasswordLogin(email, password) {
  try {
    const response = await fetch('/api/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function verifyAuthOtp(payload) {
  try {
    const response = await fetch('/api/auth-verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function requestPasswordReset(email) {
  try {
    const response = await fetch('/api/auth-forgot-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to send reset OTP');
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function renderSignupOtpStep(form, payload) {
  form.classList.add('otp-mode');
  form.innerHTML = `
    <div class="otp-panel">
      <p class="eyebrow">Email Verification</p>
      <h2>Enter your 6-digit OTP</h2>
      <p>We sent a verification code to <strong>${payload.email}</strong>. This code expires in 10 minutes.</p>
      <input inputmode="numeric" maxlength="6" pattern="[0-9]*" placeholder="6-digit code" data-signup-otp-input>
      <button class="primary-cta" type="button" data-verify-signup-otp>Verify & Create Account</button>
      <button class="text-link otp-link" type="button" data-resend-signup-otp>Resend OTP</button>
      <p class="otp-note">OTP sent from ${NOREPLY_EMAIL}. Check inbox and spam folder.</p>
    </div>
  `;
  form.querySelector('[data-signup-otp-input]')?.focus();
}

function renderResetOtpStep(form, email) {
  form.classList.add('otp-mode');
  form.innerHTML = `
    <div class="otp-panel">
      <p class="eyebrow">Password Reset</p>
      <h2>Enter reset OTP</h2>
      <p>We sent a password reset code to <strong>${email}</strong>.</p>
      <input inputmode="numeric" maxlength="6" pattern="[0-9]*" placeholder="6-digit code" data-reset-otp-input>
      <input type="password" placeholder="New password" autocomplete="new-password" data-reset-password>
      <input type="password" placeholder="Confirm password" autocomplete="new-password" data-reset-confirm>
      <button class="primary-cta" type="button" data-verify-reset-otp>Reset Password</button>
      <button class="text-link otp-link" type="button" data-resend-reset-otp>Resend OTP</button>
      <p class="otp-note">After verification you will be logged in automatically.</p>
    </div>
  `;
  form.querySelector('[data-reset-otp-input]')?.focus();
}

function renderRegisterPage() {
  if (!window.location.pathname.endsWith('register.html')) return;
  const main = document.querySelector('main');
  if (!main) return;
  main.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <p class="eyebrow">Create Account</p>
        <h1>Join Zavora</h1>
        <p>Signup requires email OTP verification. Account will not be created until the code is verified.</p>
        <form class="form-panel">
          <input placeholder="Full name" autocomplete="name">
          <input placeholder="Email address" type="email" autocomplete="email">
          <input placeholder="Password" type="password" autocomplete="new-password">
          <a class="primary-cta" href="dashboard.html">Send OTP</a>
          <div class="auth-links"><span>Already have an account?</span><a class="text-link" href="login.html">Login</a></div>
        </form>
      </div>
      <aside class="auth-aside">
        <strong>ZAVORA FASHION</strong>
        <p>Your account is protected with a one-time verification code before dashboard access.</p>
        <div class="auth-perks"><span>Email OTP</span><span>Secure Signup</span><span>Wishlist</span><span>Order Tracking</span></div>
      </aside>
    </section>
  `;
}

function resumePendingSignupOtp() {
  if (!window.location.pathname.endsWith('sign-up.html') && !window.location.pathname.endsWith('register.html')) return;
  const pending = getPendingSignupOtp();
  const form = document.querySelector('.auth-card .form-panel');
  if (!pending || !form) return;
  renderSignupOtpStep(form, pending);
}

function uniqueGiftCode() {
  const usedCodes = new Set(getGiftCards().map((card) => card.code));
  let code = '';
  do {
    const cryptoPart = window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(4)), (value) => value.toString(36).padStart(2, '0')).join('').slice(0, 8)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    code = `ZVG-${new Date().getFullYear()}-${cryptoPart.toUpperCase()}`;
  } while (usedCodes.has(code));
  return code;
}

function setDashboardView(view = 'dashboard') {
  const grid = document.querySelector('.dashboard-grid');
  if (!grid || !accountViews[view]) return;
  grid.innerHTML = accountViews[view];
  if (view === 'dashboard') {
    const wishlistCard = [...grid.querySelectorAll('.dashboard-card')].find((card) => card.querySelector('h3')?.textContent.trim() === 'Wishlist');
    const count = getWishlist().length;
    const copy = wishlistCard?.querySelector('p');
    if (copy) copy.textContent = count ? `${count} saved product${count === 1 ? '' : 's'} in your wishlist.` : 'No saved products yet.';
    const latestOrder = getSavedOrders()[0];
    const orderCard = [...grid.querySelectorAll('.dashboard-card')].find((card) => card.querySelector('h3')?.textContent.trim() === 'Recent Order');
    if (orderCard) {
      orderCard.querySelector('p').textContent = latestOrder ? `#${latestOrder.id.replace(/^#/, '')} is ${latestOrder.status || 'active'}.` : 'No orders yet. Your first checkout will appear here.';
      const link = orderCard.querySelector('a');
      if (link && latestOrder) link.href = `track-order.html?order=${encodeURIComponent(latestOrder.id)}&email=${encodeURIComponent(latestOrder.email)}`;
    }
  }
  if (view === 'wishlist') {
    const wishlist = getWishlist();
    grid.innerHTML = `
      <article class="dashboard-card dashboard-wide"><span>Wishlist</span><h3>Saved Zavora pieces</h3><p>${wishlist.length ? `${wishlist.length} saved product${wishlist.length === 1 ? '' : 's'}.` : 'Wishlist is empty. Add products with the heart icon.'}</p></article>
      ${wishlist.map((item) => `
        <article class="wishlist-item" data-wishlist-card="${productKey(item)}">
          <button class="remove-x" type="button" data-remove-wishlist="${productKey(item)}" aria-label="Remove ${item.name}">&times;</button>
          <img src="${item.img || item.image || 'assets/studio-wide-trouser.png'}" alt="${item.name}">
          <div><h3>${item.name}</h3><p>${money(item.price)} / ${(item.colors || [item.color || 'original']).join(', ')}</p><a class="text-link" href="product.html?id=${encodeURIComponent(item.id)}" data-open-wishlist-product="${productKey(item)}">View details</a></div>
        </article>
      `).join('')}
    `;
  }
  if (view === 'profile') {
    const account = authDashboardData?.user || getUserAccount() || { name: 'Zavora Customer', email: '' };
    const nameNode = grid.querySelector('[data-profile-name]');
    const emailNode = grid.querySelector('[data-profile-email]');
    const input = grid.querySelector('[data-profile-name-input]');
    if (nameNode) nameNode.textContent = account.name || 'Zavora Customer';
    if (emailNode) emailNode.textContent = account.email || 'No email saved';
    if (input) input.value = account.name || '';
  }
  if (view === 'orders') {
    const orders = authDashboardData?.orders?.length ? authDashboardData.orders : [];
    const cards = getGiftCards();
    grid.innerHTML = `
      ${orders.length ? orders.map((order) => `
        <article class="dashboard-card dashboard-wide">
          <span>Order History</span>
          <h3>#${order.id.replace(/^#/, '')}</h3>
          <p>${order.items?.[0]?.name || 'Zavora order'} / ${order.method || 'PayPal'} / ${order.status || 'Active'} / Total ${money(order.total || 0)}</p>
          <div class="mini-status"><i style="width:${order.status === 'Delivered' ? 100 : order.status === 'Shipped' ? 78 : 46}%"></i></div>
          <a class="text-link" href="track-order.html?order=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.email)}">Track live order</a>
        </article>
      `).join('') : '<article class="dashboard-card dashboard-wide"><span>Orders</span><h3>No orders yet</h3><p>Your order history appears here after checkout.</p></article>'}
    `;
    if (cards.length) {
      grid.insertAdjacentHTML('beforeend', cards.map((card) => `
        <article class="dashboard-card dashboard-wide gift-order-card">
          <span>Gift Card Order</span>
          <h3>${card.code}</h3>
          <p>${money(card.value)} digital gift card / Balance ${money(card.balance)} / ${card.recipient || 'Zavora customer'}</p>
          <button class="text-link" type="button" data-copy-gift="${card.code}">Copy card number</button>
        </article>
      `).join(''));
    }
  }
  document.querySelectorAll('.side-menu a, [data-dashboard-view]').forEach((item) => {
    item.classList.toggle('active', item.dataset.dashboardView === view);
  });
}

function initDashboardTabs() {
  const sideMenu = document.querySelector('.side-menu');
  if (!sideMenu) return;
  sideMenu.querySelectorAll('a').forEach((link) => {
    const view = link.textContent.trim().toLowerCase();
    link.dataset.dashboardView = view;
    link.href = view === 'logout' ? 'logout.html' : `#${view}`;
  });
  const hashView = window.location.hash.replace('#', '');
  setDashboardView(accountViews[hashView] ? hashView : 'dashboard');
  loadDashboardData().then(() => {
    const activeView = window.location.hash.replace('#', '') || 'dashboard';
    setDashboardView(accountViews[activeView] ? activeView : 'dashboard');
  });
}

if (!initLaunchGate()) {
window.addEventListener('scroll', syncPageHeader);
syncPageHeader();
normalizeHeaderSelectors();
hydrateHeaderIcons();
hydrateCloseIcons();
initPageMobileMenu();
initPageMegaMenu();
syncHeaderCounts();
enforceAuthState();
initDashboardTabs();

document.querySelectorAll('[data-dark]').forEach((button) => {
  button.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.documentElement.classList.toggle('dark', document.body.classList.contains('dark'));
  });
});

function ensurePageSearch() {
  let overlay = document.querySelector('#pageSearchOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('section');
  overlay.className = 'search-overlay';
  overlay.id = 'pageSearchOverlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <button class="close" data-close-page-search aria-label="Close search">&times;</button>
    <label for="pageSearchInput">Search Zavora</label>
    <input id="pageSearchInput" type="search" placeholder="Try hoodie, cargo, limited, best sellers...">
    <div class="suggestions" id="pageSuggestions"></div>
  `;
  document.body.appendChild(overlay);
  hydrateCloseIcons(overlay);
  return overlay;
}

function renderPageSuggestions(term = '') {
  const box = document.querySelector('#pageSuggestions');
  if (!box) return;
  const cleanTerm = term.trim().toLowerCase();
  const products = window.__zavoraSearchProducts || [];
  if (!products.length) {
    Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))
      .then((pages) => {
        window.__zavoraSearchProducts = pages.flat();
        renderPageSuggestions(term);
      })
      .catch(() => {});
  }
  if (products.length) {
    const matches = products
      .filter((product) => productMatchesSearch(product, cleanTerm))
      .slice(0, 8);
    box.innerHTML = matches.length ? matches.map((product) => `
      <button type="button" class="search-product" data-page-search-product="${product.id}">
        <img src="${product.img || product.image || 'assets/studio-wide-trouser.png'}" alt="${product.name}" onerror="this.src='assets/studio-wide-trouser.png'">
        <span><strong>${product.name}</strong><br>${money(product.price)} / ${product.category}</span>
      </button>
    `).join('') : '<p>No matching Zavora product found.</p>';
    return;
  }
  const matches = quickProducts.filter((item) => item.toLowerCase().includes(cleanTerm));
  const list = cleanTerm ? matches : quickProducts;
  box.innerHTML = list.length
    ? list.map((item) => {
      const isGift = item.toLowerCase().includes('gift');
      const href = isGift ? 'gift-cards.html' : 'shop.html';
      const copy = isGift ? 'Buy digital Zavora gift cards' : 'Shop premium Zavora pieces';
      return `<button type="button" onclick="location.href='${href}'"><strong>${item}</strong><br>${copy}</button>`;
    }).join('')
    : `<button type="button" onclick="location.href='shop.html'"><strong>No exact match</strong><br>View all products</button>`;
}

function normalizedSearch(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function productMatchesSearch(product, term = '') {
  const clean = normalizedSearch(term);
  if (!clean) return true;
  const raw = `${product.name || ''} ${product.category || ''} ${(product.collection || []).join(' ')} ${(product.colors || []).join(' ')}`;
  const aliases = /t-?shirt|tee|tees/i.test(raw) ? ' tshirt tshirts tee tees' : '';
  const haystack = normalizedSearch(`${raw}${aliases}`);
  return haystack.includes(clean);
}

function ensurePageCart() {
  let drawer = document.querySelector('#pageCartDrawer');
  if (drawer) return drawer;

  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'pageCartDrawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h2>Your Bag</h2>
      <button class="close" data-close-page-cart aria-label="Close cart">&times;</button>
    </div>
    <div class="shipping">
      <span>Free USA shipping unlocked</span>
      <div><i style="width:100%"></i></div>
    </div>
    <div class="cart-items" data-page-cart-items></div>
    <label class="promo">Discount code<input placeholder="ZAVORA10"></label>
    <div class="cart-total"><span>Estimated total</span><strong data-page-cart-total>$0</strong></div>
    <button class="checkout" type="button" onclick="location.href='checkout.html'">Checkout securely</button>
    <p class="payment">Visa - Mastercard - Apple Pay - PayPal</p>
  `;
  document.body.appendChild(drawer);
  hydrateCloseIcons(drawer);
  renderSavedCart(drawer);
  return drawer;
}

function renderSavedCart(scope = document) {
  const cart = getSavedCart();
  const items = scope.querySelector('[data-page-cart-items]');
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  if (items) {
    items.innerHTML = cart.length ? cart.map((item) => `
      <div class="cart-item">
        <img src="${item.img || 'assets/studio-wide-trouser.png'}" alt="${item.name || 'Zavora product'}" onerror="this.src='assets/studio-wide-trouser.png'">
        <div><h3>${item.name || 'Zavora product'}</h3><span>${item.qty || 1} x ${money(item.price)}</span></div>
        <button type="button" data-page-remove="${item.id}" aria-label="Remove ${item.name || 'item'}">&times;</button>
      </div>
    `).join('') : '<p>Your bag is ready for something iconic.</p>';
  }
  scope.querySelectorAll('[data-page-cart-total]').forEach((totalNode) => {
    totalNode.textContent = money(total);
  });
  document.querySelectorAll('.header-actions .cart-button').forEach((cartButton) => {
    const homeCount = cartButton.querySelector('#cartCount');
    if (homeCount) homeCount.textContent = cartQuantity();
    else cartButton.textContent = `Bag ${cartQuantity()}`;
  });
}

function hydrateCheckoutSummary() {
  const summary = document.querySelector('[data-checkout-summary]');
  if (!summary) return;
  const cart = getSavedCart();
  const activeCart = cart;
  const total = activeCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const shippingCost = Number(document.querySelector('input[name="shipping"]:checked')?.value || 0);
  let giftDiscount = 0;
  try {
    const appliedGift = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY));
    if (appliedGift?.code) giftDiscount = Math.min(total, Number(appliedGift.balance || appliedGift.value || 0));
  } catch (error) {
    giftDiscount = 0;
  }
  const payable = Math.max(0, total + shippingCost - giftDiscount);
  summary.innerHTML = activeCart.length ? activeCart.map((item) => `
    <a class="summary-product" href="product.html">
      <img src="${item.img || 'assets/studio-wide-trouser.png'}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'">
      <div><strong>${item.name}</strong><span>${item.color || 'Black'} / ${item.sizes?.[0] || 'M'} / Qty ${item.qty || 1}</span></div>
      <b>${money(Number(item.price || 0) * Number(item.qty || 1))}</b>
    </a>
  `).join('') : '<p class="secure-note">Your bag is empty. Add Printful products before checkout.</p>';
  document.querySelectorAll('[data-checkout-subtotal]').forEach((node) => {
    node.textContent = money(total);
  });
  document.querySelectorAll('[data-gift-discount]').forEach((node) => {
    node.textContent = giftDiscount ? `-${money(giftDiscount)}` : '-$0';
  });
  document.querySelectorAll('[data-shipping-total]').forEach((node) => {
    node.textContent = shippingCost ? money(shippingCost) : 'Free';
  });
  document.querySelectorAll('[data-checkout-total]').forEach((node) => {
    node.textContent = money(payable);
  });
  const pay = document.querySelector('[data-pay-total]');
  if (pay) {
    pay.textContent = payable ? `Pay ${money(payable)}` : 'Complete gift card order';
    pay.dataset.payTotal = pay.textContent;
  }
}

function ensureWishlistDrawer() {
  let drawer = document.querySelector('#pageWishlistDrawer');
  if (drawer) {
    renderWishlistDrawer(drawer);
    return drawer;
  }

  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'pageWishlistDrawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h2>Wishlist</h2>
      <button class="close" data-close-wishlist aria-label="Close wishlist">&times;</button>
    </div>
    <div class="cart-items" data-wishlist-items></div>
    <button class="checkout" type="button" onclick="location.href='wishlist.html'">Open Wishlist Page</button>
    <p class="payment">Saved pieces, size alerts, and back-in-stock notifications.</p>
  `;
  document.body.appendChild(drawer);
  hydrateCloseIcons(drawer);
  renderWishlistDrawer(drawer);
  return drawer;
}

function renderWishlistDrawer(drawer = document.querySelector('#pageWishlistDrawer')) {
  if (!drawer) return;
  const box = drawer.querySelector('[data-wishlist-items], .cart-items');
  if (!box) return;
  const wishlist = getWishlist();
  box.innerHTML = wishlist.length ? wishlist.map((item) => `
    <div class="cart-item wishlist-clickable" data-wishlist-card="${productKey(item)}" data-open-wishlist-product="${productKey(item)}">
      <img src="${item.img || item.image || 'assets/studio-wide-trouser.png'}" alt="${item.name || 'Zavora product'}" onerror="this.src='assets/studio-wide-trouser.png'">
      <div><h3>${item.name || 'Zavora product'}</h3><span>${money(item.price || 0)} / ${(item.colors || [item.color || 'original']).join(', ')}</span></div>
      <button type="button" data-remove-wishlist="${productKey(item)}" aria-label="Remove ${item.name || 'item'}">&times;</button>
    </div>
  `).join('') : '<p>No wishlist products yet. Tap the heart on a product to save it here.</p>';
}

function productCard(title, price, image, tag) {
  return `
    <article class="page-card">
      <img src="${image}" alt="${title}">
      <div><h3>${title}</h3><p>${price} - ${tag}</p><a class="text-link" href="product.html">Shop product</a></div>
    </article>
  `;
}

function getAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || [];
  } catch (error) {
    return [];
  }
}
const catalogData = [...getAdminProducts()];

function swatch(color) {
  return {
    black: '#050505',
    white: '#fff',
    gray: '#aaa',
    blue: '#2d5f9a',
    green: '#4f6f52',
    red: '#9b1c1c',
    pink: '#e6a4b4',
    purple: '#6a4c93',
    brown: '#8b6f47',
    default: 'linear-gradient(135deg,#111 0 50%,#fff 50% 100%)',
    gold: '#c9a227'
  }[color] || color || '#111';
}

function catalogCard(item) {
  const image = item.images?.[0] || item.image || item.img || 'assets/studio-wide-trouser.png';
  const hoverImage = item.images?.[1] || item.alt || item.hoverImage || image;
  const size = item.size || item.sizes?.[0] || 'M';
  const colors = Array.isArray(item.colors) && item.colors.length ? item.colors : [item.color || 'default'];
  const collections = Array.isArray(item.collection) ? item.collection.join(' ') : String(item.collection || '');
  const stock = getProductStock(item);
  const isLimited = String(item.badge || '').toLowerCase().includes('limited') || (item.collection || []).includes('limited');
  const rating = Number(item.rating || (4.6 + ((Number(item.id) || 1) % 4) / 10)).toFixed(1);
  return `
    <article class="catalog-card" data-catalog-card data-product-id="${item.id}" data-gender="${String(item.gender || '').toLowerCase()}" data-category="${item.category}" data-collection="${collections}" data-color="${colors.join(' ')}" data-size="${(item.sizes || [size]).join(' ')}" data-price="${item.price}">
      <a href="product.html?id=${encodeURIComponent(item.id)}" data-open-product="${item.id}" aria-label="Open ${item.name} detail page">
        <img class="card-img-primary" src="${image}" alt="${item.name}" loading="lazy" onerror="this.src='assets/studio-wide-trouser.png'">
        <img class="card-img-hover" src="${hoverImage}" alt="${item.name} hover view" loading="lazy" onerror="this.style.display='none'">
        <span class="badge">${item.badge}</span>
        <button class="wish" type="button" data-wishlist-product="${item.id}" aria-label="Add ${item.name} to wishlist">♡</button>
      </a>
      <div>
        <h3><a href="product.html?id=${encodeURIComponent(item.id)}" data-open-product="${item.id}">${item.name}</a></h3>
        <p>${item.category} / ${colors.map((color) => color === 'default' ? 'original' : color).join(', ')}${item.category === 'accessories' ? '' : ` / ${size}`}</p>
        <div class="swatches" aria-label="Color variants">${colors.map((color) => `<span class="swatch" title="${color}" style="background:${swatch(color)}"></span>`).join('')}</div>
        <strong class="sale-price">${item.compareAt ? `<s>${money(item.compareAt)}</s> ` : ''}${money(item.price)}</strong>
        <span class="catalog-rating">★ ${rating}</span>
        <div class="catalog-card-actions">
          <button type="button" data-card-add="${item.id}">Add to Cart</button>
          <a href="product.html?id=${encodeURIComponent(item.id)}" data-open-product="${item.id}">Quick View</a>
        </div>
        ${isLimited ? `<span class="catalog-stock">${stock > 0 ? `${stock} available` : 'Out of stock'}</span>` : ''}
      </div>
    </article>
  `;
}

function categoryMatches(productCategory, requestedCategory) {
  const requested = String(requestedCategory || '').toLowerCase();
  const category = String(productCategory || '').toLowerCase();
  if (!requested || requested === 'all') return true;
  const groups = {
    'oversized-tees': ['oversized-tees'],
    'heavyweight-tees': ['heavyweight-tees'],
    'baby-tees': ['baby-tees'],
    tees: ['oversized-tees', 'heavyweight-tees', 'baby-tees'],
    hoodies: ['hoodies'],
    'cropped-hoodies': ['cropped-hoodies'],
    'zip-hoodies': ['zip-hoodies'],
    'cargo-pants': ['cargo-pants'],
    sweatpants: ['sweatpants'],
    joggers: ['sweatpants'],
    pants: ['pants', 'cargo-pants', 'sweatpants'],
    shorts: ['shorts'],
    jackets: ['jackets'],
    outerwear: ['jackets'],
    accessories: ['accessories'],
    shoes: ['accessories']
  };
  return (groups[requested] || [requested]).includes(category);
}

function productsForCatalogPage(products, pageName) {
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  if (urlCategory) {
    products = products.filter((product) => categoryMatches(product.category, urlCategory));
  }
  if (pageName === 'new-arrivals.html') {
    return products.filter((product) => product.collection?.includes('new'));
  }
  if (pageName === 'limited.html') {
    return products
      .filter((product) => product.collection?.includes('limited'))
      .map((product, index) => ({ ...product, stock: Math.min(getProductStock(product), 1 + (index % 10)), badge: 'Limited' }));
  }
  if (pageName === 'best-sellers.html') {
    return products.filter((product) => product.collection?.includes('best') || product.popularity >= 84);
  }
  return products;
}

async function fetchCatalogProducts(gender, limit = 1000) {
  const params = new URLSearchParams({
    gender,
    limit: String(limit)
  });
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  const urlCollection = new URLSearchParams(window.location.search).get('collection');
  if (urlCategory) params.set('category', urlCategory);
  if (urlCollection) params.set('collection', urlCollection);
  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    const data = await response.json();
    if (response.ok && data.ok && Array.isArray(data.products) && data.products.length) return data.products;
  } catch (error) {}
  const pages = [1, 2, 3, 4, 5, 6];
  const results = await Promise.all(pages.map((page) => (
    fetch(`/api/printful-products?gender=${gender}&limit=60&page=${page}`)
      .then((response) => response.json())
      .then((data) => Array.isArray(data.products) ? data.products : [])
      .catch(() => [])
  )));
  return results.flat();
}

async function loadPrintfulCatalog() {
  const grid = document.querySelector('[data-catalog-grid]');
  if (!grid || grid.dataset.printfulLoaded) return;
  grid.dataset.printfulLoaded = 'true';
  try {
    const pageName = window.location.pathname.split('/').pop();
    const dataProducts = pageName === 'shop.html' || pageName === 'collections.html'
      ? (await Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))).flat()
      : await fetchCatalogProducts(pageName === 'women.html' ? 'women' : 'men', 1000);
    if (!dataProducts.length) return;
    const products = productsForCatalogPage(dataProducts, pageName);
    window.__zavoraCatalogProducts = products;
    grid.innerHTML = products.map(catalogCard).join('');
    filterLargeCatalog();
    refreshWishlistButtons();
  } catch (error) {
    grid.dataset.printfulLoaded = 'failed';
  }
}

function injectLargeCatalog() {
  const main = document.querySelector('main');
  const pageName = window.location.pathname.split('/').pop();
  if (!main || document.querySelector('.catalog-shop') || !catalogOnlyPages.includes(pageName)) return;
  const isWomenPage = pageName === 'women.html';
  const genderOptions = '<option value="all">All</option><option value="men">Men</option><option value="women">Women</option>';
  const categoryOptions = isWomenPage
    ? '<option value="all">All</option><option value="oversized-tees">Oversized Tees</option><option value="baby-tees">Baby Tees</option><option value="hoodies">Hoodies</option><option value="cropped-hoodies">Cropped Hoodies</option><option value="sweatpants">Sweatpants</option><option value="jackets">Jackets</option><option value="accessories">Accessories</option>'
    : '<option value="all">All</option><option value="oversized-tees">Oversized Tees</option><option value="heavyweight-tees">Heavyweight Tees</option><option value="hoodies">Hoodies</option><option value="zip-hoodies">Zip Hoodies</option><option value="cargo-pants">Cargo Pants</option><option value="sweatpants">Sweatpants</option><option value="jackets">Jackets</option><option value="shorts">Shorts</option><option value="shoes">Shoes</option><option value="accessories">Accessories</option>';
  const collectionOptions = '<option value="all">All</option><option value="sportswear">Sportswear</option><option value="streetwear">Streetwear</option><option value="matching-sets">Matching Sets</option><option value="beachwear">Beachwear</option><option value="new">New</option><option value="best">Best Sellers</option><option value="limited">Limited</option>';
  const section = document.createElement('section');
  section.className = 'catalog-shop';
  section.innerHTML = `
    <aside class="catalog-sidebar">
      <div class="filter-head">
        <h2>Shop Zavora</h2>
        <p><span data-catalog-count>${catalogData.length}</span> products available</p>
      </div>
      ${pageName === 'shop.html' || pageName === 'collections.html' ? `<label>Gender<select data-catalog-filter="gender">${genderOptions}</select></label>` : ''}
      <label>Category<select data-catalog-filter="category">${categoryOptions}</select></label>
      <label>Collection<select data-catalog-filter="collection">${collectionOptions}</select></label>
      <label>Color<select data-catalog-filter="color"><option value="all">All</option><option>black</option><option>white</option><option>gray</option><option>blue</option><option>green</option><option>red</option><option>gold</option></select></label>
      <label>Size<select data-catalog-filter="size"><option value="all">All</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></label>
      <label>Under amount<select data-catalog-filter="price"><option value="999">All</option><option value="100">Under $100</option><option value="160">Under $160</option><option value="240">Under $240</option></select></label>
      <label>Sort<select data-catalog-filter="sort"><option value="featured">Featured</option><option value="low">Price low to high</option><option value="high">Price high to low</option></select></label>
      <button type="button" data-catalog-reset>Reset</button>
    </aside>
    <div class="catalog-area">
      <div class="catalog-toolbar">
        <div><h1>Premium streetwear catalog</h1></div>
        <span><strong data-catalog-count>${catalogData.length}</strong> results</span>
      </div>
      <div class="catalog-grid" data-catalog-grid>${catalogData.length ? catalogData.map(catalogCard).join('') : '<p class="catalog-loading">Loading Printful products...</p>'}</div>
    </div>
  `;
  main.classList.add('catalog-main');
  main.innerHTML = '';
  main.appendChild(section);
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  const categorySelect = section.querySelector('[data-catalog-filter="category"]');
  if (urlCategory && categorySelect && [...categorySelect.options].some((option) => option.value === urlCategory)) {
    categorySelect.value = urlCategory;
  }
  const label = new URLSearchParams(window.location.search).get('label');
  if (label) {
    const title = section.querySelector('.catalog-toolbar h1');
    if (title) title.textContent = label;
  }
}

function filterLargeCatalog() {
  const filters = document.querySelectorAll('[data-catalog-filter]');
  if (!filters.length) return;
  const values = Object.fromEntries([...filters].map((filter) => [filter.dataset.catalogFilter, filter.value]));
  const searchTerm = new URLSearchParams(window.location.search).get('search') || '';
  const forcedCategory = new URLSearchParams(window.location.search).get('category') || values.category;
  const grid = document.querySelector('[data-catalog-grid]');
  if (grid) {
    const cards = [...grid.querySelectorAll('[data-catalog-card]')];
    cards.sort((a, b) => {
      if (values.sort === 'low') return Number(a.dataset.price) - Number(b.dataset.price);
      if (values.sort === 'high') return Number(b.dataset.price) - Number(a.dataset.price);
      return 0;
    }).forEach((card) => grid.appendChild(card));
  }
  let visible = 0;
  document.querySelectorAll('[data-catalog-card]').forEach((card) => {
    const product = (window.__zavoraCatalogProducts || []).find((item) => String(item.id) === String(card.dataset.productId));
    const match = categoryMatches(card.dataset.category, forcedCategory)
      && (!values.gender || values.gender === 'all' || card.dataset.gender === values.gender)
      && (values.collection === 'all' || (card.dataset.collection || '').split(' ').includes(values.collection))
      && (values.color === 'all' || card.dataset.color.split(' ').includes(values.color))
      && (values.size === 'all' || card.dataset.size.split(' ').includes(values.size))
      && Number(card.dataset.price) <= Number(values.price || 999)
      && (!searchTerm || productMatchesSearch(product || { name: card.textContent, category: card.dataset.category, colors: card.dataset.color.split(' ') }, searchTerm));
    card.hidden = !match;
    if (match) visible += 1;
  });
  document.querySelectorAll('[data-catalog-count]').forEach((count) => {
    count.textContent = visible;
  });
  const title = document.querySelector('.catalog-toolbar h1');
  if (title && searchTerm) title.textContent = `Search results for "${searchTerm}"`;
}

function injectProductFilters(beforeNode) {
  if (!beforeNode || document.querySelector('.global-product-filters')) return;
  const filters = document.createElement('section');
  filters.className = 'section global-product-filters';
  filters.innerHTML = `
    <div class="global-rail-head">
      <div><p class="eyebrow">Product Filters</p><h2>Shop by fit, price, and drop.</h2></div>
      <a class="text-link" href="product-filters.html">Advanced filters</a>
    </div>
    <div class="filter-chips">
      <a href="shop.html">All Products</a>
      <a href="collections.html">Collections</a>
      <a href="best-sellers.html">Best Sellers</a>
      <a href="limited.html">Limited</a>
      <a href="new-arrivals.html">New</a>
      <a href="shop.html">Black</a>
      <a href="shop.html">White</a>
      <a href="shop.html">XS-S</a>
      <a href="shop.html">M-L</a>
      <a href="shop.html">Under $150</a>
      <a href="shop.html">Sale</a>
    </div>
  `;
  beforeNode.parentNode.insertBefore(filters, beforeNode);
}

function injectProductRails() {
  return;
  const footer = document.querySelector('.footer');
  if (!footer || document.querySelector('.global-product-rails')) return;
  const pageName = window.location.pathname.split('/').pop();
  if (plainCommercePages.includes(pageName) || catalogOnlyPages.includes(pageName)) return;

  const rails = document.createElement('section');
  rails.className = 'section global-product-rails';
  rails.innerHTML = `
    <div>
      <div class="global-rail-head"><div><p class="eyebrow">New Products</p><h2>Fresh Zavora pieces</h2></div><a class="text-link" href="new-arrivals.html">View new</a></div>
      <div class="page-grid">
        ${productCard('Noir Oversized Hoodie', '$148', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80', 'Black - S M L XL')}
        ${productCard('Gold Label Tee', '$64', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80', 'White - Sale')}
        ${productCard('Avenue Cargo Pant', '$132', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80', 'Gray - Trending')}
      </div>
    </div>
    <div>
      <div class="global-rail-head"><div><p class="eyebrow">Best Sellers</p><h2>Most-wanted this week</h2></div><a class="text-link" href="best-sellers.html">Shop best sellers</a></div>
      <div class="page-grid">
        ${productCard('Studio Wide Trouser', '$168', 'https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=700&q=80', 'Wide fit')}
        ${productCard('Gold Chain Belt', '$118', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80', 'Luxury accent')}
        ${productCard('Gold Label Tee', '$64', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=700&q=80', 'Sale discount')}
      </div>
    </div>
    <div>
      <div class="global-rail-head"><div><p class="eyebrow">Recommended</p><h2>Styled for everyday luxury</h2></div><a class="text-link" href="recommended-products.html">View picks</a></div>
      <div class="page-grid">
        ${productCard('Ivory Heavyweight Tee', '$78', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80', 'Core essential')}
        ${productCard('Zavora Cropped Jacket', '$286', 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=80', 'Limited')}
        ${productCard('Monogram Cap', '$52', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80', 'Recently viewed')}
      </div>
    </div>
    <div>
      <div class="global-rail-head"><div><p class="eyebrow">Recently Viewed</p><h2>Continue the edit</h2></div><a class="text-link" href="recently-viewed.html">View recent</a></div>
      <div class="page-grid">
        ${productCard('Avenue Cargo Pant', '$132', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80', 'Recently viewed')}
        ${productCard('Noir Oversized Hoodie', '$148', 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80', 'Recently viewed')}
        ${productCard('Zavora Cropped Jacket', '$286', 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80', 'Recently viewed')}
      </div>
    </div>
  `;
  injectProductFilters(footer);
  footer.parentNode.insertBefore(rails, footer);
}

document.querySelectorAll('[data-page-search]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    const overlay = ensurePageSearch();
    overlay.classList.add('open');
    renderPageSuggestions();
    overlay.querySelector('input').focus();
  });
});

document.addEventListener('input', (event) => {
  if (event.target && event.target.id === 'pageSearchInput') {
    renderPageSuggestions(event.target.value);
  }
  if (event.target?.matches('[data-catalog-filter]')) {
    filterLargeCatalog();
  }
  if (event.target?.matches('[data-gift-search]')) {
    const term = event.target.value.trim().toLowerCase();
    document.querySelectorAll('[data-gift-card]').forEach((card) => {
      card.hidden = term && !card.dataset.giftCard.includes(term);
    });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target?.id === 'pageSearchInput') {
    event.preventDefault();
    const term = event.target.value.trim();
    if (term) window.location.href = `shop.html?search=${encodeURIComponent(term)}`;
  }
});

document.addEventListener('change', (event) => {
  if (event.target?.matches('[data-catalog-filter]')) {
    filterLargeCatalog();
  }
});

document.addEventListener('click', async (event) => {
  const rawAccountLink = event.target.closest('a');
  if (rawAccountLink && !rawAccountLink.closest('.auth-card')) {
    const rawHref = rawAccountLink.getAttribute('href') || '';
    const accountTarget = rawHref.includes('dashboard.html')
      || rawHref === 'account.html'
      || rawHref === 'my-account.html'
      || rawHref === 'wishlist.html'
      || rawHref === 'orders.html'
      || rawHref === 'order-history.html'
      || rawHref === 'addresses.html'
      || rawHref === 'saved-addresses.html'
      || rawHref === 'profile.html'
      || rawHref === 'change-password.html';
    if (accountTarget) {
      event.preventDefault();
      const next = rawHref.includes('dashboard.html') ? rawHref : 'dashboard.html';
      const user = await fetchAuthSession(true);
      window.location.href = user ? next : `login.html?next=${encodeURIComponent(next)}`;
      return;
    }
  }

  const pageSearchProduct = event.target.closest('[data-page-search-product]');
  if (pageSearchProduct) {
    event.preventDefault();
    const product = (window.__zavoraSearchProducts || []).find((item) => String(item.id) === String(pageSearchProduct.dataset.pageSearchProduct));
    if (product) rememberSelectedProduct(product);
    window.location.href = `product.html?id=${encodeURIComponent(pageSearchProduct.dataset.pageSearchProduct)}`;
    return;
  }

  const openProduct = event.target.closest('[data-open-product]');
  if (openProduct && !event.target.closest('[data-wishlist-product]')) {
    const id = String(openProduct.dataset.openProduct);
    const products = window.__zavoraCatalogProducts || [];
    const product = products.find((item) => String(item.id) === id || String(item.printfulId) === id);
    if (product) rememberSelectedProduct(product);
    return;
  }

  const wishlistProduct = event.target.closest('[data-wishlist-product], [data-add-selected-wishlist]');
  if (wishlistProduct) {
    event.preventDefault();
    const id = wishlistProduct.dataset.wishlistProduct;
    const product = id
      ? (window.__zavoraCatalogProducts || []).find((item) => String(item.id) === String(id))
      : getSelectedProduct();
    const targetProduct = product || getSelectedProduct();
    if (!(await requireCommerceAuth('wishlist', targetProduct, 'wishlist.html'))) return;
    const key = productKey(targetProduct);
    const wishlist = getWishlist();
    if (wishlist.some((item) => productKey(item) === key)) {
      saveWishlist(wishlist.filter((item) => productKey(item) !== key));
      syncHeaderCounts();
      renderWishlistDrawer();
      refreshWishlistButtons();
    } else {
      addWishlistProduct(targetProduct);
    }
    return;
  }

  const cardAdd = event.target.closest('[data-card-add]');
  if (cardAdd) {
    event.preventDefault();
    const product = (window.__zavoraCatalogProducts || []).find((item) => String(item.id) === String(cardAdd.dataset.cardAdd));
    if (!product) return;
    if (!(await requireCommerceAuth('cart', product, 'cart.html'))) return;
    addProductToCart(product, { id: String(product.id) });
    window.location.href = 'cart.html';
    return;
  }

  const newsletterButton = event.target.closest('.footer-newsletter button, .newsletter button');
  if (newsletterButton) {
    event.preventDefault();
    const form = newsletterButton.closest('form') || newsletterButton.closest('.newsletter');
    const input = form?.querySelector('input[type="email"], input');
    const email = input?.value.trim().toLowerCase();
    let note = form?.querySelector('[data-newsletter-note]');
    if (!note && form) {
      note = document.createElement('p');
      note.dataset.newsletterNote = 'true';
      note.className = 'newsletter-note';
      form.appendChild(note);
    }
    if (!email || !email.includes('@')) {
      if (note) note.textContent = 'Enter a valid email for newsletter access.';
      return;
    }
    const originalText = newsletterButton.textContent;
    newsletterButton.textContent = 'Joining...';
    const sent = await requestNewsletterEmail(email);
    newsletterButton.textContent = originalText || 'Join';
    if (note) note.textContent = sent
      ? 'Newsletter confirmation sent from hello@zavorafashion.com.'
      : 'Newsletter saved. Email service is not ready yet.';
    return;
  }

  const dropdownOption = event.target.closest('[data-dropdown-value]');
  if (dropdownOption) {
    event.preventDefault();
    const dropdown = dropdownOption.closest('.header-dropdown');
    dropdown.querySelector('.header-select-label span').textContent = dropdownOption.dataset.dropdownValue;
    dropdown.classList.remove('open');
    return;
  }

  const dropdownButton = event.target.closest('.header-select-label');
  document.querySelectorAll('.header-dropdown.open').forEach((dropdown) => {
    if (!dropdown.contains(event.target)) dropdown.classList.remove('open');
  });
  if (dropdownButton) {
    event.preventDefault();
    dropdownButton.closest('.header-dropdown')?.classList.toggle('open');
    return;
  }

  const dashboardTrigger = event.target.closest('[data-dashboard-view]');
  if (dashboardTrigger) {
    event.preventDefault();
    const view = dashboardTrigger.dataset.dashboardView;
    if (view === 'logout') {
      await logoutUser();
      window.location.href = 'login.html';
      return;
    }
    setDashboardView(view);
    return;
  }

  const removeWishlist = event.target.closest('[data-remove-wishlist]');
  if (removeWishlist) {
    event.preventDefault();
    if (removeWishlist.dataset.removeWishlist) {
    saveWishlist(getWishlist().filter((item) => productKey(item) !== removeWishlist.dataset.removeWishlist));
      syncHeaderCounts();
      if (typeof syncHomeWishlistCount === 'function') syncHomeWishlistCount();
      renderWishlistDrawer();
      refreshWishlistButtons();
    }
    removeWishlist.closest('.wishlist-item, .cart-item')?.remove();
    return;
  }

  const openWishlistProduct = event.target.closest('[data-open-wishlist-product]');
  if (openWishlistProduct) {
    if (event.target.closest('[data-remove-wishlist]')) return;
    const product = getWishlist().find((item) => productKey(item) === openWishlistProduct.dataset.openWishlistProduct);
    if (product) rememberSelectedProduct(product);
    if (product?.id) window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
    return;
  }

  if (event.target.closest('[data-add-wishlist]')) {
    event.preventDefault();
    const grid = document.querySelector('.dashboard-grid');
    if (grid) {
      grid.insertAdjacentHTML('beforeend', `
        <article class="wishlist-item"><button class="remove-x" type="button" data-remove-wishlist aria-label="Remove Gold Label Tee">&times;</button><img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80" alt="Gold Label Tee"><div><h3>Gold Label Tee</h3><p>$64 / White / Added now</p><a class="text-link" href="product.html">View details</a></div></article>
      `);
    }
    return;
  }

  if (event.target.closest('[data-add-address]')) {
    event.preventDefault();
    const form = event.target.closest('.address-form');
    const values = [...form.querySelectorAll('input')].map((input) => input.value.trim()).filter(Boolean);
    const address = values.length ? values.join(', ') : 'New USA address saved for checkout';
    form.insertAdjacentHTML('afterend', `<article class="dashboard-card dashboard-wide"><span>Saved Address</span><h3>New Address</h3><p>${address}</p><button class="text-link" type="button">Edit address</button></article>`);
    form.querySelectorAll('input').forEach((input) => input.value = '');
    return;
  }

  if (event.target.closest('[data-password-save]')) {
    event.preventDefault();
    const card = event.target.closest('.dashboard-card');
    const inputs = card ? [...card.querySelectorAll('input')] : [];
    const current = inputs[0]?.value || '';
    const next = inputs[1]?.value || '';
    const confirm = inputs[2]?.value || '';
    let note = card?.querySelector('[data-password-note]');
    if (!note && card) {
      note = document.createElement('p');
      note.className = 'login-error';
      note.dataset.passwordNote = 'true';
      card.appendChild(note);
    }
    if (next.length < 6 || next !== confirm) {
      if (note) note.textContent = 'New password must be 6+ characters and match confirmation.';
      return;
    }
    const response = await fetch('/api/auth-change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentPassword: current, newPassword: next })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (note) note.textContent = data.error || 'Password update failed.';
      return;
    }
    inputs.forEach((input) => input.value = '');
    if (note) {
      note.textContent = 'Password updated. Next login will use your new password.';
      note.classList.add('success-note');
    }
    return;
  }

  if (event.target.closest('[data-profile-save]')) {
    event.preventDefault();
    const card = event.target.closest('.dashboard-card');
    const input = card?.querySelector('[data-profile-name-input]');
    const name = input?.value.trim();
    let note = card?.querySelector('[data-profile-note]');
    if (!note && card) {
      note = document.createElement('p');
      note.className = 'login-error';
      note.dataset.profileNote = 'true';
      card.appendChild(note);
    }
    if (!name) {
      if (note) note.textContent = 'Enter your name before saving.';
      return;
    }
    const response = await fetch('/api/auth-update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (note) note.textContent = data.error || 'Profile update failed.';
      return;
    }
    saveUserAccount(data.user);
    const nameNode = card?.querySelector('[data-profile-name]');
    if (nameNode) nameNode.textContent = name;
    if (note) {
      note.textContent = 'Profile name saved.';
      note.classList.add('success-note');
    }
    return;
  }

  const copyGift = event.target.closest('[data-copy-gift]');
  if (copyGift) {
    event.preventDefault();
    navigator.clipboard?.writeText(copyGift.dataset.copyGift);
    copyGift.textContent = 'Copied';
    return;
  }

  const loginTrigger = event.target.closest('a[href="dashboard.html"].primary-cta');
  if (loginTrigger && (window.location.pathname.endsWith('sign-up.html') || window.location.pathname.endsWith('register.html'))) {
    event.preventDefault();
    const form = loginTrigger.closest('.form-panel');
    const inputs = form ? [...form.querySelectorAll('input')] : [];
    const name = inputs[0]?.value.trim();
    const email = inputs.find((input) => input.type === 'email')?.value.trim().toLowerCase();
    const password = inputs.find((input) => input.type === 'password')?.value.trim();
    const error = otpErrorNode(form);
    if (!name || !email || !password) {
      error.textContent = 'Full name, email, and password are required before OTP.';
      return;
    }
    if (password.length < 6) {
      error.textContent = 'Password must be at least 6 characters.';
      return;
    }
    error.textContent = '';
    loginTrigger.textContent = 'Sending OTP...';
    loginTrigger.setAttribute('aria-busy', 'true');
    const result = await requestAuthStart({ name, email, password });
    loginTrigger.textContent = 'Send OTP';
    loginTrigger.removeAttribute('aria-busy');
    if (!result.ok) {
      error.textContent = result.error || 'Could not send OTP.';
      return;
    }
    if (result.mode === 'password') {
      error.textContent = 'Account already exists. Please login with your password.';
      return;
    }
    const payload = { name, email, purpose: 'signup' };
    savePendingSignupOtp(payload);
    renderSignupOtpStep(form, payload);
    return;
  }

  if (loginTrigger && window.location.pathname.endsWith('login.html')) {
    event.preventDefault();
    const email = document.querySelector('.auth-card input[type="email"]')?.value.trim().toLowerCase();
    const password = document.querySelector('.auth-card input[type="password"]')?.value.trim();
    let error = document.querySelector('[data-login-error]');
    if (!error) {
      error = document.createElement('p');
      error.dataset.loginError = 'true';
      error.className = 'login-error';
      loginTrigger.closest('.form-panel')?.appendChild(error);
    }
    if (!email || !password) {
      error.textContent = 'Email and password are required.';
      return;
    }
    loginTrigger.textContent = 'Logging in...';
    loginTrigger.setAttribute('aria-busy', 'true');
    const result = await requestPasswordLogin(email, password);
    loginTrigger.textContent = 'Login';
    loginTrigger.removeAttribute('aria-busy');
    if (!result.ok) {
      if (result.error === 'ACCOUNT_NOT_FOUND') {
        const start = await requestAuthStart({ name: email.split('@')[0], email, password });
        if (start.ok && start.mode === 'otp') {
          const payload = { name: email.split('@')[0], email, purpose: 'signup' };
          savePendingSignupOtp(payload);
          renderSignupOtpStep(loginTrigger.closest('.form-panel'), payload);
          return;
        }
        error.textContent = start.error || 'No account found. Create account first with OTP verification.';
      } else {
        error.textContent = result.error || 'Invalid email or password.';
      }
      return;
    }
    error.textContent = '';
    loginUser(result.user);
    const resumed = completePendingCommerceAction();
    const next = resumed || new URLSearchParams(window.location.search).get('next') || 'dashboard.html';
    window.location.href = next;
    return;
  }

  const resetTrigger = event.target.closest('.auth-card .primary-cta');
  if (resetTrigger && !resetTrigger.matches('[data-verify-reset-otp]') && window.location.pathname.endsWith('forgot-password.html')) {
    event.preventDefault();
    const form = resetTrigger.closest('.form-panel');
    const email = form?.querySelector('input[type="email"]')?.value.trim().toLowerCase();
    const note = otpErrorNode(form);
    if (!email || !email.includes('@')) {
      note.textContent = 'Enter your account email to receive a reset OTP.';
      return;
    }
    resetTrigger.textContent = 'Sending...';
    resetTrigger.setAttribute('aria-busy', 'true');
    const sent = await requestPasswordReset(email);
    resetTrigger.textContent = 'Send Reset OTP';
    resetTrigger.removeAttribute('aria-busy');
    if (!sent.ok) {
      note.textContent = sent.error || `Email service is not ready. Please contact ${SUPPORT_EMAIL}.`;
      return;
    }
    savePendingSignupOtp({ email, purpose: 'reset' });
    renderResetOtpStep(form, email);
    return;
  }

  if (event.target.closest('[data-verify-signup-otp]')) {
    event.preventDefault();
    const form = event.target.closest('.form-panel');
    const pending = getPendingSignupOtp();
    const inputOtp = form?.querySelector('[data-signup-otp-input]')?.value.trim();
    let error = form.querySelector('[data-signup-error]');
    if (!error) {
      error = document.createElement('p');
      error.className = 'login-error';
      error.dataset.signupError = 'true';
      form.appendChild(error);
    }
    if (!pending || pending.purpose !== 'signup') {
      error.textContent = 'OTP session expired. Please request a new code.';
      return;
    }
    const result = await verifyAuthOtp({ email: pending.email, otp: inputOtp, purpose: 'signup' });
    if (!result.ok) {
      error.textContent = result.error || 'Invalid OTP. Enter the 6-digit code sent to your email.';
      return;
    }
    loginUser(result.user);
    clearPendingSignupOtp();
    const resumed = completePendingCommerceAction();
    requestWelcomeEmail(pending.email, pending.name).finally(() => {
      window.location.href = resumed || new URLSearchParams(window.location.search).get('next') || 'dashboard.html';
    });
    return;
  }

  if (event.target.closest('[data-resend-signup-otp]')) {
    event.preventDefault();
    const form = event.target.closest('.form-panel');
    const pending = getPendingSignupOtp();
    if (!pending) return;
    if (pending.purpose === 'signup') {
      const note = otpErrorNode(form);
      note.textContent = 'For security, please restart signup to receive a new OTP.';
    }
    return;
  }

  if (event.target.closest('[data-verify-reset-otp]')) {
    event.preventDefault();
    const form = event.target.closest('.form-panel');
    const pending = getPendingSignupOtp();
    const otp = form?.querySelector('[data-reset-otp-input]')?.value.trim();
    const newPassword = form?.querySelector('[data-reset-password]')?.value || '';
    const confirm = form?.querySelector('[data-reset-confirm]')?.value || '';
    const note = otpErrorNode(form);
    if (!pending || pending.purpose !== 'reset') {
      note.textContent = 'Reset OTP session expired. Please request a new code.';
      return;
    }
    if (newPassword.length < 6 || newPassword !== confirm) {
      note.textContent = 'New password must be 6+ characters and match confirmation.';
      return;
    }
    const result = await verifyAuthOtp({ email: pending.email, otp, purpose: 'reset', newPassword });
    if (!result.ok) {
      note.textContent = result.error || 'Invalid or expired OTP.';
      return;
    }
    loginUser(result.user);
    clearPendingSignupOtp();
    window.location.href = 'dashboard.html';
    return;
  }

  if (event.target.closest('[data-resend-reset-otp]')) {
    event.preventDefault();
    const form = event.target.closest('.form-panel');
    const pending = getPendingSignupOtp();
    const note = otpErrorNode(form);
    if (!pending || pending.purpose !== 'reset') return;
    const result = await requestPasswordReset(pending.email);
    note.textContent = result.ok ? 'New reset OTP sent. Check inbox and spam folder.' : (result.error || 'Unable to resend OTP.');
    return;
  }

  const checkoutLink = event.target.closest('a[href="checkout.html"]:not([data-page-cart])');
  if (checkoutLink && !(await fetchAuthSession(true))) {
    event.preventDefault();
    savePendingCommerceAction('checkout', null, 'checkout.html');
    showLoginRequiredModal('checkout.html');
    return;
  }

  const payNow = event.target.closest('.pay-now');
  if (payNow && window.location.pathname.endsWith('checkout.html')) {
    event.preventDefault();
    const selected = document.querySelector('input[name="payment"]:checked')?.value || 'paypal';
    const method = selected === 'cod' ? 'COD' : 'PayPal';
    const order = createTestOrder(method);
    if (!order) {
      hydrateCheckoutSummary();
      alert('Your bag is empty. Add a Printful product before checkout.');
      return;
    }
    await persistOrder(order);
    requestOrderConfirmation(order);
    if (method === 'COD') {
      localStorage.removeItem(PAGE_CART_KEY);
      window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=cod`;
      return;
    }
    window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=paypal`;
    return;
  }

  const optionButton = event.target.closest('.option-row button');
  if (optionButton) {
    event.preventDefault();
    optionButton.parentElement.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
    optionButton.classList.add('active');
    updateDynamicProductMedia();
    return;
  }

  const buyNow = event.target.closest('[data-buy-now]');
  const addProduct = event.target.closest('[data-product-add], .product-actions .primary-cta');
  if ((addProduct || buyNow) && window.location.pathname.endsWith('product.html')) {
    event.preventDefault();
    const selected = getSelectedProduct();
    const title = selected?.name || document.querySelector('.product-buy h1')?.textContent.trim() || 'Zavora Fashion Product';
    const price = Number(selected?.price || (document.querySelector('.product-buy .price')?.textContent || '$148').replace(/[^0-9.]/g, '')) || 148;
    const { color, size } = selectedProductOptions();
    const variant = getVariant(selected, color, size);
    const group = productVariantGroup(selected, color);
    const img = variant?.image || group?.images?.[0] || selected?.img || document.querySelector('.product-gallery img')?.src || 'assets/studio-wide-trouser.png';
    if (selected && getProductStock(selected) <= 0) {
      updateProductStockNote(selected);
      return;
    }
    const commerceProduct = selected || { id: Date.now(), name: title, price, color, sizes: [size], images: [img], img };
    if (!(await requireCommerceAuth(buyNow ? 'buy-now' : 'cart', commerceProduct, buyNow ? 'checkout.html' : 'cart.html'))) return;
    const id = selected ? `${productKey(selected)}-${color}-${size}` : String(Date.now());
    addProductToCart(commerceProduct, { id, color, size });
    if (selected) {
      setProductStock(selected, getProductStock(selected) - 1);
      updateProductStockNote(selected);
    }
    if (buyNow) {
      window.location.href = 'checkout.html';
      return;
    }
    window.location.href = 'cart.html';
    return;
  }

  const giftAmount = event.target.closest('[data-gift-amount]');
  if (giftAmount) {
    event.preventDefault();
    document.querySelectorAll('[data-gift-amount]').forEach((button) => button.classList.remove('active'));
    giftAmount.classList.add('active');
    document.querySelectorAll('[data-gift-value]').forEach((node) => node.textContent = money(giftAmount.dataset.giftAmount));
    return;
  }

  if (event.target.closest('[data-add-gift-card]')) {
    event.preventDefault();
    const active = document.querySelector('[data-gift-amount].active') || document.querySelector('[data-gift-amount]');
    const value = Number(active?.dataset.giftAmount || 100);
    const code = uniqueGiftCode();
    const recipient = document.querySelector('[data-gift-recipient]')?.value.trim() || 'Digital recipient';
    const card = { code, value, balance: value, recipient, createdAt: new Date().toISOString() };
    const giftCards = getGiftCards();
    giftCards.push(card);
    saveGiftCards(giftCards);
    const cart = getSavedCart();
    cart.push({ id: Date.now(), name: `Zavora Gift Card ${money(value)}`, price: value, color: 'Digital', sizes: ['Gift'], qty: 1, img: 'assets/studio-wide-trouser.png', giftCode: code });
    saveSavedCart(cart);
    document.querySelector('[data-gift-code]').textContent = code;
    document.querySelector('[data-gift-status]').textContent = `${money(value)} gift card added to bag. Card number: ${code}`;
    syncHeaderCounts();
    return;
  }

  if (event.target.closest('[data-apply-gift-card]')) {
    event.preventDefault();
    const code = document.querySelector('[data-gift-card-input]')?.value.trim().toUpperCase();
    const card = getGiftCards().find((item) => item.code === code);
    const status = document.querySelector('[data-gift-card-status]');
    if (!card) {
      if (status) status.textContent = 'Gift card number not found. Buy a card first from Gift Cards.';
      return;
    }
    localStorage.setItem(APPLIED_GIFT_KEY, JSON.stringify(card));
    if (status) status.textContent = `${card.code} applied. Balance ${money(card.balance)}.`;
    hydrateCheckoutSummary();
    return;
  }

  if (event.target.closest('[data-redeem-reward]')) {
    event.preventDefault();
    const rewardId = document.querySelector('[data-reward-id]')?.value.trim();
    const status = document.querySelector('[data-reward-status]');
    const button = event.target.closest('[data-redeem-reward]');
    if (!rewardId) {
      if (status) status.textContent = 'Enter your Reward ID.';
      return;
    }
    button.textContent = 'Redeeming...';
    const response = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rewardId })
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));
    button.textContent = 'Redeem $10 Credit';
    if (!response?.ok || !data.ok) {
      if (status) status.textContent = data.error || 'Reward could not be redeemed.';
      return;
    }
    if (status) {
      status.textContent = `Reward redeemed. $10 added to wallet. Balance: ${money(data.balance)}.`;
      status.classList.add('success-note');
    }
    document.querySelector('[data-wallet-balance]')?.replaceChildren(document.createTextNode(money(data.balance)));
    showOfferClaimedPopup(data.balance);
    return;
  }

  if (event.target.closest('[data-close-page-search]')) {
    document.querySelector('#pageSearchOverlay')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-page-cart]')) {
    document.querySelector('#pageCartDrawer')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-wishlist]')) {
    document.querySelector('#pageWishlistDrawer')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-login-required]')) {
    document.querySelector('[data-login-required-modal]')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-offer-claimed]')) {
    document.querySelector('[data-offer-claimed-modal]')?.classList.remove('open');
  }
  const pageRemove = event.target.closest('[data-page-remove]');
  if (pageRemove) {
    const id = Number(pageRemove.dataset.pageRemove);
    const nextCart = getSavedCart().filter((item) => Number(item.id) !== id);
    saveSavedCart(nextCart);
    renderSavedCart(document);
    renderSavedCart(document.querySelector('#pageCartDrawer') || document);
    hydrateCheckoutSummary();
  }
  if (event.target.closest('[data-catalog-reset]')) {
    document.querySelectorAll('[data-catalog-filter]').forEach((filter) => {
      filter.value = filter.dataset.catalogFilter === 'price' ? '999' : 'all';
    });
    filterLargeCatalog();
    return;
  }

  const interactive = event.target.closest('a, button, input, select, textarea');
  const card = event.target.closest('.page-card, .product-card, .catalog-card');
  if (!interactive && card && card.querySelector('img') && !card.closest('.footer')) {
    const id = card.dataset.productId;
    const product = (window.__zavoraCatalogProducts || []).find((item) => String(item.id) === String(id));
    if (product) rememberSelectedProduct(product);
    window.location.href = id ? `product.html?id=${encodeURIComponent(id)}` : 'product.html';
  }
});

document.querySelectorAll('[data-page-cart]').forEach((button) => {
  button.addEventListener('click', async (event) => {
    event.preventDefault();
    if (!(await requireCommerceAuth('cart-open', null, 'cart.html'))) return;
    ensurePageCart().classList.add('open');
  });
});

document.querySelectorAll('.header-actions a[aria-label="Account"], .header-actions a[aria-label="Wishlist"], .header-actions a[href="account.html"]').forEach((button) => {
  button.addEventListener('click', async (event) => {
    if (button.dataset.profile) return;
    event.preventDefault();
    if (!(await requireCommerceAuth('wishlist', null, 'wishlist.html'))) return;
    ensureWishlistDrawer().classList.add('open');
  });
});

function enhanceFooter() {
  const footer = document.querySelector('.footer');
  if (!footer || footer.querySelector('.footer-mega')) return;
  const pageName = window.location.pathname.split('/').pop();

  const prefooter = document.createElement('section');
  prefooter.className = 'luxury-prefooter';
  prefooter.innerHTML = `
    <div>
      <p class="eyebrow">Zavora standard</p>
      <h2>Designed in the USA. Crafted for Everyday Luxury.</h2>
      <p>Premium streetwear essentials with clean silhouettes, considered fabrics, and a polished shopping experience from product discovery to delivery.</p>
    </div>
    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=80" alt="Zavora everyday luxury campaign">
  `;
  if (!plainCommercePages.includes(pageName) && !catalogOnlyPages.includes(pageName) && !document.querySelector('.luxury-prefooter')) {
    footer.parentNode.insertBefore(prefooter, footer);
  }

  const footerBottom = footer.querySelector('.footer-bottom');
  if (footer.querySelector('.footer-mega')) return;
  const mega = document.createElement('section');
  mega.className = 'footer-mega';
  mega.innerHTML = `
    <div>
      <h3>Contact Support</h3>
      <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      <a href="contact.html">Contact Us</a>
      <a href="help-center.html">Help Center</a>
      <a href="faq.html">FAQ</a>
      <a href="track-order.html">Track Order</a>
      <a href="shipping-information.html">Shipping Information</a>
      <a href="return-refund-policy.html">Return & Refund Policy</a>
      <a href="exchange-policy.html">Exchange Policy</a>
      <a href="cancel-order.html">Cancel Order</a>
      <a href="style-guide.html">Size Guide</a>
      <a href="fabric-care-guide.html">Fabric & Care Guide</a>
      <a href="payment-methods.html">Payment Methods</a>
      <a href="gift-cards.html">Gift Cards</a>
      <a href="accessibility-statement.html">Accessibility Statement</a>
      <a href="report-issue.html">Report an Issue</a>
    </div>
    <div>
      <h3>Company</h3>
      <a href="about.html">About Us</a>
      <a href="our-story.html">Our Story</a>
      <a href="sustainability.html">Sustainability</a>
      <a href="careers.html">Careers</a>
      <a href="press.html">Press</a>
      <a href="journal.html">Journal</a>
      <div class="social-links">
        <a href="journal.html"><span class="icon-badge"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"></rect><circle cx="12" cy="12" r="3.5"></circle><path d="M17 7h.01"></path></svg></span>Instagram</a>
        <a href="journal.html"><span class="icon-badge"><svg viewBox="0 0 24 24"><path d="M14 4v11.2a4.2 4.2 0 1 1-4.2-4.2"></path><path d="M14 4c1.1 3 3 4.8 6 5"></path></svg></span>TikTok</a>
        <a href="journal.html"><span class="icon-badge"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="M10.5 20c.8-2.5 1.1-4.9 1.7-7.2"></path><path d="M10 13.5c-1.2-2.4.2-5.2 2.9-5.2 2 0 3.3 1.4 3.3 3.2 0 2.2-1.2 4-3 4-.9 0-1.5-.5-1.7-1.1"></path></svg></span>Pinterest</a>
        <a href="journal.html"><span class="icon-badge"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"></rect><path d="m10 9 5 3-5 3Z"></path></svg></span>YouTube</a>
      </div>
    </div>
    <div>
      <h3>Legal</h3>
      <a href="mailto:${LEGAL_EMAIL}">${LEGAL_EMAIL}</a>
      <a href="privacy-policy.html">Privacy Policy</a>
      <a href="terms-conditions.html">Terms & Conditions</a>
      <a href="cookie-policy.html">Cookie Policy</a>
      <a href="refund-policy.html">Refund Policy</a>
      <a href="shipping-policy.html">Shipping Policy</a>
      <div class="payment-icons">
        <span><span class="brand-logo paypal-logo">P</span>PayPal</span>
        <span><span class="brand-logo visa-logo">VISA</span>Visa</span>
        <span><span class="brand-logo mastercard-logo"><i></i><b></b></span>Mastercard</span>
        <span><span class="brand-logo apple-logo">Apple</span>Apple Pay</span>
        <span><span class="brand-logo google-logo">G</span>Google Pay</span>
      </div>
    </div>
    <div>
      <h3>Account</h3>
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
      <a href="${accountHref('dashboard')}" data-account-route="dashboard">My Account</a>
      <a href="${accountHref('wishlist')}" data-account-route="wishlist">Wishlist</a>
      <a href="${accountHref('orders')}" data-account-route="orders">Order History</a>
      <a href="${accountHref('addresses')}" data-account-route="addresses">Saved Addresses</a>
      <a href="${accountHref('change-password')}" data-account-route="change-password">Change Password</a>
      <a href="newsletter.html">Newsletter</a>
    </div>
  `;
  footer.insertBefore(mega, footerBottom || null);
}

function cleanAuthPageFooter() {
  const pageName = window.location.pathname.split('/').pop();
  const isHome = pageName === 'index.html' || pageName === '';
  if (isHome) return;
  document.querySelectorAll('.footer-top, .footer-gallery, .instagram-grid, .luxury-prefooter, .global-product-filters, .global-product-rails').forEach((section) => section.remove());
}

function initRealtimeTracking() {
  const timeline = document.querySelector('.tracking-timeline');
  const card = document.querySelector('.tracking-card');
  if (!timeline || !card || document.querySelector('.live-tracking')) return;
  const live = document.createElement('div');
  live.className = 'live-tracking';
  card.appendChild(live);
  const steps = [...timeline.querySelectorAll('li')];
  function update() {
    const now = new Date();
    const stage = Math.min(steps.length - 1, Math.floor((now.getSeconds() % 40) / 10));
    steps.forEach((step, index) => step.classList.toggle('done', index <= stage));
    live.innerHTML = `<strong>Live status:</strong> ${steps[stage].querySelector('strong').textContent}<span>Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} / ETA ${new Date(now.getTime() + 3 * 86400000).toLocaleDateString()}</span>`;
  }
  update();
  setInterval(update, 5000);
}

function trackingTemplate(order) {
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const stageText = order.method === 'COD' ? 'COD order confirmed' : 'Payment received';
  return `
    <h2>#${order.id.replace(/^#/, '')}</h2>
    <p>${order.items?.[0]?.name || 'Zavora order'} is active. Payment method: ${order.method || 'PayPal'}.</p>
    <ol class="tracking-timeline">
      <li class="done"><strong>Order confirmed</strong><span>${stageText} on ${created.toLocaleDateString()}</span></li>
      <li class="done"><strong>Packing</strong><span>Zavora warehouse is preparing your item</span></li>
      <li><strong>Shipped</strong><span>Tracking number ${order.tracking || 'will appear after dispatch'}</span></li>
      <li><strong>Delivered</strong><span>Estimated in 3-5 business days</span></li>
    </ol>
  `;
}

function initTrackOrderLookup() {
  if (!window.location.pathname.endsWith('track-order.html')) return;
  const form = document.querySelector('.tracking-form .form-panel');
  const card = document.querySelector('.tracking-card');
  if (!form || !card) return;
  card.hidden = true;
  let note = form.querySelector('[data-track-note]');
  if (!note) {
    note = document.createElement('p');
    note.dataset.trackNote = 'true';
    note.className = 'track-note';
    form.appendChild(note);
  }
  const button = form.querySelector('.primary-cta');
  const inputs = [...form.querySelectorAll('input')];
  const params = new URLSearchParams(window.location.search);
  if (params.get('order')) inputs[0].value = `#${params.get('order').replace(/^#/, '')}`;
  if (params.get('email')) inputs[1].value = params.get('email');
  async function lookupOrder() {
    const orderId = inputs[0]?.value.trim().replace(/^#/, '').toUpperCase();
    const email = inputs[1]?.value.trim().toLowerCase();
    if (!orderId || !email) {
      note.textContent = 'Enter order ID and email to view tracking updates.';
      card.hidden = true;
      return;
    }
    note.textContent = 'Checking live order updates...';
    let liveOrders = [];
    try {
      const response = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok && data.ok) liveOrders = data.orders || [];
    } catch (error) {}
    const orders = [...liveOrders, ...getSavedOrders()];
    const match = orders.find((order) => order.id.replace(/^#/, '').toUpperCase() === orderId && String(order.email || '').toLowerCase() === email);
    if (!match) {
      note.textContent = 'No matching order found. Check order ID and email address.';
      card.hidden = true;
      return;
    }
    note.textContent = 'Tracking found. Live updates are now active.';
    card.innerHTML = trackingTemplate(match);
    card.hidden = false;
    initRealtimeTracking();
  }
  button?.addEventListener('click', lookupOrder);
  if (params.get('order') && params.get('email')) lookupOrder();
}

function initOrderSuccessDetails() {
  if (!window.location.pathname.endsWith('order-success.html')) return;
  let order = null;
  try {
    order = JSON.parse(localStorage.getItem('zavoraLastOrder'));
  } catch (error) {
    order = null;
  }
  const params = new URLSearchParams(window.location.search);
  const paramOrder = params.get('order');
  if (paramOrder && (!order || order.id !== paramOrder)) {
    order = getSavedOrders().find((item) => item.id === paramOrder) || order;
  }
  if (!order) return;
  const success = document.querySelector('.success-page');
  if (success) {
    const eyebrow = success.querySelector('.eyebrow');
    const copy = success.querySelector('p:not(.eyebrow)');
    const track = success.querySelector('a[href="track-order.html"]');
    if (eyebrow) eyebrow.textContent = order.method === 'COD' ? 'Order Confirmed' : 'Payment Complete';
    if (copy) copy.innerHTML = `Your Zavora order <strong>#${order.id}</strong> has been confirmed. ${order.method === 'COD' ? 'Cash on Delivery is selected.' : 'A receipt and shipping update will be sent to your email.'}`;
    if (track) track.href = `track-order.html?order=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.email || '')}`;
  }
  const cards = document.querySelectorAll('.success-page + .section .page-card p');
  if (cards[0]) cards[0].textContent = order.method === 'COD' ? 'Confirmed and waiting for COD delivery processing.' : 'Confirmed and moving to packing.';
  if (cards[2]) cards[2].textContent = `${order.method || 'PayPal'} selected. Total: ${money(order.total || 0)}.`;
}

function initPaymentMethodUi() {
  if (!window.location.pathname.endsWith('checkout.html')) return;
  const methods = document.querySelector('.payment-methods');
  const paypal = document.querySelector('.paypal-checkout');
  const panel = document.querySelector('.coming-soon-panel');
  const pay = document.querySelector('.pay-now');
  if (!methods) return;
  function update() {
    const selected = methods.querySelector('input[name="payment"]:checked')?.value || 'paypal';
    const cod = selected === 'cod';
    if (paypal) paypal.hidden = cod;
    if (panel) panel.textContent = cod
      ? 'Cash on Delivery test mode is active. Place the order now and track it with order ID plus email.'
      : 'Card, Apple Pay, and Google Pay checkout are coming soon. Please use PayPal or COD test mode today.';
    if (pay && cod) pay.textContent = 'Place COD Order';
    if (pay && !cod && pay.dataset.payTotal) pay.textContent = pay.dataset.payTotal;
  }
  methods.addEventListener('change', update);
  update();
}

function initFaqAccordions() {
  document.querySelectorAll('[data-faq-question]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem !== item) openItem.classList.remove('open');
      });
      item?.classList.toggle('open');
    });
  });
  document.querySelectorAll('.faq-search').forEach((input) => {
    input.addEventListener('input', () => {
      const term = input.value.trim().toLowerCase();
      document.querySelectorAll('.faq-item').forEach((item) => {
        item.hidden = term && !item.textContent.toLowerCase().includes(term);
      });
    });
  });
}

function selectedProductOptions() {
  const optionRows = [...document.querySelectorAll('.product-buy .option-row')];
  const colorButton = optionRows[0]?.querySelector('button.active');
  return {
    color: colorButton?.dataset.color || colorButton?.textContent.trim() || 'black',
    size: optionRows[1]?.querySelector('button.active')?.textContent.trim() || 'M'
  };
}

function normalizedProductColor(color = '') {
  return String(color || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default';
}

function productVariantGroup(product, color = '') {
  const key = normalizedProductColor(color === 'Original' ? 'default' : color);
  const groups = product?.variantGroups || {};
  return groups[key] || groups[Object.keys(groups)[0]] || null;
}

function renderProductGallery(product, images = []) {
  const gallery = document.querySelector('.product-gallery');
  if (!gallery) return;
  const cleanImages = Array.from(new Set(images.filter(Boolean)));
  const galleryImages = (cleanImages.length ? cleanImages : [product?.img || product?.image || 'assets/studio-wide-trouser.png']).slice(0, 4);
  gallery.classList.toggle('single-gallery', galleryImages.length === 1);
  gallery.innerHTML = `
    <div class="product-gallery-main zoom-frame">
      <img data-gallery-main src="${galleryImages[0]}" alt="${product?.name || 'Zavora product'} main view" loading="eager" onerror="this.src='assets/studio-wide-trouser.png'">
    </div>
    ${galleryImages.length > 1 ? `<div class="product-thumbs" aria-label="Product gallery thumbnails">
      ${galleryImages.map((src, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-gallery-thumb="${src}" aria-label="View product image ${index + 1}"><img src="${src}" alt="" loading="lazy" onerror="this.src='assets/studio-wide-trouser.png'"></button>`).join('')}
    </div>` : ''}
  `;
  gallery.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const main = gallery.querySelector('[data-gallery-main]');
      if (main) main.src = thumb.dataset.galleryThumb;
      gallery.querySelectorAll('[data-gallery-thumb]').forEach((button) => button.classList.toggle('active', button === thumb));
    });
  });
}

function updateDynamicProductMedia() {
  if (!window.location.pathname.endsWith('product.html')) return;
  const product = getSelectedProduct();
  if (!product) return;
  const { color, size } = selectedProductOptions();
  const variant = getVariant(product, color, size);
  const group = productVariantGroup(product, color);
  renderProductGallery(product, group?.images?.length ? group.images : (variant?.images || product.images || [variant?.image || product.img || product.image]));
  const optionRows = [...document.querySelectorAll('.product-buy .option-row')];
  if (group?.sizes?.length && optionRows[1]) {
    const activeSize = size;
    optionRows[1].innerHTML = `${group.sizes.map((itemSize, index) => `<button type="button" class="${itemSize === activeSize || (!group.sizes.includes(activeSize) && index === 0) ? 'active' : ''}">${itemSize}</button>`).join('')}<a href="style-guide.html">Size Guide</a>`;
  }
}

function refreshSelectedProductFromUrl() {
  if (!window.location.pathname.endsWith('product.html')) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id || window.__zavoraProductRefreshId === id) return;
  window.__zavoraProductRefreshId = id;
  Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))
    .then((pages) => {
      const products = pages.flat();
      const product = products.find((item) => String(item.id) === String(id) || String(item.printfulId) === String(id));
      if (product) {
        rememberSelectedProduct(product);
        initDynamicProductPage();
      }
    })
    .catch(() => {});
}

function productGalleryImages(product) {
  const groups = product?.variantGroups || {};
  const firstGroup = groups[Object.keys(groups)[0]];
  if (firstGroup?.images?.length) return firstGroup.images;
  return Array.from(new Set([
    ...(product?.images || []),
    product?.img,
    product?.image
  ].filter(Boolean)));
}

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem('zavora_recently_viewed') || localStorage.getItem('zavora_recent') || '[]');
  } catch (error) {
    return [];
  }
}

function updateProductStockNote(product) {
  const stock = getProductStock(product);
  const note = document.querySelector('[data-stock-note]');
  const add = document.querySelector('[data-product-add], .product-actions .primary-cta');
  const buy = document.querySelector('[data-buy-now]');
  const isLimited = String(product?.badge || '').toLowerCase().includes('limited') || (product?.collection || []).includes('limited');
  if (note) {
    note.hidden = !isLimited && stock > 0;
    note.textContent = stock > 0 ? `${stock} available` : 'Out of stock';
  }
  [add, buy].forEach((button) => {
    if (!button) return;
    button.toggleAttribute('aria-disabled', stock <= 0);
    button.classList.toggle('disabled', stock <= 0);
  });
}

function initDynamicProductPage() {
  if (!window.location.pathname.endsWith('product.html')) return;
  const product = getSelectedProduct();
  if (!product) return;
  const title = document.querySelector('.product-buy h1');
  const price = document.querySelector('.product-buy .price');
  const description = document.querySelector('.product-buy > p:not(.eyebrow):not(.price)');
  const eyebrow = document.querySelector('.product-buy .eyebrow');
  const gallery = document.querySelector('.product-gallery');
  const optionRows = [...document.querySelectorAll('.product-buy .option-row')];
  const colors = Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'default'];
  const groups = product.variantGroups || {};
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL'];
  const variantImages = productGalleryImages(product);
  document.title = `${product.name} | Zavora Fashion`;
  if (title) title.textContent = product.name;
  if (price) price.innerHTML = `${product.compareAt ? `<s>${money(product.compareAt)}</s> ` : ''}${money(product.price)}`;
  if (description) description.textContent = product.description || 'Premium Zavora Fashion streetwear piece with clean fit, everyday comfort, and USA-ready fulfillment.';
  if (eyebrow) eyebrow.textContent = product.badge || 'Zavora';
  if (gallery) {
    renderProductGallery(product, variantImages);
  }
  if (optionRows[0]) {
    optionRows[0].innerHTML = colors.map((color, index) => {
      const key = normalizedProductColor(color);
      const label = groups[key]?.label || (color === 'default' ? 'Original' : `${color[0].toUpperCase()}${color.slice(1)}`);
      return `<button type="button" class="${index === 0 ? 'active' : ''}" data-color="${key}">${label}</button>`;
    }).join('');
  }
  if (optionRows[1]) {
    optionRows[1].innerHTML = `${sizes.map((size, index) => `<button type="button" class="${index === 0 ? 'active' : ''}">${size}</button>`).join('')}<a href="style-guide.html">Size Guide</a>`;
  }
  const actions = document.querySelector('.product-actions');
  if (actions && !document.querySelector('[data-stock-note]')) {
    actions.insertAdjacentHTML('beforebegin', '<p class="stock-note" data-stock-note></p>');
  }
  const add = document.querySelector('.product-actions .primary-cta');
  const wishlistButton = document.querySelector('.product-actions .secondary-btn');
  if (add) {
    add.href = '#';
    add.dataset.productAdd = 'true';
    add.textContent = 'Add to Cart';
  }
  if (wishlistButton) {
    wishlistButton.href = '#';
    wishlistButton.dataset.addSelectedWishlist = 'true';
  }
  const buy = [...document.querySelectorAll('.product-buy > .primary-cta')].find((link) => !link.closest('.product-actions'));
  if (buy) {
    buy.href = '#';
    buy.dataset.buyNow = 'true';
    buy.textContent = 'Buy Now';
  }
  document.querySelectorAll('.split-band article:first-child p').forEach((node) => {
    node.textContent = product.description || node.textContent;
  });
  updateProductStockNote(product);
  updateDynamicProductMedia();
  refreshSelectedProductFromUrl();
}

async function initDynamicRelatedProducts() {
  if (!window.location.pathname.endsWith('product.html')) return;
  if (document.querySelector('[data-smart-product-rails]')) return;
  const anchor = [...document.querySelectorAll('.section-title')].find((section) => section.textContent.includes('Related Products'))?.parentElement
    || document.querySelector('.product-detail')?.parentElement;
  if (!anchor) return;
  try {
    const current = getSelectedProduct();
    const gender = String(current?.gender || 'men').toLowerCase() === 'women' ? 'women' : 'men';
    const allProducts = await fetchCatalogProducts(gender, 1000);
    if (!Array.isArray(allProducts) || !allProducts.length) return;
    const base = allProducts.filter((item) => String(item.id) !== String(current?.id));
    const categoryFamily = similarCategoryList(current?.category);
    const rails = [
      ['Recommended For You', base.filter((item) => categoryFamily.includes(item.category))],
      ['You May Also Like', base.filter((item) => item.category !== current?.category && adjacentCategoryList(current?.category).includes(item.category))],
      ['Recently Viewed', getRecentlyViewed().filter((item) => String(item.id) !== String(current?.id) && String(item.gender || '').toLowerCase() === gender)],
      ['New Arrivals', base.filter((item) => item.collection?.includes('new'))],
      ['Best Sellers', base.filter((item) => item.collection?.includes('best') || item.popularity >= 84)],
      ['Similar Products', base.filter((item) => item.category === current?.category)]
    ].map(([title, products]) => [title, uniqueProducts(products).slice(0, 10)]);
    const section = document.createElement('section');
    section.className = 'section product-smart-rails';
    section.dataset.smartProductRails = 'true';
    section.innerHTML = rails.map(([title, products]) => `
      <div class="product-rail">
        <div class="global-rail-head"><div><p class="eyebrow">${title}</p><h2>${title}</h2></div></div>
        <div class="product-rail-track">${products.length ? products.map(catalogCard).join('') : '<p class="catalog-loading">More products coming soon.</p>'}</div>
      </div>
    `).join('');
    anchor.replaceWith(section);
    window.__zavoraCatalogProducts = uniqueProducts([...(window.__zavoraCatalogProducts || []), ...base]);
    refreshWishlistButtons();
  } catch (error) {
    anchor.dataset.realRelatedLoaded = 'failed';
  }
}

async function initHomepageRecommendationRails() {
  const pageName = window.location.pathname.split('/').pop() || 'index.html';
  if (pageName !== 'index.html' && pageName !== '') return;
  if (document.querySelector('[data-home-recommendation-rails]')) return;
  const anchor = document.querySelector('.product-section') || document.querySelector('.banner.section') || document.querySelector('.footer');
  if (!anchor) return;
  const allProducts = uniqueProducts((await Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))).flat());
  if (!allProducts.length) return;
  const used = new Set();
  const take = (list, count = 10) => {
    const selected = [];
    uniqueProducts(list).forEach((product) => {
      const key = productKey(product);
      if (selected.length < count && !used.has(key)) {
        selected.push(product);
        used.add(key);
      }
    });
    if (selected.length < count) {
      allProducts.forEach((product) => {
        const key = productKey(product);
        if (selected.length < count && !used.has(key)) {
          selected.push(product);
          used.add(key);
        }
      });
    }
    return selected;
  };
  const rails = [
    ['New Arrivals', take(allProducts.filter((item) => item.collection?.includes('new') || item.badge === 'NEW'))],
    ['Best Sellers', take(allProducts.filter((item) => item.collection?.includes('best') || Number(item.popularity || 0) >= 84))],
    ['Trending Now', take([...allProducts].sort((a, b) => Number(b.popularity || 0) - Number(a.popularity || 0)))],
    ['Recommended For You', take(allProducts.filter((item) => ['hoodies', 'sweatshirts', 'oversized-tees', 'heavyweight-tees'].includes(item.category)))],
    ['Recently Added', take([...allProducts].reverse())],
    ["Editor's Picks", take(allProducts.filter((item) => ['jackets', 'accessories', 'cargo-pants'].includes(item.category)))],
    ['Luxury Essentials', take(allProducts.filter((item) => ['oversized-tees', 'heavyweight-tees', 'sweatpants'].includes(item.category)))],
    ['Limited Drop', take(allProducts.filter((item) => item.collection?.includes('limited') || item.badge === 'LIMITED'))]
  ].filter(([, products]) => products.length);
  const section = document.createElement('section');
  section.className = 'section product-smart-rails home-recommendation-rails';
  section.dataset.homeRecommendationRails = 'true';
  section.innerHTML = rails.map(([title, products]) => `
    <div class="product-rail">
      <div class="global-rail-head"><div><p class="eyebrow">${title}</p><h2>${title}</h2></div></div>
      <div class="product-rail-track">${products.map(catalogCard).join('')}</div>
    </div>
  `).join('');
  anchor.insertAdjacentElement('afterend', section);
  window.__zavoraCatalogProducts = uniqueProducts([...(window.__zavoraCatalogProducts || []), ...allProducts]);
  refreshWishlistButtons();
}

function uniqueProducts(products = []) {
  const seen = new Set();
  return products.filter((product) => {
    const key = String(product?.id || product?.printfulId || product?.name || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function similarCategoryList(category = '') {
  const map = {
    hoodies: ['hoodies', 'zip-hoodies', 'cropped-hoodies', 'sweatshirts', 'jackets'],
    'zip-hoodies': ['zip-hoodies', 'hoodies', 'sweatshirts', 'jackets'],
    'cropped-hoodies': ['cropped-hoodies', 'hoodies', 'sweatshirts', 'jackets'],
    sweatshirts: ['sweatshirts', 'hoodies', 'zip-hoodies', 'jackets'],
    'oversized-tees': ['oversized-tees', 'heavyweight-tees', 'baby-tees'],
    'heavyweight-tees': ['heavyweight-tees', 'oversized-tees'],
    'baby-tees': ['baby-tees', 'oversized-tees'],
    jackets: ['jackets', 'hoodies', 'sweatshirts'],
    'cargo-pants': ['cargo-pants', 'sweatpants', 'shorts'],
    sweatpants: ['sweatpants', 'cargo-pants', 'shorts'],
    shorts: ['shorts', 'sweatpants', 'cargo-pants'],
    accessories: ['accessories']
  };
  return map[category] || [category];
}

function adjacentCategoryList(category = '') {
  return similarCategoryList(category).filter((item) => item !== category);
}

function initProductOptions() {
  document.querySelectorAll('.product-buy .option-row').forEach((row) => {
    const first = row.querySelector('button');
    if (first && !row.querySelector('button.active')) first.classList.add('active');
  });
  initDynamicProductPage();
  initDynamicRelatedProducts();
}

async function initRewardsPage() {
  if (!window.location.pathname.endsWith('rewards.html')) return;
  const response = await fetch('/api/rewards', { credentials: 'include' }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (response?.ok && data.ok) {
    document.querySelector('[data-wallet-balance]')?.replaceChildren(document.createTextNode(money(data.balance || 0)));
  }
}

function initCheckoutGiftUi() {
  const promo = document.querySelector('.checkout-form .promo');
  if (!promo || document.querySelector('.gift-card-apply')) return;
  promo.insertAdjacentHTML('afterend', `
    <div class="gift-card-apply">
      <label>Gift card number<input data-gift-card-input placeholder="ZVG-2026-ABC123"></label>
      <button class="secondary-btn slim-btn" type="button" data-apply-gift-card>Apply gift card</button>
      <p data-gift-card-status>Use Zavora gift card balance before PayPal payment.</p>
    </div>
  `);
  const discount = [...document.querySelectorAll('.summary-line')].find((line) => line.textContent.includes('Discount'))?.querySelector('strong');
  if (discount) discount.setAttribute('data-gift-discount', '');
  const subtotal = [...document.querySelectorAll('.summary-line')].find((line) => line.textContent.includes('Subtotal'))?.querySelector('strong');
  if (subtotal) {
    subtotal.removeAttribute('data-checkout-total');
    subtotal.setAttribute('data-checkout-subtotal', '');
  }
  const methods = document.querySelector('.payment-methods');
  if (methods && !methods.querySelector('[data-cod-method]')) {
    methods.insertAdjacentHTML('beforeend', `
      <label class="payment-active cod-method" data-cod-method><input type="radio" name="payment" value="cod"><span class="pay-icon cod">COD</span><small>Cash on Delivery test order</small></label>
    `);
  }
  document.querySelectorAll('input[name="shipping"]').forEach((input) => {
    input.addEventListener('change', hydrateCheckoutSummary);
  });
}

function renderGiftCardsPage() {
  if (!window.location.pathname.endsWith('gift-cards.html')) return;
  const main = document.querySelector('main');
  if (!main) return;
  main.innerHTML = `
    <section class="gift-page">
      <div class="gift-hero">
        <div>
          <p class="eyebrow">Zavora Gift Cards</p>
          <h1>A premium gift for everyday luxury.</h1>
          <p>Search, choose value, add to bag, and receive a unique digital card number that can be applied at checkout.</p>
          <input class="gift-search" type="search" placeholder="Search $50, $100, birthday, holiday..." data-gift-search>
        </div>
        <article class="gift-preview">
          <span>ZAVORA FASHION</span>
          <strong data-gift-value>$100</strong>
          <small>Unique card number</small>
          <em data-gift-code>ZVG-2026-READY</em>
        </article>
      </div>
      <section class="gift-layout">
        <aside class="gift-builder">
          <h2>Build gift card</h2>
          <div class="gift-values">
            <button type="button" class="active" data-gift-amount="50">$50</button>
            <button type="button" data-gift-amount="100">$100</button>
            <button type="button" data-gift-amount="150">$150</button>
            <button type="button" data-gift-amount="250">$250</button>
          </div>
          <input data-gift-recipient placeholder="Recipient email">
          <textarea placeholder="Gift message"></textarea>
          <button class="primary-cta" type="button" data-add-gift-card>Add Gift Card to Bag</button>
          <p data-gift-status>Gift card number appears here after add to bag.</p>
        </aside>
        <div class="gift-grid">
          ${[50, 100, 150, 250, 300, 500].map((value) => `
            <article class="gift-mini" data-gift-card="${value} premium digital card">
              <span>ZAVORA</span>
              <h3>${money(value)} Gift Card</h3>
              <p>Digital delivery, unique card number, checkout balance support.</p>
              <button type="button" data-gift-amount="${value}">Select ${money(value)}</button>
            </article>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

function renderSupportPages() {
  const pageName = window.location.pathname.split('/').pop();
  const main = document.querySelector('main');
  if (!main) return;
  const supportFooter = `<p class="policy-quote">Zavora support is built for clear answers, fast action, and a premium customer experience.<br><span>Support: ${SUPPORT_EMAIL} / Legal: ${LEGAL_EMAIL}</span></p>`;
  if (pageName === 'help-center.html') {
    main.innerHTML = `
      <section class="policy-shell"><div class="policy-content"><p class="eyebrow">Help Center</p><h1>How can we help?</h1><p>Find quick answers for orders, shipping, returns, exchanges, payments, gift cards, and account support.</p>
      <div class="faq-list">
        ${['How do I track my order?|Use the Track Order page with your order number and email address.', 'How do I start an exchange?|Open Exchange Policy and submit your order details before shipping the item back.', 'Can I cancel an order?|Orders can be cancelled within 24 hours if they have not entered shipment preparation.', 'How do gift cards work?|Buy a digital card, copy the unique number, and apply it during checkout.', 'Which payment method works now?|PayPal is live. Card, Apple Pay, and Google Pay are coming soon.'].map((item) => {
          const [q, a] = item.split('|');
          return `<article class="faq-item"><button type="button" data-faq-question>${q}</button><p>${a}</p></article>`;
        }).join('')}
      </div>${supportFooter}</div><aside class="policy-sidebar"><h3>Quick Links</h3><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><a href="track-order.html">Track Order</a><a href="exchange-policy.html">Exchange Policy</a><a href="cancel-order.html">Cancel Order</a><a href="return-refund-policy.html">Returns</a><a href="style-guide.html">Size Guide</a><a href="contact.html">Contact Support</a></aside></section>`;
  }
  if (pageName === 'exchange-policy.html') {
    main.innerHTML = `
      <section class="policy-shell"><div class="policy-content"><p class="eyebrow">Exchange Policy</p><h1>Start an exchange</h1><p>Exchange eligible unworn, unwashed, undamaged items with all tags and packaging attached. Exchanges depend on stock availability.</p>
      <div class="policy-cards"><article><h3>1. Request</h3><p>Submit order number, email, item, preferred size/color, and reason.</p></article><article><h3>2. Review</h3><p>Zavora checks eligibility and sends exchange instructions.</p></article><article><h3>3. Ship Back</h3><p>Return the original item in brand-new condition.</p></article><article><h3>4. Replacement</h3><p>After inspection, the replacement ships or store credit is issued.</p></article></div>
      <form class="form-panel"><input placeholder="Order number"><input placeholder="Email address"><select><option>Size exchange</option><option>Color exchange</option><option>Damaged item replacement</option></select><textarea placeholder="Exchange details"></textarea><button class="primary-cta" type="button">Start Exchange</button></form>${supportFooter}</div><aside class="policy-sidebar"><h3>Exchange Rules</h3><p>Unused condition required.</p><p>Tags and packaging required.</p><p>Stock must be available.</p><p>Damaged delivery gets priority review.</p></aside></section>`;
  }
  if (pageName === 'cancel-order.html') {
    main.innerHTML = `
      <section class="policy-shell"><div class="policy-content"><p class="eyebrow">Cancel Order</p><h1>Cancel within 24 hours.</h1><p>You can request cancellation within 24 hours of purchase if the order has not entered packing, shipment preparation, or PayPal capture review.</p>
      <form class="form-panel"><input placeholder="Order number"><input placeholder="Email address"><select><option>Ordered by mistake</option><option>Wrong size or color</option><option>Need address change</option><option>Payment issue</option></select><textarea placeholder="Tell us why you want to cancel"></textarea><button class="primary-cta" type="button">Request Cancellation</button></form>
      <div class="policy-cards"><article><h3>Before 24 hours</h3><p>Request can be reviewed for cancellation.</p></article><article><h3>After 24 hours</h3><p>Use returns or exchange after delivery.</p></article><article><h3>Already shipped</h3><p>Cancellation is no longer available.</p></article></div>${supportFooter}</div><aside class="policy-sidebar"><h3>Need Help?</h3><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a><a href="contact.html">Contact Support</a><a href="track-order.html">Track Order</a><a href="return-refund-policy.html">Return Policy</a></aside></section>`;
  }
  if (pageName === 'style-guide.html') {
    main.innerHTML = `
      <section class="policy-shell"><div class="policy-content"><p class="eyebrow">Size Guide</p><h1>Find your Zavora fit.</h1><p>Choose true size for relaxed luxury streetwear, size down for cleaner shape, or size up for extra volume.</p>
      <table class="size-chart"><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Best For</th></tr></thead><tbody><tr><td>XS</td><td>34-36 in</td><td>26-28 in</td><td>Clean fit</td></tr><tr><td>S</td><td>36-38 in</td><td>28-30 in</td><td>Relaxed fit</td></tr><tr><td>M</td><td>38-41 in</td><td>30-33 in</td><td>Signature fit</td></tr><tr><td>L</td><td>41-44 in</td><td>33-36 in</td><td>Oversized</td></tr><tr><td>XL</td><td>44-48 in</td><td>36-40 in</td><td>Maximum volume</td></tr></tbody></table>
      <div class="policy-cards"><article><h3>Fit Options</h3><p>Relaxed, oversized, cropped, and wide-leg product fits are supported.</p></article><article><h3>Measure</h3><p>Use a soft tape around chest, waist, shoulder, and inseam.</p></article><article><h3>Color</h3><p>Black, white, gray, and seasonal gold-accent pieces can be selected on product pages.</p></article></div>${supportFooter}</div><aside class="policy-sidebar"><h3>Need Fit Help?</h3><p>Email ${SUPPORT_EMAIL} with your height, weight, and desired fit.</p><a href="contact.html">Contact Support</a></aside></section>`;
  }
}

function injectEmailContactCards() {
  const pageName = window.location.pathname.split('/').pop();
  if (document.querySelector('.email-contact-card')) return;
  const targetPages = ['contact.html', 'privacy-policy.html', 'terms-conditions.html', 'cookie-policy.html', 'refund-policy.html', 'shipping-policy.html'];
  if (!targetPages.includes(pageName)) return;
  const card = document.createElement('section');
  card.className = 'section email-contact-card';
  card.innerHTML = `
    <div>
      <p class="eyebrow">Zavora Contacts</p>
      <h2>Need help or legal support?</h2>
      <p>For customer support use support@zavorafashion.com. For orders use orders@zavorafashion.com, shipping use shipping@zavorafashion.com, returns use returns@zavorafashion.com, and general enquiries use info@zavorafashion.com. For policy or legal questions use ${LEGAL_EMAIL}.</p>
    </div>
    <div class="email-contact-actions">
      <a class="secondary-btn" href="mailto:${SUPPORT_EMAIL}">Email Support</a>
      <a class="secondary-btn" href="mailto:${LEGAL_EMAIL}">Email Legal</a>
    </div>
  `;
  const footer = document.querySelector('.footer');
  if (footer?.parentNode) footer.parentNode.insertBefore(card, footer);
}

renderRegisterPage();
resumePendingSignupOtp();
renderGiftCardsPage();
renderSupportPages();
injectEmailContactCards();
enhanceFooter();
injectLargeCatalog();
filterLargeCatalog();
loadPrintfulCatalog();
initHomepageRecommendationRails();
injectProductRails();
cleanAuthPageFooter();
initCheckoutGiftUi();
initRewardsPage();
hydrateCheckoutSummary();
initRealtimeTracking();
initTrackOrderLookup();
initOrderSuccessDetails();
initPaymentMethodUi();
initFaqAccordions();
initProductOptions();

function initHomeBanners() {
  const hero = document.querySelector('.hero');
  const image = hero?.querySelector('img');
  if (!hero || !image || document.querySelector('.hero-dots')) return;

  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=82',
      label: 'Summer 2026 Drop',
      copy: 'Luxury minimal streetwear for evenings, airports, city walks, and everything that needs confidence.'
    },
    {
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=82',
      label: 'Oversized Collection',
      copy: 'Heavy layers, wide proportions, and quiet premium details for daily styling.'
    },
    {
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&q=82',
      label: 'New Arrivals',
      copy: 'Fresh silhouettes in black, white, gray, and gold accents.'
    },
    {
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=82',
      label: 'Best Sellers',
      copy: 'The pieces customers keep choosing for a complete city wardrobe.'
    },
    {
      image: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1800&q=82',
      label: 'Limited Edition',
      copy: 'Gold label essentials. Small batch. No restock.'
    }
  ];
  const label = hero.querySelector('.eyebrow');
  const copy = hero.querySelector('p:not(.eyebrow)');
  const dots = document.createElement('div');
  dots.className = 'hero-dots';
  dots.innerHTML = banners.map((_, index) => `<button type="button" aria-label="Show banner ${index + 1}"></button>`).join('');
  hero.appendChild(dots);

  let active = 0;
  function showBanner(index) {
    active = index;
    image.src = banners[index].image;
    if (label) label.textContent = banners[index].label;
    if (copy) copy.textContent = banners[index].copy;
    dots.querySelectorAll('button').forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === index));
  }
  dots.querySelectorAll('button').forEach((button, index) => button.addEventListener('click', () => showBanner(index)));
  showBanner(0);
  setInterval(() => showBanner((active + 1) % banners.length), 5000);
}

initHomeBanners();
}
