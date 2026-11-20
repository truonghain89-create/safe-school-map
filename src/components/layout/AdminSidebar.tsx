'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Inbox,
  AlertTriangle,
  ClipboardCheck,
  History,
  Users,
  ArrowLeft,
  ExternalLink,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { role, isVerifier, isApprover, isAdmin, signOut } = useAuth();

  const links = [
    {
      href: '/quan-tri',
      label: 'Tổng quan Dashboard',
      icon: LayoutDashboard,
      exact: true,
      visible: true,
    },
    {
      href: '/quan-tri/phan-anh',
      label: 'Quản lý Phản ánh',
      icon: Inbox,
      visible: isVerifier || isApprover || isAdmin,
    },
    {
      href: '/quan-tri/diem-chu-y',
      label: 'Điểm cần chú ý (Hotspots)',
      icon: AlertTriangle,
      visible: isVerifier || isApprover || isAdmin,
    },
    {
      href: '/quan-tri/khao-sat',
      label: 'Khảo sát thực địa',
      icon: ClipboardCheck,
      visible: isVerifier || isApprover || isAdmin,
    },
    {
      href: '/quan-tri/nhat-ky',
      label: 'Nhật ký hệ thống (Audit)',
      icon: History,
      visible: isApprover || isAdmin,
    },
    {
      href: '/quan-tri/tai-khoan',
      label: 'Quản lý tài khoản',
      icon: Users,
      visible: isAdmin, // Chỉ Admin được xem quản lý tài khoản theo mục XI
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-navy-950 text-slate-300">
      {/* Brand header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-navy-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-0.5 border border-slate-700 flex items-center justify-center shadow-xs">
            <Image
              src="/logo.png"
              alt="SAFE SCHOOL MAP Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight leading-none">
              SAFE SCHOOL MAP
            </div>
            <div className="text-[10px] text-blue-400 font-semibold mt-1 uppercase tracking-wider">
              CỔNG QUẢN TRỊ NỘI BỘ
            </div>
          </div>
        </div>

        {/* Close button on mobile drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Phân hệ nghiệp vụ
        </div>

        {links
          .filter((l) => l.visible)
          .map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-micro ease-emil-out active:scale-[0.98] ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-navy-900/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
      </div>

      {/* Bottom Switch to Public Map & Sign Out */}
      <div className="p-3 border-t border-navy-900 space-y-1.5 shrink-0">
        <Link
          href="/ban-do"
          onClick={() => onClose?.()}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Về Bản đồ công khai</span>
          </span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose?.();
            signOut();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex w-64 bg-navy-950 shrink-0 min-h-screen border-r border-navy-900 flex-col">
        {content}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-backdrop-enter"
            onClick={onClose}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-navy-950 z-10 flex flex-col shadow-2xl animate-drawer border-r border-navy-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
