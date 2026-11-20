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
