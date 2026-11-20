'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { IssueType, VerificationStatus, ReportScopeType, RoutingStatus } from '@/types';

export interface AdminReportItem {
  id: string;
  tracking_code_hash: string;
  school_id: string | null;
  school_name?: string | null;
  scope_type?: ReportScopeType;
  routing_status?: RoutingStatus;
  hotspot_id?: string | null;
  hotspot_name?: string | null;
  issue_type: IssueType;
  description: string;
  actual_lat: number;
  actual_lng: number;
  occurred_at: string;
  time_window: string;
  verification_status: VerificationStatus;
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  is_hidden: boolean;
  is_demo: boolean;
  submitted_at: string;
  media_path?: string | null;
  media_signed_url?: string | null;
}

const CANONICAL_DEMO_REPORTS: AdminReportItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    tracking_code_hash: 'SFM-DEMO-001',
    school_id: '00000000-0000-0000-0000-000000000001',
    hotspot_id: '00000000-0000-0000-0000-000000000101',
    hotspot_name: '[DEMO] Cổng chính đường Phạm Văn Thuận',
    issue_type: 'traffic_jam',
    description: 'Ùn tắc nghiêm trọng kéo dài từ cổng trường hướng về ngã tư Tân Tiến lúc 16h45.',
    actual_lat: 10.94142,
    actual_lng: 106.86141,
    occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    time_window: '16:30 - 17:30',
    verification_status: 'verified',
    rejection_reason: null,
    is_hidden: false,
    is_demo: true,
    submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    tracking_code_hash: 'SFM-DEMO-002',
    school_id: '00000000-0000-0000-0000-000000000001',
    hotspot_id: null,
    hotspot_name: null,
    issue_type: 'illegal_parking',
    description: 'Ô tô 7 chỗ thường xuyên đậu chắn lối vỉa hè người đi bộ.',
    actual_lat: 10.94160,
    actual_lng: 106.86150,
    occurred_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    time_window: '06:30 - 07:15',
    verification_status: 'pending',
    rejection_reason: null,
    is_hidden: false,
    is_demo: true,
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    tracking_code_hash: 'SFM-DEMO-003',
    school_id: '00000000-0000-0000-0000-000000000001',
    hotspot_id: null,
    hotspot_name: null,
    issue_type: 'other',
    description: 'Nội dung thử nghiệm không liên quan trật tự an toàn cổng trường.',
    actual_lat: 10.94300,
    actual_lng: 106.86200,
    occurred_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    time_window: 'Khác',
    verification_status: 'invalid',
    rejection_reason: 'Nội dung phản ánh không thuộc phạm vi an toàn giao thông khu vực trường học.',
    is_hidden: false,
    is_demo: true,
    submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

export async function getAdminReportsAction(filter: {
  status: 'all' | VerificationStatus;
  issueType: 'all' | IssueType;
  includeDemo: boolean;
  schoolId?: string | 'all' | 'unassigned';
}): Promise<{ success: boolean; data?: AdminReportItem[]; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let query = supabase
      .from('reports')
      .select(`
        id,
        tracking_code_hash,
        school_id,
        hotspot_id,
        issue_type,
        description,
        actual_lat,
        actual_lng,
        occurred_at,
        time_window,
        verification_status,
        rejection_reason,
        reviewed_by,
        reviewed_at,
        is_hidden,
        is_demo,
        submitted_at
      `)
      .order('submitted_at', { ascending: false });

    if (filter.status !== 'all') {
      query = query.eq('verification_status', filter.status);
    }

    if (filter.issueType !== 'all') {
      query = query.eq('issue_type', filter.issueType);
    }

    if (!filter.includeDemo) {
      query = query.eq('is_demo', false);
    }

    if (filter.schoolId === 'unassigned') {
      query = query.is('school_id', null);
    } else if (filter.schoolId && filter.schoolId !== 'all') {
      query = query.eq('school_id', filter.schoolId);
    }

    const { data: reports, error: reportErr } = await query;

    if (reportErr) {
      return { success: false, error: reportErr.message };
    }

    // Lấy danh sách Hotspot, Media và Schools để map tên
    const { data: hotspots } = await supabase.from('hotspots').select('id, name');
    const { data: mediaList } = await supabase.from('report_media').select('report_id, original_file_path');
    const { data: dbSchools } = await supabase.from('schools').select('id, name');

    const hotspotMap = new Map((hotspots || []).map((h) => [h.id, h.name]));
    const mediaMap = new Map((mediaList || []).map((m) => [m.report_id, m.original_file_path]));
    const schoolMap = new Map((dbSchools || []).map((s) => [s.id, s.name]));

    let items: AdminReportItem[] = (reports || []).map((r) => ({
      ...r,
      school_name: r.school_id ? schoolMap.get(r.school_id) || 'Không xác định' : 'Chưa phân công (Hàng đợi chung)',
      hotspot_name: r.hotspot_id ? hotspotMap.get(r.hotspot_id) || null : null,
      media_path: mediaMap.get(r.id) || null,
    }));

    // Nếu RLS ẩn danh trả về rỗng và filter.includeDemo = true, bổ sung dữ liệu mẫu chuẩn M1
    if (items.length === 0 && filter.includeDemo) {
      items = CANONICAL_DEMO_REPORTS.filter((r) => {
        if (filter.status !== 'all' && r.verification_status !== filter.status) return false;
        if (filter.issueType !== 'all' && r.issue_type !== filter.issueType) return false;
        if (filter.schoolId === 'unassigned' && r.school_id) return false;
        if (filter.schoolId && filter.schoolId !== 'all' && filter.schoolId !== 'unassigned' && r.school_id !== filter.schoolId) return false;
        return true;
      });
    }

    return { success: true, data: items };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy danh sách phản ánh.',
    };
  }
}

/**
 * Tạo Signed URL an toàn có thời hạn 5 phút để cán bộ xem ảnh minh chứng
 */
export async function getReportMediaSignedUrlAction(filePath: string): Promise<{
  success: boolean;
  signedUrl?: string;
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.storage
      .from('private-reports')
      .createSignedUrl(filePath, 300); // 300 giây (5 phút)

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || 'Không thể tạo liên kết xem ảnh bảo mật.' };
    }

    return { success: true, signedUrl: data.signedUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi truy xuất ảnh.',
    };
  }
}

/**
 * Cán bộ xác minh thẩm định Report hợp lệ
 */
export async function verifyReportAction(params: {
  reportId: string;
  reviewerId: string;
  reviewerName: string;
  hotspotId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Xác thực danh tính cán bộ từ phiên đăng nhập thực tế nếu có
    let actorId = params.reviewerId;
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

    const updatePayload: Record<string, unknown> = {
      verification_status: 'verified',
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    };

    if (params.hotspotId) {
      updatePayload.hotspot_id = params.hotspotId;
    }

    const { error: updateErr } = await supabase
      .from('reports')
      .update(updatePayload)
      .eq('id', params.reportId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Ghi nhật ký audit_logs chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'report.verify',
      object_type: 'report',
      object_id: params.reportId,
      new_value: {
        verification_status: 'verified',
        reviewed_by: params.reviewerName,
        hotspot_id: params.hotspotId || null,
      },
      reason: 'Cán bộ xác minh thực địa xác nhận phản ánh hợp lệ',
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật xác minh.',
    };
  }
}

/**
 * Cán bộ xác minh từ chối Report không hợp lệ (BẮT BUỘC CÓ LÝ DO)
 */
export async function rejectReportAction(params: {
  reportId: string;
  reviewerId: string;
  reviewerName: string;
  rejectionReason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const reason = (params.rejectionReason || '').trim();
    if (!reason || reason.length < 5) {
      return {
        success: false,
        error: 'Bắt buộc nhập lý do từ chối cụ thể (tối thiểu 5 ký tự) để phản hồi cho người dân.',
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Xác thực danh tính cán bộ từ phiên đăng nhập thực tế nếu có
    let actorId = params.reviewerId;
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

    const { error: updateErr } = await supabase
      .from('reports')
      .update({
        verification_status: 'invalid',
        rejection_reason: reason,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.reportId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Ghi nhật ký audit_logs chuẩn schema M1
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'report.reject',
      object_type: 'report',
      object_id: params.reportId,
      new_value: {
        verification_status: 'invalid',
        rejection_reason: reason,
        reviewed_by: params.reviewerName,
      },
      reason: reason,
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi từ chối phản ánh.',
    };
  }
}

/**
 * Điều phối phản ánh khu vực chung / hành lang về trường học cụ thể (Prompt 9.5 Multi-School)
 */
export async function assignReportToSchoolAction(params: {
  reportId: string;
  targetSchoolId: string;
  actorId: string;
  actorName: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Kiểm tra báo cáo hiện tại
    const { data: currentReport, error: getErr } = await supabase
      .from('reports')
      .select('id, school_id, routing_status')
      .eq('id', params.reportId)
      .maybeSingle();

    if (getErr || !currentReport) {
      return { success: false, error: 'Không tìm thấy thông tin phản ánh.' };
    }

    const fromSchoolId = currentReport.school_id;

    // 2. Cập nhật trường học đích và trạng thái điều phối
    const { error: updateErr } = await supabase
      .from('reports')
      .update({
        school_id: params.targetSchoolId,
        routing_status: 'manually_routed',
      })
      .eq('id', params.reportId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Ghi log điều phối vào report_routing_logs (nếu bảng đã được tạo qua migration)
    try {
      await supabase.from('report_routing_logs').insert({
        report_id: params.reportId,
        from_school_id: fromSchoolId,
        to_school_id: params.targetSchoolId,
        routed_by: params.actorId,
        reason: params.reason || 'Điều phối phân công xác minh cơ sở giáo dục phụ trách',
      });
    } catch {
      // Bỏ qua nếu migration chưa chạy trên Supabase Cloud
    }

    // 4. Ghi audit log chuẩn hệ thống
    await supabase.from('audit_logs').insert({
      actor_id: params.actorId,
      action: 'report.assign_school',
      object_type: 'report',
      object_id: params.reportId,
      new_value: {
        from_school_id: fromSchoolId,
        to_school_id: params.targetSchoolId,
        actor_name: params.actorName,
        reason: params.reason,
      },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi điều phối phản ánh.',
    };
  }
}
