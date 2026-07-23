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
    async createOrder(data, actions) {
      const cart = typeof getSavedCart === 'function' ? getSavedCart() : (JSON.parse(localStorage.getItem('zavora_cart')) || []);
      if (!cart || !cart.length) {
        alert('Your bag is empty. Add a product before checkout.');
        throw new Error('Cart empty');
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
        const order = typeof createTestOrder === 'function' ? createTestOrder('PayPal') : null;
        if (!order) {
          alert('Error placing order. Please try again.');
          return;
        }
        order.paypalOrderId = data.orderID || '';
        if (typeof persistOrder === 'function') await persistOrder(order);
        if (typeof requestOrderConfirmation === 'function') requestOrderConfirmation(order);
        window.location.href = `order-success.html?order=${encodeURIComponent(order.id)}&method=paypal`;
      });
    },
    onError(err) {
      container.insertAdjacentHTML('beforeend', '<p class="login-error">PayPal payment could not be completed. Please try again.</p>');
    }
  }).render('#paypal-button-container');
}

window.addEventListener('load', initZavoraPayPal);
