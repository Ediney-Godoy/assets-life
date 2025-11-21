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
    'bg-white dark:bg-neutral-900',
    'text-neutral-900 dark:text-neutral-100',
    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
      : 'border-neutral-300 dark:border-neutral-700 focus:border-brand-500 focus:ring-brand-500/20 dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
    'disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed',
    Icon && iconPosition === 'left' && 'pl-9',
    Icon && iconPosition === 'right' && 'pr-9',
    multiline ? textareaSizes[size] : sizes[size],
    className
  );

  const inputId = props.id || props.name || Math.random().toString(36).substr(2, 9);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
          {props.required && <span className="text-danger-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 text-neutral-400',
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
        <span className="text-xs font-medium text-danger-600 dark:text-danger-500">{error}</span>
      )}
      {hint && !error && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</span>
      )}
    </div>
  );
}

// Search input variant
export function SearchInput({ className, ...props }) {
  return (
    <div className={clsx('relative', className)}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
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
          'bg-white dark:bg-neutral-900',
          'text-neutral-900 dark:text-neutral-100',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
          'border-neutral-300 dark:border-neutral-700',
          'focus:outline-none focus:ring-2 focus:border-brand-500 focus:ring-brand-500/20',
          'dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
          'transition-all duration-200'
        )}
        {...props}
      />
    </div>
  );
}
