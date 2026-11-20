'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { HotspotSeverity, ProcessingStatus, PublicationStatus } from '@/types';

export interface AdminHotspotItem {
  id: string;
  school_id: string;
  school_name?: string;
  name: string;
  actual_lat: number;
  actual_lng: number;
  public_lat: number;
  public_lng: number;
  severity: HotspotSeverity;
  processing_status: ProcessingStatus;
  publication_status: PublicationStatus;
  approved_by?: string | null;
  published_at?: string | null;
  is_hidden: boolean;
  is_demo: boolean;
  verified_report_count: number;
  created_at: string;
  updated_at: string;
}

export async function getAdminHotspotsAction(filter: {
  publicationStatus: 'all' | PublicationStatus;
  processingStatus: 'all' | ProcessingStatus;
  severity: 'all' | HotspotSeverity;
  includeDemo: boolean;
}): Promise<{ success: boolean; data?: AdminHotspotItem[]; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let query = supabase
      .from('hotspots')
      .select(`
        id,
        school_id,
        name,
        actual_lat,
        actual_lng,
        public_lat,
        public_lng,
        severity,
        processing_status,
        publication_status,
        approved_by,
        published_at,
        is_hidden,
        is_demo,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (filter.publicationStatus !== 'all') {
      query = query.eq('publication_status', filter.publicationStatus);
    }

    if (filter.processingStatus !== 'all') {
      query = query.eq('processing_status', filter.processingStatus);
    }

    if (filter.severity !== 'all') {
      query = query.eq('severity', filter.severity);
    }

    if (!filter.includeDemo) {
      query = query.eq('is_demo', false);
    }

    const { data: hotspots, error: hotErr } = await query;

    if (hotErr) {
      return { success: false, error: hotErr.message };
    }

    // Đếm số report liên kết cho từng hotspot
    const { data: reports } = await supabase
      .from('reports')
      .select('id, hotspot_id')
      .eq('verification_status', 'verified');

    const countMap = new Map<string, number>();
    (reports || []).forEach((r) => {
      if (r.hotspot_id) {
        countMap.set(r.hotspot_id, (countMap.get(r.hotspot_id) || 0) + 1);
      }
    });

    // Lấy danh sách tên trường để map động
    const { data: dbSchools } = await supabase.from('schools').select('id, name');
    const schoolMap = new Map((dbSchools || []).map((s) => [s.id, s.name]));

    const items: AdminHotspotItem[] = (hotspots || []).map((h) => ({
      ...h,
      verified_report_count: countMap.get(h.id) || 0,
      school_name: (h.school_id && schoolMap.get(h.school_id)) || 'Hành lang an toàn giao thông chung',
    }));

    return { success: true, data: items };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy danh sách Hotspot.',
    };
  }
}

/**
 * Tạo mới Hotspot từ phản ánh hoặc khảo sát
 */
export async function createHotspotAction(params: {
  name: string;
  schoolId?: string | null;
  actualLat: number;
  actualLng: number;
  publicLat: number;
  publicLng: number;
  severity: HotspotSeverity;
  creatorId: string;
  creatorName: string;
  reportIdsToAttach?: string[];
  isDemo?: boolean;
}): Promise<{ success: boolean; hotspotId?: string; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const hotspotId = crypto.randomUUID();

    const { error: insertErr } = await supabase.from('hotspots').insert({
      id: hotspotId,
      school_id: params.schoolId || null,
      name: params.name.trim(),
      actual_lat: params.actualLat,
      actual_lng: params.actualLng,
      public_lat: params.publicLat,
      public_lng: params.publicLng,
      severity: params.severity,
      processing_status: 'unprocessed',
      publication_status: 'unpublished', // Ban đầu chưa công khai, chờ Approver ký duyệt
      is_hidden: false,
      is_demo: params.isDemo || false,
      created_by: params.creatorId,
    });

    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    // Gắn các report đã xác minh vào Hotspot này nếu có
    if (params.reportIdsToAttach && params.reportIdsToAttach.length > 0) {
      await supabase
        .from('reports')
        .update({ hotspot_id: hotspotId })
        .in('id', params.reportIdsToAttach);
    }

    // Ghi nhật ký audit_logs chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: params.creatorId,
      action: 'hotspot.create',
      object_type: 'hotspot',
      object_id: hotspotId,
      new_value: {
        name: params.name,
        severity: params.severity,
        attached_reports: params.reportIdsToAttach?.length || 0,
      },
      reason: 'Cán bộ xác minh tạo mới Hotspot từ khảo sát/phản ánh',
    });

    return { success: true, hotspotId };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi tạo Hotspot.',
    };
  }
}

/**
 * Cập nhật thông tin Hotspot (tiến độ xử lý, mức độ, tọa độ)
 */
export async function updateHotspotAction(params: {
  hotspotId: string;
  name: string;
  severity: HotspotSeverity;
  processingStatus: ProcessingStatus;
  actorId: string;
  actorName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error: updateErr } = await supabase
      .from('hotspots')
      .update({
        name: params.name.trim(),
        severity: params.severity,
        processing_status: params.processingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.hotspotId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Ghi audit log chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      action: 'hotspot.update',
      object_type: 'hotspot',
      object_id: params.hotspotId,
      new_value: {
        severity: params.severity,
        processing_status: params.processingStatus,
      },
      reason: 'Cán bộ cập nhật thông tin Hotspot',
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật Hotspot.',
    };
  }
}

/**
 * Ban Giám Hiệu Phê duyệt Công khai Hotspot lên Bản đồ số (Approver Action)
 */
export async function approveHotspotAction(params: {
  hotspotId: string;
  approverId: string;
  approverName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Xác thực danh tính cán bộ từ phiên đăng nhập thực tế nếu có
    let actorId = params.approverId;
    try {
      const serverSupabase = createServerSupabaseClient();
      if (serverSupabase) {
        const { data: { user } } = await serverSupabase.auth.getUser();
        if (user) {
          actorId = user.id;
        }
      }
    } catch {
      // Giữ actorId từ param nếu chạy chế độ DEMO
    }

    // Kiểm tra xem Hotspot có tồn tại và thỏa mãn điều kiện cơ bản không
    const { data: hotspot, error: checkErr } = await supabase
      .from('hotspots')
      .select('id, name, severity, school_id')
      .eq('id', params.hotspotId)
      .single();

    if (checkErr || !hotspot) {
      return { success: false, error: 'Không tìm thấy thông tin Hotspot.' };
    }

    if (!hotspot.severity) {
      return { success: false, error: 'Hotspot chưa được cán bộ xác minh thiết lập mức độ nguy cơ.' };
    }

    const now = new Date().toISOString();

    const { error: approveErr } = await supabase
      .from('hotspots')
      .update({
        publication_status: 'published',
        approved_by: actorId,
        published_at: now,
        is_hidden: false,
        updated_at: now,
      })
      .eq('id', params.hotspotId);

    if (approveErr) {
      return { success: false, error: approveErr.message };
    }

    // Ghi audit log chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'hotspot.approve_publication',
      object_type: 'hotspot',
      object_id: params.hotspotId,
      new_value: {
        publication_status: 'published',
        approved_by: params.approverName,
        published_at: now,
      },
      reason: 'Đại diện Ban Giám Hiệu ký duyệt công khai Hotspot lên Bản đồ số',
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi phê duyệt công khai.',
    };
  }
}

/**
 * Ẩn Hotspot khỏi bản đồ công khai (Approver / Admin Action)
 */
export async function hideHotspotAction(params: {
  hotspotId: string;
  actorId: string;
  actorName: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const reasonText = (params.reason || '').trim();
    if (!reasonText || reasonText.length < 5) {
      return { success: false, error: 'Bắt buộc nhập lý do ẩn Hotspot cụ thể (tối thiểu 5 ký tự).' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const now = new Date().toISOString();

    const { error: hideErr } = await supabase
      .from('hotspots')
      .update({
        is_hidden: true,
        publication_status: 'hidden',
        updated_at: now,
      })
      .eq('id', params.hotspotId);

    if (hideErr) {
      return { success: false, error: hideErr.message };
    }

    // Ghi audit log chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      action: 'hotspot.hide',
      object_type: 'hotspot',
      object_id: params.hotspotId,
      new_value: {
        is_hidden: true,
        publication_status: 'hidden',
      },
      reason: reasonText,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi ẩn Hotspot.',
    };
  }
}
