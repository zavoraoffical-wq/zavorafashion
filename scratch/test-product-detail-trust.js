'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const renderer = fs.readFileSync(path.join(__dirname, '..', 'dist', 'zavora-product-renderer.js'), 'utf8');
const importer = fs.readFileSync(path.join(__dirname, '..', 'api', 'printful-products.js'), 'utf8');
const homepage = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
const admin = fs.readFileSync(path.join(__dirname, '..', 'dist', 'admin.js'), 'utf8');
const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'dist', 'admin.html'), 'utf8');

assert(renderer.includes('product.material'));
assert(renderer.includes('product.sizeGuide'));
assert(renderer.includes('product.modelInfo'));
assert(renderer.includes('product.shipping'));
assert(renderer.includes('return-refund-policy.html'));
assert(!renderer.includes('Customer Reviews (4.9 / 5.0)'));
assert(!renderer.includes('100% GOTS certified organic French Terry cotton'));
assert(!renderer.includes('Made in certified fair-trade facilities'));
assert(importer.includes('firstVerifiedField'));
assert(importer.includes('imageDetailsFromProduct'));
assert(importer.includes('compareAt: null'));
assert(importer.includes('sale: false'));
assert(importer.includes("const ULTRA_PRODUCT_IDS = ['340', '515', '791', '665', '655', '832', '108', '328', '329', '862']"));
assert(importer.includes("action === 'ultra10'"));
const ultraBlock = importer.match(/async function enrichUltraProduct[\s\S]*?\r?\n}\r?\n\r?\nfunction supabaseProductRow/)?.[0] || '';
assert(ultraBlock.includes('...existing'));
assert(!/\n\s+price\s*:/.test(ultraBlock), 'Ultra enrichment must not override the existing selling price');
assert(adminHtml.includes('id="btnUltraOptimize10"'));
assert(admin.includes('/api/printful-products?action=ultra10'));
assert(homepage.includes('Elevated essentials.<br>Modern streetwear.'));
assert(homepage.includes('Thoughtful silhouettes, detailed product information and free standard USA shipping.'));
assert(homepage.includes('Explore the Collection'));

console.log('Product detail trust test passed.');
