'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BIEN_HOA_GEO, TAM_HIEP_SCHOOL_GEO, OSM_TILE_CONFIG } from '@/lib/constants/geo';
import {
  School as SchoolIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react';
import type * as L from 'leaflet';
import type { PublicHotspot, School } from '@/types';
import { PROCESSING_STATUS_LABELS, EDUCATION_LEVEL_LABELS } from '@/types';

interface LeafletMapProps {
  hotspots?: PublicHotspot[];
  selectedHotspotId?: string | null;
  onSelectHotspot?: (hotspot: PublicHotspot) => void;
  schools?: School[];
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  showSchoolsLayer?: boolean;
  showHotspotsLayer?: boolean;
}

/**
 * Định dạng mốc thời gian an toàn cho Popup
 */
function formatPopupDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (dateStr.length === 10) {
    return `${day}/${month}/${year}`;
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export default function LeafletMap({
  hotspots = [],
  selectedHotspotId = null,
  onSelectHotspot,
  schools = [],
  flyToLocation = null,
  showSchoolsLayer = true,
  showHotspotsLayer = true,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const schoolsLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(BIEN_HOA_GEO.defaultZoom);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // 1. Khởi tạo bản đồ Leaflet
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let t1: NodeJS.Timeout | null = null;
    let t2: NodeJS.Timeout | null = null;
    let t3: NodeJS.Timeout | null = null;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      // Fix default icons path trong bundler Webpack/Next.js
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Tạo bản đồ giới hạn phạm vi Biên Hòa cũ (OSM Relation 7154127)
      // Sử dụng vùng đệm mở rộng và viscosity thấp (0.1) để tránh bị kẹt kéo/thao tác trên màn hình máy tính rộng
      const map = L.map(mapContainerRef.current, {
        center: [BIEN_HOA_GEO.center.lat, BIEN_HOA_GEO.center.lng],
        zoom: BIEN_HOA_GEO.defaultZoom,
        minZoom: BIEN_HOA_GEO.minZoom,
        maxZoom: BIEN_HOA_GEO.maxZoom,
        maxBounds: [
          [10.45, 106.35],
          [11.45, 107.35],
        ],
        maxBoundsViscosity: 0.1,
        zoomControl: false, // Sử dụng controls tùy chỉnh dễ tiếp cận
      });

      // Lớp nền OpenStreetMap tiêu chuẩn
      L.tileLayer(OSM_TILE_CONFIG.url, {
        attribution: OSM_TILE_CONFIG.attribution,
        maxZoom: 19,
      }).addTo(map);

      // Đường khung viền nhẹ phạm vi địa giới Biên Hòa cũ (OSM Bounding Box chính thức)
      const { south, west, north, east } = BIEN_HOA_GEO.bbox;
      L.rectangle(
        [
          [south, west],
          [north, east],
        ],
        {
          color: '#3B82F6',
          weight: 1.5,
          dashArray: '6, 6',
          fill: true,
          fillColor: '#3B82F6',
          fillOpacity: 0.02,
          interactive: false,
        }
      ).addTo(map);

      // Khởi tạo 2 Lớp dữ liệu độc lập (Layer A: Schools, Layer B: Hotspots)
      const schoolsLayer = L.layerGroup().addTo(map);
      const hotspotsLayer = L.layerGroup().addTo(map);
      schoolsLayerRef.current = schoolsLayer;
      hotspotsLayerRef.current = hotspotsLayer;

      // Theo dõi sự kiện zoom để tự động co giãn kích thước marker theo cự ly
      const updateZoomClasses = () => {
        if (!mapInstanceRef.current || !mapContainerRef.current) return;
        const z = Math.round(mapInstanceRef.current.getZoom());
        const el = mapContainerRef.current;
        el.classList.remove('map-zoom-far', 'map-zoom-mid', 'map-zoom-near');
        if (z <= 12) {
          el.classList.add('map-zoom-far');
        } else if (z <= 14) {
          el.classList.add('map-zoom-mid');
        } else {
          el.classList.add('map-zoom-near');
        }
      };

      map.on('zoom', updateZoomClasses);
      map.on('zoomend', () => {
        updateZoomClasses();
        if (isMounted) {
          setCurrentZoom(Math.round(map.getZoom()));
        }
      });

      // Kích hoạt class zoom ngay sau khi khởi tạo
      updateZoomClasses();

      mapInstanceRef.current = map;
      if (isMounted) setMapLoaded(true);

      // Theo dõi thay đổi kích thước vùng chứa (đặc biệt quan trọng trên điện thoại khi xoay màn hình hoặc đổi tab)
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Invalidate size nhiều mốc thời gian để bảo đảm toàn bộ tile map render 100% trọn vẹn
      t1 = setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);

      t2 = setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 400);

      t3 = setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 1000);
    }

    initMap();

    const markersMap = hotspotMarkersMapRef.current;

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        schoolsLayerRef.current = null;
        hotspotsLayerRef.current = null;
        markersMap.clear();
      }
    };
  }, []);

  // 2. Bật/Tắt độc lập Lớp Trường học (Layer A)
  useEffect(() => {
    if (!mapInstanceRef.current || !schoolsLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = schoolsLayerRef.current;
    if (showSchoolsLayer) {
      if (!map.hasLayer(layer)) {
        map.addLayer(layer);
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [showSchoolsLayer]);

  // 3. Bật/Tắt độc lập Lớp Điểm nguy cơ Hotspots (Layer B)
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = hotspotsLayerRef.current;
    if (showHotspotsLayer) {
      if (!map.hasLayer(layer)) {
        map.addLayer(layer);
      }
    } else {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    }
  }, [showHotspotsLayer]);

  // 4. Vẽ Markers cho Toàn bộ Cơ sở Giáo dục (Layer A)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !schoolsLayerRef.current) return;

    let isMounted = true;

    async function renderSchools() {
      const L = await import('leaflet');
      if (!isMounted || !schoolsLayerRef.current || !mapInstanceRef.current) return;

      const layer = schoolsLayerRef.current;
      layer.clearLayers();

      // Danh sách trường cần vẽ: từ props schools hoặc dự phòng THPT Tam Hiệp
      const schoolsToDraw: School[] = schools.length > 0 ? schools : [
        {
          id: TAM_HIEP_SCHOOL_GEO.id,
          name: TAM_HIEP_SCHOOL_GEO.name,
          address: TAM_HIEP_SCHOOL_GEO.address,
          lat: TAM_HIEP_SCHOOL_GEO.coordinates.lat,
          lng: TAM_HIEP_SCHOOL_GEO.coordinates.lng,
          is_focal_point: true,
          status: 'pilot' as const,
          public_map_approved: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          education_level: 'high_school' as const,
          school_type: 'public' as const,
          campus_name: null,
          ward: 'Tam Hiệp',
          website: 'https://thpttamhiep.dongnai.edu.vn',
        },
      ];

      schoolsToDraw.forEach((school) => {
        if (typeof school.lat !== 'number' || typeof school.lng !== 'number') return;

        // Xác định icon theo cấp học
        let schoolEmoji = '🏫';
        if (school.education_level === 'university' || school.education_level === 'college') {
          schoolEmoji = '🎓';
        } else if (school.education_level === 'primary') {
          schoolEmoji = '🎒';
        } else if (school.education_level === 'multi_level') {
          schoolEmoji = '🏛️';
        } else if (school.education_level === 'vocational') {
          schoolEmoji = '🛠️';
        }

        // Ký hiệu marker đồng nhất phong cách THPT Tam Hiệp (Navy-950, 2px white border, drop shadow, downward triangular pointer)
        // Hỗ trợ co giãn tự động theo cấp độ zoom (map-zoom-far, map-zoom-mid, map-zoom-near)
        const schoolIcon = L.divIcon({
          className: `custom-school-marker-${school.id} school-marker-icon-wrapper`,
          html: `
            <div class="school-marker-pin ${school.is_focal_point ? 'school-marker-focal' : ''}" style="
              background-color: #0F172A;
              color: #FFFFFF;
              width: 36px;
              height: 36px;
              border-radius: 10px;
              border: 2px solid #FFFFFF;
              box-shadow: 0 8px 12px -2px rgba(15, 23, 42, 0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              cursor: pointer;
              position: relative;
              transform-origin: bottom center;
              transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
            " title="${school.name}${school.campus_name ? ' (' + school.campus_name + ')' : ''}">
              <span class="school-emoji-symbol">${schoolEmoji}</span>
              <div class="school-marker-pointer" style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid #0F172A;
              "></div>
            </div>
          `,
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([school.lat, school.lng], { icon: schoolIcon }).addTo(layer);

        // Nhãn cấp học & loại hình
        const levelLabel = (school.education_level && EDUCATION_LEVEL_LABELS[school.education_level]) || 'Cơ sở giáo dục';
        const typeLabel = school.school_type === 'private' ? 'Dân lập / Tư thục' : 'Công lập';

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 6px; min-width: 250px; max-width: 320px;">
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
              <span style="background: #0F172A; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                ${levelLabel.toUpperCase()}
              </span>
              <span style="background: ${school.school_type === 'private' ? '#FEF3C7' : '#DBEAFE'}; color: ${school.school_type === 'private' ? '#92400E' : '#1E40AF'}; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">
                ${typeLabel}
              </span>
              ${school.is_focal_point ? '<span style="background: #DC2626; color: #FFFFFF; font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px;">THÍ ĐIỂM</span>' : ''}
            </div>
            <h3 style="font-size: 13px; font-weight: 700; color: #0F172A; margin: 0 0 3px 0; line-height: 1.35;">
              ${school.name}
            </h3>
            ${school.campus_name ? `<div style="font-size: 11px; font-weight: 600; color: #2563EB; margin-bottom: 4px;">📌 ${school.campus_name}</div>` : ''}
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.4;">
              ${school.address}${school.ward ? `, P. ${school.ward}` : ''}
            </p>
            <div style="font-size: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px 6px; margin-bottom: 6px;">
              <div style="color: #0F172A; font-weight: 600; display: flex; justify-content: space-between;">
                <span>📍 Tọa độ GPS cổng:</span>
                <span style="font-family: monospace; color: #2563EB;">${school.lat.toFixed(5)}, ${school.lng.toFixed(5)}</span>
              </div>
              <div style="color: #64748B; font-size: 9.5px; margin-top: 2px;">
                Nguồn: ${school.verification_source ? school.verification_source.slice(0, 55) + (school.verification_source.length > 55 ? '...' : '') : 'Sở GD&ĐT Đồng Nai & OSM'}
              </div>
            </div>
            <div style="font-size: 10px; color: #059669; font-weight: 600; padding-top: 5px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between;">
              <span>✅ Mức A — Đã xác minh cổng</span>
              <span>TP. Biên Hòa (cũ)</span>
            </div>
            ${school.website ? `
              <div style="margin-top: 5px; padding-top: 4px; border-top: 1px dashed #E2E8F0; font-size: 10px;">
                <a href="${school.website}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: underline; font-weight: 600;">
                  🌐 Trang thông tin chính thức
                </a>
              </div>
            ` : ''}
          </div>
        `);
      });
    }

    renderSchools();

    return () => {
      isMounted = false;
    };
  }, [mapLoaded, schools]);

  // 5. Vẽ Markers cho các Điểm nóng Hotspots (Layer B)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !hotspotsLayerRef.current) return;

    let isMounted = true;

    async function renderHotspots() {
      const L = await import('leaflet');
      if (!isMounted || !hotspotsLayerRef.current || !mapInstanceRef.current) return;

      const layer = hotspotsLayerRef.current;
      layer.clearLayers();
      hotspotMarkersMapRef.current.clear();

      hotspots.forEach((hotspot) => {
        const isSelected = selectedHotspotId === hotspot.hotspot_id;

        // Cấu hình Icon theo Mức độ nguy cơ (Severity)
        let bgHex = '#D97706'; // attention_needed (Vàng hổ phách)
        let iconSymbol = '⚠️';
        let shapeRadius = '10px';

        if (hotspot.severity === 'high_risk') {
          bgHex = '#DC2626'; // high_risk (Đỏ)
          iconSymbol = '🛑';
          shapeRadius = '6px'; // Bát giác/vuông bo nhẹ
        } else if (hotspot.severity === 'surveyed_safe') {
          bgHex = '#16A34A'; // surveyed_safe (Xanh lá)
          iconSymbol = '🛡️';
          shapeRadius = '50%'; // Khiên tròn
        }

        // Hiệu ứng nổi bật nhẹ khi marker được chọn
        const selectedGlow = isSelected
          ? 'box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.45), 0 8px 16px -2px rgba(0, 0, 0, 0.35); transform: scale(1.12); z-index: 1000;'
          : 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);';

        const customHotspotIcon = L.divIcon({
          className: `custom-hotspot-marker-${hotspot.hotspot_id} hotspot-marker-icon-wrapper`,
          html: `
            <div class="hotspot-marker-pin" style="
              background-color: ${bgHex};
              color: #FFFFFF;
              width: 32px;
              height: 32px;
              border-radius: ${shapeRadius};
              border: 2px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              cursor: pointer;
              position: relative;
              transform-origin: bottom center;
              transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
              ${selectedGlow}
            " title="${hotspot.hotspot_name}">
              ${iconSymbol}
              <div class="hotspot-marker-pointer" style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid ${bgHex};
              "></div>
            </div>
          `,
          iconSize: [32, 38],
          iconAnchor: [16, 38],
          popupAnchor: [0, -38],
        });

        // Đặt marker tại tọa độ công khai trên tuyến đường
        const marker = L.marker([hotspot.public_lat, hotspot.public_lng], {
          icon: customHotspotIcon,
          zIndexOffset: isSelected ? 1000 : 0,
        }).addTo(layer);

        // Lưu vào Map để có thể kích hoạt popup từ ngoài
        hotspotMarkersMapRef.current.set(hotspot.hotspot_id, marker);

        const statusMeta = PROCESSING_STATUS_LABELS[hotspot.processing_status];

        // Format các mốc thời gian thực tế nếu có sẵn
        const surveyDateFormatted = formatPopupDate(hotspot.latest_survey_date);
        const verifiedDateFormatted = formatPopupDate(hotspot.latest_verified_at);
        const occurredDateFormatted = formatPopupDate(hotspot.latest_occurred_at || hotspot.first_occurred_at);
        const publishedDateFormatted = formatPopupDate(hotspot.published_at);

        let timeRowsHtml = '';
        if (occurredDateFormatted) {
          timeRowsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span style="color:#64748B;">Ghi nhận:</span><strong style="color:#0F172A;">${occurredDateFormatted}</strong></div>`;
        }
        if (verifiedDateFormatted) {
          timeRowsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span style="color:#64748B;">Xác minh:</span><strong style="color:#0F172A;">${verifiedDateFormatted}</strong></div>`;
        }
        if (surveyDateFormatted) {
          timeRowsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span style="color:#64748B;">Khảo sát:</span><strong style="color:#0F172A;">${surveyDateFormatted}</strong></div>`;
        }
        if (publishedDateFormatted && !verifiedDateFormatted && !occurredDateFormatted) {
          timeRowsHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span style="color:#64748B;">Công bố:</span><strong style="color:#0F172A;">${publishedDateFormatted}</strong></div>`;
        }

        // Gắn Popup chi tiết an toàn
        marker.bindPopup(`
          <div style="font-family: inherit; padding: 4px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
              <span style="background: ${bgHex}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                ${hotspot.severity === 'high_risk' ? 'NGUY CƠ CAO' : hotspot.severity === 'attention_needed' ? 'CẦN CHÚ Ý' : 'ĐÃ KHẢO SÁT'}
              </span>
              <span style="font-size: 10px; color: #475569; font-weight: 600;">
                ${statusMeta.label}
              </span>
            </div>

            <h4 style="font-size: 13px; font-weight: 700; color: #0F172A; margin: 0 0 3px 0; line-height: 1.3;">
              ${hotspot.hotspot_name}
            </h4>

            <p style="font-size: 11px; color: #64748B; margin: 0 0 6px 0;">
              📍 Vị trí trên tuyến đường
            </p>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 10px;">
              <div><strong>Số phản ánh xác minh:</strong> ${hotspot.verified_report_count} phản ánh</div>
              ${timeRowsHtml ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #CBD5E1;">${timeRowsHtml}</div>` : ''}
            </div>

            <div style="font-size: 9px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px; display: flex; justify-content: space-between;">
              <span>Tọa độ tim đường công khai</span>
              ${hotspot.is_demo ? '<span style="color:#D97706; font-weight:bold;">[DỮ LIỆU DEMO]</span>' : ''}
            </div>
          </div>
        `);

        // Xử lý sự kiện click trên Marker
        marker.on('click', () => {
          if (onSelectHotspot) {
            onSelectHotspot(hotspot);
          }
        });
      });
    }

    renderHotspots();

    return () => {
      isMounted = false;
    };
  }, [mapLoaded, hotspots, selectedHotspotId, onSelectHotspot]);

  // 3. Xử lý đồng bộ: Khi người dùng chọn Hotspot từ danh sách bên ngoài
  useEffect(() => {
    if (!selectedHotspotId || !mapInstanceRef.current) return;

    const marker = hotspotMarkersMapRef.current.get(selectedHotspotId);
    const targetHotspot = hotspots.find((h) => h.hotspot_id === selectedHotspotId);

    if (targetHotspot && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [targetHotspot.public_lat, targetHotspot.public_lng],
        16, // Zoom chi tiết
        { duration: 0.9 }
      );

      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedHotspotId, hotspots]);

  // 4. Xử lý điều hướng bên ngoài (flyToLocation)
  useEffect(() => {
    if (!flyToLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [flyToLocation.lat, flyToLocation.lng],
      flyToLocation.zoom || 16,
      { duration: 1.2 }
    );
  }, [flyToLocation]);

  // Quick navigation handlers
  const handleFlyToSchool = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [TAM_HIEP_SCHOOL_GEO.coordinates.lat, TAM_HIEP_SCHOOL_GEO.coordinates.lng],
      TAM_HIEP_SCHOOL_GEO.detailZoom,
      { duration: 1.2 }
    );
  }, []);

  const handleFlyToBienHoaOverview = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const { south, west, north, east } = BIEN_HOA_GEO.bbox;
    mapInstanceRef.current.flyToBounds(
      [
        [south, west],
        [north, east],
      ],
      { duration: 1.2 }
    );
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Phân loại cấp độ zoom để tự động co giãn kích thước marker theo cự ly quan sát:
  // - zoom <= 12: Toàn cảnh Biên Hòa -> thu nhỏ gọn gàng (~50%) để không bị rối/chồng lấn
  // - zoom 13-14: Cấp phường / cụm trường -> kích thước vừa phải (~75%)
  // - zoom >= 15: Cận cảnh trường học -> kích thước đầy đủ (100%) kèm biểu tượng rõ nét
  const zoomLevelClass =
    currentZoom <= 12 ? 'map-zoom-far' : currentZoom <= 14 ? 'map-zoom-mid' : 'map-zoom-near';

  return (
    <div className={`relative w-full h-full min-h-[580px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 flex flex-col ${zoomLevelClass}`}>
      {/* Map Canvas - giữ class tĩnh để không bao giờ ghi đè class Leaflet nội bộ */}
      <div ref={mapContainerRef} className="w-full flex-1 min-h-[580px] z-10" />

      {/* Floating Navigation Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-md border border-slate-200/90 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleFlyToSchool}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-white text-xs font-semibold shadow-xs transition-all duration-micro ease-emil-out active:scale-95"
            title="Đưa bản đồ về vị trí Trường THPT Tam Hiệp"
          >
            <SchoolIcon className="w-4 h-4 text-blue-300" />
            <span className="hidden sm:inline">Về THPT Tam Hiệp</span>
          </button>

          <button
            type="button"
            onClick={handleFlyToBienHoaOverview}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all duration-micro ease-emil-out active:scale-95"
            title="Xem toàn cảnh thành phố Biên Hòa (cũ)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Toàn cảnh Biên Hòa (cũ)</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200/90 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-4 h-px bg-slate-200" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend Overlay (Thu gọn trên mobile để không chắn cảm ứng, mở rộng trên desktop) */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200/90 max-w-[240px] sm:max-w-xs text-xs space-y-2 pointer-events-auto transition-all">
        <div
          className="font-bold text-navy-950 flex items-center justify-between border-b border-slate-100 pb-1.5 cursor-pointer sm:cursor-default"
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            Chú giải ký hiệu
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">Zoom: {currentZoom}</span>
            <span className="sm:hidden text-[10px] text-blue-600 font-semibold underline">
              {isLegendOpen ? 'Đóng' : 'Xem'}
            </span>
          </div>
        </div>

        <div className={`space-y-1.5 text-[11px] ${isLegendOpen ? 'block' : 'hidden sm:block'}`}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-navy-950 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              🏫
            </div>
            <span className="font-semibold text-slate-800">Cơ sở giáo dục ({schools.length} trường)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-amber-500 flex items-center justify-center text-white text-[10px]">
              <AlertTriangle className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-600">Cần chú ý (Trên tuyến đường)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-rose-600 flex items-center justify-center text-white text-[10px]">
              <AlertOctagon className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-600">Nguy cơ cao (Đã khảo sát)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px]">
              <ShieldCheck className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-600">Đã khảo sát an toàn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
