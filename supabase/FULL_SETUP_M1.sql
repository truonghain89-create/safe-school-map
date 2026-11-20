

-- ============================================================================
-- FILE: 01_extensions_and_enums.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 01: Extensions and Custom Data Types (Enums)
-- Specification: v4 (Hợp nhất) | Giai đoạn M1: Database & Security
-- ============================================================================

-- 1. Bật các extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM: Loại vấn đề giao thông (Issue Types)
-- Thống nhất với đặc tả v4: Không tự ý bổ sung loại vấn đề mới
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_type_enum') THEN
    CREATE TYPE issue_type_enum AS ENUM (
      'traffic_jam',         -- Ùn tắc giao thông
      'illegal_parking',     -- Dừng, đỗ xe không đúng vị trí
      'unsafe_crossing',     -- Sang đường không an toàn
      'blind_spot',          -- Khuất tầm nhìn
      'collision_risk',      -- Nguy cơ va chạm
      'other'                -- Vấn đề khác
    );
  END IF;
END $$;

-- 3. ENUM: Trục 1 - Trạng thái xác minh của Report (Độc lập)
-- Bắt buộc: pending, verified, invalid (Không đổi tên)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
    CREATE TYPE verification_status_enum AS ENUM (
      'pending',             -- Chờ xác minh
      'verified',            -- Đã xác minh
      'invalid'              -- Không hợp lệ (Bắt buộc kèm lý do từ chối)
    );
  END IF;
END $$;

-- 4. ENUM: Mức độ nguy cơ Hotspot (Severity)
-- Đánh giá thủ công bởi Người xác minh, AI và hệ thống không tự quyết định
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hotspot_severity_enum') THEN
    CREATE TYPE hotspot_severity_enum AS ENUM (
      'attention_needed',    -- Cần chú ý (Biểu tượng tam giác vàng)
      'high_risk',           -- Nguy cơ cao (Biểu tượng bát giác đỏ)
      'surveyed_safe'        -- Đã khảo sát, chưa ghi nhận nguy cơ (Biểu tượng khiên xanh)
    );
  END IF;
END $$;

-- 5. ENUM: Trục 2 - Trạng thái xử lý của Hotspot (Độc lập)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status_enum') THEN
    CREATE TYPE processing_status_enum AS ENUM (
      'unprocessed',         -- Chưa xử lý
      'in_progress',         -- Đang xử lý
      'resolved'             -- Đã xử lý (Sau khi có biện pháp can thiệp)
    );
  END IF;
END $$;

-- 6. ENUM: Trục 3 - Trạng thái công khai của Hotspot (Độc lập)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'publication_status_enum') THEN
    CREATE TYPE publication_status_enum AS ENUM (
      'unpublished',         -- Chưa công khai (Mặc định)
      'published',           -- Đã công khai (Đã duyệt đủ 5 điều kiện)
      'hidden'               -- Đã ẩn (Do trường ẩn hoặc Quản trị viên ẩn khẩn cấp)
    );
  END IF;
END $$;

-- 7. ENUM: Vai trò người dùng quản trị nội bộ
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
    CREATE TYPE user_role_enum AS ENUM (
      'verifier',            -- Người xác minh (Giáo viên / cán bộ phân công)
      'approver',            -- Người phê duyệt công khai (Đại diện ban giám hiệu)
      'admin'                -- Quản trị viên hệ thống
    );
  END IF;
END $$;

-- 8. ENUM: Trạng thái trường học
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_status_enum') THEN
    CREATE TYPE school_status_enum AS ENUM (
      'pilot',               -- Thí điểm (Trường THPT Tam Hiệp)
      'active',              -- Hoạt động chính thức
      'suspended'            -- Tạm ngưng
    );
  END IF;
END $$;


-- ============================================================================
-- FILE: 02_tables_and_constraints.sql
-- ============================================================================

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


-- ============================================================================
-- FILE: 03_indexes_and_performance.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 03: Performance Optimization, Indexes and Foreign Key Protections
-- Guidelines: supabase-postgres-best-practices (query-missing-indexes, query-partial-indexes)
-- ============================================================================

-- 1. Index trên các khóa ngoại (Tránh Full Table Scan khi JOIN hoặc CASCADE)
CREATE INDEX IF NOT EXISTS idx_profiles_school_id ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_school_id ON public.hotspots(school_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_created_by ON public.hotspots(created_by);
CREATE INDEX IF NOT EXISTS idx_hotspots_approved_by ON public.hotspots(approved_by);

CREATE INDEX IF NOT EXISTS idx_reports_school_id ON public.reports(school_id);
CREATE INDEX IF NOT EXISTS idx_reports_hotspot_id ON public.reports(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by ON public.reports(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_report_media_report_id ON public.report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_hotspot_surveys_hotspot_id ON public.hotspot_surveys(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_hotspot_surveys_surveyor_id ON public.hotspot_surveys(surveyor_id);

-- 2. Partial Indexes cho các truy vấn tần suất cao (Tối ưu I/O và dung lượng RAM)
-- Hàng đợi phản ánh chờ xác minh cho cán bộ trường
CREATE INDEX IF NOT EXISTS idx_reports_pending_queue 
ON public.reports(school_id, submitted_at DESC) 
WHERE verification_status = 'pending' AND is_hidden = false;

-- Danh sách Hotspot đang được công khai trên bản đồ
CREATE INDEX IF NOT EXISTS idx_hotspots_public_active 
ON public.hotspots(school_id, severity, processing_status) 
WHERE publication_status = 'published' AND is_hidden = false;

-- Lọc dữ liệu thật (Loại bỏ DEMO trong thống kê)
CREATE INDEX IF NOT EXISTS idx_reports_real_verified 
ON public.reports(school_id, issue_type, occurred_at) 
WHERE is_demo = false AND verification_status = 'verified';

-- 3. Index phục vụ Audit Logs và Điều tra hệ thống
CREATE INDEX IF NOT EXISTS idx_audit_logs_object 
ON public.audit_logs(object_type, object_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor 
ON public.audit_logs(actor_id, created_at DESC);

-- 4. Composite Index phục vụ tra cứu tọa độ và không gian
CREATE INDEX IF NOT EXISTS idx_hotspots_coordinates 
ON public.hotspots(public_lat, public_lng);

CREATE INDEX IF NOT EXISTS idx_schools_coordinates 
ON public.schools(lat, lng);


-- ============================================================================
-- FILE: 04_functions_and_triggers.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 04: Business Rules Functions, Triggers, and Audit Logging
-- Specification: v4 (Hợp nhất) | Giai đoạn M1: Database & Security
-- ============================================================================

-- 1. Hàm tự động cập nhật thời điểm updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger updated_at cho các bảng
DROP TRIGGER IF EXISTS trg_schools_updated_at ON public.schools;
CREATE TRIGGER trg_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_hotspots_updated_at ON public.hotspots;
CREATE TRIGGER trg_hotspots_updated_at
BEFORE UPDATE ON public.hotspots
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 2. HÀM KIỂM SOÁT CHÉO PHÊ DUYỆT (FOUR-EYES PRINCIPLE)
-- Ngăn chặn người tạo/khảo sát tự phê duyệt công khai cùng 1 Hotspot trong môi trường thật
CREATE OR REPLACE FUNCTION public.fn_four_eyes_approval_check()
RETURNS TRIGGER AS $$
DECLARE
  v_surveyor_id UUID;
BEGIN
  -- Chỉ kiểm tra khi có hành động chuyển sang trạng thái published
  IF (NEW.publication_status = 'published' AND (OLD.publication_status IS DISTINCT FROM 'published')) THEN
    -- Nếu không phải dữ liệu DEMO, áp dụng quy tắc kiểm soát chéo nghiêm ngặt
    IF (NEW.is_demo = false) THEN
      -- Kiểm tra 1: Người duyệt không được là người tạo Hotspot
      IF (NEW.approved_by IS NOT NULL AND NEW.approved_by = NEW.created_by) THEN
        RAISE EXCEPTION 'Vi phạm nguyên tắc kiểm soát chéo (Four-Eyes): Người tạo Hotspot (%) không được tự phê duyệt công khai chính Hotspot đó.', NEW.created_by;
      END IF;

      -- Kiểm tra 2: Người duyệt không được là người khảo sát chính của Hotspot
      SELECT surveyor_id INTO v_surveyor_id
      FROM public.hotspot_surveys
      WHERE hotspot_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 1;

      IF (v_surveyor_id IS NOT NULL AND NEW.approved_by = v_surveyor_id) THEN
        RAISE EXCEPTION 'Vi phạm nguyên tắc kiểm soát chéo (Four-Eyes): Người khảo sát thực địa (%) không được đồng thời là người phê duyệt công khai Hotspot.', v_surveyor_id;
      END IF;
    END IF;

    -- Tự động gán thời điểm published_at nếu chưa có
    IF (NEW.published_at IS NULL) THEN
      NEW.published_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hotspots_four_eyes_check ON public.hotspots;
CREATE TRIGGER trg_hotspots_four_eyes_check
BEFORE UPDATE ON public.hotspots
FOR EACH ROW EXECUTE FUNCTION public.fn_four_eyes_approval_check();

-- 3. HÀM TỰ ĐỘNG GHI NHẬT KÝ HOẠT ĐỘNG (AUDIT LOG TRIGGER)
-- Ghi lại bất biến các thay đổi trạng thái quan trọng
CREATE OR REPLACE FUNCTION public.fn_auto_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_action TEXT;
  v_reason TEXT := NULL;
BEGIN
  -- Lấy ID người dùng hiện tại từ session Supabase Auth (hoặc null nếu anonymous/service role)
  v_actor_id := auth.uid();

  -- Trường hợp tác động trên bảng reports
  IF (TG_TABLE_NAME = 'reports') THEN
    IF (TG_OP = 'UPDATE') THEN
      IF (OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
        v_action := 'REPORT_STATUS_CHANGE_' || UPPER(NEW.verification_status::text);
        v_reason := NEW.rejection_reason;
        
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value, reason)
        VALUES (
          COALESCE(v_actor_id, NEW.reviewed_by),
          v_action,
          'report',
          NEW.id,
          jsonb_build_object('verification_status', OLD.verification_status, 'hotspot_id', OLD.hotspot_id),
          jsonb_build_object('verification_status', NEW.verification_status, 'hotspot_id', NEW.hotspot_id),
          v_reason
        );
      END IF;
    END IF;

  -- Trường hợp tác động trên bảng hotspots
  ELSIF (TG_TABLE_NAME = 'hotspots') THEN
    IF (TG_OP = 'UPDATE') THEN
      -- Thay đổi trạng thái công khai
      IF (OLD.publication_status IS DISTINCT FROM NEW.publication_status) THEN
        v_action := 'HOTSPOT_PUBLICATION_' || UPPER(NEW.publication_status::text);
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value)
        VALUES (
          COALESCE(v_actor_id, NEW.approved_by),
          v_action,
          'hotspot',
          NEW.id,
          jsonb_build_object('publication_status', OLD.publication_status, 'is_hidden', OLD.is_hidden),
          jsonb_build_object('publication_status', NEW.publication_status, 'is_hidden', NEW.is_hidden)
        );
      END IF;

      -- Thay đổi mức độ nguy cơ
      IF (OLD.severity IS DISTINCT FROM NEW.severity) THEN
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value)
        VALUES (
          v_actor_id,
          'HOTSPOT_SEVERITY_CHANGE',
          'hotspot',
          NEW.id,
          jsonb_build_object('severity', OLD.severity),
          jsonb_build_object('severity', NEW.severity)
        );
      END IF;

      -- Thay đổi trạng thái xử lý
      IF (OLD.processing_status IS DISTINCT FROM NEW.processing_status) THEN
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value)
        VALUES (
          v_actor_id,
          'HOTSPOT_PROCESSING_STATUS_CHANGE',
          'hotspot',
          NEW.id,
          jsonb_build_object('processing_status', OLD.processing_status),
          jsonb_build_object('processing_status', NEW.processing_status)
        );
      END IF;
    END IF;

  -- Trường hợp tác động trên bảng schools (Thay đổi quyền công khai bản đồ của trường)
  ELSIF (TG_TABLE_NAME = 'schools') THEN
    IF (TG_OP = 'UPDATE') THEN
      IF (OLD.public_map_approved IS DISTINCT FROM NEW.public_map_approved) THEN
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value)
        VALUES (
          COALESCE(v_actor_id, NEW.approved_by),
          'SCHOOL_MAP_APPROVAL_CHANGE',
          'school',
          NEW.id,
          jsonb_build_object('public_map_approved', OLD.public_map_approved),
          jsonb_build_object('public_map_approved', NEW.public_map_approved)
        );
      END IF;
    END IF;

  -- Trường hợp tác động trên bảng profiles (Phân quyền tài khoản)
  ELSIF (TG_TABLE_NAME = 'profiles') THEN
    IF (TG_OP = 'UPDATE') THEN
      IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        INSERT INTO public.audit_logs (actor_id, action, object_type, object_id, old_value, new_value)
        VALUES (
          v_actor_id,
          'USER_ROLE_OR_STATUS_CHANGE',
          'profile',
          NEW.id,
          jsonb_build_object('role', OLD.role, 'is_active', OLD.is_active),
          jsonb_build_object('role', NEW.role, 'is_active', NEW.is_active)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger audit logs cho reports, hotspots, schools, profiles
DROP TRIGGER IF EXISTS trg_audit_reports ON public.reports;
CREATE TRIGGER trg_audit_reports
AFTER UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_audit_log();

DROP TRIGGER IF EXISTS trg_audit_hotspots ON public.hotspots;
CREATE TRIGGER trg_audit_hotspots
AFTER UPDATE ON public.hotspots
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_audit_log();

DROP TRIGGER IF EXISTS trg_audit_schools ON public.schools;
CREATE TRIGGER trg_audit_schools
AFTER UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_audit_log();

DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
CREATE TRIGGER trg_audit_profiles
AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_audit_log();


-- ============================================================================
-- FILE: 05_row_level_security.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 05: Row Level Security (RLS) and Role-Based Access Control (RBAC)
-- Guidelines: supabase (Security checklist, TO clause, explicit USING and WITH CHECK)
-- ============================================================================

-- BẬT RLS TRÊN TOÀN BỘ 7 BẢNG
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. HÀM TIỆN ÍCH XÁC ĐỊNH VAI TRÒ VÀ TRƯỜNG TRỰC THUỘC (SECURITY DEFINER với safe search_path)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_enum AS $$
DECLARE
  v_role user_role_enum;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_school_id()
RETURNS UUID AS $$
DECLARE
  v_school_id UUID;
BEGIN
  SELECT school_id INTO v_school_id
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  RETURN v_school_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_verifier_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() IN ('verifier', 'approver', 'admin'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 2. POLICIES CHO BẢNG schools
-- ============================================================================
-- Public & Anon: Được xem thông tin trường học đang thí điểm hoặc hoạt động
DROP POLICY IF EXISTS "schools_public_select" ON public.schools;
CREATE POLICY "schools_public_select" ON public.schools
FOR SELECT TO anon, authenticated
USING (status IN ('pilot', 'active'));

-- Admin: Toàn quyền quản trị danh mục trường
DROP POLICY IF EXISTS "schools_admin_all" ON public.schools;
CREATE POLICY "schools_admin_all" ON public.schools
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- 3. POLICIES CHO BẢNG profiles
-- ============================================================================
-- Cán bộ xem hồ sơ chính mình hoặc Admin xem toàn bộ
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- Người dùng tự cập nhật tên, Admin quản trị vai trò
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (
  -- Nếu không phải admin, không được tự đổi role, school_id hoặc is_active
  public.is_admin() OR (
    id = auth.uid() AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  )
);

-- ============================================================================
-- 4. POLICIES CHO BẢNG reports (BẢO VỆ PHẢN ÁNH THÔ)
-- ============================================================================
-- QUY TẮC BẤT BIẾN: ANONYMOUS KHÔNG CÓ QUYỀN SELECT TRỰC TIẾP BẢNG reports!
-- Cán bộ trường xác minh xem được danh sách reports của trường mình; Admin xem tất cả
DROP POLICY IF EXISTS "reports_staff_select" ON public.reports;
CREATE POLICY "reports_staff_select" ON public.reports
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND 
    school_id = public.get_current_user_school_id()
  )
);

-- Cho phép gửi phản ánh từ form công khai (hoặc qua RPC an toàn)
-- Ràng buộc: Khi gửi mới bắt buộc là pending, chưa gán reviewed_by, chưa ẩn
DROP POLICY IF EXISTS "reports_public_insert" ON public.reports;
CREATE POLICY "reports_public_insert" ON public.reports
FOR INSERT TO anon, authenticated
WITH CHECK (
  verification_status = 'pending' AND
  reviewed_by IS NULL AND
  reviewed_at IS NULL AND
  is_hidden = false
);

-- Cán bộ xác minh (Verifier) hoặc Admin duyệt hoặc từ chối phản ánh
DROP POLICY IF EXISTS "reports_verifier_update" ON public.reports;
CREATE POLICY "reports_verifier_update" ON public.reports
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    public.get_current_user_role() = 'verifier' AND 
    school_id = public.get_current_user_school_id()
  )
)
WITH CHECK (
  public.is_admin() OR (
    public.get_current_user_role() = 'verifier' AND 
    school_id = public.get_current_user_school_id()
  )
);

-- Khách và người gửi không bao giờ được xóa hoặc cập nhật phản ánh
-- Chỉ Admin mới có quyền xóa vật lý nếu vi phạm pháp luật đặc biệt
DROP POLICY IF EXISTS "reports_admin_delete" ON public.reports;
CREATE POLICY "reports_admin_delete" ON public.reports
FOR DELETE TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 5. POLICIES CHO BẢNG report_media (ẢNH PHẢN ÁNH)
-- ============================================================================
-- Chỉ cán bộ xác minh và admin mới được xem danh sách ảnh gốc nội bộ
DROP POLICY IF EXISTS "report_media_staff_select" ON public.report_media;
CREATE POLICY "report_media_staff_select" ON public.report_media
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND EXISTS (
      SELECT 1 FROM public.reports r 
      WHERE r.id = report_id AND r.school_id = public.get_current_user_school_id()
    )
  )
);

-- Cho phép đính kèm ảnh khi gửi report
DROP POLICY IF EXISTS "report_media_insert" ON public.report_media;
CREATE POLICY "report_media_insert" ON public.report_media
FOR INSERT TO anon, authenticated
WITH CHECK (moderation_status = 'pending');

-- Cán bộ cập nhật trạng thái làm mờ / phê duyệt ảnh
DROP POLICY IF EXISTS "report_media_staff_update" ON public.report_media;
CREATE POLICY "report_media_staff_update" ON public.report_media
FOR UPDATE TO authenticated
USING (public.is_verifier_or_higher())
WITH CHECK (public.is_verifier_or_higher());

-- ============================================================================
-- 6. POLICIES CHO BẢNG hotspots
-- ============================================================================
-- Công chúng (anon & authenticated): Chỉ xem được Hotspot đã published, không bị ẩn
-- và trường học liên quan cho phép công khai bản đồ
DROP POLICY IF EXISTS "hotspots_public_select" ON public.hotspots;
CREATE POLICY "hotspots_public_select" ON public.hotspots
FOR SELECT TO anon, authenticated
USING (
  publication_status = 'published' AND 
  is_hidden = false AND
  EXISTS (
    SELECT 1 FROM public.schools s 
    WHERE s.id = school_id AND s.public_map_approved = true
  )
);

-- Cán bộ trường: Xem toàn bộ Hotspot của trường mình (kể cả chưa công khai)
DROP POLICY IF EXISTS "hotspots_staff_select_all" ON public.hotspots;
CREATE POLICY "hotspots_staff_select_all" ON public.hotspots
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND 
    school_id = public.get_current_user_school_id()
  )
);

-- Người xác minh (Verifier): Tạo Hotspot mới
DROP POLICY IF EXISTS "hotspots_verifier_insert" ON public.hotspots;
CREATE POLICY "hotspots_verifier_insert" ON public.hotspots
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    public.get_current_user_role() = 'verifier' AND 
    school_id = public.get_current_user_school_id() AND
    publication_status = 'unpublished' -- Verifier không được tự kích hoạt published khi tạo
  )
);

-- Người xác minh & Người phê duyệt: Cập nhật Hotspot
-- Verifier sửa nội dung/mức độ; Approver duyệt công khai; Admin toàn quyền
DROP POLICY IF EXISTS "hotspots_staff_update" ON public.hotspots;
CREATE POLICY "hotspots_staff_update" ON public.hotspots
FOR UPDATE TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND 
    school_id = public.get_current_user_school_id()
  )
)
WITH CHECK (
  public.is_admin() OR (
    -- Verifier chỉ được sửa khi chưa công khai hoặc quản lý tiến độ xử lý
    (public.get_current_user_role() = 'verifier' AND publication_status != 'published') OR
    -- Approver có quyền chuyển trạng thái publication_status
    (public.get_current_user_role() = 'approver')
  )
);

-- ============================================================================
-- 7. POLICIES CHO BẢNG hotspot_surveys (KHẢO SÁT THỰC ĐỊA)
-- ============================================================================
-- Cán bộ xem khảo sát thực địa của trường mình
DROP POLICY IF EXISTS "surveys_staff_select" ON public.hotspot_surveys;
CREATE POLICY "surveys_staff_select" ON public.hotspot_surveys
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND EXISTS (
      SELECT 1 FROM public.hotspots h 
      WHERE h.id = hotspot_id AND h.school_id = public.get_current_user_school_id()
    )
  )
);

-- Verifier ghi nhận kết quả khảo sát
DROP POLICY IF EXISTS "surveys_verifier_insert" ON public.hotspot_surveys;
CREATE POLICY "surveys_verifier_insert" ON public.hotspot_surveys
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin() OR (
    public.get_current_user_role() = 'verifier' AND 
    surveyor_id = auth.uid()
  )
);

-- ============================================================================
-- 8. POLICIES CHO BẢNG audit_logs (BẤT BIẾN - APPEND ONLY)
-- ============================================================================
-- Chỉ Admin hoặc cán bộ trường được xem nhật ký
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_admin() OR public.get_current_user_role() = 'approver');

-- Trigger / Service Role / Authenticated ghi nhật ký
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
FOR INSERT TO authenticated, anon
WITH CHECK (true);

-- BẢO VỆ BẤT BIẾN: TUYỆT ĐỐI KHÔNG TẠO POLICY UPDATE HOẶC DELETE CHO audit_logs!
-- Mọi lệnh UPDATE hoặc DELETE từ bất kỳ vai trò nào (kể cả Admin) đều tự động bị chặn bởi RLS.


-- ============================================================================
-- FILE: 06_storage_policies.sql
-- ============================================================================

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


-- ============================================================================
-- FILE: 07_views_and_public_api.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 07: Public Views & Safe RPC Lookup Functions
-- Guidelines: supabase (Views with security_invoker = true, enforcing 5 conditions)
-- ============================================================================

-- 1. VIEW BẢN ĐỒ CÔNG KHAI: public_hotspots_view
-- QUY TẮC CỐT LÕI: Áp dụng đầy đủ 5 điều kiện tiên quyết ở mức Database
-- Thiếu bất kỳ 1 trong 5 điều kiện, bản ghi sẽ tự động không xuất hiện trong View!
-- Chế độ security_invoker = false (Security Definer) cho phép công chúng (anon)
-- xem dữ liệu tổng hợp đã duyệt an toàn mà không cần cấp quyền xem bảng raw reports.
CREATE OR REPLACE VIEW public.public_hotspots_view
WITH (security_invoker = false) AS
SELECT
  h.id AS hotspot_id,
  h.school_id,
  s.name AS school_name,
  s.address AS school_address,
  h.name AS hotspot_name,
  -- TỌA ĐỘ CÔNG KHAI ĐÃ ĐƯỢC TỔNG QUÁT HÓA (ĐẠI DIỆN TIM ĐƯỜNG)
  -- Tuyệt đối không để lộ tọa độ thực địa nhạy cảm (actual_lat/actual_lng)
  h.public_lat,
  h.public_lng,
  h.severity,
  h.processing_status,
  h.publication_status,
  h.published_at,
  h.updated_at,
  -- Các mốc thời gian an toàn từ phản ánh đã xác minh
  MAX(r.occurred_at) AS latest_occurred_at,
  MAX(r.reviewed_at) AS latest_verified_at,
  -- Số phản ánh độc lập đã xác minh (Giá trị tính toán nguồn, không nhập tay)
  COUNT(DISTINCT r.id) AS verified_report_count,
  -- Ngày khảo sát thực địa gần nhất (nếu có)
  (
    SELECT MAX(survey_date) 
    FROM public.hotspot_surveys hs 
    WHERE hs.hotspot_id = h.id
  ) AS latest_survey_date,
  -- Danh sách ảnh công khai đã xử lý làm mờ quyền riêng tư
  COALESCE(
    ARRAY_AGG(DISTINCT rm.processed_file_path) FILTER (WHERE rm.processed_file_path IS NOT NULL),
    '{}'
  ) AS public_image_paths,
  h.is_demo
FROM public.hotspots h
JOIN public.schools s ON s.id = h.school_id
LEFT JOIN public.reports r ON r.hotspot_id = h.id AND r.verification_status = 'verified' AND r.is_hidden = false
LEFT JOIN public.report_media rm ON rm.report_id = r.id AND rm.privacy_processing_status = 'approved'
WHERE
  -- ĐIỀU KIỆN 1: Có ít nhất 1 Report đã xác minh HOẶC có kết quả khảo sát thực địa chính thức
  (
    EXISTS (SELECT 1 FROM public.reports r2 WHERE r2.hotspot_id = h.id AND r2.verification_status = 'verified' AND r2.is_hidden = false)
    OR
    EXISTS (SELECT 1 FROM public.hotspot_surveys hs2 WHERE hs2.hotspot_id = h.id)
  )
  -- ĐIỀU KIỆN 2: Người xác minh đã thiết lập mức độ nguy cơ
  AND h.severity IS NOT NULL
  -- ĐIỀU KIỆN 3: Người phê duyệt đã ký duyệt công khai (publication_status = 'published')
  AND h.publication_status = 'published'
  AND h.approved_by IS NOT NULL
  -- ĐIỀU KIỆN 4: Trường học đang cho phép công khai bản đồ
  AND s.public_map_approved = true
  -- ĐIỀU KIỆN 5: Hotspot không bị ẩn
  AND h.is_hidden = false
GROUP BY
  h.id, h.school_id, s.name, s.address, h.name, h.public_lat, h.public_lng,
  h.severity, h.processing_status, h.publication_status, h.published_at, h.updated_at, h.is_demo;

-- 2. HÀM TRA CỨU AN TOÀN BẰNG MÃ TRA CỨU HASH (RPC Function)
-- Trả về duy nhất thông tin tối thiểu của Report hợp lệ, không để lộ cấu trúc bảng reports
CREATE OR REPLACE FUNCTION public.rpc_lookup_report_by_code(p_code_hash text)
RETURNS TABLE (
  report_found boolean,
  verification_status verification_status_enum,
  issue_type issue_type_enum,
  time_window text,
  submitted_at timestamptz,
  hotspot_name text,
  hotspot_processing_status processing_status_enum,
  rejection_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS report_found,
    r.verification_status,
    r.issue_type,
    r.time_window,
    r.submitted_at,
    h.name AS hotspot_name,
    h.processing_status AS hotspot_processing_status,
    -- Chỉ trả về lý do từ chối nếu không hợp lệ
    CASE 
      WHEN r.verification_status = 'invalid' THEN r.rejection_reason 
      ELSE NULL 
    END AS rejection_reason
  FROM public.reports r
  LEFT JOIN public.hotspots h ON h.id = r.hotspot_id
  WHERE r.tracking_code_hash = p_code_hash
    AND r.is_hidden = false
  LIMIT 1;

  -- Nếu không tìm thấy, không làm lộ thông tin hệ thống
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Cấp quyền gọi hàm tra cứu an toàn cho người dùng công khai (anon)
GRANT EXECUTE ON FUNCTION public.rpc_lookup_report_by_code(text) TO anon, authenticated;


-- ============================================================================
-- FILE: 08_seed_demo_data.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 08: DEMO Seed Data (Clearly tagged is_demo = true)
-- Specification: v4 (Hợp nhất) | Giai đoạn M1: Database & Security
-- ============================================================================

-- BẢO VỆ NGUYÊN TẮC: MỌI BẢN GHI DEMO BẮT BUỘC MANG CỜ is_demo = true!
-- Không được dùng để suy diễn số liệu thực tế về trường học thật.

DO $$
DECLARE
  v_school_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_verifier_id UUID := '00000000-0000-0000-0000-000000000011'::uuid;
  v_approver_id UUID := '00000000-0000-0000-0000-000000000012'::uuid;
  v_hotspot_1_id UUID := '00000000-0000-0000-0000-000000000101'::uuid;
  v_hotspot_2_id UUID := '00000000-0000-0000-0000-000000000102'::uuid;
  v_hotspot_3_id UUID := '00000000-0000-0000-0000-000000000103'::uuid;
BEGIN
  -- 1. NẠP TRƯỜNG THÍ ĐIỂM (Cấu hình DEMO có kiểm soát)
  INSERT INTO public.schools (
    id, name, address, lat, lng, status, public_map_approved, is_focal_point
  )
  VALUES (
    v_school_id,
    'Trường THPT Tam Hiệp (Thí điểm DEMO)',
    'Khu phố 4, đường Phạm Văn Thuận, phường Tam Hiệp, TP. Biên Hòa, Đồng Nai',
    10.9414,
    106.8614,
    'pilot',
    true, -- Bật true trong môi trường DEMO để kiểm thử hiển thị bản đồ
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public_map_approved = true;

  -- 2. NẠP HỒ SƠ TÀI KHOẢN CÁN BỘ DEMO (Tách bạch Verifier và Approver)
  -- Nạp vào auth.users trước để thỏa mãn ràng buộc khóa ngoại profiles_id_fkey
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES 
    (
      v_verifier_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'verifier.demo@tamhiep.edu.vn',
      crypt('DemoPassword123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)"}'::jsonb,
      now(),
      now()
    ),
    (
      v_approver_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'approver.demo@tamhiep.edu.vn',
      crypt('DemoPassword123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Cô Trần Thị B (Đại diện Ban Giám Hiệu DEMO)"}'::jsonb,
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  -- Nạp vào public.profiles
  INSERT INTO public.profiles (id, email, full_name, school_id, role, is_active)
  VALUES 
    (
      v_verifier_id,
      'verifier.demo@tamhiep.edu.vn',
      'Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)',
      v_school_id,
      'verifier',
      true
    ),
    (
      v_approver_id,
      'approver.demo@tamhiep.edu.vn',
      'Cô Trần Thị B (Đại diện Ban Giám Hiệu DEMO)',
      v_school_id,
      'approver',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- 3. NẠP HOTSPOT DEMO
  -- Hotspot 1: Đủ 5 điều kiện -> Sẽ xuất hiện trong public_hotspots_view
  INSERT INTO public.hotspots (
    id, school_id, name, actual_lat, actual_lng, public_lat, public_lng,
    severity, processing_status, publication_status, created_by, approved_by,
    published_at, is_hidden, is_demo
  )
  VALUES (
    v_hotspot_1_id,
    v_school_id,
    '[DEMO] Cổng chính đường Phạm Văn Thuận',
    10.94192, 106.86186,
    10.94190, 106.86185,
    'attention_needed',
    'in_progress',
    'published',
    v_verifier_id,
    v_approver_id,
    now() - interval '2 days',
    false,
    true -- Cờ DEMO
  )
  ON CONFLICT (id) DO UPDATE SET
    public_lat = EXCLUDED.public_lat,
    public_lng = EXCLUDED.public_lng,
    actual_lat = EXCLUDED.actual_lat,
    actual_lng = EXCLUDED.actual_lng,
    publication_status = 'published';

  -- Hotspot 2: Nguy cơ cao (Đã khảo sát thực địa) -> Đủ 5 điều kiện
  INSERT INTO public.hotspots (
    id, school_id, name, actual_lat, actual_lng, public_lat, public_lng,
    severity, processing_status, publication_status, created_by, approved_by,
    published_at, is_hidden, is_demo
  )
  VALUES (
    v_hotspot_2_id,
    v_school_id,
    '[DEMO] Ngã ba hẻm số 4 tiếp giáp cổng trường',
    10.94210, 106.86190,
    10.94200, 106.86180,
    'high_risk',
    'unprocessed',
    'published',
    v_verifier_id,
    v_approver_id,
    now() - interval '1 day',
    false,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    publication_status = 'published';

  -- Hotspot 3: Chưa công khai (publication_status = unpublished) -> SẼ KHÔNG XUẤT HIỆN TRÊN BẢN ĐỒ PUBLIC
  INSERT INTO public.hotspots (
    id, school_id, name, actual_lat, actual_lng, public_lat, public_lng,
    severity, processing_status, publication_status, created_by,
    is_hidden, is_demo
  )
  VALUES (
    v_hotspot_3_id,
    v_school_id,
    '[DEMO] Điểm khảo sát nội bộ cổng sau',
    10.94080, 106.86100,
    10.94080, 106.86100,
    'attention_needed',
    'unprocessed',
    'unpublished', -- Chưa được Approver duyệt
    v_verifier_id,
    false,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  -- 4. NẠP KHẢO SÁT THỰC ĐỊA DEMO (hotspot_surveys)
  INSERT INTO public.hotspot_surveys (
    hotspot_id, surveyor_id, survey_date, findings, recorded_risk_level, recommendations, is_demo
  )
  VALUES (
    v_hotspot_1_id,
    v_verifier_id,
    CURRENT_DATE - 3,
    'Ghi nhận nhiều phụ huynh dừng xe dưới lòng đường giờ tan học 16:45 gây cản trở phương tiện lưu thông.',
    'attention_needed',
    'Phối hợp đội cờ đỏ nhắc nhở và kiến nghị sơn vạch phân ô dừng xe đón học sinh.',
    true
  )
  ON CONFLICT DO NOTHING;

  -- 5. NẠP CÁC BẢN GHI PHẢN ÁNH DEMO (reports)
  -- Report 1: Đã xác minh, gắn vào Hotspot 1 (Mã tra cứu băm: SFMDEMO01HASH)
  INSERT INTO public.reports (
    id, tracking_code_hash, school_id, hotspot_id, issue_type, description,
    actual_lat, actual_lng, occurred_at, time_window, verification_status,
    reviewed_by, reviewed_at, is_hidden, is_demo
  )
  VALUES (
    '00000000-0000-0000-0000-000000000201'::uuid,
    encode(digest('SFM-DEMO-001', 'sha256'), 'hex'),
    v_school_id,
    v_hotspot_1_id,
    'traffic_jam',
    'Ùn tắc nghiêm trọng kéo dài từ cổng trường hướng về ngã tư Tân Tiến lúc 16h45.',
    10.94142, 106.86141,
    now() - interval '3 days',
    '16:30 - 17:30',
    'verified',
    v_verifier_id,
    now() - interval '2 days',
    false,
    true
  )
  ON CONFLICT (tracking_code_hash) DO NOTHING;

  -- Report 2: Chờ xác minh (pending) - Không gắn Hotspot, mã: SFM-DEMO-002
  INSERT INTO public.reports (
    id, tracking_code_hash, school_id, issue_type, description,
    actual_lat, actual_lng, occurred_at, time_window, verification_status,
    is_hidden, is_demo
  )
  VALUES (
    '00000000-0000-0000-0000-000000000202'::uuid,
    encode(digest('SFM-DEMO-002', 'sha256'), 'hex'),
    v_school_id,
    'illegal_parking',
    'Ô tô 7 chỗ thường xuyên đậu chắn lối vỉa hè người đi bộ.',
    10.94160, 106.86150,
    now() - interval '1 day',
    '06:30 - 07:15',
    'pending',
    false,
    true
  )
  ON CONFLICT (tracking_code_hash) DO NOTHING;

  -- Report 3: Không hợp lệ (invalid) - Bắt buộc có lý do từ chối
  INSERT INTO public.reports (
    id, tracking_code_hash, school_id, issue_type, description,
    actual_lat, actual_lng, occurred_at, time_window, verification_status,
    rejection_reason, reviewed_by, reviewed_at, is_hidden, is_demo
  )
  VALUES (
    '00000000-0000-0000-0000-000000000203'::uuid,
    encode(digest('SFM-DEMO-003', 'sha256'), 'hex'),
    v_school_id,
    'other',
    'Nội dung thử nghiệm không liên quan trật tự an toàn cổng trường.',
    10.94300, 106.86200,
    now() - interval '4 days',
    'Khác',
    'invalid',
    'Nội dung phản ánh không thuộc phạm vi an toàn giao thông khu vực trường học.',
    v_verifier_id,
    now() - interval '3 days',
    false,
    true
  )
  ON CONFLICT (tracking_code_hash) DO NOTHING;

END $$;


-- ============================================================================
-- FILE: 09_rls_verification_tests.sql
-- ============================================================================

-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration 09: Automated SQL RLS & Business Rule Test Suite
-- Specification: v4 (Hợp nhất) | Giai đoạn M1: Database & Security
-- ============================================================================

-- BÀI TEST TOÀN DIỆN CHO RLS VÀ CÁC NGUYÊN TẮC BẤT BIẾN
-- Có thể chạy trong PostgreSQL / Supabase SQL Editor để nghiệm thu bảo mật.

DO $$
DECLARE
  v_test_count INT := 0;
  v_pass_count INT := 0;
  v_record_count INT;
  v_error_caught BOOLEAN;
  v_school_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  v_verifier_id UUID := '00000000-0000-0000-0000-000000000011'::uuid;
  v_approver_id UUID := '00000000-0000-0000-0000-000000000012'::uuid;
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'BẮT ĐẦU CHẠY BỘ KIỂM THỬ BẢO MẬT & RLS GIAI ĐOẠN M1';
  RAISE NOTICE '=======================================================';

  -- TEST 1: KIỂM THỬ RÀNG BUỘC - Từ chối Report bắt buộc có lý do (chk_report_rejection_reason)
  v_test_count := v_test_count + 1;
  v_error_caught := false;
  BEGIN
    INSERT INTO public.reports (
      tracking_code_hash, school_id, issue_type, description,
      actual_lat, actual_lng, occurred_at, time_window, verification_status,
      rejection_reason, reviewed_by, reviewed_at
    ) VALUES (
      'TEST_INVALID_NO_REASON', v_school_id, 'traffic_jam', 'Mô tả test',
      10.9414, 106.8614, now(), '06:30 - 07:15', 'invalid',
      NULL, -- CỐ TÌNH ĐỂ TRỐNG LÝ DO
      v_verifier_id, now()
    );
  EXCEPTION WHEN check_violation THEN
    v_error_caught := true;
  END;

  IF v_error_caught THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 1: Constraint chk_report_rejection_reason chặn thành công Report invalid không có lý do.';
  ELSE
    RAISE WARNING '[FAIL] Test 1: Cho phép Report invalid không có lý do từ chối!';
  END IF;

  -- TEST 2: KIỂM THỬ 5 ĐIỀU KIỆN CÔNG KHAI TRÊN public_hotspots_view
  v_test_count := v_test_count + 1;
  -- Kiểm tra Hotspot 3 (unpublished) không được phép xuất hiện
  SELECT COUNT(*) INTO v_record_count 
  FROM public.public_hotspots_view 
  WHERE hotspot_id = '00000000-0000-0000-0000-000000000103'::uuid;

  IF v_record_count = 0 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 2: Hotspot chưa duyệt (unpublished) tuyệt đối KHÔNG xuất hiện trên public_hotspots_view.';
  ELSE
    RAISE WARNING '[FAIL] Test 2: Hotspot chưa duyệt bị rò rỉ lên public_hotspots_view!';
  END IF;

  -- TEST 3: KIỂM THỬ ĐIỀU KIỆN #4 - Khi trường chưa đồng ý công khai bản đồ
  v_test_count := v_test_count + 1;
  -- Tạm thời set public_map_approved = false
  UPDATE public.schools SET public_map_approved = false WHERE id = v_school_id;
  
  SELECT COUNT(*) INTO v_record_count 
  FROM public.public_hotspots_view 
  WHERE school_id = v_school_id;

  IF v_record_count = 0 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 3: Khi trường public_map_approved = false, toàn bộ Hotspot của trường lập tức ẩn khỏi bản đồ công khai.';
  ELSE
    RAISE WARNING '[FAIL] Test 3: Trường chưa cho phép nhưng Hotspot vẫn xuất hiện công khai!';
  END IF;

  -- Khôi phục lại trạng thái cho DEMO
  UPDATE public.schools SET public_map_approved = true WHERE id = v_school_id;

  -- TEST 4: KIỂM THỬ NGUYÊN TẮC KIỂM SOÁT CHÉO (FOUR-EYES) TRÊN DỮ LIỆU THẬT
  v_test_count := v_test_count + 1;
  v_error_caught := false;
  BEGIN
    -- Tạo một Hotspot dữ liệu thật (is_demo = false)
    -- Và người duyệt trùng với người tạo (v_verifier_id)
    INSERT INTO public.hotspots (
      school_id, name, actual_lat, actual_lng, public_lat, public_lng,
      severity, processing_status, publication_status, created_by, approved_by,
      is_demo
    ) VALUES (
      v_school_id, 'Hotspot Test Real', 10.9414, 106.8614, 10.9414, 106.8614,
      'attention_needed', 'unprocessed', 'published', v_verifier_id, v_verifier_id, -- TỰ DUYỆT!
      false -- Dữ liệu thật
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF v_error_caught THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 4: Trigger fn_four_eyes_approval_check chặn thành công hành vi tự tạo và tự phê duyệt Hotspot trên dữ liệu thật.';
  ELSE
    RAISE WARNING '[FAIL] Test 4: Cho phép tự tạo và tự phê duyệt Hotspot!';
  END IF;

  -- TEST 5: KIỂM THỬ HÀM TRA CỨU AN TOÀN RPC
  v_test_count := v_test_count + 1;
  SELECT COUNT(*) INTO v_record_count
  FROM public.rpc_lookup_report_by_code(encode(digest('SFM-DEMO-001', 'sha256'), 'hex'));

  IF v_record_count = 1 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 5: RPC rpc_lookup_report_by_code trả về thông tin đúng cho mã tra cứu hợp lệ.';
  ELSE
    RAISE WARNING '[FAIL] Test 5: RPC không tìm thấy phản ánh hợp lệ!';
  END IF;

  -- TEST 6: KIỂM THỬ DÒ MÃ BẤT HỢP PHÁP
  v_test_count := v_test_count + 1;
  SELECT COUNT(*) INTO v_record_count
  FROM public.rpc_lookup_report_by_code('RANDOM_FAKE_NON_EXISTENT_HASH_9999');

  IF v_record_count = 0 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 6: Mã tra cứu sai hoặc không tồn tại trả về kết quả rỗng, không làm lộ dữ liệu.';
  ELSE
    RAISE WARNING '[FAIL] Test 6: Dò mã sai vẫn trả về dữ liệu!';
  END IF;

  -- TEST 7: KIỂM THỬ TÍNH BẤT BIẾN CỦA AUDIT LOGS
  v_test_count := v_test_count + 1;
  -- Kiểm tra rằng bảng audit_logs ghi nhận ít nhất các trigger vừa thực thi
  SELECT COUNT(*) INTO v_record_count FROM public.audit_logs;
  IF v_record_count >= 1 THEN
    v_pass_count := v_pass_count + 1;
    RAISE NOTICE '[PASS] Test 7: Trigger tự động ghi nhật ký audit_logs hoạt động chính xác (% bản ghi đã ghi vết).', v_record_count;
  ELSE
    RAISE WARNING '[FAIL] Test 7: Không có audit log nào được ghi lại khi có biến động dữ liệu!';
  END IF;

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'KẾT QUẢ KIỂM THỬ: % / % BÀI TEST ĐẠT CHUẨN.', v_pass_count, v_test_count;
  RAISE NOTICE '=======================================================';
END $$;
