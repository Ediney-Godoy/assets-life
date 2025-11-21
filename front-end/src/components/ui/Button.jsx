import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: [
    'bg-blue-500 text-white',
    'hover:bg-blue-600 active:bg-blue-700',
    'focus:ring-blue-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
  secondary: [
    'bg-slate-100 text-slate-700',
    'hover:bg-slate-200 active:bg-slate-300',
    'dark:bg-slate-800 dark:text-slate-200',
    'dark:hover:bg-slate-700 dark:active:bg-slate-600',
    'focus:ring-slate-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
  outline: [
    'bg-transparent text-slate-700 border border-slate-300',
    'hover:bg-slate-50 active:bg-slate-100',
    'dark:text-slate-200 dark:border-slate-700',
    'dark:hover:bg-slate-800 dark:active:bg-slate-700',
    'focus:ring-slate-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-600',
    'hover:bg-slate-100 active:bg-slate-200',
    'dark:text-slate-400',
    'dark:hover:bg-slate-800 dark:active:bg-slate-700',
    'focus:ring-slate-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600 active:bg-red-700',
    'focus:ring-red-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
  success: [
    'bg-green-500 text-white',
    'hover:bg-green-600 active:bg-green-700',
    'focus:ring-green-500',
    'dark:focus:ring-offset-slate-900',
  ].join(' '),
};

const sizes = {
  xs: 'h-7 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-base gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center',
        'font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === 'xs' || size === 'sm' ? 14 : 16} />
          {children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'xs' || size === 'sm' ? 14 : 16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={size === 'xs' || size === 'sm' ? 14 : 16} />}
        </>
      )}
    </button>
  );
}

// Icon-only button variant
export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  loading = false,
  disabled = false,
  ...props
}) {
  const iconSizes = {
    xs: 'h-6 w-6',
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-9 w-9',
    xl: 'h-10 w-10',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center',
        'rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        iconSizes[size],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'xs' || size === 'sm' ? 14 : 16} />
      ) : (
        children
      )}
    </button>
  );
}
