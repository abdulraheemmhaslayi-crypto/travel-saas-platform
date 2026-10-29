'use client';

import React from 'react';
import Card from '@/components/ui/Card';

// Placeholder for recharts integration
// In production, import actual recharts components:
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type?: 'line' | 'bar' | 'pie' | 'area';
  data: unknown[];
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type = 'line',
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#64748b'],
  className,
}) => {
  // Placeholder chart rendering
  // Replace with actual recharts implementation when library is added
  const maxValue = Math.max(...(data as Array<Record<string, number>>).map(d => d[dataKey] as number || 0));
  const minValue = Math.min(...(data as Array<Record<string, number>>).map(d => d[dataKey] as number || 0));

  return (
    <Card className={className} shadow="none">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Placeholder visualization */}
      <div className="h-64 bg-slate-50 rounded-xl p-4 relative overflow-hidden border border-gray-100">
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-4 gap-2">
          {(data as Array<Record<string, unknown>>).map((item, index) => {
            const value = (item[dataKey] as number) || 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${height}%`,
                    backgroundColor: colors[index % colors.length],
                    opacity: 0.85,
                  }}
                />
                <span className="text-[10px] text-gray-500 truncate w-full text-center">
                  {(item[xAxisKey] as string) || ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between text-[10px] text-gray-400">
          <span>{maxValue}</span>
          <span>{Math.round((maxValue + minValue) / 2)}</span>
          <span>{minValue}</span>
        </div>
      </div>

      {/* Legend */}
      {colors.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-gray-500">Series {index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ChartCard;