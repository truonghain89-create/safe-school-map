const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testTrigger() {
  console.log('Testing trigger status on hotspots:');
  // Attempt to select hotspots sample
  const { data, error } = await client.from('hotspots').select('id, name, created_by, approved_by, publication_status').limit(2);
  console.log('Hotspots:', data, 'Error:', error?.message);
}

testTrigger().catch(console.error);
