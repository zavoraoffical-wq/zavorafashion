const feedHandler = require('../api/feed');

async function validateFeed() {
  console.log("Validating Google Merchant feed v4 compliance...\n");

  let xml = '';
  let hdrs = {};
  const req = { method: 'GET', headers: {}, query: {} };
  const res = {
    statusCode: 200, headers: {},
    setHeader(k, v) { hdrs[k] = v; },
    end(body) { xml = body; }
  };

  const t0 = Date.now();
  await feedHandler(req, res);
  const ms = Date.now() - t0;

  const variants = (xml.match(/<item>/g) || []).length;
  const products = Number(hdrs['X-Feed-Products'] || 0);
  console.log(`📊 ${products} products → ${variants} variants`);
  console.log(`📦 Feed size: ${(xml.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱  Build time: ${ms}ms\n`);

  // Get first item for per-item checks
  const firstItem = (xml.match(/<item>([\s\S]*?)<\/item>/) || [])[1] || '';

  const checks = [
    // ── Required fields ──────────────────────────────────────────
    { name: 'RSS 2.0 namespace (xmlns:g)',           pass: xml.includes('xmlns:g="http://base.google.com/ns/1.0"') },
    { name: 'XML declaration present',               pass: xml.startsWith('<?xml version="1.0"') },
    { name: '<g:id> present',                        pass: firstItem.includes('<g:id>') },
    { name: '<g:item_group_id> present',             pass: xml.includes('<g:item_group_id>') },
    { name: '<g:title> present',                     pass: firstItem.includes('<g:title>') },
    { name: '<g:description> present',               pass: firstItem.includes('<g:description>') },
    { name: '<g:link> present',                      pass: firstItem.includes('<g:link>') },
    { name: '<g:image_link> present (CDN URL)',      pass: firstItem.includes('https://') && firstItem.includes('<g:image_link>') },
    // ── Availability & Price ─────────────────────────────────────
    { name: '<g:availability> present',              pass: firstItem.includes('<g:availability>') },
    { name: 'Currency is USD only',                  pass: xml.includes('USD') && !xml.includes('INR') && !xml.includes('EUR') && !xml.includes('GBP') },
    { name: 'Price format correct (XX.XX USD)',      pass: /\d+\.\d{2} USD/.test(firstItem) },
    { name: '<g:condition>new present',              pass: firstItem.includes('<g:condition>new</g:condition>') },
    // ── Apparel-specific ─────────────────────────────────────────
    { name: '<g:age_group>adult in ALL items',       pass: (xml.match(/<g:age_group>adult<\/g:age_group>/g) || []).length === variants },
    { name: '<g:gender>male present',                pass: xml.includes('<g:gender>male</g:gender>') },
    { name: '<g:gender>female present',              pass: xml.includes('<g:gender>female</g:gender>') },
    { name: 'No comma-separated sizes (e.g. XS,S)', pass: !/<g:size>[A-Z]+,[A-Z]/.test(xml) },
    { name: 'ONE <g:size> per item',                 pass: (firstItem.match(/<g:size>/g) || []).length === 1 },
    { name: '<g:color> present (no raw hex)',        pass: firstItem.includes('<g:color>') && !/<g:color>#[0-9a-fA-F]{6}/.test(firstItem) },
    { name: '<g:material> present',                  pass: firstItem.includes('<g:material>') },
    // ── Identifiers ───────────────────────────────────────────────
    { name: '<g:brand>Zavora present',               pass: firstItem.includes('<g:brand>Zavora</g:brand>') },
    { name: '<g:mpn> present',                       pass: firstItem.includes('<g:mpn>') },
    { name: '<g:identifier_exists>yes present',      pass: firstItem.includes('<g:identifier_exists>yes</g:identifier_exists>') },
    // ── Category ─────────────────────────────────────────────────
    { name: '<g:google_product_category> (numeric)', pass: /<g:google_product_category>\d+<\/g:google_product_category>/.test(firstItem) },
    { name: '<g:product_type> present',              pass: firstItem.includes('<g:product_type>') },
    // ── Shipping ─────────────────────────────────────────────────
    { name: '<g:shipping> USA (US) present',         pass: xml.includes('<g:country>US</g:country>') },
    { name: '<g:shipping> USD price',                pass: xml.includes('<g:price>0.00 USD</g:price>') },
    { name: 'No non-US countries in shipping',       pass: !/<g:country>(?!US)[A-Z]{2}<\/g:country>/.test(xml) },
    { name: '<g:shipping_weight> present',           pass: firstItem.includes('<g:shipping_weight>') },
  ];

  console.log("--- First item preview (key fields) ---");
  [
    'g:id', 'g:item_group_id', 'g:gender', 'g:age_group', 'g:color',
    'g:size', 'g:price', 'g:availability', 'g:google_product_category',
  ].forEach(tag => {
    const m = firstItem.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
    if (m) console.log(`  <${tag}>${m[1]}</${tag}>`);
  });
  console.log('');

  let passed = 0;
  let failed = 0;
  for (const check of checks) {
    const icon = check.pass ? '✅' : '❌';
    console.log(`${icon}  ${check.name}`);
    check.pass ? passed++ : failed++;
  }

  console.log(`\n📋 Results: ${passed}/${checks.length} passed`);
  if (failed === 0) {
    console.log('🎉 ALL CHECKS PASSED — Feed is Google Merchant compliant!');
  } else {
    console.log(`⚠️  ${failed} check(s) need attention.`);
  }
}

validateFeed().catch(console.error);
