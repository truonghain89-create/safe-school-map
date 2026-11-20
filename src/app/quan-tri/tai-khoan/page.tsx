'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  RotateCcw,
  UserCheck,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getAccountsAction,
  updateAccountRoleAction,
  type AccountItem,
} from '@/app/actions/admin-accounts';
import type { UserRole } from '@/types';

export default function AdminAccountsPage() {
  const { profile, isAdmin } = useAuth();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAccountsAction();
      if (res.success && res.data) {
        setAccounts(res.data);
      } else {
        setError(res.error || 'Không thể tải danh sách tài khoản.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAccounts();
    }
  }, [isAdmin, loadAccounts]);

  // Nếu không phải Admin, hiển thị thông báo cấm truy cập
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-navy-950">
          Khu vực giới hạn quyền hạn
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Chức năng Quản lý phân quyền tài khoản chỉ dành riêng cho tài khoản có vai trò <strong>Quản trị viên Hệ thống (Admin)</strong> theo quy định an toàn thông tin tại Mục XI.
        </p>
        <div className="pt-2">
          <span className="text-[11px] text-slate-400">
            Bạn có thể sử dụng thanh chuyển vai trò ở góc trên để chuyển sang vai trò Quản trị viên trong môi trường thử nghiệm DEMO.
          </span>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (targetUser: AccountItem, newRole: UserRole) => {
    if (!profile) return;
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await updateAccountRoleAction({
        targetUserId: targetUser.id,
        newRole,
        isActive: targetUser.is_active,
        adminId: profile.id,
        adminName: profile.full_name || 'Admin',
      });

      if (res.success) {
        setSuccessMsg(`Đã cập nhật vai trò tài khoản "${targetUser.email}" thành ${newRole}.`);
        await loadAccounts();
      } else {
        setError(res.error || 'Không thể cập nhật vai trò.');
      }
    } catch {
      setError('Lỗi hệ thống khi cập nhật.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleActive = async (targetUser: AccountItem) => {
    if (!profile) return;
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await updateAccountRoleAction({
        targetUserId: targetUser.id,
        newRole: targetUser.role,
        isActive: !targetUser.is_active,
        adminId: profile.id,
        adminName: profile.full_name || 'Admin',
      });

      if (res.success) {
        setSuccessMsg(`Đã thay đổi trạng thái kích hoạt của "${targetUser.email}".`);
        await loadAccounts();
      } else {
        setError(res.error || 'Không thể đổi trạng thái.');
      }
    } catch {
      setError('Lỗi hệ thống khi cập nhật.');
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
            Quản trị Tài khoản & Phân quyền Cán bộ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân bổ vai trò Verifier (Xác minh), Approver (Phê duyệt BGH) và Admin. Mọi thay đổi đều được lưu vết trong nhật ký.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-bold flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>Khu vực Admin Cấp cao</span>
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Họ và tên cán bộ</th>
                <th className="p-3.5">Email công vụ</th>
                <th className="p-3.5">Vai trò phân quyền</th>
                <th className="p-3.5">Trạng thái tài khoản</th>
                <th className="p-3.5 text-right">Thao tác quyền hạn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Đang nạp danh sách cán bộ...</span>
                  </td>
                </tr>
              ) : accounts.length > 0 ? (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-navy-950">
                      {acc.full_name || 'Chưa cập nhật'}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-600">
                      {acc.email}
                    </td>

                    <td className="p-3.5">
                      <select
                        value={acc.role}
                        disabled={isProcessing}
                        onChange={(e) => handleRoleChange(acc, e.target.value as UserRole)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border focus:outline-none ${
                          acc.role === 'admin'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : acc.role === 'approver'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-blue-50 text-blue-900 border-blue-200'
                        }`}
                      >
                        <option value="verifier">Xác minh (verifier)</option>
                        <option value="approver">Phê duyệt BGH (approver)</option>
                        <option value="admin">Quản trị viên (admin)</option>
                      </select>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleToggleActive(acc)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all duration-micro active:scale-[0.96] ${
                          acc.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-rose-50 hover:text-rose-800'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        {acc.is_active ? '● Đang hoạt động' : '○ Bị vô hiệu hóa'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap min-w-[120px]">
                      ID: {acc.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có tài khoản nào được ghi nhận</p>
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
