import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase Browser Client (Dành cho Client Components)
 * Chỉ sử dụng NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Tuyệt đối không đưa SUPABASE_SERVICE_ROLE_KEY vào client!
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Trả về mock client nếu chưa cấu hình biến môi trường
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
