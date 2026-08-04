process.env.MONGODB_URI = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_DB = 'zavora_fashion';

const { ProductRepository } = require('../lib/local-product-engine');

function productIsLive(product = {}) {
  const status = String(product.status || '').toLowerCase();
  if (product.published === false) return false;
  if (['draft', 'hidden', 'inactive', 'archived', 'blocked'].includes(status)) return false;
  return product.published === true || ['active', 'published', 'live'].includes(status);
}

async function testIsLive() {
  const savedData = await ProductRepository.findProducts({ limit: 60, status: 'all' });
  console.log("findProducts count:", savedData.products.length);

  const live = savedData.products.filter(productIsLive);
  console.log("Live products count with productIsLive:", live.length);

  if (savedData.products.length > 0 && live.length === 0) {
    console.log("SAMPLE PRODUCT STATUS & PUBLISHED FIELDS:", {
      status: savedData.products[0].status,
      published: savedData.products[0].published,
      name: savedData.products[0].name
    });
  }
}

testIsLive();
