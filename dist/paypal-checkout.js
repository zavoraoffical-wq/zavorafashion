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
    createOrder(data, actions) {
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
        const order = typeof createTestOrder === 'function'
          ? createTestOrder('PayPal')
          : {
            id: `ZAV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            email: localStorage.getItem('zavoraUserEmail') || 'customer@zavorafashion.com',
            method: 'PayPal',
            total: zavoraCheckoutTotal(),
            items: JSON.parse(localStorage.getItem('zavoraCart') || '[]'),
            status: 'Payment received',
            tracking: `ZV${String(Date.now()).slice(-8)}`,
            createdAt: new Date().toISOString()
          };
        order.paypalOrderId = data.orderID || '';
        order.status = 'Payment received';
        try {
          const orders = typeof getSavedOrders === 'function' ? getSavedOrders() : [];
          const nextOrders = orders.filter((item) => item.id !== order.id);
          nextOrders.unshift(order);
          if (typeof saveSavedOrders === 'function') saveSavedOrders(nextOrders);
          localStorage.setItem('zavoraLastOrder', JSON.stringify(order));
          if (typeof persistOrder === 'function') await persistOrder(order);
          if (typeof requestOrderConfirmation === 'function') requestOrderConfirmation(order);
        } catch (error) {
          localStorage.setItem('zavoraLastOrder', JSON.stringify(order));
        }
        localStorage.removeItem('zavoraCart');
        window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=paypal`;
      });
    },
    onError() {
      container.insertAdjacentHTML('beforeend', '<p class="login-error">PayPal payment could not be completed. Please try again.</p>');
    }
  }).render('#paypal-button-container');
}

window.addEventListener('load', initZavoraPayPal);
