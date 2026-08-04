const handler = require('../api/products');

async function testHandler() {
  console.log("Testing GET /api/products?gender=women&limit=60...");
  const req = {
    method: 'GET',
    headers: {},
    query: { gender: 'women', limit: '60' }
  };

  let responseData = null;
  let responseCode = 200;

  const res = {
    statusCode: 200,
    setHeader(k, v) {},
    end(payload) {
      responseCode = this.statusCode;
      try {
        responseData = JSON.parse(payload);
      } catch(e) {
        responseData = payload;
      }
    }
  };

  try {
    await handler(req, res);
    console.log(`[TEST PASSED] HTTP Status: ${responseCode}`);
    console.log(`OK: ${responseData?.ok}, Provider: ${responseData?.provider}, Products Count: ${responseData?.products?.length}`);
  } catch(err) {
    console.error("[TEST FAILED]", err);
  }
}

testHandler();
