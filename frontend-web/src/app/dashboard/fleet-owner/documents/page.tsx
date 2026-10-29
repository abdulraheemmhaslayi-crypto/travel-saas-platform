'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/slices/fleetSlice';
import DataTable from '@/components/admin/DataTable';
import Loading from '@/components/common/Loading';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/store';
import { 
  FileText, 
  RefreshCw, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Shield,
  FileCheck
} from 'lucide-react';

function DocumentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { vehicles, isLoading, getVehicles } = useFleetStore();
  const { showToast } = useAppStore();

  const activeTab = searchParams ? searchParams.get('tab') || 'insurance' : 'insurance';
  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    getVehicles();
  }, [getVehicles]);

  useEffect(() => {
    setIsTabLoading(true);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 400); // simulated quick tab transition load
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabChange = (tabName: string) => {
    router.push(`/dashboard/fleet-owner/documents?tab=${tabName}`, { scroll: false });
  };

  const getDocStatus = (docUrl?: string, expiryDate?: string) => {
    if (!docUrl) return <Badge variant="danger">Missing</Badge>;
    if (expiryDate && new Date(expiryDate) < new Date()) {
      return <Badge variant="danger">Expired</Badge>;
    }
    if (expiryDate && new Date(expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000) {
      return <Badge variant="warning">Expiring Soon</Badge>;
    }
    return <Badge variant="success">Valid</Badge>;
  };

  // Setup dynamic columns depending on active tab using actual database schema
  const getColumns = () => {
    const baseColumns = [
      {
        key: 'vehicle',
        header: 'Vehicle',
        render: (row: any) => (
          <div>
            <p className="font-semibold text-gray-900 capitalize">{(row.make ?? row.brand) || row.model} {row.model}</p>
            <p className="font-mono text-xs text-gray-500">{row.registrationNumber}</p>
          </div>
        ),
      }
    ];

    if (activeTab === 'insurance') {
      return [
        ...baseColumns,
        {
          key: 'policyNumber',
          header: 'Policy Number',
          render: (row: any) => {
            const num = row.vehicle?.insuranceNumber || row.insuranceNumber;
            return <span className="font-mono text-sm">{num || 'Not Uploaded'}</span>;
          },
        },
        {
          key: 'expiry',
          header: 'Expiry Date',
          render: (row: any) => {
            const dateStr = row.vehicle?.insuranceExpiry || row.insuranceExpiry;
            return <span>{dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>;
          },
        },
        {
          key: 'status',
          header: 'Status',
          render: (row: any) => {
            const doc = row.vehicle?.insuranceDocument || row.insuranceDocument;
            const exp = row.vehicle?.insuranceExpiry || row.insuranceExpiry;
            return getDocStatus(doc, exp);
          },
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (row: any) => {
            const doc = row.vehicle?.insuranceDocument || row.insuranceDocument;
            return (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => showToast(`Upload new Insurance copy for ${row.registrationNumber}`, 'info')}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload
                </Button>
                {doc && (
                  <a href={doc} target="_blank" rel="noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          },
        },
      ];
    }

    if (activeTab === 'registration') {
      return [
        ...baseColumns,
        {
          key: 'rcNumber',
          header: 'RC Number',
          render: (row: any) => {
            const num = row.vehicle?.rcNumber || row.rcNumber;
            return <span className="font-mono text-sm">{num || 'Not Uploaded'}</span>;
          },
        },
        {
          key: 'expiry',
          header: 'RC Expiry',
          render: (row: any) => {
            const dateStr = row.vehicle?.rcExpiry || row.rcExpiry;
            return <span>{dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>;
          },
        },
        {
          key: 'status',
          header: 'Status',
          render: (row: any) => {
            const doc = row.vehicle?.rcDocument || row.rcDocument;
            const exp = row.vehicle?.rcExpiry || row.rcExpiry;
            return getDocStatus(doc, exp);
          },
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (row: any) => {
            const doc = row.vehicle?.rcDocument || row.rcDocument;
            return (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => showToast(`Upload new Registration Certificate for ${row.registrationNumber}`, 'info')}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload
                </Button>
                {doc && (
                  <a href={doc} target="_blank" rel="noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          },
        },
      ];
    }

    // Default to permits tab
    return [
      ...baseColumns,
      {
        key: 'permitNumber',
        header: 'Permit Number',
        render: (row: any) => {
          const num = row.vehicle?.permitNumber || row.permitNumber;
          return <span className="font-mono text-sm">{num || 'Not Uploaded'}</span>;
        },
      },
      {
        key: 'expiry',
        header: 'Expiry Date',
        render: (row: any) => {
          const dateStr = row.vehicle?.permitExpiry || row.permitExpiry;
          return <span>{dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>;
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (row: any) => {
          const doc = row.vehicle?.permitDocument || row.permitDocument;
          const exp = row.vehicle?.permitExpiry || row.permitExpiry;
          return getDocStatus(doc, exp);
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: any) => {
          const doc = row.vehicle?.permitDocument || row.permitDocument;
          return (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => showToast(`Upload new Permit copy for ${row.registrationNumber}`, 'info')}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload
                </Button>
                {doc && (
                  <a href={doc} target="_blank" rel="noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          },
      },
    ];
  };

  const tabs = [
    { id: 'insurance', label: 'Insurance Management', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
    { id: 'registration', label: 'Registration Documents', icon: <FileCheck className="w-4 h-4 text-emerald-500" /> },
    { id: 'permits', label: 'Permit Management', icon: <Shield className="w-4 h-4 text-blue-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Compliance Center
          </h1>
          <p className="text-gray-600 mt-1">Manage compliance certificates, registrations, and insurance coverages across your fleet.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={getVehicles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Compliance Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-150
                  ${isActive 
                    ? 'border-indigo-600 text-indigo-600 font-semibold' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Table Display */}
      {isLoading || isTabLoading ? (
        <Loading text={`Loading ${activeTab} records...`} />
      ) : (
        <div className="animate-fadeIn">
          <DataTable
            title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry`}
            subtitle={`Verification logs for all active and pending vehicles`}
            columns={getColumns()}
            data={vehicles}
            keyExtractor={(row: any) => row.id}
            isLoading={isLoading}
            totalCount={vehicles.length}
            page={1}
            onPageChange={() => {}}
            emptyMessage={`No records found for active tab: ${activeTab}`}
          />
        </div>
      )}
    </div>
  );
}

export default function FleetOwnerDocumentsPage() {
  return (
    <Suspense fallback={<Loading text="Loading documents..." />}>
      <DocumentsContent />
    </Suspense>
  );
}
