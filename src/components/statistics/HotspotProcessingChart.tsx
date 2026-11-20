'use client';

import React from 'react';
import { CheckCircle2, Clock, HelpCircle, ShieldAlert } from 'lucide-react';
import type { HotspotProcessingDistribution } from '@/app/actions/public-statistics';

interface HotspotProcessingChartProps {
  data: HotspotProcessingDistribution[];
  totalPublished: number;
  isLoading?: boolean;
}

export function HotspotProcessingChart({
  data,
  totalPublished,
  isLoading,
}: HotspotProcessingChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100/70 animate-pulse rounded-xl" />
      </div>
    );
  }

  const resolvedItem = data.find((d) => d.status === 'resolved') || { count: 0, percentage: 0 };
  const inProgressItem = data.find((d) => d.status === 'in_progress') || { count: 0, percentage: 0 };
  const unprocessedItem = data.find((d) => d.status === 'unprocessed') || { count: 0, percentage: 0 };

  return (
    <div className="block-elevated rounded-2xl p-5 space-y-4">
      {/* Header Biểu đồ */}
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <h3 className="text-sm font-bold text-navy-950">
              4. Tiến độ xử lý điểm Hotspot công khai
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Tổng: {totalPublished} Hotspot
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Trạng thái vận hành hiện tại tính đến nay của các điểm đã đủ 5 điều kiện công khai (không phụ thuộc khoảng ngày lọc phản ánh)
        </p>
      </div>

      {totalPublished === 0 ? (
        <div className="h-60 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Chưa có Hotspot công khai</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            Hiện chưa có điểm cần chú ý nào đáp ứng đủ 5 điều kiện công khai để thống kê.
          </p>
        </div>
      ) : (
        <div className="space-y-5 pt-1">
          {/* Thanh phân bố tiến độ tổng thể (Segmented Bar) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span className="font-medium">Phân bố tỷ lệ giải quyết:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {resolvedItem.percentage}% đã xử lý
              </span>
            </div>

            <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {/* Đã xử lý */}
              <div
                style={{ width: `${resolvedItem.percentage}%` }}
                className="bg-emerald-500 transition-all duration-ui hover:brightness-110"
                title={`Đã xử lý: ${resolvedItem.count} (${resolvedItem.percentage}%)`}
              />
              {/* Đang xử lý */}
              <div
                style={{ width: `${inProgressItem.percentage}%` }}
                className="bg-blue-500 transition-all duration-ui hover:brightness-110"
                title={`Đang xử lý: ${inProgressItem.count} (${inProgressItem.percentage}%)`}
              />
              {/* Chưa xử lý */}
              <div
                style={{ width: `${unprocessedItem.percentage}%` }}
                className="bg-slate-400 transition-all duration-ui hover:brightness-110"
                title={`Chưa xử lý: ${unprocessedItem.count} (${unprocessedItem.percentage}%)`}
              />
            </div>
          </div>

          {/* 3 Thẻ trạng thái chi tiết */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Đã xử lý */}
            <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 flex flex-col justify-between space-y-2 hover:border-emerald-300 transition-all duration-micro">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã xử lý
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-800">
                  {resolvedItem.percentage}%
                </span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-navy-950 font-mono block">
                  {resolvedItem.count}
                </span>
                <p className="text-[10px] text-emerald-800 leading-tight mt-0.5">
                  Đã có giải pháp can thiệp hoàn thành (phân luồng, vạch kẻ đường, biển báo...)
                </p>
              </div>
            </div>

            {/* 2. Đang xử lý */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 flex flex-col justify-between space-y-2 hover:border-blue-300 transition-all duration-micro">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Đang xử lý
                </span>
                <span className="text-[11px] font-mono font-bold text-blue-800">
                  {inProgressItem.percentage}%
                </span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-navy-950 font-mono block">
                  {inProgressItem.count}
                </span>
                <p className="text-[10px] text-blue-800 leading-tight mt-0.5">
                  Đang triển khai phương án hoặc phối hợp địa phương
                </p>
              </div>
            </div>

            {/* 3. Chưa xử lý */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-2 hover:border-slate-300 transition-all duration-micro">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  Chưa xử lý
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-600">
                  {unprocessedItem.percentage}%
                </span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-navy-950 font-mono block">
                  {unprocessedItem.count}
                </span>
                <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                  Mới ghi nhận, đang chờ khảo sát lập phương án can thiệp
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chú thích phương pháp tính */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Đếm Hotspot độc lập, không cộng dồn từ số lượng phản ánh.</span>
        <span className="font-mono text-[10px]">5 Điều kiện công khai</span>
      </div>
    </div>
  );
}
