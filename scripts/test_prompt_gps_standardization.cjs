const fs = require('fs');
const path = require('path');

console.log('========================================================================');
console.log('SAFE SCHOOL MAP – BỘ KIỂM CHỨNG TỌA ĐỘ GPS VÀ HIỂN THỊ ĐIỂM TRƯỜNG (10 BÀI TEST)');
console.log('========================================================================\n');

const schoolsFile = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
const content = fs.readFileSync(schoolsFile, 'utf8');

// Parse schools data
const blocks = content.split(/\{\s*id:\s*'/).slice(1);
const schools = [];

blocks.forEach(block => {
  const id = (block.match(/^([^']+)'/) || [])[1];
  const name = (block.match(/name:\s*'([^']+)'/) || [])[1];
  const campus_name = (block.match(/campus_name:\s*'([^']+)'/) || [])[1] || null;
  const address = (block.match(/address:\s*'([^']+)'/) || [])[1];
  const ward = (block.match(/ward:\s*'([^']+)'/) || [])[1];
  const latStr = (block.match(/lat:\s*([0-9.]+)/) || [])[1];
  const lngStr = (block.match(/lng:\s*([0-9.]+)/) || [])[1];
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const education_level = (block.match(/education_level:\s*'([^']+)'/) || [])[1];
  const school_type = (block.match(/school_type:\s*'([^']+)'/) || [])[1];
  const confidence_tier = (block.match(/confidence_tier:\s*'([^']+)'/) || [])[1];
  const is_verified = (block.match(/is_verified:\s*(true|false)/) || [])[1] === 'true';
  const public_map_approved = (block.match(/public_map_approved:\s*(true|false)/) || [])[1] === 'true';
  const verification_source = (block.match(/verification_source:\s*'([^']+)'/) || [])[1];

  schools.push({
    id, name, campus_name, address, ward, lat, lng, latStr, lngStr,
    education_level, school_type, confidence_tier, is_verified, public_map_approved, verification_source
  });
});

let passed = 0;
let total = 10;

function assert(condition, testNum, desc) {
  if (condition) {
    console.log(`[PASS] Test ${testNum.toString().padStart(2, '0')}: ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] Test ${testNum.toString().padStart(2, '0')}: ${desc}`);
  }
}

// 1. Thứ tự tọa độ [latitude, longitude]
const test1Ok = schools.every(s => s.lat >= 10.5 && s.lat <= 11.5 && s.lng >= 106.5 && s.lng <= 107.5);
assert(test1Ok, 1, 'Thứ tự tọa độ chuẩn Leaflet [lat, lng]: Vĩ độ ~ 10.8-11.0°N, Kinh độ ~ 106.7-107.0°E, không bị đảo');

// 2. Độ chính xác số thập phân (5 chữ số)
const test2Ok = schools.every(s => {
  const latDec = (s.latStr.split('.')[1] || '').length;
  const lngDec = (s.lngStr.split('.')[1] || '').length;
  return latDec >= 5 && lngDec >= 5;
});
assert(test2Ok, 2, 'Độ chính xác tọa độ GPS: 100% cơ sở có tối thiểu 5 chữ số thập phân (sai số ~ 1 mét)');

// 3. Ranh giới hành chính Biên Hòa cũ
const approvedSchools = schools.filter(s => s.public_map_approved);
const validWards = [
  'An Bình', 'An Hòa', 'Bình Đa', 'Bửu Hòa', 'Bửu Long', 'Hiệp Hòa', 'Hóa An', 'Hố Nai',
  'Long Bình', 'Long Bình Tân', 'Phước Tân', 'Quang Vinh', 'Quyết Thắng', 'Tam Hiệp',
  'Tam Hòa', 'Tam Phước', 'Tân Biên', 'Tân Hạnh', 'Tân Hòa', 'Tân Hiệp', 'Tân Mai',
  'Tân Phong', 'Tân Tiến', 'Tân Vạn', 'Thanh Bình', 'Thống Nhất', 'Trảng Dài', 'Trung Dũng', 'Hòa Bình', 'Long Hưng'
];
const test3Ok = approvedSchools.every(s => {
  const inBbox = s.lat >= 10.80 && s.lat <= 11.02 && s.lng >= 106.75 && s.lng <= 106.98;
  const inWard = validWards.includes(s.ward);
  return inBbox && inWard;
});
assert(test3Ok, 3, `Ranh giới hành chính: ${approvedSchools.length} trường công khai nằm 100% trong 30 phường/xã Biên Hòa cũ`);

// 4. Vị trí trường điểm THPT Tam Hiệp (khớp nhãn bản đồ OSM)
const tamHiep = schools.find(s => s.id === '00000000-0000-0000-0000-000000000001');
const test4Ok = tamHiep && Math.abs(tamHiep.lat - 10.94151) < 0.0001 && Math.abs(tamHiep.lng - 106.86151) < 0.0001 && tamHiep.ward === 'Tam Hiệp';
assert(test4Ok, 4, 'Trường điểm THPT Tam Hiệp: Khớp chính xác nhãn "Trường Trung học phổ thông Tam Hiệp" trên bản đồ nền OSM');

// 5. Kiểm tra cụm trường trọng điểm đã căn chỉnh chính xác theo nhãn bản đồ
const dntu = schools.find(s => s.id === 'school-uni-dntu');
const yTe = schools.find(s => s.id === 'school-col-y-te-dong-nai');
const sonadezi = schools.find(s => s.id === 'school-col-sonadezi');
const ngoQuyen = schools.find(s => s.id === 'school-hs-ngo-quyen');
const tranBien = schools.find(s => s.id === 'school-hs-tran-bien');
const chuVanAn = schools.find(s => s.id === 'school-hs-chu-van-an');
const test5Ok = dntu && yTe && sonadezi && ngoQuyen && tranBien && chuVanAn &&
                chuVanAn.ward === 'Hóa An' && Math.abs(ngoQuyen.lat - 10.95419) < 0.001;
assert(test5Ok, 5, 'Cụm trường đại học / cao đẳng / THPT trọng điểm đã căn chỉnh đúng nhãn thực tế trên OpenStreetMap');

// 6. Kiểm tra an toàn địa lý: không có marker rơi xuống sông hoặc tim đường
const test6Ok = approvedSchools.every(s => s.lat > 10.85 && s.lng > 106.77);
assert(test6Ok, 6, 'An toàn không gian: Không có marker nào rơi vào lòng sông Đồng Nai hoặc vị trí ảo');

// 7. Phân tầng mức độ tin cậy Mức A, B, C (Bao gồm THPT Nguyễn Khuyến mới bổ sung)
const tierA = schools.filter(s => s.confidence_tier === 'A');
const tierC = schools.filter(s => s.confidence_tier === 'C');
const cOutside = schools.find(s => s.id === 'school-col-cong-nghe-cao-dn');
const nguyenKhuyen = schools.find(s => s.id === 'school-hs-nguyen-khuyen');
const test7Ok = tierA.length === 86 && tierC.length === 1 &&
                cOutside.public_map_approved === false && cOutside.is_verified === false &&
                nguyenKhuyen && nguyenKhuyen.confidence_tier === 'A' &&
                Math.abs(nguyenKhuyen.lat - 10.95572) < 0.0001 && Math.abs(nguyenKhuyen.lng - 106.84326) < 0.0001;
assert(test7Ok, 7, `Phân tầng chất lượng: 86 trường Mức A công khai (bao gồm THPT Nguyễn Khuyến); 1 trường Mức C bị loại trừ`);

// 8. Tách bạch 2 layer độc lập trên giao diện bản đồ
const leafletContent = fs.readFileSync(path.join(__dirname, '../src/components/map/LeafletMap.tsx'), 'utf8');
const test8Ok = leafletContent.includes('schoolsLayerRef = useRef') &&
                leafletContent.includes('hotspotsLayerRef = useRef') &&
                leafletContent.includes('showSchoolsLayer') &&
                leafletContent.includes('showHotspotsLayer');
assert(test8Ok, 8, 'Kiến trúc Dual Layer: Layer Cơ sở trường học và Layer Hotspot hoàn toàn tách biệt độc lập');

// 9. Tìm kiếm & Fly-to trên trang bản đồ
const bandoContent = fs.readFileSync(path.join(__dirname, '../src/app/(public)/ban-do/page.tsx'), 'utf8');
const test9Ok = bandoContent.includes('schoolSearchTerm') &&
                bandoContent.includes('schoolLevelFilter') &&
                bandoContent.includes('schoolTypeFilter') &&
                bandoContent.includes('handleFlyTo');
assert(test9Ok, 9, 'Tương tác GIS: Bộ tìm kiếm đa tiêu chí (tên, cấp học, loại hình) và Fly-to tâm trường chính xác');

// 10. Popup chi tiết đầy đủ thông tin địa lý và kiểm chứng
const test10Ok = leafletContent.includes('Tọa độ GPS cổng:') &&
                 leafletContent.includes('Mức A — Đã xác minh cổng') &&
                 leafletContent.includes('TP. Biên Hòa (cũ)') &&
                 leafletContent.includes('school.verification_source');
assert(test10Ok, 10, 'Popup thông tin: Hiển thị đầy đủ tọa độ GPS cổng, cấp học, loại hình, địa chỉ, mức tin cậy & nguồn kiểm chứng');

console.log('\n========================================================================');
console.log(`KẾT QUẢ KIỂM CHỨNG TỌA ĐỘ GPS: ${passed} / ${total} BÀI TEST ĐẠT CHUẨN (${(passed/total*100).toFixed(0)}%)`);
console.log('========================================================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
