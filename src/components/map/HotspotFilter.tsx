'use client';

import React from 'react';
import { FormInput, Select } from '@/components/common/FormControls';
import { Button } from '@/components/common/Button';
import { Filter, Search, RotateCcw, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import type { HotspotSeverity, ProcessingStatus } from '@/types';

export interface HotspotFilterState {
  searchTerm: string;
  severity: HotspotSeverity | 'all';
  processingStatus: ProcessingStatus | 'all';
  timeRange: 'all' | '7d' | '30d' | '90d';
  includeDemo: boolean;
}

interface HotspotFilterProps {
  filter: HotspotFilterState;
  onChange: (filter: HotspotFilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function HotspotFilter({
  filter,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}: HotspotFilterProps) {
  const isFiltered =
    filter.searchTerm !== '' ||
    filter.severity !== 'all' ||
    filter.processingStatus !== 'all' ||
    filter.timeRange !== 'all' ||
    !filter.includeDemo;

  return (
    <div className="space-y-3.5">
      {/* Tìm kiếm */}
      <FormInput
        label="Tìm kiếm địa điểm / tuyến đường"
        placeholder="VD: Cổng chính, Phạm Văn Thuận..."
        value={filter.searchTerm}
        onChange={(e) => onChange({ ...filter, searchTerm: e.target.value })}
        leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
      />

      {/* Lọc Mức độ nguy cơ */}
      <Select
        label="Mức độ nguy cơ"
        value={filter.severity}
        onChange={(e) =>
          onChange({ ...filter, severity: e.target.value as HotspotSeverity | 'all' })
        }
      >
        <option value="all">Tất cả mức độ nguy cơ</option>
        <option value="attention_needed">⚠️ Cần chú ý (Vàng)</option>
        <option value="high_risk">🛑 Nguy cơ cao (Đỏ)</option>
        <option value="surveyed_safe">🛡️ Đã khảo sát an toàn (Xanh lá)</option>
      </Select>

      {/* Lọc Trạng thái xử lý */}
      <Select
        label="Tiến độ xử lý"
        value={filter.processingStatus}
        onChange={(e) =>
          onChange({
            ...filter,
            processingStatus: e.target.value as ProcessingStatus | 'all',
          })
        }
      >
        <option value="all">Tất cả trạng thái xử lý</option>
        <option value="unprocessed">Chưa xử lý (Mới ghi nhận)</option>
        <option value="in_progress">Đang xử lý (Đang can thiệp)</option>
        <option value="resolved">Đã xử lý (Đã cải thiện)</option>
      </Select>

      {/* Lọc Thời gian */}
      <Select
        label="Thời gian công bố"
        value={filter.timeRange}
        onChange={(e) =>
          onChange({
            ...filter,
            timeRange: e.target.value as 'all' | '7d' | '30d' | '90d',
          })
        }
      >
        <option value="all">Tất cả thời gian</option>
        <option value="7d">Trong 7 ngày gần nhất</option>
        <option value="30d">Trong 30 ngày gần nhất</option>
        <option value="90d">Trong 90 ngày gần nhất</option>
      </Select>

      {/* Tách bạch Dữ liệu Thí điểm DEMO */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filter.includeDemo}
            onChange={(e) => onChange({ ...filter, includeDemo: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 transition-colors"
          />
          <span className="text-slate-700 font-medium">Bao gồm điểm thí điểm (DEMO)</span>
        </label>
        <span className="text-[10px] text-slate-400">Kiểm thử M1</span>
      </div>

      {/* Thống kê & Nút Đặt lại bộ lọc */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          Hiển thị: <strong className="text-navy-950 font-bold">{filteredCount}</strong> /{' '}
          {totalCount} điểm
        </span>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-slate-600 hover:text-rose-600 h-7 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Đặt lại
          </Button>
        )}
      </div>
    </div>
  );
}
