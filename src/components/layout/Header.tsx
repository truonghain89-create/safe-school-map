'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  Shield,
  Menu,
  X,
  PlusCircle,
  Search,
  BarChart3,
  Lock,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/ban-do', label: 'Bản đồ số', icon: MapPin },
  { href: '/tra-cuu', label: 'Tra cứu', icon: Search },
  { href: '/thong-ke', label: 'Thống kê', icon: BarChart3 },
  { href: '/gioi-thieu', label: 'Giới thiệu', icon: Info },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors duration-ui">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[4.25rem]">
          {/* Logo & Brand Identity with tactile feel */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0 transition-transform duration-micro ease-emil-out hover:scale-[1.02] active:scale-[0.97]"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-blue-200/60 group-hover:border-blue-400 group-hover:shadow-sm transition-all duration-ui ease-emil-out flex items-center justify-center bg-white p-0.5">
                <Image
                  src="/logo.png"
                  alt="SAFE SCHOOL MAP Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20"
                title="Hệ thống trực tuyến"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold text-navy-950 tracking-tight leading-none group-hover:text-blue-600 transition-colors duration-ui ease-emil-out">
                  SAFE SCHOOL MAP
                </span>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                  Thí điểm
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wider mt-0.5 uppercase">
                Cổng trường an toàn
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Tactile hover lift, sub-200ms transitions) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-micro ease-emil-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96]',
                    isActive
                      ? 'text-blue-700 bg-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-navy-950 hover:bg-white/80 hover:shadow-xs'
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5 transition-colors duration-micro ease-emil-out',
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* CTA Gửi phản ánh with physical responsive press */}
            <Button
              href="/gui-phan-anh"
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
              className="shadow-xs font-bold px-3 lg:px-3.5 py-2 text-xs"
            >
              Gửi phản ánh
            </Button>

            <div className="h-5 w-px bg-slate-200" />

            {/* Cán bộ portal distinct link */}
            <Link
              href="/dang-nhap"
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100/80 hover:bg-slate-200/80 hover:text-navy-950 border border-slate-200/60 transition-all duration-micro ease-emil-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] shadow-xs"
              title="Khu vực dành cho Ban Giám Hiệu và Cán bộ xác minh nhà trường"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Cán bộ</span>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              href="/gui-phan-anh"
              variant="primary"
              size="sm"
              className="text-xs px-2.5 py-1.5 font-bold"
            >
              Phản ánh
            </Button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-navy-950 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 transition-transform duration-micro ease-emil-out active:scale-[0.95]"
              aria-expanded={mobileMenuOpen}
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Emil Kowalski Drawer curve & Stagger sequence) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 shadow-xl animate-drawer">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Menu điều hướng
          </div>

          <div className="space-y-1">
            {NAV_ITEMS.map((item, idx) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const staggerStyle = {
                animationDelay: `${idx * 40}ms`,
              };

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={staggerStyle}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-[background-color,color,transform] duration-micro ease-emil-out active:scale-[0.98]',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors duration-micro',
                          isActive ? 'text-blue-600' : 'text-slate-400'
                        )}
                      />
                    )}
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Link
              href="/dang-nhap"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-[background-color,transform] duration-micro ease-emil-out active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Đăng nhập Cán bộ nhà trường</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">BGH / Xác minh</span>
            </Link>

            <div className="px-2 pt-1 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Thí điểm: THPT Tam Hiệp</span>
              <span>TP. Biên Hòa (cũ)</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
