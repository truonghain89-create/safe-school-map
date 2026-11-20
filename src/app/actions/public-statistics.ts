'use server';

import { createClient } from '@supabase/supabase-js';
import type { IssueType, ProcessingStatus } from '@/types';
import { BIEN_HOA_SCHOOLS_DATA } from '@/lib/constants/schools-bien-hoa';

export type TimePreset = '7d' | '30d' | '90d' | 'custom';
export type GroupByInterval = 'day' | 'week' | 'month';

export interface PublicStatisticsParams {
  schoolId?: string;
  preset: TimePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  groupBy?: GroupByInterval;
  includeDemo?: boolean;
}

export interface OverviewMetrics {
  verifiedReportsCount: number;
  publishedHotspotsCount: number;
  resolvedHotspotsCount: number;
  inProgressHotspotsCount: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  count: number;
}

export interface IssueTypeDistribution {
  issueType: IssueType;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TimeWindowDistribution {
  windowKey: 'morning' | 'noon' | 'afternoon' | 'other' | 'unspecified';
  label: string;
  timeRange: string;
  count: number;
  percentage: number;
}

export interface HotspotProcessingDistribution {
  status: ProcessingStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PublicStatisticsData {
  school: {
    id: string;
    name: string;
    address: string;
    isPilot: boolean;
  };
  filter: {
    preset: TimePreset;
    startDate: string;
    endDate: string;
    groupBy: GroupByInterval;
    includeDemo: boolean;
  };
  lastUpdated: string;
  dataSource: 'database_rpc' | 'server_role_query' | 'demo_mock_fixtures';
  reportsDataStatus: 'ready' | 'rpc_pending_migration';
  rpcPendingNotice?: string;
  metrics: OverviewMetrics;
  chart1Time: TimeSeriesPoint[];
  chart2Issues: IssueTypeDistribution[];
  chart3Windows: TimeWindowDistribution[];
  chart4Hotspots: HotspotProcessingDistribution[];
  notes: {
    verifiedReportsTotal: number;
    publishedHotspotsTotal: number;
    resolvedHotspotsTotal: number;
    inProgressHotspotsTotal: number;
    unprocessedHotspotsTotal: number;
  };
}

export interface PublicStatisticsResponse {
  success: boolean;
  data?: PublicStatisticsData;
  error?: string;
}

// Dữ liệu mẫu chuẩn M1 dành riêng cho chế độ DEMO khi chưa có kết nối database trực tiếp
const CANONICAL_DEMO_REPORTS = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'traffic_jam' as IssueType,
    occurred_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    time_window: '16:30 - 17:30',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'illegal_parking' as IssueType,
    occurred_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    time_window: '06:30 - 07:15',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'unsafe_crossing' as IssueType,
    occurred_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    time_window: '11:00 - 12:00',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    school_id: '00000000-0000-0000-0000-000000000001',
    issue_type: 'collision_risk' as IssueType,
    occurred_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    time_window: '16:45 - 17:30',
    verification_status: 'verified',
    is_demo: true,
    is_hidden: false,
  },
];

const ISSUE_TYPE_CONFIG: Record<IssueType, { label: string; color: string }> = {
  traffic_jam: { label: 'Ùn tắc giao thông', color: '#2563EB' }, // Blue
  illegal_parking: { label: 'Dừng, đỗ xe không đúng vị trí', color: '#D97706' }, // Amber
  unsafe_crossing: { label: 'Sang đường không an toàn', color: '#E11D48' }, // Rose
  blind_spot: { label: 'Khuất tầm nhìn', color: '#7C3AED' }, // Purple
  collision_risk: { label: 'Nguy cơ va chạm', color: '#DC2626' }, // Red
  other: { label: 'Vấn đề khác', color: '#64748B' }, // Slate
};

// Chuyển đổi timestamp ISO sang ngày theo múi giờ Việt Nam (UTC+7)
function toVNLocalDate(isoString: string): Date {
  const d = new Date(isoString);
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  return new Date(d.getTime() + vnOffsetMs);
}

function formatVNDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getPublicStatisticsAction(
  params: PublicStatisticsParams
): Promise<PublicStatisticsResponse> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Chưa cấu hình Supabase Server.' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Xác định phạm vi thời gian (Múi giờ Asia/Ho_Chi_Minh: UTC+7)
    const now = new Date();
    const vnNow = toVNLocalDate(now.toISOString());
    let startDateObj: Date;
    let endDateObj: Date = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), 23, 59, 59, 999));

    const preset = params.preset || '30d';
    const groupBy = params.groupBy || 'day';
    const includeDemo = Boolean(params.includeDemo);

    if (preset === '7d') {
      const d = new Date(endDateObj.getTime() - 6 * 86400000);
      startDateObj = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    } else if (preset === '90d') {
      const d = new Date(endDateObj.getTime() - 89 * 86400000);
      startDateObj = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    } else if (preset === 'custom' && params.startDate && params.endDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(params.startDate) || !dateRegex.test(params.endDate)) {
        return { success: false, error: 'Định dạng ngày tùy chỉnh không hợp lệ (cần định dạng chuẩn YYYY-MM-DD).' };
      }

      const startParts = params.startDate.split('-').map(Number);
      const endParts = params.endDate.split('-').map(Number);

      startDateObj = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0));
      endDateObj = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999));

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return { success: false, error: 'Ngày đã chọn không tồn tại trên lịch thực tế.' };
      }

      if (startDateObj.getTime() > endDateObj.getTime()) {
        return { success: false, error: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' };
      }

      // Giới hạn khoảng ngày tối đa 365 ngày để bảo vệ hiệu năng
      const diffDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / 86400000);
      if (diffDays > 365) {
        return { success: false, error: 'Khoảng thời gian tùy chỉnh tối đa là 365 ngày (1 năm).' };
      }
    } else {
      // Mặc định: 30 ngày gần nhất
      const d = new Date(endDateObj.getTime() - 29 * 86400000);
      startDateObj = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    }

    const startISO = new Date(startDateObj.getTime() - 7 * 60 * 60 * 1000).toISOString();
    const endISO = new Date(endDateObj.getTime() - 7 * 60 * 60 * 1000).toISOString();

    // 2. Lấy thông tin Trường học đang áp dụng (Bảo đảm kiểm tra quyền công khai public_map_approved)
    let schoolData = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Trường THPT Tam Hiệp',
      address: 'Đường Phạm Văn Thuận, Khu phố 4, Phường Tam Hiệp, TP. Biên Hòa (cũ), Tỉnh Đồng Nai',
      isPilot: true,
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.schoolId || '');

    if (params.schoolId === 'all') {
      schoolData = {
        id: 'all',
        name: 'Toàn địa bàn TP. Biên Hòa (cũ)',
        address: 'Toàn bộ 30 phường/xã thuộc địa bàn TP. Biên Hòa (cũ)',
        isPilot: false,
      };
    } else if (params.schoolId) {
      let requestedSchool: {
        id: string;
        name: string;
        address: string;
        status?: string;
        is_focal_point?: boolean;
        public_map_approved?: boolean;
      } | null = null;

      if (isUUID) {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, address, is_focal_point, status, public_map_approved')
          .eq('id', params.schoolId)
          .maybeSingle();

        if (!error && data) {
          requestedSchool = data;
        }
      }

      // Tra cứu đối chiếu trong danh mục chuẩn 86 trường nếu chưa đồng bộ vào DB
      if (!requestedSchool) {
        const found = BIEN_HOA_SCHOOLS_DATA.find((s) => s.id === params.schoolId);
        if (found && found.public_map_approved) {
          requestedSchool = {
            id: found.id,
            name: found.name,
            address: found.address,
            is_focal_point: Boolean(found.is_focal_point),
            status: found.status,
            public_map_approved: found.public_map_approved,
          };
        }
      }

      if (!requestedSchool || !requestedSchool.public_map_approved) {
        return {
          success: false,
          error: 'Trường học không tồn tại hoặc chưa được cấp phép công khai bản đồ số theo quy định.',
        };
      }

      schoolData = {
        id: requestedSchool.id,
        name: requestedSchool.name.replace(/\s*\(Thí điểm DEMO\)\s*/i, '').trim(),
        address: requestedSchool.address,
        isPilot: requestedSchool.status === 'pilot' || Boolean(requestedSchool.is_focal_point),
      };
    } else {
      // Mặc định: Chọn trường điểm trọng tâm đã được duyệt công khai
      const { data: dbSchools } = await supabase
        .from('schools')
        .select('id, name, address, is_focal_point, status, public_map_approved')
        .eq('public_map_approved', true)
        .order('is_focal_point', { ascending: false })
        .limit(1);

      if (dbSchools && dbSchools.length > 0) {
        const s = dbSchools[0];
        schoolData = {
          id: s.id,
          name: s.name.replace(/\s*\(Thí điểm DEMO\)\s*/i, '').trim(),
          address: s.address,
          isPilot: s.status === 'pilot' || s.is_focal_point,
        };
      }
    }

    // 3. Thử gọi RPC nếu hàm rpc_get_public_statistics đã được nạp trên DB
    let rpcResult: any = null;
    const isSchoolUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolData.id);
    const rpcSchoolId = (schoolData.id === 'all' || !isSchoolUUID) ? null : schoolData.id;
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('rpc_get_public_statistics', {
        p_school_id: rpcSchoolId,
        p_start_date: startISO,
        p_end_date: endISO,
        p_include_demo: includeDemo,
      });

      if (!rpcErr && rpcData) {
        rpcResult = rpcData;
      }
    } catch {
      // Bỏ qua nếu RPC chưa được chạy trên Supabase Cloud
    }

    // Kiểm tra lỗi từ RPC nếu có (ví dụ: trường chưa duyệt công khai, khoảng ngày sai)
    if (rpcResult && rpcResult.success === false) {
      return {
        success: false,
        error: rpcResult.message || 'Lỗi kiểm tra quyền dữ liệu trường học từ máy chủ.',
      };
    }

    // 4. Nếu có kết quả RPC thành công đầy đủ từ PostgreSQL
    if (rpcResult && rpcResult.metrics) {
      const m = rpcResult.metrics;
      const chart2Raw = rpcResult.chart2_issues || [];
      const totalRep = m.verified_reports_count || 0;

      const chart2Issues: IssueTypeDistribution[] = Object.keys(ISSUE_TYPE_CONFIG).map((typeKey) => {
        const item = chart2Raw.find((c: any) => c.issue_type === typeKey);
        const count = item ? Number(item.count) : 0;
        const percentage = totalRep > 0 ? Math.round((count / totalRep) * 100) : 0;
        return {
          issueType: typeKey as IssueType,
          label: ISSUE_TYPE_CONFIG[typeKey as IssueType].label,
          count,
          percentage,
          color: ISSUE_TYPE_CONFIG[typeKey as IssueType].color,
        };
      });

      const w = rpcResult.chart3_windows || {};
      const chart3Windows: TimeWindowDistribution[] = [
        {
          windowKey: 'morning',
          label: 'Sáng',
          timeRange: '06:00 – 09:00',
          count: Number(w.morning || 0),
          percentage: totalRep > 0 ? Math.round((Number(w.morning || 0) / totalRep) * 100) : 0,
        },
        {
          windowKey: 'noon',
          label: 'Trưa',
          timeRange: '10:30 – 13:30',
          count: Number(w.noon || 0),
          percentage: totalRep > 0 ? Math.round((Number(w.noon || 0) / totalRep) * 100) : 0,
        },
        {
          windowKey: 'afternoon',
          label: 'Chiều',
          timeRange: '15:00 – 18:00',
          count: Number(w.afternoon || 0),
          percentage: totalRep > 0 ? Math.round((Number(w.afternoon || 0) / totalRep) * 100) : 0,
        },
        {
          windowKey: 'other',
          label: 'Khung giờ khác',
          timeRange: 'Ngoài cao điểm',
          count: Number(w.other || 0),
          percentage: totalRep > 0 ? Math.round((Number(w.other || 0) / totalRep) * 100) : 0,
        },
        {
          windowKey: 'unspecified',
          label: 'Chưa xác định',
          timeRange: 'Thiếu mốc giờ',
          count: Number(w.unspecified || 0),
          percentage: totalRep > 0 ? Math.round((Number(w.unspecified || 0) / totalRep) * 100) : 0,
        },
      ];

      const hp = rpcResult.chart4_hotspots || {};
      const totalHp = m.published_hotspots_count || 0;
      const chart4Hotspots: HotspotProcessingDistribution[] = [
        {
          status: 'unprocessed',
          label: 'Chưa xử lý',
          count: Number(hp.unprocessed || 0),
          percentage: totalHp > 0 ? Math.round((Number(hp.unprocessed || 0) / totalHp) * 100) : 0,
          color: '#94A3B8',
        },
        {
          status: 'in_progress',
          label: 'Đang xử lý',
          count: Number(hp.in_progress || 0),
          percentage: totalHp > 0 ? Math.round((Number(hp.in_progress || 0) / totalHp) * 100) : 0,
          color: '#3B82F6',
        },
        {
          status: 'resolved',
          label: 'Đã xử lý',
          count: Number(hp.resolved || 0),
          percentage: totalHp > 0 ? Math.round((Number(hp.resolved || 0) / totalHp) * 100) : 0,
          color: '#10B981',
        },
      ];

      return {
        success: true,
        data: {
          school: schoolData,
          filter: {
            preset,
            startDate: formatVNDate(startDateObj),
            endDate: formatVNDate(endDateObj),
            groupBy,
            includeDemo,
          },
          lastUpdated: new Date().toISOString(),
          dataSource: 'database_rpc',
          reportsDataStatus: 'ready',
          metrics: {
            verifiedReportsCount: totalRep,
            publishedHotspotsCount: totalHp,
            resolvedHotspotsCount: m.resolved_hotspots_count || 0,
            inProgressHotspotsCount: m.in_progress_hotspots_count || 0,
          },
          chart1Time: rpcResult.chart1_time || [],
          chart2Issues,
          chart3Windows,
          chart4Hotspots,
          notes: {
            verifiedReportsTotal: totalRep,
            publishedHotspotsTotal: totalHp,
            resolvedHotspotsTotal: m.resolved_hotspots_count || 0,
            inProgressHotspotsTotal: m.in_progress_hotspots_count || 0,
            unprocessedHotspotsTotal: Number(hp.unprocessed || 0),
          },
        },
      };
    }

    // 5. Fallback khi RPC chưa được cài đặt: Truy vấn qua Views & Phân định an toàn
    // 5.1. Lấy danh sách Hotspots công khai từ public_hotspots_view (100% bảo đảm 5 điều kiện)
    // NGUYÊN TẮC TÁCH BIỆT: Real Mode CHỈ lấy is_demo = false, Demo Mode CHỈ lấy is_demo = true
    let hotspotsQuery = supabase
      .from('public_hotspots_view')
      .select('hotspot_id, school_id, hotspot_name, severity, processing_status, publication_status, published_at, is_demo')
      .eq('is_demo', includeDemo);

    if (schoolData.id !== 'all' && isSchoolUUID) {
      hotspotsQuery = hotspotsQuery.eq('school_id', schoolData.id);
    }

    const { data: dbHotspots } = await hotspotsQuery;

    const publishedHotspots = dbHotspots || [];

    const publishedHotspotsCount = publishedHotspots.length;
    const resolvedHotspotsCount = publishedHotspots.filter((h) => h.processing_status === 'resolved').length;
    const inProgressHotspotsCount = publishedHotspots.filter((h) => h.processing_status === 'in_progress').length;
    const unprocessedHotspotsCount = publishedHotspots.filter((h) => h.processing_status === 'unprocessed').length;

    // 5.2. Xác định nguồn dữ liệu Reports an toàn
    // NGUYÊN TẮC: Tuyệt đối không dùng anon key truy vấn bảng reports vì RLS chặn sẽ biến lỗi quyền thành số 0 giả tạo!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let verifiedReportsList: any[] = [];
    let dataSource: 'database_rpc' | 'server_role_query' | 'demo_mock_fixtures' = 'database_rpc';
    let reportsDataStatus: 'ready' | 'rpc_pending_migration' = 'ready';
    let rpcPendingNotice: string | undefined = undefined;

    if (serviceRoleKey && serviceRoleKey.trim() !== '') {
      // Nhánh 2a: Có Service Role Key -> Truy vấn an toàn từ server Node.js
      const serverAdmin = createClient(supabaseUrl, serviceRoleKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      let adminReportsQuery = serverAdmin
        .from('reports')
        .select('id, issue_type, occurred_at, time_window, reviewed_at, verification_status, is_demo, is_hidden')
        .eq('verification_status', 'verified')
        .eq('is_hidden', false)
        .eq('is_demo', includeDemo);

      if (schoolData.id !== 'all') {
        adminReportsQuery = adminReportsQuery.eq('school_id', schoolData.id);
      }

      const { data: adminReports } = await adminReportsQuery;

      verifiedReportsList = adminReports || [];
      dataSource = 'server_role_query';
      reportsDataStatus = 'ready';
    } else if (includeDemo) {
      // Nhánh 2b: Chế độ DEMO -> Nạp fixture chuẩn M1 (toàn bộ is_demo: true)
      verifiedReportsList = CANONICAL_DEMO_REPORTS;
      dataSource = 'demo_mock_fixtures';
      reportsDataStatus = 'ready';
    } else {
      // Nhánh 2c: Real Mode khi chưa nạp RPC và không có Service Role Key
      // Ghi nhận trung thực: Trạng thái chờ kích hoạt migration, không giả vờ rằng trường học có 0 phản ánh
      dataSource = 'database_rpc';
      reportsDataStatus = 'rpc_pending_migration';
      rpcPendingNotice = 'Hàm rpc_get_public_statistics chưa được cài đặt trên Supabase Cloud. Dữ liệu phản ánh thời gian thực tạm thời chưa sẵn sàng. Vui lòng nạp migration MIGRATION_PROMPT9_PUBLIC_STATS.sql trên Supabase SQL Editor.';
      verifiedReportsList = [];
    }

    // Lọc theo khoảng thời gian (dựa trên reviewed_at - thời điểm xác minh)
    // NGUYÊN TẮC BẢO TOÀN: Chỉ sử dụng reviewed_at, tuyệt đối không dùng occurred_at hay submitted_at thay thế
    const filteredReports = verifiedReportsList.filter((r) => {
      if (!r.reviewed_at) return false;
      const reviewDate = new Date(r.reviewed_at);
      return reviewDate >= new Date(startISO) && reviewDate <= new Date(endISO);
    });

    const verifiedReportsCount = filteredReports.length;

    // 5.3. Xây dựng Biểu đồ 1: Số phản ánh đã xác minh theo thời gian
    // Tạo danh sách các mốc thời gian liên tục từ startDate đến endDate
    const timeMap = new Map<string, { label: string; count: number }>();

    if (groupBy === 'day') {
      const curr = new Date(startDateObj);
      while (curr <= endDateObj) {
        const dateKey = formatVNDate(curr);
        const dayLabel = `${String(curr.getUTCDate()).padStart(2, '0')}/${String(curr.getUTCMonth() + 1).padStart(2, '0')}`;
        timeMap.set(dateKey, { label: dayLabel, count: 0 });
        curr.setUTCDate(curr.getUTCDate() + 1);
      }

      filteredReports.forEach((r) => {
        if (!r.reviewed_at) return;
        const d = toVNLocalDate(r.reviewed_at);
        const dateKey = formatVNDate(d);
        if (timeMap.has(dateKey)) {
          timeMap.get(dateKey)!.count += 1;
        }
      });
    } else if (groupBy === 'month') {
      const curr = new Date(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth(), 1);
      const endMonth = new Date(endDateObj.getUTCFullYear(), endDateObj.getUTCMonth(), 1);
      while (curr <= endMonth) {
        const monthKey = `${curr.getUTCFullYear()}-${String(curr.getUTCMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `T${curr.getUTCMonth() + 1}/${curr.getUTCFullYear()}`;
        timeMap.set(monthKey, { label: monthLabel, count: 0 });
        curr.setMonth(curr.getMonth() + 1);
      }

      filteredReports.forEach((r) => {
        if (!r.reviewed_at) return;
        const d = toVNLocalDate(r.reviewed_at);
        const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        if (timeMap.has(monthKey)) {
          timeMap.get(monthKey)!.count += 1;
        }
      });
    } else {
      // groupBy === 'week' (nhóm 7 ngày)
      const curr = new Date(startDateObj);
      let weekIndex = 1;
      while (curr <= endDateObj) {
        const weekKey = `w-${formatVNDate(curr)}`;
        const weekLabel = `T. ${String(curr.getUTCDate()).padStart(2, '0')}/${String(curr.getUTCMonth() + 1).padStart(2, '0')}`;
        timeMap.set(weekKey, { label: weekLabel, count: 0 });
        curr.setUTCDate(curr.getUTCDate() + 7);
        weekIndex++;
      }

      filteredReports.forEach((r) => {
        if (!r.reviewed_at) return;
        const repTime = toVNLocalDate(r.reviewed_at).getTime();
        const keys = Array.from(timeMap.keys());
        let assignedKey = keys[0];
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          const kDateStr = k.replace('w-', '');
          const [y, m, d] = kDateStr.split('-').map(Number);
          const kTime = Date.UTC(y, m - 1, d);
          if (repTime >= kTime) {
            assignedKey = k;
          }
        }
        if (timeMap.has(assignedKey)) {
          timeMap.get(assignedKey)!.count += 1;
        }
      });
    }

    const chart1Time: TimeSeriesPoint[] = Array.from(timeMap.entries()).map(([date, item]) => ({
      date,
      label: item.label,
      count: item.count,
    }));

    // 5.4. Xây dựng Biểu đồ 2: Phân bố theo loại vấn đề
    const issueCounts: Record<IssueType, number> = {
      traffic_jam: 0,
      illegal_parking: 0,
      unsafe_crossing: 0,
      blind_spot: 0,
      collision_risk: 0,
      other: 0,
    };

    filteredReports.forEach((r) => {
      const issueKey = r.issue_type as IssueType;
      if (issueKey && issueCounts[issueKey] !== undefined) {
        issueCounts[issueKey] += 1;
      } else {
        issueCounts.other += 1;
      }
    });

    const chart2Issues: IssueTypeDistribution[] = (Object.keys(ISSUE_TYPE_CONFIG) as IssueType[]).map((type) => {
      const count = issueCounts[type];
      const percentage = verifiedReportsCount > 0 ? Math.round((count / verifiedReportsCount) * 100) : 0;
      return {
        issueType: type,
        label: ISSUE_TYPE_CONFIG[type].label,
        count,
        percentage,
        color: ISSUE_TYPE_CONFIG[type].color,
      };
    });

    // 5.5. Xây dựng Biểu đồ 3: Phân bố theo khung giờ xảy ra sự việc (occurred_at)
    // NGUYÊN TẮC: Phân tách rõ ràng giữa "Khung giờ khác" (ngoài cao điểm) và "Chưa có thông tin thời gian" (unspecified)
    const windowCounts = {
      morning: 0,
      noon: 0,
      afternoon: 0,
      other: 0,
      unspecified: 0,
    };

    filteredReports.forEach((r) => {
      let categorized = false;
      if (r.occurred_at) {
        const d = toVNLocalDate(r.occurred_at);
        if (!isNaN(d.getTime())) {
          const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
          if (minutes >= 360 && minutes <= 540) {
            // 06:00 - 09:00
            windowCounts.morning += 1;
          } else if (minutes >= 630 && minutes <= 810) {
            // 10:30 - 13:30
            windowCounts.noon += 1;
          } else if (minutes >= 900 && minutes <= 1080) {
            // 15:00 - 18:00
            windowCounts.afternoon += 1;
          } else {
            // Khung giờ có mốc thời gian rõ ràng nhưng ngoài 3 ca cao điểm
            windowCounts.other += 1;
          }
          categorized = true;
        }
      }

      if (!categorized && r.time_window) {
        const tw = r.time_window.toLowerCase();
        if (tw.includes('06:') || tw.includes('07:') || tw.includes('sáng')) {
          windowCounts.morning += 1;
          categorized = true;
        } else if (tw.includes('11:') || tw.includes('12:') || tw.includes('trưa')) {
          windowCounts.noon += 1;
          categorized = true;
        } else if (tw.includes('16:') || tw.includes('17:') || tw.includes('chiều')) {
          windowCounts.afternoon += 1;
          categorized = true;
        } else if (tw.includes('khác') || tw.includes('ngoài cao điểm')) {
          windowCounts.other += 1;
          categorized = true;
        }
      }

      if (!categorized) {
        // Thiếu hoàn toàn trường occurred_at hoặc dữ liệu không hợp lệ -> đưa vào 'unspecified'
        windowCounts.unspecified += 1;
      }
    });

    const chart3Windows: TimeWindowDistribution[] = [
      {
        windowKey: 'morning',
        label: 'Sáng',
        timeRange: '06:00 – 09:00',
        count: windowCounts.morning,
        percentage: verifiedReportsCount > 0 ? Math.round((windowCounts.morning / verifiedReportsCount) * 100) : 0,
      },
      {
        windowKey: 'noon',
        label: 'Trưa',
        timeRange: '10:30 – 13:30',
        count: windowCounts.noon,
        percentage: verifiedReportsCount > 0 ? Math.round((windowCounts.noon / verifiedReportsCount) * 100) : 0,
      },
      {
        windowKey: 'afternoon',
        label: 'Chiều',
        timeRange: '15:00 – 18:00',
        count: windowCounts.afternoon,
        percentage: verifiedReportsCount > 0 ? Math.round((windowCounts.afternoon / verifiedReportsCount) * 100) : 0,
      },
      {
        windowKey: 'other',
        label: 'Khung giờ khác',
        timeRange: 'Ngoài cao điểm',
        count: windowCounts.other,
        percentage: verifiedReportsCount > 0 ? Math.round((windowCounts.other / verifiedReportsCount) * 100) : 0,
      },
      {
        windowKey: 'unspecified',
        label: 'Chưa xác định',
        timeRange: 'Thiếu mốc giờ',
        count: windowCounts.unspecified,
        percentage: verifiedReportsCount > 0 ? Math.round((windowCounts.unspecified / verifiedReportsCount) * 100) : 0,
      },
    ];

    // 5.6. Xây dựng Biểu đồ 4: Tiến độ xử lý Hotspot
    const chart4Hotspots: HotspotProcessingDistribution[] = [
      {
        status: 'unprocessed',
        label: 'Chưa xử lý',
        count: unprocessedHotspotsCount,
        percentage: publishedHotspotsCount > 0 ? Math.round((unprocessedHotspotsCount / publishedHotspotsCount) * 100) : 0,
        color: '#94A3B8',
      },
      {
        status: 'in_progress',
        label: 'Đang xử lý',
        count: inProgressHotspotsCount,
        percentage: publishedHotspotsCount > 0 ? Math.round((inProgressHotspotsCount / publishedHotspotsCount) * 100) : 0,
        color: '#3B82F6',
      },
      {
        status: 'resolved',
        label: 'Đã xử lý',
        count: resolvedHotspotsCount,
        percentage: publishedHotspotsCount > 0 ? Math.round((resolvedHotspotsCount / publishedHotspotsCount) * 100) : 0,
        color: '#10B981',
      },
    ];

    return {
      success: true,
      data: {
        school: schoolData,
        filter: {
          preset,
          startDate: formatVNDate(startDateObj),
          endDate: formatVNDate(endDateObj),
          groupBy,
          includeDemo,
        },
        lastUpdated: new Date().toISOString(),
        dataSource,
        reportsDataStatus,
        rpcPendingNotice,
        metrics: {
          verifiedReportsCount,
          publishedHotspotsCount,
          resolvedHotspotsCount,
          inProgressHotspotsCount,
        },
        chart1Time,
        chart2Issues,
        chart3Windows,
        chart4Hotspots,
        notes: {
          verifiedReportsTotal: verifiedReportsCount,
          publishedHotspotsTotal: publishedHotspotsCount,
          resolvedHotspotsTotal: resolvedHotspotsCount,
          inProgressHotspotsTotal: inProgressHotspotsCount,
          unprocessedHotspotsTotal: unprocessedHotspotsCount,
        },
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi lấy số liệu thống kê.';
    console.error('[getPublicStatisticsAction] Exception:', message);
    return {
      success: false,
      error: message,
    };
  }
}
