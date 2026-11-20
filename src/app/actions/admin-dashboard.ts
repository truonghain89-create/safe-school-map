'use server';

import { createClient } from '@supabase/supabase-js';

export interface DashboardMetrics {
  totalReports: number;
  pendingReports: number;
  verifiedReports: number;
  invalidReports: number;
  totalHotspots: number;
  unpublishedHotspots: number;
  publishedHotspots: number;
  hiddenHotspots: number;
  recentPendingReports: Array<{
    id: string;
    issue_type: string;
    description: string;
    occurred_at: string;
    submitted_at: string;
    time_window: string;
    is_demo: boolean;
  }>;
}

const CANONICAL_DEMO_REPORTS = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    issue_type: 'traffic_jam',
    description: 'Ùn tắc nghiêm trọng kéo dài từ cổng trường hướng về ngã tư Tân Tiến lúc 16h45.',
    occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    time_window: '16:30 - 17:30',
    verification_status: 'verified',
    rejection_reason: null,
    is_hidden: false,
    is_demo: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    issue_type: 'illegal_parking',
    description: 'Ô tô 7 chỗ thường xuyên đậu chắn lối vỉa hè người đi bộ.',
    occurred_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    time_window: '06:30 - 07:15',
    verification_status: 'pending',
    rejection_reason: null,
    is_hidden: false,
    is_demo: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    issue_type: 'other',
    description: 'Nội dung thử nghiệm không liên quan trật tự an toàn cổng trường.',
    occurred_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    time_window: 'Khác',
    verification_status: 'invalid',
    rejection_reason: 'Nội dung phản ánh không thuộc phạm vi an toàn giao thông khu vực trường học.',
    is_hidden: false,
    is_demo: true,
  },
];

export async function getDashboardMetricsAction(includeDemo: boolean = true): Promise<{
  success: boolean;
  metrics?: DashboardMetrics;
  error?: string;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Lấy danh sách Reports từ Supabase
    let reportQuery = supabase
      .from('reports')
      .select('id, issue_type, description, occurred_at, submitted_at, time_window, verification_status, is_demo, is_hidden');

    if (!includeDemo) {
      reportQuery = reportQuery.eq('is_demo', false);
    }

    const { data: dbReports } = await reportQuery;

    // Nếu RLS chặn anon hoặc chưa có dữ liệu và includeDemo=true, dự phòng dữ liệu mẫu chuẩn M1
    let repList = dbReports && dbReports.length > 0 ? dbReports : [];
    if (repList.length === 0 && includeDemo) {
      repList = CANONICAL_DEMO_REPORTS;
    }

    // 2. Lấy danh sách Hotspots từ Supabase
    let hotspotQuery = supabase
      .from('hotspots')
      .select('id, name, severity, processing_status, publication_status, is_hidden, is_demo');

    if (!includeDemo) {
      hotspotQuery = hotspotQuery.eq('is_demo', false);
    }

    const { data: hotspots } = await hotspotQuery;
    const hotList = hotspots || [];

    const totalReports = repList.length;
    const pendingReports = repList.filter((r) => r.verification_status === 'pending').length;
    const verifiedReports = repList.filter((r) => r.verification_status === 'verified').length;
    const invalidReports = repList.filter((r) => r.verification_status === 'invalid').length;

    const totalHotspots = hotList.length;
    const unpublishedHotspots = hotList.filter((h) => h.publication_status === 'unpublished').length;
    const publishedHotspots = hotList.filter((h) => h.publication_status === 'published' && !h.is_hidden).length;
    const hiddenHotspots = hotList.filter((h) => h.is_hidden || h.publication_status === 'hidden').length;

    const recentPendingReports = repList
      .filter((r) => r.verification_status === 'pending')
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        issue_type: r.issue_type,
        description: r.description,
        occurred_at: r.occurred_at,
        submitted_at: r.submitted_at,
        time_window: r.time_window,
        is_demo: r.is_demo,
      }));

    return {
      success: true,
      metrics: {
        totalReports,
        pendingReports,
        verifiedReports,
        invalidReports,
        totalHotspots,
        unpublishedHotspots,
        publishedHotspots,
        hiddenHotspots,
        recentPendingReports,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi lấy số liệu Dashboard.',
    };
  }
}
