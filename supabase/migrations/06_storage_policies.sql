-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 06: Supabase Storage Buckets & Storage Security Policies
-- Guidelines: supabase (Storage access control, private vs public buckets)
-- ============================================================================

-- 1. KHỞI TẠO CÁC BUCKET LƯU TRỮ TRONG SUPABASE STORAGE
-- Bucket 1: private-reports (RIÊNG TƯ - Ảnh gốc người dân gửi)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-reports',
  'private-reports',
  false,                 -- BUCKET HOÀN TOÀN RIÊNG TƯ, CẤM PUBLIC URL!
  5242880,               -- Giới hạn 5MB (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Bucket 2: public-hotspots (CÔNG KHAI - Chỉ chứa ảnh đã làm mờ & duyệt)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-hotspots',
  'public-hotspots',
  true,                  -- Cho phép công chúng đọc sau khi đã xử lý bảo vệ quyền riêng tư
  5242880,               -- Giới hạn 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. POLICIES CHO STORAGE OBJECTS (storage.objects)
-- ============================================================================

-- BẢO VỆ BUCKET private-reports:
-- A. Quyền xem/tải ảnh gốc:
-- QUY TẮC BẤT BIẾN: Người chưa đăng nhập và người dùng công khai KHÔNG THỂ XEM ẢNH GỐC!
-- Chỉ cán bộ xác minh (Verifier), phê duyệt (Approver) hoặc Admin mới được tạo Signed URL
DROP POLICY IF EXISTS "private_reports_staff_read" ON storage.objects;
CREATE POLICY "private_reports_staff_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'private-reports' AND
  public.is_verifier_or_higher()
);

-- B. Quyền tải ảnh lên private-reports:
-- Cho phép người dân tải ảnh lên khi nộp phản ánh
DROP POLICY IF EXISTS "private_reports_public_upload" ON storage.objects;
CREATE POLICY "private_reports_public_upload" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'private-reports' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- C. Cấm mọi hành vi cập nhật hoặc ghi đè ảnh gốc tùy tiện
-- (Ảnh gốc là bằng chứng, bất biến không được sửa đổi)
DROP POLICY IF EXISTS "private_reports_no_update" ON storage.objects;
CREATE POLICY "private_reports_no_update" ON storage.objects
FOR UPDATE TO authenticated
USING (false);

-- BẢO VỆ BUCKET public-hotspots:
-- A. Quyền xem ảnh công khai:
-- Bất kỳ ai cũng có thể xem ảnh đã được xử lý làm mờ và duyệt công khai
DROP POLICY IF EXISTS "public_hotspots_read_all" ON storage.objects;
CREATE POLICY "public_hotspots_read_all" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'public-hotspots');

-- B. Quyền tải ảnh đã làm mờ lên public-hotspots:
-- Chỉ cán bộ trường đã xử lý làm mờ mới được đưa ảnh vào bucket công khai
DROP POLICY IF EXISTS "public_hotspots_staff_insert" ON storage.objects;
CREATE POLICY "public_hotspots_staff_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'public-hotspots' AND
  public.is_verifier_or_higher()
);
