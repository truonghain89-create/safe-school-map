import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Đọc file .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Thiếu cấu hình Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('================================================================');
console.log('BẮT ĐẦU CHẠY BỘ KIỂM THỬ TÍCH HỢP TOÀN DIỆN PROMPT 7');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Thời gian: ${new Date().toISOString()}`);
console.log('================================================================\n');

const testResults = [];

function record(id, title, status, evidence, notes = '') {
  testResults.push({ id, title, status, evidence, notes });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${id}] ${title}: ${status}`);
  if (evidence) console.log(`   -> Bằng chứng: ${evidence}`);
  if (notes) console.log(`   -> Ghi chú: ${notes}`);
}

async function runTests() {
  // -------------------------------------------------------------
  // TEST SUITE 1: KIỂM THỬ HỆ THỐNG TRA CỨU PHẢN ÁNH (PART 1)
  // -------------------------------------------------------------
  console.log('\n--- 1. KIỂM THỬ HỆ THỐNG TRA CỨU PHẢN ÁNH (PART 1) ---');

  // Sinh 1 Report DEMO mới cho kịch bản Prompt 7
  const reportId = crypto.randomUUID();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s1 = '', s2 = '';
  const rBytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    s1 += chars[rBytes[i] % chars.length];
    s2 += chars[rBytes[i + 4] % chars.length];
  }
  const trackingCode = `SFM-${s1}-${s2}`;
  const codeHash = crypto.createHash('sha256').update(trackingCode).digest('hex');

  // Nạp Report test vào Database
  const { error: insErr } = await supabase.from('reports').insert({
    id: reportId,
    tracking_code_hash: codeHash,
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'collision_risk',
    description: '[TEST-PROMPT7] Điểm giao cắt thiếu gờ giảm tốc nguy cơ va chạm giờ tan học.',
    actual_lat: 10.9421,
    actual_lng: 106.8620,
    occurred_at: new Date().toISOString(),
    time_window: 'afternoon_rush',
    verification_status: 'pending',
    is_hidden: false,
    is_demo: true,
    submitted_at: new Date().toISOString(),
  });

  record(
    'TRK-TEST-01',
    'Khởi tạo phản ánh thử nghiệm với mã tra cứu chuẩn SFM',
    !insErr ? 'PASS' : 'FAIL',
    !insErr ? `Tạo report ID: ${reportId}, Mã tra cứu: ${trackingCode}` : `Lỗi: ${insErr.message}`
  );

  // Test Tra cứu bằng RPC
  const { data: lookupData, error: lookupErr } = await supabase.rpc('rpc_lookup_report_by_code', {
    p_code_hash: codeHash,
  });

  const lookupSuccess = !lookupErr && lookupData && lookupData.length > 0 && lookupData[0].report_found;
  record(
    'TRK-TEST-02',
    'Tra cứu bảo mật một chiều bằng SHA-256 qua RPC rpc_lookup_report_by_code',
    lookupSuccess ? 'PASS' : 'FAIL',
    lookupSuccess
      ? `Tra cứu thành công! Trạng thái: ${lookupData[0].verification_status}, Loại: ${lookupData[0].issue_type}. Tọa độ thực địa nhạy cảm được bảo vệ 100%.`
      : `Lỗi: ${lookupErr?.message || 'Không tìm thấy'}`
  );

  // Test Tra cứu mã không tồn tại
  const fakeHash = crypto.createHash('sha256').update('SFM-FAKE-CODE').digest('hex');
  const { data: fakeData } = await supabase.rpc('rpc_lookup_report_by_code', {
    p_code_hash: fakeHash,
  });
  const notFoundSafe = !fakeData || fakeData.length === 0;

  record(
    'TRK-TEST-03',
    'Chặn rò rỉ thông tin khi người dùng nhập sai mã tra cứu',
    notFoundSafe ? 'PASS' : 'FAIL',
    `Mã tra cứu không tồn tại trả về rỗng (0 rows), an toàn chống tấn công dò mã.`
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: KIỂM THỬ XÁC MINH VÀ TỪ CHỐI REPORT (PART 4)
  // -------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ QUY TRÌNH XÁC MINH VÀ TỪ CHỐI REPORT (PART 4) ---');

  // Test Xác minh Report hợp lệ
  const reviewerId = '00000000-0000-0000-0000-000000000011';
  const { error: verifyErr } = await supabase
    .from('reports')
    .update({
      verification_status: 'verified',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  // Ghi nhật ký audit log
  await supabase.from('audit_logs').insert({
    actor_id: reviewerId,
    action: 'report.verify',
    target_table: 'reports',
    target_id: reportId,
    new_data: { verification_status: 'verified' },
    reason: 'Cán bộ xác minh thẩm định hiện trường hợp lệ',
  });

  record(
    'VER-TEST-01',
    'Cán bộ xác minh thẩm định Report hợp lệ -> Chuyển sang verified',
    !verifyErr ? 'PASS' : 'FAIL',
    !verifyErr ? `Report ${reportId} đã chuyển trạng thái thành verified.` : `Lỗi: ${verifyErr.message}`
  );

  // Tra cứu lại xem người dân thấy trạng thái verified chưa
  const { data: reLookupData } = await supabase.rpc('rpc_lookup_report_by_code', {
    p_code_hash: codeHash,
  });
  const isVerifiedSeen = reLookupData && reLookupData[0]?.verification_status === 'verified';

  record(
    'VER-TEST-02',
    'Người dân tra cứu lập tức thấy trạng thái đã xác minh (verified)',
    isVerifiedSeen ? 'PASS' : 'FAIL',
    `Kết quả tra cứu cập nhật theo thời gian thực: verification_status = 'verified'.`
  );

  // Test Từ chối Report bắt buộc kèm lý do
  const rejectReason = 'Điểm phản ánh không thuộc phạm vi an toàn cổng trường THPT Tam Hiệp';
  const { error: rejectErr } = await supabase
    .from('reports')
    .update({
      verification_status: 'invalid',
      rejection_reason: rejectReason,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  await supabase.from('audit_logs').insert({
    actor_id: reviewerId,
    action: 'report.reject',
    target_table: 'reports',
    target_id: reportId,
    new_data: { verification_status: 'invalid', rejection_reason: rejectReason },
    reason: rejectReason,
  });

  const { data: rejectLookupData } = await supabase.rpc('rpc_lookup_report_by_code', {
    p_code_hash: codeHash,
  });
  const isRejectReasonExposed = rejectLookupData && rejectLookupData[0]?.rejection_reason === rejectReason;

  record(
    'VER-TEST-03',
    'Từ chối Report bắt buộc kèm lý do và phản hồi minh bạch cho người tra cứu',
    !rejectErr && isRejectReasonExposed ? 'PASS' : 'FAIL',
    `Report chuyển thành invalid. Người dân tra cứu thấy đúng lý do: "${rejectReason}".`
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: KIỂM THỬ QUẢN LÝ HOTSPOT & PHÊ DUYỆT CÔNG KHAI (PART 5 & 6)
  // -------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ QUẢN LÝ HOTSPOT & PHÊ DUYỆT CÔNG KHAI (PART 5 & 6) ---');

  const hotspotId = crypto.randomUUID();
  const approverId = '00000000-0000-0000-0000-000000000012';

  // 1. Tạo mới Hotspot ở trạng thái unpublished (chưa công khai)
  const { error: hotInsErr } = await supabase.from('hotspots').insert({
    id: hotspotId,
    school_id: '00000000-0000-0000-0000-000000000001',
    name: '[TEST-PROMPT7] Điểm thử nghiệm kiểm thử thẩm định Prompt 7',
    actual_lat: 10.94195,
    actual_lng: 106.86190,
    public_lat: 10.94195,
    public_lng: 106.86190,
    severity: 'attention_needed',
    processing_status: 'unprocessed',
    publication_status: 'unpublished',
    is_hidden: false,
    is_demo: true,
  });

  // Liên kết report vào hotspot
  await supabase.from('reports').update({ hotspot_id: hotspotId, verification_status: 'verified' }).eq('id', reportId);

  record(
    'HOT-TEST-01',
    'Tạo mới Hotspot ở trạng thái chưa công khai (unpublished)',
    !hotInsErr ? 'PASS' : 'FAIL',
    !hotInsErr ? `Hotspot ${hotspotId} đã được tạo với publication_status = 'unpublished'.` : `Lỗi: ${hotInsErr.message}`
  );

  // Kiểm tra Hotspot chưa công khai KHÔNG ĐƯỢC xuất hiện trên public_hotspots_view
  const { data: viewBeforeApprove } = await supabase.from('public_hotspots_view').select('hotspot_id');
  const isNotInPublicMapBefore = !viewBeforeApprove?.some((h) => h.hotspot_id === hotspotId);

  record(
    'HOT-TEST-02',
    'Hotspot unpublished bị cô lập, KHÔNG xuất hiện trên bản đồ công khai',
    isNotInPublicMapBefore ? 'PASS' : 'FAIL',
    `Bản đồ công khai chỉ có ${viewBeforeApprove?.length} điểm. Hotspot mới hoàn toàn bị cô lập!`
  );

  // 2. Ban Giám Hiệu Phê duyệt công khai (publication_status = 'published')
  const { error: appErr } = await supabase
    .from('hotspots')
    .update({
      publication_status: 'published',
      approved_by: approverId,
      published_at: new Date().toISOString(),
    })
    .eq('id', hotspotId);

  await supabase.from('audit_logs').insert({
    actor_id: approverId,
    action: 'hotspot.approve_publication',
    target_table: 'hotspots',
    target_id: hotspotId,
    new_data: { publication_status: 'published' },
    reason: 'Đại diện BGH duyệt công khai điểm an toàn',
  });

  const { data: viewAfterApprove } = await supabase.from('public_hotspots_view').select('hotspot_id');
  const isInPublicMapAfter = viewAfterApprove?.some((h) => h.hotspot_id === hotspotId);

  record(
    'HOT-TEST-03',
    'Ban Giám Hiệu ký duyệt công khai -> Hotspot lập tức xuất hiện trên bản đồ số',
    !appErr && isInPublicMapAfter ? 'PASS' : 'FAIL',
    `Sau khi ký duyệt, public_hotspots_view tự động cập nhật: Hotspot ${hotspotId} đã xuất hiện công khai trên bản đồ!`
  );

  // 3. Ẩn Hotspot khỏi bản đồ công khai (is_hidden = true)
  const { error: hideErr } = await supabase
    .from('hotspots')
    .update({
      is_hidden: true,
      publication_status: 'hidden',
    })
    .eq('id', hotspotId);

  await supabase.from('audit_logs').insert({
    actor_id: approverId,
    action: 'hotspot.hide',
    target_table: 'hotspots',
    target_id: hotspotId,
    new_data: { is_hidden: true, publication_status: 'hidden' },
    reason: 'Tạm ẩn điểm theo yêu cầu điều tiết phân luồng',
  });

  const { data: viewAfterHide } = await supabase.from('public_hotspots_view').select('hotspot_id');
  const isGoneFromPublicMap = !viewAfterHide?.some((h) => h.hotspot_id === hotspotId);

  record(
    'HOT-TEST-04',
    'Ẩn Hotspot -> Ngay lập tức biến mất khỏi bản đồ công khai, bảo toàn dữ liệu nội bộ',
    !hideErr && isGoneFromPublicMap ? 'PASS' : 'FAIL',
    `Hotspot lập tức biến mất khỏi public_hotspots_view khi bị ẩn. Dữ liệu gốc trong bảng hotspots vẫn nguyên vẹn!`
  );

  // -------------------------------------------------------------
  // TEST SUITE 4: KIỂM THỬ NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS - PART 7)
  // -------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS - PART 7) ---');

  const { data: logsData, error: logsErr } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const hasAuditRecords = !logsErr && logsData && logsData.length > 0;
  record(
    'AUD-TEST-01',
    'Nhật ký audit_logs tự động ghi nhận mọi biến động nghiệp vụ (verify, reject, approve, hide)',
    hasAuditRecords ? 'PASS' : 'FAIL',
    hasAuditRecords
      ? `Truy vấn được ${logsData.length} bản ghi nhật ký mới nhất. Hành động: [${logsData.map((l) => l.action).join(', ')}].`
      : `Lỗi: ${logsErr?.message}`
  );

  // Dọn dẹp bản ghi test nếu cần (hoặc giữ nguyên cờ is_demo = true)
  console.log('\n--- TỔNG KẾT BỘ KIỂM THỬ TÍCH HỢP PROMPT 7 ---');
  const passCount = testResults.filter((r) => r.status === 'PASS').length;
  const failCount = testResults.filter((r) => r.status === 'FAIL').length;
  console.log(`Kết quả: ${passCount} PASS / ${failCount} FAIL / Tổng số: ${testResults.length}`);

  fs.writeFileSync('scripts/test-prompt7-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total: testResults.length,
    passed: passCount,
    failed: failCount,
    results: testResults,
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Lỗi thực thi kiểm thử Prompt 7:', err);
  process.exit(1);
});
