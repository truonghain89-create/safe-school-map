import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5 w-full group">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-navy-950 transition-colors group-focus-within:text-blue-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-micro">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            className={cn(
              'w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-navy-950 placeholder-slate-400',
              'transition-[border-color,box-shadow,background-color] duration-micro ease-emil-out input-focus-glow',
              'focus:outline-none focus:border-blue-600',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                : 'border-slate-200 hover:border-slate-300',
              'disabled:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-micro">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium animate-fadeIn">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, leftIcon, id, required, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5 w-full group">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-navy-950 transition-colors group-focus-within:text-blue-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors duration-micro">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            required={required}
            className={cn(
              'w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-navy-950',
              'transition-[border-color,box-shadow,background-color] duration-micro ease-emil-out input-focus-glow',
              'focus:outline-none focus:border-blue-600',
              leftIcon && 'pl-9',
              error
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
                : 'border-slate-200 hover:border-slate-300',
              'disabled:bg-slate-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {children}
          </select>
        </div>
        {error ? (
          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium animate-fadeIn">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, required, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="space-y-1.5 w-full group">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-navy-950 transition-colors group-focus-within:text-blue-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-navy-950 placeholder-slate-400',
            'transition-[border-color,box-shadow,background-color] duration-micro ease-emil-out input-focus-glow',
            'focus:outline-none focus:border-blue-600 min-h-[100px]',
            error
              ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500'
              : 'border-slate-200 hover:border-slate-300',
            'disabled:bg-slate-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1 font-medium animate-fadeIn">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-start gap-3 group">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 cursor-pointer',
            'transition-all duration-micro ease-emil-out hover:scale-105 active:scale-[0.92]',
            'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
            className
          )}
          {...props}
        />
        <div className="text-xs">
          <label htmlFor={checkboxId} className="font-semibold text-navy-950 cursor-pointer select-none group-hover:text-blue-700 transition-colors">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
