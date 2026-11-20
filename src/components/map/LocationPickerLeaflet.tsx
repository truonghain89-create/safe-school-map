'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TAM_HIEP_SCHOOL_GEO, BIEN_HOA_GEO, OSM_TILE_CONFIG } from '@/lib/constants/geo';
import { School, Locate, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';
import type * as L from 'leaflet';

interface LocationPickerLeafletProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerLeaflet({
  lat,
  lng,
  onChange,
}: LocationPickerLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // 1. Khởi tạo bản đồ
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      // Fix default icons path
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialCenter: [number, number] = [lat || TAM_HIEP_SCHOOL_GEO.coordinates.lat, lng || TAM_HIEP_SCHOOL_GEO.coordinates.lng];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 16,
        minZoom: 12,
        maxZoom: 18,
        zoomControl: false,
      });

      L.tileLayer(OSM_TILE_CONFIG.url, {
        attribution: OSM_TILE_CONFIG.attribution,
        maxZoom: 19,
      }).addTo(map);

      // Icon Ghim vị trí phản ánh có thể kéo thả
      const pinIcon = L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="
            background-color: #2563EB;
            color: #FFFFFF;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 8px 16px -2px rgba(37, 99, 235, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: grab;
            transform: rotate(-45deg);
            position: relative;
          ">
            <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      // Tạo marker có thể kéo thả
      const marker = L.marker(initialCenter, {
        draggable: true,
        icon: pinIcon,
        autoPan: true,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong>Vị trí bạn đã chọn</strong><br/>
          Kéo ghim này để điều chỉnh chính xác vị trí sự cố.
        </div>
      `);

      // Khi kéo ghim kết thúc
      marker.on('dragend', (e) => {
        const targetMarker = e.target as L.Marker;
        const position = targetMarker.getLatLng();
        onChangeRef.current(position.lat, position.lng);
      });

      // Khi người dùng bấm trực tiếp lên mặt bản đồ
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onChangeRef.current(clickLat, clickLng);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
      if (isMounted) setMapLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // 2. Cập nhật vị trí Marker khi props lat, lng thay đổi từ bên ngoài
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng], { animate: true });
    }
  }, [lat, lng]);

  // Hành động: Đưa về vị trí THPT Tam Hiệp
  const handleFlyToSchool = useCallback(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const schoolPos = [10.94190, 106.86185] as [number, number]; // Vị trí cổng chính giao Phạm Văn Thuận
    markerRef.current.setLatLng(schoolPos);
    mapInstanceRef.current.flyTo(schoolPos, 16, { duration: 1.0 });
    onChange(schoolPos[0], schoolPos[1]);
  }, [onChange]);

  // Hành động: Lấy vị trí GPS hiện tại của người dùng
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng([userLat, userLng]);
          mapInstanceRef.current.flyTo([userLat, userLng], 16, { duration: 1.0 });
        }
        onChange(userLat, userLng);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Bạn chưa cấp quyền truy cập vị trí. Hãy chọn vị trí thủ công trên bản đồ.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Không thể xác định vị trí hiện tại của thiết bị.');
            break;
          case error.TIMEOUT:
            setGeoError('Hết thời gian chờ phản hồi định vị.');
            break;
          default:
            setGeoError('Đã xảy ra lỗi khi lấy vị trí.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [onChange]);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100 flex flex-col">
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Floating Action Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md hover:bg-white text-navy-950 text-xs font-semibold shadow-sm border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
          title="Sử dụng vị trí hiện tại của thiết bị"
        >
          <Locate className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLocating ? 'Đang định vị...' : 'Vị trí hiện tại'}</span>
        </button>

        <button
          type="button"
          onClick={handleFlyToSchool}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          title="Đưa ghim về cổng Trường THPT Tam Hiệp"
        >
          <School className="w-3.5 h-3.5 text-blue-300" />
          <span className="hidden sm:inline">Về THPT Tam Hiệp</span>
        </button>
      </div>

      {/* Thông báo lỗi GPS nếu có */}
      {geoError && (
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-rose-50/95 backdrop-blur-md border border-rose-200 text-rose-900 text-[11px] p-2 rounded-xl flex items-center justify-between">
          <span>{geoError}</span>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-rose-600 font-bold ml-2 hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Chú thích hướng dẫn tương tác */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 text-[11px] text-slate-600 shadow-xs flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Bấm hoặc kéo ghim để chọn vị trí chính xác</span>
      </div>
    </div>
  );
}
