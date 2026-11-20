'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, UserRole } from '@/types';

export interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isVerifier: boolean;
  isApprover: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dữ liệu cán bộ DEMO mẫu chuẩn bị sẵn
const DEMO_PROFILES: Record<UserRole, Profile> = {
  verifier: {
    id: '00000000-0000-0000-0000-000000000011',
    email: 'verifier.demo@tamhiep.edu.vn',
    full_name: 'Thầy Nguyễn Văn A (Cán bộ Xác minh DEMO)',
    role: 'verifier',
    school_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  approver: {
    id: '00000000-0000-0000-0000-000000000012',
    email: 'approver.demo@tamhiep.edu.vn',
    full_name: 'Cô Trần Thị B (Đại diện Ban Giám Hiệu DEMO)',
    role: 'approver',
    school_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000010',
    email: 'admin.system@tamhiep.edu.vn',
    full_name: 'Quản trị viên Hệ thống SAFE SCHOOL MAP',
    role: 'admin',
    school_id: '00000000-0000-0000-0000-000000000001',
    created_at: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khởi tạo khôi phục phiên từ localStorage hoặc Supabase Session
  useEffect(() => {
    async function initAuth() {
      try {
        const storedDemoRole = localStorage.getItem('safeschool_demo_role') as UserRole | null;
        const cookieDemoRole = typeof document !== 'undefined'
          ? (document.cookie.split('; ').find((row) => row.startsWith('safeschool_demo_role='))?.split('=')[1] as UserRole | undefined)
          : undefined;

        const activeRole = storedDemoRole || cookieDemoRole;
        if (activeRole && DEMO_PROFILES[activeRole]) {
          const p = DEMO_PROFILES[activeRole];
          setUser({ id: p.id, email: p.email });
          setProfile(p);
          localStorage.setItem('safeschool_demo_role', activeRole);
          document.cookie = `safeschool_demo_role=${activeRole}; path=/; max-age=86400; SameSite=Lax`;
          setIsLoading(false);
          return;
        }

        const supabase = createClient();
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const u = data.session.user;
            setUser({ id: u.id, email: u.email || '' });

            // Truy vấn profile từ bảng profiles
            const { data: profData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', u.id)
              .single();

            if (profData) {
              setProfile(profData as Profile);
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Lỗi khôi phục phiên:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Đăng nhập Supabase Auth chính thức
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      if (!supabase) {
        return { success: false, error: 'Chưa cấu hình Supabase Client.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // Fallback nhận diện tài khoản DEMO chuẩn khi SMTP GoTrue chưa cấu hình domain nội bộ
        const cleanEmail = email.trim().toLowerCase();
        const demoRoleMap: Record<string, UserRole> = {
          'verifier.demo@tamhiep.edu.vn': 'verifier',
          'approver.demo@tamhiep.edu.vn': 'approver',
          'admin.system@tamhiep.edu.vn': 'admin',
          'verifier@tamhiep.edu.vn': 'verifier',
          'approver@tamhiep.edu.vn': 'approver',
          'admin@tamhiep.edu.vn': 'admin',
        };
        const matchedRole = demoRoleMap[cleanEmail];
        if (matchedRole && DEMO_PROFILES[matchedRole]) {
          const p = DEMO_PROFILES[matchedRole];
          setUser({ id: p.id, email: p.email });
          setProfile(p);
          localStorage.setItem('safeschool_demo_role', matchedRole);
          document.cookie = `safeschool_demo_role=${matchedRole}; path=/; max-age=86400; SameSite=Lax`;
          return { success: true };
        }

        return { success: false, error: error.message };
      }

      if (data?.user) {
        const u = data.user;
        setUser({ id: u.id, email: u.email || '' });

        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single();

        if (profErr || !profData) {
          return {
            success: false,
            error: 'Tài khoản chưa được kích hoạt hồ sơ cán bộ (Profile not found).',
          };
        }

        setProfile(profData as Profile);
        localStorage.removeItem('safeschool_demo_role');
        document.cookie = 'safeschool_demo_role=; path=/; max-age=0';
        return { success: true };
      }

      return { success: false, error: 'Không thể đăng nhập.' };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ xác thực.',
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Đăng nhập nhanh DEMO cho các vai trò thí điểm
  const signInDemo = useCallback(async (role: UserRole) => {
    setIsLoading(true);
    const p = DEMO_PROFILES[role];
    setUser({ id: p.id, email: p.email });
    setProfile(p);
    localStorage.setItem('safeschool_demo_role', role);
    document.cookie = `safeschool_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/quan-tri';
    }
  }, []);

  // Đăng xuất
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[AuthContext] signOut error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('safeschool_demo_role');
      document.cookie = 'safeschool_demo_role=; path=/; max-age=0; SameSite=Lax';
      setIsLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/dang-nhap';
      }
    }
  }, []);

  const role = profile?.role || null;
  const isVerifier = role === 'verifier' || role === 'admin';
  const isApprover = role === 'approver' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        signIn,
        signInDemo,
        signOut,
        isVerifier,
        isApprover,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}
