'use client';

import React, { useState } from 'react';
import { PieChart, AlertCircle } from 'lucide-react';
import type { IssueTypeDistribution } from '@/app/actions/public-statistics';

interface DonutIssueChartProps {
  data: IssueTypeDistribution[];
  isLoading?: boolean;
}

export function DonutIssueChart({ data, isLoading }: DonutIssueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100/70 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Cấu hình vòng Donut SVG
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  // Tính toán stroke-dasharray và stroke-dashoffset cho từng lát cắt
  let accumulatedPercent = 0;
  const slices = data.map((item, idx) => {
    const fraction = total > 0 ? item.count / total : 0;
    const strokeDash = fraction * circumference;
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += fraction;

    return {
      ...item,
      strokeDash,
      strokeDashoffset,
      idx,
    };
  });

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="block-elevated rounded-2xl p-5 space-y-4">
      {/* Header Biểu đồ */}
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h3 className="text-sm font-bold text-navy-950">
              2. Phân bố theo loại vấn đề
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Tổng: {total}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Tỷ lệ phát sinh theo 6 danh mục vấn đề giao thông quy chuẩn
        </p>
      </div>

      {total === 0 ? (
        <div className="h-60 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
          <PieChart className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Chưa có dữ liệu phân loại</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            Không có phản ánh xác minh nào trong khoảng thời gian này.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Donut SVG tương tác */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90 select-none overflow-visible"
              role="img"
              aria-label="Biểu đồ phân bố loại vấn đề"
            >
              {/* Vòng nền mờ */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="24"
              />

              {/* Các lát cắt Donut */}
              {slices.map((slice) => {
                if (slice.count === 0) return null;
                const isHovered = hoveredIdx === slice.idx;

                return (
                  <circle
                    key={slice.issueType}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 30 : 24}
                    strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-micro ease-emil-out"
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Nội dung trung tâm của Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeItem ? (
                <>
                  <span className="text-lg font-extrabold text-navy-950 leading-tight">
                    {activeItem.count}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 mt-0.5">
                    {activeItem.percentage}%
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 max-w-[100px] mt-0.5">
                    {activeItem.label}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-extrabold text-navy-950 leading-tight">
                    {total}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Phản ánh
                  </span>
                  <span className="text-[9px] text-slate-400">Đã xác minh</span>
                </>
              )}
            </div>
          </div>

          {/* Chú giải chi tiết (Legend) */}
          <div className="flex-1 w-full space-y-2">
            {data.map((item, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={item.issueType}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all duration-micro cursor-pointer border ${
                    isHovered
                      ? 'bg-slate-50 border-slate-300 shadow-xs scale-[1.01]'
                      : 'border-transparent hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700 truncate text-[11px] sm:text-xs">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-2 font-mono">
                    <span className="font-bold text-navy-950 text-xs">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-slate-400 w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cảnh báo nguyên tắc trung thực */}
      <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Lưu ý: Loại vấn đề có số lượng cao nhất không đồng nghĩa là nguy cơ nghiêm trọng nhất; cần kết hợp với đánh giá thực địa từ Nhà trường.
        </span>
      </div>
    </div>
  );
}
