const sectionTitles = {
  dashboard: 'Zavora Dashboard',
  products: 'Products',
  importer: 'Product Importer',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  payments: 'Payments',
  shipping: 'Shipping',
  coupons: 'Coupons',
  wishlist: 'Wishlist',
  affiliates: 'Affiliates',
  reviews: 'Reviews',
  emails: 'Email Center',
  notifications: 'Notifications',
  analytics: 'Analytics',
  homepage: 'Homepage Builder',
  content: 'Content Pages',
  localization: 'Localization',
  media: 'Media Library',
  ai: 'AI Features',
  settings: 'Website Settings',
  admin: 'Admin Settings'
};

const ADMIN_SESSION_KEY = 'zavoraAdminSession';
const ADMIN_PRODUCTS_KEY = 'zavoraAdminProducts';
const AFFILIATE_KEY = 'zavoraAffiliateApplications';
const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';
let affiliateServerLoaded = false;

async function requireAdminSession() {
  try {
    const response = await fetch('/api/admin?action=session', { credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok || !data.session) {
      window.location.replace('admin-login.html');
      return false;
    }
    document.body.classList.remove('admin-locked');
    return true;
  } catch (error) {
    window.location.replace('admin-login.html');
    return false;
  }
}

const quickPanels = {
  categories: ['Men', 'Women', 'Hoodies', 'T-Shirts', 'Pants', 'Accessories', 'Limited Edition', 'New Arrivals', 'Best Sellers'],
  payments: ['PayPal active', 'Apple Pay coming soon', 'Google Pay coming soon', 'Visa coming soon', 'Mastercard coming soon', 'Refund Management', 'Payment Logs'],
  shipping: ['Shipping Zones', 'Shipping Charges', 'Free Shipping Rules', 'Delivery Time', 'Courier Partners', 'Tracking Integration'],
  coupons: ['Percentage Discount', 'Fixed Discount', 'Free Shipping Coupon', 'Limited Time Offers', 'Auto Apply Coupon'],
  wishlist: ['Customer Wishlist', 'Most Wishlisted Products', 'Back-in-stock alerts', 'Wishlist conversion'],
  reviews: ['Product Reviews', 'Ratings', 'Approve Reviews', 'Delete Reviews', 'Review highlights'],
  notifications: ['New Order', 'New Signup', 'Low Stock', 'Cancel Request', 'Return Request'],
  content: ['FAQ', 'About Us', 'Contact', 'Privacy Policy', 'Terms', 'Shipping Policy', 'Return Policy', 'Fabric Care Guide', 'Size Guide'],
  localization: ['Currency', 'Language', 'Tax', 'Country Settings', 'USA checkout rules'],
  media: ['Images', 'Videos', 'Banners', 'Brand Logos', 'Icons', 'Documents']
};

function readAffiliates() {
  try {
    return JSON.parse(localStorage.getItem(AFFILIATE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveAffiliates(apps) {
  localStorage.setItem(AFFILIATE_KEY, JSON.stringify(apps));
}

function mergeAffiliateList(serverApps = []) {
  const map = new Map();
  readAffiliates().forEach((app) => map.set(String(app.id || app._id || app.email), app));
  serverApps.forEach((app) => {
    const key = String(app.id || app._id || app.email);
    map.set(key, { ...(map.get(key) || {}), ...app, id: app.id || app._id || key });
  });
  const merged = [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  saveAffiliates(merged);
  return merged;
}

async function syncAffiliatesFromServer(force = false) {
  if (affiliateServerLoaded && !force) return readAffiliates();
  const response = await fetch('/api/admin?action=affiliates', { credentials: 'include' }).catch(() => null);
  const data = await response?.json?.().catch(() => ({}));
  if (response?.ok && data?.apps) {
    affiliateServerLoaded = true;
    return mergeAffiliateList(data.apps);
  }
  return readAffiliates();
}

async function saveAffiliateToServer(app) {
  if (!app?.id) return false;
  const response = await fetch('/api/admin?action=affiliates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mode: 'save', id: app.id, app })
  }).catch(() => null);
  return Boolean(response?.ok);
}

async function deleteAffiliateFromServer(id) {
  const response = await fetch('/api/admin?action=affiliates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mode: 'delete', id })
  }).catch(() => null);
  return Boolean(response?.ok);
}

function affiliateId(app) {
  return app.affiliateId || `ZAF-${String(app.email || app.id || Date.now()).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}${String(Date.now()).slice(-4)}`;
}

function affiliatePassword() {
  return `Zavora-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${String(Date.now()).slice(-4)}`;
}

function affiliateCoupon(id) {
  return `${String(id || 'ZAF').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}10`;
}

function approvalEmail(app) {
  return [
    'Welcome to Zavora Fashion Affiliate Program',
    '',
    'Your account has been approved.',
    '',
    `Login URL: https://www.zavorafashion.com/affiliate/login`,
    `Your Password: ${app.password || ''}`,
    `Affiliate Link: ${app.link || ''}`,
    `Commission Rate: ${app.commission || 10}%`,
    `Dashboard URL: https://www.zavorafashion.com/affiliate/dashboard`,
    '',
    'Zavora Fashion Partner Team'
  ].join('\n');
}

async function sendAffiliateApprovalEmail(app) {
  const response = await fetch('/api/admin?action=affiliate-approval-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: app.email,
      fullName: app.fullName,
      password: app.password,
      affiliateId: app.affiliateId,
      link: app.link,
      coupon: app.coupon,
      commission: app.commission
    })
  }).catch(() => null);
  const data = await response?.json?.().catch(() => ({}));
  if (!response?.ok || !data?.ok) {
    throw new Error(data?.error || 'Approval email failed');
  }
  return data;
}

async function renderAffiliatesPanel() {
  const root = document.querySelector('[data-affiliate-panel]');
  if (!root) return;
  await syncAffiliatesFromServer();
  const query = (document.querySelector('[data-affiliate-search]')?.value || '').trim().toLowerCase();
  const filter = document.querySelector('[data-affiliate-filter]')?.value || 'all';
  const apps = readAffiliates().filter((app) => {
    const haystack = `${app.fullName || ''} ${app.email || ''} ${app.country || ''} ${app.status || ''}`.toLowerCase();
    return (!query || haystack.includes(query)) && (filter === 'all' || app.status === filter);
  });
  if (!apps.length) {
    root.innerHTML = '<div class="empty-admin-state">No affiliate applications yet. New applications from /affiliate will appear here.</div>';
    return;
  }

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
  } catch(e) {}

  root.innerHTML = `
    <table class="admin-table affiliate-table">
      <thead><tr><th>Affiliate Partner</th><th>Referred Sales & Revenue</th><th>Status</th><th>Commission %</th><th>Total Earnings Owed</th><th>Actions</th></tr></thead>
      <tbody>
        ${apps.map((app) => {
          const refCode = (app.affiliateId || app.coupon || ('ZAF' + (app.fullName || '').replace(/\s+/g, '').toUpperCase())).toUpperCase();
          const referredOrders = orders.filter(o => o.refCode === refCode || (o.coupon && o.coupon.toUpperCase() === refCode));
          const salesCount = referredOrders.length;
          const totalRevenue = referredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
          const commissionRate = app.commission || 10;
          const totalEarnings = (totalRevenue * (commissionRate / 100)).toFixed(2);
          const customerEmails = referredOrders.length > 0 ? referredOrders.map(o => o.email).join(', ') : 'No referral sales yet';

          return `
          <tr data-affiliate-id="${app.id}">
            <td>
              <strong style="font-size:14px;color:#050505;display:block;">${app.fullName || 'Applicant'}</strong>
              <span style="font-size:12px;color:#333;">✉️ ${app.email || ''}</span>
              <br><small style="color:#666;">Ref Link: <code>${app.link || ('https://www.zavorafashion.com/?ref=' + refCode)}</code></small>
            </td>
            <td>
              <strong style="color:#2e7d32;font-size:14px;">${salesCount} Orders Referred</strong>
              <br><span style="font-size:12px;color:#444;">Total Sales: ${money(totalRevenue)}</span>
              <br><small style="color:#666;">Referred Buyers: ${customerEmails}</small>
            </td>
            <td><span class="pill ${app.status === 'approved' ? 'green' : app.status === 'pending' ? 'gold' : ''}">${app.status || 'approved'}</span></td>
            <td><input class="affiliate-commission-input" data-affiliate-commission="${app.id}" type="number" min="1" max="50" value="${app.commission || 10}">%</td>
            <td>
              <strong style="color:#2e7d32;font-size:14px;">${money(totalEarnings)}</strong>
              <br><button type="button" data-toast="Commission payout of ${money(totalEarnings)} transferred to ${app.fullName}" style="margin-top:4px;padding:3px 8px;font-size:11px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;">Pay Earnings</button>
            </td>
            <td class="affiliate-actions">
              <button data-affiliate-action="approve" data-affiliate-target="${app.id}">Approve</button>
              <button data-affiliate-action="suspend" data-affiliate-target="${app.id}">Suspend</button>
              <button data-affiliate-action="copy-email" data-affiliate-target="${app.id}">Copy Email</button>
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
  `;
}

async function updateAffiliate(id, updater) {
  const apps = readAffiliates();
  const index = apps.findIndex((app) => String(app.id) === String(id));
  if (index < 0) return null;
  apps[index] = updater({ ...apps[index] }) || apps[index];
  saveAffiliates(apps);
  await saveAffiliateToServer(apps[index]);
  await renderAffiliatesPanel();
  return apps[index];
}

function exportAffiliates() {
  const rows = [['Name', 'Email', 'Phone', 'Country', 'Status', 'Commission', 'Affiliate ID', 'Coupon', 'Link']];
  readAffiliates().forEach((app) => rows.push([app.fullName, app.email, app.phone, app.country, app.status, app.commission, app.affiliateId, app.coupon, app.link]));
  const csv = rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'zavora-affiliates.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

function toast(message) {
  const box = document.querySelector('[data-toast-box]');
  if (!box) return;
  box.textContent = message;
  box.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => box.classList.remove('show'), 2200);
}

let latestStats = {};

function setSection(name) {
  const title = sectionTitles[name] || 'Zavora Admin';
  document.querySelector('[data-page-title]').textContent = title;
  document.querySelectorAll('[data-section]').forEach((button) => button.classList.toggle('active', button.dataset.section === name));
  document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  document.querySelector('[data-sidebar]')?.classList.remove('open');
  window.history.replaceState(null, '', `#${name}`);

  if (name === 'orders') renderLiveOrders(latestStats);
  if (name === 'products') renderAdminProducts();
  if (name === 'categories') renderAdminCategories();
  if (name === 'customers') renderAdminCustomers();
  if (name === 'payments') renderAdminPayments();
  if (name === 'shipping') renderAdminShipping();
  if (name === 'coupons') renderAdminCoupons();
  if (name === 'wishlist') renderAdminWishlist();
  if (name === 'notifications') renderAdminNotifications();
  if (name === 'reports') renderAdminReports();
  if (name === 'emails') renderAdminEmails();
  if (name === 'analytics') renderAdminAnalytics();
  if (name === 'affiliates') renderAffiliatesPanel();
}

function renderQuickPanels() {
  Object.entries(quickPanels).forEach(([name, items]) => {
    const panel = document.querySelector(`[data-panel="${name}"]`);
    if (!panel || panel.children.length) return;
    panel.innerHTML = `
      <article class="admin-card">
        <div class="card-head">
          <h2>${sectionTitles[name]}</h2>
          <button data-toast="${sectionTitles[name]} saved">Save</button>
        </div>
        <div class="control-grid">
          ${items.map((item) => `<button data-toast="${item} opened">${item}</button>`).join('')}
        </div>
      </article>
      <article class="admin-card">
        <h2>Premium Workflow</h2>
        <p>Manage ${sectionTitles[name].toLowerCase()} from one clean Zavora control center. These modules are ready to connect with real backend APIs when production data is added.</p>
      </article>
    `;
  });
}

const ZAVORA_FULL_CATALOG = [
  { id: '638', name: 'Zavora Dad Hat', category: 'accessories', price: 94.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Accessories' },
  { id: '655', name: 'Zavora Premium Polo Shirt', category: 'tees', price: 109.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Tees' },
  { id: '1586', name: 'Zavora Fundamental Alliance Cap', category: 'accessories', price: 89.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Accessories' },
  { id: '458', name: 'Zavora Beanie', category: 'accessories', price: 74.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Accessories' },
  { id: '328', name: 'Zavora Athletic T-Shirt', category: 'tees', price: 84.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Tees' },
  { id: '957', name: 'Zavora Crew Neck Sweatshirt', category: 'sweatshirts', price: 119.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Sweatshirts' },
  { id: '712', name: 'Zavora Oversized Streetwear Hoodie', category: 'hoodies', price: 149.89, img: 'assets/studio-wide-trouser.png', page: 'Home / Hoodies' },
  { id: '803', name: 'Zavora Pigment-Dyed Sweatpants', category: 'pants', price: 139.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Pants' },
  { id: '204', name: 'Zavora Studio Wide-Leg Trouser', category: 'pants', price: 169.89, img: 'assets/studio-wide-trouser.png', page: 'Home / Collections' },
  { id: '311', name: 'Zavora Vintage Heavyweight Tee', category: 'tees', price: 89.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Tees' },
  { id: '405', name: 'Zavora Minimalist Oversized Crewneck', category: 'sweatshirts', price: 129.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Sweatshirts' },
  { id: '519', name: 'Zavora Signature Fleece Shorts', category: 'pants', price: 99.89, img: 'assets/studio-wide-trouser.png', page: 'Shop / Pants' }
];

let currentProductSearchQuery = '';

function getAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveAdminProducts(products) {
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
}

function renderAdminProducts() {
  const list = document.querySelector('[data-admin-product-list]');
  if (!list) return;

  const removedIds = new Set(JSON.parse(localStorage.getItem('zavoraRemovedProducts') || '[]'));
  const customProducts = getAdminProducts();
  const allProducts = [...customProducts, ...ZAVORA_FULL_CATALOG].filter(p => p && p.id && !removedIds.has(String(p.id)));

  let filtered = allProducts;
  if (currentProductSearchQuery) {
    const q = currentProductSearchQuery.toLowerCase();
    filtered = filtered.filter(p => String(p.name || '').toLowerCase().includes(q) || String(p.category || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q));
  }

  const badge = document.querySelector('[data-admin-product-count]');
  if (badge) badge.textContent = `${filtered.length} Products Live`;

  if (!filtered.length) {
    list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">No products found matching criteria.</td></tr>`;
    return;
  }

  list.innerHTML = filtered.map((product) => {
    const imgSrc = product.img || product.image || 'assets/studio-wide-trouser.png';
    const idVal = product.sku || `PF-${product.id}`;
    return `
      <tr data-saved-product="${product.id}">
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${imgSrc}" alt="${product.name}" onerror="this.src='assets/studio-wide-trouser.png'" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #ddd;flex-shrink:0;">
            <div>
              <strong style="display:block;font-size:13px;color:#050505;">${product.name}</strong>
              <span style="font-size:11px;color:#777;">SKU: ${idVal}</span>
            </div>
          </div>
        </td>
        <td><span style="text-transform:capitalize;font-weight:600;color:#444;">${product.category || 'Apparel'}</span></td>
        <td><strong style="color:#2e7d32;">${money(product.price || 94.89)}</strong></td>
        <td><span style="font-size:11px;background:#f5f5f5;padding:3px 8px;border-radius:10px;border:1px solid #e0e0e0;">${product.page || 'Shop / Collection'}</span></td>
        <td><span class="pill green">Active</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="product.html?id=${encodeURIComponent(product.id)}" target="_blank" style="padding:5px 10px;font-size:12px;background:#050505;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">View on Web</a>
            <button type="button" data-remove-product="${product.id}" style="padding:5px 10px;font-size:12px;background:#d9534f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const searchInput = document.querySelector('#adminProductSearchInput');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', (e) => {
      currentProductSearchQuery = (e.target.value || '').trim().toLowerCase();
      renderAdminProducts();
    });
  }
}

function renderAdminCategories() {
  const list = document.querySelector('[data-admin-category-list]');
  if (!list) return;

  const defaultCats = [
    { name: 'Men', slug: 'men', page: 'shop.html?category=men', count: 12 },
    { name: 'Women', slug: 'women', page: 'shop.html?category=women', count: 12 },
    { name: 'Hoodies', slug: 'hoodies', page: 'shop.html?category=hoodies', count: 4 },
    { name: 'T-Shirts', slug: 'tees', page: 'shop.html?category=tees', count: 8 },
    { name: 'Pants', slug: 'pants', page: 'shop.html?category=pants', count: 4 },
    { name: 'Accessories', slug: 'accessories', page: 'shop.html?category=accessories', count: 4 },
    { name: 'Limited Edition', slug: 'limited', page: 'shop.html?category=limited', count: 6 },
    { name: 'New Arrivals', slug: 'new', page: 'index.html#new', count: 10 },
    { name: 'Best Sellers', slug: 'best', page: 'index.html#best', count: 8 }
  ];

  let customCats = [];
  try {
    customCats = JSON.parse(localStorage.getItem('zavoraAdminCategories') || '[]');
  } catch(e) {}

  const all = [...customCats, ...defaultCats];

  const badge = document.querySelector('[data-admin-category-count]');
  if (badge) badge.textContent = `${all.length} Categories Live`;

  list.innerHTML = all.map((cat, idx) => `
    <tr>
      <td><strong style="color:#050505;font-size:14px;">${cat.name}</strong><br><small style="color:#888;">slug: ${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}</small></td>
      <td><span class="pill gold">${cat.count || 6} Products</span></td>
      <td><a href="${cat.page || 'shop.html'}" target="_blank" style="color:#1976d2;font-size:12px;text-decoration:none;">${cat.page || 'shop.html'}</a></td>
      <td><span class="pill green">Active</span></td>
      <td>
        <button type="button" data-delete-category="${idx}" style="padding:4px 8px;font-size:12px;background:#d9534f;color:#fff;border:none;border-radius:4px;cursor:pointer;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminCustomers() {
  const list = document.querySelector('[data-admin-customer-list]');
  if (!list) return;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  let wishlist = [];
  try {
    wishlist = JSON.parse(localStorage.getItem('zavoraWishlist') || localStorage.getItem('zavora_wishlist') || '[]');
  } catch(e) {}

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('zavoraUser') || 'null');
  } catch(e) {}

  const customersMap = new Map();

  customersMap.set('ava@example.com', { name: 'Ava Brooks', email: 'ava@example.com', phone: '+1 (555) 321-7654', address: 'Los Angeles, CA', orderCount: 12, spent: 1420.00, wishlistItems: 6 });
  customersMap.set('noah@example.com', { name: 'Noah Stone', email: 'noah@example.com', phone: '+1 (555) 987-1234', address: 'Brooklyn, NY', orderCount: 4, spent: 480.00, wishlistItems: 2 });

  if (user && user.email) {
    customersMap.set(user.email.toLowerCase(), {
      name: user.name || 'Priya Pandey',
      email: user.email,
      phone: user.phone || '+1 (555) 234-5678',
      address: user.address || '123 USA Luxury Way, Suite 4B, New York, NY 10001',
      orderCount: 0,
      spent: 0,
      wishlistItems: wishlist.length
    });
  }

  orders.forEach((order) => {
    const emailKey = String(order.email || 'zavoraoffical@gmail.com').toLowerCase();
    const existing = customersMap.get(emailKey) || {
      name: order.customer || 'Priya Pandey',
      email: emailKey,
      phone: order.phone || '+1 (555) 234-5678',
      address: order.address || '123 USA Luxury Way, NY',
      orderCount: 0,
      spent: 0,
      wishlistItems: wishlist.length
    };
    existing.orderCount += 1;
    existing.spent += Number(order.total || 0);
    if (order.address && !order.address.includes('Standard')) existing.address = order.address;
    customersMap.set(emailKey, existing);
  });

  const customers = [...customersMap.values()];

  const totalOrdersEl = document.querySelector('[data-admin-total-customer-orders]');
  if (totalOrdersEl) totalOrdersEl.textContent = `${orders.length} Orders`;

  const wishlistEl = document.querySelector('[data-admin-total-customer-wishlist]');
  if (wishlistEl) wishlistEl.textContent = `${wishlist.length} Items`;

  list.innerHTML = customers.map((c) => `
    <tr>
      <td>
        <strong style="color:#050505;font-size:13px;display:block;">${c.name}</strong>
        <span style="font-size:12px;color:#333;">✉️ ${c.email}</span>
        ${c.phone ? `<br><span style="font-size:11px;color:#666;">📞 ${c.phone}</span>` : ''}
      </td>
      <td>
        <strong style="color:#2e7d32;font-size:13px;">${c.orderCount} Orders</strong>
        <br><span style="font-size:11px;color:#555;">Total Spent: ${money(c.spent)}</span>
      </td>
      <td><span class="pill gold">${c.wishlistItems || 0} Saved Items</span></td>
      <td><span style="font-size:11px;color:#444;max-width:200px;display:inline-block;">📍 ${c.address}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button type="button" data-admin-view-history="${c.email}" style="padding:4px 8px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;">History</button>
          <button type="button" data-toast="Customer status updated" style="padding:4px 8px;font-size:12px;background:#eee;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Block</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderAdminPayments() {
  const list = document.querySelector('[data-admin-payment-list]');
  if (!list) return;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  const totalRev = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const countEl = document.querySelector('[data-admin-payments-count]');
  if (countEl) countEl.textContent = `${orders.length} Orders`;
  const revEl = document.querySelector('[data-admin-payments-revenue]');
  if (revEl) revEl.textContent = money(totalRev);

  if (!orders.length) {
    list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">No payment transactions yet. Completed orders will appear here.</td></tr>`;
    return;
  }

  list.innerHTML = orders.map((order) => {
    const items = Array.isArray(order.items) && order.items.length
      ? order.items.map(i => `${i.name || 'Product'} (x${i.qty || 1})`).join(', ')
      : 'Zavora luxury item';
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Today';
    return `
      <tr>
        <td><strong style="color:#050505;font-size:13px;">TXN-${String(order.id).replace(/^#/, '')}</strong></td>
        <td>
          <strong style="font-size:13px;display:block;">${order.customer || 'Priya Pandey'}</strong>
          <span style="font-size:11px;color:#666;">${order.email || 'zavoraoffical@gmail.com'}</span>
        </td>
        <td><span style="font-size:12px;color:#444;max-width:240px;display:inline-block;">${items}</span></td>
        <td>
          <strong style="color:#2e7d32;font-size:13px;">${money(order.total || 0)}</strong>
          <br><span style="font-size:11px;color:#666;">${order.method || 'PayPal / Direct'}</span>
        </td>
        <td><span style="font-size:11px;color:#555;">${dateStr}</span></td>
        <td><span class="pill green">Completed</span></td>
      </tr>
    `;
  }).join('');
}

function renderAdminCoupons() {
  const list = document.querySelector('[data-admin-coupon-list]');
  if (!list) return;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  const defaultCoupons = [
    { code: 'SUMMER15', type: '15% OFF', details: 'Valid on all Summer Collection' },
    { code: 'WELCOME10', type: '$10 OFF', details: 'First Order Only (Min $49)' },
    { code: 'WEEKEND20', type: '20% OFF', details: 'Friday–Sunday Only' },
    { code: 'FREESHIP', type: 'Free Shipping', details: 'Free USA Shipping (Min $75)' },
    { code: 'PREMIUM25', type: '$25 OFF', details: 'Minimum Order $150' },
    { code: 'LAUNCH20', type: '20% OFF', details: 'First 100 Customers Only' }
  ];

  let customCoupons = [];
  try {
    customCoupons = JSON.parse(localStorage.getItem('zavoraAdminCoupons') || '[]');
  } catch(e) {}

  const all = [...customCoupons, ...defaultCoupons];

  const badge = document.querySelector('[data-admin-coupons-count]');
  if (badge) badge.textContent = `${all.length} Active Coupons`;

  list.innerHTML = all.map((c) => {
    const codeUpper = String(c.code).toUpperCase();
    const matchingOrders = orders.filter(o => o.coupon && String(o.coupon).toUpperCase() === codeUpper);
    const usageCount = matchingOrders.length;
    const usersStr = usageCount > 0 ? matchingOrders.map(o => o.email).join(', ') : 'No uses yet';
    const totalDiscountVal = matchingOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

    return `
      <tr>
        <td>
          <strong style="color:#050505;font-size:14px;letter-spacing:0.05em;">${c.code}</strong>
          <br><span style="font-size:11px;background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-weight:600;">${c.type}</span>
        </td>
        <td><span style="font-size:12px;color:#555;">${c.details || 'Store Promo'}</span></td>
        <td><strong style="color:#050505;font-size:13px;">${usageCount} Uses</strong></td>
        <td><span style="font-size:11px;color:#666;max-width:220px;display:inline-block;">${usersStr}</span></td>
        <td><strong style="color:#2e7d32;font-size:13px;">${money(totalDiscountVal)}</strong></td>
        <td><span class="pill green">Active</span></td>
      </tr>
    `;
  }).join('');
}

function renderAdminWishlist() {
  const list = document.querySelector('[data-admin-wishlist-list]');
  if (!list) return;

  let wishlist = [];
  try {
    wishlist = JSON.parse(localStorage.getItem('zavoraWishlist') || localStorage.getItem('zavora_wishlist') || '[]');
  } catch(e) {}

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('zavoraUser') || 'null');
  } catch(e) {}

  const itemsEl = document.querySelector('[data-admin-wishlist-total-items]');
  if (itemsEl) itemsEl.textContent = `${wishlist.length} Saved Items`;

  const totalVal = wishlist.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const valEl = document.querySelector('[data-admin-wishlist-total-value]');
  if (valEl) valEl.textContent = money(totalVal);

  if (!wishlist.length) {
    list.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:#666;">No customer wishlist items saved yet. Products saved by customers will appear here in real-time.</td></tr>`;
    return;
  }

  list.innerHTML = wishlist.map((item) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${item.img || item.image || 'assets/studio-wide-trouser.png'}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'" style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #ddd;">
          <div>
            <strong style="font-size:13px;color:#050505;display:block;">${item.name || 'Zavora Item'}</strong>
            <span style="font-size:11px;color:#888;">ID: ${item.id || 'PF-638'}</span>
          </div>
        </div>
      </td>
      <td><strong style="color:#2e7d32;font-size:13px;">${money(item.price || 0)}</strong></td>
      <td><strong style="font-size:12px;color:#050505;">${user?.name || 'Customer'}</strong></td>
      <td><span style="font-size:12px;color:#555;">✉️ ${user?.email || 'customer@zavorafashion.com'}</span></td>
      <td>
        <a href="product.html?id=${encodeURIComponent(item.id || '638')}" target="_blank" style="padding:4px 8px;font-size:12px;background:#050505;color:#fff;text-decoration:none;border-radius:4px;">View</a>
      </td>
    </tr>
  `).join('');
}

function renderAdminNotifications() {
  const list = document.querySelector('[data-admin-notifications-list]');
  if (!list) return;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  let returnRequests = [];
  try {
    returnRequests = JSON.parse(localStorage.getItem('zavoraReturnRequests') || '[]');
  } catch(e) {}

  const seen = new Set();
  orders = orders.filter(o => o && o.id && !seen.has(String(o.id)) && seen.add(String(o.id)));

  const badgeNewOrders = document.querySelector('[data-admin-notif-new-orders]');
  if (badgeNewOrders) badgeNewOrders.textContent = `${orders.length} Orders`;

  const returnBadge = document.querySelector('[data-admin-notif-returns]');
  if (returnBadge) returnBadge.textContent = `${returnRequests.length} Requests`;

  const allEvents = [];

  returnRequests.forEach((req) => {
    allEvents.push({
      type: 'Return Request',
      title: `Return Request #${req.id} (Order #${req.orderId})`,
      badge: 'gold',
      customer: req.name,
      email: req.email,
      detail: `Reason: ${req.reason} | Desc: ${req.description} | 📸 ${req.photosCount || 0} Photos | 🎥 ${req.videoName || 'No video'}`,
      date: req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Just now',
      action: 'Approve Return Label'
    });
  });

  orders.forEach((order) => {
    const isCancelled = String(order.status || '').toLowerCase().includes('cancel');
    allEvents.push({
      type: isCancelled ? 'Cancellation Request' : 'New Order',
      title: isCancelled ? `Order #${order.id} Cancelled by Customer` : `Order #${order.id} Placed`,
      badge: isCancelled ? 'red' : 'green',
      customer: order.customer || 'Customer',
      email: order.email || '',
      detail: `Total Amount: ${money(order.total || 0)} (${order.status || 'Paid'})`,
      date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now',
      action: isCancelled ? 'Process Refund' : 'Process Order'
    });
  });

  if (!allEvents.length) {
    list.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:#666;">No store notifications yet. New checkout orders and return requests will log here in real-time.</td></tr>`;
    return;
  }

  list.innerHTML = allEvents.map((n) => `
    <tr>
      <td>
        <strong style="font-size:13px;color:#050505;display:block;">${n.title}</strong>
        <span class="pill ${n.badge}">${n.type}</span>
      </td>
      <td>
        <strong style="font-size:12px;color:#333;">${n.customer}</strong>
        <br><span style="font-size:11px;color:#666;">✉️ ${n.email}</span>
      </td>
      <td><span style="font-size:12px;color:#444;max-width:320px;display:inline-block;">${n.detail}</span></td>
      <td><span style="font-size:11px;color:#555;">${n.date}</span></td>
      <td>
        <button type="button" data-toast="Notification resolved: ${n.type}" style="padding:4px 8px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;">${n.action}</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminReports() {
  const reportsList = document.querySelector('[data-admin-reports-list]');
  const supportList = document.querySelector('[data-admin-support-list]');

  let reports = [];
  try {
    reports = JSON.parse(localStorage.getItem('zavoraIssueReports') || '[]');
  } catch(e) {}

  let support = [];
  try {
    support = JSON.parse(localStorage.getItem('zavoraSupportMessages') || '[]');
  } catch(e) {}

  const reportsTotalEl = document.querySelector('[data-admin-reports-total-count]');
  if (reportsTotalEl) reportsTotalEl.textContent = `${reports.length} Reports`;

  const supportTotalEl = document.querySelector('[data-admin-support-total-count]');
  if (supportTotalEl) supportTotalEl.textContent = `${support.length} Messages`;

  if (reportsList) {
    if (!reports.length) {
      reportsList.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">No issue reports submitted yet. User reports from /report-issue will log here in real-time.</td></tr>`;
    } else {
      reportsList.innerHTML = reports.map((r) => `
        <tr>
          <td>
            <strong style="color:#050505;font-size:13px;display:block;">#${r.id}</strong>
            <span class="pill gold">${r.category || 'Website issue'}</span>
          </td>
          <td>
            <strong style="font-size:13px;color:#050505;">${r.name}</strong>
            <br><span style="font-size:12px;color:#1976d2;">✉️ ${r.email}</span>
          </td>
          <td><strong style="color:#333;font-size:13px;">${r.orderId || 'N/A'}</strong></td>
          <td><span style="font-size:12px;color:#444;max-width:300px;display:inline-block;">${r.description}</span></td>
          <td><span style="font-size:11px;color:#666;">${r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Just now'}</span></td>
          <td>
            <button type="button" data-toast="Issue #${r.id} marked resolved" style="padding:4px 8px;font-size:12px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;">Resolve</button>
          </td>
        </tr>
      `).join('');
    }
  }

  if (supportList) {
    if (!support.length) {
      supportList.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:#666;">No support contact messages in inbox. Messages from /contact will appear here in real-time.</td></tr>`;
    } else {
      supportList.innerHTML = support.map((m) => `
        <tr>
          <td>
            <strong style="color:#050505;font-size:13px;">${m.name || 'Visitor'}</strong>
            <br><span style="font-size:12px;color:#1976d2;">✉️ ${m.email}</span>
          </td>
          <td><span class="pill green">${m.topic || 'General Support'}</span></td>
          <td><span style="font-size:12px;color:#444;max-width:300px;display:inline-block;">${m.message || m.description}</span></td>
          <td><span style="font-size:11px;color:#666;">${m.createdAt ? new Date(m.createdAt).toLocaleString() : 'Just now'}</span></td>
          <td>
            <button type="button" data-toast="Reply email drafted for ${m.email}" style="padding:4px 8px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;">Reply</button>
          </td>
        </tr>
      `).join('');
    }
  }
}

function renderAdminShipping() {
  const form = document.querySelector('[data-admin-shipping-form]');
  if (!form) return;
  try {
    const rules = JSON.parse(localStorage.getItem('zavoraShippingRules') || 'null');
    if (rules) {
      if (rules.freeShippingMin && form.querySelector('[name="freeShippingMin"]')) form.querySelector('[name="freeShippingMin"]').value = rules.freeShippingMin;
      if (rules.standardRate && form.querySelector('[name="standardRate"]')) form.querySelector('[name="standardRate"]').value = rules.standardRate;
      if (rules.expressRate && form.querySelector('[name="expressRate"]')) form.querySelector('[name="expressRate"]').value = rules.expressRate;
      if (rules.deliveryEstimate && form.querySelector('[name="deliveryEstimate"]')) form.querySelector('[name="deliveryEstimate"]').value = rules.deliveryEstimate;
    }
  } catch(e) {}
}

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function setStatCards(stats) {
  const cards = document.querySelectorAll('[data-panel="dashboard"] .stat-card');

  let orders = Array.isArray(stats?.orders) ? stats.orders : [];
  try {
    const local = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) local.unshift(last);
    orders = [...orders, ...local];
  } catch(e) {}

  const seen = new Set();
  orders = orders.filter(o => o && o.id && !seen.has(String(o.id)) && seen.add(String(o.id)));

  const realRev = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const uniqueEmails = new Set(orders.map(o => String(o.email || '').toLowerCase()).filter(Boolean));

  if (cards[0]) {
    cards[0].querySelector('strong').textContent = money(realRev);
    cards[0].querySelector('small').textContent = `${orders.length} total live orders`;
  }
  if (cards[1]) {
    cards[1].querySelector('span').textContent = "Today's Orders";
    cards[1].querySelector('strong').textContent = `${orders.length} Orders`;
    cards[1].querySelector('small').textContent = 'Real-time order queue';
  }
  if (cards[2]) {
    cards[2].querySelector('span').textContent = 'Total Customers';
    cards[2].querySelector('strong').textContent = `${uniqueEmails.size} Accounts`;
    cards[2].querySelector('small').textContent = 'Real customer database';
  }
  if (cards[3]) {
    cards[3].querySelector('strong').textContent = '0 Items';
    cards[3].querySelector('small').textContent = 'Limited stock watch';
  }
}

function renderAdminEmails() {
  const list = document.querySelector('[data-admin-email-list]');
  if (!list) return;

  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('zavoraUser') || 'null');
  } catch(e) {}

  const contactsMap = new Map();

  if (user && user.email) {
    contactsMap.set(user.email.toLowerCase(), {
      name: user.name || 'Account User',
      email: user.email,
      phone: user.phone || 'N/A',
      orders: 0,
      status: 'Registered User'
    });
  }

  orders.forEach((o) => {
    const emailKey = String(o.email || '').toLowerCase();
    if (!emailKey) return;
    const existing = contactsMap.get(emailKey) || {
      name: o.customer || o.name || 'Buyer',
      email: emailKey,
      phone: o.phone || 'N/A',
      orders: 0,
      status: 'Verified Buyer'
    };
    existing.orders += 1;
    if (o.phone && o.phone !== 'N/A') existing.phone = o.phone;
    contactsMap.set(emailKey, existing);
  });

  const contacts = [...contactsMap.values()];

  const totalEmailEl = document.querySelector('[data-admin-email-total-count]');
  if (totalEmailEl) totalEmailEl.textContent = `${contacts.length} Accounts`;

  const totalPhoneEl = document.querySelector('[data-admin-phone-total-count]');
  if (totalPhoneEl) totalPhoneEl.textContent = `${contacts.length} Mobile Numbers`;

  if (!contacts.length) {
    list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">No customer email contacts yet. New registered buyers will appear here in real-time.</td></tr>`;
    return;
  }

  list.innerHTML = contacts.map((c) => `
    <tr>
      <td><strong style="color:#050505;font-size:14px;">${c.name}</strong></td>
      <td><strong style="color:#1976d2;font-size:13px;">✉️ ${c.email}</strong></td>
      <td><span style="font-size:12px;color:#333;font-weight:600;">📞 ${c.phone}</span></td>
      <td><span class="pill gold">${c.orders} Orders Placed</span></td>
      <td><span class="pill green">${c.status}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button type="button" data-toast="Email template sent to ${c.email}" style="padding:4px 8px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;">Send Email</button>
          <button type="button" data-toast="OTP verification sent to ${c.phone}" style="padding:4px 8px;font-size:12px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;">Send OTP</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderRewardClaims(claims = []) {
  const target = document.querySelector('[data-reward-claims]');
  if (!target) return;
  if (!claims.length) {
    target.innerHTML = '<p>No reward claims yet.</p>';
    return;
  }
  target.innerHTML = claims.slice(0, 8).map((claim) => `
    <p>
      <span>${claim.name || 'Zavora customer'}<br><small>${claim.email || ''}</small></span>
      <strong>${claim.rewardId || ''}<br><small>${claim.status || 'pending'} / payout ${money(claim.amount || 10)}</small></strong>
    </p>
  `).join('');
}

function renderLiveTopProducts(products = []) {
  const rank = document.querySelector('.product-rank');
  if (!rank || !products.length) return;
  rank.innerHTML = products.slice(0, 6).map((product) => `
    <p><span>${product.name}</span><strong>${product.sold} sold</strong></p>
  `).join('');
}

function renderLiveProductRows(products = []) {
  const list = document.querySelector('[data-admin-product-list]');
  if (!list || !products.length) return;
  list.innerHTML = products.slice(0, 24).map((product) => `
    <tr data-saved-product="${product.id}">
      <td>${product.name}<br><span>PF-${product.id}</span></td>
      <td>${product.category}</td>
      <td>Live</td>
      <td><span class="pill green">Active</span></td>
      <td><button data-toast="Product detail synced">Synced</button></td>
    </tr>
  `).join('');
}

let currentOrderSearchQuery = '';
let currentOrderStatusFilter = 'all';

function renderLiveOrders(stats) {
  const body = document.querySelector('[data-panel="orders"] tbody');
  if (!body) return;

  const statusTabs = document.querySelector('[data-panel="orders"] .status-tabs');
  if (statusTabs && !statusTabs.dataset.bound) {
    statusTabs.dataset.bound = 'true';
    statusTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      statusTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = (btn.dataset.statusFilter || btn.textContent).trim().toLowerCase();
      currentOrderStatusFilter = val === 'all orders' ? 'all' : val;
      renderLiveOrders(stats);
    });
  }

  let searchInput = document.querySelector('#adminOrderSearchInput');
  if (!searchInput) {
    const cardHead = document.querySelector('[data-panel="orders"] .card-head');
    if (cardHead) {
      const searchWrap = document.createElement('div');
      searchWrap.className = 'admin-order-search-wrap';
      searchWrap.style.margin = '12px 0 16px 0';
      searchWrap.innerHTML = `
        <input id="adminOrderSearchInput" type="search" placeholder="🔍 Search by Order ID (#ZVR-861988), Customer Name, Email, Phone, Address, or Item Name..." style="width:100%;padding:10px 14px;border-radius:6px;border:1px solid #ccc;font-size:14px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.05);">
      `;
      cardHead.insertAdjacentElement('afterend', searchWrap);
      searchInput = document.querySelector('#adminOrderSearchInput');
    }
  }

  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = 'true';
    searchInput.addEventListener('input', (e) => {
      currentOrderSearchQuery = (e.target.value || '').trim().toLowerCase();
      renderLiveOrders(stats);
    });
  }

  let serverOrders = Array.isArray(stats?.orders) ? stats.orders : [];
  let localOrders = [];
  try {
    localOrders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
  } catch (e) {}

  try {
    const lastOrder = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (lastOrder && lastOrder.id) {
      localOrders.unshift(lastOrder);
    }
  } catch (e) {}

  const seen = new Set();
  let allOrders = [...serverOrders, ...localOrders].filter((order) => {
    if (!order || !order.id) return false;
    const idStr = String(order.id).trim();
    if (seen.has(idStr)) return false;
    seen.add(idStr);
    return true;
  });

  if (!allOrders.length) {
    allOrders = [
      {
        id: '#ZVR-861988',
        customer: 'Priya Pandey',
        email: 'zavoraoffical@gmail.com',
        phone: '+1 (555) 234-5678',
        address: '123 USA Luxury Way, Suite 4B, New York, NY 10001',
        total: 204.77,
        status: 'Packing',
        tracking: 'ZV-861988',
        method: 'PayPal Paid',
        createdAt: '2026-07-24T12:42:00.000Z',
        items: [
          { name: 'Zavora Dad Hat', qty: 1, price: 94.89, color: 'Black', size: 'M', img: 'assets/studio-wide-trouser.png' },
          { name: 'Zavora Oversized Hoodie', qty: 1, price: 109.88, color: 'Oatmeal', size: 'L', img: 'assets/studio-wide-trouser.png' }
        ]
      },
      {
        id: '#ZVR-737160',
        customer: 'Ava Brooks',
        email: 'ava@example.com',
        phone: '+1 (555) 321-7654',
        address: '845 Wilshire Blvd, Suite 1200, Los Angeles, CA 90017',
        total: 169.89,
        status: 'Shipped',
        tracking: 'ZV-737160',
        method: 'PayPal Paid',
        createdAt: '2026-07-23T22:42:00.000Z',
        items: [
          { name: 'Zavora Studio Wide-Leg Trouser', qty: 1, price: 169.89, color: 'Beige', size: 'S', img: 'assets/studio-wide-trouser.png' }
        ]
      }
    ];
  }

  // 1. Filter by Status Tab selection
  if (currentOrderStatusFilter && currentOrderStatusFilter !== 'all') {
    const f = currentOrderStatusFilter.toLowerCase();
    allOrders = allOrders.filter((order) => {
      const st = String(order.status || 'Paid').toLowerCase();
      if (f === 'pending' || f === 'paid') {
        return st.includes('paid') || st.includes('pending') || st.includes('confirm');
      }
      if (f === 'processing') return st.includes('process');
      if (f === 'packed') return st.includes('pack');
      if (f === 'shipped') return st.includes('ship');
      if (f === 'delivered') return st.includes('deliver');
      if (f === 'cancelled') return st.includes('cancel');
      if (f === 'returned') return st.includes('return');
      if (f === 'refunded') return st.includes('refund');
      return st === f;
    });
  }

  // 2. Filter by Search input query
  if (currentOrderSearchQuery) {
    const q = currentOrderSearchQuery;
    allOrders = allOrders.filter((order) => {
      const idMatch = String(order.id || '').toLowerCase().includes(q);
      const nameMatch = String(order.customer || order.name || '').toLowerCase().includes(q);
      const emailMatch = String(order.email || '').toLowerCase().includes(q);
      const phoneMatch = String(order.phone || '').toLowerCase().includes(q);
      const addressMatch = String(order.address || '').toLowerCase().includes(q);
      const trackingMatch = String(order.tracking || '').toLowerCase().includes(q);
      const itemsMatch = Array.isArray(order.items) && order.items.some(i => String(i.name || '').toLowerCase().includes(q));
      return idMatch || nameMatch || emailMatch || phoneMatch || addressMatch || trackingMatch || itemsMatch;
    });
  }

  if (!allOrders.length) {
    const msg = currentOrderSearchQuery
      ? `No orders found matching "${currentOrderSearchQuery}".`
      : (currentOrderStatusFilter !== 'all' ? `No orders found with status "${currentOrderStatusFilter}".` : 'No live orders yet. New checkout orders will appear here automatically.');
    body.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">${msg}</td></tr>`;
    return;
  }

  body.innerHTML = allOrders.map((order) => {
    const items = Array.isArray(order.items) && order.items.length ? order.items : [];
    const itemCount = items.reduce((sum, i) => sum + Number(i.qty || 1), 0);
    const totalVal = typeof order.total === 'number' ? `$${order.total.toFixed(2)}` : (order.total || '$0.00');

    const itemThumbnails = items.length ? items.map((item) => {
      const imgSrc = item.img || item.image || 'assets/studio-wide-trouser.png';
      return `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <img src="${imgSrc}" alt="${item.name}" onerror="this.src='assets/studio-wide-trouser.png'" style="width:42px;height:42px;object-fit:cover;border-radius:4px;border:1px solid #ddd;flex-shrink:0;">
          <div>
            <strong style="display:block;font-size:12px;line-height:1.2;color:#050505;">${item.name || 'Product'}</strong>
            <span style="font-size:11px;color:#666;">Qty ${item.qty || 1} • ${item.color || 'Original'} / ${item.sizes?.[0] || item.size || 'M'}</span>
          </div>
        </div>
      `;
    }).join('') : `<span style="font-size:12px;">${order.item || 'Zavora item'}</span>`;

    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }) : 'Today';

    const isCancelled = String(order.status || '').toLowerCase().includes('cancel');

    return `
      <tr data-admin-order="${order.id}">
        <td>
          <strong style="font-size:13px;display:block;color:#050505;">#${String(order.id).replace(/^#/, '')}</strong>
          <span style="font-size:11px;color:#777;">${formattedDate}</span>
        </td>
        <td>
          <strong style="font-size:13px;display:block;color:#050505;">${order.customer || 'Zavora Customer'}</strong>
          <div style="font-size:12px;color:#333;margin-top:2px;">✉️ ${order.email || 'N/A'}</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">📞 ${order.phone || '+1 (555) 234-5678'}</div>
          <div style="font-size:11px;color:#666;margin-top:2px;max-width:240px;line-height:1.3;">📍 ${order.address && !order.address.includes('Standard') ? order.address : (order.address || '123 USA Luxury Way, Suite 4B, New York, NY 10001')}</div>
        </td>
        <td>
          <div style="max-height:130px;overflow-y:auto;padding-right:4px;">
            ${itemThumbnails}
          </div>
          <span style="font-size:11px;font-weight:600;background:#eee;padding:2px 6px;border-radius:10px;display:inline-block;margin-top:4px;">Total Items: ${itemCount || 1}</span>
        </td>
        <td>
          <strong style="font-size:14px;color:${isCancelled ? '#c62828' : '#2e7d32'};display:block;">${totalVal}</strong>
          <span style="font-size:11px;color:#666;">${order.payment || order.method || 'PayPal / Direct'}</span>
        </td>
        <td>
          ${isCancelled ? `
            <span class="pill red" style="display:inline-block;padding:6px 12px;background:#ffebee;color:#c62828;font-weight:700;border-radius:4px;font-size:12px;">Cancelled by Customer</span>
          ` : `
            <select data-order-status style="padding:5px;font-size:12px;width:100%;border-radius:4px;border:1px solid #ccc;">
              ${['Paid', 'Order confirmed', 'Packing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].map((status) => `<option ${String(order.status || '').toLowerCase().includes(status.toLowerCase()) ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
            <input data-order-tracking value="${order.tracking || ''}" placeholder="Tracking number" style="margin-top:4px;width:100%;font-size:11px;padding:4px;border-radius:4px;border:1px solid #ccc;">
          `}
        </td>
        <td>
          ${isCancelled ? `
            <button disabled style="padding:6px 12px;font-size:12px;background:#eee;color:#888;border:1px solid #ddd;border-radius:4px;cursor:not-allowed;">Order Cancelled</button>
          ` : `
            <button data-save-order="${order.id}" style="padding:6px 12px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;">Save Update</button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

async function refreshLiveAdminDashboard() {
  let stats = { orders: [] };
  try {
    const response = await fetch('/api/admin?action=stats');
    const data = await response.json();
    if (response.ok && data.ok) stats = data;
  } catch (error) {}

  setStatCards(stats);
  renderLiveTopProducts(stats.topProducts || []);
  renderLiveProductRows(stats.topProducts || []);
  renderLiveOrders(stats);
  renderRewardClaims(stats.rewardClaims || []);
  const bell = document.querySelector('.admin-icon-btn');
  if (bell) bell.textContent = `Live ${stats.products || 0}`;
}

function addAdminProduct(form) {
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const price = Number(String(data.get('price') || '').replace(/[^0-9.]/g, ''));
  if (!name || !price) {
    toast('Add product name and price first');
    return;
  }
  const category = String(data.get('category') || 'women').toLowerCase();
  const product = {
    id: Date.now(),
    name,
    sku: String(data.get('sku') || `ZAV-${Date.now()}`).trim(),
    category,
    color: 'black',
    size: 'M',
    price,
    image: DEFAULT_PRODUCT_IMAGE,
    badge: String(data.get('collection') || 'new').replace(/^\w/, (letter) => letter.toUpperCase()),
    description: String(data.get('description') || '').trim()
  };
  const products = getAdminProducts().filter((item) => item.id !== product.id);
  products.unshift(product);
  saveAdminProducts(products);
  renderAdminProducts();
  form.reset();
  const sku = form.querySelector('[name="sku"]');
  if (sku) sku.value = `ZAV-2026-${String(products.length + 1).padStart(3, '0')}`;
  toast('Product added to live preview');
}

async function importPrintfulProducts() {
  try {
    toast('Importing Printful catalog and collection products...');
    const response = await fetch('/api/admin?action=auto-import-printful&pages=9&limit=60&collections=true&collectionPages=2');
    const data = await response.json();
    if (!response.ok && response.status !== 207) {
      toast(data.error || 'Printful import failed');
      return;
    }
    await refreshLiveAdminDashboard();
    toast(`${data.importedCount || 0} Printful catalog and collection products imported`);
  } catch (error) {
    toast('Printful import failed');
  }
}

function setImportStatus(rows = []) {
  const target = document.querySelector('[data-import-status]');
  if (!target) return;
  target.innerHTML = rows.map((row) => `<p><span>${row[0]}</span><strong>${row[1]}</strong></p>`).join('');
}

async function importPrintfulUrl(form) {
  const data = new FormData(form);
  const url = String(data.get('url') || '').trim();
  const gender = String(data.get('gender') || 'all');
  const mode = String(data.get('mode') || 'auto');
  const pages = Math.max(1, Math.min(Number(data.get('pages') || 6), 10));
  const limit = Math.max(12, Math.min(Number(data.get('limit') || 60), 60));
  if (!url) {
    toast('Paste a Printful URL first');
    return;
  }
  const button = form.querySelector('[type="submit"]');
  if (button) button.textContent = 'Importing...';
  setImportStatus([
    ['Status', 'Import running'],
    ['URL Type', mode],
    ['Pages', String(pages)]
  ]);
  try {
    const params = new URLSearchParams({ url, gender, mode, pages: String(pages), limit: String(limit) });
    const response = await fetch(`/api/admin?action=auto-import-printful&${params.toString()}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 207) {
      throw new Error(result.error || 'Import failed');
    }
    const importedCount = result.importedCount || 0;
    const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
    setImportStatus([
      ['Status', errorCount ? 'Completed with warnings' : 'Completed'],
      ['Imported', `${importedCount} products`],
      ['Duplicates', 'Skipped automatically'],
      ['Storage', result.storage || 'MongoDB + Supabase']
    ]);
    await refreshLiveAdminDashboard();
    toast(`${importedCount} products imported`);
  } catch (error) {
    setImportStatus([
      ['Status', 'Import failed'],
      ['Reason', error.message || 'Unknown error']
    ]);
    toast(error.message || 'Import failed');
  } finally {
    if (button) button.textContent = 'Import Products';
  }
}

document.addEventListener('click', async (event) => {
  if (event.target.closest('.logout-btn')) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = '/api/admin?action=logout';
    return;
  }

  const nav = event.target.closest('[data-section]');
  if (nav) {
    setSection(nav.dataset.section);
    return;
  }

  const jump = event.target.closest('[data-section-jump]');
  if (jump) {
    setSection(jump.dataset.sectionJump);
    return;
  }

  const sidebarToggle = event.target.closest('[data-toggle-sidebar]');
  if (sidebarToggle) {
    document.querySelector('[data-sidebar]')?.classList.toggle('open');
    return;
  }

  const action = event.target.closest('[data-toast]');
  if (action) {
    toast(action.dataset.toast);
  }

  const printfulImport = event.target.closest('[data-import-printful]');
  if (printfulImport) {
    importPrintfulProducts();
    return;
  }

  const affiliateAction = event.target.closest('[data-affiliate-action]');
  if (affiliateAction) {
    const id = affiliateAction.dataset.affiliateTarget;
    const actionName = affiliateAction.dataset.affiliateAction;
    if (actionName === 'delete') {
      saveAffiliates(readAffiliates().filter((app) => String(app.id) !== String(id)));
      await deleteAffiliateFromServer(id);
      await renderAffiliatesPanel();
      toast('Affiliate deleted');
      return;
    }
    const updated = await updateAffiliate(id, (app) => {
      if (actionName === 'approve') {
        app.status = 'approved';
        app.affiliateId = affiliateId(app);
        app.password = app.password || affiliatePassword();
        app.commission = Number(app.commission || 10);
        app.coupon = app.coupon || affiliateCoupon(app.affiliateId);
        app.link = app.link || `https://www.zavorafashion.com/?ref=${encodeURIComponent(app.affiliateId)}`;
        app.approvedAt = new Date().toISOString();
      }
      if (actionName === 'reset-login') {
        app.status = 'approved';
        app.affiliateId = affiliateId(app);
        app.password = affiliatePassword();
        app.commission = Number(app.commission || 10);
        app.coupon = app.coupon || affiliateCoupon(app.affiliateId);
        app.link = app.link || `https://www.zavorafashion.com/?ref=${encodeURIComponent(app.affiliateId)}`;
        app.loginUpdatedAt = new Date().toISOString();
      }
      if (actionName === 'reject') app.status = 'rejected';
      if (actionName === 'suspend') app.status = 'suspended';
      return app;
    });
    if (actionName === 'copy-email' && updated) {
      navigator.clipboard?.writeText(approvalEmail(updated));
      toast('Approval email copied');
      return;
    }
    if (actionName === 'approve' && updated) {
      try {
        await sendAffiliateApprovalEmail(updated);
        toast('Affiliate approved and welcome email sent');
      } catch (error) {
        navigator.clipboard?.writeText(approvalEmail(updated));
        toast('Approved. Email failed, approval email copied');
      }
      return;
    }
    if (actionName === 'reset-login' && updated) {
      try {
        await sendAffiliateApprovalEmail(updated);
        toast('Fresh affiliate login sent');
      } catch (error) {
        navigator.clipboard?.writeText(approvalEmail(updated));
        toast('Fresh login copied. Email failed');
      }
      return;
    }
    toast(`Affiliate ${actionName}ed`);
    return;
  }

  if (event.target.closest('[data-affiliate-export]')) {
    exportAffiliates();
    toast('Affiliate CSV exported');
    return;
  }

  const saveOrder = event.target.closest('[data-save-order]');
  if (saveOrder) {
    const row = saveOrder.closest('[data-admin-order]');
    const id = saveOrder.dataset.saveOrder;
    const status = row?.querySelector('[data-order-status]')?.value || 'Order confirmed';
    const tracking = row?.querySelector('[data-order-tracking]')?.value.trim() || '';

    saveOrder.textContent = 'Saving...';
    saveOrder.disabled = true;

    try {
      let orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
      orders = orders.map((ord) => {
        if (String(ord.id).toLowerCase().replace(/^#/, '') === String(id).toLowerCase().replace(/^#/, '')) {
          ord.status = status;
          if (tracking) ord.tracking = tracking;
        }
        return ord;
      });
      localStorage.setItem('zavoraOrders', JSON.stringify(orders));

      const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
      if (last && String(last.id).toLowerCase().replace(/^#/, '') === String(id).toLowerCase().replace(/^#/, '')) {
        last.status = status;
        if (tracking) last.tracking = tracking;
        localStorage.setItem('zavoraLastOrder', JSON.stringify(last));
      }
    } catch (e) {}

    await fetch('/api/admin?action=orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: id,
        status,
        tracking
      })
    }).catch(() => null);

    saveOrder.textContent = '✓ Saved';
    saveOrder.style.background = '#2e7d32';
    toast(`Order #${id} updated: ${status}`);

    setTimeout(() => {
      saveOrder.textContent = 'Save Update';
      saveOrder.style.background = '#050505';
      saveOrder.disabled = false;
    }, 2000);
    return;
  }

  const skuButton = event.target.closest('[data-generate-sku]');
  if (skuButton) {
    const sku = skuButton.closest('form')?.querySelector('[name="sku"]');
    if (sku) sku.value = `ZAV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    toast('SKU generated');
    return;
  }

  const remove = event.target.closest('[data-remove-product]');
  if (remove) {
    saveAdminProducts(getAdminProducts().filter((product) => String(product.id) !== remove.dataset.removeProduct));
    const id = String(remove.dataset.removeProduct);
    const removedIds = JSON.parse(localStorage.getItem('zavoraRemovedProducts') || '[]');
    if (!removedIds.includes(id)) removedIds.push(id);
    localStorage.setItem('zavoraRemovedProducts', JSON.stringify(removedIds));
    saveAdminProducts(getAdminProducts().filter((p) => String(p.id) !== id));
    renderAdminProducts();
    toast('Product removed from store catalog');
    return;
  }

  const deleteCat = event.target.closest('[data-delete-category]');
  if (deleteCat) {
    const idx = Number(deleteCat.dataset.deleteCategory);
    try {
      let customCats = JSON.parse(localStorage.getItem('zavoraAdminCategories') || '[]');
      customCats.splice(idx, 1);
      localStorage.setItem('zavoraAdminCategories', JSON.stringify(customCats));
    } catch(e) {}
    renderAdminCategories();
    toast('Category removed');
    return;
  }

  const historyBtn = event.target.closest('[data-admin-view-history]');
  if (historyBtn) {
    const email = historyBtn.dataset.adminViewHistory;
    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    } catch(e) {}
    const userOrders = orders.filter(o => String(o.email).toLowerCase() === email.toLowerCase());
    if (userOrders.length) {
      const summary = userOrders.map(o => `• Order #${o.id}: Total ${money(o.total)} (${o.status})`).join('\n');
      alert(`Customer ${email} Order History:\n\n${summary}`);
    } else {
      alert(`Customer ${email} has placed 1 order via checkout flow.`);
    }
    return;
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-admin-product-form]');
  const importer = event.target.closest('[data-printful-url-import]');
  const catForm = event.target.closest('[data-admin-category-form]');
  const shippingForm = event.target.closest('[data-admin-shipping-form]');
  const couponForm = event.target.closest('[data-admin-coupon-form]');

  if (form) {
    event.preventDefault();
    addAdminProduct(form);
    return;
  }
  if (importer) {
    event.preventDefault();
    importPrintfulUrl(importer);
    return;
  }
  if (couponForm) {
    event.preventDefault();
    const code = couponForm.querySelector('[name="code"]')?.value.trim().toUpperCase();
    const type = couponForm.querySelector('[name="type"]')?.value;
    const value = couponForm.querySelector('[name="value"]')?.value.trim();
    const minOrder = couponForm.querySelector('[name="minOrder"]')?.value.trim() || '0';
    if (code && value) {
      let customCoupons = JSON.parse(localStorage.getItem('zavoraAdminCoupons') || '[]');
      const typeStr = type === 'percent' ? `${value}% OFF` : (type === 'shipping' ? 'Free Shipping' : `$${value} OFF`);
      customCoupons.unshift({ code, type: typeStr, details: `Min Order $${minOrder}`, usage: 0, users: 'New Code', totalDiscount: 0, status: 'Active' });
      localStorage.setItem('zavoraAdminCoupons', JSON.stringify(customCoupons));
      couponForm.reset();
      renderAdminCoupons();
      toast(`Coupon "${code}" activated!`);
    }
    return;
  }
  if (catForm) {
    event.preventDefault();
    const name = catForm.querySelector('[name="name"]')?.value.trim();
    const slug = catForm.querySelector('[name="slug"]')?.value.trim() || (name ? name.toLowerCase().replace(/\s+/g, '-') : 'cat');
    const page = catForm.querySelector('[name="page"]')?.value;
    if (name) {
      let customCats = JSON.parse(localStorage.getItem('zavoraAdminCategories') || '[]');
      customCats.unshift({ name, slug, page, count: 0 });
      localStorage.setItem('zavoraAdminCategories', JSON.stringify(customCats));
      catForm.reset();
      renderAdminCategories();
      toast(`Category "${name}" created successfully!`);
    }
    return;
  }
  if (shippingForm) {
    event.preventDefault();
    const min = shippingForm.querySelector('[name="freeShippingMin"]')?.value;
    const std = shippingForm.querySelector('[name="standardRate"]')?.value;
    const exp = shippingForm.querySelector('[name="expressRate"]')?.value;
    const est = shippingForm.querySelector('[name="deliveryEstimate"]')?.value;
    localStorage.setItem('zavoraShippingRules', JSON.stringify({ freeShippingMin: min, standardRate: std, expressRate: exp, deliveryEstimate: est }));
    toast('✓ Shipping rules & delivery times updated!');
    return;
  }
});

document.addEventListener('input', (event) => {
  if (event.target?.matches?.('[data-affiliate-search]')) {
    renderAffiliatesPanel();
    return;
  }
  if (event.target?.id !== 'adminSearch') return;
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.admin-section.active .admin-card, .admin-section.active tbody tr').forEach((item) => {
    item.style.display = !query || item.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});

document.addEventListener('change', (event) => {
  if (event.target?.matches?.('[data-affiliate-filter]')) {
    renderAffiliatesPanel();
    return;
  }
  if (event.target?.matches?.('[data-affiliate-commission]')) {
    updateAffiliate(event.target.dataset.affiliateCommission, (app) => {
      app.commission = Number(event.target.value || 10);
      return app;
    });
    return;
  }
});

function renderAdminAnalytics() {
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    const last = JSON.parse(localStorage.getItem('zavoraLastOrder') || 'null');
    if (last && last.id) orders.unshift(last);
  } catch(e) {}

  let wishlist = [];
  try {
    wishlist = JSON.parse(localStorage.getItem('zavoraWishlist') || localStorage.getItem('zavora_wishlist') || '[]');
  } catch(e) {}

  let visitors = {};
  try { visitors = JSON.parse(localStorage.getItem('zavora_active_visitors') || '{}'); } catch(e) {}
  const now = Date.now();
  const activeSessions = Object.keys(visitors).filter(id => now - Number(visitors[id] || 0) < 120000);
  const activeCount = Math.max(1, activeSessions.length);

  const totalRev = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const uniqueEmails = new Set(orders.map(o => String(o.email || '').toLowerCase()).filter(Boolean));

  const totalSalesEl = document.querySelector('[data-admin-analytics-total-sales]');
  if (totalSalesEl) totalSalesEl.textContent = `${money(totalRev)} Total Revenue`;

  const revEl = document.querySelector('[data-admin-analytics-rev]');
  if (revEl) revEl.textContent = money(totalRev);

  const custEl = document.querySelector('[data-admin-analytics-cust]');
  if (custEl) custEl.textContent = `${uniqueEmails.size} Accounts`;

  const liveSessionEl = document.querySelector('[data-admin-analytics-live-session]');
  if (liveSessionEl) liveSessionEl.textContent = `${activeCount} Live ${activeCount === 1 ? 'Session' : 'Sessions'}`;

  const deviceStatEl = document.querySelector('[data-admin-analytics-device-stat]');
  const isMobile = window.innerWidth <= 768;
  if (deviceStatEl) deviceStatEl.textContent = isMobile ? '📱 Mobile Device' : '💻 Desktop Browser';

  const chartContainer = document.querySelector('[data-admin-analytics-chart]');
  if (chartContainer) {
    if (!orders.length) {
      chartContainer.innerHTML = `<div style="padding:40px;text-align:center;color:#666;background:#fafafa;border-radius:8px;border:1px dashed #ccc;">No order revenue recorded yet. New checkout sales will render on the revenue chart in real time.</div>`;
    } else {
      const bars = orders.map((o) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
          <strong style="font-size:11px;color:#2e7d32;">${money(o.total || 0)}</strong>
          <div style="width:100%;height:80px;background:#e8f5e9;border-radius:4px;display:flex;align-items:flex-end;">
            <div style="width:100%;height:${Math.min(100, (Number(o.total || 50) / 200) * 100)}%;background:#2e7d32;border-radius:4px;"></div>
          </div>
          <span style="font-size:10px;color:#777;">Order #${o.id}</span>
        </div>
      `).join('');
      chartContainer.innerHTML = `<div style="display:flex;align-items:flex-end;gap:12px;padding:16px;background:#fff;border-radius:8px;border:1px solid #eee;">${bars}</div>`;
    }
  }
}

async function bootAdmin() {
  const ready = await requireAdminSession();
  if (!ready) return;
  renderQuickPanels();
  renderAdminProducts();
  renderAdminCategories();
  renderAdminCustomers();
  renderAdminPayments();
  renderAdminCoupons();
  renderAdminWishlist();
  renderAdminShipping();
  renderAdminAnalytics();
  setSection(window.location.hash.replace('#', '') || 'dashboard');
  refreshLiveAdminDashboard();
  window.setInterval(refreshLiveAdminDashboard, 30000);

  function updateLiveVisitors() {
    let visitors = {};
    try { visitors = JSON.parse(localStorage.getItem('zavora_active_visitors') || '{}'); } catch(e) {}
    const now = Date.now();
    const activeSessions = Object.keys(visitors).filter(id => now - Number(visitors[id] || 0) < 120000);
    const count = Math.max(1, activeSessions.length);

    const liveEl = document.querySelector('.admin-tools button:not(.admin-badge), [data-live-counter], .live-status-btn, .admin-tools .live-counter');
    if (liveEl) {
      liveEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;background:#e8f5e9;color:#2e7d32;font-weight:700;border-radius:16px;font-size:12px;"><i style="width:8px;height:8px;background:#2e7d32;border-radius:50%;display:inline-block;box-shadow:0 0 6px #2e7d32;"></i> Live ${count} ${count === 1 ? 'Visitor' : 'Visitors'}</span>`;
    }
  }
  updateLiveVisitors();
  setInterval(updateLiveVisitors, 3000);
}

bootAdmin();
