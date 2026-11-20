-- ============================================================================
-- SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
-- Migration: Prompt 9.2 - Public Statistics RPC Function & Security Hardening
-- Specification: v5 (Kiểm toán bảo mật & Tính toàn vẹn dữ liệu)
-- ============================================================================

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
  v_school_id UUID := NULL;
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

  -- 2. Xác thực quyền công khai của trường học (Bảo vệ dữ liệu đa trường học)
  IF p_school_id IS NOT NULL THEN
    -- Truy vấn trường được chỉ định, BẮT BUỘC phải có public_map_approved = true
    SELECT id INTO v_school_id
    FROM public.schools
    WHERE id = p_school_id
      AND public_map_approved = true;

    -- Nếu trường không tồn tại hoặc chưa được duyệt công khai bản đồ số
    IF v_school_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'SCHOOL_NOT_FOUND_OR_NOT_APPROVED',
        'message', 'Trường học không tồn tại hoặc chưa được cấp phép công khai bản đồ số theo quy định.'
      );
    END IF;
  ELSE
    -- Mặc định: Chọn trường điểm trọng tâm (focal point) ĐÃ ĐƯỢC PHÊ DUYỆT CÔNG KHAI
    SELECT id INTO v_school_id
    FROM public.schools
    WHERE is_focal_point = true
      AND public_map_approved = true
    LIMIT 1;

    -- Dự phòng: Nếu chưa có focal point, chọn trường hợp lệ đầu tiên đã được phê duyệt công khai
    IF v_school_id IS NULL THEN
      SELECT id INTO v_school_id
      FROM public.schools
      WHERE public_map_approved = true
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    -- Nếu hệ thống chưa có bất kỳ trường nào được duyệt công khai
    IF v_school_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'NO_PUBLIC_SCHOOL_AVAILABLE',
        'message', 'Hiện tại chưa có trường học nào được cấp phép công khai dữ liệu an toàn giao thông.'
      );
    END IF;
  END IF;

  -- 3. Thống kê Overview Cards:
  -- 3.1. Tổng số phản ánh đã xác minh hợp lệ trong khoảng thời gian (dựa trên reviewed_at)
  -- NGUYÊN TẮC TÁCH BIỆT: r.is_demo = v_include_demo AND r.is_demo IS NOT NULL
  SELECT count(*) INTO v_verified_reports_count
  FROM public.reports r
  WHERE r.school_id = v_school_id
    AND r.verification_status = 'verified'
    AND r.is_hidden = false
    AND r.is_demo = v_include_demo
    AND r.is_demo IS NOT NULL
    AND r.reviewed_at >= v_start_date
    AND r.reviewed_at <= v_end_date;

  -- 3.2. Thống kê Hotspot công khai (từ public_hotspots_view bảo đảm 5 điều kiện)
  -- NGUYÊN TẮC TÁCH BIỆT: pv.is_demo = v_include_demo AND pv.is_demo IS NOT NULL
  SELECT 
    count(*),
    count(*) FILTER (WHERE processing_status = 'resolved'),
    count(*) FILTER (WHERE processing_status = 'in_progress')
  INTO 
    v_published_hotspots_count,
    v_resolved_hotspots_count,
    v_in_progress_hotspots_count
  FROM public.public_hotspots_view pv
  WHERE pv.school_id = v_school_id
    AND pv.is_demo = v_include_demo
    AND pv.is_demo IS NOT NULL;

  -- 4. Biểu đồ 1: Số phản ánh đã xác minh theo thời gian (nhóm theo ngày trong khoảng lọc theo reviewed_at)
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
    WHERE r.school_id = v_school_id
      AND r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
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
    WHERE r.school_id = v_school_id
      AND r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
    GROUP BY r.issue_type
  ) cnt ON cnt.issue_type = t.issue_type;

  -- 6. Biểu đồ 3: Phân bố theo khung giờ xảy ra sự việc (occurred_at theo giờ Việt Nam)
  -- Đối với các phản ánh đã xác minh trong khoảng ngày chọn
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
    WHERE r.school_id = v_school_id
      AND r.verification_status = 'verified'
      AND r.is_hidden = false
      AND r.is_demo = v_include_demo
      AND r.is_demo IS NOT NULL
      AND r.reviewed_at >= v_start_date
      AND r.reviewed_at <= v_end_date
  )
  SELECT jsonb_build_object(
    'morning', count(*) FILTER (WHERE time_slot = 'morning'),
    'noon', count(*) FILTER (WHERE time_slot = 'noon'),
    'afternoon', count(*) FILTER (WHERE time_slot = 'afternoon'),
    'other', count(*) FILTER (WHERE time_slot = 'other'),
    'unspecified', count(*) FILTER (WHERE time_slot = 'unspecified')
  ) INTO v_chart3_windows
  FROM classified_reports;

  -- 7. Biểu đồ 4: Tình trạng xử lý Hotspot công khai (tính tích lũy hiện tại)
  SELECT jsonb_build_object(
    'unprocessed', count(*) FILTER (WHERE processing_status = 'unprocessed'),
    'in_progress', count(*) FILTER (WHERE processing_status = 'in_progress'),
    'resolved', count(*) FILTER (WHERE processing_status = 'resolved')
  ) INTO v_chart4_hotspots
  FROM public.public_hotspots_view pv
  WHERE pv.school_id = v_school_id
    AND pv.is_demo = v_include_demo
    AND pv.is_demo IS NOT NULL;

  -- 8. Trả về kết quả tổng hợp an toàn
  RETURN jsonb_build_object(
    'success', true,
    'school_id', v_school_id,
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

-- Cấu hình bảo mật phân quyền hàm:
REVOKE ALL ON FUNCTION public.rpc_get_public_statistics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_public_statistics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO anon, authenticated, service_role;
