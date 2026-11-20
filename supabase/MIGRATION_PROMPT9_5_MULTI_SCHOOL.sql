-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- MIGRATION PROMPT 9.5: NỀN TẢNG DỮ LIỆU ĐA TRƯỜNG HỌC, PHÂN QUYỀN VÀ PHÂN LUỒNG
-- Specification: v6 (Multi-School Foundation & Controlled Access)
-- ============================================================================

-- BẬT CÁC EXTENSION CẦN THIẾT
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CÁC KIỂU DỮ LIỆU ENUM MỚI
-- ============================================================================

-- 1.1. ENUM: Cấp học / Loại hình đào tạo (Education Level)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level_enum') THEN
    CREATE TYPE education_level_enum AS ENUM (
      'primary',          -- Tiểu học
      'secondary',        -- Trung học cơ sở (THCS)
      'high_school',      -- Trung học phổ thông (THPT)
      'vocational',       -- Giáo dục nghề nghiệp / Trung cấp
      'college',          -- Cao đẳng
      'university',       -- Đại học
      'unspecified'       -- Chưa xác định / Khác
    );
  END IF;
END $$;

-- 1.2. ENUM: Loại hình sở hữu trường học (School Type)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'school_type_enum') THEN
    CREATE TYPE school_type_enum AS ENUM (
      'public',           -- Công lập
      'private',          -- Tư thục
      'other',            -- Khác
      'unspecified'       -- Chưa xác định
    );
  END IF;
END $$;

-- 1.3. ENUM: Phạm vi phản ánh cộng đồng (Report Scope Type)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_scope_type_enum') THEN
    CREATE TYPE report_scope_type_enum AS ENUM (
      'school_specific',  -- Phản ánh liên quan trực tiếp đến một trường
      'near_school',      -- Phản ánh khu vực xung quanh trường
      'public_corridor',  -- Phản ánh trên tuyến đường hoặc khu vực công cộng
      'unknown_school'    -- Người gửi chưa xác định được trường liên quan
    );
  END IF;
END $$;

-- 1.4. ENUM: Trạng thái phân luồng tiếp nhận phản ánh (Routing Status)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routing_status_enum') THEN
    CREATE TYPE routing_status_enum AS ENUM (
      'unassigned',          -- Chưa phân công (Nằm trong hàng đợi chung)
      'assigned_to_school',  -- Đã phân công về trường cụ thể
      'regional_corridor'    -- Thuộc hành lang an toàn giao thông đô thị chung
    );
  END IF;
END $$;

-- ============================================================================
-- 2. MỞ RỘNG BẢNG schools (DANH MỤC TRƯỜNG ĐA CẤP HỌC)
-- ============================================================================

-- 2.1. Bổ sung các cột phân loại và kiểm chứng (Không phá vỡ dữ liệu cũ)
ALTER TABLE public.schools 
  ADD COLUMN IF NOT EXISTS education_level education_level_enum NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS school_type school_type_enum NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS ward TEXT,
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_public_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_approved_by UUID,
  ADD COLUMN IF NOT EXISTS location_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS parent_institution_name TEXT;

-- 2.2. Đồng bộ dữ liệu cũ: Thiết lập thông tin chuẩn mực cho bản ghi THPT Tam Hiệp
UPDATE public.schools
SET 
  education_level = 'high_school',
  school_type = 'public',
  ward = 'Tam Hiệp',
  verification_source = 'Quyết định thành lập / Dữ liệu đối chiếu OSM Relation 7154127',
  is_verified = true,
  location_public_approved = true,
  is_focal_point = false -- Hủy bỏ độc quyền trường trọng tâm
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ============================================================================
-- 3. NỚI LỎNG KHÓA NGOẠI VÀ RÀNG BUỘC CHO profiles, reports, hotspots
-- ============================================================================

-- 3.1. Bảng profiles: Cho phép Admin toàn hệ thống có school_id NULL
ALTER TABLE public.profiles ALTER COLUMN school_id DROP NOT NULL;

-- Bổ sung ràng buộc kiểm tra vai trò và phạm vi trường học của hồ sơ
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_school_scope'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profile_school_scope CHECK (
      (role = 'admin') 
      OR 
      (role IN ('verifier', 'approver') AND school_id IS NOT NULL)
    );
  END IF;
END $$;

-- 3.2. Bảng reports: Cho phép school_id NULL phục vụ phản ánh chung
ALTER TABLE public.reports ALTER COLUMN school_id DROP NOT NULL;

-- Bổ sung cột phạm vi và trạng thái phân luồng vào reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS scope_type report_scope_type_enum NOT NULL DEFAULT 'school_specific',
  ADD COLUMN IF NOT EXISTS routing_status routing_status_enum NOT NULL DEFAULT 'assigned_to_school';

-- Bổ sung ràng buộc tính toàn vẹn phạm vi phản ánh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_report_scope_integrity'
  ) THEN
    ALTER TABLE public.reports
    ADD CONSTRAINT chk_report_scope_integrity CHECK (
      (scope_type = 'school_specific' AND school_id IS NOT NULL)
      OR
      (scope_type IN ('near_school', 'public_corridor', 'unknown_school'))
    );
  END IF;
END $$;

-- 3.3. Bảng hotspots: Cho phép school_id NULL cho điểm nguy cơ hành lang đô thị
ALTER TABLE public.hotspots ALTER COLUMN school_id DROP NOT NULL;

-- ============================================================================
-- 4. BẢNG MỚI: NHẬT KÝ PHÂN LUỒNG PHẢN ÁNH (report_routing_logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_routing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  routed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  from_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  to_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  from_status routing_status_enum NOT NULL,
  to_status routing_status_enum NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bật RLS cho bảng mới
ALTER TABLE public.report_routing_logs ENABLE ROW LEVEL SECURITY;

-- Index tăng tốc truy vấn nhật ký phân luồng
CREATE INDEX IF NOT EXISTS idx_routing_logs_report_id ON public.report_routing_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_routing_logs_created_at ON public.report_routing_logs(created_at DESC);

-- ============================================================================
-- 5. CẬP NHẬT ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 5.1. Bảng schools: Công chúng chỉ xem trường đã xác minh và duyệt công khai vị trí
DROP POLICY IF EXISTS "schools_public_select" ON public.schools;
CREATE POLICY "schools_public_select" ON public.schools
FOR SELECT TO anon, authenticated
USING (
  (is_verified = true AND location_public_approved = true AND status != 'suspended')
  OR
  (status IN ('pilot', 'active')) -- Tương thích ngược với seed data cũ
);

-- 5.2. Bảng profiles: Cập nhật policy cho phép Admin có school_id NULL
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (
  public.is_admin() OR (
    id = auth.uid() AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  )
);

-- 5.3. Bảng reports: BẢO VỆ CÔ LẬP TRƯỜNG & HÀNG ĐỢI PHÂN LUỒNG CHUNG
-- Quy tắc: 
-- 1. Admin toàn hệ thống xem tất cả (kể cả school_id NULL).
-- 2. Cán bộ trường CHỈ xem được phản ánh có school_id = trường của mình.
-- Tuyệt đối KHÔNG xem được phản ánh của trường khác và KHÔNG xem được phản ánh chưa phân công!
DROP POLICY IF EXISTS "reports_staff_select" ON public.reports;
CREATE POLICY "reports_staff_select" ON public.reports
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND 
    school_id IS NOT NULL AND
    school_id = public.get_current_user_school_id()
  )
);

-- Cho phép công chúng gửi phản ánh (cho phép school_id NULL khi phạm vi là tuyến đường chung)
DROP POLICY IF EXISTS "reports_public_insert" ON public.reports;
CREATE POLICY "reports_public_insert" ON public.reports
FOR INSERT TO anon, authenticated
WITH CHECK (
  verification_status = 'pending' AND
  reviewed_by IS NULL AND
  reviewed_at IS NULL AND
  is_hidden = false
);

-- Cho phép Admin phân luồng phản ánh chung
DROP POLICY IF EXISTS "reports_admin_routing_update" ON public.reports;
CREATE POLICY "reports_admin_routing_update" ON public.reports
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5.4. Bảng hotspots: Hỗ trợ Hotspot tuyến đường chung
DROP POLICY IF EXISTS "hotspots_public_select" ON public.hotspots;
CREATE POLICY "hotspots_public_select" ON public.hotspots
FOR SELECT TO anon, authenticated
USING (
  publication_status = 'published' AND 
  is_hidden = false AND
  (
    school_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.schools s 
      WHERE s.id = school_id AND s.public_map_approved = true
    )
  )
);

DROP POLICY IF EXISTS "hotspots_staff_select_all" ON public.hotspots;
CREATE POLICY "hotspots_staff_select_all" ON public.hotspots
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND 
    school_id IS NOT NULL AND
    school_id = public.get_current_user_school_id()
  )
);

-- 5.5. Policies cho bảng report_routing_logs
DROP POLICY IF EXISTS "routing_logs_select" ON public.report_routing_logs;
CREATE POLICY "routing_logs_select" ON public.report_routing_logs
FOR SELECT TO authenticated
USING (
  public.is_admin() OR (
    public.is_verifier_or_higher() AND (
      to_school_id = public.get_current_user_school_id() OR
      from_school_id = public.get_current_user_school_id()
    )
  )
);

DROP POLICY IF EXISTS "routing_logs_admin_insert" ON public.report_routing_logs;
CREATE POLICY "routing_logs_admin_insert" ON public.report_routing_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. CẬP NHẬT VIEW BẢN ĐỒ CÔNG KHAI: public_hotspots_view
-- ============================================================================
-- Đổi sang LEFT JOIN để không bị nuốt mất Hotspot trên tuyến đường chung (school_id IS NULL)
CREATE OR REPLACE VIEW public.public_hotspots_view
WITH (security_invoker = false) AS
SELECT
  h.id AS hotspot_id,
  h.school_id,
  COALESCE(s.name, 'Tuyến hành lang giao thông đô thị') AS school_name,
  COALESCE(s.address, 'Khu vực công cộng / Tuyến đường liên trường') AS school_address,
  h.name AS hotspot_name,
  h.public_lat,
  h.public_lng,
  h.severity,
  h.processing_status,
  h.publication_status,
  h.published_at,
  h.updated_at,
  MAX(r.occurred_at) AS latest_occurred_at,
  MAX(r.reviewed_at) AS latest_verified_at,
  COUNT(DISTINCT r.id) AS verified_report_count,
  (
    SELECT MAX(survey_date) 
    FROM public.hotspot_surveys hs 
    WHERE hs.hotspot_id = h.id
  ) AS latest_survey_date,
  COALESCE(
    ARRAY_AGG(DISTINCT rm.processed_file_path) FILTER (WHERE rm.processed_file_path IS NOT NULL),
    '{}'
  ) AS public_image_paths,
  h.is_demo
FROM public.hotspots h
LEFT JOIN public.schools s ON s.id = h.school_id
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
  -- ĐIỀU KIỆN 4: Trường cho phép công khai HOẶC là điểm nguy cơ tuyến đường chung (h.school_id IS NULL)
  AND (h.school_id IS NULL OR s.public_map_approved = true)
  -- ĐIỀU KIỆN 5: Hotspot không bị ẩn
  AND h.is_hidden = false
GROUP BY
  h.id, h.school_id, s.name, s.address, h.name, h.public_lat, h.public_lng,
  h.severity, h.processing_status, h.publication_status, h.published_at, h.updated_at, h.is_demo;

-- ============================================================================
-- 7. CẬP NHẬT RPC THỐNG KÊ CÔNG KHAI: rpc_get_public_statistics
-- ============================================================================
-- Khắc phục triệt để lỗi fallback về THPT Tam Hiệp khi p_school_id IS NULL:
-- Hỗ trợ đầy đủ 2 chế độ:
-- 1. Thống kê theo 1 trường cụ thể (khi p_school_id IS NOT NULL)
-- 2. Thống kê TỔNG HỢP TOÀN ĐỊA BÀN TP. BIÊN HÒA (khi p_school_id IS NULL)
CREATE OR REPLACE FUNCTION public.rpc_get_public_statistics(
  p_school_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_include_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_include_demo BOOLEAN := COALESCE(p_include_demo, false);
  v_start_date TIMESTAMPTZ := COALESCE(p_start_date, now() - INTERVAL '30 days');
  v_end_date TIMESTAMPTZ := COALESCE(p_end_date, now());
  
  v_verified_reports_count INT := 0;
  v_published_hotspots_count INT := 0;
  v_resolved_hotspots_count INT := 0;
  v_in_progress_hotspots_count INT := 0;
  
  v_chart1_time JSONB := '[]'::JSONB;
  v_chart2_issues JSONB := '[]'::JSONB;
  v_chart3_windows JSONB := '[]'::JSONB;
  v_chart4_hotspots JSONB := '[]'::JSONB;
  
  v_is_city_wide BOOLEAN := (p_school_id IS NULL);
  v_school_name TEXT := 'Toàn thành phố Biên Hòa';
BEGIN
  -- 1. Kiểm tra ràng buộc khoảng thời gian hợp lệ
  IF v_start_date > v_end_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_DATE_RANGE',
      'message', 'Khoảng thời gian không hợp lệ: Ngày bắt đầu không thể sau ngày kết thúc.'
    );
  END IF;

  IF (v_end_date - v_start_date) > INTERVAL '365 days' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'DATE_RANGE_EXCEEDED',
      'message', 'Khoảng thời gian truy vấn tối đa không được vượt quá 365 ngày (1 năm).'
    );
  END IF;

  -- 2. Kiểm tra trường học nếu có chỉ định cụ thể
  IF NOT v_is_city_wide THEN
    SELECT name INTO v_school_name
    FROM public.schools
    WHERE id = p_school_id
      AND public_map_approved = true;

    IF v_school_name IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'SCHOOL_NOT_FOUND_OR_NOT_APPROVED',
        'message', 'Trường học không tồn tại hoặc chưa được cấp phép công khai bản đồ số theo quy định.'
      );
    END IF;
  END IF;

  -- 3. Thống kê Overview Metrics
  -- 3.1. Tổng số phản ánh đã xác minh hợp lệ (dựa trên reviewed_at)
  -- NGUYÊN TẮC: Phân tách Demo sạch và chỉ tính trường đã duyệt hoặc tuyến đường chung
  SELECT count(*) INTO v_verified_reports_count
  FROM public.reports r
  WHERE 
    r.verification_status = 'verified'
    AND r.is_hidden = false
    AND r.is_demo = v_include_demo
    AND r.is_demo IS NOT NULL
    AND r.reviewed_at >= v_start_date
    AND r.reviewed_at <= v_end_date
    AND (
      (v_is_city_wide AND (r.school_id IS NULL OR r.school_id IN (SELECT id FROM public.schools WHERE public_map_approved = true)))
      OR
      (NOT v_is_city_wide AND r.school_id = p_school_id)
    );

  -- 3.2. Thống kê Hotspot công khai (từ public_hotspots_view)
  SELECT 
    count(*),
    count(*) FILTER (WHERE processing_status = 'resolved'),
    count(*) FILTER (WHERE processing_status = 'in_progress')
  INTO 
    v_published_hotspots_count,
    v_resolved_hotspots_count,
    v_in_progress_hotspots_count
  FROM public.public_hotspots_view pv
  WHERE 
    pv.is_demo = v_include_demo
    AND pv.is_demo IS NOT NULL
    AND (
      v_is_city_wide 
      OR 
      (NOT v_is_city_wide AND pv.school_id = p_school_id)
    );

  -- 4. Biểu đồ 1: Số phản ánh đã xác minh theo thời gian
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(d.day_bucket, 'YYYY-MM-DD'),
        'label', to_char(d.day_bucket, 'DD/MM'),
        'count', coalesce(rc.report_count, 0)
      )
      ORDER BY d.day_bucket ASC
    ),
    '[]'::JSONB
  ) INTO v_chart1_time
  FROM (
    SELECT generate_series(
      date_trunc('day', v_start_date AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      date_trunc('day', v_end_date AT TIME ZONE 'Asia/Ho_Chi_Minh'),
      INTERVAL '1 day'
    ) AS day_bucket
  ) d
  LEFT JOIN (
    SELECT 
      date_trunc('day', r.reviewed_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS rep_day,
      count(*) AS report_count
    FROM public.reports r
    WHERE 
      r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
      AND (
        (v_is_city_wide AND (r.school_id IS NULL OR r.school_id IN (SELECT id FROM public.schools WHERE public_map_approved = true)))
        OR
        (NOT v_is_city_wide AND r.school_id = p_school_id)
      )
    GROUP BY rep_day
  ) rc ON rc.rep_day = d.day_bucket;

  -- 5. Biểu đồ 2: Phân bố theo loại vấn đề (đầy đủ 6 enum types)
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'issue_type', t.issue_type,
        'count', coalesce(cnt.c, 0)
      )
    ),
    '[]'::JSONB
  ) INTO v_chart2_issues
  FROM (
    VALUES 
      ('traffic_jam'::public.issue_type_enum),
      ('illegal_parking'::public.issue_type_enum),
      ('unsafe_crossing'::public.issue_type_enum),
      ('blind_spot'::public.issue_type_enum),
      ('collision_risk'::public.issue_type_enum),
      ('other'::public.issue_type_enum)
  ) AS t(issue_type)
  LEFT JOIN (
    SELECT r.issue_type, count(*) AS c
    FROM public.reports r
    WHERE 
      r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
      AND (
        (v_is_city_wide AND (r.school_id IS NULL OR r.school_id IN (SELECT id FROM public.schools WHERE public_map_approved = true)))
        OR
        (NOT v_is_city_wide AND r.school_id = p_school_id)
      )
    GROUP BY r.issue_type
  ) cnt ON cnt.issue_type = t.issue_type;

  -- 6. Biểu đồ 3: Phân bố theo khung giờ (occurred_at theo giờ Việt Nam)
  WITH classified_reports AS (
    SELECT 
      CASE 
        WHEN r.occurred_at IS NULL THEN 'unspecified'
        WHEN EXTRACT(HOUR FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) * 60 + EXTRACT(MINUTE FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) BETWEEN 360 AND 540 THEN 'morning'
        WHEN EXTRACT(HOUR FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) * 60 + EXTRACT(MINUTE FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) BETWEEN 630 AND 810 THEN 'noon'
        WHEN EXTRACT(HOUR FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) * 60 + EXTRACT(MINUTE FROM (r.occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')) BETWEEN 900 AND 1080 THEN 'afternoon'
        ELSE 'other'
      END AS time_slot
    FROM public.reports r
    WHERE 
      r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
      AND (
        (v_is_city_wide AND (r.school_id IS NULL OR r.school_id IN (SELECT id FROM public.schools WHERE public_map_approved = true)))
        OR
        (NOT v_is_city_wide AND r.school_id = p_school_id)
      )
  )
  SELECT jsonb_build_object(
    'morning', count(*) FILTER (WHERE time_slot = 'morning'),
    'noon', count(*) FILTER (WHERE time_slot = 'noon'),
    'afternoon', count(*) FILTER (WHERE time_slot = 'afternoon'),
    'other', count(*) FILTER (WHERE time_slot = 'other'),
    'unspecified', count(*) FILTER (WHERE time_slot = 'unspecified')
  ) INTO v_chart3_windows
  FROM classified_reports;

  -- 7. Biểu đồ 4: Tình trạng xử lý Hotspot công khai
  SELECT jsonb_build_object(
    'unprocessed', count(*) FILTER (WHERE processing_status = 'unprocessed'),
    'in_progress', count(*) FILTER (WHERE processing_status = 'in_progress'),
    'resolved', count(*) FILTER (WHERE processing_status = 'resolved')
  ) INTO v_chart4_hotspots
  FROM public.public_hotspots_view pv
  WHERE 
    pv.is_demo = v_include_demo
    AND pv.is_demo IS NOT NULL
    AND (
      v_is_city_wide 
      OR 
      (NOT v_is_city_wide AND pv.school_id = p_school_id)
    );

  -- 8. Trả về kết quả tổng hợp an toàn
  RETURN jsonb_build_object(
    'success', true,
    'school_id', CASE WHEN v_is_city_wide THEN NULL ELSE p_school_id END,
    'scope', CASE WHEN v_is_city_wide THEN 'city_wide' ELSE 'school_specific' END,
    'school_name', v_school_name,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'include_demo', v_include_demo,
    'metrics', jsonb_build_object(
      'verified_reports_count', v_verified_reports_count,
      'published_hotspots_count', v_published_hotspots_count,
      'resolved_hotspots_count', v_resolved_hotspots_count,
      'in_progress_hotspots_count', v_in_progress_hotspots_count
    ),
    'chart1_time', v_chart1_time,
    'chart2_issues', v_chart2_issues,
    'chart3_windows', v_chart3_windows,
    'chart4_hotspots', v_chart4_hotspots
  );
END;
$$;

-- Cấp quyền gọi hàm cho người dùng ẩn danh và cán bộ
REVOKE ALL ON FUNCTION public.rpc_get_public_statistics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_public_statistics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO anon, authenticated, service_role;
