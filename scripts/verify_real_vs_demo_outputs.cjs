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

const CANONICAL_DEMO_REPORTS = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'traffic_jam',
    occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    time_window: '16:30 - 17:30',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'illegal_parking',
    occurred_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    time_window: '06:30 - 07:15',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'unsafe_crossing',
    occurred_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    time_window: '11:00 - 12:00',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'collision_risk',
    occurred_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    time_window: '16:45 - 17:30',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
];

async function simulateBothModes() {
  console.log('=== SIMULATE REAL MODE (includeDemo = false) ===');
  // 1. Hotspots
  const { data: realHotspots } = await supabase
    .from('public_hotspots_view')
    .select('*')
    .eq('is_demo', false);
  console.log('Real Hotspots Count:', realHotspots ? realHotspots.length : 0);

  // 2. Reports
  const { data: realReports } = await supabase
    .from('reports')
    .select('id, issue_type, occurred_at, time_window, reviewed_at, verification_status, is_demo, is_hidden')
    .eq('verification_status', 'verified')
    .eq('is_hidden', false)
    .eq('is_demo', false);
  console.log('Real Reports Count from DB:', realReports ? realReports.length : 0);

  console.log('\n=== SIMULATE DEMO MODE (includeDemo = true) ===');
  // 1. Hotspots
  const { data: demoHotspots } = await supabase
    .from('public_hotspots_view')
    .select('*');
  console.log('Demo Hotspots Count from DB:', demoHotspots ? demoHotspots.length : 0);
  if (demoHotspots) {
    console.log('Demo Hotspots detail:', demoHotspots.map(h => ({ name: h.hotspot_name, proc: h.processing_status, demo: h.is_demo })));
  }

  // 2. Reports
  const { data: dbReportsDemo } = await supabase
    .from('reports')
    .select('id, issue_type, occurred_at, time_window, reviewed_at, verification_status, is_demo, is_hidden')
    .eq('verification_status', 'verified')
    .eq('is_hidden', false);
  let repList = dbReportsDemo || [];
  let usedFallback = false;
  if (repList.length === 0) {
    repList = CANONICAL_DEMO_REPORTS;
    usedFallback = true;
  }
  console.log('Demo Reports Count:', repList.length, '(Used fallback:', usedFallback, ')');
  console.log('Demo Reports detail:', repList.map(r => ({ issue: r.issue_type, reviewed_at: r.reviewed_at, demo: r.is_demo })));
}

simulateBothModes().catch(console.error);
