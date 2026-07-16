function zavoraCheckoutTotal() {
  try {
    const cart = JSON.parse(localStorage.getItem('zavoraCart')) || [];
    const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    const appliedGift = JSON.parse(localStorage.getItem('zavoraAppliedGiftCard') || 'null');
    const discount = appliedGift?.code ? Math.min(total || 168, Number(appliedGift.balance || appliedGift.value || 0)) : 0;
    return Math.max(0.01, (total > 0 ? total : 168) - discount);
  } catch (error) {
    return 168;
  }
}

function initZavoraPayPal() {
  const container = document.querySelector('#paypal-button-container');
  if (!container) return;
  if (!window.paypal) {
    container.innerHTML = '<p class="secure-note">PayPal is loading. Refresh if the button does not appear.</p>';
    return;
  }

  window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'black',
      shape: 'rect',
      label: 'paypal'
    },
    async createOrder(data, actions) {
      const user = typeof fetchAuthSession === 'function' ? await fetchAuthSession(true) : null;
      if (!user) {
        if (typeof savePendingCommerceAction === 'function') savePendingCommerceAction('checkout', null, 'checkout.html');
        if (typeof showLoginRequiredModal === 'function') showLoginRequiredModal('checkout.html');
        else window.location.href = `login.html?next=${encodeURIComponent('checkout.html')}`;
        throw new Error('Login required before PayPal checkout');
      }
      return actions.order.create({
        purchase_units: [{
          description: 'Zavora Fashion Order',
          amount: {
            currency_code: 'USD',
            value: zavoraCheckoutTotal().toFixed(2)
          }
        }]
      });
    },
    onApprove(data, actions) {
      return actions.order.capture().then(async () => {
        const user = typeof fetchAuthSession === 'function' ? await fetchAuthSession(true) : null;
        if (!user) {
          window.location.href = `login.html?next=${encodeURIComponent('checkout.html')}`;
          return;
        }
        const order = typeof createTestOrder === 'function' ? createTestOrder('PayPal') : null;
        if (!order) {
          container.insertAdjacentHTML('beforeend', '<p class="login-error">Your bag is empty. Add a product before payment.</p>');
          return;
        }
        order.paypalOrderId = data.orderID || '';
        if (typeof persistOrder === 'function') await persistOrder(order);
        if (typeof requestOrderConfirmation === 'function') requestOrderConfirmation(order);
        window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=paypal`;
      });
    },
    onError() {
      container.insertAdjacentHTML('beforeend', '<p class="login-error">PayPal payment could not be completed. Please try again.</p>');
    }
  }).render('#paypal-button-container');
}

window.addEventListener('load', initZavoraPayPal);
