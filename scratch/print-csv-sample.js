const fs = require('fs');

const csvPath = 'C:\\Users\\tejsh\\Downloads\\app_documents_rows.csv';
const content = fs.readFileSync(csvPath, 'utf8');

console.log("File length:", content.length);
const lines = content.split(/\r?\n/);
console.log("Total lines:", lines.length);

for (let i = 0; i < Math.min(15, lines.length); i++) {
  console.log(`Line ${i}:`, lines[i].substring(0, 150));
}
