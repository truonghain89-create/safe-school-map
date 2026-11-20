'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldAlert,
  KeyRound,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { lookupReportAction, type LookupReportResult } from '@/app/actions/lookup-report';
import { ISSUE_TYPE_LABELS, PROCESSING_STATUS_LABELS } from '@/types';
import { Breadcrumb } from '@/components/common/Breadcrumb';

function formatTimestamp(isoStr?: string | null): string {
  if (!isoStr) return 'Không xác định';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return 'Không xác định';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

export default function TrackingPage() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<LookupReportResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await lookupReportAction(cleanCode);
      setResult(res);
    } catch {
      setResult({
        success: false,
        found: false,
        error: 'Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-8 sm:space-y-10 animate-in fade-in duration-300">
      <Breadcrumb items={[{ label: 'Tra cứu tiến độ phản ánh' }]} />

      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 shadow-xs mb-1">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          TRA CỨU TIẾN ĐỘ PHẢN ÁNH
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Nhập mã tra cứu bảo mật định dạng <strong>SFM-XXXX-XXXX</strong> bạn nhận được sau khi gửi phản ánh để kiểm tra tiến trình thẩm định thực địa từ nhà trường.
        </p>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4"
      >
        <div>
          <label className="text-xs font-bold text-navy-950 uppercase tracking-wider block mb-1.5">
            Mã tra cứu bảo mật (8-10 ký tự)
          </label>
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: SFM-8K92-XY34"
              className="w-full pl-4 pr-32 py-3 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase"
              maxLength={15}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !code.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-lg bg-navy-950 hover:bg-navy-900 disabled:bg-slate-300 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tra cứu...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Tra cứu ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-1 gap-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Tra cứu bảo mật một chiều bằng mã băm SHA-256
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">Mã thử nghiệm:</span>
            <button
              type="button"
              onClick={() => { setCode('SFM-DEMO-001'); }}
              className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono font-bold transition-colors"
              title="Thử mã phản ánh đã xác minh"
            >
              SFM-DEMO-001
            </button>
            <button
              type="button"
              onClick={() => { setCode('SFM-DEMO-002'); }}
              className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-mono font-bold transition-colors"
              title="Thử mã phản ánh đang chờ"
            >
              SFM-DEMO-002
            </button>
            <button
              type="button"
              onClick={() => { setCode('SFM-DEMO-003'); }}
              className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-mono font-bold transition-colors"
              title="Thử mã phản ánh không hợp lệ"
            >
              SFM-DEMO-003
            </button>
          </div>
        </div>
      </form>

      {/* Hiển thị lỗi hoặc Không tìm thấy */}
      {result && !result.found && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900">
                Không tìm thấy thông tin phản ánh
              </h3>
              <p className="text-xs text-rose-700 leading-relaxed">
                {result.error ||
                  'Mã tra cứu bạn nhập không tồn tại trong hệ thống. Vui lòng kiểm tra kỹ từng ký tự trên biên nhận.'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 text-[11px] text-slate-600 border border-rose-100 space-y-1">
            <strong>Gợi ý kiểm tra:</strong>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
              <li>Mã tra cứu luôn bắt đầu bằng tiền tố <code>SFM-</code></li>
              <li>Hệ thống không sử dụng các ký tự dễ nhầm lẫn như số <code>0</code>, chữ <code>O</code>, số <code>1</code>, chữ <code>I</code>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Hiển thị kết quả tra cứu thành công */}
      {result && result.found && result.data && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-3">
          {/* Status Header Banner */}
          <div
            className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              result.data.verificationStatus === 'verified'
                ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                : result.data.verificationStatus === 'invalid'
                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                : 'bg-amber-50/90 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                  result.data.verificationStatus === 'verified'
                    ? 'bg-blue-600 text-white'
                    : result.data.verificationStatus === 'invalid'
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {result.data.verificationStatus === 'verified' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : result.data.verificationStatus === 'invalid' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                  Trạng thái thẩm định
                </span>
                <span className="text-base font-extrabold">
                  {result.data.verificationStatus === 'verified'
                    ? 'ĐÃ ĐƯỢC XÁC MINH HỢP LỆ'
                    : result.data.verificationStatus === 'invalid'
                    ? 'KHÔNG ĐỦ ĐIỀU KIỆN XÁC MINH'
                    : 'ĐANG CHỜ CÁN BỘ XÁC MINH'}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-mono font-bold text-navy-950 shrink-0 self-start sm:self-auto">
              Mã: {result.data.trackingCode}
            </div>
          </div>

          {/* Detailed Info Card */}
          <div className="p-5 sm:p-7 space-y-5 text-xs text-slate-700">
            {/* Lời giải thích trạng thái */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs leading-relaxed space-y-1">
              <span className="font-bold text-navy-950 block">Thông điệp từ Tổ An toàn Giao thông:</span>
              <p className="text-slate-600">
                {result.data.verificationStatus === 'verified' &&
                  'Phản ánh của bạn đã được cán bộ nhà trường kiểm tra thực địa, đối chiếu và xác nhận có nguy cơ an toàn giao thông cần theo dõi hoặc can thiệp hạ tầng.'}
                {result.data.verificationStatus === 'pending' &&
                  'Phản ánh của bạn đã được mã hóa và lưu trữ an toàn trong hàng đợi. Cán bộ Tổ An toàn Trường THPT Tam Hiệp sẽ thẩm định trong khung giờ cao điểm gần nhất.'}
                {result.data.verificationStatus === 'invalid' &&
                  'Rất tiếc, phản ánh chưa đáp ứng đủ tiêu chuẩn thẩm định an toàn trường học hoặc thông tin vị trí không rõ ràng.'}
              </p>

              {/* Nếu invalid, hiển thị lý do từ chối bắt buộc */}
              {result.data.verificationStatus === 'invalid' && result.data.rejectionReason && (
                <div className="mt-2.5 pt-2 border-t border-rose-200 text-rose-800 bg-rose-50 p-2.5 rounded-lg text-xs font-medium">
                  <strong>Lý do từ chối:</strong> {result.data.rejectionReason}
                </div>
              )}
            </div>

            {/* Chi tiết nội dung được phép công khai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Loại vấn đề giao thông
                </span>
                <span className="font-bold text-navy-950 text-sm">
                  {ISSUE_TYPE_LABELS[result.data.issueType] || 'Vấn đề giao thông'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Thời điểm tiếp nhận
                </span>
                <span className="font-semibold text-slate-800">
                  {formatTimestamp(result.data.submittedAt)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Khung giờ xảy ra sự việc
                </span>
                <span className="font-semibold text-slate-800">
                  {result.data.timeWindow}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Đơn vị tiếp nhận thẩm định
                </span>
                <span className="font-semibold text-slate-800">
                  {result.data.schoolName}
                </span>
              </div>
            </div>

            {/* Thông tin Hotspot liên kết (nếu có) */}
            {result.data.hotspotName && (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Đã liên kết với Điểm cần chú ý (Hotspot)</span>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div>
                    <strong>Tên điểm cảnh báo:</strong> {result.data.hotspotName}
                  </div>
                  {result.data.hotspotProcessingStatus && (
                    <div className="flex items-center gap-2">
                      <span>Tiến độ can thiệp:</span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800">
                        {PROCESSING_STATUS_LABELS[result.data.hotspotProcessingStatus]?.label ||
                          result.data.hotspotProcessingStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              href="/ban-do"
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Xem vị trí các điểm đã công khai trên Bản đồ số</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                setCode('');
                setResult(null);
              }}
              className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tra cứu mã khác</span>
            </button>
          </div>
        </div>
      )}

      {/* Helpful FAQ Footer */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 text-xs">
        <h4 className="font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Quy trình xử lý phản ánh của nhà trường
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 text-[11px] leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <strong className="text-navy-950 block">1. Tiếp nhận & Mã hóa</strong>
            <p>Phản ánh được cấp mã SFM ẩn danh, ảnh minh chứng chuyển vào kho bảo mật riêng tư.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <strong className="text-navy-950 block">2. Khảo sát thực địa</strong>
            <p>Cán bộ xác minh đến hiện trường kiểm tra nguy cơ ùn tắc, điểm mù và lối sang đường.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <strong className="text-navy-950 block">3. Phê duyệt công khai</strong>
            <p>Ban Giám Hiệu ký duyệt công khai Hotspot lên bản đồ sau khi thẩm định đủ 5 điều kiện.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
