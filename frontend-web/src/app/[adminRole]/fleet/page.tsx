'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { 
  Plus, 
  Building2, 
  Car, 
  Users, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Mail, 
  Phone as PhoneIcon, 
  User as UserIcon, 
  Search, 
  ShieldAlert, 
  Activity, 
  Route, 
  Wrench 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FleetOwner {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface Fleet {
  id: string;
  name: string;
  owner: FleetOwner | string;
  vehicleCount: number;
  totalTrips: number;
  revenue: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface FleetAnalytics {
  fleetId: string;
  fleetName: string;
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalKmDriven: number;
  totalRevenue: number;
  totalMaintenanceCost: number;
  averageFuelEfficiency: number;
  vehicleUtilization: number;
}

export default function AdminFleetPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading fleet configuration..." />}>
      <AdminFleetContent />
    </Suspense>
  );
}

function AdminFleetContent() {
  const { showToast } = useAppStore();
  const params = useParams();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const adminRole = params?.adminRole as string || 'admin';

  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [manageTab, setManageTab] = useState<'overview' | 'edit' | 'danger'>('overview');
  
  // Analytics State
  const [analyticsData, setAnalyticsData] = useState<FleetAnalytics | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Fleet Vehicles State (Moved here to follow React Rules of Hooks)
  const [fleetVehicles, setFleetVehicles] = useState<any[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);
  const [vehiclesPage, setVehiclesPage] = useState(1);

  useEffect(() => {
    loadFleets();
  }, []);

  const loadFleetVehicles = async () => {
    setIsVehiclesLoading(true);
    try {
      const response = await apiClient.getAdminVehicles({ limit: 100 });
      const allVehicles = response.data?.data || response.data || [];
      const filtered = allVehicles.filter((v: any) => v.fleetCompanyId || v.fleetCompany);
      setFleetVehicles(filtered);
    } catch (error) {
      showToast('Failed to load fleet vehicles', 'error');
    } finally {
      setIsVehiclesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'vehicles') {
      loadFleetVehicles();
    }
  }, [tab]);

  const loadFleets = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getFleets();
      setFleets(response.data.data || response.data);
    } catch (error) {
      showToast('Failed to load fleets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFleet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const companyName = String(formData.get('companyName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const phone = String(formData.get('phone') ?? '').trim();

    if (!companyName || !email || !phone) {
      showToast('Fleet name, email, and phone are required.', 'error');
      return;
    }

    try {
      await apiClient.createFleet({ companyName, email, phone });
      showToast('Fleet created successfully', 'success');
      setShowCreateModal(false);
      loadFleets();
    } catch (error) {
      showToast('Failed to create fleet', 'error');
    }
  };

  const handleManageFleet = (fleet: Fleet) => {
    setEditingFleet(fleet);
    setShowManageModal(true);
  };

  const handleUpdateFleet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFleet) return;

    const formData = new FormData(e.currentTarget);
    const fleetData = {
      name: String(formData.get('fleetName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      status: String(formData.get('status') ?? 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
    };

    try {
      await apiClient.updateFleet(editingFleet.id, fleetData);
      showToast('Fleet updated successfully', 'success');
      setShowManageModal(false);
      setEditingFleet(null);
      loadFleets();
    } catch (error) {
      showToast('Failed to update fleet', 'error');
    }
  };

  const handleDeleteFleet = async (fleetId: string) => {
    if (!confirm('Are you sure you want to delete this fleet? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteFleet(fleetId);
      showToast('Fleet deleted successfully', 'success');
      setShowManageModal(false);
      setEditingFleet(null);
      loadFleets();
    } catch (error) {
      showToast('Failed to delete fleet', 'error');
    }
  };

  const handleToggleFleetStatus = async (fleetId: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await apiClient.updateFleetStatus(fleetId, newStatus);
      showToast(`Fleet ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`, 'success');
      loadFleets();
    } catch (error) {
      showToast('Failed to update fleet status', 'error');
    }
  };

  const handleShowAnalytics = async (fleet: Fleet) => {
    setSelectedFleet(fleet);
    setIsAnalyticsLoading(true);
    setAnalyticsData(null);
    try {
      const response = await apiClient.getFleetAnalytics(fleet.id);
      setAnalyticsData(response.data.data || response.data);
    } catch (error) {
      showToast('Failed to load fleet analytics', 'error');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const filteredFleets = fleets.filter((fleet) => {
    const ownerName = typeof fleet.owner === 'string'
      ? fleet.owner
      : `${fleet.owner?.firstName || ''} ${fleet.owner?.lastName || ''}`;
    const ownerEmail = typeof fleet.owner === 'string' ? '' : fleet.owner?.email || '';

    const matchesSearch = fleet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || fleet.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <Loading fullScreen text="Loading fleets..." />;
  }

  const renderFleetVehicles = () => {
    const fleetVehicleColumns = [
      {
        key: 'vehicle',
        header: 'Vehicle Model',
        render: (v: any) => (
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <Car className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{v.brand} {v.model}</p>
              <p className="text-xs text-gray-500">{v.year} · {v.color}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'plate',
        header: 'Plate Number',
        render: (v: any) => (
          <span className="font-mono text-sm text-gray-800 bg-gray-50 px-2.5 py-1 rounded border">
            {v.registrationNumber}
          </span>
        ),
      },
      {
        key: 'company',
        header: 'Fleet Company',
        render: (v: any) => (
          <span className="text-sm font-semibold text-slate-800">
            {v.fleetCompany?.name || 'Partner Fleet Operator'}
          </span>
        ),
      },
      {
        key: 'owner',
        header: 'Fleet Owner',
        render: (v: any) => (
          <div className="text-xs">
            <p className="font-bold text-gray-800">{v.owner ? `${v.owner.firstName} ${v.owner.lastName}` : 'N/A'}</p>
            <p className="text-gray-400">{v.owner?.phone}</p>
          </div>
        ),
      },
      {
        key: 'seating',
        header: 'Seating Capacity',
        render: (v: any) => (
          <Badge variant="info" size="sm" className="font-bold">{v.seatingCapacity} Seats</Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (v: any) => {
          const statusVal = v.status?.toLowerCase();
          const variant = statusVal === 'approved' || statusVal === 'active' ? 'success' : statusVal === 'pending' ? 'warning' : 'danger';
          return <Badge variant={variant as any} size="sm" dot>{v.status}</Badge>;
        },
      },
      {
        key: 'action',
        header: 'Details',
        render: (v: any) => (
          <Link href={`/${adminRole}/vehicles/${v.id}`}>
            <Button size="sm" variant="secondary" className="text-xs py-1 px-3">
              View Specs
            </Button>
          </Link>
        ),
      },
    ];

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-0 animate-fadeIn">
        <DataTable
          title="Associated Fleet Vehicles Registered"
          subtitle={`${fleetVehicles.length} total operational fleet vehicles found`}
          columns={fleetVehicleColumns}
          data={fleetVehicles}
          keyExtractor={(v) => v.id}
          isLoading={isVehiclesLoading}
          totalCount={fleetVehicles.length}
          page={vehiclesPage}
          onPageChange={setVehiclesPage}
          emptyMessage="No active vehicles registered under fleet companies currently."
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section with modern Glassmorphic style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {tab === 'vehicles' ? 'Fleet Vehicles Registry' : 'Fleet Management'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Monitor and manage fleet companies, vehicle operations, and partner compliance</p>
        </div>
        <Button leftIcon={<Plus className="w-4.5 h-4.5" />} onClick={() => setShowCreateModal(true)} className="shadow-md shadow-primary-500/10">
          Add Fleet
        </Button>
      </div>

      {tab === 'vehicles' ? (
        renderFleetVehicles()
      ) : (
        <>

      {/* Fleet Stats Grid with Glassmorphic Gradient Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-md border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50" padding="none">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Fleets</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5">{fleets.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-blue-600 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-md border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50" padding="none">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vehicles</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {fleets.reduce((sum, f) => sum + (f.vehicleCount || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
              <Car className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-md border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50" padding="none">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Drivers</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {fleets.reduce((sum, f) => sum + Math.floor((f.vehicleCount || 0) * 1.5), 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center text-amber-600 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-md border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50" padding="none">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5">
                ₹{(fleets.reduce((sum, f) => sum + (f.revenue || 0), 0) / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center text-purple-600 shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar with Custom Buttons/Tabs status selectors */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search fleets by company name or owner contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 rounded-xl text-sm transition-all outline-none"
          />
        </div>
        
        {/* Custom tabs status selector */}
        <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 self-start lg:self-auto">
          {[
            { id: 'ALL', label: 'All Fleets', count: fleets.length },
            { id: 'ACTIVE', label: 'Active', count: fleets.filter(f => f.status === 'ACTIVE').length },
            { id: 'INACTIVE', label: 'Inactive', count: fleets.filter(f => f.status === 'INACTIVE').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5',
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold',
                statusFilter === tab.id ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Fleets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFleets.map((fleet) => (
          <Card key={fleet.id} className="hover:-translate-y-1.5 transition-all duration-300 hover:shadow-lg border border-slate-200/70 relative group overflow-hidden bg-white" padding="none">
            {/* Top color strip */}
            <div className={cn(
              'h-1.5 w-full bg-gradient-to-r',
              fleet.status === 'ACTIVE' ? 'from-emerald-500 to-teal-400' : 'from-slate-300 to-slate-400'
            )} />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className={cn(
                  'p-3 rounded-xl shadow-inner',
                  fleet.status === 'ACTIVE' ? 'bg-primary-50/50 text-primary-600' : 'bg-slate-100 text-slate-500'
                )}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  {fleet.status === 'ACTIVE' && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  <Badge variant={fleet.status === 'ACTIVE' ? 'success' : 'default'} className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                    {fleet.status}
                  </Badge>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">{fleet.name}</h3>
              
              <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate font-medium">
                  {typeof fleet.owner === 'string'
                    ? fleet.owner
                    : `${fleet.owner?.firstName || ''} ${fleet.owner?.lastName || ''}`.trim() || 'Unassigned'
                  }
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 my-5">
                <div className="text-center">
                  <p className="text-lg font-extrabold text-slate-800">{fleet.vehicleCount || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicles</p>
                </div>
                <div className="text-center border-l border-slate-200/70">
                  <p className="text-lg font-extrabold text-slate-800">{fleet.totalTrips || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trips</p>
                </div>
                <div className="text-center border-l border-slate-200/70">
                  <p className="text-lg font-extrabold text-slate-800">
                    ₹{fleet.revenue ? (fleet.revenue / 1000).toFixed(0) : 0}K
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
                </div>
              </div>

              <div className="flex gap-3 mt-2 pt-2 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 font-bold py-2 rounded-xl text-xs"
                  leftIcon={<BarChart3 className="w-4 h-4" />}
                  onClick={() => handleShowAnalytics(fleet)}
                >
                  Analytics
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1 font-bold py-2 rounded-xl text-xs hover:bg-slate-100 hover:text-slate-900"
                  leftIcon={<Settings className="w-4 h-4" />}
                  onClick={() => handleManageFleet(fleet)}
                >
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filteredFleets.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center border border-slate-200/80 rounded-2xl shadow-sm">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Fleets Found</h3>
            <p className="text-slate-500 text-sm mt-1">Try modifying your search query or filters.</p>
          </div>
        )}
      </div>
      </>
      )}

      {/* Create Fleet Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Fleet"
        size="md"
      >
        <form onSubmit={handleCreateFleet} className="space-y-4">
          <Input
            label="Fleet Name"
            name="companyName"
            placeholder="Enter fleet name"
            required
            leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Contact Email"
            name="email"
            type="email"
            placeholder="Enter contact email"
            required
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />
          <Input
            label="Contact Phone"
            name="phone"
            type="tel"
            placeholder="Enter contact phone"
            required
            leftIcon={<PhoneIcon className="w-4 h-4 text-slate-400" />}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Fleet</Button>
          </div>
        </form>
      </Modal>

      {/* Fleet Analytics Modal */}
      {selectedFleet && (
        <Modal
          isOpen={!!selectedFleet}
          onClose={() => setSelectedFleet(null)}
          title={`${selectedFleet.name} - Performance Analytics`}
          size="lg"
        >
          {isAnalyticsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500 animate-pulse">Fetching fleet performance data...</p>
            </div>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* Glassmorphic Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
                <div className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilization</span>
                    <Activity className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{analyticsData.vehicleUtilization}%</span>
                  </div>
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${analyticsData.vehicleUtilization}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distance Driven</span>
                    <Route className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800">{(analyticsData.totalKmDriven || 0).toLocaleString()}</span>
                    <span className="text-xs font-semibold text-slate-400">km</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-3">Cumulative across active vehicles</p>
                </div>

                <div className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 backdrop-blur-md border border-slate-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maintenance</span>
                    <Wrench className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800">₹{(analyticsData.totalMaintenanceCost || 0).toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-4">Total logged servicing charges</p>
                </div>
              </div>

              {/* Status distribution breakdown progress stacking */}
              <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">Fleet Distribution</h4>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {analyticsData.totalVehicles} Vehicles Total
                  </span>
                </div>

                <div className="w-full flex h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${analyticsData.totalVehicles ? (analyticsData.activeVehicles / analyticsData.totalVehicles) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Active: ${analyticsData.activeVehicles}`}
                  />
                  <div 
                    style={{ width: `${analyticsData.totalVehicles ? (analyticsData.maintenanceVehicles / analyticsData.totalVehicles) * 100 : 0}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`In Maintenance: ${analyticsData.maintenanceVehicles}`}
                  />
                  <div 
                    style={{ width: `${analyticsData.totalVehicles ? (((analyticsData.totalVehicles - analyticsData.activeVehicles - analyticsData.maintenanceVehicles)) / analyticsData.totalVehicles) * 100 : 0}%` }}
                    className="bg-slate-400 h-full transition-all duration-500"
                    title={`Offline/Other: ${analyticsData.totalVehicles - analyticsData.activeVehicles - analyticsData.maintenanceVehicles}`}
                  />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                    <span className="text-slate-600">Active ({analyticsData.activeVehicles})</span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                    <span className="w-3 h-3 rounded bg-amber-500 shrink-0" />
                    <span className="text-slate-600">In Service ({analyticsData.maintenanceVehicles})</span>
                  </div>
                  <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                    <span className="w-3 h-3 rounded bg-slate-400 shrink-0" />
                    <span className="text-slate-600">Offline ({analyticsData.totalVehicles - analyticsData.activeVehicles - analyticsData.maintenanceVehicles})</span>
                  </div>
                </div>
              </div>

              {/* Extra KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/60 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Fuel Efficiency</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">
                      {analyticsData.averageFuelEfficiency > 0 ? analyticsData.averageFuelEfficiency.toFixed(1) : 'N/A'} km/l
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-50/60 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">
                      ₹{(analyticsData.totalRevenue || selectedFleet.revenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-medium">
              No analytics data could be loaded.
            </div>
          )}
        </Modal>
      )}

      {/* Manage Fleet Modal */}
      {showManageModal && editingFleet && (
        <Modal
          isOpen={showManageModal}
          onClose={() => {
            setShowManageModal(false);
            setEditingFleet(null);
            setManageTab('overview');
          }}
          title={`Manage ${editingFleet.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Modal Tabs Header */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setManageTab('overview')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all outline-none -mb-[2px]',
                  manageTab === 'overview'
                    ? 'border-primary-500 text-primary-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setManageTab('edit')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all outline-none -mb-[2px]',
                  manageTab === 'edit'
                    ? 'border-primary-500 text-primary-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                )}
              >
                Edit Details
              </button>
              <button
                onClick={() => setManageTab('danger')}
                className={cn(
                  'px-4 py-2.5 text-sm font-semibold border-b-2 transition-all outline-none -mb-[2px]',
                  manageTab === 'danger'
                    ? 'border-red-500 text-rose-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-rose-500 hover:border-red-200'
                )}
              >
                Danger Zone
              </button>
            </div>

            {/* Overview Tab */}
            {manageTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-slate-100 shadow-sm p-4 bg-slate-50/50" padding="none">
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Operational Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs font-medium text-slate-400">Total Vehicles</p>
                          <p className="text-lg font-bold text-slate-800 mt-0.5">{editingFleet.vehicleCount}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400">Total Trips</p>
                          <p className="text-lg font-bold text-slate-800 mt-0.5">{editingFleet.totalTrips}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400">Total Revenue</p>
                          <p className="text-lg font-bold text-slate-800 mt-0.5">₹{(editingFleet.revenue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400">Status</p>
                          <div className="mt-1">
                            <Badge variant={editingFleet.status === 'ACTIVE' ? 'success' : 'default'} className="uppercase text-[9px] tracking-wider font-bold">
                              {editingFleet.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-slate-100 shadow-sm p-4 bg-slate-50/50" padding="none">
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Owner Contact</h4>
                      <div className="space-y-3.5 text-sm text-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                            <UserIcon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Owner Name</p>
                            <p className="font-semibold text-slate-800">
                              {typeof editingFleet.owner === 'string'
                                ? editingFleet.owner
                                : `${editingFleet.owner?.firstName || ''} ${editingFleet.owner?.lastName || ''}`.trim() || 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                            <Mail className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                            <p className="font-semibold text-slate-800 truncate">
                              {typeof editingFleet.owner === 'string'
                                ? editingFleet.owner
                                : editingFleet.owner?.email || 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                            <PhoneIcon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                            <p className="font-semibold text-slate-800">
                              {typeof editingFleet.owner === 'string'
                                ? editingFleet.owner
                                : editingFleet.owner?.phone || 'N/A'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Edit Details Tab */}
            {manageTab === 'edit' && (
              <form onSubmit={handleUpdateFleet} className="space-y-4 max-w-xl animate-fadeIn">
                <Input
                  label="Fleet Name"
                  name="fleetName"
                  defaultValue={editingFleet.name}
                  placeholder="Enter fleet name"
                  required
                  leftIcon={<Building2 className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="Contact Email"
                  name="email"
                  type="email"
                  defaultValue={typeof editingFleet.owner === 'string' ? editingFleet.owner : editingFleet.owner?.email || ''}
                  placeholder="Enter contact email"
                  required
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="Contact Phone"
                  name="phone"
                  type="tel"
                  defaultValue={typeof editingFleet.owner === 'string' ? editingFleet.owner : editingFleet.owner?.phone || ''}
                  placeholder="Enter contact phone"
                  required
                  leftIcon={<PhoneIcon className="w-4 h-4 text-slate-400" />}
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    name="status"
                    defaultValue={editingFleet.status}
                    className="w-full px-3 py-2.5 border border-slate-200 hover:border-slate-300 focus:border-primary-500 rounded-xl text-sm transition-colors outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" type="button" onClick={() => {
                    setShowManageModal(false);
                    setEditingFleet(null);
                    setManageTab('overview');
                  }} className="rounded-xl py-2 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl py-2 text-xs font-bold">Update Fleet</Button>
                </div>
              </form>
            )}

            {/* Danger Zone Tab */}
            {manageTab === 'danger' && (
              <div className="space-y-5 animate-fadeIn">
                <Card className="border-red-100 bg-red-50/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" padding="none">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Toggle Fleet Status</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Change state of fleet operations. Inactive fleets are hidden from booking searches.</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      className="flex items-center gap-2 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 shrink-0 animate-pulse"
                      onClick={() => handleToggleFleetStatus(editingFleet.id, editingFleet.status)}
                    >
                      {editingFleet.status === 'ACTIVE' ? (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-500" />
                          Deactivate Fleet
                        </>
                      ) : (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                          Activate Fleet
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                <Card className="border-red-100 bg-red-50/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" padding="none">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-8 h-8 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-600">Delete Fleet Company</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Permanently remove this fleet and detach all vehicles. This action is irreversible.</p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      type="button"
                      className="flex items-center gap-2 rounded-xl text-xs font-bold shadow-sm shadow-red-500/10 shrink-0"
                      onClick={() => handleDeleteFleet(editingFleet.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Permanent
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}