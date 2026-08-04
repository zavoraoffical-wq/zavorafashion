const fs = require('fs');
const path = require('path');

const csvPath = 'C:\\Users\\tejsh\\Downloads\\app_documents_rows.csv';

async function inspectCsv() {
  console.log("Inspecting CSV file:", csvPath);
  const rawContent = fs.readFileSync(csvPath, 'utf8');
  const lines = rawContent.split(/\r?\n/);
  console.log(`Total CSV lines: ${lines.length}`);

  let collectionCounts = {};
  let totalProductsInCsv = 0;
  let totalUsersInCsv = 0;

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

      let collection = parts.length >= 2 ? parts[1].replace(/["']/g, '').trim() : 'unknown';
      collectionCounts[collection] = (collectionCounts[collection] || 0) + 1;

      if (collection === 'products' || payload.printfulId || payload.productType) {
        totalProductsInCsv++;
      }
      if (collection === 'users' || payload.email) {
        totalUsersInCsv++;
      }
    } catch (e) {}
  }

  console.log("=== CSV ANALYSIS ===");
  console.log("Collection Breakdown:", collectionCounts);
  console.log("Total Products in CSV:", totalProductsInCsv);
  console.log("Total Users in CSV:", totalUsersInCsv);
  console.log("====================");
}

inspectCsv();
