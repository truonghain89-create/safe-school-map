'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { useAuth } from '@/lib/context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, role, isLoading, signOut, signInDemo } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/dang-nhap');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-300">
            Đang xác thực thông tin cán bộ...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const roleMeta = {
    verifier: {
      label: 'Cán bộ Xác minh',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
    },
    approver: {
      label: 'Ban Giám Hiệu Phê duyệt',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    },
    admin: {
      label: 'Quản trị viên Hệ thống',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    },
  }[role || 'verifier'];

  return (
    <div className="min-h-screen flex bg-slate-100">
      <AdminSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header of Admin Dashboard */}
        <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-navy-950 hover:bg-slate-100 transition-colors"
              aria-label="Mở danh mục quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wide uppercase shrink-0">
              Thí điểm
            </span>
            <div className="min-w-0">
              <h1 className="text-xs font-bold text-navy-950 truncate max-w-[140px] sm:max-w-[220px] lg:max-w-none">
                {TAM_HIEP_SCHOOL_GEO.name}
              </h1>
              <p className="text-[10px] text-slate-500 truncate hidden lg:block">
                Khu phố 4, P. Tam Hiệp, TP. Biên Hòa (cũ), Tỉnh Đồng Nai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Demo Role Switcher (For testing verification & approval flow) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px]">
              <span className="text-slate-500 text-[10px] px-2 font-medium">Chuyển vai trò:</span>
              <button
                type="button"
                onClick={() => signInDemo('verifier')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all duration-micro active:scale-[0.96] ${role === 'verifier'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Đổi sang vai trò Cán bộ xác minh"
              >
                Xác minh
              </button>
              <button
                type="button"
                onClick={() => signInDemo('approver')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all duration-micro active:scale-[0.96] ${role === 'approver'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Đổi sang vai trò Ban giám hiệu phê duyệt"
              >
                Phê duyệt
              </button>
              <button
                type="button"
                onClick={() => signInDemo('admin')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all duration-micro active:scale-[0.96] ${role === 'admin'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Đổi sang vai trò Quản trị viên"
              >
                Admin
              </button>
            </div>

            {/* Current User Identity */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80">
              <div className="w-7 h-7 rounded-lg bg-navy-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left text-xs min-w-0 hidden sm:block">
                <div className="font-bold text-navy-950 leading-tight truncate max-w-[100px] lg:max-w-[140px]">
                  {profile.full_name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout icon button */}
            <button
              type="button"
              onClick={() => signOut()}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors active:scale-[0.95]"
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
