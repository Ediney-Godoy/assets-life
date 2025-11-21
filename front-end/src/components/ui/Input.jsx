import React from 'react';
import clsx from 'clsx';

export default function Input({
  label,
  error,
  hint,
  className,
  multiline = false,
  rows = 3,
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const sizes = {
    sm: 'h-8 text-sm px-2.5',
    md: 'h-9 text-sm px-3',
    lg: 'h-10 text-base px-3.5',
  };

  const textareaSizes = {
    sm: 'text-sm px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-3.5 py-2.5',
  };

  const baseClass = clsx(
    'w-full rounded-lg border',
    'bg-white dark:bg-slate-900',
    'text-slate-900 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
    'disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed',
    Icon && iconPosition === 'left' && 'pl-9',
    Icon && iconPosition === 'right' && 'pr-9',
    multiline ? textareaSizes[size] : sizes[size],
    className
  );

  const inputId = props.id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 text-slate-400',
              iconPosition === 'left' ? 'left-3' : 'right-3'
            )}
          />
        )}
        {multiline ? (
          <textarea id={inputId} className={baseClass} rows={rows} {...props} />
        ) : (
          <input id={inputId} className={baseClass} {...props} />
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-red-600 dark:text-red-500">{error}</span>
      )}
      {hint && !error && (
        <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      )}
    </div>
  );
}

// Search input variant
export function SearchInput({ className, ...props }) {
  return (
    <div className={clsx('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        className={clsx(
          'w-full h-9 pl-9 pr-3 text-sm rounded-lg border',
          'bg-white dark:bg-slate-900',
          'text-slate-900 dark:text-slate-100',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'border-slate-300 dark:border-slate-700',
          'focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20',
          'dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
          'transition-all duration-200'
        )}
        {...props}
      />
    </div>
  );
}
