import React from 'react';
import clsx from 'clsx';

export default function Table({
  columns,
  data,
  onRowClick,
  className,
  getRowClassName,
  loading = false,
  emptyMessage = 'No data available',
  maxHeight = '65vh',
  stickyHeader = true,
  striped = false,
  compact = false,
}) {
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={clsx(
        'overflow-x-auto overflow-y-auto scrollbar-stable',
        'rounded-lg border border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-900',
        className
      )}
      style={{ maxHeight }}
    >
      <table className="min-w-full text-sm">
        <thead
          className={clsx(
            'bg-neutral-50 dark:bg-neutral-800/50',
            stickyHeader && 'sticky top-0 z-10'
          )}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  cellPadding,
                  'text-left text-xs font-semibold uppercase tracking-wider',
                  'text-neutral-500 dark:text-neutral-400',
                  'border-b border-neutral-200 dark:border-neutral-700',
                  'whitespace-nowrap'
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key} className={cellPadding}>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400"
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-8 w-8 text-neutral-300 dark:text-neutral-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <span className="text-sm">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                onClick={() => onRowClick && onRowClick(row)}
                className={clsx(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer',
                  'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                  striped && idx % 2 === 1 && 'bg-neutral-50/50 dark:bg-neutral-800/20',
                  getRowClassName ? getRowClassName(row) : null
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      cellPadding,
                      'text-neutral-700 dark:text-neutral-300',
                      'whitespace-nowrap'
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Simple table wrapper for use with children
export function SimpleTable({ children, className }) {
  return (
    <div
      className={clsx(
        'overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800',
        className
      )}
    >
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}
