'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  showFirstLast?: boolean;
  siblingCount?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  showFirstLast = true,
  siblingCount = 1,
  className,
}) => {
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const leftSibling = Math.max(1, currentPage - siblingCount);
    const rightSibling = Math.min(totalPages, currentPage + siblingCount);

    if (leftSibling > 1) {
      pages.push(1);
      if (leftSibling > 2) pages.push('...');
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    if (rightSibling < totalPages) {
      if (rightSibling < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {totalItems !== undefined && (
        <div className="text-sm text-gray-700 hidden sm:block">
          Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-400">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {showFirstLast && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Pagination;