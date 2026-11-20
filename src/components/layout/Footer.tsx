import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  MapPin,
  Map,
  Mail,
  AlertCircle,
  FileText,
  Info,
  Lock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900 mt-auto">
      {/* Top Banner: Pilot Assurance */}
      <div className="border-b border-navy-900 bg-navy-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Dự án thí điểm an toàn học đường</span>
            <span className="text-slate-600 hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">Phạm vi địa bàn thành phố Biên Hòa (cũ)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Thẩm định thủ công bởi Nhà trường
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Tôn trọng dữ liệu cá nhân
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          {/* Cột 1 & 2: Nhận diện & Trọng tâm thí điểm */}
          <div className="space-y-5 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 border border-slate-700 flex items-center justify-center shadow-sm group-hover:border-blue-400 transition-colors">
                <Image
                  src="/logo.png"
                  alt="SAFE SCHOOL MAP Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-tight text-base sm:text-lg block group-hover:text-blue-400 transition-colors">
                  SAFE SCHOOL MAP
                </span>
                <span className="text-[11px] text-slate-400 block tracking-wider uppercase font-semibold">
                  Cổng trường an toàn
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Nền tảng công nghệ số vì an toàn giao thông học đường, kết nối quan sát thực tế của học sinh, phụ huynh với trách nhiệm thẩm định và hành động can thiệp của nhà trường.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-2 max-w-sm shadow-xs">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <MapPin className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Trường THPT Tam Hiệp (Điểm thí điểm trọng tâm)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Đường Phạm Văn Thuận, Khu phố 4, Phường Tam Hiệp, Thành phố Biên Hòa (cũ), Tỉnh Đồng Nai.
              </p>
              <div className="pt-1 text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Tọa độ: 10.9414°B, 106.8614°Đ</span>
                <span>&bull;</span>
                <span>OSM ID: 7154127</span>
              </div>
            </div>
          </div>

          {/* Cột 3: Tính năng nền tảng */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Tính năng nền tảng
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/ban-do" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bản đồ số Biên Hòa (cũ)</span>
                </Link>
              </li>
              <li>
                <Link href="/gui-phan-anh" className="text-slate-400 hover:text-white transition-colors">
                  Gửi phản ánh an toàn
                </Link>
              </li>
              <li>
                <Link href="/tra-cuu" className="text-slate-400 hover:text-white transition-colors">
                  Tra cứu tiến độ xử lý
                </Link>
              </li>
              <li>
                <Link href="/thong-ke" className="text-slate-400 hover:text-white transition-colors">
                  Thống kê & Báo cáo an toàn
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu" className="text-slate-400 hover:text-white transition-colors">
                  Giới thiệu mô hình dự án
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Pháp lý & Quyền riêng tư */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Pháp lý & Minh bạch
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/quyen-rieng-tu" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chính sách quyền riêng tư</span>
                </Link>
              </li>
              <li>
                <Link href="/dieu-khoan" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Điều khoản dịch vụ thí điểm</span>
                </Link>
              </li>
              <li>
                <Link href="/quyen-rieng-tu#khieu-nai" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kênh khiếu nại & đính chính</span>
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu#quy-trinh" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quy trình thẩm định 5 bước</span>
                </Link>
              </li>
              <li>
                <Link href="/dang-nhap" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khu vực Cán bộ trường</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 5: Tiếp nhận khiếu nại & Liên hệ */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Khiếu nại & Hỗ trợ
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mọi thắc mắc về dữ liệu, yêu cầu ẩn/xóa phản ánh hoặc đóng góp giải pháp an toàn học đường:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span className="font-mono text-[11px] text-blue-300 break-all select-all">
                  hotro.safeschoolmap@gmail.com
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300 block mb-0.5">Khuyến cáo độc lập:</span>
                Dự án mang tính chất thí điểm công nghệ hỗ trợ nhà trường, không thay thế cơ quan quản lý nhà nước hay cảnh sát giao thông.
              </div>
            </div>
          </div>
        </div>

        {/* Chân trang phân định bản quyền */}
        <div className="pt-8 border-t border-navy-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} SAFE SCHOOL MAP – Sáng kiến vì an toàn giao thông trường học.</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-[11px] text-slate-400">Bản phát hành thí điểm M1 &bull; UI v4.1</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Dữ liệu bản đồ &copy; OpenStreetMap contributors</span>
            <span>&bull;</span>
            <span className="text-blue-400 font-semibold">TP. Biên Hòa (cũ), Đồng Nai</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
