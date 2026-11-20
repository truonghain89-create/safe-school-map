'use client';

import React, { useState } from 'react';
import { Calendar, RotateCcw, RefreshCw, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import type { TimePreset } from '@/app/actions/public-statistics';

interface TimeFilterBarProps {
  preset: TimePreset;
  startDate: string;
  endDate: string;
  includeDemo: boolean;
  onFilterChange: (newPreset: TimePreset, customStart?: string, customEnd?: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  onToggleDemo: (includeDemo: boolean) => void;
  isRefreshing?: boolean;
}

export function TimeFilterBar({
  preset,
  startDate,
  endDate,
  includeDemo,
  onFilterChange,
  onReset,
  onRefresh,
  onToggleDemo,
  isRefreshing,
}: TimeFilterBarProps) {
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const presets: { id: TimePreset; label: string }[] = [
    { id: '7d', label: '7 ngày qua' },
    { id: '30d', label: '30 ngày qua (Chuẩn)' },
    { id: '90d', label: '90 ngày qua' },
    { id: 'custom', label: 'Tùy chỉnh' },
  ];

  const handlePresetClick = (p: TimePreset) => {
    setErrorMsg(null);
    if (p !== 'custom') {
      onFilterChange(p);
    } else {
      onFilterChange('custom', customStart, customEnd);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customStart || !customEnd) {
      setErrorMsg('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.');
      return;
    }

    if (customStart > customEnd) {
      setErrorMsg('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }

    onFilterChange('custom', customStart, customEnd);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Presets & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/70">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetClick(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-micro ease-emil-out ${
                preset === p.id
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-navy-950 hover:bg-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Right side controls: Demo Toggle, Refresh, Reset */}
        <div className="flex flex-wrap items-center gap-3">
          {/* DEMO Mode Toggle */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold cursor-pointer select-none hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => onToggleDemo(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className={includeDemo ? 'text-amber-800 font-bold' : 'text-slate-700'}>
              Chế độ DEMO
            </span>
            {includeDemo ? (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </label>

          {/* Reset Filter Button */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-navy-950 hover:bg-slate-50 transition-all duration-micro active:scale-95 shadow-xs"
            title="Đặt lại bộ lọc về mặc định (30 ngày gần nhất)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

          {/* Refresh Data Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all duration-micro active:scale-95 disabled:opacity-50 shadow-xs"
            title="Cập nhật lại số liệu từ máy chủ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Custom Date Form (Hiển thị khi preset === 'custom') */}
      {preset === 'custom' && (
        <form
          onSubmit={handleApplyCustom}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3 text-xs"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-semibold text-slate-700 shrink-0">Từ ngày:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-semibold text-slate-700 shrink-0">Đến ngày:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors w-full sm:w-auto ml-auto"
          >
            Áp dụng
          </button>
        </form>
      )}

      {/* Thông báo lỗi nếu chọn ngày sai */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dải thông tin thời gian đang chọn & Ghi chú phân định DEMO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Khoảng thời gian:</span>
          <strong className="text-navy-950 font-mono">
            {startDate} &rarr; {endDate}
          </strong>
          <span className="text-[11px] text-slate-400 font-mono">(UTC+7)</span>
        </div>

        {includeDemo ? (
          <div className="inline-flex items-center gap-1.5 text-amber-800 font-medium text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Đang kèm dữ liệu DEMO mẫu chuẩn M1</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-emerald-800 font-medium text-[11px] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Dữ liệu thực tế 100% (Không chứa dữ liệu DEMO)</span>
          </div>
        )}
      </div>
    </div>
  );
}
