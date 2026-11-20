-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 02: Core Relational Tables and Constraints
-- Specification: v4 (Hợp nhất) | Giai đoạn M1: Database & Security
-- ============================================================================

-- 1. BẢNG TRƯỜNG HỌC (schools)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  status school_status_enum NOT NULL DEFAULT 'pilot',
  public_map_approved BOOLEAN NOT NULL DEFAULT false, -- Chỉ công khai khi trường cho phép
  approved_by UUID,                                  -- Người đại diện ký duyệt
  approved_at TIMESTAMPTZ,
  is_focal_point BOOLEAN NOT NULL DEFAULT false,     -- Điểm trọng tâm thí điểm
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BẢNG HỒ SƠ CÁN BỘ NỘI BỘ (profiles)
-- Liên kết 1-1 với auth.users, bảo vệ phân quyền ở tầng cơ sở dữ liệu
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  role user_role_enum NOT NULL DEFAULT 'verifier',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG ĐIỂM CẦN CHÚ Ý (hotspots)
-- Tổng hợp từ các Report hợp lệ hoặc khảo sát thực địa
CREATE TABLE IF NOT EXISTS public.hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  -- Tọa độ nội bộ thực tế (dành cho người xác minh và khảo sát)
  actual_lat DOUBLE PRECISION NOT NULL CHECK (actual_lat BETWEEN -90 AND 90),
  actual_lng DOUBLE PRECISION NOT NULL CHECK (actual_lng BETWEEN -180 AND 180),
  -- Tọa độ công khai đã được tổng quát hóa (vị trí đại diện tim đường, không lộ vị trí cá nhân)
  public_lat DOUBLE PRECISION NOT NULL CHECK (public_lat BETWEEN -90 AND 90),
  public_lng DOUBLE PRECISION NOT NULL CHECK (public_lng BETWEEN -180 AND 180),
  -- 3 Trục trạng thái độc lập
  severity hotspot_severity_enum NOT NULL DEFAULT 'attention_needed',
  processing_status processing_status_enum NOT NULL DEFAULT 'unprocessed',
  publication_status publication_status_enum NOT NULL DEFAULT 'unpublished',
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ràng buộc: Khi publication_status = 'published', bắt buộc phải có approved_by và published_at
  CONSTRAINT chk_hotspot_publication_approval CHECK (
    (publication_status = 'published' AND approved_by IS NOT NULL AND published_at IS NOT NULL)
    OR
    (publication_status != 'published')
  )
);

-- 4. BẢNG KHẢO SÁT THỰC ĐỊA RIÊNG (hotspot_surveys)
-- Đánh giá sự cần thiết: Bảng này độc lập để lưu trữ nhiều đợt khảo sát theo thời gian,
-- theo dõi sự tiến triển của điểm nóng giao thông trước và sau can thiệp.
CREATE TABLE IF NOT EXISTS public.hotspot_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id UUID NOT NULL REFERENCES public.hotspots(id) ON DELETE CASCADE,
  surveyor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  findings TEXT NOT NULL,                                -- Ghi nhận tại hiện trường
  recorded_risk_level hotspot_severity_enum NOT NULL,    -- Đánh giá nguy cơ tại thời điểm khảo sát
  recommendations TEXT,                                  -- Đề xuất giải pháp (phân luồng, biển báo...)
  survey_media_paths TEXT[] DEFAULT '{}',                -- Danh sách ảnh hiện trường
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. BẢNG PHẢN ÁNH THÔ TỪ CỘNG ĐỒNG (reports)
-- Là dữ liệu nguồn thô, tuyệt đối không bao giờ hiển thị công khai riêng lẻ
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code_hash TEXT NOT NULL UNIQUE,               -- Hash SHA-256 mã tra cứu (chống dò mã)
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  hotspot_id UUID REFERENCES public.hotspots(id) ON DELETE SET NULL, -- Quan hệ N-1 (1 Report chỉ thuộc tối đa 1 Hotspot)
  issue_type issue_type_enum NOT NULL,
  description TEXT NOT NULL,
  actual_lat DOUBLE PRECISION NOT NULL CHECK (actual_lat BETWEEN -90 AND 90),
  actual_lng DOUBLE PRECISION NOT NULL CHECK (actual_lng BETWEEN -180 AND 180),
  occurred_at TIMESTAMPTZ NOT NULL,                      -- Thời điểm sự việc xảy ra
  time_window TEXT NOT NULL,                             -- Khung giờ tập trung
  verification_status verification_status_enum NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,                                 -- Bắt buộc khi verification_status = 'invalid'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RÀNG BUỘC BẮT BUỘC LÝ DO KHI BỊ INVALID
  CONSTRAINT chk_report_rejection_reason CHECK (
    (verification_status = 'invalid' AND rejection_reason IS NOT NULL AND char_length(trim(rejection_reason)) >= 5)
    OR
    (verification_status != 'invalid')
  ),

  -- RÀNG BUỘC NGƯỜI XÁC MINH VÀ THỜI ĐIỂM KHI KHÔNG CÒN LÀ PENDING
  CONSTRAINT chk_report_reviewed_integrity CHECK (
    (verification_status = 'pending')
    OR
    (verification_status IN ('verified', 'invalid') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

-- 6. BẢNG QUẢN LÝ PHƯƠNG TIỆN / HÌNH ẢNH (report_media)
CREATE TABLE IF NOT EXISTS public.report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  original_file_path TEXT NOT NULL,                      -- Đường dẫn trong bucket riêng tư (private-reports)
  file_type TEXT NOT NULL CHECK (file_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880), -- Tối đa 5MB
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  privacy_processing_status TEXT NOT NULL DEFAULT 'raw', -- 'raw', 'blurred', 'approved'
  processed_file_path TEXT,                              -- Đường dẫn trong bucket công khai (public-hotspots)
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RÀNG BUỘC: Khi đã approved công khai thì bắt buộc phải có ảnh đã làm mờ/xử lý
  CONSTRAINT chk_media_processed_path CHECK (
    (privacy_processing_status = 'approved' AND processed_file_path IS NOT NULL AND processed_by IS NOT NULL)
    OR
    (privacy_processing_status != 'approved')
  )
);

-- 7. BẢNG NHẬT KÝ HỆ THỐNG (audit_logs - Bất biến & Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                                  -- 'VERIFY_REPORT', 'REJECT_REPORT', 'PUBLISH_HOTSPOT', v.v.
  object_type TEXT NOT NULL,                             -- 'report', 'hotspot', 'profile', 'school', 'survey'
  object_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
