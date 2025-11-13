import React from 'react';
import clsx from 'clsx';

export default function Select({ label, error, className, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        className={clsx('px-3 py-2 rounded-md border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400', className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}