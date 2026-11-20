'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Building2,
  Clock,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  getPublicStatisticsAction,
  type PublicStatisticsData,
  type TimePreset,
  type GroupByInterval,
} from '@/app/actions/public-statistics';
import { OverviewCards } from '@/components/statistics/OverviewCards';
import { TimeFilterBar } from '@/components/statistics/TimeFilterBar';
import { SchoolFilterSelect } from '@/components/statistics/SchoolFilterSelect';
import { AreaTimeChart } from '@/components/statistics/AreaTimeChart';
import { DonutIssueChart } from '@/components/statistics/DonutIssueChart';
import { TimeWindowBarChart } from '@/components/statistics/TimeWindowBarChart';
import { HotspotProcessingChart } from '@/components/statistics/HotspotProcessingChart';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/FeedbackStates';

export default function PublicStatisticsPage() {
  const [data, setData] = useState<PublicStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc trạng thái
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [preset, setPreset] = useState<TimePreset>('30d');
  const [customStart, setCustomStart] = useState<string | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<string | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<GroupByInterval>('day');
  const [includeDemo, setIncludeDemo] = useState<boolean>(false);

  const fetchStatistics = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getPublicStatisticsAction({
        schoolId: selectedSchoolId,
        preset,
        startDate: customStart,
        endDate: customEnd,
        groupBy,
        includeDemo,
      });

      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error || 'Không thể tải dữ liệu thống kê từ máy chủ.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ thống kê.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSchoolId, preset, customStart, customEnd, groupBy, includeDemo]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleFilterChange = (
    newPreset: TimePreset,
    newStart?: string,
    newEnd?: string
  ) => {
    setPreset(newPreset);
    if (newPreset === 'custom' && newStart && newEnd) {
      setCustomStart(newStart);
      setCustomEnd(newEnd);
    }
  };

  const handleReset = () => {
    setSelectedSchoolId('all');
    setPreset('30d');
    setCustomStart(undefined);
    setCustomEnd(undefined);
    setGroupBy('day');
    setIncludeDemo(false);
  };

  const formattedLastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : null;

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 animate-fade-in">
      {/* 1. Header & Phần giới thiệu */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/90 pb-6">
        <div className="space-y-2">
          {/* Breadcrumb & Pilot Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Dữ liệu mở an toàn giao thông</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-xs font-semibold text-slate-500">
              Khu vực thành phố Biên Hòa (cũ)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            {selectedSchoolId === 'all'
              ? 'THỐNG KÊ TÌNH HÌNH GIAO THÔNG TOÀN THÀNH PHỐ'
              : `THỐNG KÊ GIAO THÔNG: ${data?.school.name?.toUpperCase() || 'TRƯỜNG HỌC'}`}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Tổng hợp dữ liệu phản ánh đã được xác minh, giúp nhận diện những vấn đề cần quan tâm và theo dõi hiệu quả xử lý tại khu vực trường học.
          </p>
        </div>

        {/* Thông tin phạm vi trường học & Thời gian cập nhật */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5 shrink-0 self-start md:self-auto min-w-[260px] max-w-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
            {selectedSchoolId === 'all' ? (
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="truncate">
              {data?.school.name || (selectedSchoolId === 'all' ? 'Toàn địa bàn TP. Biên Hòa (cũ)' : 'Trường THPT Tam Hiệp')}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="line-clamp-1">{data?.school.address || 'Khu vực TP. Biên Hòa (cũ)'}</span>
          </div>

          {formattedLastUpdated && (
            <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Cập nhật gần nhất:</span>
              <span className="font-mono font-medium text-slate-600">
                {formattedLastUpdated}
              </span>
            </div>
          )}

          {data?.dataSource && (
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Nguồn dữ liệu:</span>
              <span className="font-medium text-slate-600">
                {data.dataSource === 'demo_mock_fixtures'
                  ? 'Dữ liệu mẫu M1 (DEMO)'
                  : data.reportsDataStatus === 'rpc_pending_migration'
                    ? 'Chờ nạp RPC (Bảo vệ RLS)'
                    : data.dataSource === 'server_role_query'
                      ? 'Server Query đặc quyền'
                      : 'PostgreSQL RPC'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Bộ chọn phạm vi trường học hoặc toàn thành phố (86 trường) */}
      <SchoolFilterSelect
        selectedSchoolId={selectedSchoolId}
        onSelectSchool={(id) => setSelectedSchoolId(id)}
        isLoading={isLoading || isRefreshing}
      />

      {/* 2. Cảnh báo chế độ DEMO khi được bật */}
      {includeDemo && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold text-amber-950">
              Đang bật chế độ xem dữ liệu thử nghiệm (DEMO Mode)
            </strong>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Các số liệu dưới đây được tổng hợp từ dữ liệu mẫu chuẩn M1 nhằm phục vụ kiểm thử tính năng và đánh giá trực quan bố cục biểu đồ. Dữ liệu này <strong>không phản ánh</strong> tình trạng an toàn giao thông thực tế của Trường THPT Tam Hiệp.
            </p>
          </div>
        </div>
      )}

      {/* 3. Bộ lọc thời gian */}
      <TimeFilterBar
        preset={preset}
        startDate={data?.filter.startDate || 'Đang xác định'}
        endDate={data?.filter.endDate || 'Đang xác định'}
        includeDemo={includeDemo}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onRefresh={fetchStatistics}
        onToggleDemo={(checked) => setIncludeDemo(checked)}
        isRefreshing={isRefreshing}
      />

      {/* 4. Nội dung chính: Thẻ tổng quan & Biểu đồ */}
      {isLoading ? (
        <LoadingState message="Đang truy vấn số liệu thống kê từ Supabase..." />
      ) : error ? (
        <ErrorState
          title="Không thể tải dữ liệu thống kê"
          message={error}
          onRetry={fetchStatistics}
        />
      ) : data ? (
        <div className="space-y-6">
          {/* Thông báo trạng thái dữ liệu khi RPC đang chờ migration */}
          {!includeDemo && data.reportsDataStatus === 'rpc_pending_migration' && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3.5 text-xs text-amber-950 shadow-xs animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-bold text-amber-950">
                    Dữ liệu Phản ánh đang chờ kích hoạt hàm RPC trên Supabase Cloud
                  </strong>
                  <button
                    onClick={() => setIncludeDemo(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Bật Chế độ DEMO</span>
                  </button>
                </div>
                <p className="text-amber-900 text-xs leading-relaxed">
                  <strong>Trạng thái bảo mật RLS:</strong> Bảng <code>reports</code> được bảo vệ nghiêm ngặt chống rò rỉ dữ liệu cá nhân (PII), ngăn chặn truy vấn trực tiếp từ người dùng ẩn danh (anon). Để hiển thị thống kê tổng hợp công khai mà không vi phạm RLS, hệ thống sử dụng hàm <code>rpc_get_public_statistics</code> chạy với quyền <code>SECURITY DEFINER</code>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <div>• <strong>Hotspots (Điểm nguy cơ):</strong> Đang truy vấn trực tiếp qua <code>public_hotspots_view</code> (bảo đảm 5 điều kiện công khai).</div>
                  <div>• <strong>Reports (Phản ánh):</strong> Cần nạp tệp SQL <code>supabase/MIGRATION_PROMPT9_PUBLIC_STATS.sql</code> trên Supabase SQL Editor để kích hoạt luồng dữ liệu thật.</div>
                </div>
              </div>
            </div>
          )}

          {/* Thông báo dữ liệu thực tế giai đoạn khởi động thí điểm (khi RPC đã sẵn sàng nhưng chưa có phản ánh) */}
          {!includeDemo && data.reportsDataStatus === 'ready' && data.metrics.verifiedReportsCount === 0 && data.metrics.publishedHotspotsCount === 0 && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold text-navy-950">
                  Giai đoạn khởi động tiếp nhận phản ánh thực tế (Trường THPT Tam Hiệp)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hiện tại chưa có phản ánh thực tế nào hoàn tất quy trình thẩm định 5 bước trong khoảng thời gian đã chọn. Hệ thống tuân thủ nguyên tắc <strong>trung thực dữ liệu</strong>, không tự sinh số liệu giả. Bạn có thể bật <strong>&quot;Chế độ DEMO&quot;</strong> ở thanh công cụ phía trên để xem trước giao diện và bố cục các biểu đồ với dữ liệu mẫu chuẩn M1.
                </p>
              </div>
            </div>
          )}

          {/* Bốn thẻ số liệu tổng quan */}
          <OverviewCards
            metrics={data.metrics}
            isLoading={isRefreshing}
            isDemo={includeDemo}
          />

          {/* Bốn biểu đồ bắt buộc (Grid 2 cột) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Biểu đồ 1: Số phản ánh đã xác minh theo thời gian */}
            <AreaTimeChart
              data={data.chart1Time}
              groupBy={groupBy}
              onGroupByChange={(g) => setGroupBy(g)}
              isLoading={isRefreshing}
            />

            {/* Biểu đồ 2: Phân bố theo loại vấn đề */}
            <DonutIssueChart
              data={data.chart2Issues}
              isLoading={isRefreshing}
            />

            {/* Biểu đồ 3: Phân bố theo khung giờ */}
            <TimeWindowBarChart
              data={data.chart3Windows}
              isLoading={isRefreshing}
            />

            {/* Biểu đồ 4: Tình trạng xử lý Hotspot */}
            <HotspotProcessingChart
              data={data.chart4Hotspots}
              totalPublished={data.metrics.publishedHotspotsCount}
              isLoading={isRefreshing}
            />
          </div>
        </div>
      ) : null}

      {/* 5. Ghi chú bảo mật & Quyền riêng tư (Luôn hiển thị minh bạch) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-500 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-navy-950 font-bold text-xs border-b border-slate-100 pb-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Cam kết Minh bạch & Bảo vệ Dữ liệu Cá nhân (PII)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed text-slate-600">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Không lưu danh tính:</strong> Hệ thống tuyệt đối không công khai tên, số điện thoại hay thông tin cá nhân của người gửi phản ánh.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tọa độ đại diện:</strong> Vị trí Hotspot trên bản đồ là tọa độ đại diện khu vực tim đường công cộng, không để lộ vị trí cá nhân.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
            <span>
              <strong>Thẩm định 5 bước:</strong> Chỉ những điểm đã qua khảo sát và được Ban Giám Hiệu phê duyệt mới được tính vào số liệu công khai.
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400 border-t border-slate-100">
          <span>
            Phát triển theo tiêu chuẩn an toàn học đường M1 &bull; Đồng Nai
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/ban-do"
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              Xem Bản đồ số tương tác
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span>&bull;</span>
            <Link
              href="/gui-phan-anh"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Gửi phản ánh an toàn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
