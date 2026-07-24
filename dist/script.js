function initHomeLaunchGate() {
  return false;
}

if (!initHomeLaunchGate()) {
const products = [
  {
    id: 1,
    name: 'Noir Oversized Hoodie',
    category: 'hoodies',
    collection: ['new', 'oversized', 'best'],
    color: 'black',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 148,
    sale: false,
    popularity: 98,
    badge: 'Best seller',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 2,
    name: 'Gold Label Tee',
    category: 'tees',
    collection: ['new', 'trending'],
    color: 'white',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 64,
    sale: true,
    popularity: 82,
    badge: 'Sale',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 3,
    name: 'Avenue Cargo Pant',
    category: 'pants',
    collection: ['trending', 'best'],
    color: 'gray',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 132,
    sale: false,
    popularity: 91,
    badge: 'Trending',
    img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 4,
    name: 'Zavora Cropped Jacket',
    category: 'outerwear',
    collection: ['limited', 'new'],
    color: 'black',
    sizes: ['XS', 'S', 'M'],
    price: 286,
    sale: false,
    popularity: 88,
    badge: 'Limited',
    img: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 5,
    name: 'Monogram Cap',
    category: 'accessories',
    collection: ['best', 'trending'],
    color: 'black',
    sizes: ['M', 'L'],
    price: 52,
    sale: true,
    popularity: 79,
    badge: '20% off',
    img: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 6,
    name: 'Ivory Heavyweight Tee',
    category: 'tees',
    collection: ['oversized', 'best'],
    color: 'white',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 78,
    sale: false,
    popularity: 86,
    badge: 'Core',
    img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 7,
    name: 'Gold Chain Belt',
    category: 'accessories',
    collection: ['limited'],
    color: 'gold',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 118,
    sale: false,
    popularity: 71,
    badge: 'Gift pick',
    img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 8,
    name: 'Studio Wide Trouser',
    category: 'pants',
    collection: ['new', 'oversized'],
    color: 'black',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 168,
    sale: false,
    popularity: 83,
    badge: 'New',
    img: 'https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 9,
    name: 'Cropped Zip Hoodie',
    category: 'hoodies',
    collection: ['new', 'limited'],
    color: 'gray',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 124,
    sale: false,
    popularity: 84,
    badge: 'New',
    img: 'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 10,
    name: 'Heavyweight Box Tee',
    category: 'tees',
    collection: ['new', 'best'],
    color: 'white',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 86,
    sale: false,
    popularity: 89,
    badge: 'Heavyweight',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 11,
    name: 'Washed Cargo Trouser',
    category: 'pants',
    collection: ['trending', 'oversized'],
    color: 'gray',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 152,
    sale: false,
    popularity: 87,
    badge: 'Trending',
    img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 12,
    name: 'Nylon Track Jacket',
    category: 'outerwear',
    collection: ['limited', 'best'],
    color: 'black',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 218,
    sale: false,
    popularity: 92,
    badge: 'Best seller',
    img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 13,
    name: 'Baby Rib Tee',
    category: 'tees',
    collection: ['new', 'trending'],
    color: 'white',
    sizes: ['XS', 'S', 'M', 'L'],
    price: 58,
    sale: false,
    popularity: 78,
    badge: 'Women edit',
    img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 14,
    name: 'Oversized Graphic Tee',
    category: 'tees',
    collection: ['oversized', 'new'],
    color: 'white',
    sizes: ['S', 'M', 'L', 'XL'],
    price: 74,
    sale: false,
    popularity: 81,
    badge: 'Oversized',
    img: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 15,
    name: 'Wide Leg Sweatpant',
    category: 'pants',
    collection: ['best', 'oversized'],
    color: 'gray',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    price: 118,
    sale: false,
    popularity: 85,
    badge: 'Core',
    img: 'https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 16,
    name: 'Minimal Coach Jacket',
    category: 'outerwear',
    collection: ['new', 'limited'],
    color: 'black',
    sizes: ['S', 'M', 'L'],
    price: 196,
    sale: false,
    popularity: 80,
    badge: 'Limited',
    img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 17,
    name: 'Gold Logo Beanie',
    category: 'accessories',
    collection: ['new', 'best'],
    color: 'black',
    sizes: ['M', 'L'],
    price: 46,
    sale: false,
    popularity: 76,
    badge: 'Gift pick',
    img: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80'
  },
  {
    id: 18,
    name: 'Luxury Tote Bag',
    category: 'accessories',
    collection: ['trending', 'limited'],
    color: 'black',
    sizes: ['M'],
    price: 96,
    sale: false,
    popularity: 77,
    badge: 'Zavora',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
    alt: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=80'
  }
];

const CART_KEY = 'zavoraCart';
const ADMIN_PRODUCTS_KEY = 'zavoraAdminProducts';
const SELECTED_PRODUCT_KEY = 'zavoraSelectedProduct';
const WISHLIST_KEY = 'zavoraWishlist';
const state = { cart: [], visible: 23, printfulProducts: [], printfulLoaded: false };
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
  image.src = 'assets/studio-wide-trouser.png';
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

function getAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function normalizeAdminProduct(product, index) {
  const image = product.image || product.img || 'assets/studio-wide-trouser.png';
  return {
    id: Number(product.id || Date.now() + index),
    name: product.name || 'Zavora Preview Product',
    category: product.category || 'new',
    collection: [product.collection || 'new', 'new'],
    color: product.color || 'black',
    sizes: product.sizes || ['S', 'M', 'L', 'XL'],
    price: Number(product.price || 0),
    sale: false,
    popularity: 100,
    badge: product.badge || 'New',
    img: image,
    alt: product.alt || image,
    description: product.description || 'A premium Zavora Fashion piece prepared from the admin product preview.'
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

function getHomeProducts() {
  return uniqueHomeProducts([...getAdminProducts().map(normalizeAdminProduct), ...state.printfulProducts]).map((product) => ({
    ...product,
    img: product.img || product.image || product.images?.[0] || 'assets/studio-wide-trouser.png',
    alt: product.alt || product.images?.[1] || product.image || product.img || product.images?.[0] || 'assets/studio-wide-trouser.png',
    collection: Array.isArray(product.collection) ? product.collection : [product.collection || 'new'],
    colors: Array.isArray(product.colors) && product.colors.length ? product.colors : [product.color || 'default'],
    sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ['S', 'M', 'L', 'XL']
  }));
}

async function loadPrintfulProducts() {
  try {
    let products = [];
    try {
      const responses = await Promise.all(['men', 'women'].map((gender) => fetch(`/api/products?gender=${gender}&limit=1000`).then((response) => response.json()).catch(() => ({ products: [] }))));
      products = responses.flatMap((data) => Array.isArray(data.products) ? data.products : []);
    } catch (error) {}
    if (!products.length) {
      const pages = await Promise.all(['men', 'women'].flatMap((gender) => [1, 2, 3, 4, 5, 6].map((page) => (
        fetch(`/api/printful-products?gender=${gender}&limit=60&page=${page}`)
          .then((response) => response.json())
          .then((data) => Array.isArray(data.products) ? data.products : [])
          .catch(() => [])
      ))));
      products = pages.flat();
    }
    state.printfulProducts = products;
    state.printfulLoaded = true;
    const daily = document.querySelector('.daily-feature');
    if (daily) daily.remove();
    renderDailyFeature();
    renderHomeProductSections();
    renderProducts();
    renderSuggestions($('#searchInput')?.value || '');
  } catch (error) {
    state.printfulProducts = [];
    state.printfulLoaded = true;
    renderHomeProductSections();
    renderProducts();
  }
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
        <img src="${product.img}" alt="${product.name}">
      </a>
    </section>
  `);
}

const homeShelfDefinitions = [
  { title: 'New Arrivals', href: 'new-arrivals.html', match: (product) => product.collection.includes('new') || /new/i.test(product.badge || '') },
  { title: 'Trending Now', href: 'trending.html', match: (product) => product.collection.includes('trending') || Number(product.popularity || 0) >= 84 },
  { title: 'Best Sellers', href: 'best-sellers.html', match: (product) => product.collection.includes('best') || Number(product.popularity || 0) >= 88 },
  { title: 'Premium Hoodies', href: 'shop.html?category=hoodies', match: (product) => ['hoodies', 'cropped-hoodies', 'zip-hoodies'].includes(product.category) },
  { title: 'Premium Sweatshirts', href: 'shop.html?category=sweatshirts', match: (product) => product.category === 'sweatshirts' },
  { title: 'Luxury T-Shirts', href: 'shop.html?category=tees', match: (product) => ['tees', 'oversized-tees', 'heavyweight-tees', 'baby-tees'].includes(product.category) },
  { title: 'Staff Picks', href: 'shop.html?sort=popular', match: (product, index) => index % 3 === 0 },
  { title: 'Recommended For You', href: 'recommended-products.html', match: (product) => Number(product.popularity || 0) >= 78 },
  { title: 'Recently Added', href: 'new-arrivals.html', match: (product, index) => index < 24 },
  { title: 'Limited Drop', href: 'limited.html', match: (product) => product.collection.includes('limited') || /limited/i.test(product.badge || '') },
  { title: 'Under $100', href: 'shop.html?under=100', match: (product) => Number(product.price || 0) <= 100 },
  { title: 'Premium Essentials', href: 'collections.html?collection=essentials', match: (product) => product.collection.includes('essentials') || product.collection.includes('streetwear') }
];

function renderHomeProductSections() {
  const container = document.querySelector('#homeProductSections');
  if (!container) return;
  const catalog = getHomeProducts();
  if (!catalog.length) {
    container.innerHTML = '<p class="catalog-loading">Loading Zavora product edits...</p>';
    return;
  }
  const used = new Set();
  container.innerHTML = homeShelfDefinitions.map((section, sectionIndex) => {
    let items = catalog
      .filter((product, index) => section.match(product, index))
      .filter((product) => !used.has(String(product.printfulId || product.id || product.name)))
      .slice(0, 10);
    items.forEach((product) => used.add(String(product.printfulId || product.id || product.name)));
    if (items.length < 4) {
      const fallback = uniqueHomeProducts([...items, ...catalog.slice(sectionIndex * 4, sectionIndex * 4 + 10)]).slice(0, 10);
      fallback.forEach((product) => {
        const key = String(product.printfulId || product.id || product.name);
        used.add(key);
      });
      items = fallback;
    }
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
  }).join('');
}

function renderProducts() {
  const category = $('#categoryFilter').value;
  const collection = $('#collectionFilter').value;
  const color = $('#colorFilter').value;
  const size = $('#sizeFilter').value;
  const under = Number($('#priceFilter').value);
  const sale = $('#saleFilter').checked;
  const sort = $('#sortFilter').value;

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
    return b.id - a.id;
  });

  $('#productCount').textContent = filtered.length;
  if (!state.printfulLoaded && !filtered.length) {
    $('#productGrid').innerHTML = '<p class="catalog-loading">Loading Printful products...</p>';
    return;
  }
  $('#productGrid').innerHTML = filtered.length ? filtered.slice(0, state.visible).map(productCard).join('') : '<p class="catalog-loading">No Printful products found for this filter.</p>';
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
        <img src="${product.img}" alt="${product.name}">
        <img class="alt" src="${product.alt || product.img}" alt="${product.name} alternate view">
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

function addToCart(id) {
  const product = getHomeProducts().find(item => item.id === Number(id));
  if (!product) return;
  const found = state.cart.find(item => item.id === product.id);
  if (found) found.qty += 1;
  else state.cart.push({ ...product, qty: 1 });
  saveCart();
  renderCart();
  $('#cartDrawer').classList.add('open');
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
    state.cart = state.cart.filter(item => item.id !== Number(remove.dataset.remove));
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

$('#clearFilters').addEventListener('click', () => {
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

$('#loadMore').addEventListener('click', () => {
  state.visible += 4;
  renderProducts();
});

$('[data-cart]').addEventListener('click', () => $('#cartDrawer').classList.add('open'));
$('[data-close-cart]').addEventListener('click', () => $('#cartDrawer').classList.remove('open'));
$('[data-close-view]').addEventListener('click', () => $('#quickView').classList.remove('open'));
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
$('#megaMenu').addEventListener('mouseleave', () => $('#megaMenu').classList.remove('open'));

$('[data-recommend]').addEventListener('click', () => {
  $('#collectionFilter').value = 'best';
  $('#sortFilter').value = 'popular';
  location.hash = '#shop';
  renderProducts();
});

hydrateHomeHeaderIcons();
loadSavedCart();
renderDailyFeature();
renderProducts();
loadPrintfulProducts();
renderCart();
syncHomeWishlistCount();
}
