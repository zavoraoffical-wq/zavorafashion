const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function verifyDb() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');

  const productsCount = await db.collection('products').countDocuments();
  const usersCount = await db.collection('users').countDocuments();
  const sampleProducts = await db.collection('products').find({}).project({ name: 1, printfulId: 1, price: 1 }).limit(5).toArray();
  const sampleUsers = await db.collection('users').find({}).project({ email: 1, name: 1 }).toArray();

  console.log("=== MONGODB ATLAS VERIFICATION ===");
  console.log("Total Products in MongoDB:", productsCount);
  console.log("Sample Products:", sampleProducts);
  console.log("Total Users in MongoDB:", usersCount);
  console.log("Sample Users:", sampleUsers);
  console.log("==================================");

  await client.close();
}

verifyDb();
