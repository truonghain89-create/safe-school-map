'use client';

import React, { useMemo } from 'react';
import { Building2, Globe, MapPin, School as SchoolIcon, Filter } from 'lucide-react';
import { BIEN_HOA_SCHOOLS_DATA } from '@/lib/constants/schools-bien-hoa';
import { EDUCATION_LEVEL_LABELS, type EducationLevel } from '@/types';

interface SchoolFilterSelectProps {
  selectedSchoolId: string;
  onSelectSchool: (schoolId: string) => void;
  isLoading?: boolean;
}

const LEVEL_ORDER: EducationLevel[] = [
  'university',
  'college',
  'vocational',
  'high_school',
  'secondary',
  'primary',
  'multi_level',
];

export function SchoolFilterSelect({
  selectedSchoolId,
  onSelectSchool,
  isLoading = false,
}: SchoolFilterSelectProps) {
  // Nhóm danh mục 86 trường theo cấp học
  const groupedSchools = useMemo(() => {
    const groups: Record<string, typeof BIEN_HOA_SCHOOLS_DATA> = {};

    LEVEL_ORDER.forEach((lvl) => {
      groups[lvl] = [];
    });

    BIEN_HOA_SCHOOLS_DATA.forEach((s) => {
      // Bỏ qua THPT Tam Hiệp vì đã được đặt nổi bật ở nhóm Thí điểm
      if (s.id === '00000000-0000-0000-0000-000000000001') return;
      const lvl = (s.education_level || 'unspecified') as string;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(s);
    });

    return groups;
  }, []);

  // Lấy thông tin trường đang chọn để hiển thị tag
  const currentSchool = useMemo(() => {
    if (selectedSchoolId === 'all') {
      return {
        name: 'Toàn địa bàn TP. Biên Hòa (cũ)',
        address: 'Tổng hợp số liệu trên toàn bộ 30 phường/xã',
        levelLabel: 'Toàn đô thị',
        isAll: true,
      };
    }
    if (selectedSchoolId === '00000000-0000-0000-0000-000000000001') {
      return {
        name: 'Trường THPT Tam Hiệp',
        address: 'Khu phố 4, Đ. Phạm Văn Thuận, P. Tam Hiệp',
        levelLabel: 'Cơ sở thí điểm M1',
        isPilot: true,
      };
    }
    const found = BIEN_HOA_SCHOOLS_DATA.find((s) => s.id === selectedSchoolId);
    if (found) {
      return {
        name: found.name + (found.campus_name ? ` - ${found.campus_name}` : ''),
        address: found.address,
        levelLabel: found.education_level
          ? EDUCATION_LEVEL_LABELS[found.education_level] || 'Trường học'
          : 'Trường học',
        ward: found.ward,
      };
    }
    return {
      name: 'Trường đã chọn',
      address: '',
      levelLabel: 'Cơ sở',
    };
  }, [selectedSchoolId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <label
          htmlFor="school-selector"
          className="flex items-center gap-2 text-xs font-bold text-navy-950 uppercase tracking-wide"
        >
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <span>Phạm vi hiển thị số liệu & biểu đồ</span>
        </label>

        {/* Badge trạng thái phạm vi */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
            {currentSchool.isAll ? (
              <Globe className="w-3 h-3 text-blue-600" />
            ) : (
              <Building2 className="w-3 h-3 text-blue-600" />
            )}
            <span>{currentSchool.levelLabel}</span>
          </span>
          {currentSchool.ward && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              P. {currentSchool.ward}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <select
          id="school-selector"
          value={selectedSchoolId}
          disabled={isLoading}
          onChange={(e) => onSelectSchool(e.target.value)}
          aria-label="Chọn phạm vi trường học hoặc toàn thành phố"
          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-navy-950 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200/90 py-2.5 pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
        >
          {/* Nhóm toàn thành phố */}
          <option value="all">
            🌐 Toàn địa bàn TP. Biên Hòa (cũ) — Tổng hợp 30 phường/xã (86 trường)
          </option>

          {/* Nhóm thí điểm trọng tâm */}
          <optgroup label="⭐ CƠ SỞ THÍ ĐIỂM TRỌNG TÂM (M1)">
            <option value="00000000-0000-0000-0000-000000000001">
              🏫 Trường THPT Tam Hiệp (Thí điểm M1 — Phường Tam Hiệp)
            </option>
          </optgroup>

          {/* Nhóm theo từng cấp học */}
          {LEVEL_ORDER.map((lvl) => {
            const list = groupedSchools[lvl];
            if (!list || list.length === 0) return null;
            const groupTitle = `BẬC ${EDUCATION_LEVEL_LABELS[lvl]?.toUpperCase() || lvl} (${list.length} cơ sở)`;
            return (
              <optgroup key={lvl} label={groupTitle}>
                {list.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.campus_name ? ` (${s.campus_name})` : ''} — P. {s.ward}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>

        {/* Custom arrow indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Thông tin địa chỉ chi tiết của trường được chọn */}
      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-0.5">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{currentSchool.address}</span>
      </div>
    </div>
  );
}
