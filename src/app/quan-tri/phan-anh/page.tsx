'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Inbox,
  Filter,
  Check,
  X,
  Eye,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  Image as ImageIcon,
  ShieldCheck,
  Link as LinkIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getAdminReportsAction,
  getReportMediaSignedUrlAction,
  verifyReportAction,
  rejectReportAction,
  type AdminReportItem,
} from '@/app/actions/admin-reports';
import { ISSUE_TYPE_LABELS, type IssueType, type VerificationStatus } from '@/types';

export default function AdminReportsPage() {
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('id');

  const { profile, isVerifier, isAdmin } = useAuth();
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | IssueType>('all');
  const [includeDemo, setIncludeDemo] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Report Modal
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);

  // Reject Dialog
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load Data
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminReportsAction({
        status: statusFilter,
        issueType: issueFilter,
        includeDemo,
      });

      if (res.success && res.data) {
        setReports(res.data);

        // Auto select if id in query
        if (initialSelectedId) {
          const match = res.data.find((r) => r.id === initialSelectedId);
          if (match) setSelectedReport(match);
        }
      } else {
        setError(res.error || 'Không thể tải danh sách phản ánh.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, issueFilter, includeDemo, initialSelectedId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Load Signed URL when a report with image is selected
  useEffect(() => {
    if (!selectedReport || !selectedReport.media_path) {
      setSignedImageUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoadingImage(true);

    getReportMediaSignedUrlAction(selectedReport.media_path).then((res) => {
      if (isMounted) {
        if (res.success && res.signedUrl) {
          setSignedImageUrl(res.signedUrl);
        } else {
          setSignedImageUrl(null);
        }
        setIsLoadingImage(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedReport]);

  // Filtered in-memory list
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return reports;
    const term = searchTerm.toLowerCase();
    return reports.filter(
      (r) =>
        r.description.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term) ||
        (ISSUE_TYPE_LABELS[r.issue_type] || '').toLowerCase().includes(term)
    );
  }, [reports, searchTerm]);

  // Handle Verify Action
  const handleVerify = async () => {
    if (!selectedReport || !profile) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await verifyReportAction({
        reportId: selectedReport.id,
        reviewerId: profile.id,
        reviewerName: profile.full_name || 'Cán bộ xác minh',
      });

      if (res.success) {
        // Cập nhật state cục bộ
        setHighlightedReportId(selectedReport.id);
        setSelectedReport({
          ...selectedReport,
          verification_status: 'verified',
          reviewed_by: profile.full_name,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        });
        await loadReports();
      } else {
        setActionError(res.error || 'Không thể xác minh phản ánh.');
      }
    } catch {
      setActionError('Lỗi hệ thống khi cập nhật.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject Action
  const handleReject = async () => {
    if (!selectedReport || !profile) return;
    if (!rejectionReasonInput.trim() || rejectionReasonInput.trim().length < 5) {
      setActionError('Bắt buộc nhập lý do từ chối cụ thể (tối thiểu 5 ký tự) để người dân nắm rõ.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await rejectReportAction({
        reportId: selectedReport.id,
        reviewerId: profile.id,
        reviewerName: profile.full_name || 'Cán bộ xác minh',
        rejectionReason: rejectionReasonInput.trim(),
      });

      if (res.success) {
        setHighlightedReportId(selectedReport.id);
        setSelectedReport({
          ...selectedReport,
          verification_status: 'invalid',
          rejection_reason: rejectionReasonInput.trim(),
          reviewed_by: profile.full_name,
          reviewed_at: new Date().toISOString(),
        });
        setIsRejectDialogOpen(false);
        setRejectionReasonInput('');
        await loadReports();
      } else {
        setActionError(res.error || 'Không thể từ chối phản ánh.');
      }
    } catch {
      setActionError('Lỗi hệ thống khi cập nhật.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <h1 className="text-xl font-bold text-navy-950">
            Quản lý & Thẩm định Phản ánh Giao thông
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem xét chi tiết hiện trường, tọa độ và ảnh minh chứng. Từ chối bắt buộc phải ghi rõ lý do để phản hồi người dân.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {reports.filter((r) => r.verification_status === 'pending').length} phản ánh chờ xác minh
            </span>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo nội dung, mã..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc Trạng thái */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | VerificationStatus)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác minh (pending)</option>
              <option value="verified">Đã xác minh (verified)</option>
              <option value="invalid">Không hợp lệ (invalid)</option>
            </select>
          </div>

          {/* Lọc Loại vấn đề */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Loại vấn đề:</span>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value as 'all' | IssueType)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Tất cả loại vấn đề</option>
              {Object.entries(ISSUE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* DEMO toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 ml-1">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <span>Bao gồm DEMO</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredList.length} kết quả
          </span>
          <button
            type="button"
            onClick={loadReports}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tải lại danh sách"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Mã phản ánh</th>
                <th className="p-3.5">Loại vấn đề</th>
                <th className="p-3.5">Khung giờ</th>
                <th className="p-3.5">Mô tả hiện trường</th>
                <th className="p-3.5">Trạng thái xác minh</th>
                <th className="p-3.5">Hotspot liên quan</th>
                <th className="p-3.5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang tải danh sách phản ánh từ Supabase...</span>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                      highlightedReportId === r.id ? 'animate-row-highlight' : ''
                    }`}
                    onClick={() => setSelectedReport(r)}
                  >
                    <td className="p-3.5 font-mono text-[11px] font-bold text-navy-950">
                      <div className="flex items-center gap-1.5">
                        <span>{r.id.slice(0, 8)}...</span>
                        {r.is_demo && (
                          <span className="px-1 rounded text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-800">
                      {ISSUE_TYPE_LABELS[r.issue_type] || r.issue_type}
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {r.time_window}
                    </td>

                    <td className="p-3.5 max-w-xs text-slate-600">
                      <p className="line-clamp-2 text-xs leading-relaxed" title={r.description}>
                        {r.description}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.verification_status === 'verified'
                            ? 'bg-blue-100 text-blue-800'
                            : r.verification_status === 'invalid'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.verification_status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {r.verification_status === 'invalid' && <XCircle className="w-3 h-3" />}
                        {r.verification_status === 'pending' && <Clock className="w-3 h-3" />}
                        <span>
                          {r.verification_status === 'verified'
                            ? 'Đã xác minh'
                            : r.verification_status === 'invalid'
                            ? 'Không hợp lệ'
                            : 'Chờ xác minh'}
                        </span>
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      {r.hotspot_name ? (
                        <span className="text-blue-600 font-semibold truncate max-w-[150px] block">
                          {r.hotspot_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa gắn</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap min-w-[100px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(r);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-semibold text-xs transition-all duration-micro active:scale-[0.96] shadow-2xs"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Không có phản ánh nào phù hợp</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT PHẢN ÁNH */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                    Thẩm định chi tiết phản ánh
                  </span>
                  {selectedReport.is_demo && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      DEMO
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-navy-950 mt-0.5">
                  Mã phản ánh: <code>{selectedReport.id}</code>
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  setActionError(null);
                  setIsRejectDialogOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs text-slate-700 flex-1">
              {/* Alert lỗi hành động nếu có */}
              {actionError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedReport.verification_status === 'verified'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                    : selectedReport.verification_status === 'invalid'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    Trạng thái hiện tại
                  </span>
                  <div className="text-sm font-extrabold mt-0.5">
                    {selectedReport.verification_status === 'verified'
                      ? 'ĐÃ XÁC MINH HỢP LỆ'
                      : selectedReport.verification_status === 'invalid'
                      ? 'KHÔNG HỢP LỆ (BỊ TỪ CHỐI)'
                      : 'ĐANG CHỜ XÁC MINH'}
                  </div>
                  {selectedReport.reviewed_by && (
                    <div className="text-[11px] opacity-80 mt-1">
                      Cán bộ thẩm định: <strong>{selectedReport.reviewed_by}</strong> (
                      {new Date(selectedReport.reviewed_at || '').toLocaleString('vi-VN')})
                    </div>
                  )}
                </div>

                <span className="text-2xl">
                  {selectedReport.verification_status === 'verified' ? '✅' : selectedReport.verification_status === 'invalid' ? '❌' : '⏳'}
                </span>
              </div>

              {/* Lý do từ chối nếu có */}
              {selectedReport.verification_status === 'invalid' && selectedReport.rejection_reason && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <strong>Lý do từ chối ghi nhận:</strong> {selectedReport.rejection_reason}
                </div>
              )}

              {/* Nội dung mô tả hiện trường */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Mô tả tình trạng từ người phản ánh
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed font-medium">
                  {selectedReport.description}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Loại vấn đề
                  </span>
                  <span className="font-bold text-navy-950">
                    {ISSUE_TYPE_LABELS[selectedReport.issue_type] || selectedReport.issue_type}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Khung giờ xảy ra
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedReport.time_window}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Thời điểm gửi
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedReport.submitted_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tọa độ GPS nội bộ
                  </span>
                  <span className="font-mono text-navy-950 font-bold text-[11px]">
                    {selectedReport.actual_lat.toFixed(5)}°N, {selectedReport.actual_lng.toFixed(5)}°E
                  </span>
                </div>
              </div>

              {/* Ảnh minh chứng bảo mật */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  Ảnh minh chứng hiện trường (Chế độ xem bảo mật cán bộ)
                </span>

                {isLoadingImage ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Đang tạo Signed URL an toàn từ bucket private-reports...
                  </div>
                ) : signedImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-64 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signedImageUrl}
                      alt="Minh chứng hiện trường"
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100 italic">
                    Không có ảnh minh chứng đính kèm trong phản ánh này.
                  </div>
                )}
              </div>

              {/* Form nhập lý do từ chối khi bấm Từ chối */}
              {isRejectDialogOpen && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-rose-900 font-bold">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Nhập lý do từ chối phản ánh (Bắt buộc):</span>
                    </div>
                    <span className={`text-[10px] font-mono ${rejectionReasonInput.trim().length >= 5 ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>
                      {rejectionReasonInput.trim().length}/5 ký tự tối thiểu
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="VD: Vị trí mô tả không chính xác, ảnh mờ không thể nhận diện được điểm mù..."
                    className={`w-full p-3 rounded-xl border text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 bg-white ${
                      rejectionReasonInput.trim().length > 0 && rejectionReasonInput.trim().length < 5
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-rose-200 focus:ring-rose-500'
                    }`}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejectDialogOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isProcessing || rejectionReasonInput.trim().length < 5}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs"
                    >
                      {isProcessing ? 'Đang cập nhật...' : 'Xác nhận Từ chối'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Thao tác sẽ tự động ghi vết vào bảng <code>audit_logs</code>.
              </span>

              {/* Chỉ Verifier hoặc Admin mới có nút thao tác */}
              {(isVerifier || isAdmin) && !isRejectDialogOpen && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejectDialogOpen(true);
                      setRejectionReasonInput('');
                      setActionError(null);
                    }}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Đánh dấu Không hợp lệ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isProcessing || selectedReport.verification_status === 'verified'}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {selectedReport.verification_status === 'verified'
                        ? 'Đã xác minh hợp lệ'
                        : 'Xác minh Phản ánh'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
