(function () {
  const APP_KEY = 'zavoraAffiliateApplications';
  const SESSION_KEY = 'zavoraAffiliateSession';
  const ATTRIBUTION_KEY = 'zavoraAffiliateAttribution';
  const ORDER_KEY = 'zavoraOrders';
  const RESET_KEY = 'zavoraAffiliatePasswordReset';
  const MIN_PAYOUT = 5;

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readApps() {
    return readJson(APP_KEY, []);
  }

  function saveApps(apps) {
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
  }

  function mergeAffiliate(app) {
    if (!app?.id) return null;
    const apps = readApps();
    const index = apps.findIndex((item) => String(item.id) === String(app.id) || String(item.email || '').toLowerCase() === String(app.email || '').toLowerCase());
    if (index >= 0) apps[index] = { ...apps[index], ...app };
    else apps.unshift(app);
    saveApps(apps);
    return app;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  function percent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  function formatDate(value) {
    if (!value) return 'Not available';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function setMessage(form, message, isError) {
    const box = form?.querySelector('[data-affiliate-message]');
    if (!box) return;
    box.textContent = message;
    box.style.color = isError ? '#8b0000' : '#c9a227';
  }

  function setForgotMessage(form, message, isError) {
    const box = form?.querySelector('[data-affiliate-forgot-message]');
    if (!box) return;
    box.textContent = message;
    box.style.color = isError ? '#8b0000' : '#c9a227';
  }

  function tierFor(app) {
    const commission = Number(app.commission || 10);
    if (commission >= 20) return 'Elite Partner';
    if (commission >= 15) return 'Pro Partner';
    if (commission >= 12) return 'Growth Partner';
    return 'Launch Partner';
  }

  function affiliateCode(app) {
    return app.affiliateId || `ZAF-${String(app.email || app.id || Date.now()).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}${String(Date.now()).slice(-4)}`;
  }

  function affiliateCoupon(id) {
    return `${String(id || 'ZAF').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}10`;
  }

  async function submitApplication(form) {
    const data = new FormData(form);
    const app = Object.fromEntries(data.entries());
    if (!app.agree) {
      setMessage(form, 'Agree to terms before applying.', true);
      return;
    }
    const apps = readApps();
    const email = String(app.email || '').trim().toLowerCase();
    const password = String(app.password || '').trim();
    if (password.length < 6) {
      setMessage(form, 'Create a password with at least 6 characters.', true);
      return;
    }
    const existing = apps.find((item) => String(item.email || '').toLowerCase() === email);
    if (existing) {
      setMessage(form, 'Affiliate account already exists. Please login.', true);
      return;
    }
    const localId = uid('AFF');
    const localAffiliateId = affiliateCode({ ...app, id: localId, email });
    const draft = {
      ...app,
      email,
      password,
      id: localId,
      status: 'approved',
      affiliateId: localAffiliateId,
      commission: 10,
      coupon: affiliateCoupon(localAffiliateId),
      link: `https://www.zavorafashion.com/?ref=${encodeURIComponent(localAffiliateId)}`,
      clicks: 0,
      orders: 0,
      revenue: 0,
      pendingBalance: 0,
      paidBalance: 0,
      availableBalance: 0,
      approvedBalance: 0,
      lifetimeRevenue: 0,
      lifetimeCommission: 0,
      referralLinks: [],
      coupons: [],
      payoutRequests: [],
      notifications: [],
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setMessage(form, 'Creating affiliate account...');
    const response = await fetch('/api/affiliate?action=apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    }).catch(() => null);
    const result = await response?.json?.().catch(() => ({}));
    if (response?.ok && result?.app) {
      const saved = mergeAffiliate({ ...draft, ...result.app, password });
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        id: saved.id,
        email: saved.email,
        affiliateId: saved.affiliateId,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
      }));
      setMessage(form, result.message || 'Affiliate account created.');
      window.setTimeout(() => window.location.href = '/affiliate/dashboard#overview', 650);
      return;
    }
    setMessage(form, result?.error || 'Affiliate account could not be created. Please try again or contact affiliates@zavorafashion.com.', true);
  }

  async function login(form) {
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '').trim();
    setMessage(form, 'Checking affiliate access...');
    const response = await fetch('/api/affiliate?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).catch(() => null);
    const result = await response?.json?.().catch(() => ({}));
    const serverValidated = Boolean(response?.ok && result?.app);
    const app = serverValidated ? mergeAffiliate(result.app) : null;
    if (!app || app.status !== 'approved') {
      setMessage(form, result?.error || 'Affiliate account is not approved yet.', true);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: app.id,
      email: app.email,
      affiliateId: app.affiliateId,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }));
    window.location.href = '/affiliate/dashboard#overview';
  }

  function localAffiliateByEmail(email) {
    return readApps().find((item) => String(item.email || '').toLowerCase() === String(email || '').toLowerCase());
  }

  async function sendForgotOtp(form) {
    const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
    if (!email) {
      setForgotMessage(form, 'Enter your affiliate email first.', true);
      return;
    }
    setForgotMessage(form, 'Sending OTP...');
    const response = await fetch('/api/affiliate?action=forgot-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).catch(() => null);
    const result = await response?.json?.().catch(() => ({}));
    if (response?.ok && result?.ok) {
      setForgotMessage(form, result.message || 'OTP sent to your affiliate email.');
      return;
    }
    setForgotMessage(form, result?.error || 'Email OTP service is not ready. Please try again or contact affiliates@zavorafashion.com.', true);
  }

  async function resetPassword(form) {
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const otp = String(data.get('otp') || '').replace(/\D/g, '').slice(0, 6);
    const password = String(data.get('password') || '').trim();
    if (!email || otp.length !== 6 || password.length < 6) {
      setForgotMessage(form, 'Enter email, 6-digit OTP, and a new password with at least 6 characters.', true);
      return;
    }
    setForgotMessage(form, 'Updating password...');
    const response = await fetch('/api/affiliate?action=forgot-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password })
    }).catch(() => null);
    const result = await response?.json?.().catch(() => ({}));
    if (response?.ok && result?.ok) {
      const app = localAffiliateByEmail(email);
      if (app) {
        updateAffiliateRecord(app.id, (draft) => ({ ...draft, password }));
      }
      localStorage.removeItem(RESET_KEY);
      form.reset();
      setForgotMessage(form, 'Password updated. Login with your new password.');
      window.alert('Password updated. Login with your new password.');
      return;
    }
    setForgotMessage(form, result?.error || 'Invalid or expired OTP.', true);
  }

  function currentAffiliate() {
    const session = readJson(SESSION_KEY, null);
    if (!session || Date.now() > Number(session.expiresAt || 0)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return readApps().find((app) => app.id === session.id && app.status === 'approved') || null;
  }

  function updateAffiliateRecord(id, updater) {
    const apps = readApps();
    const index = apps.findIndex((item) => String(item.id) === String(id));
    if (index < 0) return null;
    apps[index] = updater({ ...apps[index] }) || apps[index];
    saveApps(apps);
    return apps[index];
  }

  function baseReferral(app) {
    return app.link || `https://www.zavorafashion.com/?ref=${encodeURIComponent(app.affiliateId || app.id)}`;
  }

  function qrUrl(value) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(value)}`;
  }

  function affiliateOrders(app) {
    const orders = [
      ...(app.referralOrders || []),
      ...readJson(ORDER_KEY, []).filter((order) => {
        const ref = order.affiliateRef || order.ref || order.affiliateId;
        return ref && String(ref) === String(app.affiliateId || app.id);
      })
    ];
    const seen = new Set();
    return orders.filter((order) => {
      const id = String(order.id || order.orderId || '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function calcStats(app) {
    const orders = affiliateOrders(app);
    const todayKey = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);
    const todayOrders = orders.filter((order) => String(order.createdAt || '').slice(0, 10) === todayKey);
    const monthOrders = orders.filter((order) => String(order.createdAt || '').slice(0, 7) === monthKey);
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || order.orderValue || 0), 0) || Number(app.revenue || app.lifetimeRevenue || 0);
    const commissionRate = Number(app.commission || 10);
    const lifetimeCommission = Number(app.lifetimeCommission || revenue * commissionRate / 100 || 0);
    const clicks = Number(app.clicks || 0);
    const orderCount = orders.length || Number(app.orders || 0);
    const averageOrderValue = orderCount ? revenue / orderCount : 0;
    return {
      orders,
      todayClicks: Number(app.todayClicks || 0),
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, order) => sum + Number(order.total || order.orderValue || 0), 0),
      todayCommission: todayOrders.reduce((sum, order) => sum + Number(order.total || order.orderValue || 0), 0) * commissionRate / 100,
      monthClicks: Number(app.monthClicks || clicks),
      monthOrders: monthOrders.length || orderCount,
      monthRevenue: monthOrders.reduce((sum, order) => sum + Number(order.total || order.orderValue || 0), 0) || revenue,
      monthEarnings: Number(app.monthEarnings || lifetimeCommission),
      pendingBalance: Number(app.pendingBalance || 0),
      approvedBalance: Number(app.approvedBalance || app.availableBalance || 0),
      paidBalance: Number(app.paidBalance || 0),
      lifetimeRevenue: revenue,
      lifetimeCommission,
      conversionRate: clicks ? (orderCount / clicks) * 100 : 0,
      averageOrderValue
    };
  }

  function prizeProgress(stats) {
    const sales = Number(stats.monthOrders || stats.orders?.length || 0);
    const prizes = [
      ['1st Prize', 'iPhone 19 launch phone', 50],
      ['2nd Prize', '$2,000 creator bonus', 20],
      ['3rd Prize', '$1,000 creator bonus', 10]
    ];
    return `
      <div class="affiliate-prize-grid">
        ${prizes.map(([label, prize, target]) => {
          const progress = Math.min(100, sales / target * 100);
          return `
            <article class="affiliate-prize-card">
              <span>${label}</span>
              <h3>${prize}</h3>
              <p>${sales}/${target} product sales</p>
              <div class="affiliate-progress"><i style="width:${progress}%"></i></div>
              <small>${progress >= 100 ? 'Target achieved. Zavora team will verify and contact you.' : `${target - sales} more sales to unlock.`}</small>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function leaderboardRows(currentApp) {
    const rows = readApps()
      .filter((app) => app.status === 'approved')
      .map((app) => {
        const stats = calcStats(app);
        return { app, stats, sales: Number(stats.monthOrders || stats.orders?.length || 0), revenue: Number(stats.monthRevenue || stats.lifetimeRevenue || 0) };
      })
      .sort((a, b) => b.sales - a.sales || b.revenue - a.revenue)
      .slice(0, 25);
    if (!rows.length) return emptyList('Leaderboard starts when affiliates begin tracking sales.');
    return `
      <div class="affiliate-table-wrap">
        <table class="affiliate-table">
          <thead><tr><th>Rank</th><th>Affiliate</th><th>Sales</th><th>Revenue</th><th>Prize Track</th></tr></thead>
          <tbody>
            ${rows.map((row, index) => {
              const track = row.sales >= 50 ? '1st Prize' : row.sales >= 20 ? '2nd Prize' : row.sales >= 10 ? '3rd Prize' : 'Building';
              const me = row.app.id === currentApp.id ? ' class="is-current-affiliate"' : '';
              return `<tr${me}><td>#${index + 1}</td><td>${escapeHtml(row.app.fullName || 'Zavora Partner')}</td><td>${row.sales}</td><td>${money(row.revenue)}</td><td>${track}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function metric(label, value) {
    return `<div class="affiliate-metric"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function chartBars(label, values) {
    const max = Math.max(1, ...values);
    return `
      <article class="affiliate-dash-card affiliate-chart-card">
        <h3>${label}</h3>
        <div class="affiliate-bars">
          ${values.map((value) => `<i style="height:${Math.max(4, (Number(value || 0) / max) * 100)}%"><span>${Number(value || 0).toFixed(0)}</span></i>`).join('')}
        </div>
      </article>
    `;
  }

  function emptyList(message) {
    return `<p class="affiliate-muted">${message}</p>`;
  }

  function payoutHistory(app) {
    const rows = app.payoutRequests || [];
    if (!rows.length) return emptyList('No payout requests yet.');
    return `
      <div class="affiliate-history-list">
        ${rows.map((row) => `
          <div>
            <strong>${money(row.amount)} via ${escapeHtml(row.method || 'PayPal')}</strong>
            <span>${escapeHtml(row.status || 'pending')} / ${formatDate(row.createdAt)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function ordersTable(orders, commission) {
    if (!orders.length) return emptyList('Referral orders appear here after tracked checkout.');
    return `
      <div class="affiliate-table-wrap">
        <table class="affiliate-table">
          <thead><tr><th>Order</th><th>Product</th><th>Country</th><th>Value</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${orders.map((order) => {
              const total = Number(order.total || order.orderValue || 0);
              return `<tr><td>${escapeHtml(order.id || order.orderId)}</td><td>${escapeHtml(order.product || order.item || 'Zavora order')}</td><td>${escapeHtml(order.country || 'USA')}</td><td>${money(total)}</td><td>${money(total * commission / 100)}</td><td>${escapeHtml(order.status || 'pending')}</td><td>${formatDate(order.createdAt)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function couponRows(app) {
    const coupons = app.coupons?.length ? app.coupons : [{ code: app.coupon, discount: 10, active: Boolean(app.coupon), usage: 0, sales: 0, revenue: 0 }];
    return coupons.filter((coupon) => coupon.code).map((coupon) => `
      <div class="affiliate-coupon-row">
        <strong>${escapeHtml(coupon.code)}</strong>
        <span>${coupon.active === false ? 'Disabled' : 'Active'} / ${Number(coupon.discount || 10)}% off</span>
        <span>Usage ${Number(coupon.usage || 0)} / Revenue ${money(coupon.revenue)}</span>
      </div>
    `).join('') || emptyList('No coupon assigned yet.');
  }

  function referralLinks(app) {
    const standard = [
      ['Homepage', baseReferral(app)],
      ['Men', `https://www.zavorafashion.com/men.html?ref=${encodeURIComponent(app.affiliateId || app.id)}`],
      ['Women', `https://www.zavorafashion.com/women.html?ref=${encodeURIComponent(app.affiliateId || app.id)}`],
      ['Collections', `https://www.zavorafashion.com/collections.html?ref=${encodeURIComponent(app.affiliateId || app.id)}`]
    ];
    const custom = app.referralLinks || [];
    return [...standard, ...custom.map((link) => [link.label || 'Custom', link.url])].map(([label, url]) => `
      <div class="affiliate-link-row">
        <span>${escapeHtml(label)}</span>
        <input value="${escapeHtml(url)}" readonly>
        <button data-copy="${escapeHtml(url)}">Copy</button>
      </div>
    `).join('');
  }

  function renderDashboard() {
    const root = document.querySelector('[data-affiliate-dashboard-content]');
    if (!root) return;
    const app = currentAffiliate();
    if (!app) {
      window.location.replace('/affiliate/login');
      return;
    }
    const activeHash = (window.location.hash || '#overview').replace('#', '') || 'overview';
    const sectionGroup = {
      overview: 'overview',
      stats: 'stats',
      charts: 'charts',
      links: 'links',
      coupons: 'coupons',
      payouts: 'payouts',
      prizes: 'prizes',
      orders: 'orders',
      assets: 'assets',
      leaderboard: 'leaderboard',
      notifications: 'notifications',
      profile: 'profile',
      support: 'support'
    }[activeHash] || 'overview';
    const stats = calcStats(app);
    const link = baseReferral(app);
    const status = app.status === 'approved' ? 'Active' : app.status || 'Pending';
    const commission = Number(app.commission || 10);
    document.querySelectorAll('.affiliate-side a[href*="#"]').forEach((item) => {
      const itemHash = item.hash.replace('#', '') || 'overview';
      item.classList.toggle('active', itemHash === activeHash);
    });
    root.innerHTML = `
      <section class="affiliate-dashboard-hero" id="overview" data-affiliate-section="overview">
        <div>
          <p class="affiliate-eyebrow">Affiliate Control Center</p>
          <h1>Welcome back, ${escapeHtml(app.fullName || 'Zavora Partner')}</h1>
          <div class="affiliate-status-grid">
            <span>Affiliate ID <strong>${escapeHtml(app.affiliateId || app.id)}</strong></span>
            <span>Status <strong>${escapeHtml(status)}</strong></span>
            <span>Commission <strong>${commission}%</strong></span>
            <span>Tier <strong>${tierFor(app)}</strong></span>
            <span>Member Since <strong>${formatDate(app.createdAt)}</strong></span>
            <span>Country <strong>${escapeHtml(app.country || 'Not set')}</strong></span>
          </div>
        </div>
        <aside class="affiliate-qr-card">
          <img src="${qrUrl(link)}" alt="Affiliate QR code" loading="lazy">
          <p>Referral Code</p>
          <strong>${escapeHtml(app.coupon || app.affiliateId || app.id)}</strong>
          <button data-copy="${escapeHtml(link)}">Copy Referral Link</button>
        </aside>
      </section>

      <section class="affiliate-metrics affiliate-metrics-wide" id="stats" data-affiliate-section="stats">
        ${metric("Today's Clicks", stats.todayClicks)}
        ${metric("Today's Orders", stats.todayOrders)}
        ${metric("Today's Revenue", money(stats.todayRevenue))}
        ${metric("Today's Commission", money(stats.todayCommission))}
        ${metric('This Month Clicks', stats.monthClicks)}
        ${metric('This Month Orders', stats.monthOrders)}
        ${metric('This Month Revenue', money(stats.monthRevenue))}
        ${metric('This Month Earnings', money(stats.monthEarnings))}
        ${metric('Pending Balance', money(stats.pendingBalance))}
        ${metric('Approved Balance', money(stats.approvedBalance))}
        ${metric('Paid Balance', money(stats.paidBalance))}
        ${metric('Lifetime Revenue', money(stats.lifetimeRevenue))}
        ${metric('Lifetime Commission', money(stats.lifetimeCommission))}
        ${metric('Conversion Rate', percent(stats.conversionRate))}
        ${metric('Average Order Value', money(stats.averageOrderValue))}
      </section>

      <section class="affiliate-dashboard-grid affiliate-dashboard-grid-wide" id="charts" data-affiliate-section="charts">
        ${chartBars('Daily Earnings', app.dailyEarnings || [stats.todayCommission])}
        ${chartBars('Monthly Earnings', app.monthlyEarnings || [stats.monthEarnings])}
        ${chartBars('Clicks', app.clickSeries || [stats.todayClicks, stats.monthClicks])}
        ${chartBars('Orders', app.orderSeries || [stats.todayOrders, stats.monthOrders])}
        <article class="affiliate-dash-card"><h2>Top Products</h2>${emptyList('Top products will appear after referral orders.')}</article>
        <article class="affiliate-dash-card"><h2>Top Countries</h2>${emptyList('Country analytics will appear after tracked orders.')}</article>
        <article class="affiliate-dash-card"><h2>Traffic Sources</h2>${emptyList('Traffic source data will appear after tracked clicks.')}</article>
      </section>

      <section class="affiliate-dashboard-grid" id="links" data-affiliate-section="links">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Referral Links</p>
          <h2>Link Builder</h2>
          <form class="affiliate-link-builder" data-affiliate-link-form>
            <input name="label" placeholder="Campaign label">
            <input name="url" placeholder="Paste product, category, collection, or custom URL">
            <button class="affiliate-primary" type="submit">Generate Link</button>
          </form>
          <div class="affiliate-link-list">${referralLinks(app)}</div>
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="coupons" data-affiliate-section="coupons">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Coupons</p>
          <h2>Personal Coupon</h2>
          ${couponRows(app)}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="payouts" data-affiliate-section="payouts">
        <article class="affiliate-dash-card affiliate-payout-card">
          <p class="affiliate-eyebrow">Payouts</p>
          <h2>Withdraw Earnings</h2>
          <p class="affiliate-muted">Minimum withdrawal is ${money(MIN_PAYOUT)}. Payouts are reviewed every 7 days. Available methods: PayPal and Bank Transfer.</p>
          <form class="affiliate-payout-form premium-payout-form" data-affiliate-payout-form>
            <select name="method" aria-label="Payout method">
              <option value="PayPal" ${app.payoutMethod === 'PayPal' ? 'selected' : ''}>PayPal</option>
              <option value="Bank Transfer" ${app.payoutMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
            </select>
            <input name="paypalEmail" type="email" placeholder="PayPal email address" value="${escapeHtml(app.paypalEmail || app.email || '')}">
            <input name="bankName" placeholder="Bank name" value="${escapeHtml(app.bankName || '')}">
            <input name="accountHolder" placeholder="Account holder name" value="${escapeHtml(app.accountHolder || app.fullName || '')}">
            <input name="amount" type="number" min="${MIN_PAYOUT}" step="0.01" placeholder="Amount" value="${stats.approvedBalance >= MIN_PAYOUT ? stats.approvedBalance.toFixed(2) : ''}">
            <button class="affiliate-primary" type="submit">Request Withdrawal</button>
          </form>
          <p class="affiliate-message" data-affiliate-payout-message></p>
        </article>
        <article class="affiliate-dash-card">
          <h2>Payout History</h2>
          ${payoutHistory(app)}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="prizes" data-affiliate-section="prizes">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Creator Prize Challenge</p>
          <h2>Sell more. Unlock premium rewards.</h2>
          <p class="affiliate-muted">Targets are based on tracked product sales. Zavora verifies each milestone before prize approval.</p>
          ${prizeProgress(stats)}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="orders" data-affiliate-section="orders">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Orders</p>
          <h2>Referral Orders</h2>
          ${ordersTable(stats.orders, commission)}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="assets" data-affiliate-section="assets">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Marketing Material</p>
          <h2>Brand Assets</h2>
          <div class="asset-grid">
            <span>Product Images</span><span>Lifestyle Images</span><span>Videos</span><span>Banners</span><span>Instagram Posts</span><span>Stories</span><span>Pinterest Pins</span><span>TikTok Videos</span><span>YouTube Thumbnails</span><span>Logos</span><span>Brand Guidelines</span>
          </div>
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="leaderboard" data-affiliate-section="leaderboard">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Leaderboard</p>
          <h2>Creator rankings</h2>
          ${leaderboardRows(app)}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="notifications" data-affiliate-section="notifications">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Notifications</p>
          <h2>Program updates</h2>
          ${(app.notifications || []).length ? app.notifications.map((item) => `<p>${escapeHtml(item.message || item)}</p>`).join('') : emptyList('Commission, payout, coupon, and campaign alerts appear here.')}
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="profile" data-affiliate-section="profile">
        <article class="affiliate-dash-card">
          <p class="affiliate-eyebrow">Profile</p>
          <h2>Partner Profile</h2>
          <form class="affiliate-profile-form" data-affiliate-profile-form>
            <input name="fullName" placeholder="Full name" value="${escapeHtml(app.fullName || '')}">
            <input name="phone" placeholder="Phone" value="${escapeHtml(app.phone || '')}">
            <input name="country" placeholder="Country" value="${escapeHtml(app.country || '')}">
            <button class="affiliate-primary" type="submit">Save Profile</button>
          </form>
        </article>
        <article class="affiliate-dash-card">
          <p class="affiliate-eyebrow">Security</p>
          <h2>Login Protection</h2>
          <p>2FA ready. Session expires automatically after 7 days.</p>
          <p class="affiliate-muted">Device login history, IP logs, and audit logs are reserved for database-backed tracking.</p>
        </article>
      </section>

      <section class="affiliate-dashboard-grid" id="support" data-affiliate-section="support">
        <article class="affiliate-dash-card affiliate-wide-card">
          <p class="affiliate-eyebrow">Support</p>
          <h2>Affiliate Team</h2>
          <p>Contact affiliates@zavorafashion.com for affiliate program questions, payout review, and campaign help. For customer support issues, contact help@zavorafashion.com.</p>
        </article>
      </section>
    `;
    root.querySelectorAll('[data-affiliate-section]').forEach((section) => {
      section.hidden = section.dataset.affiliateSection !== sectionGroup;
    });
  }

  function requestPayout(form) {
    const app = currentAffiliate();
    if (!app) return;
    const message = form.querySelector('[data-affiliate-payout-message]') || document.querySelector('[data-affiliate-payout-message]');
    const data = new FormData(form);
    const method = String(data.get('method') || 'PayPal');
    const paypalEmail = String(data.get('paypalEmail') || '').trim().toLowerCase();
    const bankName = String(data.get('bankName') || '').trim();
    const accountHolder = String(data.get('accountHolder') || '').trim();
    const amount = Number(data.get('amount') || 0);
    const available = Number(app.approvedBalance || app.availableBalance || 0);
    if (method === 'PayPal' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      if (message) message.textContent = 'Enter a valid PayPal email address.';
      return;
    }
    if (method === 'Bank Transfer' && (!bankName || !accountHolder)) {
      if (message) message.textContent = 'Enter bank name and account holder.';
      return;
    }
    if (amount < MIN_PAYOUT) {
      if (message) message.textContent = `Minimum withdrawal is ${money(MIN_PAYOUT)}.`;
      return;
    }
    if (amount > available) {
      if (message) message.textContent = 'Requested amount is higher than approved balance.';
      return;
    }
    const request = {
      id: uid('PAYOUT'),
      method,
      paypalEmail,
      bankName,
      accountHolder,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    updateAffiliateRecord(app.id, (draft) => ({
      ...draft,
      payoutMethod: method,
      paypalEmail,
      bankName,
      accountHolder,
      approvedBalance: Math.max(0, Number(draft.approvedBalance || draft.availableBalance || 0) - amount),
      availableBalance: Math.max(0, Number(draft.availableBalance || 0) - amount),
      pendingBalance: Number(draft.pendingBalance || 0) + amount,
      payoutRequests: [request, ...(draft.payoutRequests || [])],
      notifications: [{ message: `Withdrawal request ${request.id} sent for admin review.`, createdAt: request.createdAt }, ...(draft.notifications || [])]
    }));
    renderDashboard();
    const freshMessage = document.querySelector('[data-affiliate-payout-message]');
    if (freshMessage) freshMessage.textContent = 'Withdrawal request sent to Zavora Admin.';
  }

  function addReferralLink(form) {
    const app = currentAffiliate();
    if (!app) return;
    const data = new FormData(form);
    const label = String(data.get('label') || 'Custom Campaign').trim();
    const rawUrl = String(data.get('url') || '').trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) return;
    const joiner = rawUrl.includes('?') ? '&' : '?';
    const url = `${rawUrl}${joiner}ref=${encodeURIComponent(app.affiliateId || app.id)}`;
    updateAffiliateRecord(app.id, (draft) => ({
      ...draft,
      referralLinks: [{ id: uid('LINK'), label, url, createdAt: new Date().toISOString() }, ...(draft.referralLinks || [])]
    }));
    form.reset();
    renderDashboard();
  }

  function saveProfile(form) {
    const app = currentAffiliate();
    if (!app) return;
    const data = new FormData(form);
    updateAffiliateRecord(app.id, (draft) => ({
      ...draft,
      fullName: String(data.get('fullName') || draft.fullName || '').trim(),
      phone: String(data.get('phone') || draft.phone || '').trim(),
      country: String(data.get('country') || draft.country || '').trim()
    }));
    renderDashboard();
  }

  function captureAttribution() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('affiliate');
    if (!ref) return;
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      ref,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
      capturedAt: new Date().toISOString()
    }));
  }

  document.addEventListener('submit', (event) => {
    const apply = event.target.closest('[data-affiliate-apply]');
    const loginForm = event.target.closest('[data-affiliate-login]');
    const payoutForm = event.target.closest('[data-affiliate-payout-form]');
    const linkForm = event.target.closest('[data-affiliate-link-form]');
    const profileForm = event.target.closest('[data-affiliate-profile-form]');
    const forgotForm = event.target.closest('[data-affiliate-forgot]');
    if (apply) {
      event.preventDefault();
      submitApplication(apply);
    }
    if (loginForm) {
      event.preventDefault();
      login(loginForm);
    }
    if (payoutForm) {
      event.preventDefault();
      requestPayout(payoutForm);
    }
    if (linkForm) {
      event.preventDefault();
      addReferralLink(linkForm);
    }
    if (profileForm) {
      event.preventDefault();
      saveProfile(profileForm);
    }
    if (forgotForm) {
      event.preventDefault();
      resetPassword(forgotForm);
    }
  });

  document.addEventListener('click', (event) => {
    const copy = event.target.closest('[data-copy]');
    if (copy) {
      navigator.clipboard?.writeText(copy.dataset.copy || '');
      copy.textContent = 'Copied';
      window.setTimeout(() => copy.textContent = 'Copy', 1200);
    }
    if (event.target.closest('[data-affiliate-logout]')) {
      localStorage.removeItem(SESSION_KEY);
      window.location.href = '/affiliate/login';
    }
    if (event.target.closest('[data-affiliate-withdraw]')) {
      document.querySelector('#payouts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const forgotOpen = event.target.closest('[data-affiliate-forgot-open]');
    if (forgotOpen) {
      const panel = document.querySelector('[data-affiliate-forgot]');
      if (panel) panel.hidden = !panel.hidden;
    }
    const forgotSend = event.target.closest('[data-affiliate-forgot-send]');
    if (forgotSend) {
      const form = forgotSend.closest('[data-affiliate-forgot]');
      if (form) sendForgotOtp(form);
    }
  });

  window.addEventListener('hashchange', renderDashboard);
  window.addEventListener('storage', (event) => {
    if ([APP_KEY, SESSION_KEY, ORDER_KEY].includes(event.key)) renderDashboard();
  });
  window.setInterval(() => {
    if (document.querySelector('[data-affiliate-dashboard-content]')) renderDashboard();
  }, 15000);

  captureAttribution();
  renderDashboard();
})();
