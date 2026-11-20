import React from 'react';
import { Loader2, Inbox, AlertOctagon, CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function LoadingState({
  message = 'Đang tải dữ liệu...',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full py-12 flex flex-col items-center justify-center text-center space-y-3',
        className
      )}
    >
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có bản ghi nào để hiển thị trong khu vực này.',
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-navy-950">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải hoặc xử lý thông tin. Vui lòng thử lại sau.',
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col items-center justify-center text-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-rose-200 shadow-xs flex items-center justify-center text-rose-600">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-rose-950">{title}</h4>
        <p className="text-xs text-rose-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-2">
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function SuccessState({
  title = 'Thực hiện thành công',
  message = 'Thao tác của bạn đã được hệ thống ghi nhận.',
  action,
  className,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex flex-col items-center justify-center text-center space-y-3',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-center text-emerald-600">
        <CheckCircle2 className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-bold text-emerald-950">{title}</h4>
        <p className="text-xs text-emerald-700 leading-relaxed">{message}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const configs = {
    info: {
      bg: 'bg-blue-50/70 border-blue-200 text-blue-900',
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50/70 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-rose-50/70 border-rose-200 text-rose-900',
      icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    },
  };

  const config = configs[variant];

  return (
    <div className={cn('p-4 rounded-xl border flex items-start gap-3 text-xs', config.bg, className)}>
      {config.icon}
      <div className="space-y-0.5">
        {title && <strong className="font-semibold block">{title}</strong>}
        <div className="text-[11px] leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}
