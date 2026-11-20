const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deepAudit() {
  console.log('=== 1. CHECK RPC FUNCTION ON SUPABASE CLOUD ===');
  const rpcTest = await client.rpc('rpc_get_public_statistics', {
    p_school_id: '00000000-0000-0000-0000-000000000001',
    p_start_date: new Date(Date.now() - 30 * 86400000).toISOString(),
    p_end_date: new Date().toISOString(),
    p_include_demo: false,
  });
  console.log('RPC Call Error:', rpcTest.error ? rpcTest.error.message : 'NONE');
  console.log('RPC Exists on Cloud:', !rpcTest.error);

  console.log('\n=== 2. CHECK PUBLIC_HOTSPOTS_VIEW COLUMNS & DATA ===');
  const viewRes = await client.from('public_hotspots_view').select('*');
  console.log('View count:', viewRes.data ? viewRes.data.length : 0, 'Error:', viewRes.error?.message);
  if (viewRes.data && viewRes.data.length > 0) {
    const row = viewRes.data[0];
    console.log('View columns:', Object.keys(row));
    console.log('Check PII in view: actual_lat in row?', 'actual_lat' in row);
    console.log('Check PII in view: actual_lng in row?', 'actual_lng' in row);
    console.log('Check PII in view: created_by in row?', 'created_by' in row);
    console.log('Check PII in view: approved_by in row?', 'approved_by' in row);
    console.log('Row sample:', JSON.stringify(row, null, 2));
  }

  console.log('\n=== 3. CHECK ANON SELECT ON REPORTS (RLS ENFORCEMENT) ===');
  const repRes = await client.from('reports').select('*');
  console.log('Reports anon select length:', repRes.data ? repRes.data.length : 0, 'Error:', repRes.error?.message);

  console.log('\n=== 4. CHECK ANON SELECT ON HOTSPOTS DIRECTLY ===');
  const hotRes = await client.from('hotspots').select('id, name, publication_status, processing_status, is_hidden, is_demo, actual_lat, public_lat');
  console.log('Hotspots direct select length:', hotRes.data ? hotRes.data.length : 0, 'Error:', hotRes.error?.message);
  if (hotRes.data) {
    console.log('Hotspots:', hotRes.data.map(h => ({
      id: h.id.slice(0, 8),
      name: h.name,
      pub: h.publication_status,
      proc: h.processing_status,
      hidden: h.is_hidden,
      demo: h.is_demo,
      has_actual_lat: h.actual_lat !== undefined,
      has_public_lat: h.public_lat !== undefined
    })));
  }

  console.log('\n=== 5. CHECK SCHOOLS TABLE ===');
  const schRes = await client.from('schools').select('*');
  console.log('Schools count:', schRes.data ? schRes.data.length : 0);
  if (schRes.data) {
    console.log('Schools:', schRes.data.map(s => ({ id: s.id.slice(0, 8), name: s.name, approved: s.public_map_approved, status: s.status })));
  }
}

deepAudit().catch(console.error);
