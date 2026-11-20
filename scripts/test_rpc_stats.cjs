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

async function testRpc() {
  const r1 = await client.rpc('rpc_get_public_statistics');
  console.log('rpc_get_public_statistics:', r1.error ? r1.error.message : r1.data);

  const r2 = await client.rpc('rpc_get_statistics');
  console.log('rpc_get_statistics:', r2.error ? r2.error.message : r2.data);
}

testRpc().catch(console.error);
