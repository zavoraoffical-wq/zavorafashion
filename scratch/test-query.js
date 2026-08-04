const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function testQuery() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');
  const doc = await db.collection('products').findOne({});
  console.log("Sample document structure in MongoDB:");
  console.log(JSON.stringify(doc, null, 2));

  // Test query with top-level fields vs payload fields
  const countWithTopLevel = await db.collection('products').countDocuments({
    $or: [
      { status: 'active' },
      { status: 'published' },
      { published: true },
      { status: { $exists: false } },
      { 'payload.status': 'active' },
      { 'payload.status': 'published' },
      { 'payload.published': true }
    ]
  });

  console.log("Count matching top-level fields:", countWithTopLevel);
  await client.close();
}

testQuery();
