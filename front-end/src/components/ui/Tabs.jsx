import React from 'react';
import clsx from 'clsx';

export function Tabs({ value, onChange, items }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 mb-4">
      <nav className="-mb-px flex space-x-2">
        {items.map((it) => (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={clsx(
              'px-3 py-2 text-sm font-medium rounded-t-md',
              value === it.value
                ? 'bg-white dark:bg-slate-900 border border-b-transparent border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function TabPanel({ active, children }) {
  if (!active) return null;
  return <div>{children}</div>;
}