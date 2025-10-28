import React from 'react';
import clsx from 'clsx';

export default function Table({ columns, data, onRowClick, className }) {
  return (
    <div className={clsx('overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800', className)}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300"
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
              className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
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