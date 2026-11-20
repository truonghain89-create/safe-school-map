'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { IssueType, VerificationStatus, ProcessingStatus } from '@/types';

export interface LookupReportResult {
  success: boolean;
  found: boolean;
  data?: {
    trackingCode: string;
    verificationStatus: VerificationStatus;
    issueType: IssueType;
    timeWindow: string;
    submittedAt: string;
    hotspotName?: string | null;
    hotspotProcessingStatus?: ProcessingStatus | null;
    rejectionReason?: string | null;
    schoolName?: string;
  };
  error?: string;
}

// Bộ đệm rate-limiting đơn giản chống vét cạn mã (In-memory token bucket per IP/client)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + 60 * 1000 }); // 1 phút
    return true;
  }

  if (entry.count >= 15) {
    // Tối đa 15 lần tra cứu trong 1 phút
    return false;
  }

  entry.count += 1;
  return true;
}

export async function lookupReportAction(trackingCodeRaw: string): Promise<LookupReportResult> {
  try {
    const trackingCode = (trackingCodeRaw || '').trim().toUpperCase();

    // 1. Kiểm tra định dạng mã tra cứu SFM-XXXX-XXXX hoặc mã thử nghiệm SFM-DEMO-XXX
    const trackingCodeRegex = /^SFM-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
    const isDemoCode = /^SFM-DEMO-\d{3}$/.test(trackingCode);
    if (!trackingCode || (!trackingCodeRegex.test(trackingCode) && !isDemoCode)) {
      return {
        success: false,
        found: false,
        error: 'Mã tra cứu không đúng định dạng. Mã chuẩn có dạng SFM-XXXX-XXXX (Ví dụ: SFM-8K92-XY34 hoặc mã thử nghiệm SFM-DEMO-001).',
      };
    }

    // 2. Kiểm tra giới hạn tốc độ truy vấn theo địa chỉ IP của Client
    let clientIp = 'anonymous_client';
    try {
      const headerList = headers();
      const forwarded = headerList.get('x-forwarded-for');
      const realIp = headerList.get('x-real-ip');
      clientIp = forwarded ? forwarded.split(',')[0].trim() : (realIp || 'anonymous_client');
    } catch {
      // Fallback nếu chạy ngoài ngữ cảnh request
    }

    const isAllowed = checkRateLimit(clientIp);
    if (!isAllowed) {
      return {
        success: false,
        found: false,
        error: 'Bạn đã thực hiện quá nhiều lượt tra cứu liên tiếp. Vui lòng thử lại sau 1 phút.',
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        found: false,
        error: 'Lỗi cấu hình hệ thống máy chủ.',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 3. Tính băm một chiều SHA-256 từ mã tra cứu
    const codeHash = crypto.createHash('sha256').update(trackingCode).digest('hex');

    // 4. Gọi hàm bảo mật RPC rpc_lookup_report_by_code
    // Hàm này chạy với đặc quyền STABLE SECURITY DEFINER, trả về chỉ các trường an toàn được phép công khai
    const { data, error } = await supabase.rpc('rpc_lookup_report_by_code', {
      p_code_hash: codeHash,
    });

    if (error) {
      console.error('[lookupReportAction] Lỗi RPC:', error.message);
      return {
        success: false,
        found: false,
        error: 'Không thể kết nối đến máy chủ tra cứu. Vui lòng thử lại sau giây lát.',
      };
    }

    // Nếu không tìm thấy bản ghi khớp
    if (!data || data.length === 0 || !data[0]?.report_found) {
      return {
        success: true,
        found: false,
        error: 'Không tìm thấy thông tin phản ánh với mã tra cứu này. Vui lòng kiểm tra lại ký tự trên biên nhận.',
      };
    }

    const record = data[0];

    return {
      success: true,
      found: true,
      data: {
        trackingCode: trackingCode,
        verificationStatus: record.verification_status,
        issueType: record.issue_type,
        timeWindow: record.time_window || 'Không xác định',
        submittedAt: record.submitted_at,
        hotspotName: record.hotspot_name,
        hotspotProcessingStatus: record.hotspot_processing_status,
        rejectionReason: record.rejection_reason,
        schoolName: record.school_name || 'Khu vực an toàn giao thông học đường TP. Biên Hòa (cũ)',
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    console.error('[lookupReportAction] Exception:', message);
    return {
      success: false,
      found: false,
      error: 'Hệ thống tra cứu đang bận. Vui lòng thử lại sau ít phút.',
    };
  }
}
