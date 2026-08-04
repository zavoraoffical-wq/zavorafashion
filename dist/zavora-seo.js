/**
 * Zavora Fashion — Phase 4 Dynamic SEO Engine
 * Dynamic Meta Titles, Descriptions, Open Graph, Twitter Cards, Canonical URLs, Robots, and Image ALT Generator
 */

(function () {
  'use strict';

  const BASE_URL = 'https://www.zavorafashion.com';
  const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og-image.jpg`;

  function setMetaTag(attr, attrVal, content) {
    if (!content) return;
    let element = document.querySelector(`meta[${attr}="${attrVal}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, attrVal);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  }

  function setCanonicalUrl(url) {
    let element = document.querySelector('link[rel="canonical"]');
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', 'canonical');
      document.head.appendChild(element);
    }
    element.setAttribute('href', url);
  }

  function formatMetaDescription(text, fallback) {
    const raw = String(text || fallback || '').replace(/\s+/g, ' ').trim();
    if (raw.length >= 150 && raw.length <= 160) return raw;
    if (raw.length > 160) return raw.substring(0, 157) + '...';
    // Pad to ~150 chars if too short
    const pad = ' Shop sustainable, ethical, and high-quality minimal streetwear designed for modern everyday wardrobe styling.';
    const combined = raw + pad;
    return combined.length > 160 ? combined.substring(0, 157) + '...' : combined;
  }

  function getCleanPath() {
    const raw = window.location.pathname.replace(/^\/|\.html$/g, '');
    return raw || 'index';
  }

  function getCategoryTitle(pathName) {
    const map = {
      'women': 'Women\'s Organic Streetwear & Apparel',
      'men': 'Men\'s Organic Streetwear & Apparel',
      'new-arrivals': 'New Arrivals & Fresh Streetwear Drops',
      'best-sellers': 'Best Sellers & Most Popular Streetwear',
      'collections': 'Minimal Streetwear Apparel Collections',
      'limited': 'Limited Edition Organic Streetwear',
      'shop': 'Shop All Premium Streetwear Clothing'
    };
    return map[pathName] || pathName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ─── DYNAMIC SEO UPDATER ──────────────────────────────────────────────────────

  window.ZavoraSEO = {
    updateProductSEO(product) {
      if (!product) return;

      const name = String(product.name || 'Zavora Unisex Premium Hoodie').trim();
      const title = `${name} | Zavora Fashion`;

      const rawDesc = product.description || product.seoDescription || `Discover the ${name} by Zavora Fashion. Crafted from premium organic materials for superior comfort, durability, and minimal aesthetic.`;
      const description = formatMetaDescription(rawDesc, `Shop the ${name} from Zavora Fashion.`);

      const id = String(product.printfulId || product.id || '862');
      const canonical = `${BASE_URL}/product.html?id=${encodeURIComponent(id)}`;

      const rawImg = product.img || (Array.isArray(product.images) ? product.images[0] : null) || DEFAULT_OG_IMAGE;
      const imageUrl = rawImg.startsWith('http') ? rawImg : `${BASE_URL}/${rawImg.replace(/^\//, '')}`;

      // Update Document Title & Description
      document.title = title;
      setMetaTag('name', 'description', description);
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setCanonicalUrl(canonical);

      // Open Graph Tags
      setMetaTag('property', 'og:site_name', 'Zavora Fashion');
      setMetaTag('property', 'og:type', 'product');
      setMetaTag('property', 'og:title', title);
      setMetaTag('property', 'og:description', description);
      setMetaTag('property', 'og:url', canonical);
      setMetaTag('property', 'og:image', imageUrl);
      setMetaTag('property', 'og:price:amount', Number(product.price || 94.89).toFixed(2));
      setMetaTag('property', 'og:price:currency', 'USD');

      // Twitter Card Tags
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:site', '@ZavoraFashion');
      setMetaTag('name', 'twitter:title', title);
      setMetaTag('name', 'twitter:description', description);
      setMetaTag('name', 'twitter:image', imageUrl);

      // Automatic Image ALT Tag updates on product page
      this.enhanceProductImageAlts(name);

      // Update Rich Schema if available
      if (window.ZavoraSchema && typeof window.ZavoraSchema.injectProductSchema === 'function') {
        window.ZavoraSchema.injectProductSchema(product);
      }
    },

    enhanceProductImageAlts(productName) {
      if (!productName) return;
      const images = document.querySelectorAll('main img, .product-detail img, .product-gallery img');
      images.forEach((img, index) => {
        const view = index === 0 ? 'Front View' : (index === 1 ? 'Back View' : (index === 2 ? 'Detail View' : `View ${index + 1}`));
        img.alt = `Zavora ${productName} ${view}`;
      });
    },

    initPageSEO() {
      const page = getCleanPath();
      const currentUrl = window.location.href.split('#')[0];

      // Standard Robots & Canonical
      setMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

      if (page === 'index') {
        // Home Page Meta
        const title = 'Zavora Fashion | Premium Organic Streetwear Clothing';
        const description = formatMetaDescription(
          'Shop Zavora Fashion for luxury organic streetwear, oversized tees, heavyweight hoodies, and minimal apparel designed for modern sustainable wardrobe styling.'
        );

        document.title = title;
        setMetaTag('name', 'description', description);
        setCanonicalUrl(`${BASE_URL}/`);

        setMetaTag('property', 'og:site_name', 'Zavora Fashion');
        setMetaTag('property', 'og:type', 'website');
        setMetaTag('property', 'og:title', title);
        setMetaTag('property', 'og:description', description);
        setMetaTag('property', 'og:url', `${BASE_URL}/`);
        setMetaTag('property', 'og:image', DEFAULT_OG_IMAGE);

        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:site', '@ZavoraFashion');
        setMetaTag('name', 'twitter:title', title);
        setMetaTag('name', 'twitter:description', description);
        setMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE);
      } else if (page !== 'product') {
        // Category / General Pages
        const catName = getCategoryTitle(page);
        const title = `${catName} | Zavora Fashion`;
        const description = formatMetaDescription(
          `Explore ${catName} at Zavora Fashion. Discover premium organic streetwear, sustainable fabrics, and minimal luxury clothing designed for effortless style.`
        );
        const canonical = `${BASE_URL}/${page}.html`;

        document.title = title;
        setMetaTag('name', 'description', description);
        setCanonicalUrl(canonical);

        setMetaTag('property', 'og:site_name', 'Zavora Fashion');
        setMetaTag('property', 'og:type', 'website');
        setMetaTag('property', 'og:title', title);
        setMetaTag('property', 'og:description', description);
        setMetaTag('property', 'og:url', canonical);
        setMetaTag('property', 'og:image', DEFAULT_OG_IMAGE);

        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:site', '@ZavoraFashion');
        setMetaTag('name', 'twitter:title', title);
        setMetaTag('name', 'twitter:description', description);
        setMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE);
      }

      // Auto-fix missing ALT tags across all images on current page
      document.querySelectorAll('img').forEach((img) => {
        if (!img.alt || img.alt.trim() === '' || img.alt === 'image') {
          const parentText = img.closest('.product-card, .card, article, section')?.querySelector('h2, h3, h4')?.textContent?.trim();
          img.alt = parentText ? `Zavora ${parentText} Apparel View` : 'Zavora Fashion Premium Organic Streetwear';
        }
      });
    }
  };

  // Run initial page SEO setup on DOMReady
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ZavoraSEO.initPageSEO());
  } else {
    window.ZavoraSEO.initPageSEO();
  }
})();
