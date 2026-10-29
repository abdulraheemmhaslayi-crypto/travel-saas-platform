'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  icon,
  color = 'neutral',
}) => {
  const colorStyles = {
    neutral: 'bg-gray-50 text-gray-600 border border-gray-200',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    yellow: 'bg-amber-50 text-amber-600 border border-amber-100',
    red: 'bg-rose-50 text-rose-600 border border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    neutral: <Minus className="w-4 h-4 text-gray-400" />,
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <Card className="hover:border-gray-200 transition-colors duration-150" shadow="none">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2 truncate font-medium">{subtitle}</p>
          )}
          {trendValue && (
            <div className={cn('flex items-center gap-1 mt-2', trendColors[trend])}>
              {trendIcons[trend]}
              <span className="text-xs font-semibold">{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0 border border-gray-100', colorStyles[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;