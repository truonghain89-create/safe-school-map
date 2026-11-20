'use server';

import { createClient } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types';

export interface AccountItem {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  school_id: string;
  is_active: boolean;
  created_at: string;
}

export async function getAccountsAction(): Promise<{
  success: boolean;
  data?: AccountItem[];
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, school_id, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy danh sách tài khoản.',
    };
  }
}

export async function updateAccountRoleAction(params: {
  targetUserId: string;
  newRole: UserRole;
  isActive: boolean;
  adminId: string;
  adminName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        role: params.newRole,
        is_active: params.isActive,
      })
      .eq('id', params.targetUserId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Ghi nhật ký audit log chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: params.adminId,
      action: 'account.role_change',
      object_type: 'profile',
      object_id: params.targetUserId,
      new_value: {
        role: params.newRole,
        is_active: params.isActive,
        updated_by: params.adminName,
      },
      reason: 'Admin cập nhật phân quyền tài khoản',
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật tài khoản.',
    };
  }
}
