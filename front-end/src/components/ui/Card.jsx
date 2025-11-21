import React from 'react';
import clsx from 'clsx';

export function Card({ children, className, hover = false, interactive = false, padding = 'md', ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
    xl: 'p-6 sm:p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white dark:bg-neutral-900',
        'border border-neutral-200 dark:border-neutral-800',
        'rounded-xl shadow-card',
        'transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-neutral-300 dark:hover:border-neutral-700',
        interactive && 'cursor-pointer hover:-translate-y-0.5',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-neutral-900 dark:text-neutral-100', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={clsx('text-sm text-neutral-500 dark:text-neutral-400 mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={clsx(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800', className)} {...props}>
      {children}
    </div>
  );
}

// Metric Card for Dashboard
export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  ...props
}) {
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-900',
    primary: 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20',
    success: 'bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20',
    warning: 'bg-warning-50 dark:bg-warning-500/10 border-warning-200 dark:border-warning-500/20',
    danger: 'bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-500/20',
  };

  const iconStyles = {
    default: 'text-neutral-500 dark:text-neutral-400',
    primary: 'text-brand-500 dark:text-brand-400',
    success: 'text-success-600 dark:text-success-500',
    warning: 'text-warning-600 dark:text-warning-500',
    danger: 'text-danger-600 dark:text-danger-500',
  };

  return (
    <div
      className={clsx(
        'p-4 sm:p-5 rounded-xl border shadow-card',
        'transition-all duration-200',
        'hover:shadow-card-hover',
        variantStyles[variant],
        variant === 'default' && 'border-neutral-200 dark:border-neutral-800',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800', iconStyles[variant])}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={clsx(
            'text-xs font-medium',
            trend === 'up' && 'text-success-600 dark:text-success-500',
            trend === 'down' && 'text-danger-600 dark:text-danger-500',
            trend === 'neutral' && 'text-neutral-500'
          )}>
            {trend === 'up' && '+'}
            {trendValue}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            vs. last period
          </span>
        </div>
      )}
    </div>
  );
}

export default Card;
