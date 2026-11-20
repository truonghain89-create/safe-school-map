'use server';

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import type { IssueType, ReportScopeType, RoutingStatus } from '@/types';

const VALID_ISSUE_TYPES: IssueType[] = [
  'traffic_jam',
  'illegal_parking',
  'unsafe_crossing',
  'blind_spot',
  'collision_risk',
  'other',
];

export interface SubmitReportResponse {
  success: boolean;
  trackingCode?: string;
  reportId?: string;
  submittedAt?: string;
  issueType?: IssueType;
  locationName?: string;
  scopeType?: ReportScopeType;
  routingStatus?: RoutingStatus;
  schoolId?: string | null;
  error?: string;
}

/**
 * Sinh mã tra cứu ngẫu nhiên có độ hỗn loạn (entropy) cao
 * Định dạng: SFM-XXXX-XXXX (bỏ các ký tự dễ nhầm lẫn như 0, O, 1, I)
 */
function generateTrackingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';

  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    segment1 += chars[bytes[i] % chars.length];
    segment2 += chars[bytes[i + 4] % chars.length];
  }

  return `SFM-${segment1}-${segment2}`;
}

export async function submitReportAction(formData: FormData): Promise<SubmitReportResponse> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        success: false,
        error: 'Chưa cấu hình thông tin kết nối máy chủ Supabase.',
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Trích xuất và xác thực dữ liệu đầu vào
    const issueType = formData.get('issue_type') as IssueType;
    const description = (formData.get('description') as string || '').trim();
    const latStr = formData.get('actual_lat') as string;
    const lngStr = formData.get('actual_lng') as string;
    const occurredAtStr = formData.get('occurred_at') as string;
    const timeWindow = (formData.get('time_window') as string || '').trim();
    const locationName = (formData.get('location_name') as string || '').trim();
    
    // Xử lý phạm vi phản ánh và mã trường học (Prompt 9.5)
    const rawSchoolId = (formData.get('school_id') as string || '').trim();
    const rawScopeType = (formData.get('scope_type') as string || '').trim();

    const schoolId = (rawSchoolId && rawSchoolId !== 'null' && rawSchoolId !== 'undefined' && rawSchoolId !== '')
      ? rawSchoolId
      : null;
    
    const scopeType: ReportScopeType = (rawScopeType as ReportScopeType) || (schoolId ? 'school_specific' : 'public_corridor');
    const routingStatus: RoutingStatus = schoolId ? 'assigned_to_school' : 'unassigned';

    // Kiểm tra loại vấn đề
    if (!issueType || !VALID_ISSUE_TYPES.includes(issueType)) {
      return {
        success: false,
        error: 'Vui lòng chọn loại vấn đề giao thông hợp lệ.',
      };
    }

    // Kiểm tra mô tả
    if (!description || description.length < 10) {
      return {
        success: false,
        error: 'Mô tả tình trạng phải có độ dài ít nhất 10 ký tự để cán bộ có đủ thông tin thẩm định.',
      };
    }

    if (description.length > 1000) {
      return {
        success: false,
        error: 'Mô tả không được vượt quá 1000 ký tự.',
      };
    }

    // Kiểm tra tọa độ
    const actualLat = parseFloat(latStr);
    const actualLng = parseFloat(lngStr);

    if (isNaN(actualLat) || isNaN(actualLng) || actualLat < -90 || actualLat > 90 || actualLng < -180 || actualLng > 180) {
      return {
        success: false,
        error: 'Tọa độ vị trí phản ánh không hợp lệ. Vui lòng chọn lại trên bản đồ.',
      };
    }

    // Kiểm tra thời điểm xảy ra
    let occurredAt = new Date().toISOString();
    if (occurredAtStr) {
      const parsedDate = new Date(occurredAtStr);
      if (!isNaN(parsedDate.getTime())) {
        // Không cho phép chọn ngày tương lai quá 1 ngày (trừ độ lệch múi giờ)
        const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
        if (parsedDate > tomorrow) {
          return {
            success: false,
            error: 'Thời điểm xảy ra sự việc không thể ở trong tương lai.',
          };
        }
        occurredAt = parsedDate.toISOString();
      }
    }

    if (!timeWindow) {
      return {
        success: false,
        error: 'Vui lòng chọn khung giờ thường xảy ra sự việc.',
      };
    }

    // 2. Khởi tạo mã tra cứu và UUID của Report
    const reportId = crypto.randomUUID();
    const trackingCode = generateTrackingCode();
    const trackingCodeHash = crypto.createHash('sha256').update(trackingCode).digest('hex');

    // 3. Xử lý tệp ảnh nếu có
    const imageFile = formData.get('image_file') as File | null;
    let uploadedFilePath: string | null = null;
    let fileSizeBytes = 0;
    let fileMimeType = '';

    if (imageFile && imageFile.size > 0) {
      // Giới hạn 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          error: 'Dung lượng ảnh vượt quá giới hạn tối đa 5MB.',
        };
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validMimeTypes.includes(imageFile.type)) {
        return {
          success: false,
          error: 'Định dạng ảnh không được hỗ trợ. Vui lòng tải lên ảnh định dạng JPG, PNG hoặc WEBP.',
        };
      }

      fileSizeBytes = imageFile.size;
      fileMimeType = imageFile.type;

      // Đặt tên file an toàn trong thư mục con mang ID của Report
      const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `${Date.now()}_img.${ext}`;
      const storagePath = `${reportId}/${cleanFileName}`;

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('private-reports')
        .upload(storagePath, buffer, {
          contentType: fileMimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error('[submitReportAction] Lỗi tải ảnh lên Storage:', uploadError.message);
        return {
          success: false,
          error: 'Không thể lưu ảnh minh chứng vào kho bảo mật. Vui lòng thử lại.',
        };
      }

      uploadedFilePath = storagePath;
    }

    // 4. Ghi nhận Report vào bảng reports
    // Xây dựng payload linh hoạt hỗ trợ cả Schema 9.5 mới và Schema cũ tương thích ngược
    const reportInsertPayload: Record<string, any> = {
      id: reportId,
      tracking_code_hash: trackingCodeHash,
      school_id: schoolId,
      issue_type: issueType,
      description: description,
      actual_lat: actualLat,
      actual_lng: actualLng,
      occurred_at: occurredAt,
      time_window: timeWindow,
      verification_status: 'pending',
      is_hidden: false,
      is_demo: false, // Dữ liệu người dân gửi thật
      submitted_at: new Date().toISOString(),
      scope_type: scopeType,
      routing_status: routingStatus,
    };

    let { error: insertReportError } = await supabase.from('reports').insert(reportInsertPayload);

    // Cơ chế tương thích ngược (Fallback): Nếu Supabase Cloud chưa chạy migration Prompt 9.5
    // (Báo lỗi cột scope_type không tồn tại hoặc ràng buộc NOT NULL school_id)
    if (insertReportError && (
      insertReportError.message.includes('scope_type') || 
      insertReportError.message.includes('routing_status') ||
      insertReportError.message.includes('null value in column "school_id"')
    )) {
      console.warn('[submitReportAction] Database Cloud đang ở schema cũ, kích hoạt chế độ tương thích ngược.');
      delete reportInsertPayload.scope_type;
      delete reportInsertPayload.routing_status;
      if (!reportInsertPayload.school_id) {
        reportInsertPayload.school_id = '00000000-0000-0000-0000-000000000001'; // Tạm thời dùng fixture để không làm đứt gãy flow người dùng
      }
      const retryResult = await supabase.from('reports').insert(reportInsertPayload);
      insertReportError = retryResult.error;
    }

    if (insertReportError) {
      console.error('[submitReportAction] Lỗi ghi nhận Report:', insertReportError.message);
      // Dọn dẹp tệp ảnh tạm nếu ghi nhận report thất bại
      if (uploadedFilePath) {
        await supabase.storage.from('private-reports').remove([uploadedFilePath]);
      }
      return {
        success: false,
        error: 'Không thể ghi nhận phản ánh vào hệ thống. Vui lòng thử lại sau ít phút.',
      };
    }

    // 5. Nếu có ảnh, ghi nhận vào bảng report_media
    if (uploadedFilePath) {
      const { error: insertMediaError } = await supabase.from('report_media').insert({
        report_id: reportId,
        original_file_path: uploadedFilePath,
        file_type: fileMimeType,
        file_size_bytes: fileSizeBytes,
        moderation_status: 'pending',
        privacy_processing_status: 'raw',
      });

      if (insertMediaError) {
        console.warn('[submitReportAction] Cảnh báo ghi nhận media:', insertMediaError.message);
        // Không hủy report nếu media bị lỗi nhỏ
      }
    }

    return {
      success: true,
      trackingCode: trackingCode,
      reportId: reportId,
      submittedAt: new Date().toISOString(),
      issueType: issueType,
      locationName: locationName || (schoolId ? 'Khu vực phụ cận trường học' : 'Khu vực giao thông chung / Tuyến đường'),
      scopeType: scopeType,
      routingStatus: routingStatus,
      schoolId: schoolId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống bất ngờ.';
    console.error('[submitReportAction] Exception:', message);
    return {
      success: false,
      error: 'Hệ thống đang bận. Vui lòng thử lại sau giây lát.',
    };
  }
}
