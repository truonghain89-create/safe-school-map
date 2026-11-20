const fs = require('fs');
const path = require('path');

// 1. Update schools-bien-hoa.ts
const schoolsPath = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
let schoolsContent = fs.readFileSync(schoolsPath, 'utf8');

// School definition for THPT Nguyen Khuyen
const nguyenKhuyenEntry = `  {
    id: 'school-hs-nguyen-khuyen',
    name: 'Trường THPT Nguyễn Khuyến',
    address: 'Số 314/16A, Hẻm 1261 Đường Phạm Văn Thuận, Phường Thống Nhất, TP. Biên Hòa (cũ), Tỉnh Đồng Nai',
    ward: 'Thống Nhất',
    lat: 10.95572,
    lng: 106.84326,
    education_level: 'high_school',
    school_type: 'private',
    status: 'active',
    public_map_approved: true,
    confidence_tier: 'A',
    is_verified: true,
    verification_source: 'Vị trí nhãn hiển thị trực tiếp trên OpenStreetMap (“Trường Trung học phổ thông Nguyễn Khuyến”, Hẻm 1261 Phạm Văn Thuận) & Sở GD&ĐT',
    website: 'http://thpt.nguyenkhuyen.edu.vn/',
    created_at: '2026-01-01T00:00:00Z',
  },
`;

// Insert before school-hs-luong-the-vinh or in THPT section if not already present
if (!schoolsContent.includes('school-hs-nguyen-khuyen')) {
  const insertMarker = "    id: 'school-hs-luong-the-vinh',";
  schoolsContent = schoolsContent.replace(insertMarker, nguyenKhuyenEntry + "  {\n" + insertMarker);
  console.log('Added Trường THPT Nguyễn Khuyến to schools-bien-hoa.ts');
}

// Replace 'TP. Biên Hòa, Tỉnh Đồng Nai' with 'TP. Biên Hòa (cũ), Tỉnh Đồng Nai'
schoolsContent = schoolsContent.replace(/TP\.\s*Biên Hòa(?!\s*\(\s*cũ\s*\)),\s*Tỉnh Đồng Nai/g, 'TP. Biên Hòa (cũ), Tỉnh Đồng Nai');
schoolsContent = schoolsContent.replace(/Thành phố Biên Hòa(?!\s*\(\s*cũ\s*\)),\s*Tỉnh Đồng Nai/g, 'Thành phố Biên Hòa (cũ), Tỉnh Đồng Nai');
schoolsContent = schoolsContent.replace(/Thành phố Biên Hòa cũ/g, 'Thành phố Biên Hòa (cũ)');
schoolsContent = schoolsContent.replace(/TP\.\s*Biên Hòa cũ/g, 'TP. Biên Hòa (cũ)');

fs.writeFileSync(schoolsPath, schoolsContent, 'utf8');
console.log('Updated schools-bien-hoa.ts with TP. Biên Hòa (cũ)');

// 2. Update Header.tsx
const headerPath = path.join(__dirname, '../src/components/layout/Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');
headerContent = headerContent.replace('<span>TP. Biên Hòa</span>', '<span>TP. Biên Hòa (cũ)</span>');
fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('Updated Header.tsx');

// 3. Update Footer.tsx
const footerPath = path.join(__dirname, '../src/components/layout/Footer.tsx');
let footerContent = fs.readFileSync(footerPath, 'utf8');
footerContent = footerContent.replace('TP. Biên Hòa, Đồng Nai', 'TP. Biên Hòa (cũ), Đồng Nai');
footerContent = footerContent.replace('Thành phố Biên Hòa, Tỉnh Đồng Nai', 'Thành phố Biên Hòa (cũ), Tỉnh Đồng Nai');
footerContent = footerContent.replace('thành phố Biên Hòa cũ', 'thành phố Biên Hòa (cũ)');
fs.writeFileSync(footerPath, footerContent, 'utf8');
console.log('Updated Footer.tsx');

// 4. Update LeafletMap.tsx
const leafletPath = path.join(__dirname, '../src/components/map/LeafletMap.tsx');
let leafletContent = fs.readFileSync(leafletPath, 'utf8');
leafletContent = leafletContent.replace('<span>TP. Biên Hòa cũ</span>', '<span>TP. Biên Hòa (cũ)</span>');
leafletContent = leafletContent.replace('Toàn cảnh Biên Hòa</span>', 'Toàn cảnh Biên Hòa (cũ)</span>');
leafletContent = leafletContent.replace('thành phố Biên Hòa cũ', 'thành phố Biên Hòa (cũ)');
fs.writeFileSync(leafletPath, leafletContent, 'utf8');
console.log('Updated LeafletMap.tsx');

// 5. Update page.tsx (Home)
const pagePath = path.join(__dirname, '../src/app/(public)/page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');
pageContent = pageContent.replace('Trường THPT Tam Hiệp, TP. Biên Hòa', 'Trường THPT Tam Hiệp, TP. Biên Hòa (cũ)');
pageContent = pageContent.replace('Biên Hòa cũ</strong>', 'Biên Hòa (cũ)</strong>');
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('Updated page.tsx');

// 6. Update ban-do/page.tsx
const bandoPath = path.join(__dirname, '../src/app/(public)/ban-do/page.tsx');
let bandoContent = fs.readFileSync(bandoPath, 'utf8');
bandoContent = bandoContent.replace('Bản đồ đa trường học TP. Biên Hòa:', 'Bản đồ đa trường học TP. Biên Hòa (cũ):');
bandoContent = bandoContent.replace('TP. Biên Hòa cũ', 'TP. Biên Hòa (cũ)');
bandoContent = bandoContent.replace('Biên Hòa cũ', 'Biên Hòa (cũ)');
fs.writeFileSync(bandoPath, bandoContent, 'utf8');
console.log('Updated ban-do/page.tsx');
