import React from 'react';
import clsx from 'clsx';

const variants = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  primary: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
  secondary: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  success: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-400',
  danger: 'bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-400',
  info: 'bg-info-100 text-info-700 dark:bg-info-500/20 dark:text-info-400',
  outline: 'bg-transparent border border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300',
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
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'danger' && 'bg-danger-500',
          variant === 'info' && 'bg-info-500',
          variant === 'primary' && 'bg-brand-500',
          (variant === 'default' || variant === 'secondary' || variant === 'outline') && 'bg-neutral-500'
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
