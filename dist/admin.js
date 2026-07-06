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

document.addEventListener('click', (event) => {
  if (event.target.closest('.logout-btn')) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
    window.location.href = '/api/admin-logout';
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
