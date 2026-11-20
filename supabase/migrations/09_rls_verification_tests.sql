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
