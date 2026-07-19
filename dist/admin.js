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
  root.innerHTML = `
    <table class="admin-table affiliate-table">
      <thead><tr><th>Affiliate</th><th>Audience</th><th>Status</th><th>Commission</th><th>Link</th><th>Actions</th></tr></thead>
      <tbody>
        ${apps.map((app) => {
          const latestPayout = (app.payoutRequests || [])[0];
          return `
          <tr data-affiliate-id="${app.id}">
            <td><strong>${app.fullName || 'Applicant'}</strong><br><span>${app.email || ''}</span><br><small>${app.phone || ''} ${app.country || ''}</small></td>
            <td>${app.followers || '0'} followers<br><span>${app.monthlyTraffic || '0'} monthly traffic</span><br><small>${app.promotionMethod || ''}</small></td>
            <td><span class="pill ${app.status === 'approved' ? 'green' : app.status === 'pending' ? 'gold' : ''}">${app.status || 'pending'}</span></td>
            <td><input class="affiliate-commission-input" data-affiliate-commission="${app.id}" type="number" min="1" max="50" value="${app.commission || 10}">%</td>
            <td><code>${app.link || 'Pending approval'}</code><br><small>${app.coupon || ''}</small>${latestPayout ? `<br><small>Payout: ${latestPayout.status} / ${latestPayout.method} / $${Number(latestPayout.amount || 0).toFixed(2)}</small>` : ''}</td>
            <td class="affiliate-actions">
              <button data-affiliate-action="approve" data-affiliate-target="${app.id}">Approve</button>
              <button data-affiliate-action="reject" data-affiliate-target="${app.id}">Reject</button>
              <button data-affiliate-action="suspend" data-affiliate-target="${app.id}">Suspend</button>
              <button data-affiliate-action="reset-login" data-affiliate-target="${app.id}">Reset Login</button>
              <button data-affiliate-action="delete" data-affiliate-target="${app.id}">Delete</button>
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

function setSection(name) {
  const title = sectionTitles[name] || 'Zavora Admin';
  document.querySelector('[data-page-title]').textContent = title;
  document.querySelectorAll('[data-section]').forEach((button) => button.classList.toggle('active', button.dataset.section === name));
  document.querySelectorAll('[data-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  document.querySelector('[data-sidebar]')?.classList.remove('open');
  window.history.replaceState(null, '', `#${name}`);
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
  const savedProducts = getAdminProducts();
  const savedRows = savedProducts.map((product) => `
    <tr data-saved-product="${product.id}">
      <td>${product.name}<br><span>${product.sku}</span></td>
      <td>${product.category}</td>
      <td>Preview</td>
      <td><span class="pill green">Active</span></td>
      <td><button data-remove-product="${product.id}">Remove</button></td>
    </tr>
  `).join('');
  list.querySelectorAll('[data-saved-product]').forEach((row) => row.remove());
  list.insertAdjacentHTML('afterbegin', savedRows);
}

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function setStatCards(stats) {
  const cards = document.querySelectorAll('[data-panel="dashboard"] .stat-card');
  if (cards[0]) {
    cards[0].querySelector('strong').textContent = money(stats.revenuePreview || 0);
    cards[0].querySelector('small').textContent = 'Live product revenue preview';
  }
  if (cards[1]) {
    cards[1].querySelector('span').textContent = "Today's Orders";
    cards[1].querySelector('strong').textContent = String((stats.orders || []).filter((order) => {
      const created = new Date(order.createdAt || order.updatedAt || 0);
      return created.toDateString() === new Date().toDateString();
    }).length);
    cards[1].querySelector('small').textContent = `${(stats.orders || []).length} total live orders`;
  }
  if (cards[2]) {
    cards[2].querySelector('span').textContent = 'Total Customers';
    cards[2].querySelector('strong').textContent = String(stats.customers || 0);
    cards[2].querySelector('small').textContent = 'MongoDB account users';
  }
  if (cards[3]) {
    cards[3].querySelector('strong').textContent = String(stats.lowStock || 0);
    cards[3].querySelector('small').textContent = 'Limited stock watch';
  }
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

function renderLiveOrders(stats) {
  const body = document.querySelector('[data-panel="orders"] tbody');
  if (!body) return;
  const rows = Array.isArray(stats.orders) && stats.orders.length ? stats.orders : [];
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5">No live orders yet. New checkout orders will appear here automatically.</td></tr>';
    return;
  }
  body.innerHTML = rows.map((order) => `
    <tr data-admin-order="${order.id}">
      <td>${order.id}</td>
      <td>${order.customer || 'Zavora customer'}<br><span>${order.email || 'orders@zavorafashion.com'}</span></td>
      <td>${order.payment || order.method || 'Pending'}</td>
      <td>
        <select data-order-status>
          ${['Order confirmed', 'Packing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].map((status) => `<option ${String(order.status || '').includes(status) ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
        <input data-order-tracking value="${order.tracking || ''}" placeholder="Tracking number">
      </td>
      <td><button data-save-order="${order.id}">Save Update</button></td>
    </tr>
  `).join('');
}

async function refreshLiveAdminDashboard() {
  try {
    const response = await fetch('/api/admin?action=stats');
    const stats = await response.json();
    if (!response.ok || !stats.ok) return;
    setStatCards(stats);
    renderLiveTopProducts(stats.topProducts || []);
    renderLiveProductRows(stats.topProducts || []);
    renderLiveOrders(stats);
    renderRewardClaims(stats.rewardClaims || []);
    const bell = document.querySelector('.admin-icon-btn');
    if (bell) bell.textContent = `Live ${stats.products || 0}`;
  } catch (error) {}
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
    const email = row?.querySelector('td:nth-child(2) span')?.textContent.trim();
    const status = row?.querySelector('[data-order-status]')?.value || 'Order confirmed';
    const tracking = row?.querySelector('[data-order-tracking]')?.value.trim() || '';
    saveOrder.textContent = 'Saving...';
    const response = await fetch('/api/admin?action=orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: id,
        email,
        status,
        tracking,
        payment: row?.children[2]?.textContent.trim() || 'Pending'
      })
    }).catch(() => null);
    saveOrder.textContent = 'Save Update';
    toast(response?.ok ? 'Order tracking updated' : 'Order update failed');
    refreshLiveAdminDashboard();
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
    renderAdminProducts();
    toast('Product removed from preview');
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-admin-product-form]');
  const importer = event.target.closest('[data-printful-url-import]');
  if (form) {
    event.preventDefault();
    addAdminProduct(form);
    return;
  }
  if (importer) {
    event.preventDefault();
    importPrintfulUrl(importer);
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

async function bootAdmin() {
  const ready = await requireAdminSession();
  if (!ready) return;
  renderQuickPanels();
  renderAdminProducts();
  setSection(window.location.hash.replace('#', '') || 'dashboard');
  refreshLiveAdminDashboard();
  window.setInterval(refreshLiveAdminDashboard, 30000);
}

bootAdmin();
