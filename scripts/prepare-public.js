const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'public');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (['api', 'lib', 'node_modules', '.git'].includes(entry.name)) continue;
    if (['package.json', 'package-lock.json', 'npm-shrinkwrap.json'].includes(entry.name)) continue;
    if (/\.(bat|cmd|ps1|env|map)$/i.test(entry.name)) continue;
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function removeMetaByName(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`\\s*<meta\\s+[^>]*name=["']${escapedName}["'][^>]*>`, 'gi'), '');
}

function ensureHeadTag(html, tag) {
  if (!html.includes('</head>')) return html;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function removeFacebookPixel(html) {
  html = html.replace(/\s*<!-- Facebook Pixel Code -->[\s\S]*?<!-- End Facebook Pixel Code -->/gi, '');
  html = html.replace(/\s*<script>\s*!function\(f,b,e,v,n,t,s\)[\s\S]*?fbq\('track',\s*'PageView'\);\s*<\/script>/gi, '');
  html = html.replace(/\s*<noscript>\s*<img[^>]*facebook\.com\/tr[^>]*>\s*<\/noscript>/gi, '');
  return html;
}

function optimizeImageTags(html) {
  html = html.replace(/<img\b(?![^>]*\bdecoding=)([^>]*)>/gi, '<img decoding="async"$1>');
  html = html.replace(/<img\b(?![^>]*\bloading=)([^>]*)>/gi, '<img loading="lazy"$1>');
  html = html.replace(/<img([^>]*class=["'][^"']*brand-mark[^"']*["'][^>]*)loading=["']lazy["']([^>]*)>/gi, '<img$1loading="eager"$2>');
  html = html.replace(/<img([^>]*?)loading=["']lazy["']([^>]*class=["'][^"']*brand-mark[^"']*["'][^>]*)>/gi, '<img$1loading="eager"$2>');
  html = html.replace(/(<main\b[\s\S]*?)<img([^>]*?)loading=["']lazy["']([^>]*?)>/i, '$1<img$2loading="eager" fetchpriority="high"$3>');
  return html;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function addBrandHeadTags() {
  const googleTagScript = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8YGED71VN8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8YGED71VN8');
</script>`;
  const faviconTags = [
    '<link rel="icon" type="image/png" href="/assets/zavora-logo.png">',
    '<link rel="apple-touch-icon" href="/assets/zavora-logo.png">'
  ].join('\n    ');
  const analyticsScript = '<script defer src="/_vercel/insights/script.js"></script>';
  const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
  const googleVerificationTag = '<meta name="google-site-verification" content="4AjlsEXnNoFfemeS-JvQk7talZoGEnLllMa-zfCByb8" />';
  const bingVerificationTag = '<meta name="msvalidate.01" content="CC6B9BB912CA5CABD10A850C960AE1EC" />';

  const cssVersionTag = `href="styles.css?v=${Date.now()}"`;
  const jsVersion = Date.now();
  const adminHtmlFiles = new Set(['admin.html', 'admin-login.html']);
  for (const file of walkHtmlFiles(target)) {
    const fileName = path.basename(file).toLowerCase();
    const isAdminHtml = adminHtmlFiles.has(fileName);
    let html = fs.readFileSync(file, 'utf8');
    html = removeFacebookPixel(html);
    html = html.replace(/href=["']styles\.css(\?v=[^"']*)?["']/gi, cssVersionTag);
    html = html.replace(/src=["']script\.js(\?v=[^"']*)?["']/gi, `src="script.js?v=${jsVersion}"`);
    html = html.replace(/src=["']page-script\.js(\?v=[^"']*)?["']/gi, `src="page-script.js?v=${jsVersion}"`);
    html = html.replace(/src=["']paypal-checkout\.js(\?v=[^"']*)?["']/gi, `src="paypal-checkout.js?v=${jsVersion}"`);
    html = html.replace(/src=["']admin\.js(\?v=[^"']*)?["']/gi, `src="admin.js?v=${jsVersion}"`);
    html = html.replace(/src=["']admin-login\.js(\?v=[^"']*)?["']/gi, `src="admin-login.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-analytics\.js(\?v=[^"']*)?["']/gi, `src="zavora-analytics.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-schema\.js(\?v=[^"']*)?["']/gi, `src="zavora-schema.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-seo\.js(\?v=[^"']*)?["']/gi, `src="zavora-seo.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-journal-engine\.js(\?v=[^"']*)?["']/gi, `src="zavora-journal-engine.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-product-renderer\.js(\?v=[^"']*)?["']/gi, `src="zavora-product-renderer.js?v=${jsVersion}"`);
    html = html.replace(/src=["']zavora-currency-engine\.js(\?v=[^"']*)?["']/gi, `src="zavora-currency-engine.js?v=${jsVersion}"`);
    html = optimizeImageTags(html);
    // Remove any existing Google Tag to avoid duplication
    html = html.replace(/\s*<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config', 'G-8YGED71VN8'\);\s*<\/script>/gi, '');
    
    // Inject Google Tag IMMEDIATELY after <head>
    if (/<head\b[^>]*>/i.test(html)) {
      html = html.replace(/(<head\b[^>]*>)/i, `$1\n${googleTagScript}`);
    }
    
    html = removeMetaByName(html, 'viewport');
    html = removeMetaByName(html, 'google-site-verification');
    html = removeMetaByName(html, 'msvalidate.01');
    html = ensureHeadTag(html, viewportTag);
    html = ensureHeadTag(html, googleVerificationTag);
    html = ensureHeadTag(html, bingVerificationTag);
    if (!html.includes('zavora-analytics.js') && html.includes('</head>')) {
      html = html.replace('</head>', `    <script src="zavora-analytics.js?v=${jsVersion}"></script>\n  </head>`);
    }
    if (!html.includes('zavora-schema.js') && html.includes('</head>')) {
      html = html.replace('</head>', `    <script src="zavora-schema.js?v=${jsVersion}"></script>\n  </head>`);
    }
    if (!html.includes('zavora-seo.js') && html.includes('</head>')) {
      html = html.replace('</head>', `    <script src="zavora-seo.js?v=${jsVersion}"></script>\n  </head>`);
    }
    if (fileName.includes('journal') && !html.includes('zavora-journal-engine.js') && html.includes('</head>')) {
      html = html.replace('</head>', `    <script src="zavora-journal-engine.js?v=${jsVersion}"></script>\n  </head>`);
    }
    if (fileName.includes('product') && !html.includes('zavora-product-renderer.js') && html.includes('</head>')) {
      html = html.replace('</head>', `    <script src="zavora-product-renderer.js?v=${jsVersion}"></script>\n  </head>`);
    }
    if (!html.includes('rel="icon"') && html.includes('</head>')) {
      html = html.replace('</head>', `    ${faviconTags}\n  </head>`);
    }
    if (!html.includes('/_vercel/insights/script.js') && html.includes('</body>')) {
      html = html.replace('</body>', `  ${analyticsScript}\n</body>`);
    }
    fs.writeFileSync(file, html);
  }
}


function writeSeoFiles() {
  const baseUrl = 'https://www.zavorafashion.com';
  const pages = walkHtmlFiles(target)
    .map((file) => {
      const relative = path.relative(target, file).replace(/\\/g, '/');
      if (relative === 'index.html') return '/';
      return `/${relative}`;
    })
    .sort();

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...pages.map((page) => {
      const isHome = page === '/';
      const priority = isHome ? '1.0' : (['/shop.html', '/women.html', '/men.html', '/new-arrivals.html'].includes(page) ? '0.9' : '0.8');
      const changefreq = isHome ? 'daily' : 'weekly';
      let imgXml = '';
      if (isHome || page === '/shop.html') {
        imgXml = `\n    <image:image>\n      <image:loc>${baseUrl}/assets/og-image.jpg</image:loc>\n      <image:title>Zavora Fashion Premium Organic Streetwear</image:title>\n    </image:image>`;
      }
      return [
        '  <url>',
        `    <loc>${escapeXml(`${baseUrl}${page}`)}</loc>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>${imgXml}`,
        '  </url>'
      ].join('\n');
    }),
    '</urlset>',
    ''
  ].join('\n');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(target, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(target, 'robots.txt'), robots);
}

if (!fs.existsSync(source)) {
  throw new Error('dist folder is missing');
}

fs.rmSync(target, { recursive: true, force: true });
copyDir(source, target);
addBrandHeadTags();
injectFullFooter();
writeSeoFiles();
console.log('Copied dist to public for Vercel static output.');

// ============================================================
// INJECT FULL HOMEPAGE FOOTER INTO EVERY PAGE
// Replaces <footer class="footer"> on every page (except index.html
// and admin pages) with the exact full footer from the homepage.
// ============================================================
function injectFullFooter() {
  const FULL_FOOTER_HTML = `<footer class="footer">
  <section class="footer-top">
    <div class="footer-brand"><strong>ZAVORA FASHION</strong><p>Premium Streetwear.<br>Designed for the USA.</p></div>
    <img class="footer-hero-img" src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80" alt="Zavora premium fashion campaign" loading="lazy">
  </section>
  <section class="footer-gallery" aria-label="Zavora premium lifestyle images">
    <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle one" loading="lazy"><span>Shop Now</span></a>
    <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle two" loading="lazy"><span>Shop Now</span></a>
    <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle three" loading="lazy"><span>Shop Now</span></a>
    <a class="footer-shot" href="shop.html"><img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=80" alt="Zavora lifestyle four" loading="lazy"><span>Shop Now</span></a>
  </section>
  <section class="instagram-grid" aria-label="Follow Zavora Fashion">
    <img src="https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 1" loading="lazy">
    <img src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 2" loading="lazy">
    <img src="https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 3" loading="lazy">
    <img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 4" loading="lazy">
    <img src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 5" loading="lazy">
    <img src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 6" loading="lazy">
    <img src="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 7" loading="lazy">
    <img src="https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 8" loading="lazy">
    <img src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 9" loading="lazy">
    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 10" loading="lazy">
    <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 11" loading="lazy">
    <img src="https://images.unsplash.com/photo-1506629905607-d405d7d3b0d2?auto=format&fit=crop&w=300&q=80" alt="Follow Zavora Fashion 12" loading="lazy">
  </section>
  <section class="footer-bottom">
    <nav class="footer-links" aria-label="Footer navigation"><a href="shop.html">Shop</a><a href="about.html">About</a><a href="journal.html">Journal</a><a href="track-order.html">Track Order</a><a href="return-refund-policy.html">Returns</a><a href="privacy-policy.html">Privacy</a><a href="terms-conditions.html">Terms</a><a href="contact.html">Contact</a></nav>
    <p class="footer-copy">Follow Us: <a href="https://www.facebook.com/profile.php/?id=61579777109389" target="_blank" rel="noopener" style="margin-right:8px;color:inherit;text-decoration:none;opacity:0.8;">Facebook</a> <a href="https://www.instagram.com/zavora_fashion/" target="_blank" rel="noopener" style="margin-right:8px;color:inherit;text-decoration:none;opacity:0.8;">Instagram</a> <a href="https://x.com/zavoraoffical" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;opacity:0.8;">X</a><br>&copy; 2026 Zavora Fashion</p>
    <form class="footer-newsletter"><input type="email" placeholder="Email" aria-label="Newsletter email"><button type="button">Join</button></form>
  </section>
</footer>`;

  const skipPages = new Set(['admin.html', 'admin-login.html', 'index.html']);
  const FOOTER_REGEX = /<footer\b[^>]*class="[^"]*\bfooter\b[^"]*"[^>]*>[\s\S]*?<\/footer>/i;

  let count = 0;
  for (const file of walkHtmlFiles(target)) {
    const fileName = path.basename(file);
    if (skipPages.has(fileName)) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (!FOOTER_REGEX.test(html)) continue;
    html = html.replace(FOOTER_REGEX, FULL_FOOTER_HTML);
    fs.writeFileSync(file, html);
    count++;
  }
  console.log(`Injected full homepage footer into ${count} pages.`);
}
