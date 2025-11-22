import React from 'react';
import clsx from 'clsx';

export default function Skeleton({ 
  className, 
  variant = 'text',
  width,
  height,
  rounded = 'md',
  ...props 
}) {
  const baseClass = 'animate-pulse bg-slate-200 dark:bg-slate-800';
  
  const variants = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: `rounded-${rounded}`,
  };
  
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={clsx(baseClass, variants[variant], className)}
      style={style}
      {...props}
    />
  );
}

// Componentes pré-configurados
export function SkeletonText({ lines = 1, className, ...props }) {
  return (
    <div className={clsx('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '75%' : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-2">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} variant="text" height={40} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={clsx('p-4 border border-slate-200 dark:border-slate-800 rounded-lg', className)}>
      <Skeleton variant="text" height={24} width="60%" className="mb-3" />
      <SkeletonText lines={3} />
    </div>
  );
}

