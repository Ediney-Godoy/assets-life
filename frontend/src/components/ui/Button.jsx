import React from 'react';
import clsx from 'clsx';

export default function Button({ variant = 'primary', className, children, ...props }) {
  const base = 'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-light text-white hover:bg-blue-500 focus:ring-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-400',
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}