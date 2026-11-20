'use client';

import React from 'react';
import { CheckCircle2, MapPin, ShieldCheck, Clock, Info } from 'lucide-react';
import type { OverviewMetrics } from '@/app/actions/public-statistics';

interface OverviewCardsProps {
  metrics: OverviewMetrics;
  isLoading?: boolean;
  isDemo?: boolean;
}

export function OverviewCards({ metrics, isLoading, isDemo }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-200" />
              <div className="w-16 h-4 rounded-full bg-slate-200" />
            </div>
            <div className="w-20 h-8 rounded-lg bg-slate-200" />
            <div className="w-36 h-3 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'verified_reports',
      title: 'Phản ánh đã xác minh',
      value: metrics.verifiedReportsCount,
      unit: 'phản ánh',
      icon: CheckCircle2,
      iconBg: 'bg-blue-100 text-blue-700',
      badge: 'Hợp lệ',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Được Cán bộ trường xác minh thực tế',
      calcNote: 'Đếm các Report có verification_status = "verified" trong khoảng thời gian lọc.',
      accent: 'border-t-2 border-t-blue-600',
    },
    {
      id: 'published_hotspots',
      title: 'Hotspot đang công khai',
      value: metrics.publishedHotspotsCount,
      unit: 'điểm',
      icon: MapPin,
      iconBg: 'bg-indigo-100 text-indigo-700',
      badge: 'Đủ 5 điều kiện',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Điểm an toàn công khai hiện tại',
      calcNote: 'Đếm Hotspot có publication_status = "published", không bị ẩn và trường cho phép (tính tích lũy hiện tại).',
      accent: 'border-t-2 border-t-indigo-600',
    },
    {
      id: 'resolved_hotspots',
      title: 'Hotspot đã xử lý',
      value: metrics.resolvedHotspotsCount,
      unit: 'điểm',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-100 text-emerald-700',
      badge: 'Đã hoàn thành',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Đã can thiệp giải pháp kỹ thuật',
      calcNote: 'Đếm Hotspot công khai có processing_status = "resolved" (tính tích lũy hiện tại).',
      accent: 'border-t-2 border-t-emerald-600',
    },
    {
      id: 'in_progress_hotspots',
      title: 'Hotspot đang xử lý',
      value: metrics.inProgressHotspotsCount,
      unit: 'điểm',
      icon: Clock,
      iconBg: 'bg-amber-100 text-amber-700',
      badge: 'Đang can thiệp',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Đang phối hợp triển khai giải pháp',
      calcNote: 'Đếm Hotspot công khai có processing_status = "in_progress" (tính tích lũy hiện tại).',
      accent: 'border-t-2 border-t-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`block-elevated rounded-2xl p-5 ${c.accent} flex flex-col justify-between group`}
          >
            {/* Top row: Icon & Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-micro group-hover:scale-105 ${c.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-1.5">
                {isDemo && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    DEMO
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeColor}`}>
                  {c.badge}
                </span>
              </div>
            </div>

            {/* Middle: Number Value */}
            <div className="space-y-1 mb-2">
              <span className="text-xs font-semibold text-slate-500 block truncate">
                {c.title}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-navy-950 font-mono tracking-tight">
                  {c.value.toLocaleString('vi-VN')}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {c.unit}
                </span>
              </div>
            </div>

            {/* Bottom: Note with Info Tooltip */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate" title={c.desc}>{c.desc}</span>
              <div
                className="cursor-help text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
                title={c.calcNote}
              >
                <Info className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
