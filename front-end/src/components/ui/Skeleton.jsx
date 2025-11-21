import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={clsx('p-5 rounded-xl border border-neutral-200 dark:border-neutral-800', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={clsx('rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-4 py-3 flex gap-4 border-t border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton className={clsx('rounded-full', sizeClasses[size], className)} />
  );
}

export function SkeletonChart({ className }) {
  return (
    <div className={clsx('p-5 rounded-xl border border-neutral-200 dark:border-neutral-800', className)}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
