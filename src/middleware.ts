import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware bảo vệ các tuyến đường quản trị nội bộ (/quan-tri/*)
 * Ngăn chặn truy cập SSR trái phép khi chưa có phiên đăng nhập hoặc vai trò DEMO
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ can thiệp vào các đường dẫn quản trị
  if (pathname.startsWith('/quan-tri')) {
    const cookies = request.cookies;

    // 1. Kiểm tra cookie phiên đăng nhập Supabase Auth
    const hasSupabaseAuth = Array.from(cookies.getAll()).some(
      (c) => c.name.startsWith('sb-') && (c.name.includes('auth-token') || c.name.includes('access-token'))
    );

    // 2. Kiểm tra vai trò thử nghiệm DEMO có kiểm soát
    const demoRole = cookies.get('safeschool_demo_role')?.value;
    const hasValidDemoRole = demoRole && ['verifier', 'approver', 'admin'].includes(demoRole);

    // Nếu không có bất kỳ phiên xác thực nào, chuyển hướng về cổng đăng nhập
    if (!hasSupabaseAuth && !hasValidDemoRole) {
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/quan-tri/:path*'],
};
