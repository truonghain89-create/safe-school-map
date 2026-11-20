'use client';

import React from 'react';
import { SeverityBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Compass,
  FileCheck2,
  History,
  Timer,
} from 'lucide-react';
import type { PublicHotspot } from '@/types';
import { PROCESSING_STATUS_LABELS } from '@/types';

interface HotspotDetailDrawerProps {
  hotspot: PublicHotspot | null;
  onClose: () => void;
  onFlyTo: (lat: number, lng: number) => void;
}

/**
 * Định dạng mốc thời gian ISO hoặc Date thành chuỗi tiếng Việt chuẩn
 * Nếu giá trị null/undefined hoặc không hợp lệ -> trả về null để ẩn trường
 */
function formatDateTime(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  // Nếu chỉ có ngày (dạng YYYY-MM-DD)
  if (dateStr.length === 10) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Đầy đủ ngày giờ
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

export function HotspotDetailDrawer({
  hotspot,
  onClose,
  onFlyTo,
}: HotspotDetailDrawerProps) {
  if (!hotspot) return null;

  const statusMeta = PROCESSING_STATUS_LABELS[hotspot.processing_status];

  // Khuyến nghị an toàn theo mức độ nguy cơ
  const getSafetyRecommendation = () => {
    if (hotspot.processing_status === 'resolved') {
      return 'Khu vực này đã được các đơn vị liên quan xử lý can thiệp và cải thiện hạ tầng an toàn. Người tham gia giao thông tiếp tục duy trì tốc độ an toàn theo quy định.';
    }

    switch (hotspot.severity) {
      case 'high_risk':
        return 'Người tham gia giao thông qua khu vực này cần chủ động giảm tốc độ, quan sát kỹ các lối rẽ. Tuyệt đối không dừng đỗ lấn chiếm lòng đường trước cổng trường. Học sinh cần sang đường tại đúng vạch kẻ có sự hướng dẫn của lực lượng hỗ trợ.';
      case 'attention_needed':
        return 'Khu vực có mật độ phương tiện đông đúc vào các khung giờ cao điểm tan học và vào lớp. Phụ huynh đưa đón con em nên di chuyển vào vị trí đón trả theo sơ đồ nhà trường.';
      case 'surveyed_safe':
      default:
        return 'Vị trí này đã được khảo sát thực địa hiện trường, tình hình giao thông trật tự ổn định, tiếp tục duy trì văn hóa giao thông an toàn.';
    }
  };

  // Các mốc thời gian đã được định dạng (null nếu không có dữ liệu thực)
  const occurredTime = formatDateTime(hotspot.latest_occurred_at || hotspot.first_occurred_at);
  const verifiedTime = formatDateTime(hotspot.latest_verified_at);
  const surveyDate = formatDateTime(hotspot.latest_survey_date);
  const publishedTime = formatDateTime(hotspot.published_at);
  const updatedTime = formatDateTime(hotspot.updated_at);
  const validFromTime = formatDateTime(hotspot.valid_from);
  const validUntilTime = formatDateTime(hotspot.valid_until);

  // Kiểm tra xem có ít nhất một mốc thời gian để hiển thị mục timeline không
  const hasTimelineData =
    occurredTime ||
    verifiedTime ||
    surveyDate ||
    publishedTime ||
    updatedTime ||
    hotspot.time_window ||
    validFromTime ||
    validUntilTime;

  return (
    <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg p-4 space-y-3.5 transition-all duration-micro ease-emil-out animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SeverityBadge severity={hotspot.severity} />
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusMeta.color}`}
          >
            {statusMeta.label}
          </span>
          {hotspot.is_demo && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold">
              DEMO THÍ ĐIỂM
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Đóng bảng chi tiết"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-navy-950 leading-snug">
          {hotspot.hotspot_name}
        </h3>
        <p className="text-xs text-slate-600 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{hotspot.school_name}</span>
        </p>
        <p className="text-[11px] text-slate-400 pl-4">{hotspot.school_address}</p>
      </div>

      {/* Tọa độ công khai (Tim đường, đã tổng quát hóa) */}
      <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
        <span className="flex items-center gap-1.5 font-medium text-slate-700">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Vị trí công khai trên tuyến đường
        </span>
        <span className="font-mono text-navy-950 font-bold text-[10px]">
          {hotspot.public_lat.toFixed(5)}°N, {hotspot.public_lng.toFixed(5)}°E
        </span>
      </div>

      {/* =====================================================================
          MỤC THỜI GIAN THỰC TẾ (TUÂN THỦ: ẨN NẾU KHÔNG CÓ DỮ LIỆU)
         ===================================================================== */}
      {hasTimelineData && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <History className="w-3 h-3 text-blue-600" />
            Nhật ký thời gian thẩm định
          </span>

          <div className="space-y-1.5 text-[11px]">
            {/* 1. Thời gian ghi nhận sự việc thực tế */}
            {occurredTime && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Ghi nhận sự việc:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {occurredTime}
                </span>
              </div>
            )}

            {/* 2. Thời gian xác minh gần nhất của cán bộ */}
            {verifiedTime && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1 shrink-0">
                  <FileCheck2 className="w-3 h-3 text-blue-500" />
                  Xác minh gần nhất:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {verifiedTime}
                </span>
              </div>
            )}

            {/* 3. Thời gian khảo sát thực địa */}
            {surveyDate && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  Khảo sát hiện trường:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {surveyDate}
                </span>
              </div>
            )}

            {/* 4. Khung giờ ảnh hưởng (nếu có) */}
            {hotspot.time_window && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1 shrink-0">
                  <Timer className="w-3 h-3 text-purple-500" />
                  Khung giờ cao điểm:
                </span>
                <span className="font-semibold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                  {hotspot.time_window}
                </span>
              </div>
            )}

            {/* 5. Thời gian cập nhật gần nhất */}
            {(updatedTime || publishedTime) && (
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 text-[10px]">Cập nhật công bố:</span>
                <span className="text-slate-600 font-medium text-[10px]">
                  {updatedTime || publishedTime}
                </span>
              </div>
            )}

            {/* 6. Khoảng thời gian nguy cơ có hiệu lực (nếu có xác minh) */}
            {(validFromTime || validUntilTime) && (
              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 text-[10px]">Thời hạn hiệu lực:</span>
                <span className="text-slate-700 font-semibold text-[10px]">
                  {validFromTime ? `Từ ${validFromTime}` : ''}
                  {validUntilTime ? ` đến ${validUntilTime}` : ' (Đang theo dõi)'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Số lượng phản ánh đã xác minh */}
      <div className="flex items-center justify-between text-xs px-2.5 py-2 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-900">
        <span className="text-[11px] font-medium">Số phản ánh độc lập đã xác minh:</span>
        <strong className="font-bold text-blue-800">
          {hotspot.verified_report_count} phản ánh
        </strong>
      </div>

      {/* Khuyến nghị an toàn */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-navy-950 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          Khuyến nghị an toàn cho học sinh & phụ huynh:
        </span>
        <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
          {getSafetyRecommendation()}
        </p>
      </div>

      {/* Action footer */}
      <div className="pt-1 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onFlyTo(hotspot.public_lat, hotspot.public_lng)}
        >
          <Compass className="w-3.5 h-3.5 mr-1" />
          Định vị trung tâm điểm nóng
        </Button>
      </div>
    </div>
  );
}
