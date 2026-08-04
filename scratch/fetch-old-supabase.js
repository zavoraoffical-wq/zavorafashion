const { MongoClient } = require('mongodb');

const oldSupabaseUrl = 'https://zkblebkbrewiunrtxqic.supabase.co';
const oldSupabaseKey = 'sb_publishable_hJP__1LnbEkNoS8JzCo2YQ_5CtHHDpo';
const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function fetchOldData() {
  console.log("Checking OLD Supabase project (zkblebkbrewiunrtxqic)...");

  // Fetch products
  try {
    const res = await fetch(`${oldSupabaseUrl}/rest/v1/products?select=*`, {
      headers: {
        apikey: oldSupabaseKey,
        Authorization: `Bearer ${oldSupabaseKey}`,
        Accept: 'application/json'
      }
    });
    console.log("OLD Supabase products status:", res.status);
    if (res.ok) {
      const rows = await res.json();
      console.log(`Found ${rows.length} products in OLD Supabase!`);
      if (rows.length > 0) {
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db('zavora_fashion');
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
        console.log(`Successfully migrated ${rows.length} products from OLD Supabase to MongoDB!`);
        await client.close();
      }
    } else {
      const text = await res.text();
      console.log("Response text:", text);
    }
  } catch (err) {
    console.error("Error fetching old products:", err.message);
  }

  // Fetch app_documents
  try {
    const res = await fetch(`${oldSupabaseUrl}/rest/v1/app_documents?select=*`, {
      headers: {
        apikey: oldSupabaseKey,
        Authorization: `Bearer ${oldSupabaseKey}`,
        Accept: 'application/json'
      }
    });
    console.log("OLD Supabase app_documents status:", res.status);
    if (res.ok) {
      const rows = await res.json();
      console.log(`Found ${rows.length} app_documents in OLD Supabase!`);
      if (rows.length > 0) {
        const client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db('zavora_fashion');
        for (const row of rows) {
          const collectionName = row.collection || 'app_documents';
          const docId = row.doc_id || String(row.id);
          await db.collection(collectionName).updateOne(
            { _id: docId },
            { $set: { ...(row.payload || {}), _id: docId, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        }
        console.log(`Successfully migrated ${rows.length} documents from OLD Supabase to MongoDB!`);
        await client.close();
      }
    } else {
      const text = await res.text();
      console.log("Response text:", text);
    }
  } catch (err) {
    console.error("Error fetching old app_documents:", err.message);
  }
}

fetchOldData();
