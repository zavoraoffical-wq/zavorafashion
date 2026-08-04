const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const originalCsvPath = 'C:\\Users\\tejsh\\Downloads\\app_documents_rows.csv';
const tempCsvPath = path.join(__dirname, 'temp_app_documents.csv');
const mongoUri = 'mongodb+srv://zavora_app:ZavoraPass2026@cluster0.m5ehvyp.mongodb.net/zavora_fashion?retryWrites=true&w=majority&appName=Cluster0';

async function importCsv() {
  console.log("Copying CSV file to work directory...");
  try {
    fs.copyFileSync(originalCsvPath, tempCsvPath);
    console.log("File copied successfully to:", tempCsvPath);
  } catch (copyErr) {
    console.log("Copy failed, trying direct stream read...");
  }

  const fileToRead = fs.existsSync(tempCsvPath) ? tempCsvPath : originalCsvPath;
  const rawContent = fs.readFileSync(fileToRead, 'utf8');
  console.log(`CSV file read successfully. Size: ${(rawContent.length / 1024 / 1024).toFixed(2)} MB`);

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('zavora_fashion');

  // Supabase CSV format:
  // id,collection,doc_id,email,payload,created_at,updated_at
  const lines = rawContent.split(/\r?\n/);
  console.log(`Total CSV lines: ${lines.length}`);

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

      if (collection === 'products' || payload.printfulId || payload.productType || payload.variants) {
        const printfulId = String(payload.printfulId || payload.id || payload.sku || docId || '').trim();
        if (printfulId && (payload.name || payload.title)) {
          await db.collection('products').updateOne(
            { printfulId },
            { $set: { ...payload, printfulId, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
          productCount++;
        }
      } else if (collection === 'users' || payload.email || payload.passwordHash) {
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
      // ignore
    }
  }

  console.log("==========================================");
  console.log(`SUCCESSFULLY IMPORTED DATA TO MONGODB!`);
  console.log(`- Products imported: ${productCount}`);
  console.log(`- Users imported: ${userCount}`);
  console.log(`- App Documents imported: ${docCount}`);
  console.log("==========================================");

  // cleanup temp file
  if (fs.existsSync(tempCsvPath)) {
    try { fs.unlinkSync(tempCsvPath); } catch (e) {}
  }

  await client.close();
}

importCsv();
