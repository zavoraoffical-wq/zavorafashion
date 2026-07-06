const pageHeader = document.querySelector('.page-header');
const quickProducts = [
  'Noir Oversized Hoodie',
  'Gold Label Tee',
  'Avenue Cargo Pant',
  'Ivory Heavyweight Tee',
  'Zavora Cropped Jacket',
  'Monogram Cap',
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
const AUTH_KEY = 'zavoraLoggedIn';
const GIFT_CARD_KEY = 'zavoraGiftCards';
const APPLIED_GIFT_KEY = 'zavoraAppliedGiftCard';
const SIGNUP_OTP_KEY = 'zavoraSignupOtp';
const ORDER_HISTORY_KEY = 'zavoraOrders';
const SUPPORT_EMAIL = 'support@zavorafashion.com';
const NOREPLY_EMAIL = 'noreply@zavorafashion.com';
const LEGAL_EMAIL = 'legal@zavorafashion.com';
const OFFICIAL_EMAIL = 'zavoraofficial@zavorafashion.com';
const ZAVORA_LOGO = 'assets/zavora-logo.png';
const accountRedirects = {
  'my-account.html': 'dashboard',
  'wishlist.html': 'wishlist',
  'order-history.html': 'orders',
  'saved-addresses.html': 'addresses',
  'change-password.html': 'change-password'
};

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
  const activeCart = cart.length ? cart : [{
    id: 8,
    name: 'Studio Wide Trouser',
    price: 168,
    color: 'Black',
    sizes: ['M'],
    qty: 1,
    img: 'assets/studio-wide-trouser.png'
  }];
  const total = activeCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  const email = document.querySelector('.checkout-form input[type="email"]')?.value.trim().toLowerCase()
    || localStorage.getItem('zavoraUserEmail')
    || 'customer@zavorafashion.com';
  const order = {
    id: `ZAV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    email,
    method,
    total,
    items: activeCart,
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
    profile.href = localStorage.getItem(AUTH_KEY) === 'true' ? 'dashboard.html' : 'login.html';
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
    if (button.dataset.profile || button.querySelector('.header-count')) return;
    const count = document.createElement('span');
    count.className = 'header-count';
    count.textContent = '2';
    button.appendChild(count);
    button.setAttribute('aria-label', 'Wishlist');
  });
}

function hydrateCloseIcons(scope = document) {
  scope.querySelectorAll('.close').forEach((button) => {
    button.innerHTML = icons.close;
  });
}

function syncPageHeader() {
  if (pageHeader) {
    pageHeader.classList.toggle('scrolled', window.scrollY > 24);
  }
}

function enforceAuthState() {
  const pageName = window.location.pathname.split('/').pop();
  if (accountRedirects[pageName]) {
    window.location.replace(`dashboard.html#${accountRedirects[pageName]}`);
    return;
  }
  if (pageName === 'login.html' && localStorage.getItem(AUTH_KEY) === 'true') {
    window.location.href = 'dashboard.html';
  }
  document.querySelectorAll('[data-profile]').forEach((profile) => {
    profile.href = localStorage.getItem(AUTH_KEY) === 'true' ? 'dashboard.html' : 'login.html';
  });
}

const accountViews = {
  dashboard: `
    <article class="dashboard-card"><span>01</span><h3>Recent Order</h3><p>#ZAV-2026-1048 is preparing for shipment.</p><a class="text-link" href="track-order.html">Track order</a></article>
    <article class="dashboard-card"><span>02</span><h3>Wishlist</h3><p>3 saved pieces with back-in-stock alerts.</p><button class="text-link" type="button" data-dashboard-view="wishlist">Open wishlist</button></article>
    <article class="dashboard-card"><span>03</span><h3>Saved Addresses</h3><p>USA shipping profile ready for fast checkout.</p><button class="text-link" type="button" data-dashboard-view="addresses">Manage addresses</button></article>
    <article class="dashboard-card"><span>04</span><h3>Profile</h3><p>Currency USD and country USA preferences active.</p><button class="text-link" type="button" data-dashboard-view="profile">Edit profile</button></article>
  `,
  orders: `
    <article class="dashboard-card dashboard-wide"><span>Orders</span><h3>#ZAV-2026-1048</h3><p>Studio Wide Trouser / Paid $168 / Packing now.</p><div class="mini-status"><i style="width:68%"></i></div><a class="text-link" href="track-order.html">Track live order</a></article>
    <article class="dashboard-card dashboard-wide"><span>Order History</span><h3>#ZAV-2026-0991</h3><p>Noir Oversized Hoodie / Delivered / Return window closed.</p><a class="text-link" href="product.html">Buy again</a></article>
  `,
  wishlist: `
    <article class="dashboard-card dashboard-wide"><span>Wishlist</span><h3>Saved Zavora pieces</h3><p>Wishlist items show here and stay inside dashboard.</p><button class="secondary-btn slim-btn" type="button" data-add-wishlist>Add product</button></article>
    <article class="wishlist-item"><button class="remove-x" type="button" data-remove-wishlist aria-label="Remove Studio Wide Trouser">&times;</button><img src="assets/studio-wide-trouser.png" alt="Studio Wide Trouser"><div><h3>Studio Wide Trouser</h3><p>$168 / Black / M</p><a class="text-link" href="product.html">View details</a></div></article>
    <article class="wishlist-item"><button class="remove-x" type="button" data-remove-wishlist aria-label="Remove Noir Oversized Hoodie">&times;</button><img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80" alt="Noir Oversized Hoodie"><div><h3>Noir Oversized Hoodie</h3><p>$148 / Back in stock alert on</p><a class="text-link" href="product.html">View details</a></div></article>
    <article class="wishlist-item"><button class="remove-x" type="button" data-remove-wishlist aria-label="Remove Ivory Heavyweight Tee">&times;</button><img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=500&q=80" alt="Ivory Heavyweight Tee"><div><h3>Ivory Heavyweight Tee</h3><p>$78 / Recommended with cargos</p><a class="text-link" href="product.html">View details</a></div></article>
  `,
  addresses: `
    <article class="dashboard-card dashboard-wide"><span>Primary Address</span><h3>USA Shipping Profile</h3><p>Alex Morgan, 221 Market Street, New York, NY 10001</p><button class="text-link" type="button">Edit address</button></article>
    <article class="dashboard-card dashboard-wide address-form"><span>Add Address</span><h3>Add new delivery address</h3><div class="mini-form"><input placeholder="Full name"><input placeholder="Street address"><input placeholder="City"><input placeholder="ZIP code"></div><button class="secondary-btn slim-btn" type="button" data-add-address>Add address</button></article>
    <article class="dashboard-card dashboard-wide"><span>Delivery</span><h3>Fast checkout ready</h3><p>Address autofill and saved delivery preferences are active.</p></article>
  `,
  profile: `
    <article class="dashboard-card dashboard-wide"><span>Profile</span><h3>Alex Morgan</h3><p>Email: user@zavora.com / Country: USA / Currency: USD</p><button class="text-link" type="button">Save profile</button></article>
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Password protected</h3><p>Demo account login is active for this browser.</p></article>
  `,
  'change-password': `
    <article class="dashboard-card dashboard-wide"><span>Security</span><h3>Change Password</h3><p>Update your Zavora account password for secure checkout and saved address access.</p><div class="mini-form"><input type="password" placeholder="Current password"><input type="password" placeholder="New password"><input type="password" placeholder="Confirm password"></div><button class="secondary-btn slim-btn" type="button" data-password-save>Update password</button></article>
    <article class="dashboard-card dashboard-wide"><span>Protected Account</span><h3>Login stays active</h3><p>Once logged in, Zavora keeps your dashboard, wishlist, orders, and addresses ready in this browser.</p></article>
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

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getPendingSignupOtp() {
  try {
    return JSON.parse(sessionStorage.getItem(SIGNUP_OTP_KEY)) || null;
  } catch (error) {
    return null;
  }
}

function savePendingSignupOtp(payload) {
  sessionStorage.setItem(SIGNUP_OTP_KEY, JSON.stringify(payload));
}

function clearPendingSignupOtp() {
  sessionStorage.removeItem(SIGNUP_OTP_KEY);
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

async function requestSignupOtp(email, otp) {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        from: OFFICIAL_EMAIL,
        subject: 'Your Zavora Fashion Verification Code',
        otp
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
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

async function requestPasswordReset(email) {
  try {
    const response = await fetch('/api/send-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function renderSignupOtpStep(form, payload, sentByApi = false) {
  form.classList.add('otp-mode');
  form.innerHTML = `
    <div class="otp-panel">
      <p class="eyebrow">Email Verification</p>
      <h2>Enter your 6-digit OTP</h2>
      <p>We sent a verification code to <strong>${payload.email}</strong>. This code expires in 10 minutes.</p>
      <input inputmode="numeric" maxlength="6" pattern="[0-9]*" placeholder="6-digit code" data-signup-otp-input>
      <button class="primary-cta" type="button" data-verify-signup-otp>Verify & Create Account</button>
      <button class="text-link otp-link" type="button" data-resend-signup-otp>Resend OTP</button>
      <p class="otp-note">${sentByApi ? `OTP sent from ${NOREPLY_EMAIL}.` : `Demo mode OTP: ${payload.otp}. Connect Resend backend at /api/send-otp for real email.`}</p>
    </div>
  `;
  form.querySelector('[data-signup-otp-input]')?.focus();
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
  if (Date.now() > Number(pending.expiresAt)) {
    clearPendingSignupOtp();
    return;
  }
  renderSignupOtpStep(form, pending, false);
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
  if (view === 'orders') {
    const cards = getGiftCards();
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
}

window.addEventListener('scroll', syncPageHeader);
syncPageHeader();
normalizeHeaderSelectors();
hydrateHeaderIcons();
hydrateCloseIcons();
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
  const activeCart = cart.length ? cart : [{
    id: 8,
    name: 'Studio Wide Trouser',
    color: 'black',
    sizes: ['M'],
    price: 168,
    qty: 1,
    img: 'assets/studio-wide-trouser.png'
  }];
  const total = activeCart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
  let giftDiscount = 0;
  try {
    const appliedGift = JSON.parse(localStorage.getItem(APPLIED_GIFT_KEY));
    if (appliedGift?.code) giftDiscount = Math.min(total, Number(appliedGift.balance || appliedGift.value || 0));
  } catch (error) {
    giftDiscount = 0;
  }
  const payable = Math.max(0, total - giftDiscount);
  summary.innerHTML = activeCart.map((item) => `
    <a class="summary-product" href="product.html">
      <img src="${item.img || 'assets/studio-wide-trouser.png'}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'">
      <div><strong>${item.name}</strong><span>${item.color || 'Black'} / ${item.sizes?.[0] || 'M'} / Qty ${item.qty || 1}</span></div>
      <b>${money(Number(item.price || 0) * Number(item.qty || 1))}</b>
    </a>
  `).join('');
  document.querySelectorAll('[data-checkout-subtotal]').forEach((node) => {
    node.textContent = money(total);
  });
  document.querySelectorAll('[data-gift-discount]').forEach((node) => {
    node.textContent = giftDiscount ? `-${money(giftDiscount)}` : '-$0';
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
  if (drawer) return drawer;

  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'pageWishlistDrawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="drawer-head">
      <h2>Wishlist</h2>
      <button class="close" data-close-wishlist aria-label="Close wishlist">&times;</button>
    </div>
    <div class="cart-items">
      <div class="cart-item">
        <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&q=80" alt="Ivory Heavyweight Tee">
        <div><h3>Ivory Heavyweight Tee</h3><span>$78 - Back in stock alert ready</span></div>
        <button type="button" aria-label="Remove item">&times;</button>
      </div>
      <div class="cart-item">
        <img src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=300&q=80" alt="Avenue Cargo Pant">
        <div><h3>Avenue Cargo Pant</h3><span>$132 - Recommended with hoodies</span></div>
        <button type="button" aria-label="Remove item">&times;</button>
      </div>
    </div>
    <button class="checkout" type="button" onclick="location.href='wishlist.html'">Open Wishlist Page</button>
    <p class="payment">Saved pieces, size alerts, and back-in-stock notifications.</p>
  `;
  document.body.appendChild(drawer);
  hydrateCloseIcons(drawer);
  return drawer;
}

function productCard(title, price, image, tag) {
  return `
    <article class="page-card">
      <img src="${image}" alt="${title}">
      <div><h3>${title}</h3><p>${price} - ${tag}</p><a class="text-link" href="product.html">Shop product</a></div>
    </article>
  `;
}

const catalogImages = [
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=600&q=80'
];
const catalogNames = ['Noir Oversized Hoodie', 'Gold Label Tee', 'Avenue Cargo Pant', 'Zavora Cropped Jacket', 'Monogram Cap', 'Ivory Heavyweight Tee', 'Studio Wide Trouser', 'City Rib Tank', 'Luxe Track Jacket', 'Everyday Cargo Skirt'];
const catalogData = Array.from({ length: 60 }, (_, index) => ({
  id: index + 101,
  name: `${catalogNames[index % catalogNames.length]} ${String(index + 1).padStart(2, '0')}`,
  category: ['women', 'men', 'new', 'limited', 'essentials'][index % 5],
  color: ['black', 'white', 'gray', 'gold'][index % 4],
  size: ['XS', 'S', 'M', 'L', 'XL'][index % 5],
  price: 48 + (index % 12) * 18,
  image: catalogImages[index % catalogImages.length],
  badge: index % 6 === 0 ? 'Limited' : index % 4 === 0 ? 'Best Seller' : index % 3 === 0 ? 'New' : 'Zavora'
}));

function catalogCard(item) {
  return `
    <article class="catalog-card" data-catalog-card data-category="${item.category}" data-color="${item.color}" data-size="${item.size}" data-price="${item.price}">
      <a href="product.html" aria-label="Open ${item.name} detail page">
        <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='assets/studio-wide-trouser.png'">
        <span class="badge">${item.badge}</span>
      </a>
      <div>
        <h3><a href="product.html">${item.name}</a></h3>
        <p>${item.category} / ${item.color} / ${item.size}</p>
        <strong>${money(item.price)}</strong>
      </div>
    </article>
  `;
}

function injectLargeCatalog() {
  const main = document.querySelector('main');
  const pageName = window.location.pathname.split('/').pop();
  if (!main || document.querySelector('.catalog-shop') || !catalogOnlyPages.includes(pageName)) return;
  const section = document.createElement('section');
  section.className = 'catalog-shop';
  section.innerHTML = `
    <aside class="catalog-sidebar">
      <div class="filter-head">
        <h2>Shop Zavora</h2>
        <p><span data-catalog-count>${catalogData.length}</span> products available</p>
      </div>
      <label>Category<select data-catalog-filter="category"><option value="all">All</option><option>women</option><option>men</option><option>new</option><option>limited</option><option>essentials</option></select></label>
      <label>Color<select data-catalog-filter="color"><option value="all">All</option><option>black</option><option>white</option><option>gray</option><option>gold</option></select></label>
      <label>Size<select data-catalog-filter="size"><option value="all">All</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></label>
      <label>Under amount<select data-catalog-filter="price"><option value="999">All</option><option value="100">Under $100</option><option value="160">Under $160</option><option value="240">Under $240</option></select></label>
      <label>Sort<select data-catalog-filter="sort"><option value="featured">Featured</option><option value="low">Price low to high</option><option value="high">Price high to low</option></select></label>
      <button type="button" data-catalog-reset>Reset</button>
    </aside>
    <div class="catalog-area">
      <div class="catalog-toolbar">
        <div><p class="eyebrow">60 Product Edit</p><h1>Premium streetwear catalog</h1></div>
        <span><strong data-catalog-count>${catalogData.length}</strong> results</span>
      </div>
      <div class="catalog-grid" data-catalog-grid>${catalogData.map(catalogCard).join('')}</div>
    </div>
  `;
  main.classList.add('catalog-main');
  main.innerHTML = '';
  main.appendChild(section);
}

function filterLargeCatalog() {
  const filters = document.querySelectorAll('[data-catalog-filter]');
  if (!filters.length) return;
  const values = Object.fromEntries([...filters].map((filter) => [filter.dataset.catalogFilter, filter.value]));
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
    const match = (values.category === 'all' || card.dataset.category === values.category)
      && (values.color === 'all' || card.dataset.color === values.color)
      && (values.size === 'all' || card.dataset.size === values.size)
      && Number(card.dataset.price) <= Number(values.price || 999);
    card.hidden = !match;
    if (match) visible += 1;
  });
  document.querySelectorAll('[data-catalog-count]').forEach((count) => {
    count.textContent = visible;
  });
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

document.addEventListener('change', (event) => {
  if (event.target?.matches('[data-catalog-filter]')) {
    filterLargeCatalog();
  }
});

document.addEventListener('click', async (event) => {
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
      localStorage.removeItem(AUTH_KEY);
      window.location.href = 'login.html';
      return;
    }
    setDashboardView(view);
    return;
  }

  const removeWishlist = event.target.closest('[data-remove-wishlist]');
  if (removeWishlist) {
    event.preventDefault();
    removeWishlist.closest('.wishlist-item')?.remove();
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
    card?.insertAdjacentHTML('beforeend', '<p class="login-error success-note">Password preference saved for this demo account.</p>');
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
    const otp = generateOtp();
    const payload = { name, email, password, otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    savePendingSignupOtp(payload);
    requestSignupOtp(email, otp).then((sentByApi) => renderSignupOtpStep(form, payload, sentByApi));
    return;
  }

  if (loginTrigger && window.location.pathname.endsWith('login.html')) {
    event.preventDefault();
    const email = document.querySelector('.auth-card input[type="email"]')?.value.trim().toLowerCase();
    const password = document.querySelector('.auth-card input[type="password"]')?.value.trim();
    const valid = (email === 'user@zavora.com' && password === '123456')
      || (email === 'zavora@fashion.com' && password === 'zavora2026');
    let error = document.querySelector('[data-login-error]');
    if (!error) {
      error = document.createElement('p');
      error.dataset.loginError = 'true';
      error.className = 'login-error';
      loginTrigger.closest('.form-panel')?.appendChild(error);
    }
    if (!valid) {
      error.textContent = 'Use demo login: user@zavora.com / 123456';
      return;
    }
    error.textContent = '';
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem('zavoraUserEmail', email);
    window.location.href = 'dashboard.html';
    return;
  }

  const resetTrigger = event.target.closest('.auth-card .primary-cta');
  if (resetTrigger && window.location.pathname.endsWith('forgot-password.html')) {
    event.preventDefault();
    const form = resetTrigger.closest('.form-panel');
    const email = form?.querySelector('input[type="email"]')?.value.trim().toLowerCase();
    const note = otpErrorNode(form);
    if (!email || !email.includes('@')) {
      note.textContent = 'Enter your account email to receive a reset link.';
      return;
    }
    resetTrigger.textContent = 'Sending...';
    resetTrigger.setAttribute('aria-busy', 'true');
    const sent = await requestPasswordReset(email);
    resetTrigger.textContent = 'Send Reset Link';
    resetTrigger.removeAttribute('aria-busy');
    note.textContent = sent
      ? `Password reset email sent from ${SUPPORT_EMAIL}. Check inbox and spam folder.`
      : `Email service is not ready. Please contact ${SUPPORT_EMAIL}.`;
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
    if (!pending) {
      error.textContent = 'OTP session expired. Please request a new code.';
      return;
    }
    if (Date.now() > Number(pending.expiresAt)) {
      clearPendingSignupOtp();
      error.textContent = 'OTP expired. Please resend the code.';
      return;
    }
    if (inputOtp !== pending.otp) {
      error.textContent = 'Invalid OTP. Enter the 6-digit code sent to your email.';
      return;
    }
    localStorage.setItem(AUTH_KEY, 'true');
    localStorage.setItem('zavoraUserEmail', pending.email);
    localStorage.setItem('zavoraUserName', pending.name);
    clearPendingSignupOtp();
    requestWelcomeEmail(pending.email, pending.name).finally(() => {
      window.location.href = 'dashboard.html';
    });
    return;
  }

  if (event.target.closest('[data-resend-signup-otp]')) {
    event.preventDefault();
    const form = event.target.closest('.form-panel');
    const pending = getPendingSignupOtp();
    if (!pending) return;
    const nextPayload = { ...pending, otp: generateOtp(), expiresAt: Date.now() + 10 * 60 * 1000 };
    savePendingSignupOtp(nextPayload);
    requestSignupOtp(nextPayload.email, nextPayload.otp).then((sentByApi) => renderSignupOtpStep(form, nextPayload, sentByApi));
    return;
  }

  const checkoutTrigger = event.target.closest('[data-buy-now]');
  if (checkoutTrigger) {
    event.preventDefault();
    window.location.href = localStorage.getItem(AUTH_KEY) === 'true' ? 'checkout.html' : 'login.html';
    return;
  }

  const checkoutLink = event.target.closest('a[href="checkout.html"]:not([data-page-cart])');
  if (checkoutLink && localStorage.getItem(AUTH_KEY) !== 'true') {
    event.preventDefault();
    window.location.href = 'login.html';
    return;
  }

  const payNow = event.target.closest('.pay-now');
  if (payNow && window.location.pathname.endsWith('checkout.html')) {
    event.preventDefault();
    const selected = document.querySelector('input[name="payment"]:checked')?.value || 'paypal';
    const method = selected === 'cod' ? 'COD' : 'PayPal';
    const order = createTestOrder(method);
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
    return;
  }

  const addProduct = event.target.closest('[data-product-add], .product-actions .primary-cta');
  if (addProduct && window.location.pathname.endsWith('product.html')) {
    event.preventDefault();
    const title = document.querySelector('.product-buy h1')?.textContent.trim() || 'Noir Oversized Hoodie';
    const price = Number((document.querySelector('.product-buy .price')?.textContent || '$148').replace(/[^0-9.]/g, '')) || 148;
    const optionRows = [...document.querySelectorAll('.product-buy .option-row')];
    const color = optionRows[0]?.querySelector('button.active')?.textContent.trim() || 'Black';
    const size = optionRows[1]?.querySelector('button.active')?.textContent.trim() || 'M';
    const img = document.querySelector('.product-gallery img')?.src || 'assets/studio-wide-trouser.png';
    const cart = getSavedCart();
    cart.push({ id: Date.now(), name: title, price, color, sizes: [size], qty: 1, img });
    saveSavedCart(cart);
    renderSavedCart(document);
    syncHeaderCounts();
    ensurePageCart().classList.add('open');
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

  if (event.target.closest('[data-close-page-search]')) {
    document.querySelector('#pageSearchOverlay')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-page-cart]')) {
    document.querySelector('#pageCartDrawer')?.classList.remove('open');
  }
  if (event.target.closest('[data-close-wishlist]')) {
    document.querySelector('#pageWishlistDrawer')?.classList.remove('open');
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
  const card = event.target.closest('.page-card, .product-card');
  if (!interactive && card && card.querySelector('img') && !card.closest('.footer')) {
    window.location.href = 'product.html';
  }
});

document.querySelectorAll('[data-page-cart]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    ensurePageCart().classList.add('open');
  });
});

document.querySelectorAll('.header-actions a[aria-label="Account"], .header-actions a[aria-label="Wishlist"], .header-actions a[href="account.html"]').forEach((button) => {
  button.addEventListener('click', (event) => {
    if (button.dataset.profile) return;
    event.preventDefault();
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
      <a href="dashboard.html#dashboard">My Account</a>
      <a href="dashboard.html#wishlist">Wishlist</a>
      <a href="dashboard.html#orders">Order History</a>
      <a href="dashboard.html#addresses">Saved Addresses</a>
      <a href="dashboard.html#change-password">Change Password</a>
      <a href="newsletter.html">Newsletter</a>
    </div>
  `;
  footer.insertBefore(mega, footerBottom || null);
}

function cleanAuthPageFooter() {
  const pageName = window.location.pathname.split('/').pop();
  if (!plainCommercePages.includes(pageName)) return;
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
  function lookupOrder() {
    const orderId = inputs[0]?.value.trim().replace(/^#/, '').toUpperCase();
    const email = inputs[1]?.value.trim().toLowerCase();
    if (!orderId || !email) {
      note.textContent = 'Enter order ID and email to view tracking updates.';
      card.hidden = true;
      return;
    }
    const demoOrder = {
      id: 'ZAV-2026-1048',
      email,
      method: 'PayPal',
      total: 168,
      tracking: 'ZV20261048',
      createdAt: new Date().toISOString(),
      items: [{ name: 'Studio Wide Trouser' }]
    };
    const orders = [demoOrder, ...getSavedOrders()];
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

function initProductOptions() {
  document.querySelectorAll('.product-buy .option-row').forEach((row) => {
    const first = row.querySelector('button');
    if (first && !row.querySelector('button.active')) first.classList.add('active');
  });
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
injectProductRails();
cleanAuthPageFooter();
initCheckoutGiftUi();
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
