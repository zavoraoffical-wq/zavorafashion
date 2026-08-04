process.env.MONGODB_URI = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_DB = 'zavora_fashion';

const { ProductRepository } = require('../lib/local-product-engine');

function isRealStorefrontProduct(product = {}) {
  const text = `${product.name || ''} ${product.title || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  const images = [
    product.img,
    product.image,
    product.thumbnail,
    product.hoverImage,
    ...(Array.isArray(product.images) ? product.images : [])
  ].filter(Boolean).join(' ').toLowerCase();
  const fakeText = /\b(demo|sample product|placeholder|lorem ipsum)\b/i;
  const fakeAsset = /zavora-(women|men|hero-clean|premium-hero)|studio-wide-trouser/i;
  return !fakeText.test(text) && !fakeAsset.test(images);
}

async function testFilter() {
  const savedData = await ProductRepository.findProducts({ limit: 60, status: 'all' });
  console.log("Raw findProducts count:", savedData.products.length);

  const filtered = savedData.products.filter(isRealStorefrontProduct);
  console.log("Filtered count with isRealStorefrontProduct:", filtered.length);

  if (savedData.products.length > 0 && filtered.length === 0) {
    console.log("REJECTED PRODUCT SAMPLE:", savedData.products[0]);
  }
}

testFilter();
