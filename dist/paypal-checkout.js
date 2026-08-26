function zavoraCheckoutTotal() {
  try {
    const cart = typeof getSavedCart === 'function' ? getSavedCart() : (JSON.parse(localStorage.getItem('zavora_cart')) || []);
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
    } catch(e) {}

    let giftDiscount = 0;
    try {
      const gift = JSON.parse(localStorage.getItem('zavoraAppliedGiftCard') || 'null');
      if (gift?.code) giftDiscount = Math.min(subtotal - couponDiscount, Number(gift.balance || gift.value || 0));
    } catch(e) {}

    const totalDiscount = couponDiscount + giftDiscount;
    return Math.max(0.01, subtotal + shipping - totalDiscount);
  } catch (error) {
    return 0.01;
  }
}

function initZavoraPayPal() {
  const container = document.querySelector('#paypal-button-container');
  if (!container) return;
  if (!window.paypal) {
    container.innerHTML = '<p class="secure-note">PayPal is loading. Refresh if the button does not appear.</p>';
    return;
  }

  container.innerHTML = '';
  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'black',
      shape: 'rect',
      label: 'paypal'
    },
    async createOrder() {
      if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackBeginCheckout(typeof getSavedCart === 'function' ? getSavedCart() : [], zavoraCheckoutTotal());
      const cart = typeof getSavedCart === 'function' ? getSavedCart() : (JSON.parse(localStorage.getItem('zavora_cart')) || []);
      if (!cart || !cart.length) {
        alert('Your bag is empty. Add a product before checkout.');
        throw new Error('Cart empty');
      }
      const response = await fetch('/api/paypal?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            printfulId: item.printfulId,
            qty: Number(item.qty || 1)
          })),
          shipping: Number(document.querySelector('input[name="shipping"]:checked')?.value || 0),
          couponCode: (() => {
            try { return JSON.parse(localStorage.getItem('zavoraAppliedCoupon') || 'null')?.code || ''; } catch (error) { return ''; }
          })()
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.id) throw new Error(result.error || 'PayPal could not create the order');
      return result.id;
    },
    async onApprove(data) {
      const response = await fetch('/api/paypal?action=capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ orderId: data.orderID })
      });
      const capture = await response.json().catch(() => ({}));
      if (!response.ok || capture.status !== 'COMPLETED') throw new Error(capture.error || 'PayPal capture was not completed');
      const cart = typeof getSavedCart === 'function' ? getSavedCart() : [];
      if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackPurchase(data.orderID, cart, zavoraCheckoutTotal());
      const order = typeof createTestOrder === 'function' ? createTestOrder('PayPal') : null;
      if (!order) throw new Error('Could not save the completed order');
      order.paypalOrderId = data.orderID || '';
      if (typeof persistOrder === 'function') await persistOrder(order);
      if (typeof requestOrderConfirmation === 'function') requestOrderConfirmation(order);
      window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=paypal`;
    },
    onError(err) {
      const message = String(err?.message || 'PayPal payment could not be completed. Please try again.');
      container.querySelectorAll('[data-paypal-error]').forEach(node => node.remove());
      const note = document.createElement('p');
      note.className = 'login-error';
      note.dataset.paypalError = 'true';
      note.textContent = message;
      container.appendChild(note);
    }
  }).render('#paypal-button-container');
}

// ── Pay Now (COD) Button Logic ────────────────────────────────────────────────
function handlePayNowCOD() {
  const form = document.getElementById('checkoutForm');

  // Validate required fields
  const email = document.getElementById('co-email')?.value?.trim();
  const name  = document.getElementById('co-name')?.value?.trim();
  const phone = document.getElementById('co-phone')?.value?.trim();
  const addr  = document.getElementById('co-address')?.value?.trim();
  const city  = document.getElementById('co-city')?.value?.trim();
  const zip   = document.getElementById('co-zip')?.value?.trim();

  if (!email || !name || !phone || !addr || !city || !zip) {
    alert('Please fill in all required shipping details before placing your order.');
    return;
  }

  const cart = typeof getSavedCart === 'function' ? getSavedCart() : (JSON.parse(localStorage.getItem('zavora_cart')) || []);
  if (!cart || !cart.length) {
    alert('Your bag is empty. Please add a product first.');
    return;
  }

  const btn = document.getElementById('payNowBtn');
  if (btn) {
    btn.textContent = '⏳ Placing Your Order...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  }

  // Build order object
  const orderId = 'ZV-' + Date.now();
  const total   = zavoraCheckoutTotal();
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    method: 'COD',
    email, name, phone,
    address: `${addr}, ${city} ${zip}`,
    items: cart,
    subtotal: cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0),
    shipping: Number(document.querySelector('input[name="shipping"]:checked')?.value || 0),
    total
  };

  // Save order
  try {
    const orders = JSON.parse(localStorage.getItem('zavoraOrders') || '[]');
    orders.unshift(order);
    localStorage.setItem('zavoraOrders', JSON.stringify(orders));
    localStorage.setItem('zavoraLastOrder', JSON.stringify(order));
    // Clear cart
    localStorage.removeItem('zavora_cart');
    localStorage.removeItem('zavoraCart');
  } catch(e) {}

  // Persist order to server if available
  if (typeof persistOrder === 'function') {
    persistOrder(order).catch(() => {});
  }
  if (typeof requestOrderConfirmation === 'function') {
    requestOrderConfirmation(order);
  }

  // Redirect to success
  setTimeout(() => {
    window.location.href = `order-success.html?order=${encodeURIComponent(orderId)}&method=cod`;
  }, 600);
}

function bindPaymentToggle() {
  const paypalSection = document.getElementById('paypalSection');
  if (paypalSection) paypalSection.style.display = 'block';
}

window.handlePayNowCOD = handlePayNowCOD;

window.addEventListener('load', () => {
  initZavoraPayPal();
  bindPaymentToggle();
});
