'use client';

import React, { useState } from 'react';
import { Clock, Sun, SunMedium, Sunset, Moon, HelpCircle } from 'lucide-react';
import type { TimeWindowDistribution } from '@/app/actions/public-statistics';

interface TimeWindowBarChartProps {
  data: TimeWindowDistribution[];
  isLoading?: boolean;
}

export function TimeWindowBarChart({ data, isLoading }: TimeWindowBarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100/70 animate-pulse rounded-xl" />
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.count), 4);

  const slotIcons: Record<string, React.ReactNode> = {
    morning: <Sun className="w-4 h-4 text-amber-500" />,
    noon: <SunMedium className="w-4 h-4 text-orange-500" />,
    afternoon: <Sunset className="w-4 h-4 text-indigo-500" />,
    other: <Moon className="w-4 h-4 text-slate-500" />,
    unspecified: <HelpCircle className="w-4 h-4 text-slate-400" />,
  };

  const slotColors: Record<string, { bg: string; border: string; bar: string }> = {
    morning: {
      bg: 'bg-amber-50/50',
      border: 'border-amber-200/80',
      bar: 'bg-gradient-to-t from-amber-500 to-amber-400',
    },
    noon: {
      bg: 'bg-orange-50/50',
      border: 'border-orange-200/80',
      bar: 'bg-gradient-to-t from-orange-500 to-orange-400',
    },
    afternoon: {
      bg: 'bg-indigo-50/50',
      border: 'border-indigo-200/80',
      bar: 'bg-gradient-to-t from-indigo-600 to-indigo-500',
    },
    other: {
      bg: 'bg-slate-50/60',
      border: 'border-slate-200',
      bar: 'bg-gradient-to-t from-slate-500 to-slate-400',
    },
    unspecified: {
      bg: 'bg-rose-50/40',
      border: 'border-rose-200',
      bar: 'bg-gradient-to-t from-rose-300 to-rose-200',
    },
  };

  return (
    <div className="block-elevated rounded-2xl p-5 space-y-4">
      {/* Header Biểu đồ */}
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-bold text-navy-950">
              3. Phân bố theo khung giờ trong ngày
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Tổng: {total}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Khung giờ xảy ra sự việc của các phản ánh được xác minh trong khoảng thời gian đang chọn.
        </p>
      </div>

      {total === 0 ? (
        <div className="h-60 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
          <Clock className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Chưa có dữ liệu khung giờ</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            Không có phản ánh nào được xác minh trong khoảng thời gian đang chọn.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Khu vực cột Bar dọc */}
          <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 pt-6 px-2 sm:px-6 border-b border-slate-200">
            {data.map((item) => {
              const heightPercent = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
              const isHovered = hoveredKey === item.windowKey;
              const styling = slotColors[item.windowKey] || slotColors.other;

              return (
                <div
                  key={item.windowKey}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredKey(item.windowKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  {/* Nhãn số lượng trên đỉnh cột */}
                  <div className="mb-1 text-center transition-transform duration-micro group-hover:-translate-y-0.5">
                    <span className="font-mono font-bold text-xs text-navy-950 block">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.percentage}%
                    </span>
                  </div>

                  {/* Thanh Bar với hiệu ứng scale nhẹ khi hover */}
                  <div className="w-full max-w-[56px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-full">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-ui ease-emil-out ${styling.bar} ${
                        isHovered ? 'brightness-110 shadow-md scale-y-[1.02]' : ''
                      }`}
                      style={{
                        height: `${Math.max(heightPercent, 4)}%`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nhãn khung giờ dưới thanh Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
            {data.map((item) => {
              const isHovered = hoveredKey === item.windowKey;
              const styling = slotColors[item.windowKey] || slotColors.other;

              return (
                <div
                  key={item.windowKey}
                  onMouseEnter={() => setHoveredKey(item.windowKey)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={`p-2.5 rounded-xl border text-center transition-all duration-micro cursor-pointer ${
                    isHovered
                      ? `${styling.bg} ${styling.border} shadow-xs scale-[1.02]`
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {slotIcons[item.windowKey]}
                    <span className="font-bold text-xs text-navy-950">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {item.timeRange}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chú thích phương pháp tính */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Không sử dụng thời điểm gửi phản ánh thay thế thời điểm xảy ra sự việc.</span>
        <span className="font-mono text-[10px]">Tách biệt dữ liệu thiếu giờ</span>
      </div>
    </div>
  );
}
