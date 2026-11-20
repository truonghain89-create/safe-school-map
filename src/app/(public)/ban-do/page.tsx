'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MapWrapper from '@/components/map/MapWrapper';
import { HotspotList } from '@/components/map/HotspotList';
import { HotspotFilter, type HotspotFilterState } from '@/components/map/HotspotFilter';
import { HotspotDetailDrawer } from '@/components/map/HotspotDetailDrawer';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { TAM_HIEP_SCHOOL_GEO, BIEN_HOA_GEO } from '@/lib/constants/geo';
import { getPublicHotspots, getActiveSchools } from '@/lib/services/hotspots';
import type { PublicHotspot, School, EducationLevel, SchoolType } from '@/types';
import { EDUCATION_LEVEL_LABELS } from '@/types';
import {
  MapPin,
  Filter,
  School as SchoolIcon,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  RotateCcw,
  Layers,
  Info,
  Compass,
  CheckCircle2,
  Database,
  Eye,
  SlidersHorizontal,
  Search,
  GraduationCap,
  Building,
  CheckSquare,
  Square,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function MapPage() {
  // State dữ liệu thực từ Supabase
  const [hotspots, setHotspots] = useState<PublicHotspot[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State tương tác & Lọc
  const [selectedHotspot, setSelectedHotspot] = useState<PublicHotspot | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [activeTabMobile, setActiveTabMobile] = useState<'map' | 'list'>('map');

  // Quản lý 2 Lớp dữ liệu độc lập (Prompt chuyển đổi Đa trường)
  const [showSchoolsLayer, setShowSchoolsLayer] = useState<boolean>(true);
  const [showHotspotsLayer, setShowHotspotsLayer] = useState<boolean>(true);

  // Tab Sidebar: 'hotspots' | 'schools' | 'layers'
  const [sidebarTab, setSidebarTab] = useState<'hotspots' | 'schools' | 'layers'>('hotspots');

  // Bộ lọc trường học độc lập
  const [schoolSearchTerm, setSchoolSearchTerm] = useState<string>('');
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<string>('all');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>('all');

  const [filter, setFilter] = useState<HotspotFilterState>({
    searchTerm: '',
    severity: 'all',
    processingStatus: 'all',
    timeRange: 'all',
    includeDemo: true, // Mặc định hiển thị dữ liệu thí điểm DEMO có kiểm soát
  });

  // Tải dữ liệu thực tế từ Supabase khi mở trang
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [hotspotsRes, schoolsRes] = await Promise.all([
        getPublicHotspots(),
        getActiveSchools(),
      ]);

      if (hotspotsRes.error) {
        setError(hotspotsRes.error);
      } else {
        setHotspots(hotspotsRes.data);
      }

      if (!schoolsRes.error) {
        setSchools(schoolsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu từ máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc dữ liệu Hotspot
  const filteredHotspots = useMemo(() => {
    return hotspots.filter((item) => {
      // 1. Lọc theo Demo
      if (!filter.includeDemo && item.is_demo) {
        return false;
      }

      // 2. Tìm kiếm từ khóa (tên điểm, tên trường, địa chỉ)
      if (filter.searchTerm.trim() !== '') {
        const term = filter.searchTerm.toLowerCase();
        const matchName = item.hotspot_name.toLowerCase().includes(term);
        const matchSchool = item.school_name.toLowerCase().includes(term);
        const matchAddress = item.school_address.toLowerCase().includes(term);
        if (!matchName && !matchSchool && !matchAddress) {
          return false;
        }
      }

      // 3. Lọc theo Mức độ nguy cơ
      if (filter.severity !== 'all' && item.severity !== filter.severity) {
        return false;
      }

      // 4. Lọc theo Tiến độ xử lý
      if (
        filter.processingStatus !== 'all' &&
        item.processing_status !== filter.processingStatus
      ) {
        return false;
      }

      // 5. Lọc theo Thời gian công bố (published_at)
      if (filter.timeRange !== 'all') {
        const publishedDate = new Date(item.published_at);
        if (isNaN(publishedDate.getTime())) return false;
        const now = new Date();
        const diffDays = (now.getTime() - publishedDate.getTime()) / (1000 * 3600 * 24);

        if (filter.timeRange === '7d' && diffDays > 7) return false;
        if (filter.timeRange === '30d' && diffDays > 30) return false;
        if (filter.timeRange === '90d' && diffDays > 90) return false;
      }

      return true;
    });
  }, [hotspots, filter]);

  // Bộ lọc danh mục trường học
  const filteredSchools = useMemo(() => {
    return schools.filter((item) => {
      // 1. Lọc theo cấp học
      if (schoolLevelFilter !== 'all' && item.education_level !== schoolLevelFilter) {
        return false;
      }

      // 2. Lọc theo loại hình
      if (schoolTypeFilter !== 'all' && item.school_type !== schoolTypeFilter) {
        return false;
      }

      // 3. Tìm kiếm theo tên trường, cơ sở, địa chỉ, phường
      if (schoolSearchTerm.trim() !== '') {
        const term = schoolSearchTerm.toLowerCase();
        const matchName = item.name.toLowerCase().includes(term);
        const matchCampus = item.campus_name?.toLowerCase().includes(term);
        const matchAddress = item.address.toLowerCase().includes(term);
        const matchWard = item.ward?.toLowerCase().includes(term);
        if (!matchName && !matchCampus && !matchAddress && !matchWard) {
          return false;
        }
      }

      return true;
    });
  }, [schools, schoolSearchTerm, schoolLevelFilter, schoolTypeFilter]);

  // Xử lý chọn Hotspot từ Map hoặc List
  const handleSelectHotspot = useCallback((hotspot: PublicHotspot) => {
    setSelectedHotspot(hotspot);
    setFlyToLocation({
      lat: hotspot.public_lat,
      lng: hotspot.public_lng,
      zoom: 16,
    });
    // Nếu trên mobile, tự động chuyển về tab map để quan sát
    if (window.innerWidth < 1024) {
      setActiveTabMobile('map');
    }
  }, []);

  // Xử lý định vị bay tới tọa độ
  const handleFlyTo = useCallback((lat: number, lng: number, zoom = 16) => {
    setFlyToLocation({ lat, lng, zoom });
    if (window.innerWidth < 1024) {
      setActiveTabMobile('map');
    }
  }, []);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = filteredHotspots.length;
    const highRisk = filteredHotspots.filter((h) => h.severity === 'high_risk').length;
    const attentionNeeded = filteredHotspots.filter((h) => h.severity === 'attention_needed').length;
    const surveyedSafe = filteredHotspots.filter((h) => h.severity === 'surveyed_safe').length;
    return { total, highRisk, attentionNeeded, surveyedSafe };
  }, [filteredHotspots]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* =========================================================================
          SECTION A: HEADER TRANG BẢN ĐỒ & BREADCRUMB
         ========================================================================= */}
      <div className="space-y-3 border-b border-slate-200/90 pb-5">
        <Breadcrumb items={[{ label: 'Bản đồ số tương tác' }]} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase">
                Bản đồ số đa trường
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Phạm vi: Toàn địa bàn TP. Biên Hòa (cũ) (30 phường/xã)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                <Database className="w-3 h-3" />
                73 cơ sở giáo dục đã xác minh
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
              BẢN ĐỒ CỔNG TRƯỜNG AN TOÀN – TP. BIÊN HÒA
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Không gian số trực quan tích hợp 2 lớp độc lập: Vị trí 73 cơ sở giáo dục (Tiểu học đến Đại học) và các điểm nguy cơ an toàn giao thông được xác minh thực tế.
            </p>
          </div>

          {/* Quick city overview trigger */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-4 shrink-0 hover:border-blue-300 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-950 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                🏛️
              </div>
              <div className="text-xs">
                <div className="font-bold text-navy-950">
                  {schools.length} Cơ sở giáo dục
                </div>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Đại học &bull; Cao đẳng &bull; THPT &bull; THCS &bull; Tiểu học
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFlyTo(BIEN_HOA_GEO.center.lat, BIEN_HOA_GEO.center.lng, BIEN_HOA_GEO.defaultZoom)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all active:scale-95 whitespace-nowrap"
            >
              Toàn cảnh
            </button>
          </div>
        </div>

        {/* Thống kê nhanh thanh số liệu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <span className="text-blue-900 font-medium">Trường học hiển thị:</span>
            <strong className="text-blue-950 font-bold text-sm">{filteredSchools.length} / {schools.length}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Điểm nguy cơ ATGT:</span>
            <strong className="text-navy-950 font-bold text-sm">{stats.total}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <span className="text-amber-800 font-medium">Cần chú ý:</span>
            <strong className="text-amber-950 font-bold text-sm">{stats.attentionNeeded}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
            <span className="text-rose-800 font-medium">Nguy cơ cao:</span>
            <strong className="text-rose-950 font-bold text-sm">{stats.highRisk}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
            <span className="text-emerald-800 font-medium">Đã khảo sát:</span>
            <strong className="text-emerald-950 font-bold text-sm">{stats.surveyedSafe}</strong>
          </div>
        </div>
      </div>

      {/* Tabs điều hướng trên thiết bị di động (Mobile Switcher) */}
      <div className="flex lg:hidden rounded-xl bg-slate-100 p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTabMobile('map')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTabMobile === 'map'
              ? 'bg-white text-navy-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Bản đồ số ({filteredHotspots.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile('list')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTabMobile === 'list'
              ? 'bg-white text-navy-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
          Danh sách & Bộ lọc
        </button>
      </div>

      {/* =========================================================================
          SECTION B: KHUNG BẢN ĐỒ VÀ SIDEBAR DANH SÁCH & BỘ LỌC
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[620px]">
        {/* Cột 1, 2, 3: Bản đồ tương tác (3/4 chiều rộng desktop) */}
        <div
          className={`lg:col-span-3 flex flex-col min-h-[580px] relative ${
            activeTabMobile === 'map' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Dual Layer Controller Bar */}
          <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Lớp dữ liệu bản đồ:
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Layer A Switch: Trường học */}
              <button
                type="button"
                onClick={() => setShowSchoolsLayer(!showSchoolsLayer)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-micro active:scale-95 ${
                  showSchoolsLayer
                    ? 'bg-navy-950 text-white border-navy-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60'
                }`}
                title="Bật/Tắt hiển thị vị trí 73 trường học trên bản đồ"
              >
                <span>🏫</span>
                <span>Lớp Trường học ({filteredSchools.length})</span>
                <span className={`w-2 h-2 rounded-full ${showSchoolsLayer ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
              </button>

              {/* Layer B Switch: Điểm nguy cơ */}
              <button
                type="button"
                onClick={() => setShowHotspotsLayer(!showHotspotsLayer)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-micro active:scale-95 ${
                  showHotspotsLayer
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 opacity-60'
                }`}
                title="Bật/Tắt hiển thị các điểm nguy cơ an toàn giao thông"
              >
                <span>⚠️</span>
                <span>Lớp Điểm nguy cơ ({filteredHotspots.length})</span>
                <span className={`w-2 h-2 rounded-full ${showHotspotsLayer ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
              </button>
            </div>
          </div>

          <MapWrapper
            hotspots={filteredHotspots}
            selectedHotspotId={selectedHotspot?.hotspot_id || null}
            onSelectHotspot={handleSelectHotspot}
            schools={filteredSchools}
            flyToLocation={flyToLocation}
            showSchoolsLayer={showSchoolsLayer}
            showHotspotsLayer={showHotspotsLayer}
          />

          {/* Floating Detail Drawer khi chọn một Hotspot */}
          <HotspotDetailDrawer
            hotspot={selectedHotspot}
            onClose={() => setSelectedHotspot(null)}
            onFlyTo={(lat, lng) => handleFlyTo(lat, lng, 16)}
          />

          {/* Prompt 5 & Multi-school Thông báo kỹ thuật */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Bản đồ đa trường học TP. Biên Hòa (cũ):</strong> Dữ liệu vị trí gồm 73 cơ sở giáo dục đã qua xác minh thực địa từ OpenStreetMap, cổng thông tin Sở GD&ĐT Đồng Nai và trang thông tin chính thức của các trường. Tọa độ điểm an toàn giao thông được định vị an toàn trên tim đường giao thông công cộng.
            </div>
          </div>
        </div>

        {/* Cột 4: Sidebar Bộ lọc & Danh mục (1/4 chiều rộng desktop) */}
        <div
          className={`space-y-4 flex flex-col ${
            activeTabMobile === 'list' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Tabs chuyển đổi giữa Hotspots và Trường học */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setSidebarTab('hotspots')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === 'hotspots'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Điểm nguy cơ ({filteredHotspots.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('schools')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                sidebarTab === 'schools'
                  ? 'bg-white text-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SchoolIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Trường học ({filteredSchools.length})</span>
            </button>
          </div>

          {/* TAB 1: HOTSPOTS */}
          {sidebarTab === 'hotspots' && (
            <>
              {/* Card Bộ lọc Hotspots */}
              <Card hover sheen glow="blue" className="border-slate-200/90 shadow-xs">
                <CardHeader className="py-3 px-4 bg-slate-50/70">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      Bộ lọc điểm nguy cơ
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">
                      LIVE
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <HotspotFilter
                    filter={filter}
                    onChange={setFilter}
                    onReset={() =>
                      setFilter({
                        searchTerm: '',
                        severity: 'all',
                        processingStatus: 'all',
                        timeRange: 'all',
                        includeDemo: true,
                      })
                    }
                    totalCount={hotspots.length}
                    filteredCount={filteredHotspots.length}
                  />
                </CardContent>
              </Card>

              {/* Card Danh sách Hotspots */}
              <Card hover glow="none" className="flex-1 flex flex-col border-slate-200/90 shadow-xs">
                <CardHeader className="py-3 px-4 bg-slate-50/70 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Điểm cần chú ý
                  </CardTitle>
                  <Badge variant="outline" size="sm">
                    {filteredHotspots.length} điểm
                  </Badge>
                </CardHeader>
                <CardContent className="p-3 flex-1 flex flex-col justify-start">
                  <HotspotList
                    hotspots={filteredHotspots}
                    selectedHotspotId={selectedHotspot?.hotspot_id || null}
                    onSelectHotspot={handleSelectHotspot}
                    isLoading={isLoading}
                    error={error}
                    onRetry={loadData}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* TAB 2: SCHOOLS DIRECTORY & FILTERS */}
          {sidebarTab === 'schools' && (
            <>
              {/* Card Tìm kiếm & Lọc Trường học */}
              <Card hover glow="blue" className="border-slate-200/90 shadow-xs">
                <CardHeader className="py-3 px-4 bg-slate-50/70">
                  <CardTitle className="text-xs uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                      Tìm & Lọc trường học
                    </span>
                    <Badge variant="primary" size="sm">
                      {filteredSchools.length} / {schools.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Ô tìm kiếm */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Tên trường hoặc phường:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={schoolSearchTerm}
                        onChange={(e) => setSchoolSearchTerm(e.target.value)}
                        placeholder="VD: Tam Hiệp, Lạc Hồng, Lê Quý Đôn..."
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Dropdown Cấp học */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Cấp học:
                    </label>
                    <select
                      value={schoolLevelFilter}
                      onChange={(e) => setSchoolLevelFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả cấp học</option>
                      <option value="university">Đại học (4)</option>
                      <option value="college">Cao đẳng (4)</option>
                      <option value="vocational">GDNN / Trung cấp (3)</option>
                      <option value="high_school">THPT (11)</option>
                      <option value="multi_level">Phổ thông liên cấp (5)</option>
                      <option value="secondary">THCS (24)</option>
                      <option value="primary">Tiểu học (22)</option>
                    </select>
                  </div>

                  {/* Dropdown Loại hình */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Loại hình:
                    </label>
                    <select
                      value={schoolTypeFilter}
                      onChange={(e) => setSchoolTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tất cả loại hình</option>
                      <option value="public">Công lập</option>
                      <option value="private">Dân lập / Tư thục</option>
                    </select>
                  </div>

                  {/* Nút Đặt lại bộ lọc */}
                  {(schoolSearchTerm || schoolLevelFilter !== 'all' || schoolTypeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchoolSearchTerm('');
                        setSchoolLevelFilter('all');
                        setSchoolTypeFilter('all');
                      }}
                      className="w-full py-1.5 text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      Đặt lại bộ lọc trường
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Danh sách các cơ sở giáo dục */}
              <Card hover glow="none" className="flex-1 flex flex-col border-slate-200/90 shadow-xs max-h-[500px]">
                <CardHeader className="py-2.5 px-4 bg-slate-50/70 border-b border-slate-100 flex flex-row items-center justify-between">
                  <span className="text-xs font-bold uppercase text-navy-950 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    Danh sách ({filteredSchools.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Bấm để định vị</span>
                </CardHeader>
                <CardContent className="p-2 space-y-2 overflow-y-auto flex-1">
                  {filteredSchools.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Không tìm thấy trường phù hợp bộ lọc.
                    </div>
                  ) : (
                    filteredSchools.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleFlyTo(s.lat, s.lng, 16)}
                        className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer transition-all space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-950 text-white">
                            {s.education_level ? (EDUCATION_LEVEL_LABELS[s.education_level] || 'Trường học') : 'Trường học'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            s.school_type === 'private' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {s.school_type === 'private' ? 'Tư thục' : 'Công lập'}
                          </span>
                          {s.is_focal_point && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white">
                              Thí điểm
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-navy-950 text-xs group-hover:text-blue-600 transition-colors leading-snug">
                          {s.name}
                        </h4>

                        {s.campus_name && (
                          <div className="text-[10px] font-semibold text-blue-600">
                            📌 {s.campus_name}
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {s.address}{s.ward ? `, P. ${s.ward}` : ''}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã xác minh
                          </span>
                          <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                            Xem trên map <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION D: CHÚ GIẢI CHI TIẾT (LEGEND BẢN ĐỒ)
          Phân biệt bằng cả màu sắc VÀ biểu tượng / hình dáng hình học
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Compass className="w-4 h-4 text-blue-600" />
          Quy chuẩn Chú giải Ký hiệu Bản đồ Đa trường (Map Legend)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Ký hiệu 1: Cơ sở giáo dục */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-8 h-8 rounded-lg bg-navy-950 text-white flex items-center justify-center font-bold text-base shrink-0 border border-white shadow-xs">
              🏫
            </div>
            <div className="space-y-0.5">
              <strong className="text-navy-950 block">Cơ sở giáo dục ({schools.length} trường)</strong>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Huy hiệu xanh Navy viền trắng: 73 cơ sở giáo dục đã kiểm chứng vị trí thực địa trên 30 phường/xã Biên Hòa (cũ).
              </p>
            </div>
          </div>

          {/* Ký hiệu 2: Cần chú ý */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
              ⚠️
            </div>
            <div className="space-y-0.5">
              <strong className="text-amber-950 block">Mức: Cần chú ý</strong>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Biểu tượng Tam giác bo góc + Cảnh báo: Khu vực có phản ánh đã xác minh, cần lưu tâm theo dõi.
              </p>
            </div>
          </div>

          {/* Ký hiệu 3: Nguy cơ cao */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
              🛑
            </div>
            <div className="space-y-0.5">
              <strong className="text-rose-950 block">Mức: Nguy cơ cao</strong>
              <p className="text-rose-800 text-[11px] leading-relaxed">
                Biểu tượng Bát giác dừng: Đã khảo sát hiện trường xác nhận có yếu tố va chạm, khuất tầm nhìn.
              </p>
            </div>
          </div>

          {/* Ký hiệu 4: Đã khảo sát chưa ghi nhận nguy cơ */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs text-sm">
              🛡️
            </div>
            <div className="space-y-0.5">
              <strong className="text-emerald-950 block">Mức: Đã khảo sát</strong>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                Biểu tượng Khiên tròn: Đã khảo sát thực địa tại thời điểm ghi nhận, trật tự giao thông ổn định.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
