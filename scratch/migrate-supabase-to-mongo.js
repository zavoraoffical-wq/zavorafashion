const { MongoClient } = require('mongodb');

const supabaseUrl = 'https://mkqgmcciesnspfblqyni.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcWdtY2NpZXNuc3BmYmxxeW5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5OTExOSwiZXhwIjoyMTAxMTc1MTE5fQ.2etJVDfi8nR0eH8qv06hPsjhW921nGnRXKAS7YpXoEU';
const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function migrateAll() {
  console.log("Starting Migration from Supabase to MongoDB...");
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  const db = mongoClient.db('zavora_fashion');

  // 1. Fetch products from Supabase
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json'
      }
    });
    if (res.ok) {
      const rows = await res.json();
      console.log(`Found ${rows.length} products in Supabase.`);
      if (rows.length > 0) {
        for (const row of rows) {
          const payload = row.payload || {};
          const printfulId = String(row.printful_id || payload.printfulId || payload.id || '').trim();
          if (!printfulId) continue;
          await db.collection('products').updateOne(
            { printfulId },
            { $set: { ...payload, printfulId, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
        console.log(`Successfully migrated ${rows.length} products to MongoDB!`);
      }
    } else {
      console.log("Supabase products fetch status:", res.status);
    }
  } catch (err) {
    console.error("Product migration error:", err.message);
  }

  // 2. Fetch app_documents (users/sessions/settings) from Supabase
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/app_documents?select=*`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json'
      }
    });
    if (res.ok) {
      const rows = await res.json();
      console.log(`Found ${rows.length} app_documents in Supabase.`);
      if (rows.length > 0) {
        for (const row of rows) {
          const collectionName = row.collection || 'app_documents';
          const docId = row.doc_id || String(row.id);
          await db.collection(collectionName).updateOne(
            { _id: docId },
            { $set: { ...(row.payload || {}), _id: docId, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
        console.log(`Successfully migrated ${rows.length} documents to MongoDB!`);
      }
    }
  } catch (err) {
    console.error("Document migration error:", err.message);
  }

  await mongoClient.close();
  console.log("Migration finished successfully!");
}

migrateAll();
