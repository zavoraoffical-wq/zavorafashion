const fs = require('fs');
const path = require('path');

// 1. Update prepare-public.js to include zavora-analytics.js script tag in <head>
const preparePublicPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\scripts\\prepare-public.js';
if (fs.existsSync(preparePublicPath)) {
  let content = fs.readFileSync(preparePublicPath, 'utf8');

  if (!content.includes('zavora-analytics.js')) {
    content = content.replace(
      'html = html.replace(/src=["\']admin-login\\.js(\\?v=[^"\']*)?["\']/gi, `src="admin-login.js?v=${jsVersion}"`);',
      `html = html.replace(/src=["']admin-login\\.js(\\?v=[^"']*)?["']/gi, \`src="admin-login.js?v=\${jsVersion}"\`);
    html = html.replace(/src=["']zavora-analytics\\.js(\\?v=[^"']*)?["']/gi, \`src="zavora-analytics.js?v=\${jsVersion}"\`);`
    );

    content = content.replace(
      'if (!html.includes(\'rel="icon"\') && html.includes(\'</head>\')) {',
      `if (!html.includes('zavora-analytics.js') && html.includes('</head>')) {
      html = html.replace('</head>', \`    <script src="zavora-analytics.js?v=\${jsVersion}"></script>\\n  </head>\`);
    }
    if (!html.includes('rel="icon"') && html.includes('</head>')) {`
    );

    fs.writeFileSync(preparePublicPath, content, 'utf8');
    console.log("Updated prepare-public.js with zavora-analytics.js auto-injection");
  }
}

// 2. Wire tracking calls into script.js
const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js'
];

for (const sf of scriptFiles) {
  if (!fs.existsSync(sf)) continue;
  let content = fs.readFileSync(sf, 'utf8');

  // Wire addToCart
  if (content.includes('function addToCart(id) {') && !content.includes('trackAddToCart')) {
    content = content.replace(
      'saveCart();',
      `saveCart();\n  if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackAddToCart(product, 1);`
    );
  }

  // Wire openQuickView / viewItem
  if (content.includes('function openQuickView(id) {') && !content.includes('trackViewItem')) {
    content = content.replace(
      'if (!product) return;',
      `if (!product) return;\n  if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackViewItem(product);`
    );
  }

  // Wire renderSuggestions / search
  if (content.includes('function renderSuggestions(term = \'\') {') && !content.includes('trackSearch')) {
    content = content.replace(
      'function renderSuggestions(term = \'\') {',
      `function renderSuggestions(term = '') {\n  if (term && term.length > 2 && window.ZavoraAnalytics) window.ZavoraAnalytics.trackSearch(term);`
    );
  }

  fs.writeFileSync(sf, content, 'utf8');
  console.log("Wired GA4 events into:", sf);
}

// 3. Wire tracking calls into paypal-checkout.js
const paypalFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\paypal-checkout.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\paypal-checkout.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\paypal-checkout.js'
];

for (const pf of paypalFiles) {
  if (!fs.existsSync(pf)) continue;
  let content = fs.readFileSync(pf, 'utf8');

  if (content.includes('async createOrder(data, actions) {') && !content.includes('trackBeginCheckout')) {
    content = content.replace(
      'async createOrder(data, actions) {',
      `async createOrder(data, actions) {\n      if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackBeginCheckout(typeof getSavedCart === 'function' ? getSavedCart() : [], zavoraCheckoutTotal());`
    );
  }

  if (content.includes('onApprove(data, actions) {') && !content.includes('trackPurchase')) {
    content = content.replace(
      'onApprove(data, actions) {',
      `onApprove(data, actions) {\n      if (window.ZavoraAnalytics) window.ZavoraAnalytics.trackPurchase(data.orderID || data.payerID, typeof getSavedCart === 'function' ? getSavedCart() : [], zavoraCheckoutTotal());`
    );
  }

  fs.writeFileSync(pf, content, 'utf8');
  console.log("Wired GA4 begin_checkout & purchase into:", pf);
}

console.log("Full GA4 Ecommerce event integration complete!");
