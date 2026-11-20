import React from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { FileText, ShieldAlert, CheckCircle, Scale, ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 sm:space-y-10">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Điều khoản sử dụng' }]} />

      {/* Title */}
      <div className="space-y-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <Badge variant="primary">Văn bản nền tảng</Badge>
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
            Bản dự thảo áp dụng thí điểm
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-950 tracking-tight">
          Điều khoản sử dụng dịch vụ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Dự thảo quy định nguyên tắc sử dụng nền tảng SAFE SCHOOL MAP tại Trường THPT Tam Hiệp, TP. Biên Hòa (cũ), Đồng Nai.
        </p>
      </div>

      {/* Mục lục nhanh */}
      <Card hover glow="blue" className="border-slate-200 bg-slate-50/60 p-4">
        <span className="text-xs font-bold text-navy-950 uppercase tracking-wider block mb-2">
          Mục lục điều khoản:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700 font-medium">
          <a href="#muc-1" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>1. Mục đích và định vị nền tảng</span>
          </a>
          <a href="#muc-2" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>2. Quyền và trách nhiệm người gửi</span>
          </a>
          <a href="#muc-3" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>3. Quy định về nội dung phản ánh</span>
          </a>
          <a href="#muc-4" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>4. Các hành vi bị nghiêm cấm</span>
          </a>
          <a href="#muc-5" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>5. Quyền chỉnh sửa và ẩn dữ liệu</span>
          </a>
          <a href="#muc-6" className="interactive-link inline-flex items-center gap-1 w-fit">
            <span>6. Giới hạn trách nhiệm pháp lý</span>
          </a>
        </div>
      </Card>

      {/* Nội dung chi tiết */}
      <Card className="border-slate-200">
        <CardContent className="p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Mục 1 */}
          <section id="muc-1" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              1. Mục đích và Định vị nền tảng
            </h2>
            <p>
              SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN là một công cụ công nghệ cộng đồng hỗ trợ nhà trường và học sinh, phụ huynh ghi nhận, phân tích các vấn đề trật tự an toàn giao thông quanh khu vực cổng trường học.
            </p>
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Lưu ý quan trọng:</strong> Hệ thống này không phải là cơ quan xử phạt vi phạm hành chính và không thay thế cho hệ thống giám sát của lực lượng Cảnh sát Giao thông hay cơ quan quản lý đô thị.
            </div>
          </section>

          {/* Mục 2 */}
          <section id="muc-2" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              2. Quyền và Trách nhiệm của người gửi phản ánh
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Người gửi có quyền gửi thông tin hoàn toàn ẩn danh, không bắt buộc cung cấp họ tên hay số điện thoại.</li>
              <li>Người gửi cam kết phản ánh trung thực về sự việc giao thông quan sát được tại hiện trường xung quanh trường học.</li>
              <li>Người gửi được cấp một mã tra cứu bảo mật để theo dõi trạng thái thẩm định của nhà trường.</li>
            </ul>
          </section>

          {/* Mục 3 */}
          <section id="muc-3" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              3. Quy định về nội dung phản ánh và hình ảnh
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Thông tin phản ánh phải liên quan trực tiếp đến an toàn giao thông: ùn tắc, dừng đỗ xe trái quy định, điểm khuất tầm nhìn, học sinh sang đường nguy hiểm hoặc nguy cơ va chạm.</li>
              <li>Hình ảnh tải lên (nếu có) phải phản ánh đúng thực tế hiện trường tại khu vực cổng trường học.</li>
              <li>Mọi hình ảnh công khai kèm Hotspot bắt buộc phải qua quy trình xóa EXIF và làm mờ khuôn mặt, biển số xe để bảo vệ quyền riêng tư.</li>
            </ul>
          </section>

          {/* Mục 4 */}
          <section id="muc-4" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              4. Các hành vi bị nghiêm cấm
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-rose-900">
              <li>Nghiêm cấm gửi thông tin bịa đặt, sai sự thật nhằm mục đích vu khống, bôi nhọ danh dự của bất kỳ cá nhân, hộ kinh doanh hay tổ chức nào.</li>
              <li>Nghiêm cấm tải lên hình ảnh bạo lực, phản cảm, đồi trụy hoặc không liên quan đến an toàn giao thông học đường.</li>
              <li>Nghiêm cấm hành vi sử dụng công cụ tự động (bot), spam gửi phản ánh hàng loạt nhằm gây nghẽn hệ thống.</li>
            </ul>
          </section>

          {/* Mục 5 */}
          <section id="muc-5" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              5. Quyền chỉnh sửa, thẩm định và ẩn dữ liệu
            </h2>
            <p className="text-xs">
              Cán bộ xác minh và đại diện nhà trường có toàn quyền:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>Từ chối các phản ánh không hợp lệ (kèm lý do giải thích bằng văn bản theo đúng quy định).</li>
              <li>Đánh giá và thiết lập mức độ nguy cơ Hotspot dựa trên kết quả khảo sát thực tế.</li>
              <li>Ẩn khẩn cấp các điểm Hotspot hoặc phản ánh nếu phát hiện có nguy cơ sai lệch hoặc vi phạm quyền riêng tư.</li>
            </ul>
          </section>

          {/* Mục 6 */}
          <section id="muc-6" className="space-y-2">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Scale className="w-4 h-4 text-slate-600" />
              6. Giới hạn trách nhiệm pháp lý
            </h2>
            <p className="text-xs leading-relaxed">
              Dự án SAFE SCHOOL MAP cung cấp dữ liệu bản đồ mang tính tham khảo hỗ trợ nhận diện khu vực cần quan tâm. Ban quản trị và nhà trường không chịu trách nhiệm bồi thường cho bất kỳ sự cố giao thông nào xảy ra ngoài đời thực. Mọi cá nhân khi tham gia giao thông đều phải tự giác tuân thủ Luật Giao thông đường bộ hiện hành.
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
        <Link href="/quyen-rieng-tu" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-semibold">
          <span>Xem Chính sách quyền riêng tư</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
