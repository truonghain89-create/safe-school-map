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

async function test() {
  console.log('Testing anon query on hotspots:');
  const { data: hData, error: hError } = await anonClient
    .from('hotspots')
    .select('id, name, severity, processing_status, publication_status, is_hidden, is_demo');
  console.log('Hotspots result:', { count: hData?.length, data: hData, error: hError?.message });

  console.log('\nTesting anon query on schools:');
  const { data: sData, error: sError } = await anonClient
    .from('schools')
    .select('id, name');
  console.log('Schools result:', { count: sData?.length, data: sData, error: sError?.message });

  console.log('\nTesting anon query on user_profiles / profiles:');
  const { data: pData, error: pError } = await anonClient
    .from('profiles')
    .select('id, email, full_name, role');
  console.log('Profiles result:', { count: pData?.length, data: pData, error: pError?.message });

  console.log('\nTesting anon query on hotspot_surveys:');
  const { data: survData, error: survError } = await anonClient
    .from('hotspot_surveys')
    .select('id, title');
  console.log('Surveys result:', { count: survData?.length, data: survData, error: survError?.message });
}

test().catch(console.error);
