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

async function inspectSchema() {
  console.log('--- 1. Kiểm tra trường public_map_approved của schools ---');
  const { data: sData, error: sErr } = await client.from('schools').select('id, name, public_map_approved, status').limit(2);
  console.log('Schools:', JSON.stringify({ sData, sErr: sErr?.message }, null, 2));

  console.log('\n--- 2. Kiểm tra các cột của hotspots ---');
  const { data: hData, error: hErr } = await client
    .from('hotspots')
    .select('id, name, actual_lat, actual_lng, public_lat, public_lng, severity, processing_status, publication_status, created_by, approved_by, published_at, is_hidden, is_demo')
    .limit(1);
  console.log('Hotspots columns:', hData && hData[0] ? Object.keys(hData[0]) : null, 'Error:', hErr?.message);
  if (hData?.[0]) console.log('Sample hotspot:', JSON.stringify(hData[0], null, 2));

  console.log('\n--- 3. Kiểm tra public_hotspots_view ---');
  const { data: vData, error: vErr } = await client.from('public_hotspots_view').select('*').limit(1);
  console.log('Public View columns:', vData && vData[0] ? Object.keys(vData[0]) : null, 'Error:', vErr?.message);
  if (vData?.[0]) console.log('Sample view record:', JSON.stringify(vData[0], null, 2));

  console.log('\n--- 4. Kiểm tra Storage Buckets ---');
  const { data: buckets, error: bErr } = await client.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => ({ id: b.id, name: b.name, public: b.public })), 'Error:', bErr?.message);
}

inspectSchema().catch(console.error);
