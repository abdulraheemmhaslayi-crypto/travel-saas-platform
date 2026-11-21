'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/slices/fleetSlice';
import { useAppStore } from '@/store';
import Loading from '@/components/common/Loading';
import DataTable from '@/components/admin/DataTable';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { AlertCircle, Plus, RefreshCw, UserPlus, Users, FileText, Activity, UserCog, Star, Car, Briefcase, CheckCircle, X } from 'lucide-react';

type DriverTab = 'all' | 'assignments' | 'documents' | 'performance';

const validTabs: DriverTab[] = ['all', 'assignments', 'documents', 'performance'];

function FleetOwnerDriversPageContent() {
  const { drivers, vehicles, isLoading, error, getDrivers, addDriver, getVehicles, assignVehicleToDriver } = useFleetStore();
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [addDriverMode, setAddDriverMode] = useState<'link' | 'register'>('link');
  const [driverForm, setDriverForm] = useState({ emailOrPhone: '', licenseNumber: '' });
  const [personalDriverForm, setPersonalDriverForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseDocument: '',
    experienceYears: '',
  });
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);

  // Assign vehicle modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriverForAssign, setSelectedDriverForAssign] = useState<any | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);

  // Derive current tab from URL ?tab= param
  const tabParam = (searchParams.get('tab') || '').toLowerCase();
  const currentTab: DriverTab = validTabs.includes(tabParam as DriverTab) ? (tabParam as DriverTab) : 'all';

  const setCurrentTab = (tab: DriverTab) => {
    if (tab === 'all') {
      router.push('/dashboard/fleet-owner/drivers', { scroll: false });
    } else {
      router.push(`/dashboard/fleet-owner/drivers?tab=${tab}`, { scroll: false });
    }
  };

  useEffect(() => {
    getDrivers();
    getVehicles();
  }, [getDrivers, getVehicles]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDriver(true);
    setDriverError(null);
    try {
      if (addDriverMode === 'link') {
        if (!driverForm.emailOrPhone.trim()) {
          setDriverError('Please enter an email or phone number');
          setIsAddingDriver(false);
          return;
        }
        await addDriver({
          emailOrPhone: driverForm.emailOrPhone.trim(),
          email: driverForm.emailOrPhone.includes('@') ? driverForm.emailOrPhone.trim() : undefined,
          phone: !driverForm.emailOrPhone.includes('@') ? driverForm.emailOrPhone.trim() : undefined,
          licenseNumber: driverForm.licenseNumber.trim() || undefined,
        } as any);
      } else {
        if (!personalDriverForm.firstName.trim() || !personalDriverForm.phone.trim() || !personalDriverForm.licenseNumber.trim()) {
          setDriverError('Please fill in First Name, Phone Number, and Driving License Number');
          setIsAddingDriver(false);
          return;
        }
        await addDriver({
          firstName: personalDriverForm.firstName.trim(),
          lastName: personalDriverForm.lastName.trim() || undefined,
          phone: personalDriverForm.phone.trim(),
          email: personalDriverForm.email.trim() || undefined,
          emailOrPhone: personalDriverForm.phone.trim(),
          licenseNumber: personalDriverForm.licenseNumber.trim(),
          licenseDocument: personalDriverForm.licenseDocument || undefined,
          experienceYears: personalDriverForm.experienceYears ? Number(personalDriverForm.experienceYears) : undefined,
        } as any);
      }
      setShowAddDriverModal(false);
      setDriverForm({ emailOrPhone: '', licenseNumber: '' });
      setPersonalDriverForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        licenseNumber: '',
        licenseDocument: '',
        experienceYears: '',
      });
      getDrivers();
    } catch (err: any) {
      setDriverError(err.response?.data?.message || err.message || 'Failed to add driver');
    } finally {
      setIsAddingDriver(false);
    }
  };

  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverForAssign) return;
    setIsAssigningVehicle(true);
    try {
      await assignVehicleToDriver(selectedDriverForAssign.id, selectedVehicleId || undefined);
      showToast(selectedVehicleId ? 'Vehicle assigned successfully!' : 'Vehicle unassigned successfully!', 'success');
      setShowAssignModal(false);
      setSelectedDriverForAssign(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign vehicle';
      showToast(msg, 'error');
    } finally {
      setIsAssigningVehicle(false);
    }
  };

  // ─── Column sets for different tabs ───────────────────────────────────

  const allColumns = [
    {
      key: 'name',
      header: 'Driver',
      render: (driver: any) => (
        <div>
          <p className="font-medium text-gray-900">{driver.name || 'Unnamed Driver'}</p>
          <p className="text-sm text-gray-500">{driver.email || driver.phone}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (driver: any) => driver.phone || 'N/A',
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (driver: any) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          driver.isVerified || driver.verificationStatus === 'VERIFIED'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {driver.isVerified || driver.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (driver: any) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          driver.status === 'ACTIVE'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {driver.status}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (driver: any) => `${driver.rating?.toFixed?.(1) ?? 'N/A'}`,
    },
    {
      key: 'activeTrips',
      header: 'Active Trips',
      render: (driver: any) => driver.activeTrips ?? 0,
    },
    {
      key: 'trips',
      header: 'Total Trips',
      render: (driver: any) => driver.totalTrips ?? 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (driver: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedDriverForAssign(driver);
              setSelectedVehicleId(driver.assignedVehicle?.id || driver.assignedVehicleId || '');
              setShowAssignModal(true);
            }}
          >
            Assign
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setCurrentTab('documents')}>Docs</Button>
        </div>
      ),
    },
  ];

  const assignmentColumns = [
    {
      key: 'name',
      header: 'Driver',
      render: (driver: any) => (
        <div>
          <p className="font-medium text-gray-900">{driver.name || 'Unnamed Driver'}</p>
          <p className="text-xs text-gray-500">{driver.email || driver.phone}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (driver: any) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {driver.status || 'N/A'}
        </span>
      ),
    },
    {
      key: 'assignedVehicle',
      header: 'Assigned Vehicle',
      render: (driver: any) => {
        const vehicle = driver.assignedVehicle || driver.vehicle;
        if (vehicle) {
          return (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{vehicle.brand || vehicle.make} {vehicle.model}</p>
                <p className="text-xs text-gray-500 font-mono">{vehicle.registrationNumber}</p>
              </div>
            </div>
          );
        }
        return <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Unassigned</span>;
      },
    },
    {
      key: 'activeTrips',
      header: 'Active Trips',
      render: (driver: any) => (
        <span className="text-sm font-semibold text-gray-700">{driver.activeTrips ?? 0}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (driver: any) => (
        <Button
          size="sm"
          variant="secondary"
          className="gap-1.5"
          onClick={() => {
            setSelectedDriverForAssign(driver);
            setSelectedVehicleId(driver.assignedVehicle?.id || driver.assignedVehicleId || '');
            setShowAssignModal(true);
          }}
        >
          <UserCog className="w-3.5 h-3.5" />
          {driver.assignedVehicle || driver.assignedVehicleId ? 'Change Vehicle' : 'Assign Vehicle'}
        </Button>
      ),
    },
  ];

  const documentColumns = [
    {
      key: 'name',
      header: 'Driver',
      render: (driver: any) => (
        <div>
          <p className="font-medium text-gray-900">{driver.name || 'Unnamed Driver'}</p>
          <p className="text-xs text-gray-500">{driver.email || driver.phone}</p>
        </div>
      ),
    },
    {
      key: 'licenseNumber',
      header: 'License Number',
      render: (driver: any) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
          {driver.licenseNumber || driver.drivingLicense || '—'}
        </span>
      ),
    },
    {
      key: 'verification',
      header: 'Document Status',
      render: (driver: any) => {
        const verified = driver.isVerified || driver.verificationStatus === 'VERIFIED';
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {verified ? '✓ Verified' : '⏳ Pending Review'}
          </span>
        );
      },
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      render: (driver: any) => {
        const kyc = driver.kycStatus || (driver.isVerified ? 'COMPLETED' : 'PENDING');
        return (
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            kyc === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {kyc}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (driver: any) => (
        <Button size="sm" variant="secondary" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Manage Documents
        </Button>
      ),
    },
  ];

  const performanceColumns = [
    {
      key: 'name',
      header: 'Driver',
      render: (driver: any) => (
        <div>
          <p className="font-medium text-gray-900">{driver.name || 'Unnamed Driver'}</p>
          <p className="text-xs text-gray-500">{driver.email || driver.phone}</p>
        </div>
      ),
    },
    {
      key: 'totalTrips',
      header: 'Total Trips',
      render: (driver: any) => (
        <span className="text-sm font-bold text-gray-900">{driver.totalTrips ?? 0}</span>
      ),
    },
    {
      key: 'activeTrips',
      header: 'Active Trips',
      render: (driver: any) => (
        <span className="text-sm font-semibold text-blue-700">{driver.activeTrips ?? 0}</span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (driver: any) => {
        const rating = driver.rating?.toFixed?.(1) ?? 'N/A';
        const stars = Math.round(driver.rating || 0);
        return (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-700">{rating}</span>
          </div>
        );
      },
    },
    {
      key: 'earnings',
      header: 'Earnings',
      render: (driver: any) => (
        <span className="text-sm font-bold text-emerald-700">
          ₹{Number(driver.totalEarnings || driver.earnings || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (driver: any) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
          driver.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {driver.status}
        </span>
      ),
    },
  ];

  const getColumns = () => {
    switch (currentTab) {
      case 'assignments': return assignmentColumns;
      case 'documents': return documentColumns;
      case 'performance': return performanceColumns;
      default: return allColumns;
    }
  };

  const getTableTitle = () => {
    switch (currentTab) {
      case 'assignments': return 'Driver-Vehicle Assignments';
      case 'documents': return 'Driver Documents & Compliance';
      case 'performance': return 'Driver Performance Metrics';
      default: return 'Fleet Drivers';
    }
  };

  // ─── Stats Summary ────────────────────────────────────────────────────
  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length;
  const verifiedDrivers = drivers.filter(d => d.isVerified || d.verificationStatus === 'VERIFIED').length;
  const avgRating = drivers.length > 0
    ? (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Drivers
          </h1>
          <p className="text-gray-600 mt-1">View your fleet drivers and their performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={getDrivers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddDriverModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Drivers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalDrivers}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{activeDrivers}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Verified</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{verifiedDrivers}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Avg Rating</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{avgRating}</p>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { id: 'all' as const, label: 'All Drivers', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'assignments' as const, label: 'Assignments', icon: <UserCog className="w-3.5 h-3.5" /> },
            { id: 'documents' as const, label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
            { id: 'performance' as const, label: 'Performance', icon: <Activity className="w-3.5 h-3.5" /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                currentTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <Loading text="Loading drivers..." />
      ) : (
        <DataTable
          title={getTableTitle()}
          subtitle={currentTab === 'all' ? 'Active driver roster' : undefined}
          columns={getColumns()}
          data={drivers}
          keyExtractor={(driver) => driver.id}
          isLoading={isLoading}
          totalCount={drivers.length}
          page={1}
          onPageChange={() => undefined}
          emptyMessage="No drivers found"
        />
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add Driver to Fleet</h3>
            <p className="text-xs text-gray-500 mb-4">
              Link an existing user account or register your personal driver directly with their details & license.
            </p>

            {/* Mode selection tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setAddDriverMode('link')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  addDriverMode === 'link'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Link Registered User
              </button>
              <button
                type="button"
                onClick={() => setAddDriverMode('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  addDriverMode === 'register'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Register Personal Driver
              </button>
            </div>

            {driverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{driverError}</span>
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-4">
              {addDriverMode === 'link' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver's Email or Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. driver@email.com or +919876543210"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      value={driverForm.emailOrPhone}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, emailOrPhone: e.target.value }))}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      If the user already has an account, they will automatically be linked and assigned as a driver to your fleet.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL-1420110012345"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      value={driverForm.licenseNumber}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ramesh"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.firstName}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="Patil"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.lastName}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 43210"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.phone}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="driver@example.com"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.email}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Driving License Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="MH14 20110012345"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.licenseNumber}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="5"
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                        value={personalDriverForm.experienceYears}
                        onChange={(e) => setPersonalDriverForm(prev => ({ ...prev, experienceYears: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">License Document / Photo</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setDriverError('License file must be less than 5MB');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPersonalDriverForm(prev => ({ ...prev, licenseDocument: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border rounded-md p-1"
                    />
                    {personalDriverForm.licenseDocument && (
                      <p className="text-[11px] text-green-600 mt-1 font-medium">✓ License document attached</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddDriverModal(false);
                    setDriverError(null);
                  }}
                  disabled={isAddingDriver}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingDriver}>
                  {isAddingDriver ? 'Adding Driver...' : (addDriverMode === 'link' ? 'Link Driver' : 'Save Driver')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {showAssignModal && selectedDriverForAssign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Assign Vehicle</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDriverForAssign(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Driver Summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 mb-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Driver Details</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedDriverForAssign.name || 'Unnamed Driver'}</p>
                  <p className="text-xs text-gray-600">{selectedDriverForAssign.phone || selectedDriverForAssign.email}</p>
                  {selectedDriverForAssign.licenseNumber && (
                    <p className="text-xs text-gray-500 font-mono mt-0.5">DL: {selectedDriverForAssign.licenseNumber}</p>
                  )}
                </div>
                {selectedDriverForAssign.assignedVehicle ? (
                  <div className="text-right">
                    <span className="text-[11px] bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full inline-block">
                      Currently Assigned
                    </span>
                    <p className="text-xs font-medium text-gray-700 mt-1 capitalize">
                      {selectedDriverForAssign.assignedVehicle.brand || selectedDriverForAssign.assignedVehicle.make}{' '}
                      {selectedDriverForAssign.assignedVehicle.model}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono">
                      {selectedDriverForAssign.assignedVehicle.registrationNumber}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                    Currently Unassigned
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleAssignVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select Vehicle to Assign
                </label>
                {vehicles.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    No vehicles found in your fleet. Please add a vehicle from the Vehicles section first.
                  </div>
                ) : (
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white"
                  >
                    <option value="">-- None / Unassign Vehicle --</option>
                    {vehicles.map((v) => {
                      const vId = v.id || v.fleetVehicleId || '';
                      const brand = v.brand || v.make || 'Vehicle';
                      const model = v.model || '';
                      const regNo = v.registrationNumber || '';
                      const seats = v.seatingCapacity || v.capacity || 4;
                      return (
                        <option key={vId} value={vId}>
                          {brand} {model} ({regNo}) — {seats} Seats ({v.status || 'Active'})
                        </option>
                      );
                    })}
                  </select>
                )}
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Selecting a vehicle will assign it exclusively to this driver. Selecting &quot;None / Unassign&quot; will release the vehicle.
                </p>
              </div>

              {/* Vehicle preview if selected */}
              {selectedVehicleId && (() => {
                const sel = vehicles.find((v) => (v.id || v.fleetVehicleId) === selectedVehicleId);
                if (!sel) return null;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-gray-800">
                      <span>{sel.brand || sel.make} {sel.model}</span>
                      <span className="font-mono text-blue-600">{sel.registrationNumber}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-gray-500 pt-1">
                      <span>Seats: <strong>{sel.seatingCapacity || sel.capacity || 4}</strong></span>
                      {sel.fuelType && <span>Fuel: <strong className="capitalize">{sel.fuelType}</strong></span>}
                      {sel.transmission && <span>Transmission: <strong className="capitalize">{sel.transmission}</strong></span>}
                      {sel.type && <span>Type: <strong className="capitalize">{sel.type}</strong></span>}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedDriverForAssign(null);
                  }}
                  disabled={isAssigningVehicle}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAssigningVehicle || (vehicles.length === 0 && !selectedDriverForAssign?.assignedVehicle)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAssigningVehicle
                    ? 'Processing...'
                    : !selectedVehicleId && selectedDriverForAssign?.assignedVehicle
                    ? 'Unassign Vehicle'
                    : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}


export default function FleetOwnerDriversPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500 font-medium animate-pulse">Loading fleet drivers...</p>
        </div>
      }
    >
      <FleetOwnerDriversPageContent />
    </React.Suspense>
  );
}
