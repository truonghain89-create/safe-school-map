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

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('=== ADMIN QUERY: REPORTS ===');
  const { data: reports, error: rErr } = await adminClient
    .from('reports')
    .select('id, tracking_code_hash, issue_type, verification_status, occurred_at, time_window, reviewed_at, submitted_at, is_hidden, is_demo, hotspot_id');
  console.log('Total reports:', reports ? reports.length : 0, 'Error:', rErr?.message);
  if (reports) {
    reports.forEach(r => {
      console.log(`- [${r.id.slice(0, 8)}] issue: ${r.issue_type} | status: ${r.verification_status} | window: ${r.time_window} | occurred: ${r.occurred_at} | reviewed: ${r.reviewed_at} | demo: ${r.is_demo} | hidden: ${r.is_hidden} | hotspot: ${r.hotspot_id ? r.hotspot_id.slice(0, 8) : 'null'}`);
    });
  }

  console.log('\n=== ADMIN QUERY: HOTSPOTS ===');
  const { data: hotspots, error: hErr } = await adminClient
    .from('hotspots')
    .select('*');
  console.log('Total hotspots:', hotspots ? hotspots.length : 0, 'Error:', hErr?.message);
  if (hotspots) {
    hotspots.forEach(h => {
      console.log(`- [${h.id.slice(0, 8)}] name: ${h.name} | pub: ${h.publication_status} | proc: ${h.processing_status} | sev: ${h.severity} | hidden: ${h.is_hidden} | demo: ${h.is_demo}`);
    });
  }

  console.log('\n=== ADMIN QUERY: SCHOOLS ===');
  const { data: schools, error: sErr } = await adminClient
    .from('schools')
    .select('*');
  console.log('Schools:', schools?.map(s => ({ id: s.id, name: s.name, status: s.status, public_map_approved: s.public_map_approved })));
}

check().catch(console.error);
