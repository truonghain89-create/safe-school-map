/**
 * SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN
 * Core TypeScript Definitions (v4 Specification)
 */

// 1. Phân loại loại sự cố giao thông
export type IssueType =
  | 'traffic_jam'        // Ùn tắc giao thông
  | 'illegal_parking'    // Dừng, đỗ xe không đúng vị trí
  | 'unsafe_crossing'    // Sang đường không an toàn
  | 'blind_spot'         // Khuất tầm nhìn
  | 'collision_risk'     // Nguy cơ va chạm
  | 'other';             // Vấn đề khác

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  traffic_jam: 'Ùn tắc giao thông',
  illegal_parking: 'Dừng, đỗ xe không đúng nơi quy định',
  unsafe_crossing: 'Sang đường không an toàn',
  blind_spot: 'Khuất tầm nhìn',
  collision_risk: 'Nguy cơ va chạm',
  other: 'Vấn đề giao thông khác',
};

// 2. Trục 1: Trạng thái xác minh của Report (Độc lập)
export type VerificationStatus =
  | 'pending'   // Chờ xác minh
  | 'verified'  // Đã xác minh
  | 'invalid';  // Không hợp lệ (Bắt buộc kèm lý do)

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ xác minh', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  verified: { label: 'Đã xác minh', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  invalid: { label: 'Không hợp lệ', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

// 3. Trục 2: Trạng thái xử lý của Hotspot (Độc lập)
export type ProcessingStatus =
  | 'unprocessed' // Chưa xử lý
  | 'in_progress' // Đang xử lý
  | 'resolved';   // Đã xử lý

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, { label: string; color: string }> = {
  unprocessed: { label: 'Chưa xử lý', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  in_progress: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  resolved: { label: 'Đã xử lý', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

// 4. Trục 3: Trạng thái công khai của Hotspot (Độc lập)
export type PublicationStatus =
  | 'unpublished' // Chưa công khai
  | 'published'   // Đã công khai
  | 'hidden';     // Đã ẩn

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, { label: string; color: string }> = {
  unpublished: { label: 'Chưa công khai', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  published: { label: 'Đã công khai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  hidden: { label: 'Đã ẩn', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

// 5. Mức độ nguy cơ Hotspot (Do Người xác minh tự đánh giá thủ công, AI không tự quyết định)
export type HotspotSeverity =
  | 'attention_needed' // Cần chú ý (Vàng)
  | 'high_risk'        // Nguy cơ cao (Đỏ)
  | 'surveyed_safe';   // Đã khảo sát, chưa ghi nhận nguy cơ (Xanh lá)

export const HOTSPOT_SEVERITY_META: Record<
  HotspotSeverity,
  { label: string; description: string; badgeClass: string; iconName: string }
> = {
  attention_needed: {
    label: 'Cần chú ý',
    description: 'Khu vực có phản ánh ghi nhận, cần theo dõi và khảo sát',
    badgeClass: 'bg-amber-500 text-white',
    iconName: 'AlertTriangle',
  },
  high_risk: {
    label: 'Nguy cơ cao',
    description: 'Đã khảo sát thực địa xác nhận có yếu tố va chạm, khuất tầm nhìn nghiêm trọng',
    badgeClass: 'bg-rose-600 text-white',
    iconName: 'AlertOctagon',
  },
  surveyed_safe: {
    label: 'Đã khảo sát, chưa ghi nhận nguy cơ',
    description: 'Đã khảo sát thực tế tại thời điểm ghi nhận, chưa phát hiện nguy cơ',
    badgeClass: 'bg-emerald-600 text-white',
    iconName: 'ShieldCheck',
  },
};

// 6. Vai trò người dùng nội bộ
export type UserRole =
  | 'verifier'  // Người xác minh
  | 'approver'  // Người phê duyệt công khai
  | 'admin';    // Quản trị viên

// 6.1. Cấp học / Loại hình đào tạo
export type EducationLevel =
  | 'primary'      // Tiểu học
  | 'secondary'    // THCS
  | 'high_school'  // THPT
  | 'multi_level'  // Phổ thông liên cấp
  | 'vocational'   // Giáo dục nghề nghiệp / Trung cấp
  | 'college'      // Cao đẳng
  | 'university'   // Đại học
  | 'unspecified'; // Chưa xác định / Khác

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  primary: 'Tiểu học',
  secondary: 'THCS',
  high_school: 'THPT',
  multi_level: 'Liên cấp',
  vocational: 'GDNN / Trung cấp',
  college: 'Cao đẳng',
  university: 'Đại học',
  unspecified: 'Chưa xác định',
};

// 6.2. Loại hình trường học
export type SchoolType =
  | 'public'       // Công lập
  | 'private'      // Tư thục
  | 'other'        // Khác
  | 'unspecified'; // Chưa xác định

export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  public: 'Công lập',
  private: 'Tư thục',
  other: 'Khác',
  unspecified: 'Chưa xác định',
};

// 6.3. Phạm vi phản ánh
export type ReportScopeType =
  | 'school_specific' // Gắn trực tiếp với một trường
  | 'near_school'     // Khu vực phụ cận quanh trường
  | 'public_corridor' // Tuyến đường / Khu vực công cộng
  | 'unknown_school'; // Chưa rõ trường liên quan

export const REPORT_SCOPE_LABELS: Record<ReportScopeType, string> = {
  school_specific: 'Gắn trực tiếp với cổng trường',
  near_school: 'Khu vực phụ cận quanh trường',
  public_corridor: 'Tuyến đường / Khu vực công cộng',
  unknown_school: 'Chưa xác định trường liên quan',
};

// 6.4. Trạng thái phân luồng phản ánh
export type RoutingStatus =
  | 'unassigned'         // Chưa phân công (Hàng đợi chung)
  | 'assigned_to_school' // Đã phân công về trường
  | 'regional_corridor'; // Hành lang đô thị chung

export const ROUTING_STATUS_LABELS: Record<RoutingStatus, { label: string; badgeClass: string }> = {
  unassigned: { label: 'Chờ phân luồng', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  assigned_to_school: { label: 'Đã gán trường', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  regional_corridor: { label: 'Hành lang đô thị chung', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
};

// 7. Cấu trúc trường học (School)
export interface School {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pilot' | 'active' | 'suspended';
  public_map_approved: boolean; // Trường đã đồng ý công khai bản đồ hay chưa
  approved_by?: string | null;
  approved_at?: string | null;
  is_focal_point?: boolean;     // Điểm trọng tâm thí điểm
  education_level?: EducationLevel;
  school_type?: SchoolType;
  ward?: string | null;
  verification_source?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  is_verified?: boolean;
  location_public_approved?: boolean;
  location_approved_by?: string | null;
  location_approved_at?: string | null;
  parent_institution_name?: string | null;
  campus_name?: string | null;
  website?: string | null;
  confidence_tier?: 'A' | 'B' | 'C' | null;
  created_at: string;
}

// 8. Hồ sơ người dùng (Profile)
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  school_id?: string | null;
  full_name?: string;
  created_at: string;
}

// 9. Phản ánh từ cộng đồng (Report - Dữ liệu nguồn)
export interface Report {
  id: string;
  tracking_code_hash: string;
  school_id?: string | null;
  scope_type?: ReportScopeType;
  routing_status?: RoutingStatus;
  hotspot_id?: string | null;
  issue_type: IssueType;
  description: string;
  actual_lat: number;           // Tọa độ thực tế người gửi cung cấp (nội bộ)
  actual_lng: number;
  occurred_at: string;
  time_window: string;          // Khung giờ (ví dụ: '06:45 - 07:15', '16:30 - 17:00')
  verification_status: VerificationStatus;
  rejection_reason?: string;    // Bắt buộc khi verification_status = 'invalid'
  reviewed_by?: string;
  reviewed_at?: string;
  is_hidden: boolean;
  is_demo: boolean;
  submitted_at: string;
}

// 10. Điểm cần chú ý (Hotspot)
export interface Hotspot {
  id: string;
  school_id?: string | null;
  name: string;
  actual_lat: number;           // Tọa độ thực địa nội bộ
  actual_lng: number;
  public_lat: number;           // Tọa độ hiển thị đã được tổng quát hóa (đại diện tim đường)
  public_lng: number;
  severity: HotspotSeverity;
  processing_status: ProcessingStatus;
  publication_status: PublicationStatus;
  approved_by?: string;
  published_at?: string;
  is_hidden: boolean;
  is_demo: boolean;
  report_count?: number;        // Số phản ánh tham khảo
  time_window_summary?: string; // Khung giờ tập trung tính toán từ Report
  created_at: string;
  updated_at: string;
}

// 10.1. Dữ liệu Hotspot công khai (Từ View public_hotspots_view)
export interface PublicHotspot {
  hotspot_id: string;
  school_id?: string | null;
  school_name: string;
  school_address: string;
  hotspot_name: string;
  public_lat: number;
  public_lng: number;
  severity: HotspotSeverity;
  processing_status: ProcessingStatus;
  publication_status: PublicationStatus;
  published_at: string;
  verified_report_count: number;
  latest_survey_date?: string | null;
  public_image_paths?: string[];
  is_demo: boolean;
  // Các mốc thời gian chi tiết (Chỉ hiển thị khi có dữ liệu thực tế)
  first_occurred_at?: string | null;     // Thời gian ghi nhận sự việc
  latest_occurred_at?: string | null;    // Thời gian ghi nhận sự việc gần nhất
  latest_verified_at?: string | null;    // Thời gian xác minh gần nhất
  updated_at?: string | null;            // Thời gian cập nhật gần nhất
  time_window?: string | null;           // Khung giờ ảnh hưởng (VD: '16:30 - 17:30')
  valid_from?: string | null;            // Ngày bắt đầu có hiệu lực
  valid_until?: string | null;           // Ngày hết hiệu lực (nếu có)
}

// 11. Khảo sát thực địa (HotspotSurvey)
export interface HotspotSurvey {
  id: string;
  hotspot_id: string;
  surveyor_id: string;
  survey_date: string;
  findings: string;
  recorded_risk_level: HotspotSeverity;
  recommendations?: string;
  survey_media_paths?: string[];
  created_at: string;
}

// 12. Nhật ký hệ thống (AuditLog - Bất biến)
export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  object_type: 'report' | 'hotspot' | 'profile' | 'school' | 'survey';
  object_id: string;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
  reason?: string;
  created_at: string;
}
