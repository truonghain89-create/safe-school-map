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

async function testAuditInsert() {
  console.log('Testing insert into audit_logs with correct schema:');
  const { data, error, status } = await client.from('audit_logs').insert({
    actor_id: '00000000-0000-0000-0000-000000000011',
    action: 'TEST_AUDIT',
    object_type: 'report',
    object_id: '00000000-0000-0000-0000-000000000201',
    new_value: { status: 'verified', note: 'Kiểm thử schema M1' },
    reason: 'Kiểm thử tự động'
  });
  console.log('Insert result:', { data, error: error?.message, status });

  const { data: selectData, error: selectErr } = await client.from('audit_logs').select('*').limit(3);
  console.log('Select result:', { count: selectData?.length, selectErr: selectErr?.message, selectData });
}

testAuditInsert().catch(console.error);
