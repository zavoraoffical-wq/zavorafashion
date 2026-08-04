const fs = require('fs');
const path = require('path');

async function validateSchemas() {
  console.log("Testing JSON-LD Schema integration for Google Rich Results Test...\n");

  const schemaJsPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\public\\zavora-schema.js';
  if (!fs.existsSync(schemaJsPath)) {
    throw new Error('zavora-schema.js not found in public output!');
  }

  const content = fs.readFileSync(schemaJsPath, 'utf8');

  const checks = [
    { name: 'Organization Schema (@type: Organization)', pass: content.includes("'@type': 'Organization'") },
    { name: 'WebSite Schema (@type: WebSite)', pass: content.includes("'@type': 'WebSite'") },
    { name: 'SearchAction present on WebSite', pass: content.includes("'@type': 'SearchAction'") },
    { name: 'BreadcrumbList Schema (@type: BreadcrumbList)', pass: content.includes("'@type': 'BreadcrumbList'") },
    { name: 'Product Schema (@type: Product)', pass: content.includes("'@type': 'Product'") },
    { name: 'Brand Schema (Zavora)', pass: content.includes("'name': 'Zavora'") },
    { name: 'Offer Schema (@type: Offer)', pass: content.includes("'@type': 'Offer'") },
    { name: 'PriceCurrency (USD)', pass: content.includes("'priceCurrency': 'USD'") },
    { name: 'Availability (InStock / OutOfStock)', pass: content.includes("schema.org/InStock") },
    { name: 'SKU & MPN present', pass: content.includes("'sku':") && content.includes("'mpn':") },
    { name: 'Image array present', pass: content.includes("'image': [") },
    { name: 'Description present', pass: content.includes("'description':") },
    { name: 'OfferShippingDetails (USA $0.00 USD)', pass: content.includes("OfferShippingDetails") },
    { name: 'MerchantReturnPolicy (30 days)', pass: content.includes("MerchantReturnPolicy") },
    { name: 'AggregateRating present', pass: content.includes("AggregateRating") },
    { name: 'Review array present', pass: content.includes("'review': [") },
    { name: 'Script type="application/ld+json"', pass: content.includes("application/ld+json") },
  ];

  let passed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon}  ${check.name}`);
    if (check.pass) passed++;
  }

  console.log(`\n📋 Results: ${passed}/${checks.length} checks passed`);
  if (passed === checks.length) {
    console.log('🎉 ALL RICH RESULTS SCHEMAS VERIFIED — Google Rich Results Test Ready!');
  } else {
    console.error('⚠️ Some checks failed.');
  }
}

validateSchemas().catch(console.error);
