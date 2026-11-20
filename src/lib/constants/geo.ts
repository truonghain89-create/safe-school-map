/**
 * SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
 * Hằng số địa lý & Cấu hình bản đồ Biên Hòa và Trường THPT Tam Hiệp
 */

// 1. Tọa độ trung tâm và khung giới hạn thành phố Biên Hòa cũ (Theo OSM Relation 7154127)
export const BIEN_HOA_GEO = {
  // Tâm bản đồ Biên Hòa bao quát
  center: {
    lat: 10.950,
    lng: 106.840,
  },
  // Khung giới hạn Bounding Box chính thức (MinLat, MinLng, MaxLat, MaxLng)
  bbox: {
    south: 10.83,
    west: 106.77,
    north: 11.02,
    east: 106.98,
  },
  defaultZoom: 12,
  minZoom: 11,
  maxZoom: 18,
  relationId: '7154127',
  relationSource: 'OpenStreetMap Administrative Boundary Level 6',
};

// 2. Thông tin trường trọng tâm: Trường THPT Tam Hiệp, Đồng Nai
export const TAM_HIEP_SCHOOL_GEO = {
  id: 'school-tam-hiep-pilot',
  name: 'Trường THPT Tam Hiệp',
  address: 'Khu phố 4, đường Phạm Văn Thuận, phường Tam Hiệp, TP. Biên Hòa (cũ), Đồng Nai',
  coordinates: {
    lat: 10.9415,
    lng: 106.86138,
  },
  detailZoom: 16,
  verificationSource: 'Dữ liệu OpenStreetMap / Wikimapia / Địa danh trường học Đồng Nai',
  status: 'pilot' as const,
  // Trạng thái công khai bản đồ: chờ quyết định chính thức từ ban giám hiệu
  publicMapApproved: false,
};

// 3. Cấu hình Tile Server OpenStreetMap & Máy chủ dự phòng đa tầng
// Lưu ý kỹ thuật: Tên miền tile.openstreetmap.org bị nhiễm độc/chặn DNS tại một số nhà mạng VN (Viettel/VNPT)
// Sử dụng máy chủ OpenStreetMap chính thức (khu vực hóa qua CDN châu Âu/quốc tế) & Carto Voyager (OpenStreetMap Data) để đảm bảo 100% hiển thị
export const OSM_TILE_CONFIG = {
  url: process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | SAFE SCHOOL MAP',
  subdomains: ['a', 'b', 'c'],
  maxZoom: 19,
  minZoom: 11,
  // Các máy chủ dự phòng đạt chuẩn OpenStreetMap
  cartoVoyagerUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  osmDeUrl: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
};
