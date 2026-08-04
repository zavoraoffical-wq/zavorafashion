const fs = require('fs');

const apiPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\api\\products.js';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');

  // Replace the return block in GET request
  const oldReturnBlock = /return json\(res, 200, \{[\s\S]*?products\s*\}, 0\);/;

  const newReturnBlock = `const totalCount = Number(savedData?.total || products.length || 0);
    return json(res, 200, {
      ok: true,
      provider: 'mongodb',
      page: Number(req.query.page || 1),
      limit,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / Math.max(limit, 1))),
      count: products.length,
      products
    }, 0);`;

  if (oldReturnBlock.test(content)) {
    content = content.replace(oldReturnBlock, newReturnBlock);
    fs.writeFileSync(apiPath, content, 'utf8');
    console.log("Successfully fixed return block in api/products.js!");
  } else {
    console.error("Return block regex did not match, inspecting file...");
  }
}
