# SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN

Hệ thống tiếp nhận, xác minh và tổng hợp phản ánh giao thông xung quanh cổng trường học. Dự án thí điểm tại **Trường THPT Tam Hiệp, TP. Biên Hòa, tỉnh Đồng Nai**.

---

## 1. Tổng quan Dự án

- **Tên dự án:** SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
- **Mục tiêu:** Xây dựng bản đồ số hiển thị các điểm giao thông cần chú ý (Hotspots) quanh khu vực cổng trường, hỗ trợ nhà trường nhận diện nguy cơ và đưa ra giải pháp phân luồng, can thiệp phù hợp.
- **Phạm vi địa lý:** 
  - Toàn bộ địa bàn thành phố Biên Hòa cũ (Khung tọa độ theo OpenStreetMap Relation 7154127).
  - Trọng tâm thí điểm: **Trường THPT Tam Hiệp** (`10.9414°N, 106.8614°E`).
- **Nguyên tắc bất biến:**
  - Phản ánh không phải kết luận. Chỉ Hotspot đủ 5 điều kiện mới được công khai.
  - Trung thực dữ liệu: Dữ liệu DEMO có cờ riêng, tách hoàn toàn khỏi thống kê thực.
  - Quyền riêng tư theo mặc định: Không bắt buộc thu thập họ tên/SĐT; ảnh gốc lưu trữ bảo mật; xóa EXIF và làm mờ nhận diện trước khi công khai.
  - Mức độ nguy cơ do người xác minh đánh giá thủ công, AI không tự quyết định.

---

## 2. Công nghệ sử dụng

- **Frontend:** Next.js 14+ (App Router), React 18, TypeScript (chế độ strict).
- **Styling & Design System:** Tailwind CSS v3.4+, Lucide React.
- **Bản đồ tương tác:** Leaflet + OpenStreetMap Tiles.
- **Backend & Database:** Supabase (PostgreSQL, Row Level Security, Auth, Storage) — Chuẩn bị tích hợp từ M1.
- **Data Visualization:** Recharts — Chuẩn bị tích hợp từ M5.

---

## 3. Cấu trúc thư mục

```text
├── public/                 # Tệp tĩnh, biểu tượng bản đồ
├── src/
│   ├── app/
│   │   ├── (public)/       # Nhóm trang công khai: /, /ban-do, /gui-phan-anh, /tra-cuu, /thong-ke, /dieu-khoan, /quyen-rieng-tu
│   │   ├── (auth)/         # Đăng nhập cán bộ: /dang-nhap
│   │   ├── quan-tri/       # Nhóm trang quản trị: /quan-tri, /phan-anh, /diem-chu-y, /khao-sat, /nhat-ky, /tai-khoan
│   │   ├── globals.css     # Định nghĩa CSS & Theme tokens
│   │   └── layout.tsx      # Root Layout
│   ├── components/
│   │   ├── layout/         # Header, Footer, AdminSidebar
│   │   └── map/            # LeafletMap, MapWrapper (Dynamic import SSR-safe)
│   ├── lib/
│   │   ├── constants/      # geo.ts (Tọa độ Biên Hòa & THPT Tam Hiệp)
│   │   └── utils.ts        # cn(), formatDateTimeVN()
│   └── types/
│       └── index.ts        # Toàn bộ định nghĩa TypeScript v4
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. Hướng dẫn Cài đặt & Chạy dự án

### Yêu cầu môi trường
- **Node.js:** `>= 18.17.0` (Đã kiểm thử trên Node `v24.18.1`)
- **npm:** `>= 9.0.0` (Đã kiểm thử trên npm `11.16.0`)

### Các bước cài đặt
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Kiểm tra kiểu dữ liệu TypeScript
npm run typecheck

# 3. Kiểm tra mã nguồn với ESLint
npm run lint

# 4. Chạy môi trường phát triển local
npm run dev
```
Mở trình duyệt tại: `http://localhost:3000`

### Lệnh đóng gói và kiểm thử Build
```bash
npm run build
npm run start
```

---

## 5. Tiến độ triển khai (Roadmap)

- [x] **M0 – Phân tích và Thiết lập Nền tảng dự án** (Đang nghiệm thu)
- [ ] **M1 – Cơ sở dữ liệu và Bảo mật (Supabase Schema, RLS, Storage)**
- [ ] **M2 – Giao diện công khai và Form gửi phản ánh thực tế**
- [ ] **M3 – Phân hệ Tra cứu và Quản trị duyệt phản ánh**
- [ ] **M4 – Hoàn thiện Bản đồ công khai Leaflet kết nối dữ liệu thật**
- [ ] **M5 – Trang Thống kê 4 biểu đồ Recharts**
- [ ] **M6 – Hoàn thiện, Kiểm thử toàn diện & Triển khai Production**
- [ ] **M7 – Mở rộng sau MVP (Hỗ trợ AI gợi ý, xuất báo cáo, mở rộng nhiều trường)**
