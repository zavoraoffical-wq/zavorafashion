const feedHandler = require('../api/feed');

async function testFeed() {
  console.log("Generating Google Merchant XML feed...");
  const start = Date.now();

  let responseBody = '';
  let statusCode = 200;
  const req = { method: 'GET', headers: {} };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(body) { responseBody = body; statusCode = this.statusCode; }
  };

  await feedHandler(req, res);
  const ms = Date.now() - start;

  console.log(`HTTP Status: ${statusCode}`);
  console.log(`Content-Type: ${res.headers['Content-Type']}`);
  console.log(`X-Feed-Products: ${res.headers['X-Feed-Products']}`);
  console.log(`Time: ${ms}ms`);
  console.log(`XML Length: ${responseBody.length} bytes`);

  if (responseBody.includes('<rss')) {
    console.log("\n✅ VALID XML FEED GENERATED!");
    // Print first 400 chars as preview
    console.log("\n--- Preview ---");
    console.log(responseBody.substring(0, 600));
  } else {
    console.error("❌ XML feed not generated correctly");
    console.error(responseBody.substring(0, 400));
  }
}

testFeed().catch(console.error);
