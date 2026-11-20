import React from 'react';
import Link from 'next/link';
import {
  Shield,
  MapPin,
  Map,
  ArrowRight,
  Compass,
  AlertTriangle,
  School,
  CheckCircle2,
  Lock,
  Layers,
  Inbox,
  Clock,
  Users,
  Building2,
  HeartHandshake,
  FileSearch,
  EyeOff,
  Sparkles,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { SectionHeading } from '@/components/common/SectionHeading';
import { ScrollReveal } from '@/components/common/ScrollReveal';
import { AnimatedStudentHero } from '@/components/hero/AnimatedStudentHero';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';

export default function HomePage() {
  return (
    <div className="pb-20">
      {/* =========================================================================
          SECTION 1: HERO SECTION (Split Layout with Emil Kowalski Staggered Entrance)
         ========================================================================= */}
      <section className="relative overflow-hidden bg-navy-950 text-white pt-16 sm:pt-20 lg:pt-24 xl:pt-28 pb-28 sm:pb-34 lg:pb-38 xl:pb-44 px-4 sm:px-6 lg:px-8">
        {/* Subtle structural grid background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-center">
            {/* Cột trái (6 cols): Thông điệp & CTAs với Staggered Sequence */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-7 text-center lg:text-left z-10">
              {/* Badge Định vị (Stagger 1: 0ms) */}
              <div className="animate-hero-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-300 text-xs font-semibold tracking-wide hover:border-blue-400/50 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nền tảng Thí điểm An toàn Giao thông Cổng trường</span>
              </div>

              {/* Tiêu đề chính (Stagger 2: 120ms) */}
              <h1 className="animate-hero-2 text-3xl sm:text-4xl lg:text-5xl xl:text-[54px] font-extrabold tracking-tight leading-[1.14] text-white">
                CỔNG TRƯỜNG AN TOÀN <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
                  Bắt đầu từ những dữ liệu nhỏ
                </span>
              </h1>

              {/* Giới thiệu nền tảng (Stagger 3: 240ms) */}
              <p className="animate-hero-3 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                Nền tảng tiếp nhận và tổng hợp phản ánh về những vấn đề giao thông quanh trường học, góp phần xây dựng môi trường đến trường an toàn hơn.
              </p>

              {/* Khung hành động chính CTAs (Stagger 4: 360ms) */}
              <div className="animate-hero-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  href="/ban-do"
                  variant="primary"
                  size="lg"
                  leftIcon={<Map className="w-5 h-5 text-blue-200" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto font-bold shadow-lg shadow-blue-600/30 text-sm sm:text-base"
                >
                  Khám phá bản đồ
                </Button>

                <Button
                  href="/gui-phan-anh"
                  variant="secondary"
                  size="lg"
                  leftIcon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                  className="w-full sm:w-auto font-bold bg-white text-navy-950 hover:bg-slate-100 border-white/20 text-sm sm:text-base"
                >
                  Gửi phản ánh
                </Button>
              </div>

              {/* Thông tin trường thí điểm trọng tâm */}
              <div className="animate-hero-4 pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 transition-all duration-micro hover:border-slate-700 hover:scale-[1.02]">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Trường trọng tâm thí điểm: <strong className="text-white">THPT Tam Hiệp</strong></span>
                </div>
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 transition-all duration-micro hover:border-slate-700 hover:scale-[1.02]">
                  <School className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Phạm vi nghiên cứu: <strong className="text-white">TP. Biên Hòa (cũ)</strong></span>
                </div>
              </div>
            </div>

            {/* Cột phải (6 cols): Hoạt cảnh 2D minh họa Học sinh tham gia giao thông an toàn */}
            <div className="animate-hero-visual lg:col-span-6 xl:col-span-6 relative w-full flex items-center justify-center lg:justify-end min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] xl:min-h-[620px]">
              <AnimatedStudentHero />
            </div>
          </div>
        </div>

      </section>

      {/* =========================================================================
          SECTION 2: TRUST & PRIVACY INVARIANTS (Floating 3D Block Cards)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 lg:-mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {/* Trục 1: Quyền riêng tư */}
          <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-xs transition-transform duration-micro group-hover:scale-110 border border-blue-100">
              <EyeOff className="w-6 h-6 text-blue-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-blue-600 transition-colors">
                Không bắt buộc tên / SĐT
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Người dân hoàn toàn có thể gửi phản ánh ẩn danh. Không có bất kỳ rào cản tài khoản nào đối với cộng đồng khi chia sẻ thông tin an toàn.
              </p>
            </div>
            <div className="h-1 w-10 rounded-full bg-blue-500/80 transition-all duration-ui group-hover:w-full" />
          </div>

          {/* Trục 2: Bảo mật hình ảnh */}
          <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs transition-transform duration-micro group-hover:scale-110 border border-emerald-100">
              <Lock className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-emerald-600 transition-colors">
                Ảnh gốc lưu trữ riêng tư
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hình ảnh gốc được bảo vệ nghiêm ngặt trong phân vùng riêng tư. Hệ thống làm mờ nhận diện và loại bỏ hoàn toàn siêu dữ liệu EXIF trước khi xử lý.
              </p>
            </div>
            <div className="h-1 w-10 rounded-full bg-emerald-500/80 transition-all duration-ui group-hover:w-full" />
          </div>

          {/* Trục 3: Thẩm định trách nhiệm */}
          <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 group relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shadow-xs transition-transform duration-micro group-hover:scale-110 border border-purple-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-purple-600 transition-colors">
                Xác minh bởi nhà trường
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Mọi phản ánh đều được Ban Giám hiệu và Ban ATGT nhà trường thẩm định thủ công, ngăn chặn báo cáo sai lệch gây hoang mang.
              </p>
            </div>
            <div className="h-1 w-10 rounded-full bg-purple-500/80 transition-all duration-ui group-hover:w-full" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TRƯỜNG THÍ ĐIỂM TRỌNG TÂM (Trường THPT Tam Hiệp)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <ScrollReveal>
          <div className="block-elevated-dark text-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-700/80 shadow-2xl relative overflow-hidden ring-1 ring-blue-500/20 card-sheen">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                  <School className="w-3.5 h-3.5 text-blue-400" />
                  <span>ĐỊA ĐIỂM THÍ ĐIỂM GIAI ĐOẠN ĐẦU</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                  Trường THPT Tam Hiệp, TP. Biên Hòa (cũ)
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tọa lạc trên trục giao thông huyết mạch đường Phạm Văn Thuận với lưu lượng phương tiện đông đúc, Trường THPT Tam Hiệp được lựa chọn làm địa bàn trọng tâm khảo sát để hoàn thiện mô hình công nghệ trước khi mở rộng.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="block-inset-dark p-4 rounded-xl border border-slate-700/80 space-y-1.5 transition-all hover:border-slate-500 hover:scale-[1.01]">
                    <span className="text-[11px] text-slate-400 block font-semibold">Khung giờ cao điểm sáng</span>
                    <span className="font-bold text-white text-sm">06:45 – 07:15</span>
                    <span className="text-[11px] text-slate-400 block">Thời điểm phụ huynh dừng đỗ đưa học sinh vào cổng</span>
                  </div>

                  <div className="block-inset-dark p-4 rounded-xl border border-slate-700/80 space-y-1.5 transition-all hover:border-slate-500 hover:scale-[1.01]">
                    <span className="text-[11px] text-slate-400 block font-semibold">Khung giờ cao điểm chiều</span>
                    <span className="font-bold text-white text-sm">16:45 – 17:30</span>
                    <span className="text-[11px] text-slate-400 block">Giao cắt giữa giờ tan trường và lưu lượng xe lưu thông</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3">
                <div className="block-inset-dark p-5 rounded-2xl border border-slate-700/80 space-y-3.5 shadow-md">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    Thông số địa lý & Phạm vi
                  </span>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span><strong>Địa chỉ:</strong> Đ. Phạm Văn Thuận, KP. 4, P. Tam Hiệp, Đồng Nai</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Tọa độ tâm trường:</strong> 10.9414°B, 106.8614°Đ</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span><strong>Bán kính khảo sát:</strong> 300m – 500m xung quanh cổng trường</span>
                    </li>
                  </ul>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Xem vị trí trên bản đồ</span>
                    <Button
                      href="/ban-do"
                      variant="outline"
                      size="sm"
                      leftIcon={<Map className="w-3.5 h-3.5 text-blue-400" />}
                      className="text-xs text-white border-slate-600 bg-slate-800/80 hover:bg-slate-700 transition-all active:scale-[0.96]"
                    >
                      Mở bản đồ số
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================================
          SECTION 4: SỐ LIỆU TỔNG QUAN & NGUYÊN TẮC TRUNG THỰC DỮ LIỆU
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeading
            badge={<Badge variant="primary">Số liệu giám sát</Badge>}
            title="Dữ liệu an toàn giao thông học đường"
            subtitle="Số liệu được tổng hợp trực tiếp từ cơ sở dữ liệu đã qua xác minh. Dữ liệu DEMO được tách riêng và không trộn vào thống kê thực."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
            {/* Card 1: Tổng số phản ánh */}
            <div className="block-elevated rounded-2xl p-6 text-center space-y-2.5 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto transition-transform duration-micro group-hover:scale-110 border border-blue-100 shadow-xs">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                Tổng số phản ánh
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                Chưa có
              </div>
              <span className="text-[11px] text-slate-400 block">
                Dữ liệu từ người dân gửi
              </span>
            </div>

            {/* Card 2: Điểm cần chú ý đã công khai */}
            <div className="block-elevated rounded-2xl p-6 text-center space-y-2.5 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto transition-transform duration-micro group-hover:scale-110 border border-amber-100 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                Điểm cần chú ý (Hotspots)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                Chưa có
              </div>
              <span className="text-[11px] text-slate-400 block">
                Đủ 5 điều kiện phê duyệt
              </span>
            </div>

            {/* Card 3: Điểm đã xử lý */}
            <div className="block-elevated rounded-2xl p-6 text-center space-y-2.5 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto transition-transform duration-micro group-hover:scale-110 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                Điểm đã xử lý
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                Chưa có
              </div>
              <span className="text-[11px] text-slate-400 block">
                Sau can thiệp phân luồng
              </span>
            </div>

            {/* Card 4: Khu vực đang theo dõi */}
            <div className="block-elevated rounded-2xl p-6 text-center space-y-2.5 relative group overflow-hidden">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto transition-transform duration-micro group-hover:scale-110 border border-purple-100 shadow-xs">
                <School className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                Khu vực đang theo dõi
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                1 trường
              </div>
              <span className="text-[11px] text-blue-600 font-semibold block">
                THPT Tam Hiệp (Đồng Nai)
              </span>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-500 bg-slate-100 py-1.5 px-4 rounded-full inline-block border border-slate-200">
              * Nguyên tắc trung thực dữ liệu: Website không dùng số liệu giả mạo để lấp đầy giao diện khi hệ thống chưa tiếp nhận phản ánh thực tế.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================================
          SECTION 5: QUY TRÌNH TIẾP NHẬN & XỬ LÝ 5 BƯỚC (Numbered Stagger Cards)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeading
            badge={<Badge variant="navy">Quy trình vận hành</Badge>}
            title="Năm bước tiếp nhận và xử lý minh bạch"
            subtitle="Mọi thông tin phản ánh đều tuân thủ quy trình kiểm soát chất lượng nhiều tầng trước khi được phép xuất hiện trên bản đồ công khai."
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-12">
            {/* Bước 1 */}
            <div className="block-elevated rounded-2xl p-5 space-y-3.5 group relative">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold flex items-center justify-center text-xs transition-transform duration-micro group-hover:scale-110 shadow-xs ring-2 ring-blue-500/20">
                  1
                </span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Cộng đồng</span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 group-hover:text-blue-600 transition-colors">
                Gửi phản ánh
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Học sinh, phụ huynh và người dân gửi ghi nhận về ùn tắc, dừng đỗ sai hoặc điểm khuất tầm nhìn quanh cổng trường.
              </p>
            </div>

            {/* Bước 2 */}
            <div className="block-elevated rounded-2xl p-5 space-y-3.5 group relative">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs transition-transform duration-micro group-hover:scale-110 shadow-xs ring-2 ring-slate-600/20">
                  2
                </span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hệ thống</span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 group-hover:text-slate-800 transition-colors">
                Tiếp nhận thông tin
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống lưu trữ trong vùng riêng tư, mã hóa mã tra cứu bảo mật và gắn trạng thái &ldquo;Chờ xác minh&rdquo;.
              </p>
            </div>

            {/* Bước 3 */}
            <div className="block-elevated rounded-2xl p-5 space-y-3.5 group relative">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold flex items-center justify-center text-xs transition-transform duration-micro group-hover:scale-110 shadow-xs ring-2 ring-amber-500/20">
                  3
                </span>
                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Người xác minh</span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 group-hover:text-amber-600 transition-colors">
                Xác minh phản ánh
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cán bộ nhà trường đối chiếu thông tin, kiểm tra hiện trường thực địa. Từ chối bắt buộc phải ghi rõ lý do.
              </p>
            </div>

            {/* Bước 4 */}
            <div className="block-elevated rounded-2xl p-5 space-y-3.5 group relative">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold flex items-center justify-center text-xs transition-transform duration-micro group-hover:scale-110 shadow-xs ring-2 ring-purple-500/20">
                  4
                </span>
                <span className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Tổng hợp</span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 group-hover:text-purple-600 transition-colors">
                Tổng hợp Hotspot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gom các phản ánh tương tự vào điểm cần chú ý (Hotspot), đánh giá mức độ nguy cơ thủ công (không dùng AI tự động).
              </p>
            </div>

            {/* Bước 5 */}
            <div className="block-elevated rounded-2xl p-5 space-y-3.5 group relative">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-bold flex items-center justify-center text-xs transition-transform duration-micro group-hover:scale-110 shadow-xs ring-2 ring-emerald-500/20">
                  5
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Ban Giám Hiệu</span>
              </div>
              <h3 className="text-sm font-bold text-navy-950 group-hover:text-emerald-600 transition-colors">
                Công khai & Xử lý
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Người phê duyệt duyệt đủ 5 điều kiện để công khai lên bản đồ; phối hợp lực lượng can thiệp và cập nhật tiến độ.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================================
          SECTION 6: GIÁ TRỊ VÀ LỢI ÍCH 3 NHÓM ĐỐI TƯỢNG (Diverse Cards)
         ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="bg-slate-100/90 rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200">
            <SectionHeading
              badge={<Badge variant="primary">Giá trị xã hội</Badge>}
              title="Lợi ích thiết thực cho các bên liên quan"
              subtitle="Dự án hướng đến việc giải quyết những bất cập giao thông bằng dữ liệu tin cậy và giải pháp thực tế."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {/* Nhóm 1: Học sinh & Phụ huynh */}
              <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 bg-white relative group overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform duration-micro group-hover:scale-110 border border-blue-100 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-blue-600 transition-colors">
                  Đối với Học sinh & Phụ huynh
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Chủ động nhận biết các điểm giao thông tiềm ẩn rủi ro quanh cổng trường để phòng tránh.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Có kênh thuận tiện gửi phản ánh ẩn danh, không lo bị lộ danh tính hay số điện thoại.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Dễ dàng tra cứu tiến độ xử lý của nhà trường thông qua mã bảo mật được cấp.</span>
                  </li>
                </ul>
                <div className="h-1 w-10 rounded-full bg-blue-500/80 transition-all duration-ui group-hover:w-full" />
              </div>

              {/* Nhóm 2: Nhà trường */}
              <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 bg-white relative group overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform duration-micro group-hover:scale-110 border border-emerald-100 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-emerald-600 transition-colors">
                  Đối với Nhà trường
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Có dữ liệu tập trung, khoa học thay vì thông tin phản ánh rời rạc, cảm tính.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Chủ động điều phối đoàn viên, cờ đỏ hỗ trợ phân luồng đúng khung giờ cao điểm.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Có căn cứ dữ liệu rõ ràng để kiến nghị cơ quan quản lý đô thị sơn vạch kẻ hoặc cắm biển cảnh báo.</span>
                  </li>
                </ul>
                <div className="h-1 w-10 rounded-full bg-emerald-500/80 transition-all duration-ui group-hover:w-full" />
              </div>

              {/* Nhóm 3: Cộng đồng */}
              <div className="block-elevated rounded-2xl p-6 sm:p-7 space-y-4 bg-white relative group overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform duration-micro group-hover:scale-110 border border-amber-100 shadow-xs">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-navy-950 group-hover:text-amber-600 transition-colors">
                  Đối với Cộng đồng & Đô thị
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Giảm thiểu tình trạng ùn tắc cục bộ trên các tuyến đường trục như đường Phạm Văn Thuận.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Hình thành văn hóa dừng đón con trật tự, văn minh của cộng đồng phụ huynh.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Thúc đẩy mô hình công nghệ phục vụ đời sống dân sinh (Civic Tech) đáng tin cậy.</span>
                  </li>
                </ul>
                <div className="h-1 w-10 rounded-full bg-amber-500/80 transition-all duration-ui group-hover:w-full" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* =========================================================================
          SECTION 7: KÊU GỌI HÀNH ĐỘNG CUỐI TRANG (Closing CTA Scroll Reveal)
         ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative rounded-3xl bg-gradient-to-b from-navy-900 to-navy-950 p-8 sm:p-12 lg:p-14 text-center text-white space-y-6 shadow-2xl shadow-blue-950/50 overflow-hidden border border-slate-700/80 ring-1 ring-blue-500/20 card-sheen">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                <span>Cùng chung tay vì học sinh</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug sm:leading-tight text-white">
                Mỗi phản ánh có thể góp phần tạo nên một hành trình đến trường an toàn hơn.
              </h2>

              <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                Bạn quan sát thấy điểm nghẽn giao thông hoặc hành vi dừng đỗ không an toàn tại khu vực cổng trường? Hãy gửi phản ánh để chung tay cùng nhà trường bảo vệ học sinh.
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
                  Xem bản đồ tương tác
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
