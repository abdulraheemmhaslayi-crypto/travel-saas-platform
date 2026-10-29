'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import Button from './Button';

interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  rowClassName?: string;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  sortColumn,
  sortDirection,
  onSort,
  pagination,
  onRowClick,
  rowClassName,
}: TableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable || !onSort) return null;
    if (sortColumn !== column.key) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-primary-600 ml-1.5 shrink-0" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-primary-600 ml-1.5 shrink-0" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-6 py-3.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && onSort && 'cursor-pointer hover:text-gray-700',
                  column.width
                )}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => column.sortable && onSort && onSort(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center text-sm text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer',
                  rowClassName
                )}
              >
                {columns.map((column) => (
                  <td key={`${keyExtractor(row)}-${column.key}`} className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {column.render ? column.render(row) : (row as Record<string, unknown>)[column.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50">
          <div className="text-xs font-semibold text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;