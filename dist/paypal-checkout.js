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
      return actions.order.capture().then(() => {
        localStorage.setItem('zavoraLastOrder', data.orderID || 'PAYPAL-ORDER');
        window.location.href = 'order-success.html';
      });
    },
    onError() {
      container.insertAdjacentHTML('beforeend', '<p class="login-error">PayPal payment could not be completed. Please try again.</p>');
    }
  }).render('#paypal-button-container');
}

window.addEventListener('load', initZavoraPayPal);
