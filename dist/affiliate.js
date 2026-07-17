(function () {
  const APP_KEY = 'zavoraAffiliateApplications';
  const SESSION_KEY = 'zavoraAffiliateSession';
  const ATTRIBUTION_KEY = 'zavoraAffiliateAttribution';

  function readApps() {
    try {
      return JSON.parse(localStorage.getItem(APP_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveApps(apps) {
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function setMessage(form, message, isError) {
    const box = form?.querySelector('[data-affiliate-message]');
    if (!box) return;
    box.textContent = message;
    box.style.color = isError ? '#8b0000' : '#c9a227';
  }

  function submitApplication(form) {
    const data = new FormData(form);
    const app = Object.fromEntries(data.entries());
    if (!app.agree) {
      setMessage(form, 'Agree to terms before applying.', true);
      return;
    }
    const apps = readApps();
    const email = String(app.email || '').trim().toLowerCase();
    const existing = apps.find((item) => String(item.email || '').toLowerCase() === email);
    if (existing) {
      setMessage(form, `Application already exists with status: ${existing.status || 'pending'}.`, true);
      return;
    }
    apps.unshift({
      ...app,
      email,
      id: uid('AFF'),
      status: 'pending',
      commission: 10,
      clicks: 0,
      orders: 0,
      revenue: 0,
      pendingBalance: 0,
      paidBalance: 0,
      availableBalance: 0,
      createdAt: new Date().toISOString()
    });
    saveApps(apps);
    setMessage(form, 'Application submitted for admin review.');
    window.setTimeout(() => window.location.href = 'affiliate-submitted.html', 650);
  }

  function login(form) {
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    const app = readApps().find((item) => String(item.email || '').toLowerCase() === email);
    if (!app || app.status !== 'approved') {
      setMessage(form, 'Affiliate account is not approved yet.', true);
      return;
    }
    if (!app.password || app.password !== password) {
      setMessage(form, 'Invalid affiliate credentials.', true);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: app.id,
      email: app.email,
      affiliateId: app.affiliateId,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }));
    window.location.href = 'affiliate-dashboard.html';
  }

  function currentAffiliate() {
    let session = null;
    try {
      session = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch (error) {}
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

  function payoutHistory(app) {
    const rows = app.payoutRequests || [];
    if (!rows.length) {
      return '<p>No payout requests yet. Manual payout methods: PayPal, Bank, UPI.</p>';
    }
    return `
      <div class="affiliate-history-list">
        ${rows.map((row) => `
          <div>
            <strong>$${Number(row.amount || 0).toFixed(2)} via ${row.method || 'PayPal'}</strong>
            <span>${row.status || 'pending'} / ${new Date(row.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderDashboard() {
    const root = document.querySelector('[data-affiliate-dashboard-content]');
    if (!root) return;
    const app = currentAffiliate();
    if (!app) {
      window.location.replace('affiliate-login.html');
      return;
    }
    const link = app.link || `https://www.zavorafashion.com/?ref=${encodeURIComponent(app.affiliateId || app.id)}`;
    const available = Number(app.availableBalance || 0);
    const pendingPayouts = (app.payoutRequests || []).filter((item) => item.status === 'pending');
    document.querySelectorAll('.affiliate-side a[href*="#"]').forEach((item) => {
      item.classList.toggle('active', item.hash === (window.location.hash || '#overview'));
    });
    root.innerHTML = `
      <div class="affiliate-dash-hero" id="overview">
        <article class="affiliate-dash-card">
          <p class="affiliate-eyebrow">Welcome</p>
          <h1>${app.fullName || 'Zavora Partner'}</h1>
          <p>Affiliate ID: <strong>${app.affiliateId || app.id}</strong> / Commission: <strong>${app.commission || 10}%</strong></p>
          <p class="affiliate-muted">Use your link and coupon to send traffic to Zavora Fashion. Orders, commissions, and payout requests stay inside this separate affiliate portal.</p>
        </article>
        <article class="affiliate-dash-card">
          <h2>$${available.toFixed(2)}</h2>
          <p>Available balance. Minimum withdrawal is $50.</p>
          <button class="affiliate-primary" type="button" data-affiliate-withdraw>Withdraw</button>
        </article>
      </div>
      <div class="affiliate-metrics">
        <div class="affiliate-metric"><span>Clicks</span><strong>${app.clicks || 0}</strong></div>
        <div class="affiliate-metric"><span>Orders</span><strong>${app.orders || 0}</strong></div>
        <div class="affiliate-metric"><span>Revenue</span><strong>$${Number(app.revenue || 0).toFixed(0)}</strong></div>
        <div class="affiliate-metric"><span>Pending</span><strong>$${Number(app.pendingBalance || 0).toFixed(0)}</strong></div>
      </div>
      <div class="affiliate-dashboard-grid">
        <article class="affiliate-dash-card">
          <h2>Referral Link</h2>
          <div class="copy-row"><input value="${link}" readonly><button data-copy="${link}">Copy</button></div>
          <h2>Coupon Code</h2>
          <div class="copy-row"><input value="${app.coupon || ''}" readonly><button data-copy="${app.coupon || ''}">Copy</button></div>
        </article>
        <article class="affiliate-dash-card affiliate-payout-card" id="payouts">
          <p class="affiliate-eyebrow">Payouts</p>
          <h2>PayPal Payout</h2>
          <p class="affiliate-muted">Add the PayPal email where affiliate payout money should be sent. Withdrawal requests are reviewed manually by Zavora Admin.</p>
          <form class="affiliate-payout-form" data-affiliate-payout-form>
            <select name="method" aria-label="Payout method">
              <option value="PayPal" ${app.payoutMethod === 'PayPal' ? 'selected' : ''}>PayPal</option>
              <option value="Bank" ${app.payoutMethod === 'Bank' ? 'selected' : ''}>Bank Transfer</option>
              <option value="UPI" ${app.payoutMethod === 'UPI' ? 'selected' : ''}>UPI</option>
            </select>
            <input name="paypalEmail" type="email" placeholder="PayPal email address" value="${app.paypalEmail || app.email || ''}">
            <input name="amount" type="number" min="50" step="0.01" placeholder="Amount" value="${available >= 50 ? available.toFixed(2) : ''}">
            <button class="affiliate-primary" type="submit">Request Payout</button>
          </form>
          <p class="affiliate-message" data-affiliate-payout-message>${pendingPayouts.length ? `${pendingPayouts.length} payout request pending admin review.` : ''}</p>
        </article>
        <article class="affiliate-dash-card">
          <h2>Payment History</h2>
          ${payoutHistory(app)}
          <p>Paid balance: $${Number(app.paidBalance || 0).toFixed(2)}</p>
        </article>
        <article class="affiliate-dash-card" id="orders">
          <h2>Recent Orders</h2>
          <p>Referral orders appear here after tracked checkout.</p>
        </article>
        <article class="affiliate-dash-card">
          <h2>Leaderboard</h2>
          <p>Your rank appears after affiliate sales begin.</p>
        </article>
        <article class="affiliate-dash-card" id="assets">
          <h2>Marketing Assets</h2>
          <div class="asset-grid">
            <span>Product Images</span><span>Lifestyle Images</span><span>Videos</span><span>Banners</span><span>Instagram Templates</span><span>Pinterest Pins</span><span>YouTube Thumbnails</span><span>Logos</span><span>Brand Kit</span>
          </div>
        </article>
        <article class="affiliate-dash-card" id="support">
          <h2>FAQ and Support</h2>
          <p>For affiliate help, contact affiliates@zavorafashion.com. Commission is manual payout after order clearance.</p>
          <p class="affiliate-muted">Approval, suspension, payout status, and commission rate are controlled by Zavora Admin.</p>
        </article>
      </div>
    `;
  }

  function requestPayout(form) {
    const app = currentAffiliate();
    if (!app) return;
    const message = form.querySelector('[data-affiliate-payout-message]') || document.querySelector('[data-affiliate-payout-message]');
    const data = new FormData(form);
    const method = String(data.get('method') || 'PayPal');
    const paypalEmail = String(data.get('paypalEmail') || '').trim().toLowerCase();
    const amount = Number(data.get('amount') || 0);
    const available = Number(app.availableBalance || 0);
    if (method === 'PayPal' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      if (message) message.textContent = 'Enter a valid PayPal email address.';
      return;
    }
    if (amount < 50) {
      if (message) message.textContent = 'Minimum withdrawal is $50.';
      return;
    }
    if (amount > available) {
      if (message) message.textContent = 'Requested amount is higher than available balance.';
      return;
    }
    const request = {
      id: uid('PAYOUT'),
      method,
      paypalEmail,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    updateAffiliateRecord(app.id, (draft) => ({
      ...draft,
      payoutMethod: method,
      paypalEmail,
      availableBalance: Math.max(0, available - amount),
      payoutRequests: [request, ...(draft.payoutRequests || [])]
    }));
    renderDashboard();
    const freshMessage = document.querySelector('[data-affiliate-payout-message]');
    if (freshMessage) freshMessage.textContent = 'Payout request sent to Zavora Admin.';
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
    if (apply) {
      event.preventDefault();
      submitApplication(apply);
    }
    if (loginForm) {
      event.preventDefault();
      login(loginForm);
    }
    const payoutForm = event.target.closest('[data-affiliate-payout-form]');
    if (payoutForm) {
      event.preventDefault();
      requestPayout(payoutForm);
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
      window.location.href = 'affiliate-login.html';
    }
    if (event.target.closest('[data-affiliate-withdraw]')) {
      document.querySelector('#payouts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  captureAttribution();
  renderDashboard();
})();
