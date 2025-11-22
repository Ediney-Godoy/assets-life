import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Input({ 
  label, 
  error, 
  success,
  helperText,
  icon,
  iconPosition = 'left',
  className, 
  multiline = false, 
  rows = 3, 
  ...props 
}) {
  const hasError = Boolean(error);
  const hasSuccess = Boolean(success) && !hasError;
  
  const baseClass = clsx(
    'w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    {
      'border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-400': !hasError && !hasSuccess,
      'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-400': hasError,
      'border-green-500 dark:border-green-500 focus:border-green-500 focus:ring-green-400': hasSuccess,
      'pl-10': icon && iconPosition === 'left',
      'pr-10': icon && iconPosition === 'right',
    },
    className
  );
  
  const containerClass = clsx('flex flex-col gap-1.5', {
    'has-error': hasError,
    'has-success': hasSuccess,
  });
  
  return (
    <div className={containerClass}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea className={baseClass} rows={rows} {...props} />
        ) : (
          <input className={baseClass} {...props} />
        )}
        {icon && iconPosition === 'right' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </span>
        )}
        {hasError && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <AlertCircle size={18} />
          </span>
        )}
        {hasSuccess && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle2 size={18} />
          </span>
        )}
      </div>
      {(error || helperText) && (
        <div className="flex items-start gap-1.5">
          {error && (
            <>
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
            </>
          )}
          {helperText && !error && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
}