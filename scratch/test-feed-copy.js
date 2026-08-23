'use strict';

const assert = require('assert');
const { _test } = require('../api/feed');

const xml = _test.buildVariantItems({
  id: 659,
  name: 'Zavora Button Shirt',
  description: 'A clean button shirt for an everyday wardrobe.',
  category: 'oversized-tees',
  gender: 'female',
  material: 'Breathable cotton jersey with a soft touch.',
  colors: ['White'],
  sizes: ['2XS'],
  price: 204.09,
  stock: 5,
  img: 'https://example.com/product.jpg',
});

assert.match(xml, /<g:id>ZAV-659-white-2xs<\/g:id>/);
assert.match(xml, /<g:title>Zavora Button Shirt - Women&apos;s, Cotton, White, Size 2XS<\/g:title>/);
assert.match(xml, /color White, size 2XS, material: Breathable cotton jersey with a soft touch\./);
assert.match(xml, /<g:price>204\.09 USD<\/g:price>/);
assert.match(xml, /<g:color>White<\/g:color>/);
assert.match(xml, /<g:size>2XS<\/g:size>/);

console.log('Feed copy test passed: optimized attributes present; ID and price unchanged.');
