-- ==============================================================================
-- BƯỚC 1.3 (BẢN CHUẨN ĐÃ SỬA LỖI GENERATED COLUMN & FIX 500 SCHEMA ERROR)
-- Khắc phục triệt để BUG-001 (Lỗi đăng nhập cán bộ trên Supabase Cloud)
-- ==============================================================================

-- 1. Cấp toàn quyền schema public cho tài khoản vận hành Supabase Auth
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO supabase_auth_admin, service_role;

-- 2. Dọn dẹp lỗi GoTrue 500 (chuyển các token NULL thành chuỗi rỗng '')
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE confirmation_token IS NULL 
   OR recovery_token IS NULL 
   OR email_change_token_new IS NULL;

-- 3. Cập nhật trạng thái xác thực và mật khẩu cho tài khoản demo
-- LƯU Ý: Tuyệt đối KHÔNG gán confirmed_at vì đây là cột tự sinh (GENERATED ALWAYS) trong Postgres
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  last_sign_in_at = NOW(),
  encrypted_password = crypt('DemoPassword123!', gen_salt('bf')),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  phone_change = '',
  phone_change_token = '',
  email_change_token_current = '',
  reauthentication_token = '',
  is_sso_user = false
WHERE email IN ('verifier.demo@tamhiep.edu.vn', 'approver.demo@tamhiep.edu.vn');

-- 4. Bổ sung tài khoản Verifier (nếu chưa có trong auth.users)
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
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'verifier.demo@tamhiep.edu.vn',
  crypt('DemoPassword123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)"}'::jsonb,
  '',
  '',
  '',
  '',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email_confirmed_at = NOW(),
  encrypted_password = crypt('DemoPassword123!', gen_salt('bf')),
  confirmation_token = '',
  recovery_token = '';

-- 5. Bổ sung tài khoản Approver (nếu chưa có trong auth.users)
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
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'approver.demo@tamhiep.edu.vn',
  crypt('DemoPassword123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Cô Trần Thị B (Đại diện Ban Giám Hiệu DEMO)"}'::jsonb,
  '',
  '',
  '',
  '',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email_confirmed_at = NOW(),
  encrypted_password = crypt('DemoPassword123!', gen_salt('bf')),
  confirmation_token = '',
  recovery_token = '';

-- 6. Đồng bộ quyền cán bộ vào bảng public.profiles
INSERT INTO public.profiles (
  id, email, full_name, school_id, role, is_active, created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000011',
    'verifier.demo@tamhiep.edu.vn',
    'Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)',
    '00000000-0000-0000-0000-000000000001',
    'verifier',
    true,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'approver.demo@tamhiep.edu.vn',
    'Cô Trần Thị B (Đại diện Ban Giám Hiệu DEMO)',
    '00000000-0000-0000-0000-000000000001',
    'approver',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = true,
  school_id = EXCLUDED.school_id;
