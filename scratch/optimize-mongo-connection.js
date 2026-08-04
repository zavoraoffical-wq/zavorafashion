const fs = require('fs');

// 1. Optimize auth-lib.js db() function
const authLibPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\lib\\auth-lib.js';
if (fs.existsSync(authLibPath)) {
  let content = fs.readFileSync(authLibPath, 'utf8');

  const oldDbFn = /async function db\(\) \{[\s\S]*?return cachedDb;\s*\}/;
  const newDbFn = `async function db() {
  if (cachedDb) return cachedDb;
  const uri = mongoUri();
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      connectTimeoutMS: 4000,
      socketTimeoutMS: 8000,
      serverSelectionTimeoutMS: 4000
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'zavora_fashion');
  return cachedDb;
}`;

  if (oldDbFn.test(content)) {
    content = content.replace(oldDbFn, newDbFn);
    fs.writeFileSync(authLibPath, content, 'utf8');
    console.log("Optimized db() in auth-lib.js");
  }
}

// 2. Add API-level 60-second in-memory cache in api/products.js
const apiPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\api\\products.js';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');

  const cacheVarSnippet = `let globalApiProductCache = null;
let globalApiProductCacheTime = 0;
`;

  if (!content.includes('globalApiProductCache')) {
    content = cacheVarSnippet + content;
  }

  const oldQueryLogic = /const savedData = await ProductRepository\.findProducts\(\{ \.\.\.req\.query, limit, page: req\.query\.page \|\| 1 \}\)\.catch\(\(\) => \(\{ products: \[\], total: 0 \}\)\);/;

  const newQueryLogic = `let savedData = null;
    if (globalApiProductCache && (Date.now() - globalApiProductCacheTime) < 120000 && !req.query.q && !req.query.search && !req.query.nocache) {
      savedData = globalApiProductCache;
    } else {
      savedData = await ProductRepository.findProducts({ ...req.query, limit: 100, page: 1 }).catch(() => ({ products: [], total: 0 }));
      if (savedData && Array.isArray(savedData.products) && savedData.products.length > 0) {
        globalApiProductCache = savedData;
        globalApiProductCacheTime = Date.now();
      }
    }`;

  if (oldQueryLogic.test(content)) {
    content = content.replace(oldQueryLogic, newQueryLogic);
    fs.writeFileSync(apiPath, content, 'utf8');
    console.log("Added 120s server-side memory cache to api/products.js");
  }
}

console.log("Connection & memory cache optimization complete!");
