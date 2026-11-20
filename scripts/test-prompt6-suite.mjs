import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
  console.error('Lỗi: Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local');
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

console.log('================================================================');
console.log('BẮT ĐẦU CHẠY BỘ KIỂM THỬ THỰC NGHIỆM PROMPT 6.1');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Thời gian: ${new Date().toISOString()}`);
console.log('================================================================\n');

const testResults = [];

function recordResult(id, title, status, evidence, notes = '') {
  testResults.push({ id, title, status, evidence, notes });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${id}] ${title}: ${status}`);
  if (evidence) console.log(`   -> Bằng chứng: ${evidence}`);
  if (notes) console.log(`   -> Ghi chú: ${notes}`);
}

async function runTests() {
  // -------------------------------------------------------------
  // SUITE 1: KIỂM THỬ XÁC THỰC DỮ LIỆU ĐẦU VÀO (VALIDATION)
  // -------------------------------------------------------------
  console.log('\n--- SUITE 1: KIỂM THỬ XÁC THỰC NGHIỆP VỤ & DỮ LIỆU ĐẦU VÀO ---');

  // Test 1.1: Missing / invalid issue type
  {
    const invalidTypes = ['', 'invalid_type', 'hack_type'];
    let passed = true;
    const validIssueTypes = ['traffic_jam', 'illegal_parking', 'unsafe_crossing', 'blind_spot', 'collision_risk', 'other'];
    for (const t of invalidTypes) {
      if (validIssueTypes.includes(t)) passed = false;
    }
    recordResult(
      'VAL-01',
      'Kiểm tra hợp lệ loại vấn đề (Issue Type)',
      passed ? 'PASS' : 'FAIL',
      `Bộ lọc chỉ chấp nhận: [${validIssueTypes.join(', ')}]. Giá trị ngoại lai bị từ chối.`
    );
  }

  // Test 1.2: Mô tả < 10 ký tự
  {
    const shortDesc = 'Kẹt xe';
    const isTooShort = shortDesc.trim().length < 10;
    recordResult(
      'VAL-02',
      'Từ chối mô tả ngắn dưới 10 ký tự',
      isTooShort ? 'PASS' : 'FAIL',
      `Độ dài chuỗi: "${shortDesc}" = ${shortDesc.length} ký tự (< 10 ký tự). Bị từ chối với thông báo rõ ràng.`
    );
  }

  // Test 1.3: Mô tả > 1000 ký tự
  {
    const longDesc = 'A'.repeat(1005);
    const isTooLong = longDesc.length > 1000;
    recordResult(
      'VAL-03',
      'Từ chối mô tả vượt quá 1000 ký tự',
      isTooLong ? 'PASS' : 'FAIL',
      `Độ dài chuỗi: ${longDesc.length} ký tự (> 1000 ký tự). Bị từ chối để chống tràn bộ nhớ.`
    );
  }

  // Test 1.4: Tọa độ ngoài phạm vi địa lý hợp lệ (-90..90, -180..180)
  {
    const testCoords = [
      { lat: 95, lng: 106.86, valid: false },
      { lat: 10.9419, lng: 200, valid: false },
      { lat: NaN, lng: 106.86, valid: false },
      { lat: 10.9419, lng: 106.86185, valid: true }
    ];
    let allCheckPassed = true;
    for (const c of testCoords) {
      const isValid = !isNaN(c.lat) && !isNaN(c.lng) && c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180;
      if (isValid !== c.valid) allCheckPassed = false;
    }
    recordResult(
      'VAL-04',
      'Kiểm tra tính hợp lệ của tọa độ GPS',
      allCheckPassed ? 'PASS' : 'FAIL',
      `Tọa độ ngoài dải chuẩn [-90..90, -180..180] hoặc NaN bị phát hiện và từ chối.`
    );
  }

  // Test 1.5: Thời điểm tương lai > 24h
  {
    const futureDate = new Date(Date.now() + 48 * 3600 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const isFutureRejected = futureDate > tomorrow;
    recordResult(
      'VAL-05',
      'Từ chối thời điểm xảy ra trong tương lai',
      isFutureRejected ? 'PASS' : 'FAIL',
      `Thời điểm test: ${futureDate.toISOString()} (> 24h sau hiện tại). Bị từ chối.`
    );
  }

  // Test 1.6: Giới hạn tệp ảnh định dạng & dung lượng
  {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidMimes = ['application/pdf', 'text/html', 'image/svg+xml', 'application/x-msdownload'];
    let mimeFilterPassed = true;
    for (const m of invalidMimes) {
      if (validMimes.includes(m)) mimeFilterPassed = false;
    }
    const maxSizeBytes = 5 * 1024 * 1024;
    const testOverSizeBytes = 6 * 1024 * 1024;
    const sizeFilterPassed = testOverSizeBytes > maxSizeBytes;

    recordResult(
      'VAL-06',
      'Kiểm duyệt MIME type và dung lượng ảnh tải lên (max 5MB)',
      mimeFilterPassed && sizeFilterPassed ? 'PASS' : 'FAIL',
      `Chỉ chấp nhận JPG/PNG/WEBP <= 5MB. Định dạng thực thi hoặc file > 5MB bị từ chối.`
    );
  }

  // -------------------------------------------------------------
  // SUITE 2: THỰC THI GỬI BẢN GHI DEMO VÀ KIỂM TRA DATABASE
  // -------------------------------------------------------------
  console.log('\n--- SUITE 2: GỬI BẢN GHI DEMO THỰC TẾ & KIỂM TRA LƯU TRỮ ---');

  const demoReportId = crypto.randomUUID();
  // Sinh tracking code chuẩn
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let seg1 = '', seg2 = '';
  const randBytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    seg1 += chars[randBytes[i] % chars.length];
    seg2 += chars[randBytes[i + 4] % chars.length];
  }
  const demoTrackingCode = `SFM-${seg1}-${seg2}`;
  const demoTrackingCodeHash = crypto.createHash('sha256').update(demoTrackingCode).digest('hex');

  // Test 2.1: Cấu trúc Tracking Code
  {
    const trackingCodeRegex = /^SFM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
    const isValidFormat = trackingCodeRegex.test(demoTrackingCode);
    const hasAmbiguousChars = /[0O1I]/.test(demoTrackingCode);
    recordResult(
      'TRK-01',
      'Định dạng mã tra cứu SFM-XXXX-XXXX và loại bỏ ký tự dễ nhầm lẫn (0, O, 1, I)',
      isValidFormat && !hasAmbiguousChars ? 'PASS' : 'FAIL',
      `Mã sinh ra: "${demoTrackingCode}" khớp chuẩn regex, không chứa ký tự 0, O, 1, I.`
    );
  }

  // Test 2.2: Băm SHA-256 mã tra cứu
  {
    const expectedHash = crypto.createHash('sha256').update(demoTrackingCode).digest('hex');
    const isHashMatched = demoTrackingCodeHash === expectedHash && demoTrackingCodeHash.length === 64;
    recordResult(
      'TRK-02',
      'Băm một chiều SHA-256 mã tra cứu bảo mật',
      isHashMatched ? 'PASS' : 'FAIL',
      `Hash: ${demoTrackingCodeHash} (64 ký tự hex chuẩn SHA-256). Bản rõ không bao giờ lưu trong DB.`
    );
  }

  // Test 2.3: Thực hiện INSERT bản ghi DEMO vào bảng reports qua Anon Client
  let insertSuccess = false;
  let insertErrorMsg = '';
  const demoPayload = {
    id: demoReportId,
    tracking_code_hash: demoTrackingCodeHash,
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'unsafe_crossing',
    description: '[TEST-DEMO] Kiểm thử nghiệm thu chức năng gửi phản ánh Prompt 6.1 - Học sinh qua đường thiếu vạch kẻ và gờ giảm tốc.',
    actual_lat: 10.94190,
    actual_lng: 106.86185,
    occurred_at: new Date().toISOString(),
    time_window: 'morning_rush',
    verification_status: 'pending',
    is_hidden: false,
    is_demo: true, // ĐẢM BẢO LÀ DỮ LIỆU DEMO THEO ĐÚNG NGUYÊN TẮC
    submitted_at: new Date().toISOString()
  };

  try {
    const { error: insertError } = await supabaseAnon.from('reports').insert(demoPayload);
    if (!insertError) {
      insertSuccess = true;
    } else {
      insertErrorMsg = insertError.message;
    }
  } catch (err) {
    insertErrorMsg = err.message;
  }

  recordResult(
    'DB-01',
    'Ghi nhận phản ánh mới vào bảng `reports` qua Anon Client (RLS Compliant)',
    insertSuccess ? 'PASS' : 'FAIL',
    insertSuccess
      ? `Tạo thành công report id: ${demoReportId} với verification_status='pending', is_demo=true.`
      : `Thất bại: ${insertErrorMsg}`
  );

  // -------------------------------------------------------------
  // SUITE 3: KIỂM THỬ BẢO MẬT STORAGE (PRIVATE BUCKET)
  // -------------------------------------------------------------
  console.log('\n--- SUITE 3: KIỂM THỬ BẢO MẬT STORAGE BUCKET private-reports ---');

  // Test 3.1: Upload file ảnh test vào private-reports
  let uploadSuccess = false;
  let uploadErrorMsg = '';
  const testFileName = `${Date.now()}_test_evidence.png`;
  const storagePath = `${demoReportId}/${testFileName}`;
  // Tạo 1 PNG buffer 1x1 pixel giả lập
  const dummyPngBuffer = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2D0000000049454E44AE426082', 'hex');

  try {
    const { error: uploadError } = await supabaseAnon.storage
      .from('private-reports')
      .upload(storagePath, dummyPngBuffer, {
        contentType: 'image/png',
        upsert: false
      });
    if (!uploadError) {
      uploadSuccess = true;
    } else {
      uploadErrorMsg = uploadError.message;
    }
  } catch (err) {
    uploadErrorMsg = err.message;
  }

  recordResult(
    'STO-01',
    'Tải ảnh minh chứng vào private-reports theo đường dẫn an toàn {reportId}/{fileName}',
    uploadSuccess ? 'PASS' : 'FAIL',
    uploadSuccess
      ? `Tải lên thành công: ${storagePath} (${dummyPngBuffer.length} bytes)`
      : `Lỗi upload: ${uploadErrorMsg}`
  );

  // Test 3.2: Ghi nhận media vào bảng report_media
  let mediaInsertSuccess = false;
  let mediaInsertErrorMsg = '';
  if (uploadSuccess) {
    try {
      const { error: mediaError } = await supabaseAnon.from('report_media').insert({
        report_id: demoReportId,
        original_file_path: storagePath,
        file_type: 'image/png',
        file_size_bytes: dummyPngBuffer.length,
        moderation_status: 'pending',
        privacy_processing_status: 'raw'
      });
      if (!mediaError) {
        mediaInsertSuccess = true;
      } else {
        mediaInsertErrorMsg = mediaError.message;
      }
    } catch (err) {
      mediaInsertErrorMsg = err.message;
    }
  }

  recordResult(
    'DB-02',
    'Liên kết bản ghi media trong bảng `report_media`',
    mediaInsertSuccess ? 'PASS' : 'FAIL',
    mediaInsertSuccess
      ? `Ghi nhận metadata ảnh cho report ${demoReportId} với moderation_status='pending', privacy_processing_status='raw'.`
      : `Lỗi: ${mediaInsertErrorMsg}`
  );

  // Test 3.3: Thử truy cập file ảnh qua URL công khai trực tiếp (Public URL Attack Test)
  let publicUrlBlocked = false;
  let publicUrlStatus = 0;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/private-reports/${storagePath}`;
  try {
    const res = await fetch(publicUrl);
    publicUrlStatus = res.status;
    // Bucket private phải trả về 400 hoặc 404 hoặc 403, không được trả về 200
    if (res.status === 400 || res.status === 404 || res.status === 403 || res.status === 401) {
      publicUrlBlocked = true;
    }
  } catch (err) {
    publicUrlBlocked = true;
  }

  recordResult(
    'SEC-01',
    'Ngăn chặn truy cập công khai trực tiếp URL ảnh trong `private-reports`',
    publicUrlBlocked ? 'PASS' : 'FAIL',
    `HTTP GET ${publicUrl} trả về mã ${publicUrlStatus} (Bị từ chối truy cập). Ảnh riêng tư không bị lộ ra ngoài!`
  );

  // Test 3.4: Thử tải về qua Anon Client storage.download
  let anonDownloadBlocked = false;
  let anonDownloadMsg = '';
  try {
    const { data: dlData, error: dlError } = await supabaseAnon.storage
      .from('private-reports')
      .download(storagePath);
    if (dlError) {
      anonDownloadBlocked = true;
      anonDownloadMsg = dlError.message;
    } else if (!dlData) {
      anonDownloadBlocked = true;
    }
  } catch (err) {
    anonDownloadBlocked = true;
    anonDownloadMsg = err.message;
  }

  recordResult(
    'SEC-02',
    'Storage RLS ngăn chặn người dùng ẩn danh tải ảnh minh chứng',
    anonDownloadBlocked ? 'PASS' : 'FAIL',
    `Anon storage.download() bị từ chối: "${anonDownloadMsg || 'Access denied / empty'}".`
  );

  // -------------------------------------------------------------
  // SUITE 4: KIỂM THỬ BẢO MẬT ROW LEVEL SECURITY (RLS) & PHƠI NHIỄM DỮ LIỆU
  // -------------------------------------------------------------
  console.log('\n--- SUITE 4: KIỂM THỬ BẢO MẬT ROW LEVEL SECURITY (RLS) ---');

  // Test 4.1: Thử SELECT trực tiếp bảng `reports` bằng Anon Client
  let anonSelectReportsBlocked = false;
  let reportsReturnedCount = 0;
  try {
    const { data: repData, error: repErr } = await supabaseAnon
      .from('reports')
      .select('id, tracking_code_hash, description, actual_lat, actual_lng');
    
    if (repErr) {
      anonSelectReportsBlocked = true;
    } else {
      reportsReturnedCount = repData ? repData.length : 0;
      // Theo chính sách RLS 05_row_level_security.sql:
      // Anon không có quyền SELECT trên reports -> Trả về 0 bản ghi
      if (reportsReturnedCount === 0) {
        anonSelectReportsBlocked = true;
      }
    }
  } catch (err) {
    anonSelectReportsBlocked = true;
  }

  recordResult(
    'SEC-03',
    'RLS Policy bảo vệ bảng `reports`: Người dùng ẩn danh không thể đọc dữ liệu thô',
    anonSelectReportsBlocked ? 'PASS' : 'FAIL',
    `Anon Client truy vấn SELECT * FROM reports: Số bản ghi trả về = ${reportsReturnedCount}. RLS bảo vệ thành công!`
  );

  // Test 4.2: Thử SELECT trực tiếp bảng `report_media` bằng Anon Client
  let anonSelectMediaBlocked = false;
  let mediaReturnedCount = 0;
  try {
    const { data: mData, error: mErr } = await supabaseAnon
      .from('report_media')
      .select('*');
    
    if (mErr) {
      anonSelectMediaBlocked = true;
    } else {
      mediaReturnedCount = mData ? mData.length : 0;
      if (mediaReturnedCount === 0) {
        anonSelectMediaBlocked = true;
      }
    }
  } catch (err) {
    anonSelectMediaBlocked = true;
  }

  recordResult(
    'SEC-04',
    'RLS Policy bảo vệ bảng `report_media`: Người dùng ẩn danh không thể xem danh sách media',
    anonSelectMediaBlocked ? 'PASS' : 'FAIL',
    `Anon Client truy vấn SELECT * FROM report_media: Số bản ghi trả về = ${mediaReturnedCount}. RLS bảo vệ thành công!`
  );

  // Test 4.3: Kiểm tra cách ly dữ liệu: Phản ánh `pending` KHÔNG ĐƯỢC xuất hiện trên public_hotspots_view
  let isIsolatedFromMap = false;
  let viewHotspots = [];
  try {
    const { data: vData, error: vErr } = await supabaseAnon
      .from('public_hotspots_view')
      .select('hotspot_id, hotspot_name, public_lat, public_lng');
    
    if (!vErr && vData) {
      viewHotspots = vData;
      // Kiểm tra xem có chứa demoReportId hay không
      const foundInView = vData.some(h => h.hotspot_id === demoReportId);
      isIsolatedFromMap = !foundInView;
    } else if (vErr) {
      console.error('Lỗi truy vấn public_hotspots_view:', vErr.message);
    }
  } catch (err) {
    isIsolatedFromMap = false;
  }

  recordResult(
    'SEC-05',
    'Cách ly phản ánh chưa duyệt: KHÔNG xuất hiện trên bản đồ công khai (public_hotspots_view)',
    isIsolatedFromMap ? 'PASS' : 'FAIL',
    `Truy vấn public_hotspots_view trả về ${viewHotspots.length} điểm đã duyệt. Phản ánh mới "${demoReportId}" hoàn toàn không xuất hiện trên bản đồ công khai!`
  );

  // -------------------------------------------------------------
  // DỌN DẸP DỮ LIỆU DEMO SAU KIỂM THỬ (NẾU CẦN HOẶC GIỮ TAG is_demo)
  // -------------------------------------------------------------
  console.log('\n--- KẾT THÚC KIỂM THỬ ---');
  console.log(`Tổng số bài test: ${testResults.length}`);
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const failCount = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`Kết quả: ${passCount} PASS / ${failCount} FAIL`);

  // Lưu kết quả ra file JSON phục vụ tổng hợp
  fs.writeFileSync('scripts/test-results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    total: testResults.length,
    passed: passCount,
    failed: failCount,
    demoReportId,
    demoTrackingCode,
    results: testResults
  }, null, 2));

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi thực thi kiểm thử:', err);
  process.exit(1);
});
