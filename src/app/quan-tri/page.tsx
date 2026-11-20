'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Inbox,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  Flame,
  FileCheck2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { getDashboardMetricsAction, type DashboardMetrics } from '@/app/actions/admin-dashboard';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';
import { ISSUE_TYPE_LABELS } from '@/types';

export default function AdminDashboardPage() {
  const { profile, role, isVerifier, isApprover } = useAuth();
  const [includeDemo, setIncludeDemo] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getDashboardMetricsAction(includeDemo);
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      } else {
        setError(res.error || 'Không thể lấy số liệu từ máy chủ Supabase.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, [includeDemo]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Title & Demo Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wide">
              Bảng điều hành
            </span>
            <span className="text-xs text-slate-500">
              Đơn vị: <strong>{TAM_HIEP_SCHOOL_GEO.name}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight mt-1">
            BẢNG ĐIỀU KHIỂN THẨM ĐỊNH AN TOÀN
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Giám sát quy trình 3 trục: Tiếp nhận phản ánh &rarr; Thẩm định thực địa &rarr; Phê duyệt công khai bản đồ.
          </p>
        </div>

        {/* Toggle Lọc dữ liệu DEMO / Thực tế */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDemo}
              onChange={(e) => setIncludeDemo(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-slate-700 font-semibold">Hiển thị dữ liệu Thí điểm DEMO</span>
          </label>
          <button
            type="button"
            onClick={loadMetrics}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            title="Làm mới số liệu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thông báo phân quyền hiện tại */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-navy-950">
              Xin chào, {profile?.full_name}!
            </div>
            <div className="text-[11px] text-slate-500">
              Bạn đang đăng nhập với vai trò:{' '}
              <strong className="text-blue-700 uppercase">
                {role === 'verifier'
                  ? 'Cán bộ Xác minh (Verifier)'
                  : role === 'approver'
                  ? 'Ban Giám Hiệu Phê duyệt (Approver)'
                  : 'Quản trị viên (Admin)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Action quick shortcut */}
        <div className="flex items-center gap-2">
          {isVerifier && (
            <Link
              href="/quan-tri/phan-anh"
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Duyệt phản ánh</span>
            </Link>
          )}

          {isApprover && (
            <Link
              href="/quan-tri/diem-chu-y"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Phê duyệt Hotspot</span>
            </Link>
          )}
        </div>
      </div>

      {/* Grid 4 Nhóm Số liệu Trục Nghiệp vụ (8 chỉ số bắt buộc) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hàng đợi tiếp nhận phản ánh */}
        <div className="block-elevated rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              1. Hàng đợi Phản ánh
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-navy-950">
              {isLoading ? '...' : metrics?.pendingReports ?? 0}
            </div>
            <div className="text-xs text-amber-800 font-semibold mt-1">
              Phản ánh đang chờ xác minh
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Tổng tiếp nhận:</span>
            <strong className="text-navy-950">{metrics?.totalReports ?? 0}</strong>
          </div>
        </div>

        {/* Card 2: Phản ánh đã xác minh hợp lệ */}
        <div className="block-elevated rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              2. Đã xác minh hợp lệ
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-navy-950">
              {isLoading ? '...' : metrics?.verifiedReports ?? 0}
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-1">
              Đã thẩm định tính chính xác
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Không hợp lệ (invalid):</span>
            <strong className="text-rose-600">{metrics?.invalidReports ?? 0}</strong>
          </div>
        </div>

        {/* Card 3: Hotspots đang chờ Ban Giám Hiệu phê duyệt */}
        <div className="block-elevated rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              3. Điểm chờ phê duyệt
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-navy-950">
              {isLoading ? '...' : metrics?.unpublishedHotspots ?? 0}
            </div>
            <div className="text-xs text-purple-800 font-semibold mt-1">
              Hotspots chưa ký duyệt công khai
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Tổng số Hotspots:</span>
            <strong className="text-navy-950">{metrics?.totalHotspots ?? 0}</strong>
          </div>
        </div>

        {/* Card 4: Hotspots đã công khai trên bản đồ */}
        <div className="block-elevated rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              4. Đã công khai trên bản đồ
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-navy-950">
              {isLoading ? '...' : metrics?.publishedHotspots ?? 0}
            </div>
            <div className="text-xs text-emerald-800 font-semibold mt-1">
              Đủ 5 điều kiện an toàn
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Đang ẩn (hidden):</span>
            <strong className="text-slate-600">{metrics?.hiddenHotspots ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Danh sách 5 phản ánh mới nhất đang chờ duyệt */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">
              Phản ánh mới cần xử lý gấp
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {metrics?.pendingReports ?? 0} chờ duyệt
            </span>
          </div>

          <Link
            href="/quan-tri/phan-anh"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Xem toàn bộ danh sách</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Đang nạp dữ liệu...</div>
        ) : metrics?.recentPendingReports && metrics.recentPendingReports.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {metrics.recentPendingReports.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                      {ISSUE_TYPE_LABELS[item.issue_type as keyof typeof ISSUE_TYPE_LABELS] ||
                        item.issue_type}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Khung giờ: <strong>{item.time_window}</strong>
                    </span>
                    {item.is_demo && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 text-xs line-clamp-1 font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <Link
                    href={`/quan-tri/phan-anh?id=${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>Thẩm định ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Hàng đợi trống!</p>
            <p className="text-[11px] text-slate-400">
              Hiện tại không có phản ánh nào đang chờ xác minh.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
