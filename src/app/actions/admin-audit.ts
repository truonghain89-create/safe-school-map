'use server';

import { createClient } from '@supabase/supabase-js';

export interface AuditLogItem {
  id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  object_type: string;
  object_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string | null;
  ip_address?: string | null;
  created_at: string;
  // Thuộc tính tương thích ngược cho giao diện
  target_table?: string;
  target_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
}

export async function getAuditLogsAction(): Promise<{
  success: boolean;
  data?: AuditLogItem[];
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: logs, error: logErr } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logErr) {
      return { success: false, error: logErr.message };
    }

    // Map tên profile nếu có
    const { data: profiles } = await supabase.from('profiles').select('id, full_name');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));

    const items: AuditLogItem[] = (logs || []).map((l) => ({
      id: l.id,
      actor_id: l.actor_id,
      actor_name: l.actor_id ? profileMap.get(l.actor_id) || 'Cán bộ hệ thống' : 'Hệ thống tự động',
      action: l.action,
      object_type: l.object_type,
      object_id: l.object_id,
      old_value: l.old_value,
      new_value: l.new_value,
      reason: l.reason,
      ip_address: l.ip_address,
      created_at: l.created_at,
      // Tương thích ngược:
      target_table: l.object_type,
      target_id: l.object_id,
      old_data: l.old_value,
      new_data: l.new_value,
    }));

    return { success: true, data: items };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy nhật ký.',
    };
  }
}
