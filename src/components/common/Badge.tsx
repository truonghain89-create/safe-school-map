import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertOctagon, ShieldCheck, Clock, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import type { HotspotSeverity, VerificationStatus, ProcessingStatus, PublicationStatus } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'navy';
  size?: 'sm' | 'md';
  interactive?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  interactive = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300',
    primary: 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/80 hover:border-blue-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80 hover:border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80 hover:border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100/80 hover:border-rose-300',
    outline: 'bg-transparent text-slate-600 border-slate-300 hover:bg-slate-50',
    navy: 'bg-navy-950 text-white border-navy-900 hover:bg-navy-900',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shrink-0 leading-none transition-all duration-micro ease-emil-out select-none',
        variants[variant],
        sizes[size],
        interactive && 'hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-xs',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Severity Badge với biểu tượng và hình dáng phân biệt rõ ràng
 */
export function SeverityBadge({ severity, className }: { severity: HotspotSeverity; className?: string }) {
  if (severity === 'high_risk') {
    return (
      <Badge variant="danger" interactive className={cn('font-semibold shadow-xs', className)}>
        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-breathing" />
        <span>Nguy cơ cao</span>
      </Badge>
    );
  }

  if (severity === 'attention_needed') {
    return (
      <Badge variant="warning" interactive className={cn('font-semibold', className)}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Cần chú ý</span>
      </Badge>
    );
  }

  return (
    <Badge variant="success" interactive className={cn('font-semibold', className)}>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>Đã khảo sát, chưa ghi nhận nguy cơ</span>
    </Badge>
  );
}

/**
 * Verification Status Badge (Report)
 */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="primary" interactive>
          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Đã xác minh</span>
        </Badge>
      );
    case 'invalid':
      return (
        <Badge variant="danger" interactive>
          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>Không hợp lệ</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="warning" interactive>
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Chờ xác minh</span>
        </Badge>
      );
  }
}

/**
 * Publication Status Badge (Hotspot)
 */
export function PublicationBadge({ status }: { status: PublicationStatus }) {
  switch (status) {
    case 'published':
      return (
        <Badge variant="success" interactive>
          <Eye className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Đã công khai bản đồ</span>
        </Badge>
      );
    case 'hidden':
      return (
        <Badge variant="default" interactive>
          <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
          <span>Đã ẩn</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" interactive>
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Chưa công khai</span>
        </Badge>
      );
  }
}

/**
 * Processing Status Badge
 */
export function ProcessingBadge({ status }: { status: ProcessingStatus }) {
  switch (status) {
    case 'resolved':
      return (
        <Badge variant="success" interactive>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Đã xử lý can thiệp</span>
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="primary" interactive>
          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Đang điều phối xử lý</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="default" interactive>
          <span>Chờ xử lý</span>
        </Badge>
      );
  }
}
