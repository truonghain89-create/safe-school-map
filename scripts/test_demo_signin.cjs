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

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSignIn() {
  console.log('Testing signInWithPassword for verifier.demo@tamhiep.edu.vn:');
  const { data, error } = await client.auth.signInWithPassword({
    email: 'verifier.demo@tamhiep.edu.vn',
    password: 'DemoPassword123!'
  });
  console.log('Result:', { user: data?.user?.id, session: !!data?.session, error: error?.message, status: error?.status });
}

testSignIn().catch(console.error);
