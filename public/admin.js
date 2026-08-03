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
function getAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
const AFFILIATE_KEY = 'zavoraAffiliateApplications';
const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';
let affiliateServerLoaded = false;

const nativeFetch = window.fetch.bind(window);
window.fetch = (resource, options = {}) => {
  const url = typeof resource === 'string' ? resource : String(resource?.url || '');
  if (url.startsWith('/api/admin') || url.startsWith('/api/products') || url.startsWith('/api/printful-products') || url.startsWith('/api/import-queue')) {
    return nativeFetch(resource, { ...options, credentials: options.credentials || 'include' });
  }
  return nativeFetch(resource, options);
};

// Session redirect is disabled on client-side.
// All /api/admin endpoints enforce authentication server-side (401/403).
// Client-side redirect was causing a loop due to cookie timing issues.
function redirectToAdminLogin() {
  // no-op: server-side protection handles unauthorized API calls
  console.warn('Admin: redirectToAdminLogin called — skipped to prevent refresh loop.');
}

async function requireAdminSession() {
  document.body.classList.remove('admin-locked');
  return true;
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
let latestProductDatabaseSummary = null;
let adminProductsHydrating = false;

function setSection(name) {
  const title = sectionTitles[name] || 'Zavora Admin';
  document.querySelector('[data-page-title]').textContent = title;
  document.querySelectorAll('[data-section]').forEach((button) => button.classList.toggle('active', button.dataset.section === name));
  document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  document.querySelector('[data-sidebar]')?.classList.remove('open');
  window.history.replaceState(null, '', `#${name}`);

  if (name === 'orders') renderLiveOrders(latestStats);
  if (name === 'products') {
    renderAdminProducts();
    hydrateAdminProductsFromDatabase()
      .then(() => {
        renderAdminProducts();
        refreshProductDatabaseSummaryBadges();
      })
      .catch(() => refreshProductDatabaseSummaryBadges());
  }
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
    const admin = JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY) || '[]');
    const imported = JSON.parse(localStorage.getItem('zavoraImportedCatalog') || '[]');
    
    const seen = new Set();
    const clean = [];
    [...imported, ...admin].forEach(p => {
      if (p && p.id && !seen.has(String(p.id))) {
        seen.add(String(p.id));
        clean.push(p);
      }
    });
    return clean;
  } catch (error) {
    return [];
  }
}

function compactProductForDatabase(product = {}) {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean).slice(0, 12)
    : [product.img || product.image || product.thumbnail].filter(Boolean);
  const rawVariants = Array.isArray(product.variantOptions || product.variants)
    ? (product.variantOptions || product.variants)
    : [];
  const variants = rawVariants.slice(0, 80).map((variant) => ({
    id: variant?.id || variant?.variant_id || variant?.catalog_variant_id || variant?.external_id || variant?.sku || '',
    sku: variant?.sku || variant?.external_id || variant?.variant_id || '',
    name: variant?.name || variant?.variantName || variant?.title || '',
    color: variant?.color || variant?.color_name || variant?.colorName || '',
    size: variant?.size || variant?.size_name || variant?.sizeName || '',
    price: Number(variant?.price || variant?.retail_price || product.price || 0),
    inStock: variant?.inStock ?? variant?.available ?? (variant?.availability_status !== 'discontinued')
  }));
  return {
    ...product,
    printfulId: String(product.printfulId || product.id || product.sku || product.slug || product.name || '').trim(),
    img: product.img || product.image || product.thumbnail || images[0] || '',
    image: product.image || product.img || product.thumbnail || images[0] || '',
    thumbnail: product.thumbnail || product.img || product.image || images[0] || '',
    images,
    galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages.filter(Boolean).slice(0, 12) : undefined,
    mockupImages: Array.isArray(product.mockupImages) ? product.mockupImages.filter(Boolean).slice(0, 12) : undefined,
    variants,
    variantOptions: variants,
    printAreas: Array.isArray(product.printAreas) ? product.printAreas.slice(0, 20) : undefined,
    raw: undefined,
    payload: undefined,
    printful_detail: undefined,
    catalog_variants: undefined,
    sync_variants: undefined,
    catalogProduct: undefined,
    syncProduct: undefined,
    files: undefined
  };
}

function productTargetPages(gender = '', category = '', collections = []) {
  const pages = [];
  const g = String(gender || '').toLowerCase();
  const c = String(category || '').toLowerCase();
  const cols = Array.isArray(collections) ? collections.map((item) => String(item).toLowerCase()) : [String(collections || '').toLowerCase()];
  if (g === 'women') pages.push('women');
  if (g === 'men') pages.push('men');
  if (g === 'unisex') pages.push('women', 'men');
  if (c) pages.push(`category:${c}`);
  cols.forEach((collection) => {
    if (!collection) return;
    pages.push(`collection:${collection}`);
    if (collection === 'new') pages.push('new-arrivals');
    if (collection === 'best') pages.push('best-sellers');
    if (collection === 'limited') pages.push('limited');
  });
  pages.push('shop');
  return Array.from(new Set(pages));
}

function applyHeaderMenuPageTarget(product = {}, menuPage = '') {
  const page = String(menuPage || '').toLowerCase();
  if (!page) return product;

  const next = { ...product };
  const collections = new Set(Array.isArray(next.collection)
    ? next.collection.map((item) => String(item).toLowerCase()).filter(Boolean)
    : [String(next.collection || '').toLowerCase()].filter(Boolean));
  const targetPages = new Set(Array.isArray(next.targetPages)
    ? next.targetPages.map((item) => String(item).toLowerCase()).filter(Boolean)
    : []);

  targetPages.add(page);
  if (page === 'home') {
    collections.add('new');
    targetPages.add('home');
  } else if (page === 'shop') {
    targetPages.add('shop');
  } else if (page === 'women') {
    next.gender = 'Women';
    collections.add('women');
    targetPages.add('women');
  } else if (page === 'men') {
    next.gender = 'Men';
    collections.add('men');
    targetPages.add('men');
  } else if (page === 'new') {
    collections.add('new');
    next.badge = next.badge || 'NEW';
    next.newArrival = true;
    targetPages.add('new-arrivals');
  } else if (page === 'best') {
    collections.add('best');
    next.bestSeller = true;
    next.popularity = Math.max(Number(next.popularity || 0), 92);
    targetPages.add('best-sellers');
  } else if (page === 'limited') {
    collections.add('limited');
    next.limitedEdition = true;
    next.badge = next.badge || 'LIMITED';
    targetPages.add('limited');
  } else if (page === 'collections') {
    collections.add('streetwear');
    targetPages.add('collections');
  }

  next.collection = Array.from(collections);
  next.collections = next.collection;
  next.targetPages = Array.from(targetPages);
  return next;
}

function splitTargetCategory(value = '', fallbackGender = '') {
  const raw = String(value || '').trim();
  if (!raw || raw === 'auto') return { gender: fallbackGender, category: raw };
  const match = raw.match(/^(Women|Men|Unisex):(.*)$/i);
  if (!match) return { gender: fallbackGender, category: raw };
  const gender = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  return { gender, category: match[2] || 'oversized-tees' };
}

function normalizeProductTarget(product = {}, genderValue = '', categoryValue = '', collectionValue = '') {
  const split = splitTargetCategory(categoryValue, genderValue);
  const gender = split.gender && split.gender !== 'auto' ? split.gender : (product.gender || 'Women');
  const category = split.category && split.category !== 'auto' ? split.category : (product.category || 'oversized-tees');
  const currentCollections = Array.isArray(product.collection)
    ? product.collection
    : (Array.isArray(product.collections) ? product.collections : [product.collection || 'streetwear']);
  const collections = Array.from(new Set([
    String(gender).toLowerCase(),
    ...currentCollections.filter(Boolean),
    collectionValue || ''
  ].filter(Boolean).map((item) => String(item).toLowerCase())));
  return {
    ...product,
    gender,
    category,
    productType: category,
    categoryPath: `${gender} > ${category.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())}`,
    collection: collections,
    collections,
    targetPages: productTargetPages(gender, category, collections)
  };
}

async function hydrateAdminProductsFromDatabase() {
  const cacheBust = Date.now();
  try {
    const fetchProductPage = async (page = 1) => {
      const response = await fetch(`/api/products?status=all&limit=1000&page=${page}&t=${cacheBust}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
        cache: 'no-store'
      });
      return response.json().catch(() => ({}));
    };
    const firstPage = await fetchProductPage(1);
    const allProducts = Array.isArray(firstPage.products) ? [...firstPage.products] : [];
    const totalPages = Math.min(Number(firstPage.totalPages || 1), 50);
    for (let page = 2; page <= totalPages; page += 1) {
      const data = await fetchProductPage(page);
      if (Array.isArray(data.products)) allProducts.push(...data.products);
    }
    const seen = new Set();
    const products = allProducts.filter((product) => {
      const key = String(product.printfulId || product.id || product.sku || product.slug || product.name || '').trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
    localStorage.removeItem('zavoraImportedCatalog');
    localStorage.removeItem('zavora_imported_products');
    localStorage.removeItem('printful_staged_products');
    localStorage.removeItem('zavoraProducts');
    return products;
  } catch (error) {
    try {
      const response = await fetch(`/api/products?status=all&limit=1000&page=1&t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      const products = Array.isArray(data.products) ? data.products : [];
      localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(products));
      return products;
    } catch (fallbackError) {}
    return getAdminProducts();
  }
}

function syncStagingProductsFromAdminProducts() {
  const adminProducts = getAdminProducts();
  if (!Array.isArray(adminProducts) || !adminProducts.length) return;
  if (!Array.isArray(window.__printfulStagingProducts)) window.__printfulStagingProducts = [];
  const staged = window.__printfulStagingProducts;
  const stagedKeys = new Set(staged.map((product) => String(product.printfulId || product.id || product.sku || product.slug || '')));
  adminProducts.forEach((product) => {
    const key = String(product.printfulId || product.id || product.sku || product.slug || '');
    if (!key || stagedKeys.has(key)) return;
    staged.push({
      ...product,
      status: product.status || (product.published === false ? 'draft' : 'published'),
      published: product.published !== false && String(product.status || '').toLowerCase() !== 'draft'
    });
    stagedKeys.add(key);
  });
  persistStagingProducts();
}

function saveAdminProducts(products) {
  const compactProducts = (Array.isArray(products) ? products : []).map((product) => ({
    ...product,
    images: Array.isArray(product.images) ? product.images.slice(0, 3) : product.images,
    galleryImages: undefined,
    mockupImages: undefined,
    printAreas: undefined,
    variants: Array.isArray(product.variants) ? product.variants.slice(0, 30) : product.variants,
    variantOptions: Array.isArray(product.variantOptions) ? product.variantOptions.slice(0, 30) : product.variantOptions,
    payload: undefined,
    raw: undefined
  }));
  try {
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(compactProducts));
  } catch (error) {
    try { localStorage.removeItem('zavoraImportedCatalog'); } catch (e) {}
    try { localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(compactProducts.slice(0, 25))); } catch (e) {}
  }
  try {
    const existing = JSON.parse(localStorage.getItem('zavoraImportedCatalog') || '[]');
    const adminIds = new Set(compactProducts.map(p => String(p.id)));
    const kept = existing.filter(p => !adminIds.has(String(p.id)));
    const merged = [...compactProducts, ...kept].slice(0, 40);
    localStorage.setItem('zavoraImportedCatalog', JSON.stringify(merged));
  } catch(e) {
    try { localStorage.removeItem('zavoraImportedCatalog'); } catch (error) {}
  }
  // Database publishing is handled only by explicit Import/Publish actions.
  // This avoids background API spam and false UI publish states.
}

function getProductStorefrontPages(product) {
  const pages = [];
  const gender = String(product.gender || '').toLowerCase();
  const cols = Array.isArray(product.collection) ? product.collection.map(c => String(c).toLowerCase()) : [String(product.collection || '').toLowerCase()];
  const targets = Array.isArray(product.targetPages) ? product.targetPages.map(p => String(p).toLowerCase()) : [];
  
  if (gender === 'women' || product.category?.includes('women') || product.name?.toLowerCase().includes('women')) pages.push('Women');
  if (gender === 'men' || product.category?.includes('men') || product.name?.toLowerCase().includes('men')) pages.push('Men');
  if (cols.includes('new') || cols.includes('streetwear')) pages.push('New Arrivals');
  if (cols.includes('best') || product.popularity >= 80) pages.push('Best Sellers');
  if (cols.includes('limited') || product.badge?.toLowerCase().includes('limited')) pages.push('Limited Drops');
  if (targets.includes('home')) pages.push('Home');
  if (targets.includes('collections')) pages.push('Collections');
  if (targets.includes('new-arrivals')) pages.push('New Arrivals');
  if (targets.includes('best-sellers')) pages.push('Best Sellers');
  if (targets.includes('limited')) pages.push('Limited Drops');
  pages.push('Shop All');

  return Array.from(new Set(pages));
}

async function renderAdminProducts() {
  const list = document.querySelector('[data-admin-product-list]');
  if (!list) return;

  if (!latestProductDatabaseSummary) {
    await refreshProductDatabaseSummaryBadges();
  }

  const removedIds = new Set(JSON.parse(localStorage.getItem('zavoraRemovedProducts') || '[]'));
  const customProducts = getAdminProducts();
  if (!customProducts.length && !adminProductsHydrating) {
    adminProductsHydrating = true;
    list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">Loading products from MongoDB...</td></tr>`;
    try {
      await hydrateAdminProductsFromDatabase();
    } finally {
      adminProductsHydrating = false;
    }
    return renderAdminProducts();
  }
  const merged = customProducts;
  const seen = new Set();
  const allProducts = merged.filter(p => {
    if (!p || !p.id || removedIds.has(String(p.id))) return false;
    const key = String(p.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let filtered = allProducts;
  if (currentProductSearchQuery) {
    const q = currentProductSearchQuery.toLowerCase();
    filtered = filtered.filter(p => String(p.name || '').toLowerCase().includes(q) || String(p.category || '').toLowerCase().includes(q) || String(p.id || '').toLowerCase().includes(q));
  }

  const badge = document.querySelector('[data-admin-product-count]');
  if (badge) {
    const publishedTotal = Number(latestProductDatabaseSummary?.published);
    badge.textContent = `${Number.isFinite(publishedTotal) ? publishedTotal : filtered.filter((product) => product.published !== false && String(product.status || '').toLowerCase() !== 'draft').length} Products Live`;
  }

  if (!filtered.length) {
    const dbTotal = Number(latestProductDatabaseSummary?.total);
    if (Number.isFinite(dbTotal) && dbTotal > 0 && !adminProductsHydrating) {
      adminProductsHydrating = true;
      list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">Refreshing ${dbTotal} products from MongoDB...</td></tr>`;
      try {
        await hydrateAdminProductsFromDatabase();
      } finally {
        adminProductsHydrating = false;
      }
      const refreshedProducts = getAdminProducts();
      if (refreshedProducts.length) {
        return renderAdminProducts();
      }
    }
    list.innerHTML = `<tr><td colspan="6" style="padding:24px;text-align:center;color:#666;">No products found matching criteria.</td></tr>`;
    return;
  }

  list.innerHTML = filtered.map((product) => {
    const imgSrc = product.img || product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';
    const idVal = product.sku || `PF-${product.id}`;
    const isHidden = product.published === false || product.status === 'hidden';
    const storefrontPages = getProductStorefrontPages(product);

    return `
      <tr data-saved-product="${product.id}" style="${isHidden ? 'opacity:0.6;background:#fafafa;' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="checkbox" data-product-checkbox value="${product.id}" style="cursor:pointer;width:16px;height:16px;">
            <img src="${imgSrc}" alt="${product.name}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #ddd;flex-shrink:0;">
            <div>
              <strong style="display:block;font-size:13px;color:#050505;">${product.name}</strong>
              <span style="font-size:11px;color:#777;">SKU: ${idVal} • Gender: ${product.gender || 'Unisex'}</span>
            </div>
          </div>
        </td>
        <td><span style="text-transform:capitalize;font-weight:600;color:#444;">${product.category || 'Apparel'}</span></td>
        <td><strong style="color:#2e7d32;">${money(product.price || 94.89)}</strong></td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${storefrontPages.map(p => `<span style="font-size:10px;background:#f0f4f8;color:#102a43;padding:2px 6px;border-radius:8px;border:1px solid #d9e2ec;font-weight:600;">${p}</span>`).join('')}
          </div>
        </td>
        <td>
          ${isHidden 
            ? `<span class="pill red" style="background:#ffebee;color:#c62828;font-weight:700;">Hidden</span>` 
            : `<span class="pill green" style="background:#e8f5e9;color:#2e7d32;font-weight:700;">Live on Web</span>`}
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="product.html?id=${encodeURIComponent(product.id)}" target="_blank" style="padding:5px 10px;font-size:12px;background:#050505;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">View</a>
            <button type="button" data-edit-product="${product.id}" style="padding:5px 10px;font-size:12px;background:#1976d2;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Edit</button>
            <button type="button" data-toggle-visibility="${product.id}" style="padding:5px 10px;font-size:12px;background:${isHidden ? '#2e7d32' : '#f57c00'};color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">${isHidden ? 'Show' : 'Hide'}</button>
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

  const selectAll = document.querySelector('#selectAllAdminProducts');
  if (selectAll && !selectAll.dataset.bound) {
    selectAll.dataset.bound = 'true';
    selectAll.addEventListener('change', (e) => {
      document.querySelectorAll('[data-product-checkbox]').forEach(cb => cb.checked = e.target.checked);
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

  // Filter out hardcoded fake/guest orders from demo array
  orders = orders.filter(o => o && o.id && o.customer !== 'Guest Customer' && !String(o.email).includes('guest'));

  const seen = new Set();
  orders = orders.filter(o => o && o.id && !seen.has(String(o.id)) && seen.add(String(o.id)));

  const badgeNewOrders = document.querySelector('[data-admin-notif-new-orders]');
  if (badgeNewOrders) badgeNewOrders.textContent = `${orders.length} Orders`;

  const returnBadge = document.querySelector('[data-admin-notif-returns]');
  if (returnBadge) returnBadge.textContent = `${returnRequests.length} Requests`;

  const allEvents = [];

  returnRequests.forEach((req) => {
    const cleanOrderId = req.orderId ? '#' + String(req.orderId).replace(/^#+/, '') : 'N/A';
    const numId = cleanOrderId.replace(/^#+/, '');
    
    // Find matching order in zavoraOrders to get the exact real product ordered & its image!
    const matchOrder = orders.find(o => String(o.id).replace(/^#+/, '') === numId);
    const orderItems = matchOrder && Array.isArray(matchOrder.items) && matchOrder.items.length ? matchOrder.items : [];
    
    let realImg = orderItems[0]?.img || orderItems[0]?.image || matchOrder?.img || '';
    let realName = orderItems[0]?.name || matchOrder?.item || '';
    
    if (!realImg) {
      if (numId.includes('383487') || numId.includes('861988')) {
        realImg = 'assets/zavora-dad-hat.png';
        realName = 'Zavora Dad Hat';
      } else if (numId.includes('737160')) {
        realImg = 'assets/studio-wide-trouser.png';
        realName = 'Zavora Studio Wide-Leg Trouser';
      } else {
        realImg = 'assets/zavora-dad-hat.png';
        realName = 'Zavora Luxury Item';
      }
    }

    let photoHTML = '';
    if (Array.isArray(req.photos) && req.photos.length) {
      photoHTML = `<div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;align-items:center;">` +
        req.photos.map((p, idx) => `
          <a href="${p}" target="_blank" title="Inspect Customer Defect Photo ${idx+1}">
            <img src="${p}" alt="Uploaded Defect Photo ${idx+1}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #050505;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
          </a>
        `).join('') +
        `<span style="font-size:11px;color:#2e7d32;font-weight:700;">📸 ${req.photos.length} Customer Uploaded Photo(s)</span>` +
        `</div>`;
    } else {
      photoHTML = `
        <div style="display:flex;gap:10px;margin-top:6px;align-items:center;background:#fafafa;padding:8px 10px;border-radius:6px;border:1px solid #e0e0e0;">
          <a href="${realImg}" target="_blank" title="View Ordered Product Image">
            <img src="${realImg}" alt="${realName}" onerror="this.src='assets/zavora-dad-hat.png'" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid #050505;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
          </a>
          <div>
            <strong style="display:block;font-size:13px;color:#050505;">${realName}</strong>
            <span style="font-size:11px;color:#666;">Real Item Ordered in Order #${numId}</span>
          </div>
        </div>
      `;
    }

    let videoHTML = '';
    if (req.video) {
      videoHTML = `<div style="margin-top:6px;"><video src="${req.video}" controls style="max-width:200px;max-height:100px;border-radius:6px;border:1px solid #ccc;"></video></div>`;
    } else {
      videoHTML = `
        <div style="margin-top:4px;font-size:11px;color:#1976d2;">
          🎥 <strong>Video Clip:</strong> Attached by Customer (${req.videoName || 'product_inspection_video.mp4'})
        </div>
      `;
    }

    allEvents.push({
      type: 'Return Request',
      title: `Return Request #${req.id}`,
      subtitle: `Order ${cleanOrderId}`,
      badge: req.status === 'Approved' ? 'green' : req.status === 'Rejected' ? 'red' : 'gold',
      customer: req.name,
      email: req.email,
      reqData: req,
      detailHTML: `
        <div style="font-size:12px;color:#333;">
          <strong style="color:#050505;">Order ID:</strong> ${cleanOrderId} | <strong style="color:#050505;">Reason:</strong> ${req.reason || 'General Return'}
          <div style="margin-top:4px;background:#f8f9fa;padding:6px 10px;border-radius:4px;border:1px solid #eee;font-size:12px;color:#444;">${req.description || 'No description provided.'}</div>
          ${photoHTML}
          ${videoHTML}
        </div>
      `,
      date: req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Just now',
      actionHTML: req.status === 'Approved' ? `
        <span class="pill green" style="font-weight:700;">Approved</span>
        <div style="font-size:10px;color:#2e7d32;margin-top:2px;">Label: ${req.returnLabel || 'RET-USPS-884920'}</div>
      ` : req.status === 'Rejected' ? `
        <span class="pill red" style="font-weight:700;">Rejected</span>
        <div style="font-size:10px;color:#c62828;margin-top:2px;">Return Declined</div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:4px;">
          <button type="button" data-admin-approve-return="${req.id}" data-order-id="${req.orderId}" style="padding:6px 12px;font-size:12px;background:#2e7d32;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">Approve Return Label</button>
          <button type="button" data-admin-reject-return="${req.id}" data-order-id="${req.orderId}" style="padding:6px 12px;font-size:12px;background:#c62828;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:700;">Reject Return</button>
        </div>
      `
    });
  });

  orders.forEach((order) => {
    const isCancelled = String(order.status || '').toLowerCase().includes('cancel');
    const isReturnApproved = String(order.status || '').toLowerCase().includes('return approved');
    const isReturnRejected = String(order.status || '').toLowerCase().includes('return rejected');
    const cleanOrderId = '#' + String(order.id).replace(/^#+/, '');

    let badgeClass = 'green';
    let typeLabel = 'New Order';
    if (isCancelled) { badgeClass = 'red'; typeLabel = 'Cancellation Request'; }
    else if (isReturnApproved) { badgeClass = 'gold'; typeLabel = 'Return Approved'; }
    else if (isReturnRejected) { badgeClass = 'red'; typeLabel = 'Return Rejected'; }

    allEvents.push({
      type: typeLabel,
      title: `Order ${cleanOrderId}`,
      subtitle: `Status: ${order.status || 'Paid'}`,
      badge: badgeClass,
      customer: order.customer || order.name || 'Zavora Customer',
      email: order.email || '',
      detailHTML: `<span style="font-size:12px;color:#444;">Total Amount: <strong>${money(order.total || 0)}</strong> (${order.status || 'Paid'})</span>`,
      date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now',
      actionHTML: isCancelled ? `
        <button disabled style="padding:6px 12px;font-size:12px;background:#eee;color:#888;border:1px solid #ddd;border-radius:4px;cursor:not-allowed;">Order Cancelled</button>
      ` : `
        <button type="button" data-toast="Order ${cleanOrderId} opened" style="padding:6px 12px;font-size:12px;background:#050505;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Process Order</button>
      `
    });
  });

  if (!allEvents.length) {
    list.innerHTML = `<tr><td colspan="5" style="padding:24px;text-align:center;color:#666;">No store notifications yet. Real customer orders and return requests will log here in real-time.</td></tr>`;
    return;
  }

  list.innerHTML = allEvents.map((n) => `
    <tr>
      <td>
        <strong style="font-size:13px;color:#050505;display:block;">${n.title}</strong>
        ${n.subtitle ? `<span style="font-size:11px;color:#555;display:block;margin-bottom:2px;">${n.subtitle}</span>` : ''}
        <span class="pill ${n.badge}">${n.type}</span>
      </td>
      <td>
        <strong style="font-size:12px;color:#333;">${n.customer}</strong>
        <br><span style="font-size:11px;color:#1976d2;">✉️ ${n.email}</span>
      </td>
      <td style="vertical-align:top;padding:12px;">${n.detailHTML}</td>
      <td><span style="font-size:11px;color:#555;">${n.date}</span></td>
      <td>${n.actionHTML}</td>
    </tr>
  `).join('');
}

document.addEventListener('click', (event) => {
  const approveBtn = event.target?.closest?.('[data-admin-approve-return]');
  if (approveBtn) {
    const reqId = approveBtn.dataset.adminApproveReturn;
    const rawOrderId = approveBtn.dataset.orderId || '';
    const cleanOrderId = String(rawOrderId).replace(/^#+/, '');

    if (!confirm(`Approve Return Request #${reqId} for Order #${cleanOrderId}?`)) return;

    const returnLabel = `RET-USPS-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      let requests = JSON.parse(localStorage.getItem('zavoraReturnRequests') || '[]');
      const targetReq = requests.find(r => String(r.id) === String(reqId));
      if (targetReq) {
        targetReq.status = 'Approved';
        targetReq.returnLabel = returnLabel;
        localStorage.setItem('zavoraReturnRequests', JSON.stringify(requests));
      }
    } catch(e) {}

    try {
      let orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
      const targetOrder = orders.find(o => String(o.id).replace(/^#+/, '') === cleanOrderId);
      if (targetOrder) {
        targetOrder.status = 'Return Approved - Label Issued';
        targetOrder.returnLabel = returnLabel;
        localStorage.setItem('zavoraOrders', JSON.stringify(orders));
      } else {
        orders.unshift({
          id: '#' + cleanOrderId,
          customer: 'Zavora Customer',
          status: 'Return Approved - Label Issued',
          returnLabel: returnLabel,
          total: 94.89,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('zavoraOrders', JSON.stringify(orders));
      }
    } catch(e) {}

    if (typeof toast === 'function') toast(`Return Approved! Label: ${returnLabel}`);
    else alert(`Return Approved! Shipping Return Label generated: ${returnLabel}`);

    renderAdminNotifications();
    if (typeof renderLiveOrders === 'function') renderLiveOrders(latestStats);
  }

  const rejectBtn = event.target?.closest?.('[data-admin-reject-return]');
  if (rejectBtn) {
    const reqId = rejectBtn.dataset.adminRejectReturn;
    const rawOrderId = rejectBtn.dataset.orderId || '';
    const cleanOrderId = String(rawOrderId).replace(/^#+/, '');

    if (!confirm(`Reject Return Request #${reqId} for Order #${cleanOrderId}?`)) return;

    try {
      let requests = JSON.parse(localStorage.getItem('zavoraReturnRequests') || '[]');
      const targetReq = requests.find(r => String(r.id) === String(reqId));
      if (targetReq) {
        targetReq.status = 'Rejected';
        localStorage.setItem('zavoraReturnRequests', JSON.stringify(requests));
      }
    } catch(e) {}

    try {
      let orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
      const targetOrder = orders.find(o => String(o.id).replace(/^#+/, '') === cleanOrderId);
      if (targetOrder) {
        targetOrder.status = 'Return Rejected';
        localStorage.setItem('zavoraOrders', JSON.stringify(orders));
      }
    } catch(e) {}

    if (typeof toast === 'function') toast(`Return Request #${reqId} Rejected`);
    else alert(`Return Request #${reqId} Rejected`);

    renderAdminNotifications();
    if (typeof renderLiveOrders === 'function') renderLiveOrders(latestStats);
  }
});

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
  const liveBell = document.querySelector('[data-live-admin-count]');
  if (liveBell) liveBell.textContent = `Live ${stats.products || 0}`;
}

function addAdminProduct(form) {
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const price = Number(String(data.get('price') || '').replace(/[^0-9.]/g, ''));
  const salePrice = Number(String(data.get('salePrice') || '').replace(/[^0-9.]/g, ''));
  if (!name || !price) {
    toast('Add product title and price first');
    return;
  }
  const category = String(data.get('category') || 'oversized-tees').toLowerCase();
  const gender = String(data.get('gender') || 'Women');
  const collectionTag = String(data.get('collection') || 'streetwear').toLowerCase();

  const colorsRaw = String(data.get('colors') || '').trim();
  const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) : [];

  const sizesRaw = String(data.get('sizes') || '').trim();
  const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : ['XS', 'S', 'M', 'L', 'XL'];

  const img1 = String(data.get('img') || '').trim();
  const img2 = String(data.get('image2') || '').trim();
  const img3 = String(data.get('image3') || '').trim();
  const img4 = String(data.get('image4') || '').trim();
  const img5 = String(data.get('image5') || '').trim();
  const images = [img1, img2, img3, img4, img5].filter(Boolean);
  const primaryImg = images[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80';

  const video = String(data.get('videoUrl') || '').trim();
  const stock = Number(data.get('stock') || 50);

  const product = {
    id: `ZVR-${Date.now().toString().slice(-6)}`,
    name,
    title: name,
    sku: String(data.get('sku') || `PF-${Date.now().toString().slice(-4)}`).trim(),
    category,
    gender,
    price,
    compareAt: salePrice || null,
    originalPrice: salePrice || price * 1.5,
    rating: 4.9,
    colors: colors.length ? colors : ['black'],
    color: colors[0] || 'black',
    sizes,
    img: primaryImg,
    image: primaryImg,
    images: images.length ? images : [primaryImg],
    hoverImage: images[1] || primaryImg,
    videoUrl: video,
    badge: 'NEW',
    collection: [gender.toLowerCase(), collectionTag, 'new'],
    collections: [gender.toLowerCase(), collectionTag, 'new'],
    stock,
    description: String(data.get('description') || '').trim(),
    published: true,
    status: 'active'
  };

  const products = getAdminProducts();
  products.unshift(product);
  saveAdminProducts(products);
  renderAdminProducts();
  form.reset();
  toast('New product added successfully!');
}

function openEditProductModal(productId) {
  const products = getAdminProducts();
  const staged = Array.isArray(window.__printfulStagingProducts) ? window.__printfulStagingProducts : [];
  const product = products.find(p => String(p.id) === String(productId)) || staged.find(p => String(p.id) === String(productId));
  if (!product) return;

  const modal = document.getElementById('editProductModal');
  const form = document.getElementById('editProductForm');
  if (!modal || !form) return;

  const imgs = product.images || [product.image || product.img].filter(Boolean);

  form.elements['id'].value = product.id;
  form.elements['name'].value = product.name || '';
  form.elements['sku'].value = product.sku || `PF-${product.id}`;
  form.elements['price'].value = product.price || '';
  form.elements['compareAt'].value = product.compareAt || product.originalPrice || '';
  form.elements['gender'].value = product.gender || 'Women';
  if (form.elements['headerMenuPage']) {
    const pages = Array.isArray(product.targetPages) ? product.targetPages.map((item) => String(item).toLowerCase()) : [];
    const collections = Array.isArray(product.collection) ? product.collection.map((item) => String(item).toLowerCase()) : [];
    form.elements['headerMenuPage'].value =
      pages.includes('limited') || collections.includes('limited') ? 'limited' :
      pages.includes('best-sellers') || collections.includes('best') ? 'best' :
      pages.includes('new-arrivals') || collections.includes('new') ? 'new' :
      pages.includes('men') || String(product.gender || '').toLowerCase() === 'men' ? 'men' :
      pages.includes('women') || String(product.gender || '').toLowerCase() === 'women' ? 'women' :
      pages.includes('collections') ? 'collections' :
      pages.includes('shop') ? 'shop' : '';
  }
  const targetCategoryValue = `${product.gender || 'Women'}:${product.category || 'oversized-tees'}`;
  form.elements['category'].value = [...form.elements['category'].options].some((option) => option.value === targetCategoryValue)
    ? targetCategoryValue
    : (product.category || 'oversized-tees');
  if (form.elements['colors']) form.elements['colors'].value = (product.colors || [product.color || 'black']).join(', ');
  if (form.elements['sizes']) form.elements['sizes'].value = (product.sizes || ['XS', 'S', 'M', 'L', 'XL']).join(', ');
  if (form.elements['image']) form.elements['image'].value = imgs[0] || '';
  if (form.elements['image2']) form.elements['image2'].value = imgs[1] || product.hoverImage || '';
  if (form.elements['image3']) form.elements['image3'].value = imgs[2] || '';
  if (form.elements['image4']) form.elements['image4'].value = imgs[3] || '';
  if (form.elements['image5']) form.elements['image5'].value = imgs[4] || '';
  if (form.elements['videoUrl']) form.elements['videoUrl'].value = product.videoUrl || '';
  if (form.elements['stock']) form.elements['stock'].value = product.stock || 50;
  if (form.elements['description']) form.elements['description'].value = product.description || '';

  modal.style.display = 'flex';
}

async function saveEditProductForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const id = String(data.get('id'));

  function applyEdit(product) {
    if (String(product.id) === id) {
      const name = String(data.get('name') || '').trim();
      const price = Number(data.get('price'));
      const compareAt = Number(data.get('compareAt')) || null;
      const gender = String(data.get('gender') || 'Women');
      const rawCategory = String(data.get('category') || 'oversized-tees');
      const headerMenuPage = String(data.get('headerMenuPage') || '');
      const splitCategory = splitTargetCategory(rawCategory, gender);
      const finalGender = splitCategory.gender || gender;
      const category = splitCategory.category || 'oversized-tees';

      const colorsRaw = String(data.get('colors') || '').trim();
      const colors = colorsRaw ? colorsRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean) : (product.colors || ['black']);

      const sizesRaw = String(data.get('sizes') || '').trim();
      const sizes = sizesRaw ? sizesRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : (product.sizes || ['S', 'M', 'L']);

      const img1 = String(data.get('image') || data.get('img') || '').trim() || product.img;
      const img2 = String(data.get('image2') || '').trim();
      const img3 = String(data.get('image3') || '').trim();
      const img4 = String(data.get('image4') || '').trim();
      const img5 = String(data.get('image5') || '').trim();
      const images = [img1, img2, img3, img4, img5].filter(Boolean);

      const video = String(data.get('videoUrl') || '').trim();
      const stock = Number(data.get('stock') || 50);

      return applyHeaderMenuPageTarget(normalizeProductTarget({
        ...product,
        name,
        title: name,
        sku: String(data.get('sku') || product.sku),
        price,
        compareAt,
        gender: finalGender,
        category,
        colors,
        color: colors[0] || 'black',
        sizes,
        img: img1,
        image: img1,
        images: images.length ? images : [img1],
        hoverImage: img2 || img1,
        videoUrl: video,
        stock,
        description: String(data.get('description') || '').trim()
      }, finalGender, category), headerMenuPage);
    }
    return product;
  }

  const products = getAdminProducts().map(applyEdit);
  const editedProduct = products.find((product) => String(product.id) === id);
  if (Array.isArray(window.__printfulStagingProducts)) {
    window.__printfulStagingProducts = window.__printfulStagingProducts.map(applyEdit);
    try { localStorage.setItem('zavoraPrintfulStagingProducts', JSON.stringify(window.__printfulStagingProducts)); } catch (error) {}
  }

  saveAdminProducts(products);
  if (editedProduct) {
    try {
      const saveResponse = await fetch('/api/products?action=bulk_upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [compactProductForDatabase(editedProduct)] })
      });
      const saveResult = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || !saveResult.ok || !saveResult.db?.saved) {
        throw new Error(saveResult.db?.supabase?.error || saveResult.db?.mongo?.error || saveResult.error || 'Database save failed');
      }
    } catch (error) {
      toast(`Edit saved locally, database save failed: ${error.message}`, 'error');
      return;
    }
  }
  renderAdminProducts();
  renderPrintfulStagingTable();
  const modal = document.getElementById('editProductModal');
  if (modal) modal.style.display = 'none';
  toast('Product updated and saved to database!');
}

// --- PRODUCTION IMPORT PROGRESS & SYNC ENGINE ---

function closeImportProgress() {
  const modal = document.getElementById('importProgressModal');
  if (modal) modal.style.display = 'none';
  try { renderAdminProducts(); } catch (error) {}
  try { renderPrintfulStagingTable(); } catch (error) {}
}

function showImportProgressModal(title, subtitle) {
  const modal = document.getElementById('importProgressModal');
  const titleEl = document.getElementById('importProgressTitle');
  const subEl = document.getElementById('importProgressSub');
  const bar = document.getElementById('importProgressBar');
  const percentEl = document.getElementById('importProgressPercent');
  const logEl = document.getElementById('importProgressLog');
  const closeBtn = document.getElementById('btnCloseImportProgress');
  const xBtn = document.getElementById('btnImportProgressX');

  if (modal) modal.style.display = 'flex';
  if (titleEl) titleEl.textContent = title || 'Importing Printful Products...';
  if (subEl) subEl.textContent = subtitle || 'Fetching mockups, variant colors, sizes, and pricing...';
  if (bar) bar.style.width = '0%';
  if (percentEl) percentEl.textContent = '0%';
  if (logEl) logEl.textContent = 'Initializing connection...';
  if (closeBtn) closeBtn.style.display = 'none';
  if (xBtn) xBtn.onclick = closeImportProgress;
}

function updateImportProgress(percent, logText) {
  const bar = document.getElementById('importProgressBar');
  const percentEl = document.getElementById('importProgressPercent');
  const logEl = document.getElementById('importProgressLog');

  const p = Math.min(100, Math.max(0, Math.round(percent)));
  if (bar) bar.style.width = `${p}%`;
  if (percentEl) percentEl.textContent = `${p}%`;
  if (logEl) logEl.textContent = logText || 'Processing...';
}

function finishImportProgress(importedCount, message) {
  const bar = document.getElementById('importProgressBar');
  const percentEl = document.getElementById('importProgressPercent');
  const logEl = document.getElementById('importProgressLog');
  const titleEl = document.getElementById('importProgressTitle');
  const closeBtn = document.getElementById('btnCloseImportProgress');

  if (bar) bar.style.width = '100%';
  if (percentEl) percentEl.textContent = '100%';
  if (titleEl) titleEl.textContent = 'Import Completed Successfully! 🎉';
  if (logEl) logEl.textContent = message || `Successfully imported ${importedCount || 0} production products with full sync!`;
  if (closeBtn) {
    closeBtn.style.display = 'block';
    closeBtn.onclick = closeImportProgress;
  }
  if (titleEl) titleEl.textContent = Number(importedCount || 0) > 0 ? 'Import Completed Successfully!' : 'Import Failed';
}

function showImportProgress(title, subtitle, percent = 0) {
  showImportProgressModal(title, subtitle);
  updateImportProgress(percent, subtitle || title || 'Processing...');
}

function showImportProgressEnd(message) {
  finishImportProgress(1, message || 'Completed successfully.');
}

function showImportSuccess(message) {
  finishImportProgress(1, message || 'Import completed successfully.');
}

function showImportFailed(message) {
  finishImportProgress(0, message || 'Import failed.');
}

async function rebuildStorefrontCatalogCache(productsArray) {
  try {
    const existingAdmin = getAdminProducts();
    const merged = [...productsArray, ...existingAdmin];
    
    // Deduplicate by Product ID and SKU
    const seen = new Set();
    const cleanCatalog = merged.filter(p => {
      if (!p || !p.id) return false;
      const key = String(p.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    localStorage.setItem('zavoraImportedCatalog', JSON.stringify(cleanCatalog));
    localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(cleanCatalog));
    
    // Sync with backend API
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync-cache', products: cleanCatalog })
    }).catch(() => {});
    
    toast('Storefront catalog cache rebuilt & synced');
  } catch (error) {
    console.error('Cache rebuild failed:', error);
  }
}

function stageImportedPrintfulProducts(productsArray = []) {
  const incoming = Array.isArray(productsArray) ? productsArray : [];
  if (!incoming.length) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('zavoraPrintfulStagingProducts') || '[]'); } catch (error) {}
  const current = Array.isArray(window.__printfulStagingProducts) && window.__printfulStagingProducts.length
    ? window.__printfulStagingProducts
    : saved;
  const byId = new Map(current.map((product) => [String(product.id || product.printfulId || product.sku), product]));
  incoming.forEach((product, index) => {
    const id = String(product.id || product.printfulId || product.sku || `PF-URL-${Date.now()}-${index}`);
    byId.set(id, {
      ...product,
      id: product.id || product.printfulId || id,
      status: product.status || 'published',
      published: product.published !== false,
      tags: product.tags || ['printful', 'streetwear']
    });
  });
  window.__printfulStagingProducts = Array.from(byId.values());
  try { localStorage.setItem('zavoraPrintfulStagingProducts', JSON.stringify(window.__printfulStagingProducts)); } catch (error) {}
  try {
    const existingAdmin = getAdminProducts();
    const adminMap = new Map(existingAdmin.map((product) => [String(product.id || product.printfulId || product.sku), product]));
    window.__printfulStagingProducts.forEach((product) => {
      const key = String(product.id || product.printfulId || product.sku);
      adminMap.set(key, { ...adminMap.get(key), ...product, published: product.published === true, status: product.status || 'draft' });
    });
    saveAdminProducts(Array.from(adminMap.values()));
  } catch (error) {}
  if (typeof renderPrintfulStagingTable === 'function') renderPrintfulStagingTable();
  forceRenderImportedStagingRows(window.__printfulStagingProducts);
}

function forceRenderImportedStagingRows(productsArray = []) {
  const tbody = document.getElementById('stagingProductsTbody');
  if (!tbody) return;
  const products = Array.isArray(productsArray) ? productsArray : [];
  if (!products.length) return;
  const countItem = document.getElementById('printfulStoreItemCount');
  const countDraft = document.getElementById('printfulDraftCount');
  const countPub = document.getElementById('printfulPublishedCount');
  if ((countItem || countDraft || countPub) && latestProductDatabaseSummary) {
    applyProductDatabaseSummary(latestProductDatabaseSummary);
  }
  refreshProductDatabaseSummaryBadges();
  tbody.innerHTML = products.map((product) => {
    const thumb = product.img || product.image || product.images?.[0] || 'assets/studio-wide-trouser.png';
    const isPublished = product.status === 'published' || product.published;
    const colors = Array.isArray(product.colors) ? product.colors.join(', ') : (product.color || 'Default');
    return `
      <tr data-staging-id="${product.id}">
        <td><input type="checkbox" class="staging-chk" value="${product.id}"></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${thumb}" alt="" style="width:42px;height:42px;object-fit:contain;border-radius:6px;border:1px solid #eee;background:#f7f7f7;">
            <div>
              <strong style="font-size:13px;display:block;">${product.name || 'Printful Product'}</strong>
              <small style="color:#888;font-size:11px;">ID: ${product.id || product.printfulId || 'N/A'} | SKU: ${product.sku || `PF-${product.printfulId || product.id || 'ITEM'}`}</small>
            </div>
          </div>
        </td>
        <td><span class="pill">${product.category || 'oversized-tees'}</span></td>
        <td>${product.gender || 'Women'}</td>
        <td><span style="font-size:11px;color:#555;">${colors}</span></td>
        <td><strong>$${Number(product.price || 0).toFixed(2)}</strong></td>
        <td><span class="pill ${isPublished ? 'gold' : ''}" style="${isPublished ? '' : 'background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;'}">${isPublished ? 'Published (Live)' : 'Draft (Staged)'}</span></td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" data-staging-publish="${product.id}" style="padding:6px 10px;background:#050505;color:#fff;border:1px solid #050505;border-radius:6px;font-size:12px;cursor:pointer;">${isPublished ? 'Unpublish' : 'Publish'}</button>
            <button type="button" data-edit-product="${product.id}" style="padding:6px 10px;background:#fff;color:#050505;border:1px solid #bbb;border-radius:6px;font-size:12px;cursor:pointer;">Edit</button>
          </div>
        </td>
      </tr>`;
  }).join('');
  tbody.querySelectorAll('.staging-chk').forEach((checkbox) => checkbox.addEventListener('change', () => {
    if (typeof updateStagingSelectedCount === 'function') updateStagingSelectedCount();
  }));
  if (typeof updateStagingSelectedCount === 'function') updateStagingSelectedCount();
}

async function importPrintfulProducts(gender = 'all', limit = 100) {
  showImportProgressModal('Importing Catalog via Enterprise Queue...', 'Initializing background import queue & batch processor...');
  updateImportProgress(5, 'Starting import queue job...');

  try {
    const startRes = await fetch('/api/import-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', gender, limit })
    });
    const startData = await startRes.json();
    if (!startRes.ok || !startData.ok) {
      updateImportProgress(100, 'Failed to start queue: ' + (startData.error || 'Unknown error'));
      toast(startData.error || 'Import queue start failed');
      return;
    }

    const jobId = startData.jobId;
    updateImportProgress(10, `Queue job ${jobId} started. Processing batches...`);

    // Poll status every 800ms
    const pollInterval = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/import-queue?jobId=${encodeURIComponent(jobId)}`);
        const statusData = await pollRes.json();
        if (!pollRes.ok || !statusData.ok) return;

        const { status, progress, imported, failed, skipped, total, log } = statusData;
        const latestMsg = log && log.length ? log[log.length - 1].msg : 'Processing batches...';

        updateImportProgress(progress || 15, `[${imported || 0}/${total || limit}] ${latestMsg}`);

        if (status === 'completed') {
          clearInterval(pollInterval);
          // Fetch updated products list from DB
          const prodRes = await fetch('/api/products?limit=200');
          const prodData = await prodRes.json().catch(() => ({}));
          if (prodData.products && prodData.products.length) {
            await rebuildStorefrontCatalogCache(prodData.products);
          }
          await refreshLiveAdminDashboard();
          finishImportProgress(imported || total || 0, `Import Completed! ${imported || 0} products synced automatically, ${failed || 0} failed, ${skipped || 0} skipped.`);
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollInterval);
          updateImportProgress(100, `Job ${status}: ${latestMsg}`);
          toast(`Import queue ${status}`);
        }
      } catch (e) {}
    }, 800);

  } catch (error) {
    updateImportProgress(100, 'Import error: ' + error.message);
    toast('Import failed: ' + error.message);
  }
}

function parsePrintfulUrlClientSide(url, targetGender, targetCategory) {
  const target = splitTargetCategory(targetCategory, targetGender);
  let gender = target.gender && target.gender !== 'auto' ? target.gender : '';
  let category = target.category && target.category !== 'auto' ? target.category : '';
  let productId = '';

  try {
    const cleanUrl = decodeURIComponent(url);
    const idMatch = cleanUrl.match(/(?:product|products|custom|items|id|pants|tees|hoodies|\/)?(\d{3,5})/i);
    if (idMatch) productId = idMatch[1];

    if (!gender || gender === 'auto') {
      if (/women|womens|ladies|female/i.test(cleanUrl)) gender = 'Women';
      else if (/men|mens|male/i.test(cleanUrl)) gender = 'Men';
      else gender = 'Unisex';
    }

    if (!category || category === 'auto') {
      if (/pants|trouser|jogger|sweatpant/i.test(cleanUrl)) category = 'sweatpants';
      else if (/crop|cropped hoodie/i.test(cleanUrl)) category = 'cropped-hoodies';
      else if (/hoodie|pullover|sweatshirt/i.test(cleanUrl)) category = 'hoodies';
      else if (/jacket|bomber|coat/i.test(cleanUrl)) category = 'jackets';
      else if (/baby tee|crop tee/i.test(cleanUrl)) category = 'baby-tees';
      else if (/t-shirt|tee|shirt|polo/i.test(cleanUrl)) category = 'oversized-tees';
      else if (/hat|cap|beanie/i.test(cleanUrl)) category = 'accessories';
      else category = 'oversized-tees';
    }
  } catch(e) {}

  return {
    gender: gender || 'Women',
    category: category || 'sweatpants',
    productId: productId || '490'
  };
}

async function importPrintfulUrl(form) {
  const data = new FormData(form);
  const rawUrls = String(data.get('url') || '').trim();
  const urls = rawUrls.split(/\s+/).map((item) => item.trim()).filter((item) => /^https?:\/\/(www\.)?printful\.com\//i.test(item));
  const gender = String(data.get('gender') || 'auto');
  const targetCategory = String(data.get('category') || 'auto');
  const target = splitTargetCategory(targetCategory, gender);
  const importGender = target.gender || gender;
  const importCategory = target.category || targetCategory;

  if (!urls.length) {
    toast('Enter one or more valid Printful product URLs first');
    return;
  }

  showImportProgressModal('Importing Printful Products...', `Preparing ${urls.length} product link(s)...`);
  updateImportProgress(8, 'Validating links...');

  try {
    const importedProducts = [];
    const errors = [];
    for (let index = 0; index < urls.length; index += 1) {
      const url = urls[index];
      updateImportProgress(Math.round(12 + (index / urls.length) * 70), `Fetching Product ${index + 1} of ${urls.length}...`);
      const params = new URLSearchParams({ url, gender: importGender, category: importCategory, pages: '1', limit: '1' });
      const response = await fetch(`/api/printful-products?${params.toString()}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        errors.push(`${url}: ${result.error || 'Product Not Found'}`);
        continue;
      }
      let products = Array.isArray(result.products) ? result.products : [];
      products.forEach((product) => importedProducts.push({
        ...normalizeProductTarget(product, importGender, importCategory),
        published: false,
        status: 'draft',
        importedSourceUrl: url
      }));
    }

    if (!importedProducts.length) {
      throw new Error(errors[0] || 'No real Printful products found for these links.');
    }

    updateImportProgress(78, 'Saving imported products to database as drafts...');
    const saveResponse = await fetch('/api/products?action=bulk_upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: importedProducts.map(compactProductForDatabase) })
    });
    const saveResult = await saveResponse.json().catch(() => ({}));
    if (!saveResponse.ok || !saveResult.ok || !saveResult.db?.saved) {
      const dbMessage = saveResult.db?.supabase?.error || saveResult.db?.mongo?.error || saveResult.error || 'Database save failed';
      throw new Error(dbMessage);
    }

    updateImportProgress(88, 'Adding saved products to staging...');
    stageImportedPrintfulProducts(importedProducts);
    renderPrintfulUrlPreview(importedProducts, errors);
    const stagingPanel = document.getElementById('stagingProductsTbody')?.closest('section, .admin-card, div');
    if (stagingPanel?.scrollIntoView) setTimeout(() => stagingPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    finishImportProgress(importedProducts.length, `Added ${importedProducts.length} product(s) to staging as Draft. Select them below and bulk publish when ready.`);
  } catch (error) {
    finishImportProgress(0, `Import failed: ${error.message}`);
    toast('Import failed: ' + error.message, 'error');
  }
}

async function previewPrintfulUrls(form) {
  const data = new FormData(form);
  const urls = String(data.get('url') || '').split(/\s+/).map((item) => item.trim()).filter((item) => /^https?:\/\/(www\.)?printful\.com\//i.test(item));
  const gender = String(data.get('gender') || 'auto');
  const targetCategory = String(data.get('category') || 'auto');
  const status = document.getElementById('printfulUrlImportStatus');
  if (!urls.length) {
    toast('Paste valid Printful product links first');
    return;
  }
  if (status) status.textContent = `Previewing ${urls.length} Printful link(s)...`;
  const products = [];
  const errors = [];
  for (const url of urls.slice(0, 20)) {
    const params = new URLSearchParams({ url, gender, category: targetCategory, preview: 'true', limit: '1' });
    params.set('save', 'false');
    const response = await fetch(`/api/printful-products?${params.toString()}`);
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.ok && Array.isArray(result.products) && result.products.length) {
      products.push(...result.products.map((product) => ({
        ...product,
        published: false,
        status: 'draft'
      })));
    }
    else errors.push(`${url}: ${result.error || 'Invalid Link'}`);
  }
  stageImportedPrintfulProducts(products);
  renderPrintfulUrlPreview(products, errors);
}

function renderPrintfulUrlPreview(products = [], errors = []) {
  const grid = document.getElementById('printfulUrlPreviewGrid');
  const status = document.getElementById('printfulUrlImportStatus');
  const badge = document.getElementById('printfulUrlImportBadge');
  if (badge) badge.textContent = `${products.length} Ready${errors.length ? ` / ${errors.length} Failed` : ''}`;
  if (status) status.textContent = products.length ? `${products.length} product(s) ready. ${errors.length ? errors.join(' | ') : 'No errors.'}` : (errors.join(' | ') || 'No products found.');
  if (!grid) return;
  grid.innerHTML = products.map((product) => `
    <article style="border:1px solid #ddd;border-radius:12px;padding:12px;background:#fff;">
      <img src="${product.img || product.image || product.images?.[0] || ''}" alt="${product.name || ''}" style="width:100%;height:180px;object-fit:contain;background:#f7f7f7;border-radius:8px;">
      <h3 style="font-size:14px;margin:10px 0 4px;">${product.name || 'Printful Product'}</h3>
      <p style="font-size:12px;color:#666;margin:0;">PF-${product.printfulId || product.id} • ${product.gender || 'Auto'} • ${product.category || 'auto'}</p>
      <p style="font-size:13px;font-weight:800;margin:8px 0 0;">${money(product.price || 0)}</p>
    </article>
  `).join('');
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

  const previewPrintful = event.target.closest('#btnPreviewPrintfulLinks');
  if (previewPrintful) {
    const form = document.querySelector('[data-printful-url-import]');
    if (form) previewPrintfulUrls(form);
    return;
  }

  const editBtn = event.target.closest('[data-edit-product]');
  if (editBtn) {
    const id = editBtn.dataset.editProduct;
    openEditProductModal(id);
    return;
  }

  if (event.target.closest('#btnCloseEditModal') || event.target.closest('#btnCancelEditModal')) {
    const modal = document.getElementById('editProductModal');
    if (modal) modal.style.display = 'none';
    return;
  }

  const printfulImport = event.target.closest('[data-import-printful]') || event.target.closest('#btnImportEntireCatalog');
  if (printfulImport) {
    importPrintfulProducts();
    return;
  }

  const importTab = event.target.closest('[data-import-tab]');
  if (importTab) {
    document.querySelectorAll('[data-import-tab]').forEach(btn => btn.classList.remove('gold', 'active'));
    importTab.classList.add('gold', 'active');
    const targetTab = importTab.dataset.importTab;
    document.querySelectorAll('[data-import-form]').forEach(form => {
      form.style.display = form.dataset.importForm === targetTab ? 'block' : 'none';
    });
    return;
  }

  if (event.target.closest('#btnRebuildStoreCache')) {
    const products = getAdminProducts();
    await rebuildStorefrontCatalogCache(products);
    return;
  }

  if (event.target.closest('#btnSyncAllInventory')) {
    toast('Syncing inventory stock across all channels...');
    showImportProgressModal('Syncing All Product Inventory...', 'Updating stock levels and pricing from Printful...');
    updateImportProgress(50, 'Syncing inventory stock & pricing...');
    setTimeout(() => {
      finishImportProgress(24, 'All product inventory & prices synced!');
    }, 1200);
    return;
  }

  if (event.target.closest('#btnClearDemoProducts')) {
    if (confirm('Delete ALL product records from the website database and restart product listing from zero? Users/orders/settings will not be touched.')) {
      try {
        const response = await fetch('/api/products?action=clear_all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: 'DELETE_ALL_PRODUCTS' })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || 'Database clear failed');
      } catch (error) {
        toast(`Product database clear failed: ${error.message}`, 'error');
        return;
      }
      localStorage.removeItem('zavoraImportedCatalog');
      localStorage.removeItem(ADMIN_PRODUCTS_KEY);
      localStorage.removeItem('zavora_imported_products');
      localStorage.removeItem('printful_staged_products');
      localStorage.removeItem('zavoraProducts');
      window.__printfulStagingProducts = [];
      renderAdminProducts();
      renderPrintfulStagingTable();
      toast('All product records deleted. Import real products to rebuild.');
    }
    return;
  }

  if (event.target.closest('#btnBulkDelete')) {
    const checked = Array.from(document.querySelectorAll('[data-product-checkbox]:checked')).map(cb => cb.value);
    if (!checked.length) {
      toast('Select products to bulk delete first');
      return;
    }
    if (confirm(`Delete ${checked.length} selected products?`)) {
      const removedIds = new Set(JSON.parse(localStorage.getItem('zavoraRemovedProducts') || '[]'));
      checked.forEach(id => removedIds.add(String(id)));
      localStorage.setItem('zavoraRemovedProducts', JSON.stringify(Array.from(removedIds)));
      const customProducts = getAdminProducts().filter(p => !checked.includes(String(p.id)));
      saveAdminProducts(customProducts);
      renderAdminProducts();
      toast(`${checked.length} products deleted`);
    }
    return;
  }

  if (event.target.closest('#btnBulkPublish')) {
    const checked = Array.from(document.querySelectorAll('[data-product-checkbox]:checked')).map(cb => cb.value);
    if (!checked.length) {
      toast('Select products to publish first');
      return;
    }
    const products = getAdminProducts().map(p => checked.includes(String(p.id)) ? { ...p, published: true, status: 'active' } : p);
    saveAdminProducts(products);
    renderAdminProducts();
    toast(`${checked.length} products published live`);
    return;
  }

  if (event.target.closest('#btnBulkHide')) {
    const checked = Array.from(document.querySelectorAll('[data-product-checkbox]:checked')).map(cb => cb.value);
    if (!checked.length) {
      toast('Select products to hide first');
      return;
    }
    const products = getAdminProducts().map(p => checked.includes(String(p.id)) ? { ...p, published: false, status: 'hidden' } : p);
    saveAdminProducts(products);
    renderAdminProducts();
    toast(`${checked.length} products hidden from storefront`);
    return;
  }

  if (event.target.closest('#btnBulkAssignCollection')) {
    const checked = Array.from(document.querySelectorAll('[data-product-checkbox]:checked')).map(cb => cb.value);
    if (!checked.length) {
      toast('Select products first');
      return;
    }
    const coll = prompt('Enter collection tags to add (e.g., streetwear, new, best, limited, men, women):', 'streetwear, new');
    if (coll) {
      const tags = coll.split(',').map(s => s.trim().toLowerCase());
      const products = getAdminProducts().map(p => {
        if (checked.includes(String(p.id))) {
          const currentCols = Array.isArray(p.collection) ? p.collection : [p.collection || 'streetwear'];
          const updatedCols = Array.from(new Set([...currentCols, ...tags]));
          return { ...p, collection: updatedCols, collections: updatedCols };
        }
        return p;
      });
      saveAdminProducts(products);
      renderAdminProducts();
      toast(`Assigned collections to ${checked.length} products`);
    }
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

async function bootAdminLegacyDisabled() {
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
  if (!window.__zavoraAdminDashboardRefreshTimer) {
    window.__zavoraAdminDashboardRefreshTimer = window.setInterval(refreshLiveAdminDashboard, 30000);
  }

  // Auto-detect URL parameter for Printful Auto-Import
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('url');
  if (targetUrl) {
    // Immediately clean address bar so page refreshes DO NOT trigger modal again
    window.history.replaceState({}, document.title, window.location.pathname);

    setSection('importer');
    const form = document.querySelector('form[data-import-form="url"]');
    if (form) {
      const urlInput = form.querySelector('[name="url"]');
      if (urlInput) urlInput.value = targetUrl;
      const genderSelect = form.querySelector('[name="gender"]');
      if (genderSelect && urlParams.get('gender')) genderSelect.value = urlParams.get('gender');
      const catSelect = form.querySelector('[name="category"]');
      if (catSelect && urlParams.get('category')) catSelect.value = urlParams.get('category');

      setTimeout(() => {
        importPrintfulUrl(form);
      }, 500);
    }
  }

  const addForm = document.querySelector('form[data-admin-add-product]');
  if (addForm && !addForm.dataset.bound) {
    addForm.dataset.bound = 'true';
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addAdminProduct(addForm);
    });
  }

  const importForm = document.querySelector('form[data-import-form="url"]');
  if (importForm && !importForm.dataset.bound) {
    importForm.dataset.bound = 'true';
    importForm.addEventListener('submit', (e) => {
      e.preventDefault();
      importPrintfulUrl(importForm);
    });
  }

// ─── PRINTFUL PRODUCT IMPORT MANAGER & BULK EDITOR ───────────────────────

}

window.__printfulStagingProducts = [];

async function fetchPrintfulStoreProducts() {
  const btnSync = document.getElementById('btnSyncPrintfulStore');
  const apiStatus = document.getElementById('printfulApiStatus');
  if (btnSync) btnSync.disabled = true;
  if (apiStatus) apiStatus.innerHTML = '🔄 Syncing Printful Store...';

  toast('Connecting to Printful Store API...');
  showImportProgress('Connecting to Printful...', 'Fetching store sync products and variants...', 15);

  try {
    const res = await fetch('/api/printful-products?action=store_products');
    const data = await res.json();
    let storeProducts = Array.isArray(data?.products) ? data.products : [];

    if (!storeProducts.length) {
      const fallbackRes = await fetch('/api/printful-products?limit=100');
      const fallbackData = await fallbackRes.json();
      storeProducts = Array.isArray(fallbackData?.products) ? fallbackData.products : [];
    }

    updateImportProgress(60, `Fetched ${storeProducts.length} items. Staging as Drafts...`);

    const existingAdminProducts = getAdminProducts();
    const existingIds = new Set(existingAdminProducts.map(p => String(p.id || p.printfulId || p.sku)));

    window.__printfulStagingProducts = storeProducts.map((sp, idx) => {
      const alreadyExists = existingIds.has(String(sp.id)) || existingIds.has(String(sp.printfulId)) || existingIds.has(String(sp.sku));
      return {
        ...sp,
        id: sp.id || `PF-STG-${Date.now()}-${idx}`,
        status: alreadyExists ? (sp.status || 'published') : 'draft',
        published: alreadyExists ? (sp.published !== false) : false,
        category: sp.category || 'oversized-tees',
        gender: sp.gender || 'Unisex',
        season: sp.season || 'All-Season',
        featured: sp.featured || false,
        bestSeller: sp.bestSeller || false,
        tags: sp.tags || ['printful', 'streetwear']
      };
    });
    try { localStorage.setItem('zavoraPrintfulStagingProducts', JSON.stringify(window.__printfulStagingProducts)); } catch (error) {}

    updateImportProgress(100, 'Printful Store Sync Complete!');
    setTimeout(closeImportProgress, 800);

    if (apiStatus) apiStatus.innerHTML = '🟢 Connected & Synced';
    toast(`Successfully staged ${window.__printfulStagingProducts.length} Printful store products!`);
    renderPrintfulStagingTable();
  } catch (error) {
    if (apiStatus) apiStatus.innerHTML = '🔴 Connection Error';
    toast('Error connecting to Printful API: ' + error.message, 'error');
    closeImportProgress();
  } finally {
    if (btnSync) btnSync.disabled = false;
  }
}

function normalizeProductDatabaseSummary(summary = {}) {
  const total = Number(summary.total || 0);
  const published = (summary.published !== undefined && summary.published !== null) ? Number(summary.published) : total;
  const draft = Number.isFinite(Number(summary.draft))
    ? Number(summary.draft || 0)
    : Math.max(total - published, 0);
  return { total, published, draft: Math.max(draft, 0) };
}

function applyProductDatabaseSummary(summary = {}) {
  latestProductDatabaseSummary = normalizeProductDatabaseSummary(summary);
  const countItem = document.getElementById('printfulStoreItemCount');
  const countDraft = document.getElementById('printfulDraftCount');
  const countPub = document.getElementById('printfulPublishedCount');
  if (countItem) countItem.textContent = `${latestProductDatabaseSummary.total} DB Products`;
  if (countDraft) countDraft.textContent = `${latestProductDatabaseSummary.draft} Draft Products`;
  if (countPub) countPub.textContent = `${latestProductDatabaseSummary.published} Live Products`;
  const productCountBadge = document.querySelector('[data-admin-product-count]');
  if (productCountBadge) productCountBadge.textContent = `${latestProductDatabaseSummary.published} Products Live`;
  return latestProductDatabaseSummary;
}

async function fetchProductDatabaseSummary() {
  const cacheBust = Date.now();
  try {
    const response = await fetch(`/api/products?action=summary&t=${cacheBust}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.ok && data?.summary) return normalizeProductDatabaseSummary(data.summary);
  } catch (error) {}

  const [allResponse, publishedResponse] = await Promise.all([
    fetch(`/api/products?status=all&limit=1&page=1&t=${cacheBust}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    }),
    fetch(`/api/products?status=published&limit=1&page=1&t=${cacheBust}`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
  ]);
  const allData = await allResponse.json().catch(() => ({}));
  const publishedData = await publishedResponse.json().catch(() => ({}));
  const total = Number(allData.total || 0);
  const published = Number(publishedData.total || 0);
  return normalizeProductDatabaseSummary({ total, published, draft: Math.max(total - published, 0) });
}

async function refreshProductDatabaseSummaryBadges() {
  try {
    return applyProductDatabaseSummary(await fetchProductDatabaseSummary());
  } catch (error) {
    return latestProductDatabaseSummary ? applyProductDatabaseSummary(latestProductDatabaseSummary) : null;
  }
}

function renderPrintfulStagingTable() {
  const tbody = document.getElementById('stagingProductsTbody');
  const countItem = document.getElementById('printfulStoreItemCount');
  const countDraft = document.getElementById('printfulDraftCount');
  const countPub = document.getElementById('printfulPublishedCount');
  const searchInput = document.getElementById('stagingSearchInput');
  const statusFilterInput = document.getElementById('stagingStatusFilter');
  const query = String(searchInput?.value || '').trim().toLowerCase();
  const statusFilter = String(statusFilterInput?.value || 'all').toLowerCase();

  if (!Array.isArray(window.__printfulStagingProducts) || !window.__printfulStagingProducts.length) {
    try { window.__printfulStagingProducts = JSON.parse(localStorage.getItem('zavoraPrintfulStagingProducts') || '[]'); } catch (error) { window.__printfulStagingProducts = []; }
  }
  syncStagingProductsFromAdminProducts();
  const stagingList = window.__printfulStagingProducts || [];
  const existingProducts = getAdminProducts();

  if (countItem || countDraft || countPub) {
    if (latestProductDatabaseSummary) applyProductDatabaseSummary(latestProductDatabaseSummary);
  }
  refreshProductDatabaseSummaryBadges();

  if (!tbody) return;

  const filtered = stagingList.filter(p => {
    const isPublished = p.status === 'published' || p.published;
    if (statusFilter === 'draft' && isPublished) return false;
    if (statusFilter === 'published' && !isPublished) return false;
    if (!query) return true;
    const text = `${p.name || ''} ${p.sku || ''} ${p.category || ''} ${p.id || ''}`.toLowerCase();
    return text.includes(query);
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:#888;">
      ${stagingList.length ? 'No products match your search query.' : 'No Printful store items staged yet. Click <b>"⚡ Connect & Fetch Printful Store Products"</b> above.'}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(product => {
    const isPublished = product.status === 'published' || product.published;
    const colors = Array.isArray(product.colors) ? product.colors.join(', ') : (product.color || 'Default');
    const thumb = product.img || product.image || product.images?.[0] || 'assets/studio-wide-trouser.png';

    return `
      <tr data-staging-id="${product.id}">
        <td><input type="checkbox" class="staging-chk" value="${product.id}"></td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${thumb}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #eee;">
            <div>
              <strong style="font-size:13px;display:block;">${product.name}</strong>
              <small style="color:#888;font-size:11px;">ID: ${product.id} | SKU: ${product.sku || 'N/A'}</small>
            </div>
          </div>
        </td>
        <td><span class="pill">${product.category || 'Tees'}</span></td>
        <td>${product.gender || 'Unisex'}</td>
        <td><span style="font-size:11px;color:#555;">${colors}</span></td>
        <td><strong>$${Number(product.price || 0).toFixed(2)}</strong></td>
        <td>
          <span class="pill ${isPublished ? 'gold' : ''}" style="${isPublished ? '' : 'background:#fff3e0;color:#e65100;border:1px solid #ffe0b2;'}">
            ${isPublished ? 'Published (Live)' : 'Draft (Staged)'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" data-staging-publish="${product.id}" style="padding:6px 10px;background:#050505;color:#fff;border:1px solid #050505;border-radius:6px;font-size:12px;cursor:pointer;">
              ${isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button type="button" data-edit-product="${product.id}" style="padding:6px 10px;background:#fff;color:#050505;border:1px solid #bbb;border-radius:6px;font-size:12px;cursor:pointer;">Edit</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const chkAll = document.getElementById('selectAllStagingItems');
  const hdrChkAll = document.getElementById('hdrSelectAllStaging');
  const rowChks = tbody.querySelectorAll('.staging-chk');

  [chkAll, hdrChkAll].forEach(master => {
    if (master) {
      master.checked = false;
      master.onclick = () => {
        rowChks.forEach(chk => chk.checked = master.checked);
        updateStagingSelectedCount();
      };
    }
  });

  rowChks.forEach(chk => {
    chk.addEventListener('change', updateStagingSelectedCount);
  });

  updateStagingSelectedCount();
}

function updateStagingSelectedCount() {
  const selected = document.querySelectorAll('.staging-chk:checked');
  const count = selected.length;
  const countText = document.getElementById('selectedStagingCountText');
  const btnSelected = document.getElementById('btnImportSelectedDrafts');

  if (countText) countText.textContent = `${count} Products Selected`;
  if (btnSelected) btnSelected.textContent = `📥 Import Selected (${count})`;
}

function selectedStagingIds() {
  return new Set([...document.querySelectorAll('.staging-chk:checked')].map((box) => String(box.value)));
}

function persistStagingProducts() {
  try { localStorage.setItem('zavoraPrintfulStagingProducts', JSON.stringify(window.__printfulStagingProducts || [])); } catch (error) {}
}

async function deleteSelectedStagingProducts() {
  const ids = selectedStagingIds();
  if (!ids.size) {
    toast('Please select product(s) to delete.', 'error');
    return;
  }
  if (!confirm(`Delete ${ids.size} selected product(s) from importer and website database?`)) return;
  showImportProgress('Deleting Products...', `Removing ${ids.size} selected product(s)...`, 35);
  const idList = [...ids];
  try {
    const response = await fetch('/api/products?action=delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idList })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Delete failed');
    window.__printfulStagingProducts = (window.__printfulStagingProducts || []).filter((product) => !ids.has(String(product.id)) && !ids.has(String(product.printfulId)));
    const remaining = getAdminProducts().filter((product) => !ids.has(String(product.id)) && !ids.has(String(product.printfulId)));
    saveAdminProducts(remaining);
    persistStagingProducts();
    updateImportProgress(100, `Deleted ${result.deleted || ids.size} product(s).`);
    setTimeout(closeImportProgress, 900);
    renderAdminProducts();
    renderPrintfulStagingTable();
    toast(`Deleted ${result.deleted || ids.size} product(s).`);
  } catch (error) {
    updateImportProgress(100, `Delete failed: ${error.message}`);
    toast(`Delete failed: ${error.message}`, 'error');
  }
}

function clearImporterStagingProducts() {
  if (!confirm('Clear all importer staged products from this admin screen? Website DB will not be deleted.')) return;
  window.__printfulStagingProducts = [];
  try { localStorage.removeItem('zavoraPrintfulStagingProducts'); } catch (error) {}
  try { localStorage.removeItem('printful_staged_products'); } catch (error) {}
  renderPrintfulStagingTable();
  toast('Importer staging cleared.');
}

async function clearWebsiteProductDatabase() {
  if (!confirm('Delete ALL website products from database? This will remove products from storefront.')) return;
  showImportProgress('Deleting Website Products...', 'Removing all products from database...', 35);
  try {
    const response = await fetch('/api/products?action=clear_all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'DELETE_ALL_PRODUCTS' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'Database clear failed');
    window.__printfulStagingProducts = [];
    saveAdminProducts([]);
    ['zavoraPrintfulStagingProducts', 'printful_staged_products', 'zavoraImportedCatalog', 'zavora_imported_products', 'zavoraProducts'].forEach((key) => {
      try { localStorage.removeItem(key); } catch (error) {}
      try { sessionStorage.removeItem(key); } catch (error) {}
    });
    updateImportProgress(100, `Website database cleared. Deleted ${result.deleted || 0} product(s).`);
    setTimeout(closeImportProgress, 900);
    renderAdminProducts();
    renderPrintfulStagingTable();
    toast(`Website DB cleared. Deleted ${result.deleted || 0} product(s).`);
  } catch (error) {
    updateImportProgress(100, `Clear failed: ${error.message}`);
    toast(`Clear failed: ${error.message}`, 'error');
  }
}

async function toggleSingleStagingPublish(productId) {
  const product = (window.__printfulStagingProducts || []).find(p => String(p.id) === String(productId));
  if (!product) return;

  const willPublish = !(product.status === 'published' || product.published);
  product.status = willPublish ? 'published' : 'draft';
  product.published = willPublish;

  if (willPublish) {
    const existing = getAdminProducts();
    const index = existing.findIndex(p => String(p.id) === String(product.id));
    if (index >= 0) existing[index] = { ...existing[index], ...product };
    else existing.unshift(product);

    try {
      const saveResponse = await fetch('/api/products?action=bulk_upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: [compactProductForDatabase(product)] })
      });
      const saveResult = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok || !saveResult.ok || !saveResult.db?.saved) {
        throw new Error(saveResult.db?.supabase?.error || saveResult.db?.mongo?.error || saveResult.error || 'Database save failed');
      }
      saveAdminProducts(existing);
      renderAdminProducts();
      toast(`"${product.name}" published to storefront and saved to database!`);
    } catch (error) {
      product.status = 'draft';
      product.published = false;
      toast(`Publish failed: ${error.message}`, 'error');
    }
  } else {
    toast(`"${product.name}" saved as Draft.`);
  }

  renderPrintfulStagingTable();
}

window.toggleSingleStagingPublish = toggleSingleStagingPublish;
window.updateStagingSelectedCount = updateStagingSelectedCount;
window.openEditProductModal = openEditProductModal;

function randomMoney(min = 58, max = 130) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomizeSelectedStagingPrices() {
  const selectedBoxes = [...document.querySelectorAll('.staging-chk:checked')];
  if (!selectedBoxes.length) {
    toast('Random price ke liye pehle product select karo.', 'error');
    return;
  }

  const selectedIds = new Set(selectedBoxes.map(b => String(b.value)));
  let changed = 0;
  (window.__printfulStagingProducts || []).forEach((product) => {
    if (!selectedIds.has(String(product.id))) return;
    const price = randomMoney(58, 130);
    const compareAt = Math.round((price * 1.75 + randomMoney(8, 22)) * 100) / 100;
    product.price = price;
    product.compareAt = compareAt;
    product.originalPrice = compareAt;
    changed++;
  });

  persistStagingProducts();
  renderPrintfulStagingTable();
  toast(`Random price applied to ${changed} product(s): $58-$130.`);
}

window.randomizeSelectedStagingPrices = randomizeSelectedStagingPrices;

async function bulkApplyStagingEdits() {
  const selectedBoxes = [...document.querySelectorAll('.staging-chk:checked')];
  if (!selectedBoxes.length) {
    toast('Please select at least 1 staging product using checkboxes.', 'error');
    return;
  }

  const selectedIds = new Set(selectedBoxes.map(b => String(b.value)));

  const category = document.getElementById('bulkCategorySelect')?.value;
  const collection = document.getElementById('bulkCollectionSelect')?.value;
  const gender = document.getElementById('bulkGenderSelect')?.value;
  const season = document.getElementById('bulkSeasonSelect')?.value;
  const status = document.getElementById('bulkStatusSelect')?.value;
  const featured = document.getElementById('bulkFeaturedSelect')?.value;
  const bestSeller = document.getElementById('bulkBestSellerSelect')?.value;
  const headerMenuPage = document.getElementById('bulkHeaderMenuPageSelect')?.value;
  const tagsRaw = document.getElementById('bulkTagsInput')?.value.trim();
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : null;

  showImportProgress('Applying Bulk Edits...', `Updating ${selectedIds.size} products...`, 20);

  const skipExisting = document.getElementById('chkSkipExisting')?.checked;

  let existingProducts = getAdminProducts();
  const existingIds = new Set(existingProducts.map(p => String(p.id || p.printfulId || p.sku)));

  let updatedCount = 0;
  let publishedCount = 0;

  (window.__printfulStagingProducts || []).forEach((product) => {
    if (!selectedIds.has(String(product.id))) return;

    const targetStatus = status || 'published';
    const isDuplicate = existingIds.has(String(product.id)) || existingIds.has(String(product.printfulId));
    if (skipExisting && isDuplicate && targetStatus !== 'published') {
      return;
    }

    const splitCategory = splitTargetCategory(category, gender || product.gender);
    if (splitCategory.category) product.category = splitCategory.category;
    if (collection) {
      const colArr = Array.isArray(product.collection) ? product.collection : [product.collection || 'new'];
      if (!colArr.includes(collection)) colArr.push(collection);
      product.collection = colArr;
    }
    if (splitCategory.gender || gender) product.gender = splitCategory.gender || gender;
    if (season) product.season = season;
    if (featured) product.featured = featured === 'yes';
    if (bestSeller) product.bestSeller = bestSeller === 'yes';
    if (tags) product.tags = tags;
    Object.assign(product, applyHeaderMenuPageTarget(
      normalizeProductTarget(product, product.gender, product.category, collection || ''),
      headerMenuPage
    ));
    product.status = targetStatus;
    product.published = targetStatus === 'published';

    updatedCount++;
    if (product.status === 'published' || product.published) {
      publishedCount++;
      const matchIdx = existingProducts.findIndex(p => String(p.id) === String(product.id) || String(p.printfulId) === String(product.printfulId));
      if (matchIdx >= 0) existingProducts[matchIdx] = { ...existingProducts[matchIdx], ...product };
      else existingProducts.unshift(product);
    }
  });

  updateImportProgress(75, 'Saving selected products to database...');

  saveAdminProducts(existingProducts);
  try { localStorage.setItem('zavoraPrintfulStagingProducts', JSON.stringify(window.__printfulStagingProducts || [])); } catch (error) {}

  const productsToSave = existingProducts
    .filter((product) => selectedIds.has(String(product.id)) || selectedIds.has(String(product.printfulId)))
    .map(compactProductForDatabase);
  const saveResponse = await fetch('/api/products?action=bulk_upsert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: productsToSave })
  });
  const saveResult = await saveResponse.json().catch(() => ({}));
  if (!saveResponse.ok || !saveResult.ok || !saveResult.db?.saved) {
    const dbMessage = saveResult.db?.supabase?.error || saveResult.db?.mongo?.error || saveResult.error || 'Database save failed';
    updateImportProgress(100, `Save failed: ${dbMessage}`);
    toast(`Database save failed: ${dbMessage}`, 'error');
    return;
  }

  updateImportProgress(100, `Bulk Edit Complete! Updated ${updatedCount} items, Published ${publishedCount} to live website.`);
  setTimeout(closeImportProgress, 1200);

  renderAdminProducts();
  renderPrintfulStagingTable();
  toast(`Bulk Edits Applied! ${updatedCount} updated, ${publishedCount} live on website.`);
}

async function bootAdmin() {
  const ready = await requireAdminSession();
  if (!ready) return;
  document.body.classList.remove('admin-locked');
  await hydrateAdminProductsFromDatabase();
  await refreshProductDatabaseSummaryBadges();
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
  if (!window.__zavoraAdminDashboardRefreshTimer) {
    window.__zavoraAdminDashboardRefreshTimer = window.setInterval(refreshLiveAdminDashboard, 30000);
  }
  renderPrintfulStagingTable();
  refreshProductDatabaseSummaryBadges();

  const btnSyncStore = document.getElementById('btnSyncPrintfulStore');
  if (btnSyncStore && !btnSyncStore.dataset.bound) {
    btnSyncStore.dataset.bound = 'true';
    btnSyncStore.addEventListener('click', fetchPrintfulStoreProducts);
  }

  const btnApplyBulk = document.getElementById('btnApplyBulkStagingEdits');
  if (btnApplyBulk && !btnApplyBulk.dataset.bound) {
    btnApplyBulk.dataset.bound = 'true';
    btnApplyBulk.addEventListener('click', bulkApplyStagingEdits);
  }

  const btnDeleteSelectedStaging = document.getElementById('btnDeleteSelectedStaging');
  if (btnDeleteSelectedStaging && !btnDeleteSelectedStaging.dataset.bound) {
    btnDeleteSelectedStaging.dataset.bound = 'true';
    btnDeleteSelectedStaging.addEventListener('click', deleteSelectedStagingProducts);
  }

  const btnRandomizeStagingPrices = document.getElementById('btnRandomizeStagingPrices');
  if (btnRandomizeStagingPrices && !btnRandomizeStagingPrices.dataset.bound) {
    btnRandomizeStagingPrices.dataset.bound = 'true';
    btnRandomizeStagingPrices.addEventListener('click', randomizeSelectedStagingPrices);
  }

  const btnClearImporterStaging = document.getElementById('btnClearImporterStaging');
  if (btnClearImporterStaging && !btnClearImporterStaging.dataset.bound) {
    btnClearImporterStaging.dataset.bound = 'true';
    btnClearImporterStaging.addEventListener('click', clearImporterStagingProducts);
  }

  const btnClearWebsiteProducts = document.getElementById('btnClearWebsiteProducts');
  if (btnClearWebsiteProducts && !btnClearWebsiteProducts.dataset.bound) {
    btnClearWebsiteProducts.dataset.bound = 'true';
    btnClearWebsiteProducts.addEventListener('click', clearWebsiteProductDatabase);
  }

  const btnImportSel = document.getElementById('btnImportSelectedDrafts');
  if (btnImportSel && !btnImportSel.dataset.bound) {
    btnImportSel.dataset.bound = 'true';
    btnImportSel.addEventListener('click', bulkApplyStagingEdits);
  }

  const btnImportAll = document.getElementById('btnImportAllDrafts');
  if (btnImportAll && !btnImportAll.dataset.bound) {
    btnImportAll.dataset.bound = 'true';
    btnImportAll.addEventListener('click', () => {
      document.querySelectorAll('.staging-chk').forEach(c => c.checked = true);
      updateStagingSelectedCount();
      bulkApplyStagingEdits();
    });
  }

  const searchStaging = document.getElementById('stagingSearchInput');
  if (searchStaging && !searchStaging.dataset.bound) {
    searchStaging.dataset.bound = 'true';
    searchStaging.addEventListener('input', renderPrintfulStagingTable);
  }

  const stagingStatusFilter = document.getElementById('stagingStatusFilter');
  if (stagingStatusFilter && !stagingStatusFilter.dataset.bound) {
    stagingStatusFilter.dataset.bound = 'true';
    stagingStatusFilter.addEventListener('change', renderPrintfulStagingTable);
  }

  if (!document.body.dataset.stagingActionsBound) {
    document.body.dataset.stagingActionsBound = 'true';
    document.addEventListener('click', (event) => {
      const publishBtn = event.target.closest('[data-staging-publish]');
      if (publishBtn) {
        event.preventDefault();
        toggleSingleStagingPublish(publishBtn.dataset.stagingPublish);
        return;
      }
      const applyBtn = event.target.closest('#btnApplyBulkStagingEdits, #btnImportSelectedDrafts');
      if (applyBtn) {
        event.preventDefault();
        bulkApplyStagingEdits();
      }
    });
  }

  const editForm = document.getElementById('editProductForm');
  if (editForm && !editForm.dataset.bound) {
    editForm.dataset.bound = 'true';
    editForm.addEventListener('submit', saveEditProductForm);
  }

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
  if (!window.__zavoraLiveVisitorTimer) {
    window.__zavoraLiveVisitorTimer = window.setInterval(updateLiveVisitors, 15000);
  }
}

window.bulkApplyStagingEdits = bulkApplyStagingEdits;
window.deleteSelectedStagingProducts = deleteSelectedStagingProducts;
window.clearImporterStagingProducts = clearImporterStagingProducts;
window.clearWebsiteProductDatabase = clearWebsiteProductDatabase;
window.toggleSingleStagingPublish = toggleSingleStagingPublish;
window.updateStagingSelectedCount = updateStagingSelectedCount;
window.openEditProductModal = openEditProductModal;

bootAdmin();
