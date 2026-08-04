const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function debugFilter() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');
  const col = db.collection('products');

  console.log("Total docs in collection:", await col.countDocuments({}));

  const statusFilter = {
    $or: [
      { 'payload.status': 'active' },
      { 'payload.status': 'published' },
      { 'payload.published': true },
      { 'payload.status': { $exists: false } },
      { status: 'active' },
      { status: 'published' },
      { published: true }
    ]
  };

  console.log("Count with statusFilter alone:", await col.countDocuments(statusFilter));

  const doc = await col.findOne({});
  console.log("Keys in sample doc:", Object.keys(doc));
  console.log("Sample doc status field:", doc.status, "| published field:", doc.published);

  await client.close();
}

debugFilter();
