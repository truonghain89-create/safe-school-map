import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN',
  description: 'Hệ thống tiếp nhận, xác minh và tổng hợp phản ánh giao thông khu vực trường học',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'SAFE SCHOOL MAP – CỔNG TRƯỜNG AN TOÀN',
    description: 'Hệ thống tiếp nhận, xác minh và tổng hợp phản ánh giao thông khu vực trường học tại TP. Biên Hòa (cũ)',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
