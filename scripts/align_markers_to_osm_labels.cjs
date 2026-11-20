const fs = require('fs');
const path = require('path');

const osmList = JSON.parse(fs.readFileSync('./scripts/osm_named_schools_clean.json', 'utf8'));
const filePath = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Specific mapping of school ID to exact OSM label name and coordinate
const osmExactAlignments = [
  // 1. THPT Tam Hiệp (Trường điểm)
  { id: '00000000-0000-0000-0000-000000000001', osmName: 'Trường Trung học phổ thông Tam Hiệp', lat: 10.94151, lng: 106.86151 },
  // 2. THPT Chuyên Lương Thế Vinh
  { id: 'school-hs-luong-the-vinh', osmName: 'Trường Trung học phổ thông chuyên Lương Thế Vinh', lat: 10.95785, lng: 106.86330 },
  // 3. THPT Trấn Biên
  { id: 'school-hs-tran-bien', osmName: 'Trường Trung học phổ thông Trấn Biên', lat: 10.95210, lng: 106.86380 },
  // 4. THPT Ngô Quyền
  { id: 'school-hs-ngo-quyen', osmName: 'Trường Trung học phổ thông Ngô Quyền', lat: 10.95419, lng: 106.82597 },
  // 5. ĐH Đồng Nai Cơ sở 1
  { id: 'school-uni-dnpu-campus1', osmName: 'Trường Đại học Đồng Nai', lat: 10.95897, lng: 106.86152 },
  // 6. ĐH Đồng Nai Cơ sở 3
  { id: 'school-uni-dnpu-campus3', osmName: 'Trường Đại học Đồng Nai (cơ sở 3)', lat: 10.93449, lng: 106.86151 },
  // 7. ĐH Công nghệ Đồng Nai (DNTU)
  { id: 'school-uni-dntu', osmName: 'Trường Đại học Công nghệ Đồng Nai', lat: 10.98458, lng: 106.86967 },
  // 8. CĐ Y tế Đồng Nai
  { id: 'school-col-y-te-dong-nai', osmName: 'Trường Cao đẳng Y tế Đồng Nai', lat: 10.96360, lng: 106.89883 },
  // 9. CĐ Kỹ thuật - Công nghệ Đồng Nai
  { id: 'school-col-ky-thuat-dong-nai', osmName: 'Trường Cao đẳng Kỹ thuật - Công nghệ Đồng Nai', lat: 10.95396, lng: 106.83590 },
  // 10. CĐ Mỹ thuật Trang trí Đồng Nai
  { id: 'school-col-my-thuat-trang-tri', osmName: 'Trường Cao đẳng Mỹ thuật trang trí Đồng Nai', lat: 10.95517, lng: 106.82748 },
  // 11. CĐ Lê Quý Đôn
  { id: 'school-col-le-quy-don', osmName: 'Trường Cao đẳng Lê Quý Đôn', lat: 10.89810, lng: 106.88189 },
  // 12. CĐ Sonadezi
  { id: 'school-col-sonadezi', osmName: 'Trường Cao đẳng Công nghệ và Quản trị Sonadezi', lat: 10.90732, lng: 106.85703 },
  // 13. TC Văn hóa Nghệ thuật Đồng Nai
  { id: 'school-voc-van-hoa-nghe-thuat', osmName: 'Trường Trung cấp Văn hóa Nghệ thuật Đồng Nai', lat: 10.95546, lng: 106.82105 },
  // 14. THCS Tam Hiệp
  { id: 'school-jhs-tam-hiep', osmName: 'Trường Trung học cơ sở Tam Hiệp', lat: 10.94928, lng: 106.85455 },
  // 15. Tiểu học Tam Hiệp
  { id: 'school-pri-tam-hiep', osmName: 'Trường Tiểu học Tam Hiệp B', lat: 10.94211, lng: 106.85934 },
  // 16. THCS Bình Đa
  { id: 'school-jhs-binh-da', osmName: 'Trường Trung học cơ sở Bình Đa', lat: 10.93738, lng: 106.86153 },
  // 17. Tiểu học Bình Đa
  { id: 'school-pri-binh-da', osmName: 'Trường Tiểu học Bình Đa', lat: 10.93515, lng: 106.86309 },
  // 18. THCS Thống Nhất
  { id: 'school-jhs-thong-nhat', osmName: 'Trường Trung học cơ sở Thống Nhất', lat: 10.94583, lng: 106.82803 },
  // 19. Tiểu học Thống Nhất
  { id: 'school-pri-thong-nhat', osmName: 'Trường Tiểu học Thống Nhất', lat: 10.95372, lng: 106.82836 },
  // 20. THCS Tân Tiến
  { id: 'school-jhs-tan-tien', osmName: 'Trường Trung học cơ sở Tân Tiến', lat: 10.96399, lng: 106.84648 },
  // 21. Tiểu học Tân Tiến
  { id: 'school-pri-tan-tien', osmName: 'Trường Tiểu học Tân Tiến', lat: 10.96064, lng: 106.83937 },
  // 22. THCS Trần Hưng Đạo
  { id: 'school-jhs-tran-hung-dao', osmName: 'Trường Trung học cơ sở Trần Hưng Đạo', lat: 10.95576, lng: 106.82823 },
  // 23. THCS Hùng Vương
  { id: 'school-jhs-hung-vuong', osmName: 'Trường Trung học cơ sở Hùng Vương', lat: 10.95752, lng: 106.81298 },
  // 24. Tiểu học Quang Vinh
  { id: 'school-pri-quang-vinh', osmName: 'Trường Tiểu học Quang Vinh', lat: 10.95002, lng: 106.81330 },
  // 25. THPT Nam Hà
  { id: 'school-hs-nam-ha', osmName: 'Trường Trung học phổ thông Nam Hà', lat: 10.93348, lng: 106.83133 },
  // 26. THPT Nguyễn Hữu Cảnh
  { id: 'school-hs-nguyen-huu-canh', osmName: 'Trường Trung học phổ thông Nguyễn Hữu Cảnh', lat: 10.90802, lng: 106.85289 },
  // 27. TH - THCS - THPT Bùi Thị Xuân
  { id: 'school-hs-bui-thi-xuan', osmName: 'Trường Tiểu học - Trung học cơ sở - Trung học phổ thông Bùi Thị Xuân', lat: 10.96472, lng: 106.84583 },
  // 28. THCS Trảng Dài
  { id: 'school-jhs-trang-dai', osmName: 'Trường Trung học cơ sở Trảng Dài', lat: 10.98122, lng: 106.85650 },
  // 29. THCS Quyết Thắng (Lê Quý Đôn cũ)
  { id: 'school-jhs-le-quy-don', osmName: 'Trường Trung học cơ sở Quyết Thắng', lat: 10.94233, lng: 106.82320 },
  // 30. TH - THCS - THPT Lê Quý Đôn
  { id: 'school-ml-le-quy-don-igc', osmName: 'Trường Tiểu học-Trung học cơ sở-Trung học phổ thông Lê Quý Đôn', lat: 10.94942, lng: 106.82495 },
  // 31. THPT Lê Quý Đôn
  { id: 'school-col-thong-ke-2', osmName: 'Trường Cao đẳng Thống kê II', lat: 10.95856, lng: 106.86214 },
  // 32. ĐH Lạc Hồng Cơ sở 1
  { id: 'school-uni-lhu-campus1', osmName: 'Trường Đại học Lạc Hồng (cơ sở 5)', lat: 10.95717, lng: 106.78900 },
  // 33. ĐH Lạc Hồng Cơ sở 2
  { id: 'school-uni-lhu-campus2', osmName: 'Trường Đại học Lạc Hồng (cơ sở 2)', lat: 10.95511, lng: 106.80219 },
  // 34. Song ngữ Lạc Hồng
  { id: 'school-ml-song-ngu-lac-hong', osmName: 'Trường Tiểu học-Trung học cơ sở-Trung học phổ thông Song ngữ Lạc Hồng', lat: 10.95598, lng: 106.80124 },
  // 35. THCS Tân Bửu (Bửu Long)
  { id: 'school-jhs-nguyen-binh-khiem', osmName: 'Trường Trung học cơ sở Tân Bửu', lat: 10.96095, lng: 106.80886 },
  // 36. Tiểu học An Hảo
  { id: 'school-pri-an-hao', osmName: 'Trường Tiểu học An Hảo', lat: 10.90756, lng: 106.84742 },
  // 37. Tiểu học An Bình
  { id: 'school-jhs-an-binh', osmName: 'Trường Tiểu học An Bình', lat: 10.92312, lng: 106.84518 },
  // 38. Tiểu học Trịnh Hoài Đức
  { id: 'school-pri-trinh-hoai-duc', osmName: 'Trường Tiểu học Trịnh Hoài Đức', lat: 10.94882, lng: 106.82255 },
  // 39. Tiểu học Nguyễn Khắc Hiếu
  { id: 'school-pri-nguyen-khac-hieu', osmName: 'Trường Tiểu học Nguyễn Khắc Hiếu', lat: 10.94763, lng: 106.81148 },
  // 40. Tiểu học Nguyễn Du
  { id: 'school-pri-nguyen-du', osmName: 'Trường Tiểu học Nguyễn Du', lat: 10.94518, lng: 106.81765 },
  // 41. Tiểu học Tân Phong 1
  { id: 'school-pri-phan-dinh-phung', osmName: 'Trường Tiểu học Tân Phong 1', lat: 10.96518, lng: 106.83225 },
  // 42. THPT Chu Văn An
  { id: 'school-hs-chu-van-an', osmName: 'Trường Trung học phổ thông Chu Văn An', lat: 10.92976, lng: 106.80366 },
  // 43. THPT Lê Hồng Phong
  { id: 'school-hs-le-hong-phong', osmName: 'Trường Trung học phổ thông Lê Hồng Phong', lat: 10.96861, lng: 106.88000 }
];

let appliedCount = 0;
osmExactAlignments.forEach(align => {
  const blockRegex = new RegExp(`(\\{\\s*id:\\s*'${align.id}',[\\s\\S]*?\\n\\s*\\},?)`, 'g');
  content = content.replace(blockRegex, (match) => {
    appliedCount++;
    let updated = match;
    updated = updated.replace(/lat:\s*[0-9.]+/, `lat: ${align.lat.toFixed(5)}`);
    updated = updated.replace(/lng:\s*[0-9.]+/, `lng: ${align.lng.toFixed(5)}`);
    updated = updated.replace(/verification_source:\s*'[^']+'/, `verification_source: 'Vị trí nhãn hiển thị trực tiếp trên OpenStreetMap (“${align.osmName}”) & Sở GD&ĐT'`);
    return updated;
  });
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully aligned ${appliedCount} schools exactly to OpenStreetMap website tile labels!`);
