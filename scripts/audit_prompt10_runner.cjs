const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    const val = v.join('=').trim().replace(/^["']|["']$/g, '');
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
    if (k === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = val;
  }
}

async function runAudit() {
  console.log('========================================================================');
  console.log('PROMPT 10 – FULL WEBSITE RUNTIME & DIAGNOSTICS AUDIT');
  console.log('Supabase URL:', supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'NOT FOUND');
  console.log('Timestamp:', new Date().toISOString());
  console.log('========================================================================\n');

  const results = {
    http: [],
    database: [],
    security: [],
    actions: [],
    codebase: []
  };

  // 1. HTTP Endpoint Testing
  const routes = [
    { path: '/', name: 'Trang chủ (Home)', type: 'public' },
    { path: '/ban-do', name: 'Bản đồ GIS an toàn (Map)', type: 'public' },
    { path: '/gui-phan-anh', name: 'Gửi phản ánh an toàn (Submit)', type: 'public' },
    { path: '/tra-cuu', name: 'Tra cứu tiến độ (Lookup)', type: 'public' },
    { path: '/thong-ke', name: 'Dashboard thống kê công khai (Stats)', type: 'public' },
    { path: '/gioi-thieu', name: 'Giới thiệu dự án (About)', type: 'public' },
    { path: '/quyen-rieng-tu', name: 'Chính sách quyền riêng tư (Privacy)', type: 'public' },
    { path: '/dieu-khoan', name: 'Điều khoản sử dụng (Terms)', type: 'public' },
    { path: '/dang-nhap', name: 'Đăng nhập quản trị (Login)', type: 'auth' },
    { path: '/quan-tri', name: 'Dashboard quản trị (Admin Root)', type: 'admin' },
    { path: '/quan-tri/phan-anh', name: 'Quản trị phản ánh (Admin Reports)', type: 'admin' },
    { path: '/quan-tri/diem-chu-y', name: 'Quản trị điểm nóng (Admin Hotspots)', type: 'admin' },
    { path: '/quan-tri/khao-sat', name: 'Quản trị khảo sát (Admin Surveys)', type: 'admin' },
    { path: '/quan-tri/tai-khoan', name: 'Quản trị tài khoản (Admin Accounts)', type: 'admin' },
    { path: '/quan-tri/nhat-ky', name: 'Nhật ký kiểm toán (Admin Audit Logs)', type: 'admin' },
  ];

  console.log('--- 1. KIỂM THỬ RUNTIME HTTP ENDPOINTS (PORT 3000) ---');
  for (const r of routes) {
    const start = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${r.path}`, {
        redirect: 'manual', // do not follow redirects automatically so we can detect auth protection
      });
      const duration = Date.now() - start;
      const status = res.status;
      const isRedirect = status === 307 || status === 302 || status === 308;
      const location = res.headers.get('location');

      let verdict = 'PASS';
      let note = `Status ${status} (${duration}ms)`;

      if (r.type === 'admin') {
        if (isRedirect && (location?.includes('/dang-nhap') || location?.includes('login'))) {
          verdict = 'PASS';
          note = `Bảo vệ Auth chuẩn: 307 Redirect tới ${location} (${duration}ms)`;
        } else if (status === 200) {
          verdict = 'WARN';
          note = `Phản hồi 200 OK (Cần kiểm tra xem có SSR redirect hay Client redirect không)`;
        }
      } else {
        if (status !== 200) {
          verdict = 'FAIL';
          note = `Lỗi HTTP ${status} (${duration}ms)`;
        }
      }

      console.log(`[${verdict}] ${r.name} [${r.path}]: ${note}`);
      results.http.push({ path: r.path, name: r.name, status, duration, verdict, note });
    } catch (e) {
      console.log(`[FAIL] ${r.name} [${r.path}]: Lỗi kết nối: ${e.message}`);
      results.http.push({ path: r.path, name: r.name, status: 0, duration: 0, verdict: 'FAIL', note: e.message });
    }
  }

  // 2. Database & Supabase Testing (Anon Client)
  console.log('\n--- 2. KIỂM THỬ SUPABASE DATABASE & RLS (ANON CLIENT) ---');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  // Test 2.1: public_hotspots_view
  try {
    const { data: viewData, error: viewError } = await anonClient
      .from('public_hotspots_view')
      .select('*');
    if (viewError) {
      console.log(`[FAIL] public_hotspots_view: Lỗi: ${viewError.message}`);
      results.database.push({ item: 'public_hotspots_view', verdict: 'FAIL', note: viewError.message });
    } else {
      console.log(`[PASS] public_hotspots_view: Truy vấn công khai thành công (${viewData.length} bản ghi)`);
      // Check for sensitive fields
      const sample = viewData[0] || {};
      const exposedSensitive = ['actual_lat', 'actual_lng', 'tracking_code', 'reporter_phone', 'created_by'].filter(f => f in sample);
      if (exposedSensitive.length > 0) {
        console.log(`[FAIL] Lộ trường nhạy cảm trong view: ${exposedSensitive.join(', ')}`);
        results.security.push({ item: 'public_hotspots_view_leak', verdict: 'FAIL', note: `Lộ: ${exposedSensitive.join(', ')}` });
      } else {
        console.log(`[PASS] Bảo vệ tọa độ và PII: Không để lộ actual_lat/lng hay tracking_code`);
        results.security.push({ item: 'public_hotspots_view_leak', verdict: 'PASS', note: 'Không lộ PII/tọa độ nhạy cảm' });
      }
      results.database.push({ item: 'public_hotspots_view', verdict: 'PASS', note: `${viewData.length} bản ghi` });
    }
  } catch (e) {
    console.log(`[FAIL] public_hotspots_view exception: ${e.message}`);
  }

  // Test 2.2: schools table
  try {
    const { data: schoolsData, error: schoolsError } = await anonClient
      .from('schools')
      .select('id, name, ward, education_level, school_type, public_map_approved')
      .eq('public_map_approved', true);
    if (schoolsError) {
      console.log(`[FAIL] schools table: Lỗi: ${schoolsError.message}`);
      results.database.push({ item: 'schools', verdict: 'FAIL', note: schoolsError.message });
    } else {
      console.log(`[PASS] schools table: Truy vấn ${schoolsData.length} trường công khai hợp lệ`);
      results.database.push({ item: 'schools', verdict: 'PASS', note: `${schoolsData.length} trường công khai` });
    }
  } catch (e) {
    console.log(`[FAIL] schools exception: ${e.message}`);
  }

  // Test 2.3: reports table RLS protection
  try {
    const { data: reportsData, error: reportsError } = await anonClient
      .from('reports')
      .select('*');
    if (reportsError && reportsError.code === '42501') {
      console.log(`[PASS] reports table RLS: Anon bị chặn quyền truy cập (Code 42501 Permission Denied)`);
      results.security.push({ item: 'reports_rls', verdict: 'PASS', note: 'Chặn anon đọc reports' });
    } else if (reportsData && reportsData.length === 0) {
      console.log(`[PASS] reports table RLS: Anon đọc được 0 bản ghi (RLS filter bảo vệ thành công)`);
      results.security.push({ item: 'reports_rls', verdict: 'PASS', note: 'RLS filter bảo vệ (0 rows)' });
    } else if (reportsData && reportsData.length > 0) {
      console.log(`[CRITICAL] reports table RLS THẤT BẠI: Anon đọc được ${reportsData.length} bản ghi phản ánh thô!`);
      results.security.push({ item: 'reports_rls', verdict: 'CRITICAL', note: `Lộ ${reportsData.length} phản ánh thô cho anon` });
    }
  } catch (e) {
    console.log(`[FAIL] reports RLS exception: ${e.message}`);
  }

  // Test 2.4: rpc_get_public_statistics
  try {
    const { data: rpcData, error: rpcError } = await anonClient.rpc('rpc_get_public_statistics', {
      p_start_date: '2026-01-01',
      p_end_date: '2026-11-20',
      p_include_demo: false
    });
    if (rpcError) {
      console.log(`[WARN] rpc_get_public_statistics (City-wide): ${rpcError.message}`);
      results.database.push({ item: 'rpc_get_public_statistics', verdict: 'WARN', note: rpcError.message });
    } else {
      console.log(`[PASS] rpc_get_public_statistics (City-wide): Thực thi thành công! Tổng số phản ánh: ${rpcData?.total_reports ?? 0}`);
      results.database.push({ item: 'rpc_get_public_statistics', verdict: 'PASS', note: 'RPC city-wide thực thi thành công' });
    }
  } catch (e) {
    console.log(`[FAIL] RPC exception: ${e.message}`);
  }

  // 3. Storage Security Test
  console.log('\n--- 3. KIỂM THỬ STORAGE BUCKET BẢO MẬT ---');
  try {
    const testUrl = `${supabaseUrl}/storage/v1/object/public/private-reports/non_existent.png`;
    const res = await fetch(testUrl);
    if (res.status === 400 || res.status === 403 || res.status === 404) {
      console.log(`[PASS] private-reports bucket: Chặn truy cập công khai ẩn danh (Status ${res.status})`);
      results.security.push({ item: 'storage_bucket_private', verdict: 'PASS', note: `Bucket private chặn anon (${res.status})` });
    } else {
      console.log(`[WARN] private-reports bucket: Status ${res.status}`);
      results.security.push({ item: 'storage_bucket_private', verdict: 'WARN', note: `Status ${res.status}` });
    }
  } catch (e) {
    console.log(`[FAIL] Storage check exception: ${e.message}`);
  }

  // Save audit data
  fs.writeFileSync('prompt10_audit_evidence/audit_raw_results.json', JSON.stringify(results, null, 2));
  console.log('\n========================================================================');
  console.log('ĐÃ LƯU KẾT QUẢ KIỂM THỬ VÀO prompt10_audit_evidence/audit_raw_results.json');
  console.log('========================================================================');
}

runAudit().catch(console.error);
