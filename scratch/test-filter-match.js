const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function testFilterMatch() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');
  const col = db.collection('products');

  // Test 1: Query with payload.category (old filter)
  const countPayloadCategory = await col.countDocuments({ 'payload.category': 'sportswear' });
  console.log("Count with payload.category = sportswear:", countPayloadCategory);

  // Test 2: Query with top-level or payload category (flexible filter)
  const countFlexibleCategory = await col.countDocuments({
    $or: [
      { category: 'sportswear' },
      { 'payload.category': 'sportswear' }
    ]
  });
  console.log("Count with flexible category = sportswear:", countFlexibleCategory);

  // Test 3: Flexible find for all active/published products
  const allLiveCount = await col.countDocuments({
    $or: [
      { status: 'published' },
      { status: 'active' },
      { published: true },
      { 'payload.status': 'published' },
      { 'payload.status': 'active' },
      { 'payload.published': true }
    ]
  });
  console.log("Total Live/Published Products in MongoDB:", allLiveCount);

  await client.close();
}

testFilterMatch();
