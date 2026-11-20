const crypto = require('crypto');
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

async function testDemoReports() {
  for (const code of ['SFM-DEMO-001', 'SFM-DEMO-002', 'SFM-DEMO-003']) {
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const { data, error } = await client.rpc('rpc_lookup_report_by_code', { p_code_hash: hash });
    console.log(code, '->', JSON.stringify({ data, error }));
  }
}

testDemoReports().catch(console.error);
