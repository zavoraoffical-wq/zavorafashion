/**
 * Zavora Fashion — Real-Time Multi-Currency & Country Selector Engine
 * Supports USD ($), EUR (€), INR (₹), GBP (£), CAD (CA$), AUD (A$) with live site-wide DOM price conversion.
 */

(function () {
  'use strict';

  const CURRENCY_DATA = {
    USD: { symbol: '$', rate: 1.0, prefix: '$', suffix: '', decimals: 2, country: 'USA' },
    EUR: { symbol: '€', rate: 0.92, prefix: '€', suffix: '', decimals: 2, country: 'Europe' },
    INR: { symbol: '₹', rate: 83.50, prefix: '₹', suffix: '', decimals: 0, country: 'India' },
    GBP: { symbol: '£', rate: 0.79, prefix: '£', suffix: '', decimals: 2, country: 'UK' },
    CAD: { symbol: 'CA$', rate: 1.36, prefix: 'CA$', suffix: '', decimals: 2, country: 'Canada' },
    AUD: { symbol: 'A$', rate: 1.52, prefix: 'A$', suffix: '', decimals: 2, country: 'Australia' }
  };

  const COUNTRY_CURRENCY_MAP = {
    USA: 'USD',
    Europe: 'EUR',
    India: 'INR',
    UK: 'GBP',
    Canada: 'CAD',
    Australia: 'AUD'
  };

  function getStoredCurrency() {
    try {
      return localStorage.getItem('zavora_selected_currency') || 'USD';
    } catch(e) {
      return 'USD';
    }
  }

  function getStoredCountry() {
    try {
      return localStorage.getItem('zavora_selected_country') || 'USA';
    } catch(e) {
      return 'USA';
    }
  }

  function setStoredCurrency(curr, country) {
    try {
      localStorage.setItem('zavora_selected_currency', curr);
      if (country) localStorage.setItem('zavora_selected_country', country);
    } catch(e) {}
  }

  function formatMoney(amountInUSD, currCode = getStoredCurrency()) {
    const info = CURRENCY_DATA[currCode] || CURRENCY_DATA.USD;
    const num = Number(amountInUSD || 0) * info.rate;
    const formatted = info.decimals === 0 ? Math.round(num).toLocaleString() : num.toFixed(info.decimals);
    return `${info.prefix}${formatted}${info.suffix}`;
  }

  function updateHeaderSelectors() {
    const currentCurr = getStoredCurrency();
    const currentCountry = getStoredCountry();

    // Populate and sync Currency Selectors
    document.querySelectorAll('select[aria-label="Currency selector"], select.currency-select, [data-currency-select]').forEach(select => {
      if (!select.dataset.populated) {
        select.innerHTML = Object.keys(CURRENCY_DATA).map(c => `<option value="${c}">${c}</option>`).join('');
        select.dataset.populated = 'true';
      }
      select.value = currentCurr;
    });

    // Populate and sync Country Selectors
    document.querySelectorAll('select[aria-label="Country selector"], select.country-select, [data-country-select]').forEach(select => {
      if (!select.dataset.populated) {
        select.innerHTML = Object.keys(COUNTRY_CURRENCY_MAP).map(ctry => `<option value="${ctry}">${ctry}</option>`).join('');
        select.dataset.populated = 'true';
      }
      select.value = currentCountry;
    });
  }

  function convertAllSitePrices() {
    const activeCurr = getStoredCurrency();

    // 1. Update elements with explicit dataset data-price or data-usd
    document.querySelectorAll('[data-price], [data-usd-price]').forEach(el => {
      const usdPrice = parseFloat(el.dataset.price || el.dataset.usdPrice);
      if (!isNaN(usdPrice)) {
        el.textContent = formatMoney(usdPrice, activeCurr);
      }
    });

    // 2. Scan price containers, catalog cards & product detail prices
    document.querySelectorAll('.sale-price, .product-price, .cart-price, .price-display, .catalog-card strong').forEach(el => {
      const match = el.textContent.match(/[\d,]+\.\d{2}|[\d,]+/);
      if (match && !el.dataset.rawPrice) {
        const raw = parseFloat(match[0].replace(/,/g, ''));
        if (!isNaN(raw) && raw > 0) el.dataset.rawPrice = raw;
      }
      if (el.dataset.rawPrice) {
        const usdPrice = parseFloat(el.dataset.rawPrice);
        el.textContent = formatMoney(usdPrice, activeCurr);
      }
    });
  }

  function setupCurrencyListeners() {
    // Currency Selector Change
    document.addEventListener('change', (e) => {
      const currSelect = e.target.closest('select[aria-label="Currency selector"], select.currency-select, [data-currency-select]');
      if (currSelect) {
        const newCurr = currSelect.value;
        const newCountry = CURRENCY_DATA[newCurr]?.country || getStoredCountry();
        setStoredCurrency(newCurr, newCountry);
        updateHeaderSelectors();
        convertAllSitePrices();
        window.dispatchEvent(new CustomEvent('zavoraCurrencyChanged', { detail: { currency: newCurr, country: newCountry } }));
      }

      const ctrySelect = e.target.closest('select[aria-label="Country selector"], select.country-select, [data-country-select]');
      if (ctrySelect) {
        const newCountry = ctrySelect.value;
        const newCurr = COUNTRY_CURRENCY_MAP[newCountry] || getStoredCurrency();
        setStoredCurrency(newCurr, newCountry);
        updateHeaderSelectors();
        convertAllSitePrices();
        window.dispatchEvent(new CustomEvent('zavoraCurrencyChanged', { detail: { currency: newCurr, country: newCountry } }));
      }
    });
  }

  // Public API
  window.ZavoraCurrency = {
    getCurrency: getStoredCurrency,
    getCountry: getStoredCountry,
    format: formatMoney,
    update: () => {
      updateHeaderSelectors();
      convertAllSitePrices();
    }
  };

  // Initialize on DOMReady & MutationObserver for dynamically added products
  function init() {
    updateHeaderSelectors();
    convertAllSitePrices();
    setupCurrencyListeners();

    // Re-convert on dynamic catalog render
    const observer = new MutationObserver((mutations) => {
      let shouldConvert = false;
      for (const m of mutations) {
        if (m.addedNodes.length) {
          shouldConvert = true;
          break;
        }
      }
      if (shouldConvert) {
        setTimeout(convertAllSitePrices, 50);
      }
    });

    const mainNode = document.querySelector('main') || document.body;
    if (mainNode) observer.observe(mainNode, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
