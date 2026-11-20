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
