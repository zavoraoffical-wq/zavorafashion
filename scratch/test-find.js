process.env.MONGODB_URI = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';
process.env.MONGODB_DB = 'zavora_fashion';

const { ProductRepository } = require('../lib/local-product-engine');
const { db: mongoDb } = require('../lib/auth-lib');

async function debugExactQuery() {
  console.log("Debugging exact ProductRepository.findProducts() steps...");
  const db = await mongoDb();
  const col = db.collection('products');
  const totalInDb = await col.countDocuments({});
  console.log("Total docs in DB:", totalInDb);

  const res = await ProductRepository.findProducts({ limit: 60, status: 'all' });
  console.log("findProducts({ status: 'all' }):", res.total, "products:", res.products ? res.products.length : 0);

  const resActive = await ProductRepository.findProducts({ limit: 60 });
  console.log("findProducts({}):", resActive.total, "products:", resActive.products ? resActive.products.length : 0);

  if (resActive.products && resActive.products.length > 0) {
    console.log("First product name:", resActive.products[0].name, "| Image:", resActive.products[0].img || resActive.products[0].image);
  }
}

debugExactQuery();
