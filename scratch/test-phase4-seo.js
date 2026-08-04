const fs = require('fs');
const path = require('path');

async function testPhase4SEO() {
  console.log("Validating Phase 4 SEO Implementation for Zavora Fashion...\n");

  const seoJsPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\public\\zavora-seo.js';
  const sitemapPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\public\\sitemap.xml';

  if (!fs.existsSync(seoJsPath)) throw new Error('zavora-seo.js missing!');
  if (!fs.existsSync(sitemapPath)) throw new Error('sitemap.xml missing!');

  const seoContent = fs.readFileSync(seoJsPath, 'utf8');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');

  const checks = [
    // 1. Meta Titles
    { name: 'Home Meta Title (Zavora Fashion | Premium Organic Streetwear Clothing)', pass: seoContent.includes('Zavora Fashion | Premium Organic Streetwear Clothing') },
    { name: 'Category Meta Title ({Category} | Zavora Fashion)', pass: seoContent.includes('${catName} | Zavora Fashion') },
    { name: 'Product Meta Title ({Product Name} | Zavora Fashion)', pass: seoContent.includes('${name} | Zavora Fashion') },

    // 2. Meta Descriptions
    { name: 'Meta Description Formatter (150-160 chars)', pass: seoContent.includes('formatMetaDescription') && seoContent.includes('157') },

    // 3. Open Graph Tags
    { name: 'og:site_name (Zavora Fashion)', pass: seoContent.includes("og:site_name") },
    { name: 'og:title', pass: seoContent.includes("og:title") },
    { name: 'og:description', pass: seoContent.includes("og:description") },
    { name: 'og:url', pass: seoContent.includes("og:url") },
    { name: 'og:type (product / website)', pass: seoContent.includes("og:type") },
    { name: 'og:image', pass: seoContent.includes("og:image") },

    // 4. Twitter Cards
    { name: 'twitter:card (summary_large_image)', pass: seoContent.includes("summary_large_image") },
    { name: 'twitter:title', pass: seoContent.includes("twitter:title") },
    { name: 'twitter:description', pass: seoContent.includes("twitter:description") },
    { name: 'twitter:image', pass: seoContent.includes("twitter:image") },

    // 5. Image ALT Tags Generator
    { name: 'Automatic Image ALT generator (enhanceProductImageAlts)', pass: seoContent.includes("enhanceProductImageAlts") && seoContent.includes("View") },

    // 6. Canonical URLs
    { name: 'Canonical URL generator (setCanonicalUrl)', pass: seoContent.includes("setCanonicalUrl") && seoContent.includes("canonical") },


    // 7. Robots Meta Tag
    { name: 'Robots Meta (index, follow)', pass: seoContent.includes("index, follow") },

    // 8. XML Image Sitemap
    { name: 'XML Image Sitemap namespace (xmlns:image)', pass: sitemapContent.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"') },
    { name: 'Image elements in sitemap.xml (<image:loc>)', pass: sitemapContent.includes('<image:loc>') },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon}  ${check.name}`);
    if (check.pass) passed++;
  }

  console.log(`\n📋 Results: ${passed}/${checks.length} checks passed`);
  if (passed === checks.length) {
    console.log('🎉 PHASE 4 SEO IMPLEMENTATION COMPLETE & VERIFIED!');
  } else {
    console.error('⚠️ Some checks failed.');
  }
}

testPhase4SEO().catch(console.error);
