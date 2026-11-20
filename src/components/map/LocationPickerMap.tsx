'use client';

import dynamic from 'next/dynamic';
import React from 'react';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

const LocationPickerLeaflet = dynamic(
  () => import('@/components/map/LocationPickerLeaflet'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] sm:h-[380px] rounded-2xl border border-slate-200 bg-slate-100 flex flex-col items-center justify-center gap-2.5">
        <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">
          Đang tải bản đồ chọn vị trí...
        </span>
      </div>
    ),
  }
);

export default function LocationPickerMap(props: LocationPickerMapProps) {
  return <LocationPickerLeaflet {...props} />;
}
