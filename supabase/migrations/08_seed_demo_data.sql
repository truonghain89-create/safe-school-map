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
