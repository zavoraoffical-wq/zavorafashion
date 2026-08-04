const { db: mongoDb } = require('../lib/auth-lib');

async function debugGetCollection() {
  console.log("Debugging getCollection step-by-step...");
  try {
    console.log("Step 1: Calling mongoDb()...");
    const database = await mongoDb();
    console.log("Step 1 OK! Database name:", database.databaseName);

    console.log("Step 2: Getting collection 'products'...");
    const col = database.collection('products');
    console.log("Step 2 OK!");

    console.log("Step 3: Creating index { printfulId: 1 }...");
    await col.createIndex({ printfulId: 1 }, { unique: true });
    console.log("Step 3 OK!");

    console.log("Step 4: Creating remaining indexes...");
    await col.createIndex({ 'payload.gender': 1, 'payload.category': 1, 'payload.status': 1 });
    await col.createIndex({ 'payload.collection': 1 });
    await col.createIndex({ 'payload.price': 1 });
    await col.createIndex({ updatedAt: -1 });
    console.log("Step 4 OK!");

    console.log("Step 5: Creating text index...");
    await col.createIndex({
      'payload.name': 'text',
      'payload.category': 'text',
      'payload.description': 'text'
    }, { weights: { 'payload.name': 10, 'payload.category': 5, 'payload.description': 1 } });
    console.log("Step 5 OK!");

  } catch (err) {
    console.error("DEBUG ERROR IN getCollection:", err);
  }
}

debugGetCollection();
