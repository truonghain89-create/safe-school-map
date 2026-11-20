const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

async function runTest() {
  console.log('Testing public statistics server action logic...');
  
  // Dynamic import of compiled TS or test logic directly
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Test 1: Real mode (includeDemo = false)
  console.log('\n--- TEST 1: Real Mode (includeDemo = false) ---');
  const { data: pubViewReal, error: pvErrReal } = await supabase
    .from('public_hotspots_view')
    .select('*')
    .eq('is_demo', false);
  console.log('Real published hotspots count:', pubViewReal ? pubViewReal.length : 0, 'Error:', pvErrReal?.message);

  // Test 2: Demo mode (includeDemo = true)
  console.log('\n--- TEST 2: Demo Mode (includeDemo = true) ---');
  const { data: pubViewDemo, error: pvErrDemo } = await supabase
    .from('public_hotspots_view')
    .select('*');
  console.log('Demo published hotspots count:', pubViewDemo ? pubViewDemo.length : 0, 'Error:', pvErrDemo?.message);
  if (pubViewDemo && pubViewDemo.length > 0) {
    console.log('First demo hotspot:', {
      name: pubViewDemo[0].hotspot_name,
      processing_status: pubViewDemo[0].processing_status,
      severity: pubViewDemo[0].severity,
      verified_report_count: pubViewDemo[0].verified_report_count
    });
  }
}

runTest().catch(console.error);
