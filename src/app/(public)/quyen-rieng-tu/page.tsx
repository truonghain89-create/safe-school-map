import React from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  AlertCircle,
  Mail,
  MapPin,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  UserX,
} from 'lucide-react';
import { TAM_HIEP_SCHOOL_GEO } from '@/lib/constants/geo';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Chính sách Quyền riêng tư & Kênh khiếu nại' }]} />

      {/* Title */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="success">Bảo vệ dữ liệu cá nhân</Badge>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
            Bản dự thảo áp dụng thí điểm
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-950 tracking-tight">
          Chính sách Quyền riêng tư & Kênh khiếu nại
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Cam kết bảo vệ dữ liệu cá nhân, quyền riêng tư của học sinh, phụ huynh và cộng đồng theo các quy định pháp luật hiện hành.
        </p>
      </div>

      {/* Mục lục nhanh */}
      <Card hover glow="emerald" className="border-slate-200 bg-slate-50/60 p-4">
        <span className="text-xs font-bold text-navy-950 uppercase tracking-wider block mb-2">
          Mục lục chính sách:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700 font-medium">
          <a href="#muc-1" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>1. Dữ liệu được thu thập (Tối thiểu)</span>
          </a>
          <a href="#muc-2" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>2. Mục đích sử dụng dữ liệu</span>
          </a>
          <a href="#muc-3" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>3. Quy trình xử lý ảnh và EXIF</span>
          </a>
          <a href="#muc-4" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>4. Bảo vệ người chưa thành niên</span>
          </a>
          <a href="#muc-5" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>5. Thời hạn lưu trữ và quyền của người gửi</span>
          </a>
          <a href="#khieu-nai" className="interactive-link inline-flex items-center gap-1 w-fit text-rose-600 font-bold">
            <span>6. Kênh tiếp nhận khiếu nại & đính chính</span>
          </a>
        </div>
      </Card>

      {/* Nội dung chi tiết */}
      <Card className="border-slate-200">
        <CardContent className="p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Mục 1 */}
          <section id="muc-1" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              1. Dữ liệu được thu thập theo nguyên tắc tối thiểu
            </h2>
            <p>
              SAFE SCHOOL MAP áp dụng chuẩn mực bảo vệ dữ liệu cá nhân theo định hướng thu thập tối thiểu (Data Minimization):
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li><strong>Không bắt buộc định danh:</strong> Bạn không cần cung cấp họ tên, số điện thoại, số định danh cá nhân hay tài khoản mạng xã hội khi gửi phản ánh.</li>
              <li><strong>Không theo dõi vị trí nền (No Background GPS Tracking):</strong> Hệ thống chỉ ghi nhận vị trí điểm giao thông do người dùng chủ động ghim hoặc chọn trên bản đồ tại thời điểm gửi form.</li>
              <li><strong>Tách biệt tọa độ:</strong> Tọa độ chính xác từng mét của người gửi chỉ được lưu nội bộ cho việc xác minh hiện trường; trên bản đồ công khai, tọa độ hiển thị được tổng quát hóa về vị trí tim đường đại diện.</li>
            </ul>
          </section>

          {/* Mục 2 */}
          <section id="muc-2" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              2. Mục đích sử dụng dữ liệu
            </h2>
            <p>
              Dữ liệu phản ánh thu thập được chỉ sử dụng duy nhất cho các mục đích:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Hỗ trợ cán bộ nhà trường kiểm tra, xác minh điểm nghẽn giao thông thực tế.</li>
              <li>Tổng hợp các điểm Hotspot để nhà trường bố trí lực lượng phân luồng vào khung giờ cao điểm.</li>
              <li>Làm căn cứ dữ liệu khoa học để nhà trường kiến nghị cơ quan chức năng can thiệp hạ tầng (sơn vạch sang đường, đặt biển cảnh báo).</li>
              <li>Tuyệt đối không sử dụng dữ liệu cho mục đích quảng cáo, thương mại hay chuyển giao cho bên thứ ba ngoài phạm vi thẩm định.</li>
            </ul>
          </section>

          {/* Mục 3 */}
          <section id="muc-3" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <EyeOff className="w-4 h-4 text-purple-600" />
              3. Quy trình xử lý hình ảnh và xóa siêu dữ liệu EXIF
            </h2>
            <p>
              Hình ảnh hiện trường do người dân tải lên được bảo vệ qua quy trình 3 lớp nghiêm ngặt:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-xs">
              <li>
                <strong>Lưu trữ trong kho riêng tư:</strong> Ảnh gốc được lưu trong phân vùng Private Storage của Supabase (`private-reports`). Không tạo liên kết công khai (Public URL) cho ảnh gốc.
              </li>
              <li>
                <strong>Loại bỏ siêu dữ liệu EXIF:</strong> Toàn bộ dữ liệu ẩn về loại máy ảnh, thời gian chụp và tọa độ GPS gắn trong tệp ảnh gốc đều được loại bỏ trước khi lưu trữ.
              </li>
              <li>
                <strong>Làm mờ thông tin nhận dạng:</strong> Trước khi hình ảnh được công khai kèm Hotspot, bắt buộc phải làm mờ khuôn mặt học sinh, biển số phương tiện và bảng tên nhận diện cá nhân.
              </li>
            </ol>
          </section>

          {/* Mục 4 */}
          <section id="muc-4" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserX className="w-4 h-4 text-emerald-600" />
              4. Bảo vệ đặc biệt đối với người chưa thành niên
            </h2>
            <p className="text-xs leading-relaxed">
              Khu vực cổng trường là môi trường sinh hoạt của học sinh dưới 18 tuổi. Nền tảng cam kết:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Không công khai danh tính, lớp học hay bất kỳ hình ảnh rõ mặt nào của học sinh.</li>
              <li>Các phản ánh do học sinh gửi lên đều được bảo vệ như dữ liệu của người chưa thành niên theo các quy định bảo vệ trẻ em trên môi trường mạng.</li>
            </ul>
          </section>

          {/* Mục 5 */}
          <section id="muc-5" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-slate-600" />
              5. Thời hạn lưu trữ và Quyền của người gửi
            </h2>
            <p className="text-xs leading-relaxed">
              Dữ liệu phản ánh hợp lệ được lưu trữ trong suốt thời gian triển khai giai đoạn thí điểm để phục vụ theo dõi và đánh giá hiệu quả can thiệp. Người gửi có quyền sử dụng mã tra cứu để theo dõi tiến độ, hoặc liên hệ qua kênh hỗ trợ để yêu cầu ẩn thông tin nếu phát hiện có sai sót.
            </p>
          </section>

          {/* Mục 6: KÊNH KHIẾU NẠI & ĐÍNH CHÍNH */}
          <section id="khieu-nai" className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 text-rose-700 bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <h2 className="text-sm font-bold text-rose-950">
                  6. Kênh Tiếp nhận Khiếu nại, Đính chính & Yêu cầu Gỡ bỏ Dữ liệu
                </h2>
                <p className="text-[11px] text-rose-800">
                  Dành cho người dân, phụ huynh hoặc cơ sở kinh doanh quanh khu vực trường học
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Nếu bạn nhận thấy bất kỳ thông tin phản ánh hoặc điểm Hotspot nào có nội dung sai lệch, ảnh hưởng đến quyền lợi hợp pháp của bạn hoặc có nguy cơ xâm phạm quyền riêng tư, bạn có quyền gửi yêu cầu đính chính hoặc gỡ bỏ ngay lập tức thông qua các kênh sau:
            </p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Hòm thư điện tử tiếp nhận chính thức:</span>
                  <span className="font-mono text-blue-700 font-bold">hotro.safeschoolmap@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-slate-200 pt-2.5">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Tiếp nhận trực tiếp tại đơn vị thí điểm:</span>
                  <span className="text-slate-700">
                    Bộ phận Tiếp công dân & Quản lý An toàn – <strong>{TAM_HIEP_SCHOOL_GEO.name}</strong>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {TAM_HIEP_SCHOOL_GEO.address}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              * Cam kết tiếp nhận: Ban quản trị và đại diện nhà trường cam kết tiếp nhận, tạm ẩn điểm phản ánh trong thời gian rà soát và phản hồi trong vòng 48 giờ làm việc.
            </p>
          </section>
        </CardContent>
      </Card>

      {/* Điều hướng quay lại */}
      <div className="flex items-center justify-between text-xs pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-navy-950 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Trang chủ</span>
        </Link>
        <Link href="/dieu-khoan" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-semibold">
          <span>Xem Điều khoản sử dụng</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
