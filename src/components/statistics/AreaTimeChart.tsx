'use client';

import React, { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import type { TimeSeriesPoint } from '@/app/actions/public-statistics';

interface AreaTimeChartProps {
  data: TimeSeriesPoint[];
  groupBy: 'day' | 'week' | 'month';
  onGroupByChange: (groupBy: 'day' | 'week' | 'month') => void;
  isLoading?: boolean;
}

export function AreaTimeChart({
  data,
  groupBy,
  onGroupByChange,
  isLoading,
}: AreaTimeChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalReports = data.reduce((sum, p) => sum + p.count, 0);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100/70 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Kích thước SVG chuẩn
  const svgWidth = 640;
  const svgHeight = 260;
  const pad = { top: 30, right: 24, bottom: 44, left: 40 };
  const plotWidth = svgWidth - pad.left - pad.right;
  const plotHeight = svgHeight - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map((d) => d.count), 4);
  const yTicks = [0, Math.ceil(maxVal * 0.33), Math.ceil(maxVal * 0.66), maxVal];

  // Tính tọa độ điểm
  const points = data.map((d, i) => {
    const x = pad.left + (data.length > 1 ? (i / (data.length - 1)) * plotWidth : plotWidth / 2);
    const y = pad.top + plotHeight - (d.count / maxVal) * plotHeight;
    return { ...d, x, y };
  });

  // Tạo đường cong bezier trơn tru
  let linePath = '';
  if (points.length === 1) {
    linePath = `M ${pad.left} ${points[0].y} L ${pad.left + plotWidth} ${points[0].y}`;
  } else if (points.length > 1) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${pad.top + plotHeight} L ${points[0].x} ${pad.top + plotHeight} Z`
    : '';

  // Nhãn trục X giản lược tránh chồng chéo khi có nhiều ngày
  const step = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="block-elevated rounded-2xl p-5 space-y-4">
      {/* Header Biểu đồ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold text-navy-950">
              1. Số phản ánh đã xác minh theo thời gian
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Dựa trên thời điểm thẩm định chính thức (<span className="font-mono text-[11px]">reviewed_at</span>)
          </p>
        </div>

        {/* Nút phân nhóm: Ngày / Tuần / Tháng */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold self-start sm:self-auto">
          {(['day', 'week', 'month'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGroupByChange(g)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all duration-micro ${
                groupBy === g
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-navy-950'
              }`}
            >
              {g === 'day' ? 'Ngày' : g === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* Tóm tắt nhanh */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Tổng phản ánh hợp lệ trong kỳ:</span>
          <strong className="text-navy-950 font-bold">{totalReports} phản ánh</strong>
        </div>
        <span className="text-[11px] text-slate-400">Đơn vị: lượt phản ánh</span>
      </div>

      {/* Khu vực Render SVG Area Chart */}
      {data.length === 0 || totalReports === 0 ? (
        <div className="h-60 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center p-6 text-center">
          <Calendar className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Chưa ghi nhận phản ánh xác minh nào</p>
          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
            Trong khoảng thời gian đã chọn chưa có phản ánh hợp lệ nào được thẩm định.
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="Biểu đồ số phản ánh đã xác minh theo thời gian"
          >
            <defs>
              <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Trục Y lưới mờ */}
            {yTicks.map((tickVal) => {
              const y = pad.top + plotHeight - (tickVal / maxVal) * plotHeight;
              return (
                <g key={tickVal} className="text-slate-400">
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={pad.left + plotWidth}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Vùng Area Gradient */}
            {areaPath && (
              <path d={areaPath} fill="url(#blueAreaGrad)" className="transition-all duration-ui" />
            )}

            {/* Đường Line chính */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Trục X nhãn thời gian */}
            {points.map((p, i) => {
              const isLabelVisible = i % step === 0 || i === points.length - 1;
              if (!isLabelVisible) return null;
              return (
                <text
                  key={p.date}
                  x={p.x}
                  y={pad.top + plotHeight + 20}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {p.label}
                </text>
              );
            })}

            {/* Đường chỉ dẫn Hover (Crosshair) */}
            {hoveredIdx !== null && points[hoveredIdx] && (
              <g pointerEvents="none">
                <line
                  x1={points[hoveredIdx].x}
                  y1={pad.top}
                  x2={points[hoveredIdx].x}
                  y2={pad.top + plotHeight}
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={points[hoveredIdx].x}
                  cy={points[hoveredIdx].y}
                  r="5.5"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* Điểm tương tác (Vòng tròn) */}
            {points.map((p, i) => (
              <circle
                key={p.date}
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 6 : 3.5}
                fill={hoveredIdx === i ? '#2563EB' : '#FFFFFF'}
                stroke="#2563EB"
                strokeWidth={hoveredIdx === i ? 2.5 : 2}
                className="cursor-pointer transition-all duration-micro"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>

          {/* Floating Tooltip khi hover */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div
              className="absolute pointer-events-none z-20 -top-2 bg-navy-950 text-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 text-xs transition-all duration-micro transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
              }}
            >
              <div className="font-semibold text-slate-300 text-[10px]">
                {points[hoveredIdx].date}
              </div>
              <div className="font-bold text-white text-xs flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>{points[hoveredIdx].count} phản ánh xác minh</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chú thích phương pháp tính */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Không tính phản ánh đang chờ xác minh hoặc không hợp lệ.</span>
        <span className="font-mono text-[10px]">Múi giờ: Asia/Ho_Chi_Minh</span>
      </div>
    </div>
  );
}
