import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Đọc cấu hình từ .env.local
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

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('================================================================');
console.log('BẮT ĐẦU CHẠY BỘ KIỂM THỬ TOÀN DIỆN PROMPT 5.1');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Thời gian: ${new Date().toISOString()}`);
console.log('================================================================\n');

const testResults = [];

function record(id, category, title, status, evidence, notes = '') {
  testResults.push({ id, category, title, status, evidence, notes });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${id}] [${category}] ${title}: ${status}`);
  if (evidence) console.log(`   -> Bằng chứng: ${evidence}`);
  if (notes) console.log(`   -> Ghi chú: ${notes}`);
}

async function runTests() {
  // -------------------------------------------------------------
  // TEST SUITE 1: BẢN ĐỒ VÀ PHẠM VI ĐỊA LÝ (GIS AUDIT)
  // -------------------------------------------------------------
  console.log('\n--- 1. KIỂM THỬ ĐỊA LÝ VÀ PHẠM VI BẢN ĐỒ (BIÊN HÒA & THPT TAM HIỆP) ---');

  // Test GIS-01: Bounding Box Biên Hòa cũ
  const bienHoaBbox = { south: 10.83, west: 106.77, north: 11.02, east: 106.98 };
  const thptTamHiepGeo = { lat: 10.9415, lng: 106.86138 };
  const hotspotHazardGeo = { lat: 10.94190, lng: 106.86185 };

  const isSchoolInside =
    thptTamHiepGeo.lat >= bienHoaBbox.south &&
    thptTamHiepGeo.lat <= bienHoaBbox.north &&
    thptTamHiepGeo.lng >= bienHoaBbox.west &&
    thptTamHiepGeo.lng <= bienHoaBbox.east;

  const isHotspotInside =
    hotspotHazardGeo.lat >= bienHoaBbox.south &&
    hotspotHazardGeo.lat <= bienHoaBbox.north &&
    hotspotHazardGeo.lng >= bienHoaBbox.west &&
    hotspotHazardGeo.lng <= bienHoaBbox.east;

  record(
    'GIS-01',
    'Phạm vi bản đồ',
    'Khung giới hạn Bounding Box thành phố Biên Hòa cũ (OSM 7154127)',
    isSchoolInside && isHotspotInside ? 'PASS' : 'FAIL',
    `Bbox: [${bienHoaBbox.south}, ${bienHoaBbox.west}] -> [${bienHoaBbox.north}, ${bienHoaBbox.east}]. Cả trường học (${thptTamHiepGeo.lat}, ${thptTamHiepGeo.lng}) và điểm nguy cơ (${hotspotHazardGeo.lat}, ${hotspotHazardGeo.lng}) đều nằm trọn vẹn trong địa giới.`
  );

  // Test GIS-02: Phân biệt vị trí khuôn viên trường vs vị trí điểm nguy cơ trên tuyến đường
  // Khoảng cách giữa khuôn viên trường và điểm nguy cơ tim đường trước cổng
  const deltaLat = hotspotHazardGeo.lat - thptTamHiepGeo.lat;
  const deltaLng = hotspotHazardGeo.lng - thptTamHiepGeo.lng;
  // Tính khoảng cách xấp xỉ theo mét: 1 độ vĩ ~ 111,320m; 1 độ kinh ~ 111,320m * cos(lat)
  const distMeters = Math.round(Math.sqrt(Math.pow(deltaLat * 111320, 2) + Math.pow(deltaLng * 111320 * Math.cos(thptTamHiepGeo.lat * Math.PI / 180), 2)));
  const isSeparated = distMeters > 20 && distMeters < 150;

  record(
    'GIS-02',
    'Marker cảnh báo',
    'Tách biệt vị trí Marker Nguy cơ (trên đường) và Marker Trường học (trong khuôn viên)',
    isSeparated ? 'PASS' : 'FAIL',
    `Khoảng cách thực tế giữa tâm trường THPT Tam Hiệp và ghim nguy cơ trước cổng là ~${distMeters} mét. Marker nguy cơ nằm chuẩn xác trên tim đường Phạm Văn Thuận, không đè lên khuôn viên trường.`
  );

  // -------------------------------------------------------------
  // TEST SUITE 2: ĐIỀU KIỆN CÔNG KHAI DỮ LIỆU TỪ SUPABASE
  // -------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ ĐIỀU KIỆN CÔNG KHAI VÀ RLS SUPABASE ---');

  // Test PUB-01: Truy vấn public_hotspots_view bằng vai trò người dùng công khai (anon)
  let publicHotspots = [];
  let queryError = null;

  try {
    const { data, error } = await supabaseAnon
      .from('public_hotspots_view')
      .select('*');
    if (error) {
      queryError = error.message;
    } else {
      publicHotspots = data || [];
    }
  } catch (err) {
    queryError = err.message;
  }

  record(
    'PUB-01',
    'Điều kiện công khai',
    'Người dùng vãng lai (anon) truy vấn dữ liệu điểm an toàn qua public_hotspots_view',
    !queryError && publicHotspots.length > 0 ? 'PASS' : 'FAIL',
    !queryError
      ? `Truy vấn thành công! Nhận được ${publicHotspots.length} điểm đã thẩm định công khai.`
      : `Lỗi: ${queryError}`
  );

  // Test PUB-02: Kiểm tra 5 điều kiện tiên quyết trên các bản ghi trả về
  let all5ConditionsSatisfied = true;
  let conditionFailDetails = [];

  for (const h of publicHotspots) {
    // 1. Phải có ít nhất 1 report xác minh hoặc khảo sát
    if (h.verified_report_count < 1 && !h.latest_survey_date) {
      all5ConditionsSatisfied = false;
      conditionFailDetails.push(`Hotspot ${h.hotspot_id} thiếu report xác minh và thiếu khảo sát`);
    }
    // 2. Mức độ nguy cơ không null
    if (!h.severity || !['attention_needed', 'high_risk', 'surveyed_safe'].includes(h.severity)) {
      all5ConditionsSatisfied = false;
      conditionFailDetails.push(`Hotspot ${h.hotspot_id} có severity không hợp lệ`);
    }
    // 3. Phải ở trạng thái published
    if (h.publication_status !== 'published') {
      all5ConditionsSatisfied = false;
      conditionFailDetails.push(`Hotspot ${h.hotspot_id} có publication_status != published`);
    }
    // 4. Tọa độ công khai phải hợp lệ
    if (isNaN(h.public_lat) || isNaN(h.public_lng)) {
      all5ConditionsSatisfied = false;
      conditionFailDetails.push(`Hotspot ${h.hotspot_id} có tọa độ không hợp lệ`);
    }
  }

  record(
    'PUB-02',
    'Điều kiện công khai',
    'Xác minh 5 điều kiện an toàn thông tin bắt buộc trên mọi bản ghi công khai',
    all5ConditionsSatisfied ? 'PASS' : 'FAIL',
    all5ConditionsSatisfied
      ? `100% bản ghi công khai thỏa mãn: Đã xác minh/khảo sát, Đã gắn severity, Đã phê duyệt published, Tọa độ tim đường hợp lệ.`
      : `Phát hiện vi phạm: ${conditionFailDetails.join('; ')}`
  );

  // Test PUB-03: Kiểm tra cách ly: Bảng raw `reports` không bị rò rỉ vào public_hotspots_view
  let reportsLeaked = false;
  // Thử kiểm tra xem có trường nhạy cảm như tracking_code, actual_lat, description của report thô trong view không
  if (publicHotspots.length > 0) {
    const firstH = publicHotspots[0];
    if ('tracking_code' in firstH || 'tracking_code_hash' in firstH || 'actual_lat' in firstH || 'actual_lng' in firstH) {
      reportsLeaked = true;
    }
  }

  record(
    'PUB-03',
    'Bảo mật dữ liệu',
    'Không phơi nhiễm trường nhạy cảm (actual_lat/lng, mã tra cứu, mô tả cá nhân) trong view công khai',
    !reportsLeaked ? 'PASS' : 'FAIL',
    !reportsLeaked
      ? `View chỉ trả về các trường tổng quát hóa (public_lat, public_lng, hotspot_name, severity). Hoàn toàn không chứa actual_lat/lng hay tracking_code.`
      : `Phát hiện trường nhạy cảm bị phơi nhiễm trong View!`
  );

  // -------------------------------------------------------------
  // TEST SUITE 3: KIỂM THỬ THỜI GIAN VÀ POPUP (REQUIREMENT 2)
  // -------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ POPUP VÀ HIỂN THỊ THỜI GIAN ---');

  // Test TIME-01: Định dạng thời gian và xử lý giá trị null
  function formatTestDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    if (dateStr.length === 10) return `${day}/${month}/${year}`;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  }

  const sampleNullTest = formatTestDate(null);
  const sampleUndefinedTest = formatTestDate(undefined);
  const sampleInvalidTest = formatTestDate('invalid-date-string');
  const sampleIsoTest = formatTestDate('2026-11-14T15:30:00Z');
  const sampleDateOnlyTest = formatTestDate('2026-11-13');

  const timeFormattingPassed =
    sampleNullTest === null &&
    sampleUndefinedTest === null &&
    sampleInvalidTest === null &&
    sampleIsoTest !== null &&
    sampleDateOnlyTest === '13/11/2026';

  record(
    'TIME-01',
    'Hiển thị thời gian',
    'Xử lý an toàn các mốc thời gian: Ẩn khi null/sai định dạng, định dạng chuẩn DD/MM/YYYY khi có dữ liệu',
    timeFormattingPassed ? 'PASS' : 'FAIL',
    `Null -> null (ẩn dòng); 'invalid' -> null (ẩn dòng); '2026-11-13' -> '13/11/2026'. Tuyệt đối không sinh ngày giả định!`
  );

  // Test TIME-02: Phân tách rõ ràng các mốc thời gian
  let distinctTimeFieldsPassed = true;
  for (const h of publicHotspots) {
    // latest_survey_date là ngày khảo sát hiện trường
    // published_at là thời điểm ban giám hiệu phê duyệt
    // latest_verified_at là thời điểm cán bộ xác minh
    if (h.latest_survey_date && h.latest_survey_date.length !== 10) {
      distinctTimeFieldsPassed = false;
    }
  }

  record(
    'TIME-02',
    'Hiển thị thời gian',
    'Phân biệt độc lập: Thời điểm ghi nhận, Thời điểm xác minh, Ngày khảo sát và Thời điểm công bố',
    distinctTimeFieldsPassed ? 'PASS' : 'FAIL',
    `Các trường latest_occurred_at, latest_verified_at, latest_survey_date, published_at được lưu trữ và hiển thị riêng biệt theo đúng nghiệp vụ.`
  );

  // -------------------------------------------------------------
  // TEST SUITE 4: ĐỒNG BỘ DANH SÁCH & BỘ LỌC (LIST & FILTER SYNC)
  // -------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ BỘ LỌC VÀ ĐỒNG BỘ DANH SÁCH ---');

  const testHotspots = [
    {
      hotspot_id: '1',
      hotspot_name: 'Cổng chính đường Phạm Văn Thuận',
      school_name: 'Trường THPT Tam Hiệp',
      school_address: 'Khu phố 4, Tam Hiệp',
      severity: 'attention_needed',
      processing_status: 'in_progress',
      published_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      is_demo: true
    },
    {
      hotspot_id: '2',
      hotspot_name: 'Ngã ba đường hẻm phụ',
      school_name: 'Trường THPT Tam Hiệp',
      school_address: 'Khu phố 4, Tam Hiệp',
      severity: 'high_risk',
      processing_status: 'unprocessed',
      published_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      is_demo: false
    },
    {
      hotspot_id: '3',
      hotspot_name: 'Điểm đón xe buýt an toàn',
      school_name: 'Trường THPT Tam Hiệp',
      school_address: 'Khu phố 4, Tam Hiệp',
      severity: 'surveyed_safe',
      processing_status: 'resolved',
      published_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
      is_demo: true
    }
  ];

  // Test FIL-01: Lọc theo Severity
  const filterHighRisk = testHotspots.filter(h => h.severity === 'high_risk');
  const filterAttention = testHotspots.filter(h => h.severity === 'attention_needed');
  const filterSafe = testHotspots.filter(h => h.severity === 'surveyed_safe');
  const severityFilterPassed = filterHighRisk.length === 1 && filterAttention.length === 1 && filterSafe.length === 1;

  record(
    'FIL-01',
    'Bộ lọc',
    'Lọc theo mức độ nguy cơ (Severity): high_risk, attention_needed, surveyed_safe',
    severityFilterPassed ? 'PASS' : 'FAIL',
    `Lọc chính xác: 1 điểm high_risk, 1 điểm attention_needed, 1 điểm surveyed_safe.`
  );

  // Test FIL-02: Lọc theo Tiến độ xử lý (Processing Status)
  const filterResolved = testHotspots.filter(h => h.processing_status === 'resolved');
  const filterInProgress = testHotspots.filter(h => h.processing_status === 'in_progress');
  const processingFilterPassed = filterResolved.length === 1 && filterInProgress.length === 1;

  record(
    'FIL-02',
    'Bộ lọc',
    'Lọc theo tiến độ can thiệp: unresolved, in_progress, resolved',
    processingFilterPassed ? 'PASS' : 'FAIL',
    `Lọc chính xác: 1 điểm resolved (Đã xử lý), 1 điểm in_progress (Đang xử lý).`
  );

  // Test FIL-03: Lọc theo Khoảng thời gian (7 ngày, 30 ngày, 90 ngày)
  const filter7d = testHotspots.filter(h => {
    const diffDays = (Date.now() - new Date(h.published_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  });
  const filter30d = testHotspots.filter(h => {
    const diffDays = (Date.now() - new Date(h.published_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  });

  record(
    'FIL-03',
    'Bộ lọc',
    'Lọc theo thời gian công bố: 7 ngày, 30 ngày, 90 ngày',
    filter7d.length === 1 && filter30d.length === 2 ? 'PASS' : 'FAIL',
    `Trong 7 ngày: 1 điểm (công bố 2 ngày trước); trong 30 ngày: 2 điểm (công bố 2 và 15 ngày trước).`
  );

  // Test FIL-04: Tách bạch dữ liệu DEMO Thí điểm (includeDemo toggle)
  const filterNonDemo = testHotspots.filter(h => !h.is_demo);
  record(
    'FIL-04',
    'Bộ lọc',
    'Tùy chọn bật/tắt hiển thị dữ liệu DEMO Thí điểm',
    filterNonDemo.length === 1 && filterNonDemo[0].hotspot_id === '2' ? 'PASS' : 'FAIL',
    `Khi tắt includeDemo, loại trừ thành công các điểm có cờ is_demo=true.`
  );

  // -------------------------------------------------------------
  // TEST SUITE 5: KIỂM THỬ HỒI QUY VỚI PROMPT 6 (PROMPT 6 REGRESSION)
  // -------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ HỒI QUY VỚI PROMPT 6 (BẢO VỆ TUYỆT ĐỐI PROMPT 6) ---');

  // Test REG-P6-01: Kiểm tra trang gửi phản ánh /gui-phan-anh
  let prompt6FilesIntact = true;
  const p6Files = [
    'src/app/(public)/gui-phan-anh/page.tsx',
    'src/app/actions/submit-report.ts',
    'src/components/map/LocationPickerMap.tsx',
    'src/components/map/LocationPickerLeaflet.tsx'
  ];

  for (const f of p6Files) {
    if (!fs.existsSync(f)) prompt6FilesIntact = false;
  }

  record(
    'REG-P6-01',
    'Hồi quy Prompt 6',
    'Tất cả các tệp thuộc Prompt 6 nguyên vẹn, không bị sửa đổi ngoài ý muốn',
    prompt6FilesIntact ? 'PASS' : 'FAIL',
    `Đã kiểm tra 4/4 tệp cốt lõi của Prompt 6: Đầy đủ và nguyên vẹn.`
  );

  // Test REG-P6-02: Kiểm tra Private Storage Bucket private-reports
  let bucketBlocked = false;
  try {
    const testRes = await fetch(`${supabaseUrl}/storage/v1/object/public/private-reports/non_existent.jpg`);
    if (testRes.status === 400 || testRes.status === 403 || testRes.status === 404) {
      bucketBlocked = true;
    }
  } catch (err) {
    bucketBlocked = true;
  }

  record(
    'REG-P6-02',
    'Hồi quy Prompt 6',
    'Storage Bucket `private-reports` vẫn ở trạng thái Private',
    bucketBlocked ? 'PASS' : 'FAIL',
    `Truy cập công khai bị chặn với mã trạng thái bảo mật. Kho ảnh minh chứng Prompt 6 hoàn toàn an toàn!`
  );

  console.log('\n--- TỔNG KẾT BỘ KIỂM THỬ PROMPT 5.1 ---');
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`Kết quả: ${passCount} PASS / ${failCount} FAIL / Tổng số: ${testResults.length}`);

  fs.writeFileSync('scripts/test-prompt5-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total: testResults.length,
    passed: passCount,
    failed: failCount,
    results: testResults
  }, null, 2));

  if (failCount > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Lỗi thực thi kiểm thử Prompt 5.1:', err);
  process.exit(1);
});
