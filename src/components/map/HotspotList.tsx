'use client';

import React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Badge, SeverityBadge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/FeedbackStates';
import {
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { PublicHotspot } from '@/types';
import { PROCESSING_STATUS_LABELS } from '@/types';

interface HotspotListProps {
  hotspots: PublicHotspot[];
  selectedHotspotId: string | null;
  onSelectHotspot: (hotspot: PublicHotspot) => void;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function HotspotList({
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
  isLoading,
  error,
  onRetry,
}: HotspotListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5 p-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-200 bg-white animate-pulse space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-16 h-4 bg-slate-200 rounded" />
            </div>
            <div className="w-3/4 h-4 bg-slate-200 rounded" />
            <div className="w-1/2 h-3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs space-y-2">
        <div className="font-bold flex items-center gap-1.5 text-rose-800">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          Không thể tải dữ liệu từ máy chủ
        </div>
        <p className="text-[11px] text-rose-700 leading-relaxed">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (hotspots.length === 0) {
    return (
      <EmptyState
        title="Không tìm thấy điểm nóng nào"
        description="Không có điểm an toàn nào khớp với bộ lọc hiện tại, hoặc các phản ánh chưa hoàn tất thẩm định 5 điều kiện công khai của nhà trường."
        className="py-8 border-none bg-transparent"
      />
    );
  }

  return (
    <div className="space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
      {hotspots.map((item) => {
        const isSelected = selectedHotspotId === item.hotspot_id;
        const statusMeta = PROCESSING_STATUS_LABELS[item.processing_status];

        return (
          <div
            key={item.hotspot_id}
            onClick={() => onSelectHotspot(item)}
            className={`group p-3.5 rounded-xl border cursor-pointer transition-all duration-micro ease-emil-out relative ${
              isSelected
                ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
            }`}
          >
            {/* Header: Severity + Processing Status */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <SeverityBadge severity={item.severity} />
                {item.is_demo && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
                    DEMO
                  </span>
                )}
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusMeta.color}`}
              >
                {statusMeta.label}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-xs font-bold text-navy-950 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1">
              {item.hotspot_name}
            </h4>

            {/* School context */}
            <p className="text-[11px] text-slate-500 line-clamp-1 mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{item.school_name}</span>
            </p>

            {/* Metrics footer */}
            <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">
                  {item.verified_report_count}
                </span>{' '}
                phản ánh xác minh
              </span>

              {item.latest_survey_date && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-2.5 h-2.5" />
                  {item.latest_survey_date}
                </span>
              )}

              <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                Xem <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
