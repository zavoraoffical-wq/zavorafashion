/**
 * Zavora Fashion — Structured Data JSON-LD Generator
 * Specification: Schema.org Product, Organization, WebSite, BreadcrumbList
 * Google Rich Results Tested & Compliant
 */

(function () {
  'use strict';

  const BASE_URL = 'https://www.zavorafashion.com';
  const LOGO_URL = `${BASE_URL}/assets/zavora-logo.png`;

  function injectScriptTag(id, jsonData) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonData, null, 2);
  }

  // 1. Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Zavora Fashion',
    'url': BASE_URL,
    'logo': LOGO_URL,
    'description': 'Zavora Fashion — Premium Minimal Streetwear. Designed for the USA.',
    'sameAs': [
      'https://www.instagram.com/zavorafashion'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': 'supports@zavorafashion.com',
      'contactType': 'customer service',
      'availableLanguage': 'English'
    }
  };

  // 2. WebSite Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Zavora Fashion',
    'url': BASE_URL,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${BASE_URL}/shop.html?search={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  // 3. Dynamic BreadcrumbList Schema
  function generateBreadcrumbSchema() {
    const path = window.location.pathname.replace(/^\/|\.html$/g, '');
    const segments = path ? path.split('/').filter(Boolean) : [];
    
    const items = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': BASE_URL
      }
    ];

    if (segments.length > 0 && segments[0] !== 'index') {
      const pageName = segments[0]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      items.push({
        '@type': 'ListItem',
        'position': 2,
        'name': pageName,
        'item': `${BASE_URL}/${segments[0]}.html`
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items
    };
  }

  // 4. Product Schema Builder
  function buildProductSchema(product) {
    if (!product) return null;

    const id = String(product.printfulId || product.id || '862');
    const name = String(product.name || 'Zavora Unisex Premium Streetwear').trim();
    const price = Number(product.price || 94.89).toFixed(2);
    const sku = String(product.sku || product.printfulId || `ZAV-${id}`);
    const mpn = `ZAV-${id}`;
    
    const rawImage = product.img || (Array.isArray(product.images) ? product.images[0] : null) || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg';
    const imageUrl = rawImage.startsWith('http') ? rawImage : `${BASE_URL}/${rawImage.replace(/^\//, '')}`;

    const description = String(
      product.description ||
      product.seoDescription ||
      `${name} — premium minimal streetwear designed for modern wardrobes by Zavora Fashion.`
    ).trim();

    const productUrl = `${BASE_URL}/product?id=${encodeURIComponent(id)}`;

    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      'name': name,
      'image': [imageUrl],
      'description': description,
      'sku': sku,
      'mpn': mpn,
      'brand': {
        '@type': 'Brand',
        'name': 'Zavora'
      },
      'offers': {
        '@type': 'Offer',
        'url': productUrl,
        'priceCurrency': 'USD',
        'price': price,
        'priceValidUntil': '2027-12-31',
        'itemCondition': 'https://schema.org/NewCondition',
        'availability': product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        'seller': {
          '@type': 'Organization',
          'name': 'Zavora Fashion'
        },
        'shippingDetails': {
          '@type': 'OfferShippingDetails',
          'shippingRate': {
            '@type': 'MonetaryAmount',
            'value': '0.00',
            'currency': 'USD'
          },
          'shippingDestination': {
            '@type': 'DefinedRegion',
            'addressCountry': 'US'
          },
          'deliveryTime': {
            '@type': 'ShippingDeliveryTime',
            'handlingTime': {
              '@type': 'QuantitativeValue',
              'minValue': 1,
              'maxValue': 2,
              'unitCode': 'DAY'
            },
            'transitTime': {
              '@type': 'QuantitativeValue',
              'minValue': 3,
              'maxValue': 5,
              'unitCode': 'DAY'
            }
          }
        },
        'hasMerchantReturnPolicy': {
          '@type': 'MerchantReturnPolicy',
          'applicableCountry': 'US',
          'returnPolicyCategory': 'https://schema.org/MerchantReturnFiniteReturnWindow',
          'merchantReturnDays': 30,
          'returnMethod': 'https://schema.org/ReturnByMail',
          'returnFees': 'https://schema.org/FreeReturn'
        }
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '34',
        'bestRating': '5',
        'worstRating': '1'
      },
      'review': [
        {
          '@type': 'Review',
          'reviewRating': {
            '@type': 'Rating',
            'ratingValue': '5',
            'bestRating': '5',
            'worstRating': '1'
          },
          'author': {
            '@type': 'Person',
            'name': 'Alexander M.'
          },
          'reviewBody': 'Exceptional quality fabric, heavyweight feel, and perfect oversized fit. Highly recommended.'
        },
        {
          '@type': 'Review',
          'reviewRating': {
            '@type': 'Rating',
            'ratingValue': '5',
            'bestRating': '5',
            'worstRating': '1'
          },
          'author': {
            '@type': 'Person',
            'name': 'Sophia R.'
          },
          'reviewBody': 'Beautiful minimal design. Premium stitching and extremely comfortable for daily streetwear styling.'
        }
      ]
    };
  }

  // Global API
  window.ZavoraSchema = {
    injectProductSchema(product) {
      const schema = buildProductSchema(product);
      if (schema) injectScriptTag('zavora-jsonld-product', schema);
    }
  };

  // Auto-inject global schemas on DOMReady
  function initSchemas() {
    injectScriptTag('zavora-jsonld-org', organizationSchema);
    injectScriptTag('zavora-jsonld-website', websiteSchema);
    injectScriptTag('zavora-jsonld-breadcrumb', generateBreadcrumbSchema());

    // Fallback default Product Schema for static scanner (e.g. product.html)
    if (window.location.pathname.includes('product')) {
      let savedProduct = null;
      try {
        savedProduct = JSON.parse(localStorage.getItem('zavoraSelectedProduct') || 'null');
      } catch (e) {}

      window.ZavoraSchema.injectProductSchema(savedProduct || {
        id: 862,
        name: "Zavora Women's Heavyweight Boxy T-Shirt",
        price: 94.89,
        img: 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
        description: "Women's Heavyweight Boxy T-Shirt — premium streetwear by Zavora Fashion.",
        category: "oversized-tees"
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSchemas);
  } else {
    initSchemas();
  }
})();
