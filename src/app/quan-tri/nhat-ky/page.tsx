'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Clock,
  User,
  Database,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { getAuditLogsAction, type AuditLogItem } from '@/app/actions/admin-audit';

export default function AdminAuditLogsPage() {
  const { isApprover, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAuditLogsAction();
      if (res.success && res.data) {
        setLogs(res.data);
      } else {
        setError(res.error || 'Không thể tải nhật ký hoạt động.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(term) ||
        (l.reason || '').toLowerCase().includes(term) ||
        (l.target_table || '').toLowerCase().includes(term) ||
        (l.actor_name || '').toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <h1 className="text-xl font-bold text-navy-950">
            Nhật ký Hoạt động Hệ thống (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận toàn bộ thao tác xác minh, phê duyệt, tạo và ẩn Hotspot. Bảng nhật ký có cơ chế bất biến (Append-only), cấm sửa hoặc xóa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-slate-200 font-mono font-bold flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RLS Protected (Immutable)</span>
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo hành động, người thực hiện, lý do..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-navy-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {filteredLogs.length} bản ghi
          </span>
          <button
            type="button"
            onClick={loadLogs}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tải lại nhật ký"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Thời điểm</th>
                <th className="p-3.5">Người thực hiện</th>
                <th className="p-3.5">Hành động nghiệp vụ</th>
                <th className="p-3.5">Đối tượng tác động</th>
                <th className="p-3.5">Lý do / Diễn giải</th>
                <th className="p-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang nạp nhật ký từ Supabase audit_logs...</span>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </td>

                        <td className="p-3.5 font-bold text-navy-950">
                          {log.actor_name}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              log.action.includes('verify')
                                ? 'bg-blue-100 text-blue-800'
                                : log.action.includes('reject') || log.action.includes('hide')
                                ? 'bg-rose-100 text-rose-800'
                                : log.action.includes('approve')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono text-[11px] text-slate-600">
                          {log.target_table}:{' '}
                          <span className="text-slate-400">
                            {log.target_id?.slice(0, 8)}...
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs text-slate-700">
                          <p className="line-clamp-2 text-xs leading-relaxed" title={log.reason || undefined}>
                            {log.reason || '—'}
                          </p>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap min-w-[70px]">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors active:scale-95"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="p-4 text-[11px] font-mono text-slate-800 space-y-2">
                            <div>
                              <strong>ID Nhật ký:</strong> {log.id}
                            </div>
                            {log.new_data && (
                              <div>
                                <strong>Dữ liệu mới (new_data):</strong>
                                <pre className="p-2 rounded bg-white border border-slate-200 mt-1 overflow-x-auto">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.old_data && (
                              <div>
                                <strong>Dữ liệu cũ (old_data):</strong>
                                <pre className="p-2 rounded bg-white border border-slate-200 mt-1 overflow-x-auto">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có nhật ký nào được ghi nhận</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
