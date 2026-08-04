const { ProductRepository } = require('../lib/local-product-engine');

async function testGetCollection() {
  console.log("Calling ProductRepository.getCollection()...");
  try {
    const col = await ProductRepository.getCollection();
    console.log("getCollection returned:", col ? "VALID COLLECTION" : "NULL (OFFLINE/ERROR)");
  } catch (err) {
    console.error("getCollection error:", err.message);
  }
}

testGetCollection();
