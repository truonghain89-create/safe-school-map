/**
 * SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
 * Service truy vấn dữ liệu Bản đồ & Hotspots từ Supabase
 */

import { createClient } from '@/lib/supabase/client';
import type { PublicHotspot, School } from '@/types';
import { BIEN_HOA_SCHOOLS_DATA, getVerifiedBienHoaSchools } from '@/lib/constants/schools-bien-hoa';

export interface HotspotsQueryResult {
  data: PublicHotspot[];
  error: string | null;
}

export interface SchoolsQueryResult {
  data: School[];
  error: string | null;
}

/**
 * Truy vấn danh sách Hotspot công khai đủ điều kiện từ Supabase View: public_hotspots_view
 * Đảm bảo: View này đã lọc tự động 5 điều kiện tiên quyết ở mức Database.
 */
export async function getPublicHotspots(): Promise<HotspotsQueryResult> {
  const supabase = createClient();
  if (!supabase) {
    return {
      data: [],
      error: 'Chưa cấu hình thông tin kết nối Supabase (NEXT_PUBLIC_SUPABASE_URL).',
    };
  }

  try {
    const { data, error } = await supabase
      .from('public_hotspots_view')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[getPublicHotspots] Lỗi Supabase:', error.message);
      return {
        data: [],
        error: error.message,
      };
    }

    return {
      data: (data as PublicHotspot[]) || [],
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định khi tải dữ liệu.';
    console.error('[getPublicHotspots] Exception:', message);
    return {
      data: [],
      error: message,
    };
  }
}

/**
 * Truy vấn danh mục trường học đang thí điểm hoặc chính thức
 * Hỗ trợ kết hợp dữ liệu cơ sở dữ liệu Supabase Cloud với danh mục 73 trường đã xác minh thực tế tại Biên Hòa cũ.
 */
export async function getActiveSchools(): Promise<SchoolsQueryResult> {
  const verifiedBienHoa = getVerifiedBienHoaSchools();
  const mergedMap = new Map<string, School>();

  // 1. Nạp danh mục trường đã kiểm chứng thực địa tại TP. Biên Hòa cũ
  for (const school of verifiedBienHoa) {
    mergedMap.set(school.id, school);
  }

  const supabase = createClient();
  if (!supabase) {
    return {
      data: Array.from(mergedMap.values()),
      error: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .in('status', ['pilot', 'active'])
      .order('is_focal_point', { ascending: false });

    if (error) {
      console.warn('[getActiveSchools] Supabase query warning (sử dụng danh mục đã xác minh):', error.message);
      return {
        data: Array.from(mergedMap.values()),
        error: null,
      };
    }

    // 2. Hợp nhất bản ghi từ database (nếu trường đã tồn tại trong DB, cập nhật thêm dữ liệu mới nhất)
    if (data && Array.isArray(data)) {
      for (const s of data as School[]) {
        const existing = mergedMap.get(s.id);
        mergedMap.set(s.id, {
          ...(existing || {}),
          ...s,
        });
      }
    }

    return {
      data: Array.from(mergedMap.values()),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi khi tải danh sách trường.';
    console.warn('[getActiveSchools] Fallback danh mục xác minh do exception:', message);
    return {
      data: Array.from(mergedMap.values()),
      error: null,
    };
  }
}
