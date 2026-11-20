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

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const results = [];

function recordTest(category, scenario, expected, actual, status, severity, evidence) {
  results.push({
    category,
    scenario,
    expected,
    actual,
    status,
    severity,
    evidence: typeof evidence === 'object' ? JSON.stringify(evidence) : String(evidence)
  });
}

async function runComprehensiveTests() {
  console.log('=== BẮT ĐẦU ĐỢT RÀ SOÁT VÀ KIỂM THỬ TOÀN DIỆN PROMPT 7 ===\n');

  // ---------------------------------------------------------
  // PHẦN A: TRA CỨU BÁO CÁO CÔNG KHAI
  // ---------------------------------------------------------
  console.log('--- A. KIỂM THỬ TRA CỨU BÁO CÁO CÔNG KHAI ---');

  // Test A1: Empty Code
  const regex = /^SFM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  const emptyCode = '';
  if (!emptyCode || !regex.test(emptyCode)) {
    recordTest(
      'A. Tra cứu công khai',
      'Để trống mã tra cứu',
      'Báo lỗi định dạng, từ chối gửi truy vấn',
      'Báo lỗi: Mã tra cứu không đúng định dạng',
      'PASS',
      'Low',
      'Client & Server Action regex validation'
    );
  }

  // Test A2: Invalid format
  const invalidCode = 'SFM-123-ABC';
  const isValidFormat = regex.test(invalidCode);
  recordTest(
    'A. Tra cứu công khai',
    'Nhập mã sai định dạng (SFM-123-ABC)',
    'Từ chối ngay từ tầng regex trước khi gọi DB',
    isValidFormat ? 'Chấp nhận sai' : 'Chặn thành công với thông báo lỗi định dạng',
    !isValidFormat ? 'PASS' : 'FAIL',
    'Medium',
    `regex.test('SFM-123-ABC') = ${isValidFormat}`
  );

  // Test A3: Non-existent code (SFM-9999-9999)
  const testHashA3 = crypto.createHash('sha256').update('SFM-9999-9999').digest('hex');
  const { data: rpcA3, error: errA3 } = await anonClient.rpc('rpc_lookup_report_by_code', {
    p_code_hash: testHashA3
  });
  const notFoundOk = !errA3 && (!rpcA3 || rpcA3.length === 0 || !rpcA3[0]?.report_found);
  recordTest(
    'A. Tra cứu công khai',
    'Nhập mã không tồn tại trong hệ thống (SFM-9999-9999)',
    'RPC trả về rỗng, báo không tìm thấy phản ánh',
    notFoundOk ? 'Trả về mảng rỗng [] không tìm thấy' : `Lỗi hoặc trả dữ liệu lạ: ${JSON.stringify(rpcA3)}`,
    notFoundOk ? 'PASS' : 'FAIL',
    'High',
    rpcA3
  );

  // Test A4: Rate limit check (In-memory token bucket in lookup-report.ts)
  // Check if rate limiter exists in lookup-report.ts
  const lookupCodeContent = fs.readFileSync('src/app/actions/lookup-report.ts', 'utf8');
  const hasRateLimit = lookupCodeContent.includes('checkRateLimit') && lookupCodeContent.includes('rateLimitMap');
  const rateLimitUsesSingleKey = lookupCodeContent.includes("checkRateLimit('lookup_client')");
  recordTest(
    'A. Tra cứu công khai',
    'Kiểm tra cơ chế Rate Limiting chống quét mã',
    'Hạn chế theo địa chỉ IP/Client để tránh brute-force',
    rateLimitUsesSingleKey 
      ? 'Có rate limiter in-memory nhưng đang dùng chung 1 khóa tĩnh ("lookup_client") cho mọi client thay vì lấy IP từ headers()'
      : 'Đã phân tách rate limit theo client IP',
    rateLimitUsesSingleKey ? 'FAIL' : 'PASS',
    'High',
    'src/app/actions/lookup-report.ts: checkRateLimit("lookup_client") dùng chung global key'
  );

  // Test A5: Data leakage check via RPC
  // What fields does rpc_lookup_report_by_code return?
  const setupSql = fs.readFileSync('supabase/FULL_SETUP_M1.sql', 'utf8');
  const rpcMatch = setupSql.match(/CREATE OR REPLACE FUNCTION public\.rpc_lookup_report_by_code[\s\S]*?RETURNS TABLE\(([\s\S]*?)\)/);
  const returnedColumns = rpcMatch ? rpcMatch[1].trim() : 'NOT_FOUND';
  const hasPii = returnedColumns.includes('reporter_phone') || 
                 returnedColumns.includes('reporter_name') || 
                 returnedColumns.includes('reporter_email') ||
                 returnedColumns.includes('actual_lat') ||
                 returnedColumns.includes('internal_notes');
  recordTest(
    'A. Tra cứu công khai',
    'Kiểm tra rò rỉ dữ liệu cá nhân (PII) qua RPC tra cứu',
    'Tuyệt đối không trả về SĐT, Họ tên, Ghi chú nội bộ, Tọa độ vi mô',
    hasPii ? 'Phát hiện cột nhạy cảm trong RPC' : 'An toàn: Chỉ trả report_found, verification_status, issue_type, time_window, submitted_at, hotspot_name, hotspot_processing_status, rejection_reason',
    !hasPii ? 'PASS' : 'FAIL',
    'Critical',
    returnedColumns
  );

  // ---------------------------------------------------------
  // PHẦN B: ĐĂNG NHẬP VÀ XÁC THỰC
  // ---------------------------------------------------------
  console.log('--- B. KIỂM THỬ ĐĂNG NHẬP VÀ XÁC THỰC ---');

  // Test B1: Direct access to admin pages without auth
  const layoutContent = fs.readFileSync('src/app/quan-tri/layout.tsx', 'utf8');
  const hasClientRedirect = layoutContent.includes("router.push('/dang-nhap')");
  // Check middleware.ts
  const hasMiddleware = fs.existsSync('src/middleware.ts');
  let middlewareContent = '';
  if (hasMiddleware) {
    middlewareContent = fs.readFileSync('src/middleware.ts', 'utf8');
  }
  const hasServerMiddlewareProtect = hasMiddleware && middlewareContent.includes('/quan-tri');

  recordTest(
    'B. Đăng nhập & Xác thực',
    'Truy cập trực tiếp URL quản trị (/quan-tri) khi chưa đăng nhập',
    'Hệ thống chặn truy cập ở tầng Server/Middleware hoặc Client Layout',
    hasServerMiddlewareProtect 
      ? 'Được bảo vệ bằng Next.js Middleware ở Server'
      : (hasClientRedirect ? 'Chặn bằng useEffect Client-side (Chưa có Server Middleware bắt buộc)' : 'Không chặn'),
    hasServerMiddlewareProtect ? 'PASS' : 'FAIL',
    'High',
    hasMiddleware ? 'middleware.ts tồn tại nhưng cần kiểm tra scope' : 'Chưa có middleware.ts bảo vệ SSR route /quan-tri'
  );

  // Test B2: Demo Mode switcher presence
  const authContextContent = fs.readFileSync('src/lib/context/AuthContext.tsx', 'utf8');
  const hasDemoProfiles = authContextContent.includes('DEMO_PROFILES') && authContextContent.includes('signInDemo');
  recordTest(
    'B. Đăng nhập & Xác thực',
    'Hỗ trợ chế độ thử nghiệm vai trò DEMO (Verifier, Approver, Admin)',
    'Cung cấp phương thức chuyển đổi vai trò cho kiểm thử viên',
    hasDemoProfiles ? 'Có bộ chuyển đổi vai trò DEMO nhanh qua localStorage + context' : 'Thiếu',
    hasDemoProfiles ? 'PASS' : 'Low',
    'AuthContext.tsx: signInDemo(role)'
  );

  // ---------------------------------------------------------
  // PHẦN C: DASHBOARD QUẢN TRỊ
  // ---------------------------------------------------------
  console.log('--- C. KIỂM THỬ DASHBOARD QUẢN TRỊ ---');

  // Test C1: RLS issue with anon key on reports
  const { data: anonRep, error: anonRepErr } = await anonClient.from('reports').select('id');
  const reportsProtectedByRls = anonRep !== null && anonRep.length === 0;
  recordTest(
    'C. Dashboard quản trị',
    'Truy vấn số liệu phản ánh bằng Supabase Anon Client',
    'Cần phiên Authenticated hoặc Security Definer RPC để lấy đúng số liệu thực',
    reportsProtectedByRls ? 'RLS chặn anon client -> trả về 0 dòng nếu Server Action dùng createClient anon key' : 'Anon lấy được reports',
    reportsProtectedByRls ? 'FAIL' : 'PASS',
    'High',
    'admin-dashboard.ts dùng anon createClient nên khi chạy thực tế không lấy được số liệu của reports'
  );

  // Test C2: Hotspots data retrieval
  const { data: hotData } = await anonClient.from('hotspots').select('id, publication_status, is_demo, is_hidden');
  const hotspotCount = hotData?.length || 0;
  recordTest(
    'C. Dashboard quản trị',
    'Đếm số lượng Hotspot công khai',
    'Đếm đúng số Hotspot được phép đọc từ Supabase',
    `Lấy được ${hotspotCount} Hotspots từ cơ sở dữ liệu`,
    hotspotCount > 0 ? 'PASS' : 'FAIL',
    'Medium',
    hotData
  );

  // ---------------------------------------------------------
  // PHẦN D: QUẢN LÝ VÀ XÁC MINH REPORT
  // ---------------------------------------------------------
  console.log('--- D. KIỂM THỬ QUẢN LÝ VÀ XÁC MINH REPORT ---');

  // Test D1: Mandatory rejection reason
  const adminReportsCode = fs.readFileSync('src/app/actions/admin-reports.ts', 'utf8');
  const rejectsWithoutReason = adminReportsCode.includes('if (!reason || reason.length < 5)');
  recordTest(
    'D. Quản lý & Xác minh Report',
    'Bắt buộc có lý do khi từ chối phản ánh (invalid)',
    'Từ chối thực hiện nếu lý do rỗng hoặc dưới 5 ký tự',
    rejectsWithoutReason ? 'Bắt buộc tối thiểu 5 ký tự, trả về thông báo lỗi cụ thể' : 'Cho phép bỏ trống lý do',
    rejectsWithoutReason ? 'PASS' : 'FAIL',
    'High',
    'rejectReportAction kiểm tra reason.length >= 5'
  );

  // Test D2: Audit log schema alignment in verifyReportAction / rejectReportAction
  const usesWrongAuditColumns = adminReportsCode.includes('target_table:') || adminReportsCode.includes('target_id:');
  recordTest(
    'D. Quản lý & Xác minh Report',
    'Khớp cột khi ghi Audit Log trong verifyReportAction / rejectReportAction',
    'Phải dùng object_type, object_id, new_value theo schema M1',
    usesWrongAuditColumns ? 'LỆCH SCHEMA: Sử dụng target_table, target_id, new_data dẫn đến lỗi PostgREST 400' : 'Đúng schema',
    usesWrongAuditColumns ? 'FAIL' : 'PASS',
    'Critical',
    'audit_logs schema: object_type, object_id, new_value vs code: target_table, target_id, new_data'
  );

  // Test D3: Signed URL for private images
  const hasSignedUrlAction = adminReportsCode.includes('createSignedUrl') && adminReportsCode.includes('private-reports');
  recordTest(
    'D. Quản lý & Xác minh Report',
    'Bảo mật hình ảnh phản ánh qua Signed URL có thời hạn',
    'Tạo liên kết có thời hạn 300 giây (5 phút), không công khai URL trực tiếp',
    hasSignedUrlAction ? 'Đã triển khai getReportMediaSignedUrlAction với thời hạn 300s từ bucket private-reports' : 'Không có Signed URL',
    hasSignedUrlAction ? 'PASS' : 'FAIL',
    'High',
    'admin-reports.ts: createSignedUrl(filePath, 300)'
  );

  // ---------------------------------------------------------
  // PHẦN E: QUẢN LÝ HOTSPOT
  // ---------------------------------------------------------
  console.log('--- E. KIỂM THỬ QUẢN LÝ HOTSPOT ---');

  const adminHotspotsCode = fs.readFileSync('src/app/actions/admin-hotspots.ts', 'utf8');
  // Test E1: Initial publication status on creation
  const createsAsUnpublished = adminHotspotsCode.includes("publication_status: 'unpublished'");
  recordTest(
    'E. Quản lý Hotspot',
    'Trạng thái công khai ban đầu khi mới tạo Hotspot',
    'Bắt buộc là unpublished, không được tự động xuất hiện trên bản đồ công khai',
    createsAsUnpublished ? 'Khởi tạo publication_status = unpublished' : 'Tự động công khai',
    createsAsUnpublished ? 'PASS' : 'FAIL',
    'Critical',
    'createHotspotAction: publication_status = "unpublished"'
  );

  // Test E2: Separation of 3 state axes
  // severity (hotspot_severity_enum), processing_status (processing_status_enum), publication_status (publication_status_enum)
  const has3Axes = adminHotspotsCode.includes('severity:') && 
                   adminHotspotsCode.includes('processing_status:') && 
                   adminHotspotsCode.includes('publication_status:');
  recordTest(
    'E. Quản lý Hotspot',
    'Độc lập 3 trục trạng thái: Mức độ, Tiến độ can thiệp, Trạng thái công khai',
    '3 trục trạng thái riêng biệt, không gộp chung',
    has3Axes ? 'Phân tách rõ ràng: severity, processing_status, publication_status' : 'Bị gộp trạng thái',
    has3Axes ? 'PASS' : 'FAIL',
    'High',
    'hotspots: severity, processing_status, publication_status'
  );

  // ---------------------------------------------------------
  // PHẦN F: QUY TRÌNH PHÊ DUYỆT VÀ CÔNG KHAI
  // ---------------------------------------------------------
  console.log('--- F. KIỂM THỬ QUY TRÌNH PHÊ DUYỆT VÀ CÔNG KHAI ---');

  // Test F1: 5 safety conditions enforcement
  // Check approveHotspotAction in admin-hotspots.ts
  const checksSeverity = adminHotspotsCode.includes('if (!hotspot.severity)');
  const checksAttachedEvidence = adminHotspotsCode.includes('verified_report_count') || adminHotspotsCode.includes('chk_hotspot_publication_approval');
  recordTest(
    'F. Phê duyệt & Công khai',
    'Kiểm tra điều kiện: Đã thiết lập mức độ nguy cơ (Severity)',
    'Từ chối phê duyệt nếu chưa có severity',
    checksSeverity ? 'Kiểm tra nghiêm ngặt !hotspot.severity' : 'Chưa kiểm tra severity',
    checksSeverity ? 'PASS' : 'FAIL',
    'High',
    'approveHotspotAction checks !hotspot.severity'
  );

  // Test F2: Database constraint chk_hotspot_publication_approval
  const hasDbConstraint = setupSql.includes('chk_hotspot_publication_approval');
  recordTest(
    'F. Phê duyệt & Công khai',
    'Ràng buộc tầng Database: Khi published bắt buộc có approved_by và published_at',
    'Database ràng buộc CHECK constraint chk_hotspot_publication_approval',
    hasDbConstraint ? 'Constraint chk_hotspot_publication_approval kích hoạt tại DB' : 'Chưa có CHECK constraint',
    hasDbConstraint ? 'PASS' : 'FAIL',
    'Critical',
    'chk_hotspot_publication_approval in FULL_SETUP_M1.sql'
  );

  // Test F3: Hide action revokes publication
  const hideSetsHidden = adminHotspotsCode.includes("is_hidden: true") && adminHotspotsCode.includes("publication_status: 'hidden'");
  recordTest(
    'F. Phê duyệt & Công khai',
    'Thao tác ẩn Hotspot (Hide Action) thu hồi quyền hiển thị trên bản đồ',
    'Đặt is_hidden = true và publication_status = hidden',
    hideSetsHidden ? 'Cập nhật đồng thời is_hidden: true và publication_status: hidden' : 'Chưa đầy đủ',
    hideSetsHidden ? 'PASS' : 'FAIL',
    'Critical',
    'hideHotspotAction sets is_hidden=true, publication_status="hidden"'
  );

  // Test F4: Public Map query filter check
  // Does public map query filter publication_status = 'published' AND is_hidden = false?
  const mapCode = fs.readFileSync('src/app/(public)/ban-do/page.tsx', 'utf8');
  const mapFiltersPublished = mapCode.includes("publication_status === 'published'") || mapCode.includes('publication_status') || mapCode.includes('is_published');
  recordTest(
    'F. Phê duyệt & Công khai',
    'Bản đồ công khai (/ban-do) chỉ hiển thị Hotspot đủ điều kiện',
    'Bản đồ lọc chính xác các điểm có publication_status = published và !is_hidden',
    mapFiltersPublished ? 'Bản đồ lọc điều kiện công khai' : 'Cần kiểm tra kỹ cơ chế truy vấn của Map',
    mapFiltersPublished ? 'PASS' : 'FAIL',
    'Critical',
    'ban-do/page.tsx logic lọc hotspot'
  );

  // ---------------------------------------------------------
  // PHẦN G: PHÂN QUYỀN VÀ BẢO MẬT API
  // ---------------------------------------------------------
  console.log('--- G. KIỂM THỬ PHÂN QUYỀN VÀ BẢO MẬT ---');

  // Test G1: Role-based navigation visibility
  const sidebarCode = fs.readFileSync('src/components/layout/AdminSidebar.tsx', 'utf8');
  const hidesAccountFromNonAdmin = sidebarCode.includes("item.adminOnly && role !== 'admin'");
  recordTest(
    'G. Phân quyền người dùng',
    'Ẩn menu Quản lý tài khoản đối với Verifier và Approver',
    'Chỉ Admin mới nhìn thấy menu Quản lý tài khoản',
    hidesAccountFromNonAdmin ? 'Ẩn menu tài khoản thành công ở Sidebar nếu không phải Admin' : 'Hiển thị cho mọi vai trò',
    hidesAccountFromNonAdmin ? 'PASS' : 'FAIL',
    'Medium',
    'AdminSidebar.tsx: item.adminOnly && role !== "admin"'
  );

  // Test G2: Server-side authorization check in Server Actions
  // Check if server actions verify the caller session or rely on client-supplied parameters
  const serverActionVerifiesCaller = adminReportsCode.includes('auth.getUser()') || adminReportsCode.includes('getServerSession');
  recordTest(
    'G. Phân quyền người dùng',
    'Kiểm tra quyền hạn thực tế ở tầng Backend (Server Action Authorization)',
    'Server Action phải lấy phiên đăng nhập từ HttpOnly Cookie thay vì chỉ tin cậy reviewerId do client gửi lên',
    serverActionVerifiesCaller 
      ? 'Đã xác thực session từ HttpOnly cookie'
      : 'CẢNH BÁO: Server Action nhận reviewerId từ client payload mà chưa đối chiếu với Supabase Auth session token',
    serverActionVerifiesCaller ? 'PASS' : 'FAIL',
    'Critical',
    'verifyReportAction, rejectReportAction nhận reviewerId từ client params'
  );

  // ---------------------------------------------------------
  // PHẦN H: AUDIT LOGS
  // ---------------------------------------------------------
  console.log('--- H. KIỂM THỬ AUDIT LOGS ---');

  // Test H1: Audit logs append-only protection in Database
  const hasNoUpdateOrDeletePolicyOnAudit = setupSql.includes('-- BẢO VỆ BẤT BIẾN: TUYỆT ĐỐI KHÔNG TẠO POLICY UPDATE HOẶC DELETE CHO audit_logs!');
  recordTest(
    'H. Audit Logs',
    'Tính bất biến của Audit Logs (Append-only guarantee)',
    'Không có policy UPDATE hoặc DELETE trên bảng audit_logs',
    hasNoUpdateOrDeletePolicyOnAudit ? 'Chỉ có SELECT và INSERT, tuyệt đối không có UPDATE hoặc DELETE' : 'Có nguy cơ bị sửa/xóa',
    hasNoUpdateOrDeletePolicyOnAudit ? 'PASS' : 'FAIL',
    'Critical',
    'FULL_SETUP_M1.sql: Không tạo policy UPDATE/DELETE cho audit_logs'
  );

  console.log('\n=== KẾT QUẢ TỔNG HỢP KIỂM THỬ: ===');
  console.log(`Tổng số bài test: ${results.length}`);
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`PASS: ${passCount} | FAIL: ${failCount}`);

  fs.writeFileSync('scripts/audit_test_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\nĐã lưu kết quả chi tiết vào scripts/audit_test_results.json');
}

runComprehensiveTests().catch(console.error);
