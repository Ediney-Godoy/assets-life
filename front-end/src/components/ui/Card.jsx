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
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'rounded-xl shadow-card',
        'transition-all duration-200',
        hover && 'hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-700',
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
    <h3 className={clsx('text-lg font-semibold text-slate-900 dark:text-slate-100', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={clsx('text-sm text-slate-500 dark:text-slate-400 mt-1', className)} {...props}>
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
    <div className={clsx('mt-4 pt-4 border-t border-slate-200 dark:border-slate-800', className)} {...props}>
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
    default: 'bg-white dark:bg-slate-900',
    primary: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    success: 'bg-green-50 dark:bg-green-500/10 border-success-200 dark:border-green-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 border-warning-200 dark:border-amber-500/20',
    danger: 'bg-red-50 dark:bg-red-500/10 border-danger-200 dark:border-red-500/20',
  };

  const iconStyles = {
    default: 'text-slate-500 dark:text-slate-400',
    primary: 'text-blue-500 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-500',
    warning: 'text-amber-600 dark:text-amber-500',
    danger: 'text-red-600 dark:text-red-500',
  };

  return (
    <div
      className={clsx(
        'p-4 sm:p-5 rounded-xl border shadow-card',
        'transition-all duration-200',
        'hover:shadow-card-hover',
        variantStyles[variant],
        variant === 'default' && 'border-slate-200 dark:border-slate-800',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx('p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800', iconStyles[variant])}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={clsx(
            'text-xs font-medium',
            trend === 'up' && 'text-green-600 dark:text-green-500',
            trend === 'down' && 'text-red-600 dark:text-red-500',
            trend === 'neutral' && 'text-slate-500'
          )}>
            {trend === 'up' && '+'}
            {trendValue}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            vs. last period
          </span>
        </div>
      )}
    </div>
  );
}

export default Card;
