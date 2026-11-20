import React from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { SectionHeading } from '@/components/common/SectionHeading';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';
import {
  Shield,
  Target,
  Users,
  Map,
  ArrowRight,
  School,
  Lock,
  Layers,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-12">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Giới thiệu dự án' }]} />

      {/* Header */}
      <div className="space-y-3 border-b border-slate-200 pb-6 text-center max-w-3xl mx-auto">
        <Badge variant="primary">Sáng kiến Công nghệ Dân sinh (Civic Tech)</Badge>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight">
          Về dự án SAFE SCHOOL MAP
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Nền tảng kết nối cộng đồng học đường và nhà trường nhằm xây dựng không gian giao thông an toàn xung quanh cổng trường học.
        </p>
      </div>

      {/* 1. Tổng quan & Tôn chỉ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-navy-950">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">1. Tổng quan & Định vị dự án</h2>
        </div>
        <Card className="block-elevated border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-ui">
          <CardContent className="p-6 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Xung quanh cổng trường học tại các đô thị thường xuyên đối mặt với các vấn đề giao thông phức tạp: ùn tắc vào giờ cao điểm đón trả học sinh, phụ huynh dừng đỗ xe lấn chiếm lòng lề đường, thiếu vạch sang đường an toàn và các điểm khuất tầm nhìn nguy hiểm.
            </p>
            <p>
              <strong>SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN</strong> ra đời như một hệ thống tiếp nhận, xác minh và tổng hợp phản ánh của cộng đồng về các vấn đề giao thông quanh trường học, hiển thị trực quan lên bản đồ số để hỗ trợ nhà trường nhận diện khu vực cần can thiệp và phối hợp giải quyết.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-navy-950 block">Định vị quan trọng:</strong>
              <p>
                Đây không phải là hệ thống giám sát giao thông thời gian thực bằng camera hay cảm biến tự động, mà là hệ thống ghi nhận và thẩm định có trách nhiệm dựa trên sự tham gia của con người. Dự án mang tính thí điểm hỗ trợ nhà trường, không thay thế chức năng xử phạt của cơ quan chức năng.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. Phạm vi thí điểm: Trường THPT Tam Hiệp */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-navy-950">
          <School className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold tracking-tight">2. Phạm vi thí điểm ban đầu</h2>
        </div>
        <Card className="block-elevated border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-ui">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                  Địa điểm trọng tâm thí điểm
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-navy-950">
                  {TAM_HIEP_SCHOOL_GEO.name}
                </h3>
                <p className="text-xs text-slate-600">
                  {TAM_HIEP_SCHOOL_GEO.address}
                </p>
              </div>
              <Button
                href="/ban-do"
                variant="outline"
                size="sm"
                leftIcon={<Map className="w-4 h-4 text-blue-600" />}
              >
                Xem vị trí trên bản đồ
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              Trường THPT Tam Hiệp nằm trên trục đường chính Phạm Văn Thuận tại TP. Biên Hòa (cũ) – một tuyến giao thông huyết mạch có lưu lượng xe đông đúc. Kiến trúc hệ thống được thiết kế theo mô hình mở rộng, cho phép dễ dàng tích hợp thêm các trường học khác trong địa bàn TP. Biên Hòa (cũ) và tỉnh Đồng Nai trong tương lai.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 3. Năm nguyên tắc cốt lõi */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-navy-950">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-bold tracking-tight">3. Nguyên tắc vận hành bất biến</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 hover:shadow-md transition-all duration-ui">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              1. Phản ánh không phải là kết luận
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Một phản ánh của người dân không đồng nghĩa với một kết luận về mức độ nguy hiểm. Không tự động đánh dấu nguy hiểm chỉ vì có người gửi thông tin.
            </p>
          </Card>

          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 hover:shadow-md transition-all duration-ui">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              2. Trung thực dữ liệu & Tách DEMO
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu thử nghiệm DEMO luôn có cờ nhận diện riêng và bị loại khỏi thống kê thực tế. Khi chưa có dữ liệu thật, hệ thống hiển thị rõ ràng trạng thái &ldquo;Chưa có dữ liệu&rdquo;.
            </p>
          </Card>

          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 hover:shadow-md transition-all duration-ui">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              3. Quyền riêng tư theo mặc định
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thu thập tối thiểu, không bắt buộc họ tên hay số điện thoại. Ảnh gốc lưu trữ an toàn trong kho riêng tư và làm mờ nhận diện trước khi công khai.
            </p>
          </Card>

          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 hover:shadow-md transition-all duration-ui">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              4. Con người quyết định (AI chỉ hỗ trợ)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mức độ nguy cơ do cán bộ nhà trường đánh giá thủ công dựa trên hiện trường. AI và hệ thống không tự ý phân loại nguy hiểm hay tự động phê duyệt.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. Đối tượng hướng đến */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-navy-950">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold tracking-tight">4. Đối tượng hướng đến</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 text-center hover:shadow-md transition-all duration-ui">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <strong className="text-sm text-navy-950 block">Học sinh & Phụ huynh</strong>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đối tượng được bảo vệ trực tiếp và là nguồn cung cấp thông tin thực tế từ trải nghiệm hàng ngày đến trường.
            </p>
          </Card>

          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 text-center hover:shadow-md transition-all duration-ui">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <School className="w-5 h-5" />
            </div>
            <strong className="text-sm text-navy-950 block">Ban Giám Hiệu & Thầy Cô</strong>
            <p className="text-xs text-slate-500 leading-relaxed">
              Chủ thể xác minh, đánh giá và điều phối giải pháp phân luồng, đồng thời kiến nghị cơ quan chức năng hỗ trợ.
            </p>
          </Card>

          <Card className="p-5 space-y-2 block-elevated border-slate-200/90 text-center hover:shadow-md transition-all duration-ui">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <strong className="text-sm text-navy-950 block">Cộng đồng Đô thị</strong>
            <p className="text-xs text-slate-500 leading-relaxed">
              Các hộ dân xung quanh và người tham gia giao thông cùng chung tay xây dựng hành vi đi lại văn minh, trật tự.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Box (3D Elevated Dark Block with Sheen & Ambient Glow) */}
      <div className="relative rounded-3xl bg-gradient-to-b from-navy-900 to-navy-950 p-8 sm:p-12 lg:p-14 text-center text-white overflow-hidden border border-slate-700/80 ring-1 ring-blue-500/20 shadow-2xl shadow-blue-950/50 card-sheen">
        {/* Ambient decorative lights */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Hành động vì an toàn học đường</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight">
            Chung tay xây dựng cổng trường an toàn
          </h3>

          <p className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Mỗi đóng góp quan sát thực tế của bạn đều có giá trị giúp bảo vệ học sinh trên con đường tới trường mỗi ngày.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 sm:pt-6">
            <Button
              href="/gui-phan-anh"
              variant="primary"
              size="lg"
              leftIcon={<AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />}
              className="w-full sm:w-auto min-w-[210px] px-8 py-4 font-bold shadow-xl shadow-blue-600/35 text-sm sm:text-base rounded-xl border border-blue-400/40 bg-blue-600 hover:bg-blue-500"
            >
              Gửi phản ánh ngay
            </Button>
            <Button
              href="/ban-do"
              variant="glass"
              size="lg"
              leftIcon={<Map className="w-5 h-5 text-blue-300 shrink-0" />}
              className="w-full sm:w-auto min-w-[210px] px-8 py-4 font-bold text-sm sm:text-base rounded-xl border border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/15 backdrop-blur-sm shadow-md"
            >
              Xem bản đồ số
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
