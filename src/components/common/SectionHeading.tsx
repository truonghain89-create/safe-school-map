import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  badge,
  title,
  subtitle,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'space-y-3.5 max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {badge && (
        <div className={cn('flex items-center gap-2', align === 'center' ? 'justify-center' : 'justify-start')}>
          {badge}
        </div>
      )}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-950 tracking-tight leading-tight">
          {title}
        </h2>
        <div className={cn('h-1 w-12 bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-ui', align === 'center' ? 'mx-auto' : '')} />
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto pt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
