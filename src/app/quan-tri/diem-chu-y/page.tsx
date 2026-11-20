'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Eye,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Info,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  EyeOff,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getAdminHotspotsAction,
  createHotspotAction,
  updateHotspotAction,
  approveHotspotAction,
  hideHotspotAction,
  type AdminHotspotItem,
} from '@/app/actions/admin-hotspots';
import {
  HOTSPOT_SEVERITY_META,
  PROCESSING_STATUS_LABELS,
  PUBLICATION_STATUS_LABELS,
  type HotspotSeverity,
  type ProcessingStatus,
  type PublicationStatus,
} from '@/types';

export default function AdminHotspotsPage() {
  const { profile, isVerifier, isApprover, isAdmin } = useAuth();
  const [hotspots, setHotspots] = useState<AdminHotspotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [pubFilter, setPubFilter] = useState<'all' | PublicationStatus>('all');
  const [procFilter, setProcFilter] = useState<'all' | ProcessingStatus>('all');
  const [sevFilter, setSevFilter] = useState<'all' | HotspotSeverity>('all');
  const [includeDemo, setIncludeDemo] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newHotspotName, setNewHotspotName] = useState('');
  const [newSeverity, setNewSeverity] = useState<HotspotSeverity>('attention_needed');
  const [newPublicLat, setNewPublicLat] = useState('10.94190');
  const [newPublicLng, setNewPublicLng] = useState('106.86185');

  // Hide Modal
  const [hideTargetHotspot, setHideTargetHotspot] = useState<AdminHotspotItem | null>(null);
  const [hideReason, setHideReason] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Processing Action State
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load Data
  const loadHotspots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminHotspotsAction({
        publicationStatus: pubFilter,
        processingStatus: procFilter,
        severity: sevFilter,
        includeDemo,
      });

      if (res.success && res.data) {
        setHotspots(res.data);
      } else {
        setError(res.error || 'Không thể tải danh sách Hotspots.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, [pubFilter, procFilter, sevFilter, includeDemo]);

  useEffect(() => {
    loadHotspots();
  }, [loadHotspots]);

  // Filtered in-memory list
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return hotspots;
    const term = searchTerm.toLowerCase();
    return hotspots.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.id.toLowerCase().includes(term)
    );
  }, [hotspots, searchTerm]);

  // Handle Create Hotspot
  const handleCreateHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setActionError(null);
    setIsProcessing(true);

    try {
      const lat = parseFloat(newPublicLat);
      const lng = parseFloat(newPublicLng);

      if (isNaN(lat) || isNaN(lng)) {
        setActionError('Tọa độ công khai không hợp lệ.');
        setIsProcessing(false);
        return;
      }

      const res = await createHotspotAction({
        name: newHotspotName.trim(),
        schoolId: profile.school_id || null,
        actualLat: lat,
        actualLng: lng,
        publicLat: lat,
        publicLng: lng,
        severity: newSeverity,
        creatorId: profile.id,
        creatorName: profile.full_name || 'Cán bộ xác minh',
        isDemo: includeDemo,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setNewHotspotName('');
        setActionSuccess('Tạo Hotspot mới thành công! Điểm đang ở trạng thái chờ phê duyệt.');
        await loadHotspots();
      } else {
        setActionError(res.error || 'Không thể tạo Hotspot.');
      }
    } catch {
      setActionError('Lỗi hệ thống khi tạo Hotspot.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Approve Publication (Approver action)
  const handleApprove = async (hotspot: AdminHotspotItem) => {
    if (!profile) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await approveHotspotAction({
        hotspotId: hotspot.id,
        approverId: profile.id,
        approverName: profile.full_name || 'Ban Giám Hiệu',
      });

      if (res.success) {
        setHighlightedId(hotspot.id);
        setActionSuccess(`Đã phê duyệt công khai Hotspot "${hotspot.name}" lên Bản đồ số!`);
        await loadHotspots();
      } else {
        setActionError(res.error || 'Không thể phê duyệt.');
      }
    } catch {
      setActionError('Lỗi hệ thống khi phê duyệt.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Hide Hotspot (Approver action)
  const handleHideSubmit = async () => {
    if (!hideTargetHotspot || !profile) return;
    if (!hideReason.trim() || hideReason.trim().length < 5) {
      setActionError('Bắt buộc nhập lý do ẩn cụ thể (tối thiểu 5 ký tự).');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await hideHotspotAction({
        hotspotId: hideTargetHotspot.id,
        actorId: profile.id,
        actorName: profile.full_name || 'Cán bộ phê duyệt',
        reason: hideReason.trim(),
      });

      if (res.success) {
        setHighlightedId(hideTargetHotspot.id);
        setActionSuccess(`Đã ẩn Hotspot "${hideTargetHotspot.name}" khỏi Bản đồ công khai.`);
        setHideTargetHotspot(null);
        setHideReason('');
        await loadHotspots();
      } else {
        setActionError(res.error || 'Không thể ẩn Hotspot.');
      }
    } catch {
      setActionError('Lỗi hệ thống khi ẩn Hotspot.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Change Processing Status
  const handleStatusChange = async (hotspot: AdminHotspotItem, newStatus: ProcessingStatus) => {
    if (!profile) return;
    try {
      const res = await updateHotspotAction({
        hotspotId: hotspot.id,
        name: hotspot.name,
        severity: hotspot.severity,
        processingStatus: newStatus,
        actorId: profile.id,
        actorName: profile.full_name || 'Cán bộ',
      });

      if (res.success) {
        setHighlightedId(hotspot.id);
        await loadHotspots();
      }
    } catch (err) {
      console.error('Lỗi đổi trạng thái xử lý:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <h1 className="text-xl font-bold text-navy-950">
            Quản lý Điểm cần chú ý & Quy trình Phê duyệt
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp từ các phản ánh hợp lệ hoặc khảo sát thực địa. Hotspot chỉ xuất hiện công khai trên bản đồ khi đáp ứng đủ 5 điều kiện an toàn.
          </p>
        </div>

        {(isVerifier || isAdmin) && (
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              setActionError(null);
              setActionSuccess(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Hotspot mới</span>
          </button>
        )}
      </div>

      {/* Thông báo thông điệp hành động nếu có */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {actionSuccess}
          </span>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            {actionError}
          </span>
          <button type="button" onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5 Conditions Check Banner */}
      <div className="bg-navy-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>5 ĐIỀU KIỆN TIÊN QUYẾT ĐỂ HOTSPOT XUẤT HIỆN TRÊN BẢN ĐỒ CÔNG KHAI:</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-800">
            CƯỠNG CHẾ BỞI VIEW & RLS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-[11px] text-slate-300 pt-1">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
            <strong className="text-white block font-bold">1. Bằng chứng thực địa</strong>
            <p className="text-slate-400 text-[10px] leading-relaxed">Có Report xác minh hoặc phiếu khảo sát</p>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
            <strong className="text-white block font-bold">2. Đánh giá mức độ</strong>
            <p className="text-slate-400 text-[10px] leading-relaxed">Cán bộ xác minh tự thẩm định thủ công</p>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
            <strong className="text-white block font-bold">3. Ban Giám Hiệu duyệt</strong>
            <p className="text-slate-400 text-[10px] leading-relaxed">Người phê duyệt ký duyệt công khai</p>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
            <strong className="text-white block font-bold">4. Phê duyệt trường</strong>
            <p className="text-slate-400 text-[10px] leading-relaxed">Trường cho phép hiển thị bản đồ</p>
          </div>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition-colors">
            <strong className="text-white block font-bold">5. Trạng thái hiển thị</strong>
            <p className="text-slate-400 text-[10px] leading-relaxed">Hotspot không bị ẩn hoặc gỡ bỏ</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên Hotspot..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lọc Trạng thái công khai */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Công khai:</span>
            <select
              value={pubFilter}
              onChange={(e) => setPubFilter(e.target.value as 'all' | PublicationStatus)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unpublished">Chưa công khai (Chờ duyệt)</option>
              <option value="published">Đã công khai (Hiện trên map)</option>
              <option value="hidden">Đã ẩn (hidden)</option>
            </select>
          </div>

          {/* Lọc Mức độ nguy cơ */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Mức độ:</span>
            <select
              value={sevFilter}
              onChange={(e) => setSevFilter(e.target.value as 'all' | HotspotSeverity)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold focus:outline-none"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="attention_needed">Cần chú ý</option>
              <option value="high_risk">Nguy cơ cao</option>
              <option value="surveyed_safe">Đã khảo sát an toàn</option>
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
            {filteredList.length} điểm
          </span>
          <button
            type="button"
            onClick={loadHotspots}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tải lại danh sách"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Hotspots Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Tên Hotspot</th>
                <th className="p-3.5">Tọa độ công khai</th>
                <th className="p-3.5">Mức độ nguy cơ</th>
                <th className="p-3.5">Tiến độ can thiệp</th>
                <th className="p-3.5">Trạng thái công khai</th>
                <th className="p-3.5 text-right">Thao tác thẩm định</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang tải danh sách Hotspots từ Supabase...</span>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((h) => {
                  const sevMeta = HOTSPOT_SEVERITY_META[h.severity];
                  const procMeta = PROCESSING_STATUS_LABELS[h.processing_status];
                  const pubMeta = PUBLICATION_STATUS_LABELS[h.publication_status];

                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        highlightedId === h.id ? 'animate-row-highlight' : ''
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-navy-950 flex items-center gap-1.5">
                          <span>{h.name}</span>
                          {h.is_demo && (
                            <span className="px-1 rounded text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Liên kết: <strong>{h.verified_report_count} phản ánh</strong></span>
                          <span>&bull;</span>
                          <span>Cập nhật: {new Date(h.updated_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {h.public_lat.toFixed(5)}°N, {h.public_lng.toFixed(5)}°E
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            h.severity === 'high_risk'
                              ? 'bg-rose-100 text-rose-800'
                              : h.severity === 'attention_needed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {h.severity === 'high_risk' && '🛑'}
                          {h.severity === 'attention_needed' && '⚠️'}
                          {h.severity === 'surveyed_safe' && '🛡️'}
                          <span>{sevMeta?.label || h.severity}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        {/* Selector thay đổi trạng thái xử lý nếu có quyền */}
                        {isVerifier || isApprover || isAdmin ? (
                          <select
                            value={h.processing_status}
                            onChange={(e) => handleStatusChange(h, e.target.value as ProcessingStatus)}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700"
                          >
                            <option value="unprocessed">Chưa xử lý</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="resolved">Đã xử lý an toàn</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${procMeta?.color}`}>
                            {procMeta?.label}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            h.publication_status === 'published' && !h.is_hidden
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.is_hidden || h.publication_status === 'hidden'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {h.publication_status === 'published' && !h.is_hidden ? (
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-slate-500" />
                          )}
                          <span>
                            {h.is_hidden || h.publication_status === 'hidden'
                              ? 'Đã ẩn (hidden)'
                              : h.publication_status === 'published'
                              ? 'Đã công khai'
                              : 'Chưa công khai'}
                          </span>
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap min-w-[130px]">
                        {/* APPROVER ACTION BUTTONS */}
                        {(isApprover || isAdmin) && h.publication_status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(h)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all duration-micro active:scale-[0.96] shadow-xs"
                            title="Ký duyệt công khai lên bản đồ"
                          >
                            Duyệt công khai
                          </button>
                        )}

                        {(isApprover || isAdmin) && h.publication_status === 'published' && !h.is_hidden && (
                          <button
                            type="button"
                            onClick={() => {
                              setHideTargetHotspot(h);
                              setHideReason('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-all duration-micro active:scale-[0.96]"
                            title="Ẩn khỏi bản đồ công khai"
                          >
                            Ẩn điểm
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có Hotspot nào trong danh sách</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO HOTSPOT MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-950">
                    Tạo Điểm cần chú ý mới (Hotspot)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tổng hợp thông tin từ phản ánh hoặc khảo sát thực địa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHotspot} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tên địa điểm Hotspot *
                </label>
                <input
                  type="text"
                  required
                  value={newHotspotName}
                  onChange={(e) => setNewHotspotName(e.target.value)}
                  placeholder="VD: [DEMO] Cổng phụ đường hẻm số 4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-navy-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mức độ nguy cơ thẩm định thủ công *
                </label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as HotspotSeverity)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="attention_needed">⚠️ Cần chú ý (Vàng hổ phách)</option>
                  <option value="high_risk">🛑 Nguy cơ cao (Đỏ cảnh báo)</option>
                  <option value="surveyed_safe">🛡️ Đã khảo sát, chưa ghi nhận nguy cơ (Xanh lá)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Yêu cầu bảo vệ: Mức độ do cán bộ tự thẩm định, AI không tự quyết định.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Vĩ độ công khai (Tim đường)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPublicLat}
                    onChange={(e) => setNewPublicLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-navy-950"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Kinh độ công khai (Tim đường)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPublicLng}
                    onChange={(e) => setNewPublicLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-navy-950"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <strong>Quy trình phê duyệt:</strong> Sau khi tạo, điểm sẽ ở trạng thái <code>unpublished</code>. Ban Giám Hiệu sẽ thực hiện thẩm định 5 điều kiện trước khi ký duyệt công khai lên bản đồ số.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !newHotspotName.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs"
                >
                  {isProcessing ? 'Đang tạo...' : 'Tạo Hotspot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ẨN HOTSPOT KHỎI BẢN ĐỒ */}
      {hideTargetHotspot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <EyeOff className="w-5 h-5 text-rose-600" />
              <span>Ẩn Hotspot khỏi Bản đồ công khai</span>
            </div>

            <p className="text-xs text-slate-600">
              Bạn đang chuẩn bị ẩn điểm: <strong>{hideTargetHotspot.name}</strong>. Điểm này sẽ lập tức biến mất khỏi bản đồ cộng đồng nhưng dữ liệu nội bộ vẫn được lưu vết đầy đủ.
            </p>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Lý do ẩn điểm (Bắt buộc):
                </label>
                <span className={`text-[10px] font-mono ${hideReason.trim().length >= 5 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                  {hideReason.trim().length}/5 ký tự tối thiểu
                </span>
              </div>
              <textarea
                rows={3}
                value={hideReason}
                onChange={(e) => setHideReason(e.target.value)}
                placeholder="VD: Hạ tầng khu vực đã được hoàn tất thi công xong gờ giảm tốc..."
                className={`w-full p-3 rounded-xl border text-xs text-navy-950 focus:outline-none focus:ring-2 ${
                  hideReason.trim().length > 0 && hideReason.trim().length < 5
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-rose-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHideTargetHotspot(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleHideSubmit}
                disabled={isProcessing || hideReason.trim().length < 5}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-xs"
              >
                {isProcessing ? 'Đang ẩn...' : 'Xác nhận Ẩn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
