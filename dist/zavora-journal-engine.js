/**
 * Zavora Fashion — Daily Automatic Product Journal Engine (20+ Stories)
 * Features: Auto-generates 20+ daily SEO product articles, Article JSON-LD Schema, direct product buy widgets & category filters.
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
    },
    {
      subtitle: "Architectural Cut & Heavyweight Comfort",
      intro: "Structured boxy cuts give effortless structure to daily outfits. Heavyweight organic fabrics provide shape without stiffness.",
      fitGuide: "Combine with monochrome caps and minimal footwear for a refined, modern streetwear uniform.",
      fabricNote: "Sustainably woven with zero harsh chemicals for maximum skin comfort and durability."
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

  function getPastDailyProducts(count = 20) {
    let catalog = [];
    try {
      catalog = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
    } catch (e) {}
    if (!catalog.length && window.__zavoraCatalogProducts?.length) {
      catalog = window.__zavoraCatalogProducts;
    }

    if (!catalog.length) return [];

    const todayIndex = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
    const past = [];
    for (let i = 1; i <= count; i++) {
      const pastDay = todayIndex - i;
      const dateObj = new Date(pastDay * 86400000);
      const prod = catalog[pastDay % catalog.length];
      const angle = STYLING_ANGLES[pastDay % STYLING_ANGLES.length];
      if (prod) {
        past.push({
          product: prod,
          angle: angle,
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
    const pastPosts = getPastDailyProducts(20);
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

    // Render Daily Feature Article & 20+ Stories Grid
    journalMain.innerHTML = `
      <section class="magazine-hero" style="text-align:center; padding: 40px 20px;">
        <div>
          <p class="eyebrow" style="color:#c9a227; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Zavora Editorial Journal • ${todayFormatted}</p>
          <h1 style="font-size:2.5rem; margin:10px 0;">Daily Edit: ${product.name}</h1>
          <p style="opacity:0.85; max-width:700px; margin:0 auto;">${angle.subtitle}</p>
        </div>
      </section>

      <section class="editorial-section journal-feature" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; align-items: center; margin-bottom: 60px;">
        <div style="position:relative; overflow:hidden; border-radius:12px; background:#111;">
          <img src="${product.img}" alt="Zavora ${product.name} Editorial View" style="width:100%; height:auto; object-fit:cover; display:block;">
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

          <div style="display:flex; gap:15px; align-items:center; flex-wrap:wrap;">
            <strong style="font-size:1.5rem; color:#fff;">$${Number(product.price).toFixed(2)}</strong>
            <button type="button" data-add="${product.id}" style="background:#fff; color:#000; padding:12px 24px; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Add to Bag</button>
            <a href="product.html?id=${encodeURIComponent(product.id || product.printfulId)}" style="color:#fff; text-decoration:underline; font-size:0.95rem;">View Full Product</a>
          </div>
        </article>
      </section>

      <section class="editorial-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:20px;">
          <div>
            <p class="eyebrow">Product Stories Archive</p>
            <h2 style="font-size:1.8rem; margin-top:4px;">Recent Daily Edits (${pastPosts.length} Stories)</h2>
          </div>
        </div>

        <div class="article-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
          ${pastPosts.map(({ product: p, dateStr, angle: a }) => `
            <article class="article-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; justify:space-between;">
              <div>
                <a href="product.html?id=${encodeURIComponent(p.id || p.printfulId)}">
                  <img src="${p.img}" alt="Zavora ${p.name}" style="width:100%; height:240px; object-fit:cover;">
                </a>
                <div style="padding:16px;">
                  <span style="font-size:0.8rem; color:#c9a227; font-weight:500;">${dateStr} • Style Story</span>
                  <h3 style="font-size:1.1rem; margin:6px 0 8px;"><a href="product.html?id=${encodeURIComponent(p.id || p.printfulId)}" style="color:#fff; text-decoration:none;">${p.name}</a></h3>
                  <p style="font-size:0.88rem; opacity:0.75; line-height:1.5; margin-bottom:12px;">${a.subtitle}</p>
                </div>
              </div>
              <div style="padding:16px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#fff; font-size:1.1rem;">$${Number(p.price).toFixed(2)}</strong>
                <button type="button" data-add="${p.id}" style="background:transparent; border:1px solid rgba(255,255,255,0.3); color:#fff; padding:6px 14px; border-radius:4px; cursor:pointer; font-size:0.85rem;">Add to Bag</button>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="editorial-section newsletter" style="margin-top:60px; text-align:center;">
        <p class="eyebrow">Daily Journal Newsletter</p>
        <h2 style="font-size:1.8rem; margin:10px 0;">Get daily product stories and exclusive drops delivered.</h2>
        <form style="display:flex; justify-content:center; gap:10px; max-width:500px; margin:20px auto 0;"><input type="email" placeholder="Enter your email" aria-label="Email" style="padding:12px; border-radius:6px; border:1px solid #444; background:#111; color:#fff; flex:1;"><button type="button" style="padding:12px 24px; background:#fff; color:#000; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Subscribe</button></form>
      </section>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDailyJournal);
  } else {
    renderDailyJournal();
  }
})();
