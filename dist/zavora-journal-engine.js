/**
 * Zavora Fashion — Daily Automatic Product Journal Engine
 * Features: Auto-generates daily SEO product articles, Article JSON-LD Schema, direct product buy widgets & archives.
 */

(function () {
  'use strict';

  const BASE_URL = 'https://www.zavorafashion.com';

  const STYLING_ANGLES = [
    {
      subtitle: "The Ultimate Guide to Elevating Your Streetwear Wardrobe",
      intro: "Modern streetwear isn't just about clothing—it's an architectural expression of comfort, luxury fabric, and subtle confidence.",
      fitGuide: "Pair with relaxed cargo pants or tailored sweatpants for a balanced, drop-shoulder silhouette that transitions effortlessly from day to night.",
      fabricNote: "Crafted from 100% premium organic cotton, combining 480 GSM French Terry weight with eco-certified non-toxic dyes."
    },
    {
      subtitle: "Minimalist Aesthetic & Everyday Luxury Performance",
      intro: "Clean lines and unbranded luxury define the contemporary aesthetic. Minimalist wardrobe pieces allow texture and drape to speak for themselves.",
      fitGuide: "Layer under an oversized jacket or wear standalone with monochrome trousers for a clean, Scandinavian-inspired urban fit.",
      fabricNote: "Designed for longevity with reinforced double-stitched seams and pre-shrunk organic cotton that retains shape wash after wash."
    },
    {
      subtitle: "Seasonal Transition: Layering Essentials for Year-Round Style",
      intro: "Building a functional capsule wardrobe requires versatile anchors. Pieces that stack effortlessly offer infinite outfit combinations.",
      fitGuide: "Style with wide-leg trousers and clean sneakers for an elevated off-duty uniform suitable for travel, work, and city exploration.",
      fabricNote: "Features breathable natural fibers that regulate body temperature across changing seasons."
    }
  ];

  function getDailyProduct() {
    let catalog = [];
    try {
      catalog = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
    } catch (e) {}

    if (!catalog.length && window.__zavoraCatalogProducts?.length) {
      catalog = window.__zavoraCatalogProducts;
    }

    if (!catalog.length) {
      catalog = [{
        id: 862,
        printfulId: 862,
        name: "Zavora Women's Heavyweight Boxy T-Shirt",
        price: 94.89,
        category: "oversized-tees",
        img: "https://files.cdn.printful.com/products/862/22596_1743753167.jpg",
        description: "Women's Heavyweight Boxy T-Shirt — premium organic minimal streetwear by Zavora Fashion."
      }];
    }

    const dayNumber = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
    return {
      product: catalog[dayNumber % catalog.length],
      dayIndex: dayNumber,
      angle: STYLING_ANGLES[dayNumber % STYLING_ANGLES.length]
    };
  }

  function getPastDailyProducts(count = 6) {
    let catalog = [];
    try {
      catalog = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
    } catch (e) {}
    if (!catalog.length) return [];

    const todayIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
    const past = [];
    for (let i = 1; i <= count; i++) {
      const pastDay = todayIndex - i;
      const dateObj = new Date(pastDay * 86400000);
      const prod = catalog[pastDay % catalog.length];
      if (prod) {
        past.push({
          product: prod,
          dateStr: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
    }
    return past;
  }

  function renderDailyJournal() {
    const journalMain = document.querySelector('main');
    if (!journalMain || !window.location.pathname.includes('journal')) return;

    const { product, angle } = getDailyProduct();
    const pastPosts = getPastDailyProducts(6);
    const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Inject Article Schema into <head>
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': `Daily Edit: ${product.name} Style Guide`,
      'image': [product.img],
      'datePublished': new Date().toISOString(),
      'dateModified': new Date().toISOString(),
      'author': {
        '@type': 'Organization',
        'name': 'Zavora Editorial Team'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Zavora Fashion',
        'logo': {
          '@type': 'ImageObject',
          'url': `${BASE_URL}/assets/zavora-logo.png`
        }
      },
      'description': `${product.name} — ${angle.subtitle}. Read our daily styling guide, fabric breakdown, and outfit recommendations.`
    };

    let script = document.getElementById('zavora-journal-schema');
    if (!script) {
      script = document.createElement('script');
      script.id = 'zavora-journal-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(articleSchema, null, 2);

    // Render Daily Feature Article Section
    journalMain.innerHTML = `
      <section class="magazine-hero">
        <div>
          <p class="eyebrow">Daily Journal • ${todayFormatted}</p>
          <h1>Daily Product Edit: ${product.name}</h1>
          <p>${angle.subtitle}</p>
        </div>
      </section>

      <section class="editorial-section journal-feature" style="display:grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 60px;">
        <div style="position:relative; overflow:hidden; border-radius:12px; background:#111;">
          <img src="${product.img}" alt="Zavora ${product.name} Editorial Front View" style="width:100%; height:auto; object-fit:cover; display:block;">
        </div>
        <article style="padding: 10px;">
          <p class="eyebrow" style="color:#c9a227; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Today's Featured Silhouette</p>
          <h2 style="font-size:2rem; margin: 10px 0 15px;">${product.name}</h2>
          <p style="line-height:1.7; opacity:0.9; margin-bottom: 20px;">${angle.intro}</p>
          
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:8px; margin-bottom:25px;">
            <h3 style="font-size:1.1rem; margin-bottom:8px;">Styling & Fit Guide</h3>
            <p style="font-size:0.95rem; line-height:1.6; opacity:0.85;">${angle.fitGuide}</p>
            
            <h3 style="font-size:1.1rem; margin:15px 0 8px;">Fabric & Quality</h3>
            <p style="font-size:0.95rem; line-height:1.6; opacity:0.85;">${angle.fabricNote}</p>
          </div>

          <div style="display:flex; gap:15px; align-items:center;">
            <strong style="font-size:1.5rem; color:#fff;">$${Number(product.price).toFixed(2)}</strong>
            <button type="button" data-add="${product.id}" style="background:#fff; color:#000; padding:12px 24px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Add to Bag</button>
            <a href="product.html?id=${encodeURIComponent(product.id || product.printfulId)}" style="color:#fff; text-decoration:underline; font-size:0.95rem;">View Full Product</a>
          </div>
        </article>
      </section>

      ${pastPosts.length ? `
      <section class="editorial-section">
        <p class="eyebrow">Previous Daily Edits</p>
        <h2>Recent Product Stories</h2>
        <div class="article-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-top:20px;">
          ${pastPosts.map(({ product: p, dateStr }) => `
            <article class="article-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:8px; overflow:hidden;">
              <a href="product.html?id=${encodeURIComponent(p.id || p.printfulId)}">
                <img src="${p.img}" alt="Zavora ${p.name}" style="width:100%; height:240px; object-fit:cover;">
              </a>
              <div style="padding:16px;">
                <span style="font-size:0.8rem; color:#888;">${dateStr}</span>
                <h3 style="font-size:1.1rem; margin:6px 0 10px;"><a href="product.html?id=${encodeURIComponent(p.id || p.printfulId)}" style="color:#fff; text-decoration:none;">${p.name}</a></h3>
                <strong style="display:block; color:#c9a227; margin-bottom:12px;">$${Number(p.price).toFixed(2)}</strong>
                <button type="button" data-add="${p.id}" style="width:100%; background:transparent; border:1px solid rgba(255,255,255,0.3); color:#fff; padding:8px; border-radius:4px; cursor:pointer;">Add to Bag</button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <section class="editorial-section newsletter" style="margin-top:60px;">
        <p class="eyebrow">Daily Journal Newsletter</p>
        <h2>Get daily product stories and exclusive drops delivered.</h2>
        <form><input type="email" placeholder="Enter your email" aria-label="Email"><button type="button">Subscribe</button></form>
      </section>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDailyJournal);
  } else {
    renderDailyJournal();
  }
})();
