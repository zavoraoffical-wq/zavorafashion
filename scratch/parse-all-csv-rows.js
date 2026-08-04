const fs = require('fs');

const csvPath = 'C:\\Users\\tejsh\\Downloads\\app_documents_rows.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split(/\r?\n/);
let collectionMap = {};
let productNames = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Supabase CSV format: id,collection,doc_id,"{""_id"":...}",created_at,updated_at
  const parts = line.split(',');
  const id = parts[0];
  const collection = parts[1];
  const docId = parts[2];

  collectionMap[collection] = (collectionMap[collection] || 0) + 1;

  if (collection === 'products') {
    // Extract name if possible
    const nameMatch = line.match(/""name"":""([^""]+)""/);
    if (nameMatch) {
      productNames.push(nameMatch[1]);
    }
  }
}

console.log("=== SUPABASE CSV EXACT BREAKDOWN ===");
console.log("Total Records in CSV:", lines.length - 1);
console.log("Collection breakdown:", collectionMap);
console.log("Extracted product names count:", productNames.length);
console.log("Sample product names:", productNames.slice(0, 10));
console.log("====================================");
