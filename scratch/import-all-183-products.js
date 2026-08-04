const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const csvPath = 'C:\\Users\\tejsh\\Downloads\\app_documents_rows.csv';
const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function importAll183Products() {
  console.log("Reading CSV file:", csvPath);
  const rawContent = fs.readFileSync(csvPath, 'utf8');
  const lines = rawContent.split(/\r?\n/);
  console.log(`Total CSV lines to process: ${lines.length}`);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');
  console.log("Connected to MongoDB Atlas!");

  let productCount = 0;
  let userCount = 0;
  let docCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const jsonStart = line.indexOf('{');
      const jsonEnd = line.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) continue;

      const payloadStr = line.substring(jsonStart, jsonEnd + 1).replace(/""/g, '"');
      const payload = JSON.parse(payloadStr);

      const headerPart = line.substring(0, jsonStart);
      const parts = headerPart.split(',');

      let collection = parts.length >= 2 ? parts[1].replace(/["']/g, '').trim() : 'app_documents';
      let docId = parts.length >= 3 ? parts[2].replace(/["']/g, '').trim() : '';

      if (collection === 'products' || payload.printfulId || payload.productType || payload.variants) {
        const uniqueId = String(docId || payload._id || payload.id || payload.printfulId || `prod-${i}`).trim();
        const printfulId = String(payload.printfulId || payload.id || uniqueId).trim();

        const fullProduct = {
          ...payload,
          _id: uniqueId,
          id: payload.id || printfulId,
          printfulId,
          status: payload.status || (payload.published === false ? 'draft' : 'published'),
          published: payload.published !== false,
          updatedAt: new Date().toISOString()
        };

        await db.collection('products').updateOne(
          { _id: uniqueId },
          { $set: fullProduct },
          { upsert: true }
        );
        productCount++;
      } else if (collection === 'users' || payload.email) {
        const email = String(payload.email || docId || '').trim().toLowerCase();
        if (email) {
          await db.collection('users').updateOne(
            { email },
            { $set: { ...payload, email, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
          userCount++;
        }
      } else {
        const _id = docId || String(i);
        await db.collection(collection).updateOne(
          { _id },
          { $set: { ...payload, _id, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        docCount++;
      }
    } catch (e) {
      // ignore line parse errors
    }
  }

  const finalProductCount = await db.collection('products').countDocuments({});
  console.log("==========================================");
  console.log(`FULL IMPORT COMPLETE!`);
  console.log(`- Products imported to MongoDB: ${productCount}`);
  console.log(`- Total Products in MongoDB Collection NOW: ${finalProductCount}`);
  console.log(`- Users imported: ${userCount}`);
  console.log("==========================================");

  await client.close();
}

importAll183Products();
