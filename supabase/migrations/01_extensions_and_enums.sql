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
