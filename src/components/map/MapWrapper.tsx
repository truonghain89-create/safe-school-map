'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { PublicHotspot, School } from '@/types';

interface MapWrapperProps {
  hotspots?: PublicHotspot[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: PublicHotspot) => void;
  schools?: School[];
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  showSchoolsLayer?: boolean;
  showHotspotsLayer?: boolean;
}

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[580px] rounded-2xl border border-slate-200 bg-slate-100/80 flex flex-col items-center justify-center gap-3 p-8">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-600">
        Đang khởi tạo bản đồ số Biên Hòa & THPT Tam Hiệp...
      </span>
      <span className="text-[11px] text-slate-400">
        Khung giới hạn hành chính (OSM Relation 7154127)
      </span>
    </div>
  ),
});

export default function MapWrapper(props: MapWrapperProps) {
  return <LeafletMap {...props} />;
}
