'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import StatCard from '@/components/admin/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import TextArea from '@/components/ui/TextArea';
import Input from '@/components/ui/Input';
import Loading from '@/components/common/Loading';
import type { Vehicle, VehicleStats, VehicleStatus } from '@/types/vehicle';
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  Check,
  X,
  ShieldOff,
  RefreshCw,
  Search,
  AlertTriangle,
} from 'lucide-react';

type TabStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

const STATUS_BADGE_MAP: Record<string, { variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  suspended: { variant: 'default', label: 'Suspended' },
  active: { variant: 'success', label: 'Active' },
  inactive: { variant: 'default', label: 'Inactive' },
  maintenance: { variant: 'info', label: 'Maintenance' },
};

export default function AdminVehicleManagementPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading vehicle center..." />}>
      <AdminVehicleManagementContent />
    </Suspense>
  );
}

function AdminVehicleManagementContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeTabQuery = searchParams.get('tab');
  const adminRole = params?.adminRole as string || 'admin';
  const { showToast } = useAppStore();

  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats>({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Pagination & filter
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [page, setPage] = useState(1);
  const [docsPage, setDocsPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'suspend' | 'reactivate';
    vehicle: Vehicle;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const response = await apiClient.getAdminVehicleStats();
      const data = response.data?.data || response.data;
      setStats(data);
    } catch {
      // Stats are non-critical; fail silently
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit: 10,
        status: activeTab,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const response = await apiClient.getAdminVehicles(params);
      const payload = response.data;
      const data = payload.data || payload;
      setVehicles(Array.isArray(data) ? data : []);
      setTotalCount(payload.meta?.total || (Array.isArray(data) ? data.length : 0));
    } catch {
      showToast('Unable to load vehicles', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, searchQuery, showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Reset page when switching tabs or searching
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  const handleAction = async () => {
    if (!actionModal) return;
    const { type, vehicle } = actionModal;

    if ((type === 'reject' || type === 'suspend') && !actionReason.trim()) {
      showToast('Please provide a reason', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      switch (type) {
        case 'approve':
          await apiClient.verifyVehicle(vehicle.id, { status: 'approved' });
          showToast(`Vehicle ${vehicle.registrationNumber} approved successfully`, 'success');
          break;
        case 'reject':
          await apiClient.verifyVehicle(vehicle.id, { status: 'rejected', reason: actionReason });
          showToast(`Vehicle ${vehicle.registrationNumber} rejected`, 'success');
          break;
        case 'suspend':
          await apiClient.suspendVehicle(vehicle.id, { reason: actionReason });
          showToast(`Vehicle ${vehicle.registrationNumber} suspended`, 'success');
          break;
        case 'reactivate':
          await apiClient.reactivateVehicle(vehicle.id);
          showToast(`Vehicle ${vehicle.registrationNumber} reactivated`, 'success');
          break;
      }
      setActionModal(null);
      setActionReason('');
      loadVehicles();
      loadStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to ${type} vehicle`;
      showToast(msg, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openActionModal = (type: 'approve' | 'reject' | 'suspend' | 'reactivate', vehicle: Vehicle) => {
    setActionReason('');
    setActionModal({ type, vehicle });
  };

  const tabs: { key: TabStatus; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" />, count: stats.pending },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" />, count: stats.approved },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" />, count: stats.rejected },
    { key: 'suspended', label: 'Suspended', icon: <Ban className="w-4 h-4" />, count: stats.suspended },
  ];

  const getActionButtons = (vehicle: Vehicle) => {
    const status = vehicle.status?.toLowerCase();
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/${adminRole}/vehicles/${vehicle.id}`); }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        {status === 'pending' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); openActionModal('approve', vehicle); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              title="Approve"
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); openActionModal('reject', vehicle); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              title="Reject"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}
        {status === 'approved' && (
          <button
            onClick={(e) => { e.stopPropagation(); openActionModal('suspend', vehicle); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            title="Suspend"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Suspend
          </button>
        )}
        {status === 'suspended' && (
          <button
            onClick={(e) => { e.stopPropagation(); openActionModal('reactivate', vehicle); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            title="Reactivate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reactivate
          </button>
        )}
      </div>
    );
  };

  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Truck className="w-5 h-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{vehicle.brand} {vehicle.model}</p>
            <p className="text-xs text-gray-500">{vehicle.year} · {vehicle.color}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'registration',
      header: 'Registration',
      render: (vehicle: Vehicle) => (
        <span className="font-mono text-sm text-gray-800 bg-gray-50 px-2 py-0.5 rounded">
          {vehicle.registrationNumber}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (vehicle: Vehicle) => (
        <span className="capitalize text-sm text-gray-700">{vehicle.type}</span>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (vehicle: Vehicle) => (
        <div className="text-sm">
          <p className="text-gray-900 font-medium">
            {vehicle.owner ? `${vehicle.owner.firstName} ${vehicle.owner.lastName}` : '—'}
          </p>
          {vehicle.owner?.phone && (
            <p className="text-gray-500 text-xs">{vehicle.owner.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (vehicle: Vehicle) => {
        const statusInfo = STATUS_BADGE_MAP[vehicle.status?.toLowerCase()] || STATUS_BADGE_MAP.pending;
        return (
          <Badge variant={statusInfo.variant} size="sm" dot>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (vehicle: Vehicle) => (
        <span className="text-sm text-gray-600">
          {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vehicle: Vehicle) => getActionButtons(vehicle),
    },
  ];

  const getModalConfig = () => {
    if (!actionModal) return { title: '', description: '', confirmLabel: '', confirmColor: '' };
    const { type, vehicle } = actionModal;
    const vehicleName = `${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber})`;
    switch (type) {
      case 'approve':
        return {
          title: 'Approve Vehicle',
          description: `Are you sure you want to approve ${vehicleName}? This vehicle will become available for trip assignments.`,
          confirmLabel: 'Approve Vehicle',
          confirmColor: 'bg-green-600 hover:bg-green-700',
        };
      case 'reject':
        return {
          title: 'Reject Vehicle',
          description: `Provide a reason for rejecting ${vehicleName}. The vehicle owner will be notified.`,
          confirmLabel: 'Reject Vehicle',
          confirmColor: 'bg-red-600 hover:bg-red-700',
        };
      case 'suspend':
        return {
          title: 'Suspend Vehicle',
          description: `Provide a reason for suspending ${vehicleName}. It will be removed from active service.`,
          confirmLabel: 'Suspend Vehicle',
          confirmColor: 'bg-orange-600 hover:bg-orange-700',
        };
      case 'reactivate':
        return {
          title: 'Reactivate Vehicle',
          description: `Are you sure you want to reactivate ${vehicleName}? This will restore the vehicle to approved status.`,
          confirmLabel: 'Reactivate Vehicle',
          confirmColor: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const modalConfig = getModalConfig();

  const renderVehicleTypes = () => {
    const typeCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const t = v.type?.toLowerCase() || 'other';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });

    const definedTypes = [
      { key: 'hatchback', label: 'Hatchback', capacity: '4+1 Seats', base: '₹100', kmRate: '₹11/km', desc: 'Affordable compact city rides', count: typeCounts['hatchback'] || 0 },
      { key: 'sedan', label: 'Sedan', capacity: '4+1 Seats', base: '₹150', kmRate: '₹14/km', desc: 'Standard comfortable sedans', count: typeCounts['sedan'] || 0 },
      { key: 'suv', label: 'SUV', capacity: '6+1 Seats', base: '₹250', kmRate: '₹18/km', desc: 'Spacious SUVs for group/family trips', count: typeCounts['suv'] || 0 },
      { key: 'luxury', label: 'Luxury', capacity: '4+1 Seats', base: '₹400', kmRate: '₹28/km', desc: 'Premium top-tier luxury cruisers', count: typeCounts['luxury'] || 0 },
      { key: 'van', label: 'Van / MPV', capacity: '7+1 Seats', base: '₹350', kmRate: '₹22/km', desc: 'Multi-purpose vans for larger travel groups', count: typeCounts['van'] || typeCounts['mpv'] || 0 },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vehicle Categories Configuration</h2>
              <p className="text-sm text-gray-500">Manage base rates, dimensions, capacities and active fleets per type</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {definedTypes.map((typeObj) => (
              <div key={typeObj.key} className="border border-slate-200 hover:border-primary-500 rounded-xl p-5 hover:shadow-md transition-all bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-lg capitalize">{typeObj.label}</h3>
                    <Badge variant="info" className="text-[10px] uppercase font-bold">{typeObj.capacity}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{typeObj.desc}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t pt-3">
                    <div>
                      <p className="text-gray-400 font-medium">Base Fare</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{typeObj.base}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Per KM Rate</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{typeObj.kmRate}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-slate-650 font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                    {typeObj.count} Registered
                  </span>
                  <button type="button" onClick={() => showToast('Rates locked by platform supervisor', 'info')} className="text-xs text-primary-650 hover:underline font-bold">
                    Edit Rates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVehicleDocuments = () => {
    const docList: Array<{
      id: string;
      vehicle: Vehicle;
      type: string;
      number: string;
      expiry?: string;
      url: string;
      status: string;
    }> = [];

    vehicles.forEach((vehicle) => {
      if (vehicle.rcDocument) {
        docList.push({
          id: `${vehicle.id}-rc`,
          vehicle,
          type: 'Registration Certificate (RC)',
          number: vehicle.rcNumber || 'N/A',
          url: vehicle.rcDocument,
          status: vehicle.status,
        });
      }
      if (vehicle.insuranceDocument) {
        docList.push({
          id: `${vehicle.id}-insurance`,
          vehicle,
          type: 'Insurance Policy',
          number: vehicle.insuranceNumber || 'N/A',
          expiry: vehicle.insuranceExpiry,
          url: vehicle.insuranceDocument,
          status: vehicle.status,
        });
      }
      if (vehicle.permitDocument) {
        docList.push({
          id: `${vehicle.id}-permit`,
          vehicle,
          type: 'Permit Certificate',
          number: vehicle.permitNumber || 'N/A',
          expiry: vehicle.permitExpiry,
          url: vehicle.permitDocument,
          status: vehicle.status,
        });
      }
      if (vehicle.documents && Array.isArray(vehicle.documents)) {
        vehicle.documents.forEach((doc) => {
          docList.push({
            id: doc.id,
            vehicle,
            type: doc.documentType?.toUpperCase() || 'Other Document',
            number: doc.documentNumber || 'N/A',
            expiry: doc.expiryDate,
            url: doc.documentUrl,
            status: doc.status,
          });
        });
      }
    });

    const docColumns = [
      {
        key: 'vehicle',
        header: 'Vehicle Details',
        render: (doc: any) => (
          <div>
            <p className="font-semibold text-gray-900">{doc.vehicle.brand} {doc.vehicle.model}</p>
            <p className="text-xs font-mono text-gray-500">{doc.vehicle.registrationNumber}</p>
          </div>
        ),
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (doc: any) => (
          <div className="text-xs text-gray-700">
            <p className="font-semibold">{doc.vehicle.owner ? `${doc.vehicle.owner.firstName} ${doc.vehicle.owner.lastName}` : 'N/A'}</p>
            <p className="text-gray-400">{doc.vehicle.owner?.phone}</p>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Document Type',
        render: (doc: any) => (
          <Badge variant="info" size="sm" className="font-bold">{doc.type}</Badge>
        ),
      },
      {
        key: 'details',
        header: 'Doc Details',
        render: (doc: any) => (
          <div className="text-xs">
            <p className="font-mono text-slate-700 font-bold">{doc.number}</p>
            {doc.expiry && (
              <p className="text-gray-450 mt-0.5">Expires: {new Date(doc.expiry).toLocaleDateString()}</p>
            )}
          </div>
        ),
      },
      {
        key: 'file',
        header: 'File Link',
        render: (doc: any) => (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all border border-slate-200"
          >
            View File
          </a>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (doc: any) => {
          const statusInfo = STATUS_BADGE_MAP[doc.status?.toLowerCase()] || STATUS_BADGE_MAP.pending;
          return <Badge variant={statusInfo.variant} size="sm">{statusInfo.label}</Badge>;
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (doc: any) => (
          <div className="flex gap-2">
            {doc.status === 'pending' ? (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/35 text-[10px] py-1 px-2.5 font-bold shadow-none"
                  onClick={() => openActionModal('approve', doc.vehicle)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/35 text-[10px] py-1 px-2.5 font-bold shadow-none"
                  onClick={() => openActionModal('reject', doc.vehicle)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <span className="text-xs text-gray-400 font-medium">No actions pending</span>
            )}
          </div>
        ),
      },
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          title="Vehicle Compliance Documents Review Checklist"
          subtitle={`${docList.length} total document certificates submitted`}
          columns={docColumns}
          data={docList}
          keyExtractor={(doc) => doc.id}
          isLoading={isLoading}
          totalCount={docList.length}
          page={docsPage}
          onPageChange={setDocsPage}
          emptyMessage="No vehicle compliance documents uploaded currently."
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary-600" />
            {activeTabQuery === 'types' ? 'Vehicle Types & Pricing Config' : activeTabQuery === 'documents' ? 'Vehicle Documents Approval Center' : 'Vehicle Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTabQuery === 'types' ? 'Manage categories and configurations' : activeTabQuery === 'documents' ? 'Audit compliance and registration certificates' : 'Review, approve, and manage vehicle registrations'}
          </p>
        </div>
        <Button onClick={() => { loadVehicles(); loadStats(); }} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {activeTabQuery === 'types' ? (
        renderVehicleTypes()
      ) : activeTabQuery === 'documents' ? (
        renderVehicleDocuments()
      ) : (
        <>

      {/* Stat Cards */}
      {isStatsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Vehicles"
            value={stats.total}
            icon={<Truck className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={<Clock className="w-5 h-5" />}
            color="yellow"
          />
          <StatCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
          <StatCard
            title="Suspended"
            value={stats.suspended}
            icon={<Ban className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 pt-4 gap-4">
            <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Vehicle status tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-700 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          {isLoading ? (
            <div className="p-12">
              <Loading text={`Loading ${activeTab} vehicles...`} />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {activeTab} vehicles</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                {activeTab === 'pending'
                  ? 'There are no vehicles waiting for approval at the moment.'
                  : `No vehicles with ${activeTab} status found.`}
              </p>
            </div>
          ) : (
            <DataTable
              title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Vehicles`}
              subtitle={`${totalCount} vehicle${totalCount !== 1 ? 's' : ''} found`}
              columns={columns}
              data={vehicles}
              keyExtractor={(v) => v.id}
              isLoading={isLoading}
              totalCount={totalCount}
              page={page}
              onPageChange={setPage}
              onRowClick={(vehicle) => router.push(`/${adminRole}/vehicles/${vehicle.id}`)}
              emptyMessage={`No ${activeTab} vehicles`}
            />
          )}
        </div>
      </div>
      </>
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setActionReason(''); }}
        title={modalConfig.title}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => { setActionModal(null); setActionReason(''); }}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleAction}
              disabled={isActionLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${modalConfig.confirmColor}`}
            >
              {isActionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {modalConfig.confirmLabel}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {actionModal && (
            <>
              {actionModal.type === 'approve' || actionModal.type === 'reactivate' ? (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{modalConfig.description}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">{modalConfig.description}</p>
                  </div>
                  <TextArea
                    label="Reason"
                    placeholder={`Enter reason for ${actionModal.type}ing this vehicle...`}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </>
              )}

              {/* Vehicle Summary in Modal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Vehicle:</span>{' '}
                    <span className="font-medium text-gray-900">{actionModal.vehicle.brand} {actionModal.vehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Registration:</span>{' '}
                    <span className="font-mono font-medium text-gray-900">{actionModal.vehicle.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>{' '}
                    <span className="capitalize text-gray-900">{actionModal.vehicle.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>{' '}
                    <span className="text-gray-900">
                      {actionModal.vehicle.owner
                        ? `${actionModal.vehicle.owner.firstName} ${actionModal.vehicle.owner.lastName}`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}