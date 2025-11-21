import React from 'react';
import clsx from 'clsx';

const variants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  secondary: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-success-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-warning-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-danger-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-info-400',
  outline: 'bg-transparent border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
};

const sizes = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-md',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'danger' && 'bg-red-500',
          variant === 'info' && 'bg-sky-500',
          variant === 'primary' && 'bg-blue-500',
          (variant === 'default' || variant === 'secondary' || variant === 'outline') && 'bg-slate-500'
        )} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active', dot: true },
    inactive: { variant: 'default', label: 'Inactive', dot: true },
    pending: { variant: 'warning', label: 'Pending', dot: true },
    error: { variant: 'danger', label: 'Error', dot: true },
    completed: { variant: 'info', label: 'Completed', dot: true },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
}

export default Badge;
