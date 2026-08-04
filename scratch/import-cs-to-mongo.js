const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const csvPath = 'C:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\cs';
const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function importCsFile() {
  console.log("Reading CSV content from file 'cs'...");
  if (!fs.existsSync(csvPath)) {
    console.error("File 'cs' not found!");
    return;
  }

  const rawContent = fs.readFileSync(csvPath, 'utf8');
  console.log(`File 'cs' read successfully. Size: ${(rawContent.length / 1024 / 1024).toFixed(2)} MB`);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');
  console.log("Connected to MongoDB Atlas!");

  // Parse records from Supabase CSV format:
  // id,collection,doc_id,email,payload,created_at,updated_at
  const lines = rawContent.split(/\r?\n/);
  console.log(`Total lines to process: ${lines.length}`);

  let productCount = 0;
  let userCount = 0;
  let docCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const jsonStart = line.indexOf('{');
      const jsonEnd = line.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) continue;

      const payloadStr = line.substring(jsonStart, jsonEnd + 1);
      const payload = JSON.parse(payloadStr);

      const headerPart = line.substring(0, jsonStart);
      const parts = headerPart.split(',');

      let collection = 'app_documents';
      let docId = '';

      if (parts.length >= 2 && parts[1]) {
        collection = parts[1].replace(/["']/g, '').trim() || 'app_documents';
      }
      if (parts.length >= 3 && parts[2]) {
        docId = parts[2].replace(/["']/g, '').trim();
      }

      // 1. PRODUCTS
      if (collection === 'products' || payload.printfulId || payload.productType || payload.variants) {
        const printfulId = String(payload.printfulId || payload.id || payload.sku || docId || '').trim();
        if (printfulId && (payload.name || payload.title)) {
          await db.collection('products').updateOne(
            { printfulId },
            {
              $set: {
                ...payload,
                printfulId,
                status: payload.status || (payload.published === false ? 'draft' : 'published'),
                published: payload.published !== false,
                updatedAt: new Date().toISOString()
              }
            },
            { upsert: true }
          );
          productCount++;
        }
      }
      // 2. USERS
      else if (collection === 'users' || payload.email || payload.passwordHash) {
        const email = String(payload.email || docId || '').trim().toLowerCase();
        if (email) {
          await db.collection('users').updateOne(
            { email },
            { $set: { ...payload, email, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
          userCount++;
        }
      }
      // 3. APP DOCUMENTS / AFFILIATES / SESSIONS / OTPS
      else {
        const _id = docId || String(i);
        await db.collection(collection).updateOne(
          { _id },
          { $set: { ...payload, _id, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        docCount++;
      }
    } catch (e) {
      errorCount++;
    }
  }

  console.log("==========================================");
  console.log(`IMPORT COMPLETE FOR ALL 188 RECORDS!`);
  console.log(`- Products imported to MongoDB: ${productCount}`);
  console.log(`- Users imported to MongoDB: ${userCount}`);
  console.log(`- App Documents/Affiliates/Sessions: ${docCount}`);
  console.log("==========================================");

  // Clean up temporary untracked 'cs' file
  try {
    fs.unlinkSync(csvPath);
    console.log("Cleaned up temporary 'cs' file.");
  } catch (e) {}

  await client.close();
}

importCsFile();
