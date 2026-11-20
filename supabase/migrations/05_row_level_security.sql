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
