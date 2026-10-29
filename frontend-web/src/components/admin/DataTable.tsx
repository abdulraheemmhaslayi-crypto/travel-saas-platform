'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';

interface DataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: Array<{
    key: string;
    header: React.ReactNode;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
  }>;
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  totalCount: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  bulkActions?: Array<{
    label: string;
    onClick: (selectedIds: string[]) => void;
    variant?: 'primary' | 'danger';
  }>;
  selectable?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  keyExtractor,
  isLoading = false,
  totalCount,
  page,
  pageSize = 10,
  onPageChange,
  onSort,
  onRowClick,
  filters,
  actions,
  bulkActions,
  selectable = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    onSort?.(column, newDirection);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(keyExtractor)));
    }
  };

  return (
    <Card>
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {filters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<Filter className="w-4 h-4" />}
              >
                Filters
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            {actions}
          </div>
        </div>

        {showFilters && filters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">{filters}</div>
        )}

        {selectable && selectedIds.size > 0 && bulkActions && (
          <div className="mt-4 flex items-center gap-2 p-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700 font-medium">
              {selectedIds.size} selected
            </span>
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'primary'}
                size="sm"
                onClick={() => action.onClick(Array.from(selectedIds))}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Table
        columns={[
          ...(selectable
            ? [
                {
                  key: 'selection',
                  header: (
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.size === data.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  ),
                  render: (row: T) => (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(keyExtractor(row))}
                      onChange={() => toggleSelection(keyExtractor(row))}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  ),
                },
              ]
            : []),
          ...columns,
        ]}
        data={data}
        keyExtractor={keyExtractor}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onRowClick}
      />

      <div className="p-4 border-t border-gray-200">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalCount}
          pageSize={pageSize}
        />
      </div>
    </Card>
  );
}

export default DataTable;