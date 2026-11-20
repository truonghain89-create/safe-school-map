import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  sheen?: boolean;
  glow?: 'blue' | 'emerald' | 'amber' | 'purple' | 'none';
}

export function Card({
  className,
  children,
  hover = false,
  sheen = false,
  glow = 'none',
  ...props
}: CardProps) {
  const glowStyles = {
    none: '',
    blue: 'border-t-2 border-t-blue-500/90',
    emerald: 'border-t-2 border-t-emerald-500/90',
    amber: 'border-t-2 border-t-amber-500/90',
    purple: 'border-t-2 border-t-purple-500/90',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-[transform,box-shadow,border-color] duration-ui ease-emil-out',
        glowStyles[glow],
        sheen && 'card-sheen',
        hover && 'card-hover-lift hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 pt-6 pb-4 flex flex-col space-y-1.5 border-b border-slate-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base sm:text-lg font-bold text-navy-950 tracking-tight leading-snug', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-slate-500 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
