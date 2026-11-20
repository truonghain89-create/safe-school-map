import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navy' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      href,
      ...props
    },
    ref
  ) => {
    // Emil Kowalski Tactile Button:
    // 1. Lift 2px on hover + shadow expansion
    // 2. Press scale(0.96) on active for immediate haptic/visual feedback
    // 3. Child icons smoothly react to hover
    const baseStyles =
      'group relative inline-flex items-center justify-center font-semibold rounded-xl btn-tactile transition-[transform,background-color,border-color,color,box-shadow] duration-micro ease-emil-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.96]';

    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:shadow-blue-600/25 focus:ring-blue-500 border border-transparent',
      secondary:
        'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300 hover:shadow-sm focus:ring-blue-400',
      navy:
        'bg-navy-950 hover:bg-navy-900 text-white shadow-sm hover:shadow-md hover:shadow-navy-950/25 focus:ring-navy-800 border border-transparent',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 hover:shadow-xs focus:ring-blue-500',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-navy-950 focus:ring-slate-300 border border-transparent',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md hover:shadow-rose-600/25 focus:ring-rose-500 border border-transparent',
      glass:
        'bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 shadow-xs focus:ring-white/40 backdrop-blur-xs',
    };

    const sizes = {
      sm: 'text-xs px-4 py-2 gap-2 min-h-[36px] whitespace-nowrap',
      md: 'text-sm px-5 sm:px-6 py-2.5 sm:py-3 gap-2.5 min-h-[44px] sm:min-h-[46px] whitespace-nowrap',
      lg: 'text-sm sm:text-base px-8 py-3.5 sm:py-4 gap-3 min-h-[48px] sm:min-h-[52px] whitespace-nowrap',
    };

    const content = (
      <>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && (
            <span className="shrink-0 transition-transform duration-micro ease-emil-out group-hover:scale-110 group-hover:-rotate-6">
              {leftIcon}
            </span>
          )
        )}
        <span className="transition-transform duration-micro ease-emil-out">{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0 transition-transform duration-micro ease-emil-out group-hover:translate-x-1">
            {rightIcon}
          </span>
        )}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={cn(baseStyles, variants[variant], sizes[size], className)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
