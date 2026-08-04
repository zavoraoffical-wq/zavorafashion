const { ProductRepository } = require('../lib/local-product-engine');

async function testSpeed() {
  const start = Date.now();
  console.log("Fetching products from ProductRepository...");
  const data = await ProductRepository.findProducts({ limit: 100 });
  const duration = Date.now() - start;
  console.log(`[SUCCESS] Returned ${data.products.length} products (Total: ${data.total}) in ${duration}ms!`);
  if (data.products.length > 0) {
    console.log("Sample Product 1:", data.products[0].name, "- $" + data.products[0].price);
    console.log("Sample Product 2:", data.products[1].name, "- $" + data.products[1].price);
  }
}

testSpeed();
