const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Admin password to hash: ', async (password) => {
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    rl.close();
    process.exitCode = 1;
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  console.log('\nSet this in Vercel as ADMIN_PASSWORD_HASH:\n');
  console.log(hash);
  rl.close();
});
