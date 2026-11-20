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
