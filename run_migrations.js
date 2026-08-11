const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:6F%40rpP%23S_yV%40%25mS@db.wgvswyatbrdggrdadqss.supabase.co:5432/postgres';

async function runMigrations() {
  const client = new Client({ connectionString });
  await client.connect();

  const migrations = [
    'supabase-migration-v6-leetcode.sql',
    'supabase-migration-v7-hackerrank.sql',
    'supabase-migration-v8-schedule.sql',
    'supabase-migration-v10-github-intel.sql'
  ];

  for (const file of migrations) {
    console.log(`Running ${file}...`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    try {
      await client.query(sql);
      console.log(`Successfully applied ${file}`);
    } catch (e) {
      console.error(`Error applying ${file}:`, e.message);
    }
  }

  await client.end();
}

runMigrations();


