const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim();
}

const s = createClient(url, key);

async function run() {
  await s.storage.createBucket('resumes', { public: false });
  await s.storage.createBucket('schedules', { public: false });
  const b = await s.storage.listBuckets();
  console.log("Buckets:", b.data.map(x => x.name));
}

run();
