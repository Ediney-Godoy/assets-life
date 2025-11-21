import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: [
    'bg-brand-500 text-white',
    'hover:bg-brand-600 active:bg-brand-700',
    'focus:ring-brand-500',
    'dark:focus:ring-offset-neutral-900',
  ].join(' '),
  secondary: [
    'bg-neutral-100 text-neutral-700',
    'hover:bg-neutral-200 active:bg-neutral-300',
    'dark:bg-neutral-800 dark:text-neutral-200',
    'dark:hover:bg-neutral-700 dark:active:bg-neutral-600',
    'focus:ring-neutral-500',
    'dark:focus:ring-offset-neutral-900',
  ].join(' '),
  outline: [
    'bg-transparent text-neutral-700 border border-neutral-300',
    'hover:bg-neutral-50 active:bg-neutral-100',
    'dark:text-neutral-200 dark:border-neutral-700',
    'dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
    'focus:ring-neutral-500',
    'dark:focus:ring-offset-neutral-900',
  ].join(' '),
  ghost: [
    'bg-transparent text-neutral-600',
    'hover:bg-neutral-100 active:bg-neutral-200',
    'dark:text-neutral-400',
    'dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
    'focus:ring-neutral-500',
    'dark:focus:ring-offset-neutral-900',
  ].join(' '),
  danger: [
    'bg-danger-500 text-white',
    'hover:bg-danger-600 active:bg-danger-700',
    'focus:ring-danger-500',
    'dark:focus:ring-offset-neutral-900',
  ].join(' '),
  success: [
    'bg-success-500 text-white',
    'hover:bg-success-600 active:bg-success-700',
    'focus:ring-success-500',
    'dark:focus:ring-offset-neutral-900',
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
