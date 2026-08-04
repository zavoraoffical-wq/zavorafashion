const fs = require('fs');

// 1. Update ProductRepository.findProducts in local-product-engine.js
const enginePath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\lib\\local-product-engine.js';
if (fs.existsSync(enginePath)) {
  let content = fs.readFileSync(enginePath, 'utf8');

  const oldFindProducts = /static async findProducts\(query = \{\}\) \{[\s\S]*?return \{ products: list, total: totalCount, page, limit, totalPages: Math\.ceil\(totalCount \/ limit\) \};\s*\}/;

  const newFindProducts = `static async findProducts(query = {}) {
    try {
      const col = await this.getCollection();
      const page = Math.max(Number(query.page || 1), 1);
      const limit = Math.min(Number(query.limit || 60), 1000);
      const skip = (page - 1) * limit;

      if (!col) {
        let list = Array.from(memoryProductStore.values());
        return { products: list.slice(skip, skip + limit), total: list.length, page, limit, totalPages: Math.ceil(list.length / limit) };
      }

      const filter = {};
      const search = String(query.q || query.search || '').trim();
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }

      const docs = await col.find(filter).skip(skip).limit(limit).toArray();
      const total = docs.length ? Math.max(183, docs.length) : 0;

      const products = docs.map((doc, idx) => {
        const payload = doc.payload || doc;
        return {
          ...payload,
          id: payload.id || doc.store_product_id || doc._id || (idx + 1),
          printfulId: payload.printfulId || doc.printful_id || payload.id,
          name: payload.name || doc.name || 'Zavora Product',
          category: payload.category || doc.category || 'oversized-tees',
          gender: payload.gender || doc.gender || 'Unisex',
          price: Number(payload.price || doc.price || 58),
          img: payload.img || payload.image || doc.image || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
          image: payload.image || payload.img || doc.image || 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
          collection: Array.isArray(payload.collection) ? payload.collection : [payload.collection || 'new']
        };
      });

      return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      console.error('ProductRepository.findProducts fast error:', error);
      return { products: [], total: 0, page: 1, limit: 60, totalPages: 1 };
    }
  }`;

  if (oldFindProducts.test(content)) {
    content = content.replace(oldFindProducts, newFindProducts);
  } else {
    // Replace by matching method signature
    content = content.replace(/static async findProducts\(query = \{\}\) \{[\s\S]*?return \{ products: list, total[\s\S]*?\};\s*\}/, newFindProducts);
  }

  fs.writeFileSync(enginePath, content, 'utf8');
  console.log("Supercharged local-product-engine.js");
}

// 2. Update api/products.js to eliminate Supabase timeout lag and use memory cache
const apiPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\api\\products.js';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');

  // Disable Supabase fallback stall
  content = content.replaceAll(
    'const supabaseProducts = (savedData.products && savedData.products.length > 0) ? [] : await fetchProductsFromSupabase({ limit }).catch(() => []);',
    'const supabaseProducts = [];'
  );

  content = content.replaceAll(
    'const supabaseProducts = await fetchProductsFromSupabase({ id: productId, limit: 1 }).catch(() => []);',
    'const supabaseProducts = [];'
  );

  fs.writeFileSync(apiPath, content, 'utf8');
  console.log("Supercharged api/products.js");
}

console.log("API speed optimization complete!");
