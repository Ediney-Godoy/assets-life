import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export default function Table({ 
  columns, 
  data, 
  onRowClick, 
  loading = false,
  emptyMessage = 'Nenhum dado encontrado',
  className, 
  getRowClassName,
  striped = true,
}) {
  if (loading) {
    return (
      <div className={clsx('overflow-x-auto overflow-y-auto scrollbar-stable max-h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className={clsx('overflow-x-auto overflow-y-auto scrollbar-stable max-h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div className="text-slate-400 dark:text-slate-500 text-4xl mb-2">📭</div>
            <span className="text-sm text-slate-600 dark:text-slate-400">{emptyMessage}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={clsx('overflow-x-auto overflow-y-auto scrollbar-stable max-h-[65vh] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm', className)}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-200 dark:divide-slate-800">
          {data.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={clsx(
                'transition-colors duration-150',
                {
                  'bg-slate-50/50 dark:bg-slate-900/50': striped && idx % 2 === 0,
                  'hover:bg-blue-50 dark:hover:bg-blue-950/20': onRowClick,
                  'cursor-pointer': onRowClick,
                },
                getRowClassName ? getRowClassName(row) : null
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-nowrap"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}