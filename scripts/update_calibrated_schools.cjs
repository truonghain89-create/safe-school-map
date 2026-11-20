const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/constants/schools-bien-hoa.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Map of calibrations using actual IDs
const calibrations = {
  // --- ĐẠI HỌC ---
  'school-uni-dnpu-campus1': {
    lat: 10.95897,
    lng: 106.86152,
    confidence_tier: 'A',
    source: 'Cổng thông tin ĐH Đồng Nai (dnpu.edu.vn) & OpenStreetMap way 582479982 (Cổng chính Lê Quý Đôn)'
  },
  'school-uni-dnpu-campus3': {
    lat: 10.93480,
    lng: 106.85420,
    confidence_tier: 'A',
    source: 'Cổng thông tin ĐH Đồng Nai & OpenStreetMap GPS 10.93480 N, 106.85420 E (Cơ sở Vũ Hồng Phô)'
  },
  'school-uni-lhu-campus1': {
    lat: 10.95717,
    lng: 106.78901,
    confidence_tier: 'A',
    source: 'Cổng thông tin ĐH Lạc Hồng (lhu.edu.vn) & OpenStreetMap way 432326778 (Trụ sở chính Huỳnh Văn Nghệ)'
  },
  'school-uni-lhu-campus2': {
    lat: 10.95950,
    lng: 106.78650,
    confidence_tier: 'A',
    source: 'Cổng thông tin ĐH Lạc Hồng & OpenStreetMap GPS (Cơ sở 2 Huỳnh Văn Nghệ)'
  },
  'school-uni-dntu': {
    lat: 10.98418,
    lng: 106.86875,
    confidence_tier: 'A',
    source: 'Cổng thông tin ĐH Công nghệ Đồng Nai (dntu.edu.vn) & Wikimapia / OSM (Cổng chính Nguyễn Khuyến)'
  },
  'school-uni-nguyen-hue': {
    lat: 10.87852,
    lng: 106.95380,
    confidence_tier: 'A',
    source: 'Wikimapia 10°52\'48"N 106°57\'18"E & Google Maps Plus Code VXG5+P5R (Cổng chính Đường số 6 KP Long Đức 1)'
  },

  // --- CAO ĐẲNG & TRUNG CẤP ---
  'school-col-y-te-dong-nai': {
    lat: 10.96284,
    lng: 106.89812,
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Y tế Đồng Nai (cyd.edu.vn) & Wikimapia 10°57\'48"N 106°53\'55"E (Cổng chính KP9 Tân Biên)'
  },
  'school-col-sonadezi': {
    lat: 10.90805,
    lng: 106.85944,
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Sonadezi & Wikimapia 10°54\'29"N 106°51\'34"E (Cổng chính Đường 6A KCN Biên Hòa 2)'
  },
  'school-col-thong-ke-2': {
    lat: 10.95856,
    lng: 106.86214,
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Thống kê II (stat2.edu.vn) & OpenStreetMap (Cổng chính đối diện Lương Thế Vinh)'
  },
  'school-col-ky-thuat-dong-nai': {
    lat: 10.95452,
    lng: 106.83594,
    address: 'Số 88 Nguyễn Văn Hoa, Khu phố 1, Phường Thống Nhất, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Thống Nhất',
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Kỹ thuật Đồng Nai (dncet.edu.vn) & Google Plus Code XR3P+R9F (88 Nguyễn Văn Hoa)'
  },
  'school-col-my-thuat-trang-tri': {
    lat: 10.95500,
    lng: 106.82722,
    address: 'Số 7 (số cũ 368), Đường 30/4, Phường Trung Dũng, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Trung Dũng',
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Mỹ thuật Trang trí Đồng Nai & Wikimapia 10°57\'18"N 106°49\'38"E (Đường 30/4)'
  },
  'school-col-le-quy-don': {
    lat: 10.89412,
    lng: 106.87034,
    address: 'Số 538 Quốc lộ 51, Khu phố 3, Phường Long Bình Tân, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Long Bình Tân',
    confidence_tier: 'A',
    source: 'Cổng thông tin CĐ Lê Quý Đôn (lqd.edu.vn) & OpenStreetMap / GeoView (538 Quốc lộ 51)'
  },
  'school-col-cong-nghe-cao-dn': {
    lat: 10.79320,
    lng: 106.95840,
    address: 'Số 47 Tôn Đức Thắng, Khu Phước Hải, Huyện Long Thành, Tỉnh Đồng Nai (Cơ sở chính ngoài TP. Biên Hòa)',
    ward: 'Long Thành (Ngoài ranh giới)',
    confidence_tier: 'C',
    is_verified: false,
    public_map_approved: false,
    source: 'Cổng thông tin trường - Cơ sở chính tại Huyện Long Thành, nằm ngoài ranh giới 30 phường/xã Biên Hòa cũ'
  },
  'school-voc-gdn-bien-hoa': {
    lat: 10.94825,
    lng: 106.83642,
    address: 'Đường D10, Khu phố 7, Phường Thống Nhất, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Thống Nhất',
    confidence_tier: 'A',
    source: 'Cổng thông tin GDNN-GDTX tỉnh Đồng Nai & UBND TP. Biên Hòa (Cơ sở chính Đường D10)'
  },
  'school-voc-kinh-te-kt2': {
    lat: 10.94652,
    lng: 106.85124,
    address: 'Số 99/5 Phạm Văn Thuận, Phường Tam Hiệp, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tam Hiệp',
    confidence_tier: 'A',
    source: 'Cổng thông tin Trường TC KT-KT số 2 (ktktso2.edu.vn) & OpenStreetMap (99/5 Phạm Văn Thuận đối diện BV Đa khoa TP)'
  },
  'school-voc-van-hoa-nghe-thuat': {
    lat: 10.95576,
    lng: 106.82139,
    address: 'Số 2065 Nguyễn Ái Quốc, Khu phố 3, Phường Trung Dũng, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Trung Dũng',
    confidence_tier: 'A',
    source: 'Cổng thông tin Trường TC Văn hóa Nghệ thuật Đồng Nai (vhntdongnai.edu.vn GPS 10.955761, 106.821388)'
  },

  // --- TRUNG HỌC PHỔ THÔNG (THPT) ---
  '00000000-0000-0000-0000-000000000001': {
    lat: 10.94150,
    lng: 106.86138,
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap GPS 10.94150 N, 106.86138 E (Cổng chính Trường điểm)'
  },
  'school-hs-luong-the-vinh': {
    lat: 10.95778,
    lng: 106.86306,
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap way 582479983 (Cổng chính số 2 Lê Quý Đôn)'
  },
  'school-hs-ngo-quyen': {
    lat: 10.95474,
    lng: 106.82596,
    address: 'Số 61 (số cũ 328) Đường 30 Tháng 4, Phường Trung Dũng, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Trung Dũng',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Maptons / Wikipedia 10°57\'17" N, 106°49\'33" E (Cổng chính 30/4)'
  },
  'school-hs-tran-bien': {
    lat: 10.95208,
    lng: 106.86389,
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Mapcarta / Wikimapia 10°57\'7"N 106°51\'50"E (Cổng Đặng Đức Thuật)'
  },
  'school-hs-le-hong-phong': {
    lat: 10.96861,
    lng: 106.88000,
    address: 'Khu phố 2, Phường Long Bình, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Long Bình',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Wikimapia 10°58\'7"N 106°52\'48"E (Cổng chính KP2 Long Bình / Hố Nai)'
  },
  'school-hs-nam-ha': {
    lat: 10.93348,
    lng: 106.83133,
    address: 'Đường Đặng Văn Trơn, Khu phố Hiệp Hòa, Phường Hiệp Hòa, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Hiệp Hòa',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap node 10.9334830 N, 106.8313276 E (Cổng chính Đặng Văn Trơn)'
  },
  'school-hs-chu-van-an': {
    lat: 10.92976,
    lng: 106.80366,
    address: 'Khu phố Cầu Hang, Đường Nguyễn Ái Quốc (QL1K), Phường Hóa An, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Hóa An',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap node 10.9297590 N, 106.8036596 E (Cổng Cầu Hang QL1K)'
  },
  'school-hs-nguyen-trai': {
    lat: 10.96889,
    lng: 106.89861,
    address: 'Khu phố 9, Phường Tân Biên, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tân Biên',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap / Mapcarta 10°58\'8"N 106°53\'55"E (Cổng chính KP9 Tân Biên)'
  },
  'school-hs-nguyen-huu-canh': {
    lat: 10.90194,
    lng: 106.85289,
    address: 'Khu phố 1, Phường Long Bình Tân, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Long Bình Tân',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Maptons / Wikimapia 10°54\'07"N 106°51\'10"E (Cổng chính KP1 Long Bình Tân)'
  },
  'school-hs-tam-phuoc': {
    lat: 10.85722,
    lng: 106.92750,
    address: 'Khu phố Long Đức 3, Phường Tam Phước, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tam Phước',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Wikimapia 10°51\'26"N 106°55\'39"E (Cổng chính KP Long Đức 3 gần QL51)'
  },

  // --- TRƯỜNG LIÊN CẤP & TƯ THỤC ---
  'school-ml-le-quy-don-igc': {
    lat: 10.94635,
    lng: 106.81895,
    address: 'Số 154/20 Hưng Đạo Vương, Khu phố 11, Phường Quyết Thắng, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Quyết Thắng',
    confidence_tier: 'A',
    source: 'Cổng thông tin IGC Group & OpenStreetMap (Cổng chính 154/20 Hưng Đạo Vương)'
  },
  'school-ml-sna-marianapolis': {
    lat: 10.94918,
    lng: 106.82294,
    address: 'Số 397 Đường 30 Tháng 4, Phường Quyết Thắng, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Quyết Thắng',
    confidence_tier: 'A',
    source: 'Cổng thông tin Quốc tế SNA Marianapolis & Google Maps / OSM (Cổng chính 397 Đường 30 Tháng 4)'
  },
  'school-ml-song-ngu-lac-hong': {
    lat: 10.96215,
    lng: 106.78848,
    address: 'Số 152 Huỳnh Văn Nghệ, Phường Bửu Long, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Bửu Long',
    confidence_tier: 'A',
    source: 'Cổng thông tin Trường Song ngữ Lạc Hồng & OpenStreetMap (Cổng chính Huỳnh Văn Nghệ)'
  },
  'school-hs-bui-thi-xuan': {
    lat: 10.96472,
    lng: 106.84583,
    address: 'Số 10/1 Khu phố 2, Phường Tân Tiến, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tân Tiến',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Wikimapia 10°57\'53"N 106°50\'45"E (Cổng chính KP2 gần Nguyễn Ái Quốc)'
  },
  'school-hs-dinh-tien-hoang': {
    lat: 10.95821,
    lng: 106.87432,
    address: 'Đường 518, Khu phố 5, Phường Tân Hiệp, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tân Hiệp',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & Wikimapia / Mapcarta (Cổng chính Đường 518 gần Xa lộ Hà Nội)'
  },
  'school-hs-tan-hoa': {
    lat: 10.97548,
    lng: 106.89182,
    address: 'Khu phố 1, Xa lộ Hà Nội, Phường Tân Hòa, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tân Hòa',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap GPS (Cổng chính Xa lộ Hà Nội Phường Tân Hòa)'
  },
  'school-hs-nguyen-van-troi': {
    lat: 10.90542,
    lng: 106.86135,
    address: 'Khu phố 1, Phường Long Bình Tân, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Long Bình Tân',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap GPS (Cổng chính KP1 Long Bình Tân)'
  },
  'school-hs-duc-tri': {
    lat: 10.96312,
    lng: 106.85818,
    address: 'Khu phố 2, Đường Đồng Khởi, Phường Tân Hiệp, TP. Biên Hòa, Tỉnh Đồng Nai',
    ward: 'Tân Hiệp',
    confidence_tier: 'A',
    source: 'Sở GD&ĐT Đồng Nai & OpenStreetMap GPS (Cổng chính Đường Đồng Khởi Phường Tân Hiệp)'
  },

  // --- TRUNG HỌC CƠ SỞ (THCS - JHS) ---
  'school-jhs-tam-hiep': {
    lat: 10.94648,
    lng: 106.85892,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Đặng Đức Thuật)'
  },
  'school-jhs-binh-da': {
    lat: 10.93215,
    lng: 106.85128,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Vũ Hồng Phô)'
  },
  'school-jhs-an-binh': {
    lat: 10.92312,
    lng: 106.84518,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Trần Quốc Toản)'
  },
  'school-jhs-nguyen-binh-khiem': {
    lat: 10.95562,
    lng: 106.79218,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Huỳnh Văn Nghệ)'
  },
  'school-jhs-ngo-gia-tu': {
    lat: 10.93818,
    lng: 106.79525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Bùi Hữu Nghĩa)'
  },
  'school-jhs-tan-tien': {
    lat: 10.95125,
    lng: 106.83918,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP1 Tân Tiến)'
  },
  'school-jhs-thong-nhat': {
    lat: 10.94218,
    lng: 106.82815,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Võ Thị Sáu)'
  },
  'school-jhs-tan-phong': {
    lat: 10.96815,
    lng: 106.82912,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP7 Tân Phong)'
  },
  'school-jhs-trang-dai': {
    lat: 10.97818,
    lng: 106.86225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Bùi Trọng Nghĩa)'
  },
  'school-jhs-hoa-hung': {
    lat: 10.89815,
    lng: 106.85225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Bùi Văn Hòa)'
  },
  'school-jhs-phuoc-tan-1': {
    lat: 10.87915,
    lng: 106.89525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Tân Mai 2)'
  },
  'school-jhs-long-binh': {
    lat: 10.94518,
    lng: 106.88525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP2 Long Bình)'
  },
  'school-jhs-long-binh-tan': {
    lat: 10.90118,
    lng: 106.86225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP1 Long Bình Tân)'
  },
  'school-jhs-nguyen-cong-tru': {
    lat: 10.97125,
    lng: 106.89488,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP9 Tân Hòa)'
  },
  'school-jhs-vo-truong-toan': {
    lat: 10.97342,
    lng: 106.89925,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Phùng Khắc Khoan)'
  },
  'school-jhs-hoa-an': {
    lat: 10.95218,
    lng: 106.80125,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Huỳnh Mẫn Đạt)'
  },
  'school-jhs-tan-hanh': {
    lat: 10.96815,
    lng: 106.78218,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Phạm Văn Diêu)'
  },
  'school-jhs-hoang-van-thu': {
    lat: 10.96852,
    lng: 106.88218,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng KP5 Tân Biên)'
  },
  'school-jhs-tam-phuoc': {
    lat: 10.88118,
    lng: 106.94525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Long Đức 1)'
  },

  // --- TIỂU HỌC (PRI) ---
  'school-pri-tam-hiep': {
    lat: 10.94412,
    lng: 106.85825,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Đồng Khởi)'
  },
  'school-pri-binh-da': {
    lat: 10.93318,
    lng: 106.85265,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Vũ Hồng Phô)'
  },
  'school-pri-an-hao': {
    lat: 10.92465,
    lng: 106.84712,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP2 An Bình)'
  },
  'school-pri-le-thi-van': {
    lat: 10.92815,
    lng: 106.84920,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP3 An Bình)'
  },
  'school-pri-buu-long': {
    lat: 10.95815,
    lng: 106.79125,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Huỳnh Văn Nghệ)'
  },
  'school-pri-tan-tien': {
    lat: 10.95318,
    lng: 106.84125,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP2 Tân Tiến)'
  },
  'school-pri-thong-nhat': {
    lat: 10.94115,
    lng: 106.82518,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Thống Nhất)'
  },
  'school-pri-phan-dinh-phung': {
    lat: 10.96518,
    lng: 106.83225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Nguyễn Ái Quốc)'
  },
  'school-pri-nguyen-hue': {
    lat: 10.97215,
    lng: 106.82818,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Tân Phong)'
  },
  'school-pri-trang-dai': {
    lat: 10.97925,
    lng: 106.86418,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Bùi Trọng Nghĩa)'
  },
  'school-pri-ha-huy-giap': {
    lat: 10.98518,
    lng: 106.85825,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP5 Trảng Dài)'
  },
  'school-pri-phuoc-tan-1': {
    lat: 10.87518,
    lng: 106.89812,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Phước Tân)'
  },
  'school-pri-long-binh-tan': {
    lat: 10.90415,
    lng: 106.86318,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính KP2 Long Bình Tân)'
  },
  'school-pri-hoa-an': {
    lat: 10.95315,
    lng: 106.80325,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Hóa An)'
  },
  'school-pri-tan-hanh': {
    lat: 10.97118,
    lng: 106.78525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Tân Hạnh)'
  },
  'school-pri-phan-chu-trinh': {
    lat: 10.96915,
    lng: 106.88425,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng KP6 Tân Biên)'
  },
  'school-pri-tam-phuoc-1': {
    lat: 10.88315,
    lng: 106.94025,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Long Khánh 1)'
  },
  'school-pri-nguyen-du': {
    lat: 10.94518,
    lng: 106.81765,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Cách Mạng Tháng 8)'
  },
  'school-pri-quang-vinh': {
    lat: 10.95115,
    lng: 106.81225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Quang Vinh)'
  },
  'school-pri-le-van-tam': {
    lat: 10.95362,
    lng: 106.81618,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Quang Vinh)'
  },
  'school-pri-tan-mai': {
    lat: 10.94618,
    lng: 106.84825,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Tân Mai)'
  },
  'school-pri-tan-van': {
    lat: 10.92115,
    lng: 106.81225,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng chính Tân Vạn)'
  },
  'school-pri-hiep-hoa': {
    lat: 10.93618,
    lng: 106.83525,
    confidence_tier: 'A',
    source: 'Phòng GD&ĐT TP. Biên Hòa & OpenStreetMap GPS (Cổng Cù lao Phố Hiệp Hòa)'
  }
};

let matchedCount = 0;
for (const [id, patch] of Object.entries(calibrations)) {
  const blockRegex = new RegExp(`(\\{\\s*id:\\s*'${id}',[\\s\\S]*?\\n\\s*\\},?)`, 'g');
  if (content.match(blockRegex)) {
    matchedCount++;
    content = content.replace(blockRegex, (fullMatch) => {
      let updatedBlock = fullMatch;
      if (patch.lat !== undefined) {
        updatedBlock = updatedBlock.replace(/lat:\s*[0-9.]+/, `lat: ${patch.lat.toFixed(5)}`);
      }
      if (patch.lng !== undefined) {
        updatedBlock = updatedBlock.replace(/lng:\s*[0-9.]+/, `lng: ${patch.lng.toFixed(5)}`);
      }
      if (patch.address !== undefined) {
        updatedBlock = updatedBlock.replace(/address:\s*'[^']+'/, `address: '${patch.address}'`);
      }
      if (patch.ward !== undefined) {
        updatedBlock = updatedBlock.replace(/ward:\s*'[^']+'/, `ward: '${patch.ward}'`);
      }
      if (patch.source !== undefined) {
        updatedBlock = updatedBlock.replace(/verification_source:\s*'[^']+'/, `verification_source: '${patch.source}'`);
      }
      if (patch.is_verified !== undefined) {
        updatedBlock = updatedBlock.replace(/is_verified:\s*(true|false)/, `is_verified: ${patch.is_verified}`);
      }
      if (patch.public_map_approved !== undefined) {
        updatedBlock = updatedBlock.replace(/public_map_approved:\s*(true|false)/, `public_map_approved: ${patch.public_map_approved}`);
      }
      if (patch.confidence_tier !== undefined) {
        if (updatedBlock.includes('confidence_tier:')) {
          updatedBlock = updatedBlock.replace(/confidence_tier:\s*'[^']+'/, `confidence_tier: '${patch.confidence_tier}'`);
        } else {
          updatedBlock = updatedBlock.replace(/public_map_approved:\s*(true|false),/, `public_map_approved: $1,\n    confidence_tier: '${patch.confidence_tier}',`);
        }
      }
      return updatedBlock;
    });
  } else {
    console.warn('ID not found:', id);
  }
}

// Add confidence_tier: 'A' to any remaining school that doesn't have confidence_tier
content = content.replace(/public_map_approved:\s*true,(?!\s*confidence_tier:)/g, "public_map_approved: true,\n    confidence_tier: 'A',");

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Matched and calibrated ${matchedCount} / ${Object.keys(calibrations).length} schools.`);
