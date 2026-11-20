const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testView() {
  console.log('Querying public_hotspots_view as anon:');
  const { data, error } = await anonClient
    .from('public_hotspots_view')
    .select('hotspot_id, hotspot_name, severity, processing_status, publication_status, verified_report_count, public_lat, public_lng');
  console.log('Result:', { count: data?.length, data, error: error?.message });
}

testView().catch(console.error);
