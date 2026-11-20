const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testActions() {
  console.log('--- TEST 1: SELECT REPORTS AS ANON ---');
  const repRes = await supabase.from('reports').select('id, issue_type, verification_status');
  console.log('Reports result:', { length: repRes.data?.length, error: repRes.error?.message });

  console.log('--- TEST 2: SELECT HOTSPOTS AS ANON ---');
  const hotRes = await supabase.from('hotspots').select('id, name, severity, processing_status, publication_status, is_hidden, is_demo');
  console.log('Hotspots result:', { length: hotRes.data?.length, error: hotRes.error?.message });

  console.log('--- TEST 3: SELECT AUDIT_LOGS AS ANON ---');
  const audRes = await supabase.from('audit_logs').select('id, action');
  console.log('Audit logs result:', { length: audRes.data?.length, error: audRes.error?.message });

  console.log('--- TEST 4: SELECT PROFILES AS ANON ---');
  const profRes = await supabase.from('profiles').select('id, email, role');
  console.log('Profiles result:', { length: profRes.data?.length, error: profRes.error?.message });

  console.log('--- TEST 5: UPDATE REPORT AS ANON ---');
  // Attempt to update a dummy id or first report
  const updateRes = await supabase.from('reports').update({ verification_status: 'verified' }).eq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Update report result:', { error: updateRes.error?.message, status: updateRes.status });

  console.log('--- TEST 6: INSERT AUDIT LOG AS ANON ---');
  const insAudit = await supabase.from('audit_logs').insert({
    actor_id: '00000000-0000-0000-0000-000000000001',
    action: 'test.anon',
    target_table: 'test',
    target_id: '00000000-0000-0000-0000-000000000001'
  });
  console.log('Insert audit log result:', { error: insAudit.error?.message, status: insAudit.status });
}

testActions().catch(console.error);
