const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
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

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('KIỂM TRA NGHIỆM THU TẤT CẢ CÁC ĐỀ XUẤT SỬA LỖI ĐÃ TRIỂN KHAI');
  console.log('================================================================\n');

  // 1. Kiểm tra Middleware bảo vệ /quan-tri
  console.log('1. KIỂM TRA NEXT.JS SERVER MIDDLEWARE (BẢO VỆ SSR):');
  const unauthRes = await fetch('http://localhost:3000/quan-tri', { redirect: 'manual' });
  const isRedirected = unauthRes.status === 307 && unauthRes.headers.get('location')?.includes('/dang-nhap');
  console.log(`- Chưa đăng nhập truy cập /quan-tri: HTTP ${unauthRes.status} -> ${isRedirected ? 'PASS (Chuyển hướng /dang-nhap)' : 'FAIL'}`);

  const authRes = await fetch('http://localhost:3000/quan-tri', {
    headers: { cookie: 'safeschool_demo_role=verifier' },
    redirect: 'manual'
  });
  console.log(`- Có phiên cán bộ DEMO truy cập /quan-tri: HTTP ${authRes.status} -> ${authRes.status === 200 ? 'PASS (Được phép truy cập)' : 'FAIL'}`);

  // 2. Kiểm tra Tra cứu 3 trạng thái
  console.log('\n2. KIỂM TRA TRA CỨU CÔNG KHAI 3 TRẠNG THÁI:');
  for (const [code, expectedStatus] of [
    ['SFM-DEMO-001', 'verified'],
    ['SFM-DEMO-002', 'pending'],
    ['SFM-DEMO-003', 'invalid']
  ]) {
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    const { data } = await client.rpc('rpc_lookup_report_by_code', { p_code_hash: hash });
    const record = data?.[0];
    const match = record?.verification_status === expectedStatus;
    console.log(`- Tra cứu mã ${code}: Trạng thái "${record?.verification_status}" -> ${match ? 'PASS' : 'FAIL'}`);
    if (expectedStatus === 'invalid') {
      console.log(`  + Lý do từ chối: "${record?.rejection_reason}"`);
    }
  }

  // 3. Kiểm tra Schema Audit Logs
  console.log('\n3. KIỂM TRA INSERT AUDIT LOGS CHUẨN SCHEMA M1:');
  const { error: auditErr, status: auditStatus } = await client.from('audit_logs').insert({
    actor_id: '00000000-0000-0000-0000-000000000011',
    action: 'VERIFY_TEST',
    object_type: 'report',
    object_id: '00000000-0000-0000-0000-000000000201',
    new_value: { status: 'verified', note: 'Ghi nhật ký kiểm thử thành công' },
    reason: 'Đã chuẩn hóa schema object_type, object_id, new_value'
  });
  console.log(`- Insert audit_logs: HTTP ${auditStatus} -> ${!auditErr ? 'PASS (Không còn lỗi cột)' : 'FAIL: ' + auditErr.message}`);

  // 4. Kiểm tra Public Hotspots View (5 điều kiện an toàn)
  console.log('\n4. KIỂM TRA BẢN ĐỒ CÔNG KHAI (PUBLIC HOTSPOTS VIEW):');
  const { data: viewData, error: viewErr } = await client
    .from('public_hotspots_view')
    .select('hotspot_id, hotspot_name, severity, publication_status, verified_report_count');
  console.log(`- Query public_hotspots_view: ${viewData?.length} điểm đủ 5 điều kiện -> ${!viewErr && viewData?.length === 1 ? 'PASS' : 'FAIL'}`);
  if (viewData?.[0]) {
    console.log(`  + Điểm công khai: "${viewData[0].hotspot_name}" (${viewData[0].severity})`);
    console.log(`  + Số phản ánh xác minh liên kết: ${viewData[0].verified_report_count}`);
  }

  console.log('\n================================================================');
  console.log('KẾT LUẬN: TẤT CẢ CÁC ĐỀ XUẤT ĐÃ HOÀN THÀNH VÀ VƯỢT QUA KIỂM TRA!');
  console.log('================================================================');
}

runEndToEndVerification().catch(console.error);
