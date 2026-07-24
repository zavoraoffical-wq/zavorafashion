if (typeof window !== 'undefined') {
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
    window.addEventListener(eventName, (e) => e.preventDefault(), { passive: false });
  });

  document.addEventListener('focusin', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      e.target.style.fontSize = '16px';
    }
  }, { passive: true });
}

function trackMetaEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, params);
    } catch (e) {
      console.error('[Meta Pixel] Error tracking:', e);
    }
  }
}

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

function normalizePageName(raw) {
  const path = (typeof raw === 'string' ? raw : (window.location.pathname || '')).split('?')[0].split('#')[0];
  const last = path.split('/').pop() || 'index';
  const clean = last.replace(/\.html$/i, '').toLowerCase();
  return (clean === '' || clean === 'index') ? 'index' : clean;
}

function isCurrentPage(target) {
  return normalizePageName(window.location.pathname) === normalizePageName(target);
}

const plainCommercePages = [
  'login', 'login.html', 'dashboard', 'dashboard.html', 'sign-up', 'sign-up.html',
  'forgot-password', 'forgot-password.html', 'checkout', 'checkout.html',
  'order-success', 'order-success.html', 'track-order', 'track-order.html',
  'contact', 'contact.html', 'about', 'about.html', 'journal', 'journal.html',
  'return-refund-policy', 'return-refund-policy.html', 'returns', 'returns.html',
  'privacy-policy', 'privacy-policy.html', 'terms-conditions', 'terms-conditions.html',
  'faq', 'faq.html'
];

const catalogOnlyPages = [
  'women', 'women.html', 'men', 'men.html', 'new-arrivals', 'new-arrivals.html',
  'collections', 'collections.html', 'best-sellers', 'best-sellers.html',
  'limited', 'limited.html', 'shop', 'shop.html', 'product-filters', 'product-filters.html',
  'recommended-products', 'recommended-products.html', 'recently-viewed', 'recently-viewed.html',
  'trending', 'trending.html', 'oversized', 'oversized.html'
];
const PAGE_CART_KEY = 'zavoraCart';
const GIFT_CARD_KEY = 'zavoraGiftCards';
const WISHLIST_KEY = 'zavoraWishlist';
const APPLIED_GIFT_KEY = 'zavoraAppliedGiftCard';
const AUTH_OTP_PENDING_KEY = 'zavoraAuthOtpPending';
const ORDER_HISTORY_KEY = 'zavoraOrders';
const ADDRESS_BOOK_KEY = 'zavoraAddresses';
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
const CURRENCY_KEY = 'zavoraCurrency';
const COUNTRY_KEY = 'zavoraCountry';
const currencyRates = {
  USD: { symbol: '$', rate: 1, locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
  INR: { symbol: '₹', rate: 83.5, locale: 'en-IN' }
};

function initLaunchGate() {
  return false;
}

function money(value) {
  const code = localStorage.getItem(CURRENCY_KEY) || 'USD';
  const currency = currencyRates[code] || currencyRates.USD;
  const converted = Number(value || 0) * currency.rate;
  const digits = code === 'INR' ? 0 : 2;
  return `${currency.symbol}${converted.toLocaleString(currency.locale, { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

const DEMO_PRODUCT_NAMES = new Set([
  'studio wide trouser',
  'monogram cap',
  'noir oversized hoodie',
  'gold label tee',
  'avenue cargo pant',
  'ivory heavyweight tee',
  'zavora cropped jacket'
]);

function cartLineKey(item = {}) {
  const base = String(item?.id || item?.printfulId || item?.name || '').trim();
  const color = String(item?.color || item?.colors?.[0] || '').trim().toLowerCase();
  const size = String(item?.size || item?.sizes?.[0] || '').trim().toLowerCase();
  return [base, color, size].filter(Boolean).join('::');
}

function getSavedCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(PAGE_CART_KEY)) || [];
    return normalizeCartItems(raw);
  } catch (error) {
    return [];
  }
}

function saveSavedCart(cart) {
  localStorage.setItem(PAGE_CART_KEY, JSON.stringify(normalizeCartItems(cart)));
}

function normalizeCartItems(cart = []) {
  const seen = new Set();
  return (Array.isArray(cart) ? cart : []).filter((item) => {
    const key = cartLineKey(item);
    const name = String(item?.name || '').trim().toLowerCase();
    if (!key || !name || name === 'zavora product' || name === 'undefined' || DEMO_PRODUCT_NAMES.has(name)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    item.qty = Math.max(1, Number(item.qty || 1));
    return true;
  });
}

function getLoginUrl(next = window.location.href) {
  const target = safeInternalUrl(next || window.location.href, 'dashboard.html');
  return `login.html?next=${encodeURIComponent(target)}`;
}

function safeInternalUrl(value, fallback = 'dashboard.html') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (/^(javascript|data|vbscript):/i.test(raw)) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    const path = `${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
    return path || fallback;
  } catch (error) {
    return fallback;
  }
}

function safeNextParam(fallback = 'dashboard.html') {
  return safeInternalUrl(new URLSearchParams(window.location.search).get('next'), fallback);
}

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveWishlist(items) {
  const seen = new Set();
  const clean = (Array.isArray(items) ? items : []).filter((item) => {
    const key = productKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(clean));
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
  if (authUser && authUser.email) return authUser;
  try {
    const saved = JSON.parse(localStorage.getItem('zavoraUser') || localStorage.getItem('zavora_user') || 'null');
    if (saved && (saved.email || saved.name)) return saved;
  } catch (e) {}
  if (authDashboardData?.user?.email) return authDashboardData.user;
  return null;
}

function saveUserAccount(account) {
  authUser = account || authUser;
  authSessionLoaded = true;
  if (account) {
    try {
      localStorage.setItem('zavoraUser', JSON.stringify(account));
    } catch (e) {}
  }
  updateAccountLinks();
}

function isUserLoggedIn() {
  return !!authUser;
}

function loginUser(account) {
  if (!account) return;
  saveUserAccount(account);
}

function savePendingCommerceAction(type, product, destination = 'checkout.html') {
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
        <p>Your $10 bank payout request has been received. Confirmation email sent to your account.</p>
        <p><strong data-offer-wallet-balance></strong> payout request</p>
        <div class="login-required-actions">
          <a class="primary-cta" href="shop.html">Shop Now</a>
          <button class="secondary-btn" type="button" data-close-offer-claimed>Done</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.querySelector('[data-offer-wallet-balance]').textContent = money(10);
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
  const found = cart.find((item) => cartLineKey(item) === cartLineKey(line));
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
    return 'checkout.html';
  }
  if (pending.type === 'cart-open' || pending.type === 'checkout') {
    return pending.destination || 'checkout.html';
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

function initLocalizationSelectors() {
  const savedCurrency = localStorage.getItem(CURRENCY_KEY) || 'USD';
  const savedCountry = localStorage.getItem(COUNTRY_KEY) || 'USA';
  document.querySelectorAll('select[aria-label="Currency selector"]').forEach((select) => {
    [...select.options].forEach((opt) => {
      if (opt.value === savedCurrency || opt.textContent.trim() === savedCurrency) {
        select.value = opt.value || opt.textContent.trim();
      }
    });
    select.addEventListener('change', (e) => {
      const selected = e.target.value || e.target.options[e.target.selectedIndex]?.text || 'USD';
      localStorage.setItem(CURRENCY_KEY, selected.trim());
      window.location.reload();
    });
  });
  document.querySelectorAll('select[aria-label="Country selector"]').forEach((select) => {
    [...select.options].forEach((opt) => {
      if (opt.value === savedCountry || opt.textContent.trim() === savedCountry) {
        select.value = opt.value || opt.textContent.trim();
      }
    });
    select.addEventListener('change', (e) => {
      const selected = e.target.value || e.target.options[e.target.selectedIndex]?.text || 'USA';
      localStorage.setItem(COUNTRY_KEY, selected.trim());
    });
  });
}

async function loadDashboardData() {
  if (!isCurrentPage('dashboard')) return null;
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

function getDashboardOrders() {
  const localOrders = getSavedOrders();
  let lastOrder = null;
  try {
    lastOrder = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
  } catch (e) {}

  const email = String(authDashboardData?.user?.email || authUser?.email || '').toLowerCase();
  const liveOrders = Array.isArray(authDashboardData?.orders) ? authDashboardData.orders : [];

  const seen = new Set();
  const all = [];

  if (lastOrder && lastOrder.id) {
    const key = String(lastOrder.id).replace(/^#/, '');
    seen.add(key);
    all.push(lastOrder);
  }

  [...localOrders, ...liveOrders].forEach((order) => {
    if (!order || !order.id) return;
    const key = String(order.id).replace(/^#/, '');
    if (!seen.has(key)) {
      seen.add(key);
      all.push(order);
    }
  });

  return all.sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
}

function getSavedAddresses() {
  try {
    const all = JSON.parse(localStorage.getItem(ADDRESS_BOOK_KEY)) || [];
    const email = String(authDashboardData?.user?.email || authUser?.email || '').toLowerCase();
    return (Array.isArray(all) ? all : []).filter((item) => !email || String(item.email || '').toLowerCase() === email);
  } catch (error) {
    return [];
  }
}

function saveSavedAddresses(addresses) {
  const email = String(authDashboardData?.user?.email || authUser?.email || '').toLowerCase();
  let all = [];
  try {
    all = JSON.parse(localStorage.getItem(ADDRESS_BOOK_KEY)) || [];
  } catch (error) {
    all = [];
  }
  const other = (Array.isArray(all) ? all : []).filter((item) => String(item.email || '').toLowerCase() !== email);
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify([...other, ...addresses.map((item) => ({ ...item, email }))]));
}

function createTestOrder(method = 'PayPal') {
  const cart = getSavedCart();
  if (!cart.length) return null;
  const form = document.querySelector('.checkout-form');
  const user = getUserAccount();

  const formEmail = form?.querySelector('input[type="email"], input[placeholder*="Email"]')?.value.trim().toLowerCase();
  const formName = form?.querySelector('input[placeholder*="name"]')?.value.trim();
  const formPhone = form?.querySelector('input[type="tel"], input[placeholder*="phone"]')?.value.trim();

  const email = formEmail || user?.email || authUser?.email || 'zavoraoffical@gmail.com';
  const name = formName || user?.name || authUser?.name || (email ? email.split('@')[0] : 'Zavora Customer');
  const phone = formPhone || user?.phone || authUser?.phone || '';

  const street = form?.querySelector('input[placeholder*="Street"]')?.value.trim() || '';
  const apartment = form?.querySelector('input[placeholder*="Apartment"]')?.value.trim() || '';
  const city = form?.querySelector('input[placeholder*="City"]')?.value.trim() || '';
  const zip = form?.querySelector('input[placeholder*="ZIP"]')?.value.trim() || '';
  let address = [street, apartment, city, zip].filter(Boolean).join(', ');
  
  if (!address && typeof getSavedAddresses === 'function') {
    const savedAddrs = getSavedAddresses();
    if (savedAddrs.length) {
      const a = savedAddrs[0];
      address = [a.street, a.apartment, a.city, a.zip].filter(Boolean).join(', ');
    }
  }
  if (!address) address = '123 USA Luxury Way, Suite 4B, New York, NY 10001';

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const shippingCost = Number(document.querySelector('input[name="shipping"]:checked')?.value || 0);

  let couponDiscount = 0;
  try {
    const coupon = JSON.parse(localStorage.getItem('zavoraAppliedCoupon') || 'null');
    if (coupon?.code) {
      const code = String(coupon.code).toUpperCase();
      if (code === 'WELCOME10') couponDiscount = subtotal >= 49 ? 10 : 0;
      else if (code === 'SUMMER15') couponDiscount = subtotal * 0.15;
    }
  } catch (e) {}

  let giftDiscount = 0;
  try {
    const gift = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY) || 'null');
    if (gift?.code) giftDiscount = Math.min(subtotal - couponDiscount, Number(gift.balance || gift.value || 0));
  } catch (e) {}

  const totalDiscount = couponDiscount + giftDiscount;
  const finalTotal = Math.max(0, subtotal + shippingCost - totalDiscount);

  const suffix = String(Date.now()).slice(-6);
  const orderId = `ZVR-${suffix}`;
  const trackingId = `ZV-${suffix}`;

  const order = {
    id: orderId,
    email: email,
    customer: name,
    phone: phone,
    address: address,
    method: method,
    status: 'Paid',
    tracking: trackingId,
    subtotal: subtotal,
    shipping: shippingCost,
    discount: totalDiscount,
    total: finalTotal,
    items: cart,
    createdAt: new Date().toISOString()
  };
  const orders = getSavedOrders().filter((item) => item.id !== order.id);
  orders.unshift(order);
  saveSavedOrders(orders);
  localStorage.setItem('zavoraLastOrder', JSON.stringify(order));

  finalizeOrderPayment(cart);
  return order;
}

function finalizeOrderPayment(cartItems) {
  try {
    const applied = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY));
    if (applied && applied.code) {
      const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
      const discountUsed = Math.min(subtotal, Number(applied.balance || applied.value || 0));
      if (discountUsed > 0) {
        const giftCards = JSON.parse(localStorage.getItem(GIFT_CARD_KEY)) || [];
        const index = giftCards.findIndex((card) => card.code === applied.code);
        if (index !== -1) {
          giftCards[index].balance = Math.max(0, Number(giftCards[index].balance || 0) - discountUsed);
          localStorage.setItem(GIFT_CARD_KEY, JSON.stringify(giftCards));
        }
      }
    }
  } catch (error) {
    console.error('Error finalizing gift card payment:', error);
  }
  localStorage.removeItem(APPLIED_GIFT_KEY);
  saveSavedCart([]);
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
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.order) {
      const saved = { ...order, ...data.order };
      localStorage.setItem('zavoraLastOrder', JSON.stringify(saved));
      return saved;
    }
  } catch (error) {}
  return order;
}

function cartQuantity() {
  return getSavedCart().length;
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
      <a href="/">Home</a>
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
          <img src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80" alt="Zavora women streetwear">
        </a>
      </div>
    `);
  }
}

const pageMegaMenuData = {
  women: {
    label: '',
    title: 'Oversized tees, hoodies, sweat sets, jackets, and accessories for premium everyday styling.',
    href: 'women.html',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    items: [['Oversized Tees', 'oversized-tees'], ['Baby Tees', 'baby-tees'], ['Hoodies', 'hoodies'], ['Cropped Hoodies', 'cropped-hoodies'], ['Sweatpants', 'sweatpants'], ['Jackets', 'jackets'], ['Accessories', 'accessories']]
  },
  men: {
    label: '',
    title: 'Heavyweight layers, oversized fits, cargos, sweatpants, jackets, and accessories.',
    href: 'men.html',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    items: [['Oversized Tees', 'oversized-tees'], ['Heavyweight Tees', 'heavyweight-tees'], ['Hoodies', 'hoodies'], ['Zip Hoodies', 'zip-hoodies'], ['Cargo Pants', 'cargo-pants'], ['Sweatpants', 'sweatpants'], ['Jackets', 'jackets'], ['Shorts', 'shorts'], ['Accessories', 'accessories']]
  }
};

function initPageMegaMenu() {
  const menu = document.querySelector('#megaMenu');
  if (!menu || menu.dataset.ready) return;
  menu.dataset.ready = 'true';
  function update(type) {
    const data = pageMegaMenuData[type] || pageMegaMenuData.women;
    const eyebrow = menu.querySelector('.eyebrow');
    if (eyebrow) {
      if (data.label) {
        eyebrow.textContent = data.label;
        eyebrow.style.display = 'block';
      } else {
        eyebrow.style.display = 'none';
      }
    }
    menu.querySelector('h2').textContent = data.title;
    const visual = menu.querySelector('.mega-visual');
    if (visual) {
      visual.href = data.href;
      const img = visual.querySelector('img');
      if (img) {
        img.src = data.image;
        img.alt = `${type} Zavora Fashion`;
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
    if (homeCount) {
      homeCount.textContent = cartQuantity();
    } else {
      cart.textContent = `Bag ${cartQuantity()}`;
    }
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

function clearPageScrollLock() {
  document.body.classList.remove('mobile-menu-open');
  document.documentElement.classList.remove('mobile-menu-open');
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
}

function pageOverlayOpen() {
  return Boolean(document.querySelector('#mobilePanel.open, .search-overlay.open, .drawer.open, .quick-view.open, .account-panel.open, [data-login-required-modal].open'));
}

function releaseStalePageScrollLock() {
  if (!pageOverlayOpen()) clearPageScrollLock();
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
    clearPageScrollLock();
  };
  document.querySelectorAll('[data-page-open-menu], [data-open-menu]').forEach((button) => {
    button.addEventListener('click', open);
  });
  document.querySelectorAll('[data-page-close-mobile], [data-close-mobile]').forEach((button) => {
    button.addEventListener('click', close);
  });
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  window.addEventListener('pageshow', clearPageScrollLock);
  window.addEventListener('hashchange', releaseStalePageScrollLock);
  window.addEventListener('resize', releaseStalePageScrollLock);
  document.addEventListener('scroll', releaseStalePageScrollLock, { passive: true });
}

let pageHeaderTicking = false;
function syncPageHeader() {
  if (!pageHeaderTicking) {
    window.requestAnimationFrame(() => {
      if (pageHeader) {
        pageHeader.classList.toggle('scrolled', window.scrollY > 24);
      }
      pageHeaderTicking = false;
    });
    pageHeaderTicking = true;
  }
}

function currentPageKey() {
  const path = window.location.pathname.replace(/\/+$/, '');
  const last = path.split('/').pop() || 'index';
  return last.endsWith('.html') ? last : `${last}.html`;
}

async function enforceAuthState() {
  await fetchAuthSession(true);
  const pageName = currentPageKey();
  const protectedCommercePages = ['checkout.html', 'wishlist.html', 'rewards.html'];
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
    <article class="dashboard-card"><span>05</span><h3>Rewards</h3><p>Claim a bank payout reward after eligible delivered orders.</p><button class="text-link" type="button" data-dashboard-view="rewards">Open rewards</button></article>
  `,
  orders: `
    <article class="dashboard-card dashboard-wide"><span>Orders</span><h3>No orders yet</h3><p>Your order history appears here after checkout.</p></article>
  `,
  wishlist: `
    <article class="dashboard-card dashboard-wide"><span>Wishlist</span><h3>Saved Zavora pieces</h3><p>Wishlist items show here and stay inside dashboard.</p><button class="secondary-btn slim-btn" type="button" data-add-wishlist>Add product</button></article>
  `,
  addresses: `
    <article class="dashboard-card dashboard-wide"><span>Primary Address</span><h3>No saved address</h3><p>Add a delivery address for faster checkout.</p></article>
    <article class="dashboard-card dashboard-wide address-form"><span>Add Address</span><h3>Add new delivery address</h3><div class="mini-form"><input data-address-field="name" placeholder="Full name"><input data-address-field="street" placeholder="Street address"><input data-address-field="city" placeholder="City"><input data-address-field="zip" placeholder="ZIP code"></div><button class="secondary-btn slim-btn" type="button" data-add-address>Add address</button></article>
  `,
  profile: `
    <article class="dashboard-card dashboard-wide"><span>Profile</span><h3 data-profile-name>Zavora Customer</h3><p>Email: <strong data-profile-email></strong> / Country: USA / Currency: USD</p><div class="mini-form"><input data-profile-name-input placeholder="Full name"></div><button class="secondary-btn slim-btn" type="button" data-profile-save>Save profile</button></article>
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Change Password</h3><p>Update your Zavora account password for secure checkout and saved address access.</p><div class="mini-form"><input type="password" placeholder="Current password"><input type="password" placeholder="New password"><input type="password" placeholder="Confirm password"></div><button class="secondary-btn slim-btn" type="button" data-password-save>Update password</button></article>
  `,
  'change-password': `
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Change Password</h3><p>Update your Zavora account password for secure checkout and saved address access.</p><div class="mini-form"><input type="password" placeholder="Current password"><input type="password" placeholder="New password"><input type="password" placeholder="Confirm password"></div><button class="secondary-btn slim-btn" type="button" data-password-save>Update password</button></article>
    <article class="dashboard-card dashboard-wide"><span>Protected Account</span><h3>Secure session</h3><p>Your login is protected by an encrypted server session cookie.</p></article>
  `,
  rewards: `
    <article class="dashboard-card dashboard-wide reward-dashboard-card">
      <span>Rewards Payout</span>
      <h3>$10 Launch Bank Payout</h3>
      <p>Spend $100+ and receive a unique Reward ID after your delivered order clears the 24-hour window. Enter the ID here to request the $10 reward payout to your verified bank account.</p>
      <div class="mini-form reward-mini-form">
        <input data-reward-id placeholder="Reward ID">
        <button class="primary-cta slim-btn" type="button" data-redeem-reward>Claim Reward</button>
      </div>
      <p data-reward-status>Each Reward ID can be claimed one time only. Bank payout verification is handled securely by support after claim.</p>
      <div class="reward-terms-actions">
        <a class="secondary-btn slim-btn" href="terms-conditions.html#reward-terms">Reward Terms & Conditions</a>
      </div>
    </article>
    <article class="dashboard-card dashboard-wide">
      <span>How it works</span>
      <h3>Premium rewards, no confusion.</h3>
      <p>Returned, cancelled, or refunded orders automatically invalidate their reward. Approved reward claims are reviewed and processed as bank payout requests, not Zavora account balance.</p>
      <a class="text-link" href="terms-conditions.html#reward-terms">Read reward terms</a>
    </article>
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

let passwordLoginPending = false;

async function requestPasswordLogin(email, password) {
  if (passwordLoginPending) {
    return { ok: false, error: 'Login is already processing. Please wait.' };
  }
  passwordLoginPending = true;
  try {
    const response = await fetch('/api/auth-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${data.error || 'Login failed'}${data.detail ? ` ${data.detail}` : ''}`);
    return data;
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    passwordLoginPending = false;
  }
}

// The auth UI uses link-styled actions. Make keyboard/Enter submission follow
// the same validated API flow instead of reloading the static page.
document.addEventListener('submit', (event) => {
  const form = event.target.closest('.auth-card .form-panel');
  if (!form) return;
  const action = form.querySelector('a.primary-cta[href="dashboard.html"], a.primary-cta[href="/dashboard.html"]');
  if (!action) return;
  event.preventDefault();
  action.click();
});

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
      <p class="otp-note">Verification code sent. Check inbox and spam folder.</p>
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

function injectHomepageRewardOffer() {
  const pageName = window.location.pathname.split('/').pop();
  const isHome = pageName === 'index.html' || pageName === '';
  if (!isHome || document.querySelector('[data-launch-reward-offer]')) return;
  const hero = document.querySelector('.hero');
  const anchor = hero || document.querySelector('main > section');
  if (!anchor) return;
  const section = document.createElement('section');
  section.className = 'section launch-reward-offer';
  section.dataset.launchRewardOffer = 'true';
  section.innerHTML = `
    <div>
      <p class="eyebrow">Launch reward</p>
      <h2>Spend $100+. Claim a $10 bank payout.</h2>
      <p>After your eligible order is delivered and clears the 24-hour window, Zavora issues a unique Reward ID. Redeem it once from your dashboard to request bank payout review.</p>
    </div>
    <div class="reward-offer-panel">
      <strong>$10</strong>
      <span>Bank Payout</span>
      <a class="primary-cta" href="dashboard.html#rewards">Claim reward</a>
      <small>Returned, cancelled, or refunded orders do not qualify.</small>
    </div>
  `;
  anchor.insertAdjacentElement('afterend', section);
}

async function refreshWalletBalance() {
  if (!document.querySelector('[data-wallet-balance]')) return;
  const response = await fetch('/api/rewards', { credentials: 'include' }).catch(() => null);
  const data = await response?.json().catch(() => ({}));
  if (response?.ok && data.ok) {
    document.querySelectorAll('[data-wallet-balance]').forEach((node) => {
      node.replaceChildren(document.createTextNode(money(data.balance || 0)));
    });
  }
}

function renderRegisterPage() {
  if (!isCurrentPage('register')) return;
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    <section class="auth-page">
      <div class="auth-card">
        <p class="eyebrow">Zavora Membership</p>
        <h1>Create Account</h1>
        <p>Save shipping addresses, track Zavora orders, and unlock member rewards.</p>
        <form class="form-panel">
          <input placeholder="Full Name" autocomplete="name">
          <input placeholder="Email address" type="email" autocomplete="email">
          <input placeholder="Password (8+ chars)" type="password" autocomplete="new-password">
          <button class="primary-cta" type="button">Create Account</button>
          <div class="form-subtext">Already have an account? <a href="login.html">Sign in</a></div>
        </form>
      </div>
      <aside class="auth-aside">
        <strong>ZAVORA MEMBER PERKS</strong>
        <p>Save your sizes, fast checkout with saved addresses, order tracking, and exclusive streetwear access.</p>
        <div class="auth-perks"><span>Saved addresses</span><span>Order tracking</span><span>Exclusive drops</span><span>Fast checkout</span></div>
      </aside>
    </section>
  `;
}

function resumePendingSignupOtp() {
  if (!isCurrentPage('sign-up') && !isCurrentPage('register')) return;
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
    const latestOrder = getDashboardOrders()[0];
    const orderCard = [...grid.querySelectorAll('.dashboard-card')].find((card) => card.querySelector('h3')?.textContent.trim() === 'Recent Order');
    if (orderCard) {
      const rewardText = latestOrder?.rewardId ? ` Reward ID: ${latestOrder.rewardId}.` : (Number(latestOrder?.total || 0) >= 100 ? ' Reward ID appears here after delivery and 24-hour clearance.' : '');
      orderCard.querySelector('p').textContent = latestOrder ? `#${latestOrder.id.replace(/^#/, '')} is ${latestOrder.status || 'active'}.${rewardText}` : 'No orders yet. Your first checkout will appear here.';
      const link = orderCard.querySelector('a');
      if (link && latestOrder) link.href = `track-order.html?order=${encodeURIComponent(latestOrder.id)}&email=${encodeURIComponent(latestOrder.email)}`;
    }
    const addressCard = [...grid.querySelectorAll('.dashboard-card')].find((card) => card.querySelector('h3')?.textContent.trim() === 'Saved Addresses');
    const addressCopy = addressCard?.querySelector('p');
    const addressCount = getSavedAddresses().length;
    if (addressCopy) addressCopy.textContent = addressCount ? `${addressCount} saved address${addressCount === 1 ? '' : 'es'} ready for checkout.` : 'No saved address yet.';
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
    const orders = getDashboardOrders();
    grid.innerHTML = `
      ${orders.length ? orders.map((order) => {
        const itemsList = Array.isArray(order.items) && order.items.length
          ? order.items.map(i => `${i.name || 'Product'} (Qty ${i.qty || 1})`).join(', ')
          : (order.item || 'Zavora order');
        const emailParam = order.email || authDashboardData?.user?.email || authUser?.email || '';
        const statusLower = String(order.status || '').toLowerCase();
        const isShippedOrDelivered = statusLower.includes('shipp') || statusLower.includes('deliver') || statusLower.includes('transit');
        const isCancelled = statusLower.includes('cancel');

        let actionBtn = '';
        if (isCancelled) {
          actionBtn = `<span class="pill red" style="display:inline-block;padding:4px 10px;background:#ffebee;color:#c62828;font-weight:700;border-radius:4px;font-size:12px;margin-top:8px;">Order Cancelled</span>`;
        } else if (!isShippedOrDelivered) {
          actionBtn = `
            <div style="display:flex;gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap;">
              <a class="text-link" href="track-order.html?order=${encodeURIComponent(String(order.id).replace(/^#/, ''))}&email=${encodeURIComponent(emailParam)}">Track live order</a>
              <button type="button" data-customer-cancel-order="${order.id}" style="padding:6px 12px;background:#c62828;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;">Cancel Order</button>
            </div>
          `;
        } else {
          actionBtn = `
            <div style="display:flex;gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap;">
              <a class="text-link" href="track-order.html?order=${encodeURIComponent(String(order.id).replace(/^#/, ''))}&email=${encodeURIComponent(emailParam)}">Track live order</a>
              <a href="returns.html?orderId=${encodeURIComponent(String(order.id).replace(/^#/, ''))}" style="padding:6px 12px;background:#050505;color:#fff;text-decoration:none;border-radius:4px;font-size:12px;font-weight:700;">Request Return / Exchange</a>
            </div>
          `;
        }

        return `
          <article class="dashboard-card dashboard-wide">
            <span>Order History</span>
            <h3>#${String(order.id).replace(/^#/, '')}</h3>
            <p><strong>Items:</strong> ${itemsList}</p>
            <p style="font-size:13px;margin-top:4px;"><strong>Payment:</strong> ${order.method || 'PayPal'} | <strong>Status:</strong> ${order.status || 'Order confirmed'} | <strong>Total:</strong> ${money(order.total || 0)}</p>
            <div class="mini-status"><i style="width:${order.status === 'Delivered' ? 100 : order.status === 'Shipped' ? 78 : order.status === 'Packing' ? 50 : 25}%"></i></div>
            ${actionBtn}
          </article>
        `;
      }).join('') : '<article class="dashboard-card dashboard-wide"><span>Orders</span><h3>No orders yet</h3><p>Your order history appears here after checkout.</p></article>'}
    `;
  }
  if (view === 'addresses') {
    const addresses = getSavedAddresses();
    const cards = addresses.map((address, index) => `
      <article class="dashboard-card dashboard-wide" data-address-card="${index}">
        <span>${index === 0 ? 'Primary Address' : `Saved Address ${index + 1}`}</span>
        <h3>${address.name || 'Zavora customer'}</h3>
        <p>${[address.street, address.city, address.zip].filter(Boolean).join(', ')}</p>
        <button class="text-link" type="button" data-edit-address="${index}">Edit address</button>
        <button class="text-link" type="button" data-remove-address="${index}">Remove</button>
      </article>
    `).join('');
    grid.innerHTML = `
      ${cards || '<article class="dashboard-card dashboard-wide"><span>Primary Address</span><h3>No saved address</h3><p>Add a delivery address for faster checkout.</p></article>'}
      <article class="dashboard-card dashboard-wide address-form"><span>${grid.dataset.editAddress ? 'Edit Address' : 'Add Address'}</span><h3>${grid.dataset.editAddress ? 'Update delivery address' : 'Add new delivery address'}</h3><div class="mini-form"><input data-address-field="name" placeholder="Full name"><input data-address-field="street" placeholder="Street address"><input data-address-field="city" placeholder="City"><input data-address-field="zip" placeholder="ZIP code"></div><button class="secondary-btn slim-btn" type="button" data-add-address>${grid.dataset.editAddress ? 'Save address' : 'Add address'}</button></article>
    `;
  }
  if (view === 'rewards') {
    refreshWalletBalance();
  }
  document.querySelectorAll('.side-menu a, [data-dashboard-view]').forEach((item) => {
    item.classList.toggle('active', item.dataset.dashboardView === view);
  });
}

function initDashboardTabs() {
  const sideMenu = document.querySelector('.side-menu');
  if (!sideMenu) return;
  if (!sideMenu.querySelector('[data-rewards-nav]')) {
    const logoutLink = [...sideMenu.querySelectorAll('a')].find((link) => link.textContent.trim().toLowerCase() === 'logout');
    const rewardsLink = document.createElement('a');
    rewardsLink.href = '#rewards';
    rewardsLink.textContent = 'Rewards';
    rewardsLink.dataset.rewardsNav = 'true';
    if (logoutLink) {
      sideMenu.insertBefore(rewardsLink, logoutLink);
    } else {
      sideMenu.appendChild(rewardsLink);
    }
  }
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
window.addEventListener('scroll', syncPageHeader, { passive: true });
syncPageHeader();
normalizeHeaderSelectors();
hydrateHeaderIcons();
hydrateCloseIcons();
initLocalizationSelectors();
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
        <img src="${item.img || item.image || ZAVORA_LOGO}" alt="${item.name || 'Zavora product'}" onerror="this.src='${ZAVORA_LOGO}'">
        <div><h3>${item.name || 'Zavora product'}</h3><span>${item.qty || 1} x ${money(item.price)}</span></div>
        <button type="button" data-page-remove="${cartLineKey(item)}" aria-label="Remove ${item.name || 'item'}">&times;</button>
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

  const checkoutUser = getUserAccount();
  if (checkoutUser) {
    const emailField = document.querySelector('.checkout-form input[type="email"]');
    if (emailField && !emailField.value && checkoutUser.email) emailField.value = checkoutUser.email;

    const nameField = document.querySelector('.checkout-form input[placeholder*="name"]');
    if (nameField && !nameField.value && checkoutUser.name) nameField.value = checkoutUser.name;

    const phoneField = document.querySelector('.checkout-form input[type="tel"]');
    if (phoneField && !phoneField.value && checkoutUser.phone) phoneField.value = checkoutUser.phone;
  }

  const cart = getSavedCart();
  const activeCart = cart;
  const total = activeCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const shippingCost = Number(document.querySelector('input[name="shipping"]:checked')?.value || 0);

  if (!window.__metaCheckoutInitiated && activeCart.length) {
    window.__metaCheckoutInitiated = true;
    trackMetaEvent('InitiateCheckout', {
      content_ids: activeCart.map(item => item.id),
      contents: activeCart.map(item => ({ id: item.id, quantity: item.qty || 1, price: Number(item.price) })),
      num_items: activeCart.length,
      value: total,
      currency: 'USD'
    });
  }
  const APPLIED_COUPON_KEY = 'zavoraAppliedCoupon';
  let couponDiscount = 0;
  try {
    const coupon = JSON.parse(localStorage.getItem(APPLIED_COUPON_KEY) || 'null');
    if (coupon?.code) {
      const code = String(coupon.code).toUpperCase();
      if (code === 'WELCOME10') {
        couponDiscount = total >= 49 ? 10 : 0;
      } else if (code === 'SUMMER15') {
        couponDiscount = total * 0.15;
      }
    }
  } catch (e) {
    couponDiscount = 0;
  }

  let giftDiscount = 0;
  try {
    const appliedGift = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY));
    if (appliedGift?.code) giftDiscount = Math.min(total - couponDiscount, Number(appliedGift.balance || appliedGift.value || 0));
  } catch (error) {
    giftDiscount = 0;
  }
  const totalDiscount = couponDiscount + giftDiscount;
  const payable = Math.max(0, total + shippingCost - totalDiscount);
  summary.innerHTML = activeCart.length ? activeCart.map((item) => `
    <div class="summary-product">
      <img src="${item.img || item.image || 'assets/studio-wide-trouser.png'}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'">
      <div><strong>${item.name}</strong><span>${item.color || 'Black'} / ${item.sizes?.[0] || item.size || 'M'} / Qty ${item.qty || 1}</span></div>
      <b>${money(Number(item.price || 0) * Number(item.qty || 1))}</b>
      <button type="button" class="summary-remove-btn" data-checkout-remove="${cartLineKey(item)}" aria-label="Remove ${item.name}">&times;</button>
    </div>
  `).join('') : '<p class="secure-note">Your bag is empty. Add a product before checkout.</p>';
  document.querySelectorAll('[data-checkout-subtotal]').forEach((node) => {
    node.textContent = money(total);
  });
  document.querySelectorAll('[data-gift-discount]').forEach((node) => {
    node.textContent = totalDiscount ? `-${money(totalDiscount)}` : '-$0';
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
        <img class="card-img-primary" src="${image}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'">
        <img class="card-img-hover" src="${hoverImage}" alt="${item.name} hover view" onerror="this.style.display='none'">
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

const collectionLinks = [
  ['sportswear', 'Sportswear', 'Performance layers, active fits, and movement-ready essentials.'],
  ['streetwear', 'Streetwear', 'Premium hoodies, tees, caps, and everyday city silhouettes.'],
  ['beachwear', 'Beachwear', 'Shorts, slides, summer pieces, and clean warm-weather styling.'],
  ['gifts', 'Gifts', 'Giftable accessories, caps, and easy premium add-ons.'],
  ['style-trends', 'Style Trends', 'Modern silhouettes, seasonal colors, and trending edits.'],
  ['matching-sets', 'Matching Sets', 'Coordinated sweats, tracksuits, and complete outfit energy.'],
  ['summer-hats-bags', 'Summer Hats & Bags', 'Caps, hats, bags, and sunny-day essentials.'],
  ['holiday-season', 'Holiday Season', 'Gift-season layers, cozy fleece, and limited picks.']
];

function collectionShowcase(activeCollection = '') {
  return `
    <div class="collection-showcase">
      <div>
        <p class="eyebrow">Printful Collections</p>
        <h2>Shop by collection</h2>
      </div>
      <div class="collection-tile-grid">
        ${collectionLinks.map(([slug, title, copy]) => `
          <a class="collection-tile ${activeCollection === slug ? 'is-active' : ''}" href="collections.html?collection=${slug}&label=${encodeURIComponent(title)}">
            <span>${title}</span>
            <small>${copy}</small>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function collectionLabel(slug = '') {
  const item = collectionLinks.find(([value]) => value === slug);
  return item ? item[1] : 'Zavora Collections';
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
  products = deduplicateProducts(products);
  const norm = normalizePageName(pageName);
  const urlCategory = new URLSearchParams(window.location.search).get('category');
  if (urlCategory) {
    products = products.filter((product) => categoryMatches(product.category, urlCategory));
  }
  if (norm === 'new-arrivals') {
    return products.filter((product) => product.collection?.includes('new'));
  }
  if (norm === 'limited') {
    return products
      .filter((product) => product.collection?.includes('limited'))
      .map((product, index) => ({ ...product, stock: Math.min(getProductStock(product), 1 + (index % 10)), badge: 'Limited' }));
  }
  if (norm === 'best-sellers') {
    return products.filter((product) => product.collection?.includes('best') || product.popularity >= 84);
  }
  return products;
}

function deduplicateProducts(products) {
  if (!Array.isArray(products)) return [];
  const seenIds = new Set();
  const seenTitles = new Set();
  return products.filter((p) => {
    if (!p || !p.id) return false;
    const idKey = String(p.id);
    const titleKey = String(p.name || p.title || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (seenIds.has(idKey) || (titleKey && seenTitles.has(titleKey))) {
      return false;
    }
    seenIds.add(idKey);
    if (titleKey) seenTitles.add(titleKey);
    return true;
  });
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
  const pages = [1, 2, 3];
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
  if (!grid || grid.dataset.printfulLoaded === 'completed') return;
  grid.dataset.printfulLoaded = 'in-progress';
  try {
    const pageName = normalizePageName(window.location.pathname);
    const dataProducts = pageName === 'shop' || pageName === 'collections'
      ? (await Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))).flat()
      : await fetchCatalogProducts(pageName === 'women' ? 'women' : 'men', 1000);
    if (!dataProducts.length) return;
    
    const existing = window.__zavoraCatalogProducts || [];
    const merged = deduplicateProducts([...existing, ...dataProducts]);
    const products = productsForCatalogPage(merged, pageName);
    
    window.__zavoraCatalogProducts = products;
    grid.dataset.printfulLoaded = 'completed';
    grid.innerHTML = products.map(catalogCard).join('');
    filterLargeCatalog();
    refreshWishlistButtons();
  } catch (error) {
    grid.dataset.printfulLoaded = 'failed';
  }
}

function injectLargeCatalog() {
  const main = document.querySelector('main');
  const pageName = normalizePageName(window.location.pathname);
  if (!main || document.querySelector('.catalog-shop') || (!catalogOnlyPages.includes(pageName) && !catalogOnlyPages.includes(`${pageName}.html`))) return;
  const isWomenPage = pageName === 'women';
  const genderOptions = '<option value="all">All</option><option value="men">Men</option><option value="women">Women</option>';
  const categoryOptions = isWomenPage
    ? '<option value="all">All</option><option value="oversized-tees">Oversized Tees</option><option value="baby-tees">Baby Tees</option><option value="hoodies">Hoodies</option><option value="cropped-hoodies">Cropped Hoodies</option><option value="sweatpants">Sweatpants</option><option value="jackets">Jackets</option><option value="accessories">Accessories</option>'
    : '<option value="all">All</option><option value="oversized-tees">Oversized Tees</option><option value="heavyweight-tees">Heavyweight Tees</option><option value="hoodies">Hoodies</option><option value="zip-hoodies">Zip Hoodies</option><option value="cargo-pants">Cargo Pants</option><option value="sweatpants">Sweatpants</option><option value="jackets">Jackets</option><option value="shorts">Shorts</option><option value="shoes">Shoes</option><option value="accessories">Accessories</option>';
  const collectionOptions = '<option value="all">All</option><option value="sportswear">Sportswear</option><option value="streetwear">Streetwear</option><option value="beachwear">Beachwear</option><option value="gifts">Gifts</option><option value="style-trends">Style Trends</option><option value="grow-a-fashion-brand">Grow a Fashion Brand</option><option value="made-in-eu">Made in EU</option><option value="halloween">Halloween</option><option value="back-to-school">Back to School</option><option value="holiday-season">Holiday Season</option><option value="summer-hats-bags">Summer Hats & Bags</option><option value="matching-sets">Matching Sets</option><option value="summer-soccer-2026">Summer of Soccer 2026</option><option value="fourth-of-july">4th of July</option><option value="new">New</option><option value="best">Best Sellers</option><option value="limited">Limited</option>';
  const activeCollection = new URLSearchParams(window.location.search).get('collection') || '';
  const section = document.createElement('section');
  section.className = 'catalog-shop';
  section.innerHTML = `
    <aside class="catalog-sidebar">
      <div class="filter-head">
        <h2>Shop Zavora</h2>
        <p><span data-catalog-count>${catalogData.length}</span> products available</p>
      </div>
      ${pageName === 'shop.html' || pageName === 'collections.html' ? `<label>Gender<select data-catalog-filter="gender">${genderOptions}</select></label>` : ''}
      <label>Collection<select data-catalog-filter="collection">${collectionOptions}</select></label>
      <label>Category<select data-catalog-filter="category">${categoryOptions}</select></label>
      <label>Color<select data-catalog-filter="color"><option value="all">All</option><option>black</option><option>white</option><option>gray</option><option>blue</option><option>green</option><option>red</option><option>gold</option></select></label>
      <label>Size<select data-catalog-filter="size"><option value="all">All</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></label>
      <label>Under amount<select data-catalog-filter="price"><option value="999">All</option><option value="100">Under $100</option><option value="160">Under $160</option><option value="240">Under $240</option></select></label>
      <label>Sort<select data-catalog-filter="sort"><option value="featured">Featured</option><option value="low">Price low to high</option><option value="high">Price high to low</option></select></label>
      <button type="button" data-catalog-reset>Reset</button>
    </aside>
    <div class="catalog-area">
      ${pageName === 'collections.html' ? collectionShowcase(activeCollection) : ''}
      <div class="mobile-filter-bar">
        <button type="button" class="mobile-filter-btn" id="openMobileFilterBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>FILTER</span>
          <span class="active-filter-badge" id="activeFilterBadge" style="display:none;">0</span>
        </button>
        <select class="mobile-sort-select" id="mobileQuickSortSelect" aria-label="Sort products">
          <option value="featured">Sort: Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
      <div class="catalog-toolbar">
        <span><strong data-catalog-count>${catalogData.length}</strong> results</span>
      </div>
      <div class="catalog-grid" data-catalog-grid>${catalogData.length ? catalogData.map(catalogCard).join('') : '<p class="catalog-loading">Loading Printful products...</p>'}</div>
    </div>
  `;
  main.classList.add('catalog-main');
  main.innerHTML = '';
  main.appendChild(section);

  initMobileFilterDrawer(genderOptions, collectionOptions, categoryOptions, pageName);

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
  const urlCollection = new URLSearchParams(window.location.search).get('collection');
  const collectionSelect = section.querySelector('[data-catalog-filter="collection"]');
  if (urlCollection && collectionSelect && [...collectionSelect.options].some((option) => option.value === urlCollection)) {
    collectionSelect.value = urlCollection;
  }
}

function initMobileFilterDrawer(genderOptions, collectionOptions, categoryOptions, pageName) {
  let overlay = document.querySelector('#mobileFilterOverlay');
  let drawer = document.querySelector('#mobileFilterDrawer');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mobileFilterOverlay';
    overlay.className = 'mobile-filter-drawer-overlay';
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'mobileFilterDrawer';
    drawer.className = 'mobile-filter-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Filter and Sort products');
    document.body.appendChild(drawer);
  }

  drawer.innerHTML = `
    <div class="mobile-filter-header">
      <h2>Filter & Sort</h2>
      <button type="button" class="mobile-filter-close-btn" id="closeMobileFilterBtn" aria-label="Close filters">&times;</button>
    </div>
    <div class="mobile-filter-body">
      ${pageName === 'shop.html' || pageName === 'collections.html' ? `
      <div class="mobile-filter-group">
        <label>Gender</label>
        <select data-mobile-filter="gender">${genderOptions}</select>
      </div>` : ''}
      <div class="mobile-filter-group">
        <label>Collection</label>
        <select data-mobile-filter="collection">${collectionOptions}</select>
      </div>
      <div class="mobile-filter-group">
        <label>Category</label>
        <select data-mobile-filter="category">${categoryOptions}</select>
      </div>
      <div class="mobile-filter-group">
        <label>Color</label>
        <select data-mobile-filter="color">
          <option value="all">All</option>
          <option>black</option>
          <option>white</option>
          <option>gray</option>
          <option>blue</option>
          <option>green</option>
          <option>red</option>
          <option>gold</option>
        </select>
      </div>
      <div class="mobile-filter-group">
        <label>Size</label>
        <select data-mobile-filter="size">
          <option value="all">All</option>
          <option>XS</option>
          <option>S</option>
          <option>M</option>
          <option>L</option>
          <option>XL</option>
        </select>
      </div>
      <div class="mobile-filter-group">
        <label>Price</label>
        <select data-mobile-filter="price">
          <option value="999">All</option>
          <option value="100">Under $100</option>
          <option value="160">Under $160</option>
          <option value="240">Under $240</option>
        </select>
      </div>
      <div class="mobile-filter-group">
        <label>Sort</label>
        <select data-mobile-filter="sort">
          <option value="featured">Featured</option>
          <option value="low">Price low to high</option>
          <option value="high">Price high to low</option>
        </select>
      </div>
    </div>
    <div class="mobile-filter-footer">
      <button type="button" class="mobile-filter-reset-btn" id="resetMobileFilterBtn">Reset</button>
      <button type="button" class="mobile-filter-apply-btn" id="applyMobileFilterBtn">Apply Filters</button>
    </div>
  `;

  const openBtn = document.querySelector('#openMobileFilterBtn');
  const closeBtn = drawer.querySelector('#closeMobileFilterBtn');
  const applyBtn = drawer.querySelector('#applyMobileFilterBtn');
  const resetBtn = drawer.querySelector('#resetMobileFilterBtn');
  const badge = document.querySelector('#activeFilterBadge');

  function openDrawer() {
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateActiveBadge() {
    const mobileFilters = drawer.querySelectorAll('[data-mobile-filter]');
    let activeCount = 0;
    mobileFilters.forEach(select => {
      const val = select.value;
      if (val && val !== 'all' && val !== 'featured' && val !== '999') {
        activeCount++;
      }
    });
    if (badge) {
      if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  drawer.querySelectorAll('[data-mobile-filter]').forEach(mSelect => {
    mSelect.addEventListener('change', () => {
      const filterKey = mSelect.dataset.mobileFilter;
      const dSelect = document.querySelector(`[data-catalog-filter="${filterKey}"]`);
      if (dSelect) dSelect.value = mSelect.value;
      updateActiveBadge();
    });
  });

  const quickSort = document.querySelector('#mobileQuickSortSelect');
  if (quickSort) {
    quickSort.addEventListener('change', (e) => {
      const val = e.target.value;
      const desktopSort = document.querySelector('[data-catalog-filter="sort"]');
      if (desktopSort) desktopSort.value = val;
      const drawerSort = drawer.querySelector('[data-mobile-filter="sort"]');
      if (drawerSort) drawerSort.value = val;
      if (typeof filterLargeCatalog === 'function') filterLargeCatalog();
    });
  }

  if (openBtn) openBtn.onclick = openDrawer;
  if (closeBtn) closeBtn.onclick = closeDrawer;
  if (overlay) overlay.onclick = closeDrawer;

  if (applyBtn) {
    applyBtn.onclick = () => {
      if (typeof filterLargeCatalog === 'function') filterLargeCatalog();
      closeDrawer();
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      drawer.querySelectorAll('[data-mobile-filter]').forEach(mSelect => {
        if (mSelect.dataset.mobileFilter === 'price') mSelect.value = '999';
        else if (mSelect.dataset.mobileFilter === 'sort') mSelect.value = 'featured';
        else mSelect.value = 'all';
      });
      document.querySelectorAll('[data-catalog-filter]').forEach(dSelect => {
        if (dSelect.dataset.catalogFilter === 'price') dSelect.value = '999';
        else if (dSelect.dataset.catalogFilter === 'sort') dSelect.value = 'featured';
        else dSelect.value = 'all';
      });
      updateActiveBadge();
      if (typeof filterLargeCatalog === 'function') filterLargeCatalog();
      closeDrawer();
    };
  }

  let touchStartX = 0;
  drawer.ontouchstart = (e) => { touchStartX = e.touches[0].clientX; };
  drawer.ontouchend = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) closeDrawer();
  };
}

function filterLargeCatalog() {
  const filters = document.querySelectorAll('[data-catalog-filter]');
  if (!filters.length) return;
  const values = Object.fromEntries([...filters].map((filter) => [filter.dataset.catalogFilter, filter.value]));
  const searchTerm = new URLSearchParams(window.location.search).get('search') || '';
  if (searchTerm && !window.__metaSearchTracked) {
    window.__metaSearchTracked = true;
    trackMetaEvent('Search', {
      search_string: searchTerm
    });
  }
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
  const contactSubmit = event.target.closest('.contact-clean .primary-cta');
  if (contactSubmit) {
    event.preventDefault();
    const card = event.target.closest('.auth-card');
    const inputs = card ? [...card.querySelectorAll('input, select, textarea')] : [];
    const name = inputs[0]?.value.trim() || '';
    const email = inputs[1]?.value.trim() || '';
    const topic = inputs[2]?.value || 'Order help';
    const message = inputs[3]?.value.trim() || '';
    if (!name || !email || !message) {
      alert('Please fill in all fields before sending.');
      return;
    }
    trackMetaEvent('Contact', {
      content_category: topic,
      value: 0,
      currency: 'USD'
    });
    alert('Thank you for contacting Zavora Fashion! Your support message has been sent successfully.');
    if (card.querySelector('form')) card.querySelector('form').reset();
    return;
  }

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
      const next = safeInternalUrl(rawHref.includes('dashboard.html') ? rawHref : 'dashboard.html', 'dashboard.html');
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
    if (!(await requireCommerceAuth('cart', product, 'checkout.html'))) return;
    addProductToCart(product, { id: String(product.id) });
    window.location.href = 'checkout.html';
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
      ? 'Newsletter welcome email sent. Check inbox or spam.'
      : 'Newsletter saved locally, but email sending is not configured yet.';
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
    const grid = document.querySelector('.dashboard-grid');
    const fields = {};
    form.querySelectorAll('[data-address-field]').forEach((input) => {
      fields[input.dataset.addressField] = input.value.trim();
    });
    if (!fields.name && !fields.street && !fields.city && !fields.zip) return;
    const addresses = getSavedAddresses();
    const editIndex = grid?.dataset.editAddress ? Number(grid.dataset.editAddress) : -1;
    if (editIndex >= 0) {
      addresses[editIndex] = fields;
      delete grid.dataset.editAddress;
    } else {
      addresses.unshift(fields);
    }
    saveSavedAddresses(addresses);
    setDashboardView('addresses');
    return;
  }

  const editAddress = event.target.closest('[data-edit-address]');
  if (editAddress) {
    event.preventDefault();
    const grid = document.querySelector('.dashboard-grid');
    const index = Number(editAddress.dataset.editAddress);
    const address = getSavedAddresses()[index];
    if (!grid || !address) return;
    grid.dataset.editAddress = String(index);
    const form = grid.querySelector('.address-form');
    form.querySelector('[data-address-field="name"]').value = address.name || '';
    form.querySelector('[data-address-field="street"]').value = address.street || '';
    form.querySelector('[data-address-field="city"]').value = address.city || '';
    form.querySelector('[data-address-field="zip"]').value = address.zip || '';
    form.querySelector('[data-add-address]').textContent = 'Save address';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const removeAddress = event.target.closest('[data-remove-address]');
  if (removeAddress) {
    event.preventDefault();
    const index = Number(removeAddress.dataset.removeAddress);
    saveSavedAddresses(getSavedAddresses().filter((_, addressIndex) => addressIndex !== index));
    setDashboardView('addresses');
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

  const loginTrigger = event.target.closest('a[href="dashboard.html"].primary-cta, a[href="/dashboard.html"].primary-cta');
  if (loginTrigger && (isCurrentPage('sign-up') || isCurrentPage('register'))) {
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

  if (loginTrigger && isCurrentPage('login')) {
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
    const next = safeInternalUrl(resumed || safeNextParam('dashboard.html'), 'dashboard.html');
    window.location.href = next;
    return;
  }

  const resetTrigger = event.target.closest('.auth-card .primary-cta');
  if (resetTrigger && !resetTrigger.matches('[data-verify-reset-otp]') && isCurrentPage('forgot-password')) {
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
      window.location.href = safeInternalUrl(resumed || safeNextParam('dashboard.html'), 'dashboard.html');
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
      const button = event.target.closest('[data-resend-signup-otp]');
      button.textContent = 'Sending...';
      const result = await requestAuthStart({ name: pending.name, email: pending.email });
      button.textContent = 'Resend OTP';
      note.textContent = result.ok ? 'New OTP sent. Check inbox and spam folder.' : (result.error || 'Unable to resend OTP. Please restart signup.');
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

  const payNow = event.target.closest('.pay-now, [data-pay-total]');
  if (payNow && isCurrentPage('checkout')) {
    event.preventDefault();
    const cart = getSavedCart();
    if (!cart || !cart.length) {
      alert('Your bag is empty. Add a product before checkout.');
      return;
    }
    
    const form = document.querySelector('.checkout-form');
    const email = form?.querySelector('input[type="email"]')?.value.trim().toLowerCase() || 'customer@zavorafashion.com';
    const name = form?.querySelector('input[placeholder*="name"]')?.value.trim() || 'Guest Customer';
    const phone = form?.querySelector('input[type="tel"]')?.value.trim()
      || form?.querySelector('input[placeholder*="phone"]')?.value.trim()
      || '';
    const street = form?.querySelector('input[placeholder*="Street"]')?.value.trim() || '';
    const city = form?.querySelector('input[placeholder*="City"]')?.value.trim() || '';
    const zip = form?.querySelector('input[placeholder*="ZIP"]')?.value.trim() || '';
    const address = [street, city, zip].filter(Boolean).join(', ') || 'Standard Shipping Address';
    
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    const shipping = Number(document.querySelector('input[name="shipping"]:checked')?.value || 0);
    
    let couponDiscount = 0;
    try {
      const coupon = JSON.parse(localStorage.getItem('zavoraAppliedCoupon') || 'null');
      if (coupon?.code) {
        const code = String(coupon.code).toUpperCase();
        if (code === 'WELCOME10') couponDiscount = subtotal >= 49 ? 10 : 0;
        else if (code === 'SUMMER15') couponDiscount = subtotal * 0.15;
      }
    } catch (e) {}

    let giftDiscount = 0;
    try {
      const gift = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY) || 'null');
      if (gift?.code) giftDiscount = Math.min(subtotal - couponDiscount, Number(gift.balance || gift.value || 0));
    } catch (e) {}

    const totalDiscount = couponDiscount + giftDiscount;
    const finalTotal = Math.max(0, subtotal + shipping - totalDiscount);

    const suffix = String(Date.now()).slice(-6);
    const orderId = `ZVR-${suffix}`;
    const trackingId = `ZV-${suffix}`;

    const order = {
      id: orderId,
      email: email,
      customer: name,
      phone: phone,
      address: address,
      method: 'Direct Payment Flow',
      status: 'Paid',
      tracking: trackingId,
      subtotal: subtotal,
      shipping: shipping,
      discount: totalDiscount,
      total: finalTotal,
      items: cart,
      createdAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('zavoraLastOrder', JSON.stringify(order));
      const orders = getSavedOrders();
      orders.unshift(order);
      localStorage.setItem('zavoraOrders', JSON.stringify(orders));
      localStorage.setItem('zavora_cart', '[]');
      localStorage.removeItem(APPLIED_GIFT_KEY);
      localStorage.removeItem('zavoraAppliedCoupon');
    } catch (e) {}

    persistOrder(order).catch(() => {});
    requestOrderConfirmation(order).catch(() => {});

    trackMetaEvent('Purchase', {
      content_ids: cart.map(item => item.id),
      contents: cart.map(item => ({ id: item.id, quantity: item.qty || 1, price: Number(item.price) })),
      value: finalTotal,
      currency: 'USD'
    });

    window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=direct`;
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
  if ((addProduct || buyNow) && isCurrentPage('product')) {
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
    if (!(await requireCommerceAuth(buyNow ? 'buy-now' : 'cart', commerceProduct, 'checkout.html'))) return;
    const id = selected ? `${productKey(selected)}-${color}-${size}` : String(Date.now());
    addProductToCart(commerceProduct, { id, color, size });
    // Track AddToCart event
    trackMetaEvent('AddToCart', {
      content_name: commerceProduct.name,
      content_ids: [commerceProduct.id || id],
      content_type: 'product',
      value: Number(commerceProduct.price || price || 0),
      currency: 'USD'
    });
    if (selected) {
      setProductStock(selected, getProductStock(selected) - 1);
      updateProductStockNote(selected);
    }
    if (buyNow) {
      window.location.href = 'checkout.html';
      return;
    }
    window.location.href = 'checkout.html';
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
    cart.push({ id: Date.now(), name: `Zavora Gift Card ${money(value)}`, price: value, color: 'Digital', sizes: ['Gift'], qty: 1, img: 'assets/zavora-logo.png', giftCode: code });
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
    const originalLabel = button.dataset.redeemLabel || button.textContent;
    button.dataset.redeemLabel = originalLabel;
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
    button.textContent = originalLabel || 'Claim Reward';
    if (!response?.ok || !data.ok) {
      if (status) status.textContent = data.error || 'Reward could not be redeemed.';
      return;
    }
    if (status) {
      status.textContent = `Reward claimed. Your $10 bank payout request has been sent for review.`;
      status.classList.add('success-note');
    }
    showOfferClaimedPopup(10);
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
  const pageRemove = event.target.closest('[data-page-remove], [data-checkout-remove]');
  if (pageRemove) {
    const id = String(pageRemove.dataset.pageRemove || pageRemove.dataset.checkoutRemove);
    const nextCart = getSavedCart().filter((item) => cartLineKey(item) !== id);
    saveSavedCart(nextCart);
    renderSavedCart(document);
    renderSavedCart(document.querySelector('#pageCartDrawer') || document);
    hydrateCheckoutSummary();
    syncHeaderCounts();
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
    if (!(await requireCommerceAuth('cart-open', null, 'checkout.html'))) return;
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
      <a href="/affiliate">Affiliate Program</a>
      <div class="social-links">
        <a href="https://www.instagram.com/zavora_fashion/" target="_blank" rel="noopener"><span class="icon-badge"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"></rect><circle cx="12" cy="12" r="3.5"></circle><path d="M17 7h.01"></path></svg></span>Instagram</a>
        <a href="https://www.facebook.com/profile.php/?id=61579777109389" target="_blank" rel="noopener"><span class="icon-badge"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></span>Facebook</a>
        <a href="https://x.com/zavoraoffical" target="_blank" rel="noopener"><span class="icon-badge"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></span>X (Twitter)</a>
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
      <a href="${accountHref('rewards')}" data-account-route="rewards">Rewards</a>
      <a href="${accountHref('change-password')}" data-account-route="change-password">Change Password</a>
      <a href="newsletter.html">Newsletter</a>
    </div>
  `;
  footer.insertBefore(mega, footerBottom || null);
  const bottomLinks = footer.querySelector('.footer-links');
  if (bottomLinks && !bottomLinks.querySelector('[href="/affiliate"]')) {
    bottomLinks.insertAdjacentHTML('beforeend', '<a href="/affiliate">Affiliate Program</a>');
  }
}

function cleanAuthPageFooter() {
  const pageName = window.location.pathname.split('/').pop();
  const isHome = pageName === 'index.html' || pageName === '';
  if (isHome) return;
  document.querySelectorAll('.footer-top, .footer-gallery, .instagram-grid, .luxury-prefooter, .global-product-filters, .global-product-rails').forEach((section) => section.remove());
}

function initRealtimeTracking() {
  // Timeline status is dynamically managed by initTrackOrderLookup based on real order status
}

function trackingTemplate(order) {
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  const stageText = 'Payment received';
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
  if (!isCurrentPage('track-order')) return;
  const form = document.querySelector('.tracking-form .form-panel');
  const card = document.querySelector('.tracking-card');
  const button = document.querySelector('.tracking-form .primary-cta');
  const inputs = document.querySelectorAll('.tracking-form input');
  const params = new URLSearchParams(window.location.search);

  const urlOrder = (params.get('order') || '').trim();
  const urlEmail = (params.get('email') || '').trim();

  if (urlOrder && inputs[0]) inputs[0].value = urlOrder;
  if (urlEmail && inputs[1]) inputs[1].value = urlEmail;

  async function lookupOrder() {
    const orderId = (inputs[0]?.value || '').trim().replace(/^#/, '');
    const email = (inputs[1]?.value || '').trim().toLowerCase();
    if (!orderId || !email) {
      if (card) {
        card.innerHTML = '<h2>Track Order</h2><p>Please enter your order number and email address above to view status.</p>';
      }
      return;
    }

    let order = getSavedOrders().find((item) => String(item.id).toLowerCase().replace(/^#/, '') === orderId.toLowerCase() && (!item.email || item.email.toLowerCase() === email));
    
    if (!order) {
      try {
        const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
        if (last && String(last.id).toLowerCase().replace(/^#/, '') === orderId.toLowerCase()) {
          order = last;
        }
      } catch (e) {}
    }

    if (!order) {
      try {
        const response = await fetch(`/api/orders?order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.ok && data.order) order = data.order;
      } catch (error) {}
    }

    if (!order) {
      if (card) {
        card.innerHTML = `<h2>Order #${orderId}</h2><p style="color:#d9534f;margin-top:8px;">Order not found. Please check your order number and email address.</p>`;
      }
      return;
    }

    if (card) {
      const itemsText = Array.isArray(order.items) && order.items.length
        ? order.items.map(i => `${i.name || 'Product'} (Qty ${i.qty || 1})`).join(', ')
        : (order.item || 'Zavora apparel item');
      
      const created = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today';
      const statusRaw = String(order.status || 'Paid').trim();
      const s = statusRaw.toLowerCase();

      const isPacking = s.includes('pack') || s.includes('ship') || s.includes('deliver') || s.includes('process');
      const isShipped = s.includes('ship') || s.includes('deliver');
      const isDelivered = s.includes('deliver');

      let currentStageName = 'Order Confirmed';
      if (isDelivered) currentStageName = 'Delivered';
      else if (isShipped) currentStageName = 'Shipped';
      else if (isPacking) currentStageName = 'Packing';
      else currentStageName = statusRaw;

      card.innerHTML = `
        <div class="eyebrow">Order Status</div>
        <h2>#${order.id.replace(/^#/, '')}</h2>
        <p><strong>Items:</strong> ${itemsText}</p>
        <p style="font-size:13px;margin-top:4px;"><strong>Total:</strong> ${money(order.total || 0)} | <strong>Date:</strong> ${created}</p>
        <ol class="tracking-timeline" style="margin-top:16px;">
          <li class="done">
            <strong>Order confirmed</strong>
            <span>Payment received (${order.method || 'PayPal / Direct'})</span>
          </li>
          <li class="${isPacking ? 'done' : ''}">
            <strong>Packing</strong>
            <span>${isPacking ? 'Package packed at Zavora warehouse' : 'Zavora warehouse is preparing your package'}</span>
          </li>
          <li class="${isShipped ? 'done' : ''}">
            <strong>Shipped</strong>
            <span>${isShipped ? `Tracking Number: <strong>${order.tracking || 'Assigned'}</strong>` : (order.tracking ? `Tracking Number: <strong>${order.tracking}</strong>` : 'Tracking number will appear after dispatch')}</span>
          </li>
          <li class="${isDelivered ? 'done' : ''}">
            <strong>Delivered</strong>
            <span>${isDelivered ? 'Package delivered to shipping address' : 'Estimated delivery in 3-5 business days'}</span>
          </li>
        </ol>
        <div class="live-status-badge" style="margin-top:16px;padding:10px 14px;background:#f5f5f5;border-radius:6px;border-left:4px solid #2e7d32;font-size:13px;">
          <strong>Current Order Status:</strong> <span style="color:#2e7d32;font-weight:700;">${statusRaw}</span>
          ${order.tracking ? `<br><span style="font-size:12px;opacity:0.85;">Tracking Number: <strong>${order.tracking}</strong></span>` : ''}
        </div>
      `;
    }
  }

  button?.addEventListener('click', (e) => {
    e.preventDefault();
    lookupOrder();
  });

  if (urlOrder && urlEmail) lookupOrder();
}

function initOrderSuccessDetails() {
  if (!isCurrentPage('order-success')) return;
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
  // Track Purchase event once per load
  if (!window.__metaPurchaseTracked) {
    window.__metaPurchaseTracked = true;
    trackMetaEvent('Purchase', {
      content_ids: order.items?.map((item) => item.id) || [],
      contents: order.items?.map((item) => ({ id: item.id, quantity: item.qty || 1, price: Number(item.price) })) || [],
      value: Number(order.total || 0),
      currency: 'USD'
    });
  }
  const success = document.querySelector('.success-page');
  if (success) {
    const eyebrow = success.querySelector('.eyebrow');
    const copy = success.querySelector('p:not(.eyebrow)');
    const track = success.querySelector('a[href="track-order.html"]');
    if (eyebrow) eyebrow.textContent = 'Payment Complete';
    if (copy) copy.innerHTML = `Your Zavora order <strong>#${order.id}</strong> has been confirmed. A receipt and shipping update will be sent to your email.`;
    if (track) track.href = `track-order.html?order=${encodeURIComponent(order.id)}&email=${encodeURIComponent(order.email || '')}`;
  }
  const cards = document.querySelectorAll('.success-page + .section .page-card p');
  if (cards[0]) cards[0].textContent = 'Confirmed and moving to packing.';
  if (cards[2]) cards[2].textContent = `${order.method || 'PayPal'} selected. Total: ${money(order.total || 0)}.`;
}

function initPaymentMethodUi() {
  if (!isCurrentPage('checkout')) return;
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
      : 'Card, Apple Pay, and Google Pay checkout are coming soon. Please use PayPal today.';
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
    color: colorButton?.dataset.colorOption || colorButton?.textContent.trim() || 'black',
    size: optionRows[1]?.querySelector('button.active')?.dataset.sizeOption || optionRows[1]?.querySelector('button.active')?.textContent.trim() || 'M'
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
      <img data-gallery-main src="${galleryImages[0]}" alt="${product?.name || 'Zavora product'}" loading="eager" onerror="this.src='assets/studio-wide-trouser.png'">
    </div>
    ${galleryImages.length > 1 ? `<div class="product-thumbs" aria-label="Product gallery thumbnails">
      ${galleryImages.map((src, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-gallery-thumb="${src}" aria-label="View product image ${index + 1}"><img src="${src}" alt="" onerror="this.src='assets/studio-wide-trouser.png'"></button>`).join('')}
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

function updateDynamicProductMedia() {
  if (!isCurrentPage('product')) return;
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
  if (!isCurrentPage('product')) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id || window.__zavoraProductRefreshId === id) return;
  window.__zavoraProductRefreshId = id;
  Promise.all(['men', 'women'].map((gender) => fetchCatalogProducts(gender, 1000).catch(() => [])))
    .then((pages) => {
      const products = pages.flat();
      const product = products.find((item) => String(item.id) === String(id) || String(item.printfulId) === String(id));
      if (product) {
        localStorage.setItem(SELECTED_PRODUCT_KEY, JSON.stringify(product));
        initDynamicProductPage();
      }
    })
    .catch(() => {});
}

function initDynamicProductPage() {
  if (!isCurrentPage('product')) return;
  const product = getSelectedProduct();
  if (!product) return;
  // Track ViewContent event
  trackMetaEvent('ViewContent', {
    content_name: product.name,
    content_category: product.category || 'Apparel',
    content_ids: [product.id],
    content_type: 'product',
    value: Number(product.price || 0),
    currency: 'USD'
  });
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
  refreshSelectedProductFromUrl();
}

async function initDynamicRelatedProducts() {
  if (!isCurrentPage('product')) return;
  if (document.querySelector('[data-smart-product-rails]')) return;
  const anchor = [...document.querySelectorAll('.section-title')].find((section) => section.textContent.includes('Related Products'))?.parentElement
    || document.querySelector('.product-detail')?.parentElement;
  if (!anchor) return;
  try {
    const current = getSelectedProduct();
    const pages = await Promise.all([
      fetchCatalogProducts('men', 1000).catch(() => []),
      fetchCatalogProducts('women', 1000).catch(() => [])
    ]);
    const allProducts = pages.flat();
    if (!Array.isArray(allProducts) || !allProducts.length) return;
    const realProducts = allProducts.filter((item) => String(item.id) !== String(current?.id));
    if (!realProducts.length) return;

    const section = document.createElement('section');
    section.className = 'section product-smart-rails';
    section.dataset.smartProductRails = 'true';
    section.innerHTML = `
      <div class="section-title">
        <div>
          <p class="eyebrow">Related Products</p>
          <h2>Recommended For You</h2>
        </div>
        <a class="text-link" href="shop.html">View all</a>
      </div>
      <div class="page-grid catalog-grid">
        ${realProducts.slice(0, 12).map(catalogCard).join('')}
      </div>
    `;
    anchor.replaceWith(section);
    window.__zavoraCatalogProducts = uniqueProducts([...(window.__zavoraCatalogProducts || []), ...allProducts]);
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
  if (!isCurrentPage('rewards') && !document.querySelector('[data-wallet-balance]')) return;
  refreshWalletBalance();
}

function initCheckoutGiftUi() {
  const promo = document.querySelector('.checkout-form .promo');
  if (promo) {
    if (!promo.querySelector('.coupon-apply-btn')) {
      const input = promo.querySelector('input');
      const container = document.createElement('div');
      container.className = 'coupon-apply-row';
      container.style.display = 'flex';
      container.style.gap = '8px';
      container.style.marginTop = '6px';

      const applyBtn = document.createElement('button');
      applyBtn.className = 'secondary-btn slim-btn coupon-apply-btn';
      applyBtn.type = 'button';
      applyBtn.textContent = 'Apply Coupon';

      const statusP = document.createElement('p');
      statusP.className = 'coupon-status-msg';
      statusP.style.fontSize = '13px';
      statusP.style.marginTop = '4px';
      statusP.style.fontWeight = '500';

      if (input) {
        input.parentNode.appendChild(container);
        container.appendChild(input);
        container.appendChild(applyBtn);
        promo.appendChild(statusP);

        try {
          const existing = JSON.parse(localStorage.getItem('zavoraAppliedCoupon') || 'null');
          if (existing?.code) {
            input.value = existing.code;
            statusP.textContent = `✓ Coupon ${existing.code} applied!`;
            statusP.style.color = '#2e7d32';
          }
        } catch (e) {}

        const checkAndApply = () => {
          const code = (input.value || '').trim().toUpperCase();
          if (!code) {
            statusP.textContent = 'Please enter a coupon code.';
            statusP.style.color = '#d9534f';
            return;
          }
          const cart = getSavedCart();
          const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

          if (code === 'WELCOME10') {
            if (total < 49) {
              statusP.textContent = 'WELCOME10 requires a minimum order of $49.';
              statusP.style.color = '#d9534f';
              return;
            }
            localStorage.setItem('zavoraAppliedCoupon', JSON.stringify({ code: 'WELCOME10', discount: 10 }));
            statusP.textContent = '✓ Coupon WELCOME10 applied ($10 OFF)!';
            statusP.style.color = '#2e7d32';
            hydrateCheckoutSummary();
          } else if (code === 'SUMMER15') {
            localStorage.setItem('zavoraAppliedCoupon', JSON.stringify({ code: 'SUMMER15', type: '15%' }));
            statusP.textContent = '✓ Coupon SUMMER15 applied (15% OFF)!';
            statusP.style.color = '#2e7d32';
            hydrateCheckoutSummary();
          } else {
            statusP.textContent = 'Invalid coupon code. Valid coupons: WELCOME10, SUMMER15.';
            statusP.style.color = '#d9534f';
          }
        };

        applyBtn.addEventListener('click', checkAndApply);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkAndApply();
          }
        });
      }
    }
  }

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
  document.querySelectorAll('[data-cod-method], input[name="payment"][value="cod"]').forEach((node) => node.closest('label')?.remove());
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
injectHomepageRewardOffer();
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
initDynamicProductPage();
refreshSelectedProductFromUrl();
initDynamicRelatedProducts();

function initAffiliateAttribution() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref') || params.get('affiliate');
  if (!ref) return;
  try {
    localStorage.setItem('zavoraAffiliateAttribution', JSON.stringify({
      ref,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      capturedAt: new Date().toISOString()
    }));
    fetch('/api/affiliate?action=click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, page: window.location.pathname })
    }).catch(() => {});
  } catch (error) {}
}

initAffiliateAttribution();

function initHomeBanners() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const image = hero.querySelector('img');
  const source = hero.querySelector('source');
  if (!image) return;

  const eyebrow = hero.querySelector('.hero-content .eyebrow');
  const title = hero.querySelector('.hero-content h1');
  const copy = hero.querySelector('.hero-content p:not(.eyebrow)');
  const cta = hero.querySelector('.hero-content .primary-cta');

  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '✨ USA Luxury Collection',
      title: 'Designed in the USA. Crafted for Everyday Luxury.',
      copy: 'Discover the 2026 luxury streetwear lineup featuring heavyweight cottons, tailored silhouettes, and minimalist aesthetics.',
      cta: 'Explore New Arrivals',
      href: 'shop.html?category=new'
    },
    {
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '☀️ USA Summer Edit',
      title: 'Get 15% OFF Premium Summer Fashion',
      copy: 'Elevate your summer wardrobe with clean oversized tees, hoodies, and vacation fits. Use Code: SUMMER15 at checkout.',
      cta: 'Shop Summer Sale (Code: SUMMER15)',
      href: 'shop.html?category=summer'
    },
    {
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '🔥 First Order Special',
      title: '$10 OFF Your First Luxury Purchase',
      copy: 'New to Zavora Fashion? Save $10 on orders over $49 with fast USA express shipping. Use Code: WELCOME10 at checkout.',
      cta: 'Claim $10 OFF (Code: WELCOME10)',
      href: 'shop.html?discount=welcome10'
    },
    {
      image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '👑 Men’s Streetwear Edit',
      title: 'Architectural Tailoring & Heavyweight Tees',
      copy: 'Structured cargo trousers, drop-shoulder hoodies, and custom dad hats built for urban luxury lifestyle.',
      cta: 'Shop Men’s Collection',
      href: 'shop.html?category=men'
    },
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '💃 Women’s Luxury Lineup',
      title: 'Effortless Elegance & Contemporary Fits',
      copy: 'Chic wide-leg trousers, oversized luxury hoodies, and minimal crop tees designed for modern women.',
      cta: 'Shop Women’s Lineup',
      href: 'shop.html?category=women'
    },
    {
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '❄️ Heavyweight Hoodies',
      title: '480 GSM French Terry Luxury Hoodies',
      copy: 'Crafted from 480 GSM organic french terry cotton for superior warmth and structural drape.',
      cta: 'Shop Luxury Hoodies',
      href: 'shop.html?category=hoodies'
    },
    {
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '⚡ Limited Edition Release',
      title: 'Exclusive Drop: Zavora Studio Edition',
      copy: 'Limited batch release of 100 individually numbered pieces worldwide. Once sold out, never re-released.',
      cta: 'Shop Limited Drop',
      href: 'shop.html?category=limited'
    },
    {
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '🚚 Free USA Express Delivery',
      title: 'Free Shipping On All USA Orders Over $75',
      copy: 'Enjoy complimentary 2-day express delivery across the United States. Automatic free shipping applied at checkout.',
      cta: 'Shop Best Sellers',
      href: 'shop.html?category=best'
    },
    {
      image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '🧢 Signature Accessories',
      title: 'The Signature Zavora Dad Hat Collection',
      copy: 'Premium cotton twill hats with high-density gold crest embroidery. Designed for subtle distinction.',
      cta: 'Shop Accessories',
      href: 'shop.html?category=accessories'
    },
    {
      image: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=2000&q=85',
      eyebrow: '🤝 Creator Partner Program',
      title: 'Earn Up to 15% Commission as a Partner',
      copy: 'Join the Zavora Creator Network. Share your custom link and earn real cash payouts on every customer purchase.',
      cta: 'Become an Affiliate',
      href: 'affiliate.html'
    }
  ];

  const dotsNav = hero.querySelector('.hero-dots');
  if (dotsNav) {
    dotsNav.innerHTML = banners.map((_, i) => `<button type="button" class="${i === 0 ? 'active' : ''}" aria-label="Go to banner ${i + 1}"></button>`).join('');
  }
  const dots = Array.from(hero.querySelectorAll('.hero-dots button'));

  let active = 0;
  const setBanner = (index) => {
    const next = banners[index];
    dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    if (eyebrow) eyebrow.textContent = next.eyebrow;
    if (title) title.textContent = next.title;
    if (copy) copy.textContent = next.copy;
    if (cta) {
      cta.textContent = next.cta;
      cta.href = next.href;
    }
    image.style.opacity = '0.3';
    setTimeout(() => {
      image.src = next.image;
      if (source) source.srcset = next.image;
      image.style.opacity = '1';
    }, 180);
  };

  image.src = banners[0].image;
  if (source) source.srcset = banners[0].image;
  setBanner(0);

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      active = index;
      setBanner(active);
    });
  });

  if (banners.length > 1) {
    setInterval(() => {
      active = (active + 1) % banners.length;
      setBanner(active);
    }, 5500);
  }
}

initHomeBanners();
}

function trackLiveVisitorSession() {
  try {
    const sid = sessionStorage.getItem('zavora_session_id') || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    sessionStorage.setItem('zavora_session_id', sid);

    let visitors = {};
    try { visitors = JSON.parse(localStorage.getItem('zavora_active_visitors') || '{}'); } catch(e) {}

    const now = Date.now();
    Object.keys(visitors).forEach(id => {
      if (now - Number(visitors[id] || 0) > 120000) delete visitors[id];
    });

    visitors[sid] = now;
    localStorage.setItem('zavora_active_visitors', JSON.stringify(visitors));
  } catch(e) {}
}
document.addEventListener('click', (event) => {
  const cancelBtn = event.target?.closest?.('[data-customer-cancel-order]');
  if (cancelBtn) {
    const orderId = cancelBtn.dataset.customerCancelOrder;
    if (!confirm(`Are you sure you want to cancel order #${orderId}?`)) return;
    try {
      let orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
      const target = orders.find(o => String(o.id) === String(orderId));
      if (target) {
        target.status = 'Cancelled by Customer';
        localStorage.setItem('zavoraOrders', JSON.stringify(orders));
        alert(`Order #${orderId} has been successfully cancelled.`);
        if (typeof renderDashboardView === 'function') renderDashboardView('orders');
      }
    } catch(e) {}
  }
});

document.addEventListener('submit', (event) => {
  if (event.target && event.target.id === 'returnRequestForm') {
    event.preventDefault();
    const form = event.target;
    const rawOrderId = form.querySelector('[name="orderId"]')?.value || '';
    const cleanOrderId = '#' + rawOrderId.replace(/^#+/, '');
    const email = form.querySelector('[name="email"]')?.value || '';
    const name = form.querySelector('[name="name"]')?.value || '';
    const reason = form.querySelector('[name="reason"]')?.value || '';
    const description = form.querySelector('[name="description"]')?.value || '';
    const photoFiles = form.querySelector('[name="photos"]')?.files || [];
    const videoFile = form.querySelector('[name="video"]')?.files?.[0];

    const readAsDataURL = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    const photoPromises = Array.from(photoFiles).slice(0, 5).map(readAsDataURL);
    const videoPromise = videoFile ? readAsDataURL(videoFile) : Promise.resolve(null);

    Promise.all([Promise.all(photoPromises), videoPromise]).then(([photoDataUrls, videoDataUrl]) => {
      const retId = 'RET-' + Math.floor(100000 + Math.random() * 900000);
      const newRequest = {
        id: retId,
        orderId: cleanOrderId,
        email,
        name,
        reason,
        description,
        photos: photoDataUrls.filter(Boolean),
        photosCount: photoFiles ? photoFiles.length : 0,
        video: videoDataUrl || null,
        videoName: videoFile ? videoFile.name : null,
        createdAt: new Date().toISOString()
      };

      try {
        let requests = JSON.parse(localStorage.getItem('zavoraReturnRequests') || '[]');
        requests.unshift(newRequest);
        localStorage.setItem('zavoraReturnRequests', JSON.stringify(requests));
      } catch(e) {}

      alert(`Return request submitted successfully!\n\nRequest ID: #${retId}\nOrder ID: ${cleanOrderId}\n\nYour details, photos & video clip have been attached for Admin review.`);
      form.reset();
    });
  }

  if (event.target && event.target.id === 'reportIssueForm') {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const category = form.querySelector('[name="category"]')?.value || 'Website issue';
    const orderId = form.querySelector('[name="orderId"]')?.value || 'N/A';
    const description = form.querySelector('[name="description"]')?.value || '';

    const repId = 'REP-' + Math.floor(100000 + Math.random() * 900000);
    const newReport = {
      id: repId,
      name,
      email,
      category,
      orderId,
      description,
      createdAt: new Date().toISOString()
    };

    try {
      let reports = JSON.parse(localStorage.getItem('zavoraIssueReports') || '[]');
      reports.unshift(newReport);
      localStorage.setItem('zavoraIssueReports', JSON.stringify(reports));
    } catch(e) {}

    alert(`Issue report submitted to Zavora Admin!\n\nReference ID: #${repId}\nCategory: ${category}\n\nThank you for helping us improve.`);
    form.reset();
  }
});
