const sectionTitles = {
  dashboard: 'Zavora Dashboard',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  payments: 'Payments',
  shipping: 'Shipping',
  coupons: 'Coupons',
  wishlist: 'Wishlist',
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
const ADMIN_EMAIL_KEY = 'zavoraAdminEmail';
const ADMIN_PRODUCTS_KEY = 'zavoraAdminProducts';
const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';

document.body.classList.remove('admin-locked');

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
    cards[1].querySelector('span').textContent = 'Live Products';
    cards[1].querySelector('strong').textContent = String(stats.products || 0);
    cards[1].querySelector('small').textContent = 'Imported from Printful Catalog';
  }
  if (cards[2]) {
    cards[2].querySelector('span').textContent = 'Categories';
    cards[2].querySelector('strong').textContent = String(Object.keys(stats.categories || {}).length);
    cards[2].querySelector('small').textContent = 'Auto mapped to Zavora pages';
  }
  if (cards[3]) {
    cards[3].querySelector('strong').textContent = String(stats.lowStock || 0);
    cards[3].querySelector('small').textContent = 'Limited stock watch';
  }
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
    toast('Importing 500+ Printful catalog products...');
    const response = await fetch('/api/admin?action=auto-import-printful&pages=9&limit=60');
    const data = await response.json();
    if (!response.ok && response.status !== 207) {
      toast(data.error || 'Printful import failed');
      return;
    }
    await refreshLiveAdminDashboard();
    toast(`${data.importedCount || 0} Printful products imported to Supabase`);
  } catch (error) {
    toast('Printful import failed');
  }
}

document.addEventListener('click', async (event) => {
  if (event.target.closest('.logout-btn')) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
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
  if (!form) return;
  event.preventDefault();
  addAdminProduct(form);
});

document.addEventListener('input', (event) => {
  if (event.target?.id !== 'adminSearch') return;
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.admin-section.active .admin-card, .admin-section.active tbody tr').forEach((item) => {
    item.style.display = !query || item.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
});

renderQuickPanels();
renderAdminProducts();
setSection(window.location.hash.replace('#', '') || 'dashboard');
refreshLiveAdminDashboard();
window.setInterval(refreshLiveAdminDashboard, 30000);
