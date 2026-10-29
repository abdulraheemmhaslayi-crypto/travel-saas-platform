'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Loading from '@/components/common/Loading';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/authSlice';

const reportTypes = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'users', label: 'Users' },
  { value: 'trips', label: 'Trips' },
];

const exportFormats = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xlsx', label: 'XLSX' },
];

export default function AdminReportsPage() {
  const { showToast } = useAppStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN';

  const filteredReportTypes = reportTypes.filter(
    (item) => isSuperAdmin || item.value !== 'revenue'
  );

  const [reportType, setReportType] = useState(isSuperAdmin ? 'revenue' : 'bookings');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      showToast('Please supply both start and end date', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.generateAdminReport({
        reportType,
        format,
        startDate,
        endDate,
      });
      setResult(response.data);
      showToast('Report generated successfully', 'success');
    } catch {
      showToast('Unable to generate report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate executive reports for finance, bookings, and fleet performance</p>
        </div>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={filteredReportTypes}
          />
          <Select
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            options={exportFormats}
          />
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {isLoading ? (
        <Loading text="Preparing report..." />
      ) : result ? (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Report Summary</h2>
                <p className="text-sm text-gray-500">{reportTypes.find((item) => item.value === reportType)?.label} data for {formatDate(startDate)} to {formatDate(endDate)}</p>
              </div>
              <span className="text-sm text-gray-500">Format: {format.toUpperCase()}</span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-8 text-center text-gray-500">
            Use the controls above to generate a platform report.
          </div>
        </Card>
      )}
    </div>
  );
}
