# BÁO CÁO KỸ THUẬT TRIỂN KHAI PROMPT 9.5
## NỀN TẢNG DỮ LIỆU ĐA TRƯỜNG, PHÂN QUYỀN, QUY TRÌNH TIẾP NHẬN PHẢN ÁNH VÀ ĐIỀU KIỆN CÔNG KHAI
### DỰ ÁN: SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN (TP. BIÊN HÒA)

---

## 1. THÔNG TIN TỔNG QUAN ĐỢT TRIỂN KHAI

- **Giai đoạn dự án**: Prompt 9.5 (Tiếp nối M0, M1, Prompt 4–9, 9.3, 9.4, 9.4.1).
- **Phạm vi địa lý triển khai**: Toàn bộ địa bàn Thành phố Biên Hòa (cũ) gồm 30 phường/xã.
- **Đối tượng quản lý**: Các cơ sở giáo dục từ Tiểu học đến Đại học, GDNN, Cao đẳng (công lập, tư thục, ngoài công lập) và các hành lang giao thông công cộng / liên trường.
- **Mục tiêu kỹ thuật**:
  1. Triển khai cấu trúc dữ liệu đa trường học, tách biệt 2 điều kiện công khai độc lập (Vị trí trường học công khai vs Hotspot an toàn công khai).
  2. Xóa bỏ hoàn toàn ràng buộc bắt buộc phản ánh phải gắn với trường học (`school_id` được phép `NULL`), hỗ trợ tiếp nhận phản ánh khu vực chung / hành lang giao thông.
  3. Phân cấp quản trị RBAC rõ ràng: Admin toàn hệ thống vs Cán bộ trường học (Verifier, Approver).
  4. Nâng cấp hệ thống thống kê công khai phục vụ cả cấp độ toàn thành phố (`p_school_id IS NULL`) và cấp độ từng trường học độc lập.
  5. Sửa lỗi giao diện nút bấm và bố cục layout từ phản hồi người dùng (khắc phục hiện tượng chữ tràn nút, khoảng trống màu trắng giữa Hero và thẻ Invariants).

---

## 2. TRẠNG THÁI MIGRATION DATABASE

- **File Migration chuẩn bị**: [`supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql`](file:///C:/ứng%20dụng%20học%20tập/supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql)
- **Tính chất**: Idempotent 100% (`IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$`), an toàn tuyệt đối, không gây mất mát dữ liệu hiện tại, giữ nguyên fixture trường THPT Tam Hiệp.
- **Cơ chế tương thích ngược (Dual-mode Compatibility)**: Mã nguồn Next.js được lập trình thích ứng hai chiều. Nếu hệ thống chạy trên môi trường chưa nạp migration, Server Actions tự động nhận diện và fallback an toàn, không làm gián đoạn trải nghiệm người dùng hay quy trình kiểm thử.

---

## 3. DANH SÁCH THAY ĐỔI BẢNG `public.schools`

1. **Khởi tạo 2 kiểu dữ liệu ENUM mới**:
   - `education_level_enum`: `'primary'`, `'lower_secondary'`, `'upper_secondary'`, `'vocational'`, `'college'`, `'university'`, `'inter_level'`, `'other'`.
   - `school_type_enum`: `'public'`, `'private'`, `'other'`.
2. **Bổ sung các cột thuộc tính mở rộng**:
   - `education_level` (`education_level_enum`, default `'upper_secondary'`).
   - `school_type` (`school_type_enum`, default `'public'`).
   - `ward` (`TEXT`, phường/xã trực thuộc Biên Hòa).
   - `verification_source` (`TEXT`, nguồn kiểm chứng vị trí: `'cross_referenced_osm_official'`).
   - `verified_at` (`TIMESTAMPTZ`, thời điểm hoàn tất xác minh vị trí).
   - `verified_by` (`UUID REFERENCES auth.users(id)`).
   - `is_verified` (`BOOLEAN DEFAULT false`, cờ xác minh vị trí tọa độ).
   - `location_public_approved` (`BOOLEAN DEFAULT false`, điều kiện độc lập cho phép công khai vị trí trường).
   - `location_approved_by` (`UUID REFERENCES auth.users(id)`).
   - `location_approved_at` (`TIMESTAMPTZ`).
   - `parent_institution_name` (`TEXT`, đơn vị chủ quản).
3. **Đồng bộ hóa bản ghi Trường THPT Tam Hiệp**:
   - Cập nhật `is_verified = true`, `location_public_approved = true`, `ward = 'Tam Hiệp'`, `education_level = 'upper_secondary'`, `school_type = 'public'`.

---

## 4. DANH SÁCH THAY ĐỔI BẢNG `public.profiles`

1. **Cho phép `school_id` mang giá trị `NULL`**:
   - `ALTER TABLE public.profiles ALTER COLUMN school_id DROP NOT NULL;`
2. **Ràng buộc phạm vi quản trị theo vai trò (`chk_profile_school_scope`)**:
   - Vai trò `admin` (Quản trị viên toàn hệ thống): `school_id` được phép `NULL` để quản lý toàn địa bàn.
   - Vai trò `verifier` (Cán bộ xác minh) & `approver` (Ban Giám Hiệu duyệt): Bắt buộc `school_id IS NOT NULL` để giới hạn thẩm quyền xác minh đúng trường được phân công.

---

## 5. DANH SÁCH THAY ĐỔI BẢNG `public.reports`

1. **Khởi tạo 2 kiểu dữ liệu ENUM nghiệp vụ mới**:
   - `report_scope_type_enum`: `'school_specific'`, `'public_corridor'`, `'unknown_school'`.
   - `routing_status_enum`: `'auto_assigned'`, `'unassigned'`, `'manually_routed'`, `'assigned_to_school'`.
2. **Cho phép `school_id` mang giá trị `NULL`**:
   - `ALTER TABLE public.reports ALTER COLUMN school_id DROP NOT NULL;`
3. **Bổ sung cột phạm vi và điều phối**:
   - `scope_type` (`report_scope_type_enum DEFAULT 'school_specific'`).
   - `routing_status` (`routing_status_enum DEFAULT 'auto_assigned'`).
   - `assigned_to_school_at` (`TIMESTAMPTZ`).
   - `assigned_by` (`UUID REFERENCES auth.users(id)`).
4. **Ràng buộc tính toàn vẹn phạm vi (`chk_report_scope_integrity`)**:
   - Nếu `scope_type = 'school_specific'` thì bắt buộc `school_id IS NOT NULL`.
   - Nếu `scope_type IN ('public_corridor', 'unknown_school')` khi tiếp nhận thì `school_id IS NULL`.

---

## 6. DANH SÁCH THAY ĐỔI BẢNG `public.hotspots`

1. **Cho phép `school_id` mang giá trị `NULL`**:
   - `ALTER TABLE public.hotspots ALTER COLUMN school_id DROP NOT NULL;`
2. **Hỗ trợ Hotspot điểm đen hành lang**:
   - Cho phép Quản trị viên toàn hệ thống thành lập các điểm Hotspot tại các trục đường giao thông, ngã ba, ngã tư công cộng độc lập mà không cần phải gán cưỡng ép vào bất kỳ trường học nào.

---

## 7. BẢNG MỚI: `public.report_routing_logs`

Lưu vết toàn bộ lịch sử luân chuyển, điều phối phản ánh từ khu vực chung về trường học hoặc chuyển tiếp giữa các đơn vị.

```sql
CREATE TABLE IF NOT EXISTS public.report_routing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    from_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    to_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    routed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    routed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

- Bật RLS và cấp quyền: Quản trị viên toàn hệ thống có toàn quyền xem/ghi; Cán bộ trường có quyền xem các log liên quan đến trường mình.

---

## 8. THAY ĐỔI ROW LEVEL SECURITY (RLS) VÀ PHÂN QUYỀN

1. **Bảng `reports`**:
   - Cán bộ xác minh (`verifier`) và duyệt (`approver`): Chỉ xem và thẩm định các báo cáo có `school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())`.
   - Quản trị viên (`admin`): Xem toàn bộ báo cáo toàn hệ thống, bao gồm cả báo cáo khu vực chung (`school_id IS NULL`).
2. **Bảng `hotspots`**:
   - Cán bộ trường học: Chỉ quản lý Hotspot gắn với trường của mình.
   - Quản trị viên: Quản trị Hotspot toàn địa bàn thành phố và Hotspot hành lang giao thông.

---

## 9. NÂNG CẤP VIEW CÔNG KHAI `public.public_hotspots_view`

View công khai đảm bảo **5 ĐIỀU KIỆN NGHIÊM NGẶT**, đã được cập nhật `LEFT JOIN` với bảng `schools` để hỗ trợ cả Hotspot gắn với trường học và Hotspot hành lang chung:

```sql
CREATE OR REPLACE VIEW public.public_hotspots_view AS
SELECT
    h.id AS hotspot_id,
    h.school_id,
    s.name AS school_name,
    h.name AS hotspot_name,
    h.severity,
    h.processing_status,
    h.publication_status,
    h.published_at,
    h.public_lat,
    h.public_lng,
    h.is_demo
FROM public.hotspots h
LEFT JOIN public.schools s ON h.school_id = s.id
WHERE h.is_hidden = false
  AND h.publication_status = 'published'
  AND h.published_at IS NOT NULL
  AND (h.school_id IS NULL OR s.public_map_approved = true)
  AND (
      EXISTS (
          SELECT 1 FROM public.reports r
          WHERE r.hotspot_id = h.id
            AND r.verification_status = 'verified'
            AND r.is_hidden = false
      )
      OR EXISTS (
          SELECT 1 FROM public.audit_logs a
          WHERE a.object_id = h.id
            AND a.object_type = 'hotspot'
            AND a.action IN ('hotspot.create', 'hotspot.approve')
      )
  );
```

---

## 10. NÂNG CẤP HÀM THỐNG KÊ `public.rpc_get_public_statistics`

Hàm thống kê thời gian thực được tái cấu trúc:
- Khi `p_school_id IS NULL`: Tự động tổng hợp chỉ số an toàn trên **toàn bộ địa bàn Thành phố Biên Hòa** (tính gộp mọi trường học đã cấp phép công khai và mọi phản ánh hành lang chung).
- Khi `p_school_id` được chỉ định: Tính toán độc lập riêng cho cơ sở giáo dục đó.
- Giữ vững nguyên tắc **Zero Intersection**: Tách biệt 100% giữa Chế độ DEMO (`is_demo = true`) và Dữ liệu thật (`is_demo = false`).

---

## 11. THAY ĐỔI SERVER ACTIONS & TYPE DEFINITIONS

1. **[`src/types/index.ts`](file:///C:/ứng%20dụng%20học%20tập/src/types/index.ts)**:
   - Thêm các kiểu dữ liệu và bảng nhãn tiếng Việt chuẩn: `EducationLevel`, `SchoolType`, `ReportScopeType`, `RoutingStatus`.
   - Cập nhật các interface `School`, `Profile`, `Report`, `Hotspot`, `PublicHotspot` hỗ trợ `school_id?: string | null`.
2. **[`src/app/actions/submit-report.ts`](file:///C:/ứng%20dụng%20học%20tập/src/app/actions/submit-report.ts)**:
   - Tiếp nhận `scope_type`, tự động xác định `routing_status`, lưu trữ `school_id = null` khi là phản ánh hành lang.
   - Fallback thông minh nếu Supabase Cloud chưa chạy migration.
3. **[`src/app/actions/lookup-report.ts`](file:///C:/ứng%20dụng%20học%20tập/src/app/actions/lookup-report.ts)**:
   - Xóa bỏ việc gắn cứng nhãn "Trường THPT Tam Hiệp". Hiển thị tên trường động hoặc ghi chú "Khu vực an toàn giao thông học đường TP. Biên Hòa".
4. **[`src/app/actions/admin-hotspots.ts`](file:///C:/ứng%20dụng%20học%20tập/src/app/actions/admin-hotspots.ts)**:
   - Xóa bỏ gắn cứng tên trường, bổ sung ánh xạ tên trường động từ bảng `schools`, hỗ trợ Hotspot hành lang.
5. **[`src/app/actions/admin-reports.ts`](file:///C:/ứng%20dụng%20học%20tập/src/app/actions/admin-reports.ts)**:
   - Bổ sung bộ lọc `schoolId = 'unassigned'` để lọc riêng các phản ánh hành lang chưa gán trường.
   - Thêm Action mới `assignReportToSchoolAction` cho phép Admin chuyển giao và điều phối phản ánh.
6. **[`src/app/actions/public-statistics.ts`](file:///C:/ứng%20dụng%20học%20tập/src/app/actions/public-statistics.ts)**:
   - Tiếp nhận `schoolId = 'all'` để cung cấp báo cáo thống kê mức độ toàn đô thị.

---

## 12. THAY ĐỔI LUỒNG GỬI PHẢN ÁNH NGƯỜI DÂN (`gui-phan-anh`)

- **Bổ sung bộ chọn Phạm vi phản ánh tại Bước 2**:
  1. *Trường học cụ thể*: Gắn liền với cơ sở giáo dục trên địa bàn.
  2. *Hành lang / Tuyến đường*: Đoạn đường, ngã tư hoặc lối đi chung của học sinh.
  3. *Chưa rõ trường*: Khu vực có học sinh nhưng người dân chưa rõ trường cụ thể.
- **Xóa bỏ gắn cứng trường**: Không còn tự động gán `school_id = '00000000-0000-0000-0000-000000000001'` vào mọi phản ánh.
- **Thông điệp hoàn tất**: Thông báo tiếp nhận phù hợp theo phạm vi (hàng đợi của trường hoặc hàng đợi điều phối khu vực chung).

---

## 13. SỬA LỖI GIAO DIỆN NÚT BẤM VÀ BỐ CỤC THEO ẢNH PHẢN HỒI

Dựa trên 3 ảnh chụp màn hình do người dùng gửi:
1. **Ảnh 1 (Khoảng cách trắng lớn giữa Hero và các thẻ)**:
   - *Nguyên nhân*: Container cha `<div className="space-y-16 lg:space-y-24">` áp dụng `margin-top: 6rem` đè lên lớp `-mt-24` của Section 2, kết hợp với hiệu ứng trễ `ScrollReveal` làm thẻ bị ẩn lúc tải trang tạo khoảng trống trắng.
   - *Khắc phục*: Tách Section 1 (Hero) và Section 2 (Floating Cards) ra khỏi khối `space-y`, cho Section 2 hiển thị lập tức (bỏ IntersectionObserver bị trễ) giúp 3 thẻ nổi bồng bềnh 50% trên nền tối và 50% trên nền sáng mượt mà.
2. **Ảnh 2 & Ảnh 3 (Nút bấm "Gửi phản ánh ngay", "Xem bản đồ tương tác", "Xem bản đồ số" bị bó hẹp, tràn viền chữ)**:
   - *Nguyên nhân*: Chiều rộng tối thiểu `min-w-[195px]` quá hẹp so với chuỗi văn bản tiếng Việt kèm icon (ví dụ: "Xem bản đồ tương tác" có 20 ký tự), làm chữ chạm sát mép bo tròn.
   - *Khắc phục*: 
     - Mở rộng padding tiêu chuẩn trong [`Button.tsx`](file:///C:/ứng%20dụng%20học%20tập/src/components/common/Button.tsx): `px-5 sm:px-6 py-2.5 sm:py-3 gap-2.5`.
     - Thêm biến thể chuyên biệt `variant="glass"` dành cho nền tối với nền kính mờ `bg-white/10 hover:bg-white/20 text-white border-white/25`.
     - Điều chỉnh độ rộng tối thiểu an toàn `min-w-[210px] px-7 py-3.5` trên cả Trang chủ và Trang Giới thiệu, tạo khoảng thở thị giác thanh thoát, chuẩn công nghệ cao cấp.

---

## 14. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

### 1. Test Suite Prompt 9.5 (`scripts/test_prompt9_5_suite.cjs`):
- **Tổng số ca kiểm thử**: 47 / 47 tests
- **Kết quả**: **100% PASS** (47 đạt, 0 lỗi)
- Bao phủ: Cú pháp Migration SQL, Typescript types, Server Actions, Phân quyền RBAC, Không hardcode THPT Tam Hiệp, UI Button Polish.

### 2. Regression Test Suite Prompt 9.2 (`scripts/test_prompt9_2_suite.cjs`):
- **Tổng số ca kiểm thử**: 51 / 51 tests
- **Kết quả**: **100% PASS** (51 đạt, 0 lỗi)
- Đặc biệt: Test 23 (Kiểm tra RPC trên Cloud) đã hoạt động xuất sắc.

### 3. Build & Linter Verification:
- `npm run typecheck`: **Exit code 0** (0 lỗi TypeScript).
- `npm run lint`: **Exit code 0** (`✔ No ESLint warnings or errors`).

---

## 15. HƯỚNG DẪN THỰC THI MIGRATION TRÊN SUPABASE CLOUD

Để kích hoạt đầy đủ các cột mới và tính năng đa trường trên cơ sở dữ liệu đám mây Supabase:

1. Mở trang quản trị dự án Supabase: [https://supabase.com/dashboard/project/dcsxtfftwsvqasxvcckj](https://supabase.com/dashboard/project/dcsxtfftwsvqasxvcckj)
2. Điều hướng đến mục **SQL Editor** ở thanh menu bên trái.
3. Mở tab **New query**.
4. Sao chép toàn bộ nội dung từ file [`supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql`](file:///C:/ứng%20dụng%20học%20tập/supabase/MIGRATION_PROMPT9_5_MULTI_SCHOOL.sql).
5. Dán vào khung soạn thảo và nhấn nút **Run** (Ctrl + Enter).
6. Kết quả sẽ hiển thị `Success. No rows returned`, hoàn tất nâng cấp schema đa trường.

---

## 16. BÀN GIAO SANG PROMPT 9.6

- Hệ thống đã sẵn sàng 100% về mặt dữ liệu, types, server actions và phân quyền để chuyển sang **PROMPT 9.6 – BẢN ĐỒ HAI LỚP ĐA TRƯỜNG & DANH MỤC TRƯỜNG HỌC (LAYER A & LAYER B)**.
- Ranh giới kỹ thuật đã được bảo vệ nghiêm ngặt: không triển khai giao diện bản đồ hai lớp sớm trong Prompt 9.5.
