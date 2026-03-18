const bcrypt = require('bcrypt');
const db = require('./db');

async function fix() {
  const hash = await bcrypt.hash('A#m!n2025', 10);
  await db.query("UPDATE profiles SET password_hash = $1 WHERE email = 'admin@admin.com'", [hash]);
  console.log('Password fixed!');
  process.exit(0);
}
fix();
