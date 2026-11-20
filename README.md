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

## 5. Tiến độ triển khai & Kết quả Nghiệm thu

- [x] **M0 – Phân tích và Thiết lập Nền tảng dự án** (Hoàn thành)
- [x] **M1 – Cơ sở dữ liệu và Bảo mật (Supabase PostgreSQL, RLS, Storage, Triggers)** (Hoàn thành)
- [x] **M2 – Giao diện công khai và Form gửi phản ánh thực tế kèm ảnh/tọa độ GPS** (Hoàn thành)
- [x] **M3 – Phân hệ Tra cứu mã phản ánh & Quản trị kiểm duyệt 4-Eyes Workflow** (Hoàn thành)
- [x] **M4 – Bản đồ số Leaflet kết nối dữ liệu thực tế 86 trường học TP. Biên Hòa** (Hoàn thành)
- [x] **M5 – Trang Thống kê 4 biểu đồ Recharts có bộ lọc phân tích theo từng trường học** (Hoàn thành)
- [x] **M6 – Tích hợp Đa trường học (Prompt 9.5 Multi-School Engine & Routing Logs)** (Hoàn thành)
- [x] **M7 – Kiểm toán Toàn diện Website (Prompt 10 & 10.1 Full Audit & Security Hardening)** (Hoàn thành)

---

## 6. Danh mục Tệp SQL & Di chuyển Dữ liệu (Supabase Migrations)

Toàn bộ kịch bản cấu hình cơ sở dữ liệu được tổ chức tại thư mục `supabase/`:
- `supabase/migrations/01` - `09`: Khởi tạo Schema, Enum, Bảng, RLS, Storage Policies, Views, RPCs và Seed Data.
- `supabase/FULL_SETUP_M1.sql`: Toàn văn thiết lập hệ thống từ đầu.
- `supabase/MIGRATION_SCHOOLS_BIEN_HOA.sql`: Bộ dữ liệu 86 trường học TP. Biên Hòa đã hiệu chuẩn tọa độ.
- `supabase/MIGRATION_PROMPT9_PUBLIC_STATS.sql`: RPC thống kê công khai có bảo mật `SECURITY DEFINER`.
- `supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql`: Kiến trúc đa trường học, phân cấp quản trị, ghi log định tuyến.
- `supabase/FIX_BUG_001_AUTH.sql`: Bản vá lỗi định danh GoTrue & cột sinh tự động `confirmed_at` trên PostgreSQL.
