const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0";

async function testFull() {
  console.log("Connecting to MongoDB Atlas...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("CONNECTED SUCCESSFULLY!");
    const db = client.db('zavora_fashion');
    const res = await db.collection('test').insertOne({ status: 'ok', createdAt: new Date() });
    console.log("Write test result:", res.acknowledged);
    await db.collection('test').deleteOne({ _id: res.insertedId });
    console.log("Cleaned test document.");
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await client.close();
  }
}

testFull();
