'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { FormInput, Textarea, Checkbox } from '@/components/common/FormControls';
import { Alert, LoadingState, ErrorState } from '@/components/common/FeedbackStates';
import LocationPickerMap from '@/components/map/LocationPickerMap';
import { submitReportAction, type SubmitReportResponse } from '@/app/actions/submit-report';
import { ISSUE_TYPE_LABELS, type IssueType, type ReportScopeType } from '@/types';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';
import {
  Car,
  Ban,
  Footprints,
  EyeOff,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Calendar,
  Clock,
  Camera,
  ShieldCheck,
  Send,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  UploadCloud,
  CheckCircle2,
  Lock,
  Timer,
  Info,
  School,
  Route,
} from 'lucide-react';

// Phân loại vấn đề chi tiết với mô tả cho người dùng dễ hiểu
const ISSUE_CONFIG: Record<
  IssueType,
  { label: string; description: string; icon: React.ReactNode; color: string }
> = {
  traffic_jam: {
    label: 'Ùn tắc giao thông',
    description: 'Phương tiện đông đúc, tắc nghẽn kéo dài tại khu vực cổng trường',
    icon: <Car className="w-5 h-5 text-amber-600" />,
    color: 'border-amber-200 bg-amber-50/40 text-amber-900',
  },
  illegal_parking: {
    label: 'Dừng, đỗ xe sai vị trí',
    description: 'Ô tô, xe máy dừng đỗ lấn chiếm lòng đường, vỉa hè dành cho người đi bộ',
    icon: <Ban className="w-5 h-5 text-rose-600" />,
    color: 'border-rose-200 bg-rose-50/40 text-rose-900',
  },
  unsafe_crossing: {
    label: 'Sang đường không an toàn',
    description: 'Học sinh khó sang đường do xe chạy tốc độ cao hoặc thiếu vạch kẻ đường',
    icon: <Footprints className="w-5 h-5 text-blue-600" />,
    color: 'border-blue-200 bg-blue-50/40 text-blue-900',
  },
  blind_spot: {
    label: 'Khuất tầm nhìn nguy hiểm',
    description: 'Góc cua, chướng ngại vật hoặc cây cối che khuất tầm nhìn người tham gia giao thông',
    icon: <EyeOff className="w-5 h-5 text-purple-600" />,
    color: 'border-purple-200 bg-purple-50/40 text-purple-900',
  },
  collision_risk: {
    label: 'Nguy cơ va chạm',
    description: 'Xung đột giữa các luồng xe đưa đón học sinh và phương tiện lưu thông lớn',
    icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    color: 'border-red-200 bg-red-50/40 text-red-900',
  },
  other: {
    label: 'Vấn đề giao thông khác',
    description: 'Các nguy cơ an toàn giao thông khác chưa có trong danh sách trên',
    icon: <HelpCircle className="w-5 h-5 text-slate-600" />,
    color: 'border-slate-200 bg-slate-50 text-slate-900',
  },
};

// 8 Khung giờ chuẩn hóa
const TIME_WINDOW_OPTIONS = [
  { value: '05:00 - 07:00', label: '05:00 – 07:00 (Sáng sớm)' },
  { value: '07:00 - 09:00', label: '07:00 – 09:00 (Cao điểm buổi sáng vào lớp)' },
  { value: '09:00 - 11:00', label: '09:00 – 11:00 (Buổi sáng)' },
  { value: '11:00 - 13:00', label: '11:00 – 13:00 (Tan học ca sáng)' },
  { value: '13:00 - 15:00', label: '13:00 – 15:00 (Đầu giờ chiều vào học)' },
  { value: '15:00 - 17:00', label: '15:00 – 17:00 (Tan học ca chiều)' },
  { value: '17:00 - 19:00', label: '17:00 – 19:00 (Cao điểm tan tầm)' },
  { value: '19:00 - 21:00', label: '19:00 – 21:00 (Buổi tối)' },
  { value: 'Khác / Không cố định', label: 'Khác / Diễn ra rải rác' },
];

export default function SubmitReportPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  // Dữ liệu Form
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('traffic_jam');
  const [otherDescription, setOtherDescription] = useState('');

  // Phạm vi phản ánh (Prompt 9.5 Multi-School)
  const [scopeType, setScopeType] = useState<ReportScopeType>('school_specific');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('00000000-0000-0000-0000-000000000001');

  // Vị trí (Mặc định tại ngã ba đường Phạm Văn Thuận trước cổng trường)
  const [coordinates, setCoordinates] = useState({ lat: 10.94190, lng: 106.86185 });
  const [locationName, setLocationName] = useState('Đoạn đường Phạm Văn Thuận ngay trước cổng Trường THPT Tam Hiệp');

  // Thời gian
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [specificTime, setSpecificTime] = useState('');
  const [timeWindow, setTimeWindow] = useState('16:30 - 17:30');

  // Mô tả & Ảnh
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [confirmedTruth, setConfirmedTruth] = useState(false);

  // Trạng thái nộp và kết quả
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitReportResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Xử lý chuyển bước với validation
  const handleNextStep = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      if (selectedIssue === 'other' && !otherDescription.trim()) {
        setSubmitError('Vui lòng nhập tóm tắt ngắn về vấn đề bạn muốn phản ánh.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDate) {
        setSubmitError('Vui lòng chọn ngày xảy ra sự việc.');
        return;
      }
      if (!timeWindow) {
        setSubmitError('Vui lòng chọn khung giờ thường xảy ra.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // Xử lý chọn ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Dung lượng tệp vượt quá giới hạn tối đa 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSubmitError('Chỉ hỗ trợ tệp hình ảnh định dạng JPG, PNG hoặc WEBP.');
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Xử lý gửi Form chính thức
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 10) {
      setSubmitError('Mô tả tình trạng phải có ít nhất 10 ký tự để cán bộ có đủ thông tin xác minh.');
      return;
    }

    if (!confirmedTruth) {
      setSubmitError('Vui lòng tích xác nhận thông tin phản ánh được quan sát thực tế.');
      return;
    }

    const formData = new FormData();
    formData.append('issue_type', selectedIssue);
    formData.append(
      'description',
      selectedIssue === 'other' && otherDescription.trim()
        ? `[${otherDescription.trim()}] ${trimmedDesc}`
        : trimmedDesc
    );
    formData.append('actual_lat', coordinates.lat.toString());
    formData.append('actual_lng', coordinates.lng.toString());
    formData.append('location_name', locationName.trim());

    // Tính toán thời điểm xảy ra ISO
    let occurredAtIso = new Date().toISOString();
    if (selectedDate) {
      const timePart = specificTime ? specificTime : '07:00';
      const combined = new Date(`${selectedDate}T${timePart}:00`);
      if (!isNaN(combined.getTime())) {
        occurredAtIso = combined.toISOString();
      }
    }
    formData.append('occurred_at', occurredAtIso);
    formData.append('time_window', timeWindow);
    formData.append('scope_type', scopeType);
    if (scopeType === 'school_specific' && selectedSchoolId) {
      formData.append('school_id', selectedSchoolId);
    }

    if (selectedFile) {
      formData.append('image_file', selectedFile);
    }

    startTransition(async () => {
      const res = await submitReportAction(formData);
      if (res.success) {
        setSubmitResult(res);
      } else {
        setSubmitError(res.error || 'Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại.');
      }
    });
  };

  const handleCopyCode = () => {
    if (submitResult?.trackingCode) {
      navigator.clipboard.writeText(submitResult.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // =========================================================================
  // MÀN HÌNH THÀNH CÔNG VỚI MÃ TRA CỨU
  // =========================================================================
  if (submitResult?.success) {
    return (
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full space-y-6">
        <Breadcrumb items={[{ label: 'Gửi phản ánh' }, { label: 'Đã ghi nhận' }]} />

        <Card className="border-emerald-200 bg-white overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-emerald-600 text-white p-6 sm:p-8 text-center space-y-2.5">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto text-white shadow-xs">
              <Check className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              PHẢN ÁNH ĐÃ ĐƯỢC GHI NHẬN
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto leading-relaxed">
              Cảm ơn bạn đã đóng góp thông tin. Phản ánh của bạn đã được tiếp nhận và đưa vào hàng đợi xác minh {scopeType === 'school_specific' ? 'của nhà trường' : 'khu vực chung (Toàn TP. Biên Hòa (cũ))'}.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Box Mã tra cứu bảo mật */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                MÃ TRA CỨU BẢO MẬT CỦA BẠN
              </span>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black text-navy-950 tracking-widest bg-white px-5 py-2.5 rounded-xl border border-slate-300 shadow-xs select-all">
                  {submitResult.trackingCode}
                </span>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyCode}
                  leftIcon={copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  {copiedCode ? 'Đã sao chép' : 'Sao chép mã'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                Hãy lưu lại mã này để kiểm tra tiến độ thẩm định của cán bộ nhà trường tại trang <strong>Tra cứu</strong>. Vì lý do bảo mật, mã này sẽ không hiển thị lại sau khi bạn đóng trang.
              </p>
            </div>

            {/* Thông tin tóm tắt */}
            <div className="border border-slate-200/90 rounded-xl divide-y divide-slate-100 text-xs">
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500">Trường học tiếp nhận:</span>
                <span className="font-semibold text-slate-800">{TAM_HIEP_SCHOOL_GEO.name}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500">Loại vấn đề:</span>
                <span className="font-semibold text-slate-800">
                  {submitResult.issueType ? ISSUE_TYPE_LABELS[submitResult.issueType] : 'Giao thông'}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500">Khu vực phản ánh:</span>
                <span className="font-semibold text-slate-800 max-w-[280px] truncate">
                  {submitResult.locationName}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-slate-500">Trạng thái ban đầu:</span>
                <Badge variant="warning">Chờ xác minh (pending)</Badge>
              </div>
            </div>

            {/* Điều hướng */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                href="/tra-cuu"
                className="flex-1 font-bold text-xs"
              >
                Đến trang tra cứu tiến độ
              </Button>
              <Button
                variant="outline"
                href="/"
                className="flex-1 text-xs"
              >
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN BIỂU MẪU 3 BƯỚC
  // =========================================================================
  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Gửi phản ánh an toàn giao thông' }]} />

      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold tracking-wide uppercase">
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>Tiếp nhận phản ánh cộng đồng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
          GỬI PHẢN ÁNH
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          Chia sẻ những vấn đề giao thông bạn quan sát được để cùng xây dựng môi trường đến trường an toàn hơn.
        </p>
      </div>

      {/* Thông báo quyền riêng tư (Theo yêu cầu Mục 3.2) */}
      <Alert variant="success" title="Nguyên tắc bảo vệ quyền riêng tư tuyệt đối">
        <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[11px] text-emerald-900">
          <li><strong>Không bắt buộc:</strong> Bạn không cần cung cấp họ tên, số điện thoại hay email khi gửi phản ánh.</li>
          <li><strong>Bảo mật ảnh:</strong> Ảnh minh chứng được lưu trong phân vùng riêng tư, chỉ cán bộ thẩm định mới có quyền truy cập.</li>
          <li><strong>Quy trình xác minh:</strong> Mọi phản ánh đều cần cán bộ thẩm định trước khi được tổng hợp công khai trên bản đồ.</li>
        </ul>
      </Alert>

      {/* Thanh tiến trình 3 bước (Stepper) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 ease-emil-out -z-0"
            style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
          />

          {[
            { step: 1, title: 'Loại vấn đề' },
            { step: 2, title: 'Vị trí & Thời gian' },
            { step: 3, title: 'Mô tả & Minh chứng' },
          ].map(({ step, title }) => (
            <div key={step} className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${currentStep === step
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                  : currentStep > step
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
              >
                {currentStep > step ? <Check className="w-4 h-4" /> : step}
              </div>
              <span
                className={`text-[11px] font-semibold text-center hidden sm:inline ${currentStep >= step ? 'text-navy-950' : 'text-slate-400'
                  }`}
              >
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {submitError && (
        <Alert variant="danger" title="Lưu ý">
          <p className="text-xs text-rose-800">{submitError}</p>
        </Alert>
      )}

      {/* =========================================================================
          NỘI DUNG TỪNG BƯỚC
         ========================================================================= */}
      <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          {/* BƯỚC 1: CHỌN LOẠI VẤN ĐỀ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950">
                  Bạn muốn phản ánh vấn đề gì?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chọn 1 loại vấn đề chính mà bạn quan sát thấy quanh khu vực cổng trường học.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(ISSUE_CONFIG) as IssueType[]).map((type) => {
                  const item = ISSUE_CONFIG[type];
                  const isSelected = selectedIssue === type;

                  return (
                    <div
                      key={type}
                      onClick={() => {
                        setSelectedIssue(type);
                        setSubmitError(null);
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-micro ease-emil-out relative flex flex-col justify-between ${isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs shrink-0">
                          {item.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-navy-950">
                            {item.label}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 text-blue-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Nếu chọn "Vấn đề khác", hiển thị trường tóm tắt */}
              {selectedIssue === 'other' && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <FormInput
                    label="Tóm tắt ngắn gọn về vấn đề khác:"
                    placeholder="VD: Cây gãy đổ chắn đường, mặt đường sụt lún..."
                    value={otherDescription}
                    onChange={(e) => setOtherDescription(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* BƯỚC 2: CHỌN VỊ TRÍ VÀ THỜI GIAN */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Phần 0: Phạm vi phản ánh (Prompt 9.5 Multi-School) */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy-950 uppercase tracking-wider flex items-center gap-1.5">
                    <School className="w-4 h-4 text-blue-600" />
                    Phạm vi & Đối tượng liên quan
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Toàn TP. Biên Hòa (cũ)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setScopeType('school_specific')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-micro text-left space-y-1 ${scopeType === 'school_specific'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-950">
                      <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Trường học cụ thể</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Gắn liền với cơ sở giáo dục trên địa bàn
                    </p>
                  </div>

                  <div
                    onClick={() => setScopeType('public_corridor')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-micro text-left space-y-1 ${scopeType === 'public_corridor'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-950">
                      <Route className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Hành lang / Tuyến đường</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Đoạn đường, ngã tư hoặc lối đi chung
                    </p>
                  </div>

                  <div
                    onClick={() => setScopeType('unknown_school')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-micro text-left space-y-1 ${scopeType === 'unknown_school'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-navy-950">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Chưa rõ trường</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Khu vực học sinh nhưng chưa rõ trường
                    </p>
                  </div>
                </div>

                {scopeType === 'school_specific' && (
                  <div className="pt-2 text-xs">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Cơ sở giáo dục ghi nhận:
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-navy-950 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedSchoolId}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                    >
                      <option value="00000000-0000-0000-0000-000000000001">
                        Trường THPT Tam Hiệp (Điểm thí điểm trọng tâm)
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Phần A: Bản đồ chọn vị trí */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold text-navy-950 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Vị trí xảy ra vấn đề
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Phạm vi: TP. Biên Hòa (cũ) (Trọng tâm THPT Tam Hiệp)
                  </span>
                </div>

                <LocationPickerMap
                  lat={coordinates.lat}
                  lng={coordinates.lng}
                  onChange={(newLat, newLng) => {
                    setCoordinates({ lat: newLat, lng: newLng });
                    setSubmitError(null);
                  }}
                />

                {/* Tọa độ và mô tả địa điểm */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-medium">Tọa độ đã chọn:</span>
                    <span className="font-mono font-bold text-navy-950">
                      {coordinates.lat.toFixed(5)}°N, {coordinates.lng.toFixed(5)}°E
                    </span>
                  </div>
                  <div className="flex-1 max-w-sm">
                    <input
                      type="text"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ghi chú vị trí (VD: Trước cổng chính, lối rẽ trạm xe buýt...)"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Phần B: Thời điểm và Khung giờ */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-sm sm:text-base font-bold text-navy-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Thời điểm & Khung giờ xảy ra
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ngày xảy ra */}
                  <FormInput
                    label="Ngày quan sát thấy sự việc:"
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />

                  {/* Giờ cụ thể nếu biết */}
                  <FormInput
                    label="Giờ cụ thể (nếu biết chính xác):"
                    type="time"
                    value={specificTime}
                    placeholder="Không bắt buộc"
                    onChange={(e) => setSpecificTime(e.target.value)}
                  />
                </div>

                {/* Khung giờ thường xảy ra */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Khung giờ vấn đề này thường xuyên xuất hiện nhất:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {TIME_WINDOW_OPTIONS.map((slot) => {
                      const isChosen = timeWindow === slot.value;
                      return (
                        <div
                          key={slot.value}
                          onClick={() => setTimeWindow(slot.value)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors text-center ${isChosen
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                        >
                          {slot.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BƯỚC 3: MÔ TẢ VÀ ẢNH MINH CHỨNG */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950">
                  Hãy mô tả tình trạng bạn quan sát được
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mô tả chi tiết giúp cán bộ nhà trường dễ dàng xác minh hiện trường và xây dựng giải pháp phân luồng an toàn.
                </p>
              </div>

              {/* Textarea mô tả */}
              <div className="space-y-1">
                <Textarea
                  label="Nội dung mô tả (ít nhất 10 ký tự):"
                  rows={4}
                  placeholder="Ví dụ: Vào giờ tan học 16:45, nhiều xe phụ huynh dừng đỗ lấn chiếm làn đường xe buýt trước cổng trường, gây ùn tắc kéo dài hướng về phía ngã ba..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setSubmitError(null);
                  }}
                  required
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Không nhập thông tin đời tư cá nhân của người khác.</span>
                  <span className={description.trim().length < 10 ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                    {description.trim().length} / 1000 ký tự
                  </span>
                </div>
              </div>

              {/* Tải ảnh minh chứng tùy chọn */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Ảnh minh chứng hiện trường (Tùy chọn):
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Tối đa 5MB (JPG, PNG, WEBP)</span>
                </div>

                {!filePreview ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/60 hover:bg-slate-50">
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">
                      Bấm để chọn ảnh từ thiết bị
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Hình ảnh chụp không gian ùn tắc, biển báo hoặc tình trạng giao thông
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Ảnh minh chứng xem trước"
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    <div className="flex-1 space-y-1 text-xs">
                      <span className="font-bold text-navy-950 block truncate max-w-xs">
                        {selectedFile?.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Dung lượng: {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        <Lock className="w-3 h-3" /> Đã sẵn sàng nạp vào kho bảo mật
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors mr-2"
                      title="Xóa ảnh đã chọn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Cam kết thông tin trung thực */}
              <div className="pt-3 border-t border-slate-100">
                <Checkbox
                  label="Tôi xác nhận thông tin phản ánh này được quan sát thực tế và phục vụ mục đích xây dựng cổng trường an toàn, không mang tính bôi nhọ hay gây rối."
                  checked={confirmedTruth}
                  onChange={(e) => {
                    setConfirmedTruth(e.target.checked);
                    setSubmitError(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              THANH NÚT ĐIỀU HƯỚNG BƯỚC
             ========================================================================= */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrevStep}
                disabled={isPending}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-xs"
              >
                Quay lại
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNextStep}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-xs font-bold px-6"
              >
                Tiếp tục
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isPending || !confirmedTruth || description.trim().length < 10}
                leftIcon={isPending ? undefined : <Send className="w-4 h-4" />}
                className="text-xs font-bold px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? 'Đang gửi phản ánh...' : 'Gửi phản ánh ngay'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Thông tin chân trang quy trình thẩm định (Theo yêu cầu Mục 3.2) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-navy-950 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          Quy trình sau khi gửi phản ánh:
        </div>
        <p className="text-[11px] leading-relaxed">
          1. Sau khi gửi, bạn sẽ nhận được một <strong>Mã tra cứu bảo mật</strong> duy nhất để theo dõi tiến độ.<br />
          2. Cán bộ nhà trường (Người xác minh) sẽ tiến hành thẩm định thông tin và khảo sát thực địa hiện trường.<br />
          3. Chỉ khi điểm nguy cơ được Ban Giám Hiệu ký duyệt công khai theo đúng 5 điều kiện an toàn, điểm mới xuất hiện trên bản đồ số công cộng.
        </p>
      </div>
    </div>
  );
}
