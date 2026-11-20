'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInDemo, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email công vụ và Mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        if (typeof window !== 'undefined') {
          window.location.href = '/quan-tri';
        }
      } else {
        let msg = res.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Email công vụ hoặc mật khẩu không chính xác.';
        } else if (msg.toLowerCase().includes('database error') || msg.toLowerCase().includes('schema') || msg.toLowerCase().includes('email address')) {
          msg = 'Tài khoản chưa kích hoạt trên hệ thống GoTrue. Vui lòng sử dụng tính năng "Đăng nhập nhanh (Chế độ Thử nghiệm DEMO)" bên dưới để kiểm thử đầy đủ các quyền.';
        }
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage('Lỗi hệ thống khi đăng nhập. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10 animate-in fade-in duration-300">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white p-1 border border-blue-400 shadow-xl mx-auto transition-transform hover:scale-105 overflow-hidden"
          >
            <Image
              src="/logo.png"
              alt="SAFE SCHOOL MAP Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain"
            />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              CỔNG ĐĂNG NHẬP NỘI BỘ
            </h1>
            <p className="text-xs text-blue-400 font-semibold tracking-wide uppercase">
              Hệ thống Safe School Map – Cổng trường An toàn
            </p>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Dành riêng cho Cán bộ Xác minh, Ban Giám Hiệu phê duyệt và Quản trị viên
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-3.5 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Email công vụ cán bộ
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="canbo@tamhiep.edu.vn"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Mật khẩu xác thực
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5">
              <span>Tài khoản công vụ mẫu:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('verifier.demo@tamhiep.edu.vn');
                  setPassword('DemoPassword123!');
                }}
                className="text-blue-400 hover:text-blue-300 underline font-mono"
              >
                Tự động điền mẫu
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xác thực Supabase Auth...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* DEMO FAST LOGIN SELECTOR (Theo yêu cầu Prompt 7 Mục V.3) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              Chế độ Thử nghiệm DEMO Phân quyền:
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded font-mono font-bold border border-amber-900">
              MÔI TRƯỜNG THÍ ĐIỂM
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Chọn nhanh vai trò để kiểm thử toàn diện quy trình xác minh và phê duyệt:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => signInDemo('verifier')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/60 text-left transition-all duration-micro ease-emil-out active:scale-[0.97] group cursor-pointer"
            >
              <div className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300">
                1. XÁC MINH (Verifier)
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                Thầy Nguyễn Văn A
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                Tổ An toàn Giao thông
              </div>
            </button>

            <button
              type="button"
              onClick={() => signInDemo('approver')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/60 text-left transition-all duration-micro ease-emil-out active:scale-[0.97] group cursor-pointer"
            >
              <div className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">
                2. PHÊ DUYỆT (Approver)
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                Cô Trần Thị B
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                Ban Giám Hiệu Nhà trường
              </div>
            </button>

            <button
              type="button"
              onClick={() => signInDemo('admin')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all duration-micro ease-emil-out active:scale-[0.97] group cursor-pointer"
            >
              <div className="text-[10px] font-bold text-purple-400 group-hover:text-purple-300">
                3. QUẢN TRỊ (Admin)
              </div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                Quản trị viên
              </div>
              <div className="text-[9px] text-slate-500 truncate">
                Toàn quyền hệ thống
              </div>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>&larr; Quay lại Trang chủ Cổng trường An toàn</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
