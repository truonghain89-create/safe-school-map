# HƯỚNG DẪN THIẾT LẬP VÀ VẬN HÀNH CƠ SỞ DỮ LIỆU & BẢO MẬT (GIAI ĐOẠN M1)
## SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN

---

## 1. Danh mục các Migration SQL theo thứ tự thực thi

Các tệp migration trong thư mục `supabase/migrations/` được thiết kế có tính phụ thuộc tuần tự nghiêm ngặt:

| Thứ tự | Tệp Migration | Nội dung chính |
|---|---|---|
| **01** | `01_extensions_and_enums.sql` | Kích hoạt `uuid-ossp`, `pgcrypto`. Khởi tạo 6 ENUMs chuẩn hóa (`issue_type_enum`, `verification_status_enum`, `hotspot_severity_enum`, `processing_status_enum`, `publication_status_enum`, `user_role_enum`, `school_status_enum`). |
| **02** | `02_tables_and_constraints.sql` | Khởi tạo 7 bảng cốt lõi: `schools`, `profiles`, `hotspots`, `hotspot_surveys`, `reports`, `report_media`, `audit_logs`. Ràng buộc bắt buộc lý do khi Report là `invalid`, ràng buộc tọa độ và tính toàn vẹn. |
| **03** | `03_indexes_and_performance.sql` | Thiết lập index trên toàn bộ khóa ngoại (tránh Full Table Scan); Partial indexes cho hàng đợi chờ duyệt `verification_status = 'pending'`, chỉ mục Hotspot công khai và composite index tọa độ. |
| **04** | `04_functions_and_triggers.sql` | Trigger tự động cập nhật `updated_at`; Trigger kiểm soát chéo Four-Eyes (`trg_hotspots_four_eyes_check`); Trigger tự động ghi nhật ký biến động trạng thái bất biến (`audit_logs`). |
| **05** | `05_row_level_security.sql` | Bật Row Level Security (RLS) trên cả 7 bảng. Phân quyền chi tiết cho `anon`, `verifier`, `approver`, `admin`. Cấm Anonymous SELECT trực tiếp `reports`; cấm hoàn toàn UPDATE/DELETE trên `audit_logs` (Append-Only). |
| **06** | `06_storage_policies.sql` | Khởi tạo 2 Storage bucket: `private-reports` (Riêng tư - chỉ verifier/approver xem bằng Signed URL) và `public-hotspots` (Công khai - chỉ chứa ảnh đã làm mờ nhận diện). |
| **07** | `07_views_and_public_api.sql` | View bản đồ công khai `public_hotspots_view` (bảo đảm đủ 5 điều kiện tiên quyết, tổng quát hóa tọa độ đại diện); Hàm RPC an toàn `rpc_lookup_report_by_code` tra cứu tiến độ bằng mã băm SHA-256. |
| **08** | `08_seed_demo_data.sql` | Dữ liệu mẫu kiểm thử, gắn cờ `is_demo = true` 100% trên từng bản ghi. Trường THPT Tam Hiệp cấu hình thí điểm. |
| **09** | `09_rls_verification_tests.sql` | Bộ kiểm thử tự động 7 kịch bản: kiểm tra RLS, vi phạm Four-Eyes, ẩn Hotspot khi trường chưa duyệt, tra cứu bằng mã băm. |

---

## 2. Hướng dẫn Áp dụng Migration lên Supabase

### Cách 1: Áp dụng trực tiếp qua Supabase Web Dashboard (Khuyến nghị cho dự án thí điểm)
1. Đăng nhập vào trang quản trị Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Chọn dự án của bạn &rarr; Mở mục **SQL Editor** ở thanh menu bên trái.
3. Mở lần lượt từng file từ `01_extensions_and_enums.sql` đến `08_seed_demo_data.sql`, dán vào ô nhập lệnh và bấm **Run**.
4. Chạy file `09_rls_verification_tests.sql` để xác nhận kết quả kiểm thử hiển thị `7 / 7 BÀI TEST ĐẠT CHUẨN`.

### Cách 2: Áp dụng qua Supabase CLI
```bash
# Đăng nhập Supabase CLI
supabase login

# Liên kết với dự án Supabase trên đám mây
supabase link --project-ref your-project-id

# Đẩy toàn bộ migrations lên database
supabase db push
```

---

## 3. Phân tích Kỹ thuật Chuyên sâu

### 3.1. Đánh giá Kiểu dữ liệu Tọa độ: `DOUBLE PRECISION` vs `PostGIS (GEOGRAPHY)`
- **Lựa chọn hiện tại:** Sử dụng cặp trường `lat DOUBLE PRECISION` và `lng DOUBLE PRECISION` kèm ràng buộc toàn vẹn `CHECK (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180)`.
- **Ưu điểm:**
  1. Tương thích trực tiếp 100% với kiểu số thực của Leaflet (`[lat, lng]`), JavaScript `number` và TypeScript interfaces mà không cần chuyển đổi WKT/GeoJSON qua lại.
  2. Không phụ thuộc vào extension PostGIS phức tạp ở giai đoạn thí điểm 1 trường học, giúp giảm thiểu rủi ro lỗi môi trường khi deploy lên gói Supabase Free Tier.
  3. Chỉ mục B-Tree `(public_lat, public_lng)` cho tốc độ truy vấn phạm vi bounding box (BBOX) Biên Hòa cực nhanh.
- **Khả năng mở rộng:** Trong tương lai khi mở rộng sang hàng trăm trường trên toàn tỉnh Đồng Nai và cần tính toán khoảng cách không gian phức tạp (Spatial Distance Queries), hệ thống có thể kích hoạt PostGIS và bổ sung cột `geom GEOGRAPHY(Point, 4326)` thông qua hàm tạo tự động từ `(lng, lat)` mà không làm thay đổi các bảng dữ liệu gốc.

### 3.2. Sự cần thiết của Bảng Khảo sát Thực địa riêng (`hotspot_surveys`)
- Thay vì gộp ngày khảo sát vào một cột đơn lẻ trên bảng `hotspots`, việc tách bảng `hotspot_surveys` mang lại giá trị nghiệp vụ then chốt:
  1. **Lưu vết lịch sử nhiều đợt khảo sát:** Một điểm nóng giao thông trước cổng trường thường được khảo sát nhiều lần (lần 1: khảo sát ban đầu ghi nhận nguy cơ; lần 2: khảo sát đánh giá sau khi sơn vạch kẻ đường; lần 3: tái kiểm tra định kỳ).
  2. **Trách nhiệm cá nhân rõ ràng:** Ghi nhận chính xác cán bộ nào thực hiện (`surveyor_id`), hình ảnh hiện trường kèm theo từng đợt, và kiến nghị cụ thể.
  3. **Làm căn cứ cho điều kiện công khai #1:** Một Hotspot chưa có Report người dân vẫn có thể được công khai nếu đã có khảo sát thực địa chính thức từ nhà trường.

### 3.3. Nguyên tắc Kiểm soát Chéo (Four-Eyes Principle)
- Được thực thi bằng Trigger Database `trg_hotspots_four_eyes_check`:
  - Khi một Hotspot dữ liệu thật (`is_demo = false`) chuyển sang `publication_status = 'published'`, hệ thống kiểm tra nếu `approved_by` trùng với `created_by` hoặc trùng với `surveyor_id` thì lệnh UPDATE lập tức bị hủy bỏ (Raise Exception).
  - Đảm bảo tính minh bạch: Người trực tiếp lập hoặc khảo sát không được tự mình ký duyệt công khai Hotspot lên bản đồ số.

---

## 4. Kế hoạch Sao lưu và Phục hồi Dữ liệu (Backup & Recovery)

### 4.1. Sao lưu Cơ sở dữ liệu (PostgreSQL)
- **Supabase Tự động (Automated Backups):** Supabase cung cấp tính năng sao lưu hàng ngày tự động (Point-in-Time Recovery trên Pro hoặc Daily Backups trên Free).
- **Sao lưu Thủ công định kỳ qua `pg_dump`:**
  ```bash
  # Lệnh sao lưu toàn bộ cấu trúc và dữ liệu ra file SQL
  pg_dump -h db.your-project-id.supabase.co -U postgres -d postgres -F c -b -v -f "safeschoolmap_backup_$(date +%Y%m%d).dump"
  ```

### 4.2. Khôi phục Dữ liệu (Restore)
  ```bash
  # Lệnh khôi phục lại cơ sở dữ liệu từ file backup
  pg_restore -h db.your-project-id.supabase.co -U postgres -d postgres -v -c "safeschoolmap_backup_20261115.dump"
  ```

### 4.3. Sao lưu Kho ảnh Storage
- Thư mục `private-reports` và `public-hotspots` có thể được đồng bộ về kho lưu trữ lạnh bằng lệnh Supabase CLI Storage Sync hoặc rclone định kỳ hàng tháng.
