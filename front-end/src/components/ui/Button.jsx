import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className, 
  children, 
  ...props 
}) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm hover:shadow',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 shadow-sm hover:shadow',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-sm hover:shadow',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
    link: 'bg-transparent text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline focus:ring-blue-400 dark:text-blue-400',
  };
  
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 18;
  
  return (
    <button 
      className={clsx(base, sizes[size], variants[variant], className)} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize} className="animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}