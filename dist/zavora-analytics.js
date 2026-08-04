/**
 * Zavora Fashion — Google Analytics 4 (GA4) Analytics Engine
 * Measurement ID: G-8YGED71VN8
 * Standard: GA4 Ecommerce & Recommended Events Specification
 */

(function () {
  'use strict';

  const GA_MEASUREMENT_ID = 'G-8YGED71VN8';

  if (window.__GA4_INITIALIZED__) return;
  window.__GA4_INITIALIZED__ = true;

  // Initialize dataLayer and gtag function safely
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  // Load gtag.js script if not already present in DOM
  if (!document.querySelector(`script[src*="${GA_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.insertBefore(script, document.head.firstChild);
  }

  // Configure GA4
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: 'SameSite=Lax;Secure'
  });

  // ─── ECOMMERCE & EVENT TRACKING API ──────────────────────────────────────────

  window.ZavoraAnalytics = {
    /** Track Page View */
    trackPageView(pageTitle, pageLocation) {
      gtag('event', 'page_view', {
        page_title: pageTitle || document.title,
        page_location: pageLocation || window.location.href
      });
    },

    /** Track View Product / Item */
    trackViewItem(product) {
      if (!product) return;
      gtag('event', 'view_item', {
        currency: 'USD',
        value: Number(product.price || 0),
        items: [{
          item_id: String(product.printfulId || product.id || product.name),
          item_name: String(product.name || 'Zavora Product'),
          price: Number(product.price || 0),
          item_category: String(product.category || 'Apparel'),
          item_brand: 'Zavora'
        }]
      });
    },

    /** Track Add to Cart */
    trackAddToCart(product, quantity = 1, size = '', color = '') {
      if (!product) return;
      const qty = Number(quantity || 1);
      const price = Number(product.price || 0);
      gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: price * qty,
        items: [{
          item_id: String(product.printfulId || product.id || product.name),
          item_name: String(product.name || 'Zavora Product'),
          price: price,
          quantity: qty,
          item_category: String(product.category || 'Apparel'),
          item_variant: [color, size].filter(Boolean).join(' / ') || undefined,
          item_brand: 'Zavora'
        }]
      });
    },

    /** Track Begin Checkout */
    trackBeginCheckout(cartItems = [], totalValue = 0) {
      const items = (Array.isArray(cartItems) ? cartItems : []).map(item => ({
        item_id: String(item.printfulId || item.id || item.name),
        item_name: String(item.name || 'Zavora Product'),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        item_brand: 'Zavora'
      }));

      gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: Number(totalValue || 0),
        items: items
      });
    },

    /** Track Purchase */
    trackPurchase(orderId, cartItems = [], totalValue = 0, tax = 0, shipping = 0) {
      const items = (Array.isArray(cartItems) ? cartItems : []).map(item => ({
        item_id: String(item.printfulId || item.id || item.name),
        item_name: String(item.name || 'Zavora Product'),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        item_brand: 'Zavora'
      }));

      gtag('event', 'purchase', {
        transaction_id: String(orderId || `ZAV-${Date.now()}`),
        currency: 'USD',
        value: Number(totalValue || 0),
        tax: Number(tax || 0),
        shipping: Number(shipping || 0),
        items: items
      });
    },

    /** Track Search */
    trackSearch(searchTerm) {
      if (!searchTerm) return;
      gtag('event', 'search', {
        search_term: String(searchTerm).trim()
      });
    },

    /** Track User Login */
    trackLogin(method = 'email') {
      gtag('event', 'login', {
        method: method
      });
    },

    /** Track User Sign Up */
    trackSignUp(method = 'email') {
      gtag('event', 'sign_up', {
        method: method
      });
    }
  };

  console.log(`[GA4] Initialized Google Analytics 4 (${GA_MEASUREMENT_ID})`);
})();
