'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/slices/fleetSlice';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/slices/authSlice';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/common/EmptyState';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/admin/DataTable';
import {
  Truck,
  Plus,
  ChevronRight,
  CircleDashed,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  FileText,
  Ban,
  AlertTriangle,
  Shield,
  Eye,
  Upload,
  ExternalLink,
  Calendar,
  Coins,
  Settings,
  Zap,
  Wind,
  Wifi,
} from 'lucide-react';

const vehicleTypeOptions = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'mpv', label: 'MPV' },
  { value: 'van', label: 'Van' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'bus', label: 'Bus' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'electric', label: 'Electric' },
];

const fuelTypeOptions = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'CNG', label: 'CNG' },
  { value: 'LPG', label: 'LPG' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Hybrid', label: 'Hybrid' },
];

const transmissionOptions = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automatic', label: 'Automatic' },
];

export default function FleetOwnerVehiclesPage() {
  const {
    currentFleetId,
    currentFleetName,
    vehicles,
    getVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    createFleet,
    getFleetStats,
    getVehicleStats,
    vehicleStats,
    stats,
    isLoading,
    error,
  } = useFleetStore();

  const { showToast } = useAppStore();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive current tab from URL ?tab= param
  type VehicleTab = 'all' | 'types' | 'approval' | 'maintenance' | 'verification';
  const tabParam = (searchParams.get('tab') || '').toLowerCase();
  const currentTab: VehicleTab = (['types', 'approval', 'maintenance', 'verification'] as VehicleTab[]).includes(tabParam as VehicleTab) ? (tabParam as VehicleTab) : 'all';

  const setCurrentTab = (tab: VehicleTab) => {
    if (tab === 'all') {
      router.push('/dashboard/fleet-owner/vehicles', { scroll: false });
    } else {
      router.push(`/dashboard/fleet-owner/vehicles?tab=${tab}`, { scroll: false });
    }
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCreateFleetModal, setShowCreateFleetModal] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  // Selected vehicle for detail/edit/delete
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Forms state
  const [fleetName, setFleetName] = useState('');
  const [form, setForm] = useState({
    registrationNumber: '',
    brand: '',
    model: '',
    year: '',
    type: 'sedan',
    color: '',
    seatingCapacity: '',
    fuelType: '',
    transmission: '',
    vehicleImage: '',
    rcNumber: '',
    rcDocument: '',
    rcDocumentFile: null as File | null,
    insuranceNumber: '',
    insuranceExpiry: '',
    insuranceDocument: '',
    insuranceDocumentFile: null as File | null,
    hasAC: false,
    hasWifi: false,
    hasCharging: false,
    basePrice: '',
    pricePerKm: '',
  });

  const [editForm, setEditForm] = useState({
    brand: '',
    model: '',
    color: '',
    seatingCapacity: '',
    fuelType: '',
    transmission: '',
    vehicleImage: '',
    rcNumber: '',
    rcDocument: '',
    rcDocumentFile: null as File | null,
    insuranceNumber: '',
    insuranceExpiry: '',
    insuranceDocument: '',
    insuranceDocumentFile: null as File | null,
    hasAC: false,
    hasWifi: false,
    hasCharging: false,
    basePrice: '',
    pricePerKm: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingFleet, setIsCreatingFleet] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'docs' | 'status'>('info');

  useEffect(() => {
    getVehicles();
    getVehicleStats();
    getFleetStats();
  }, [getVehicles, getVehicleStats, getFleetStats]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateFleet = async () => {
    if (!fleetName.trim()) {
      showToast('Please enter a name for the fleet.', 'error');
      return;
    }

    if (!user?.email || !user?.phone) {
      showToast('Unable to determine contact info for fleet creation.', 'error');
      return;
    }

    setIsCreatingFleet(true);
    try {
      await createFleet({
        companyName: fleetName.trim(),
        email: user.email,
        phone: user.phone,
      });
      setShowCreateFleetModal(false);
      setFleetName('');
      await getVehicles();
      await getVehicleStats();
      showToast('Fleet created successfully.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create fleet.';
      showToast(message, 'error');
    } finally {
      setIsCreatingFleet(false);
    }
  };

  const handleAddVehicle = async () => {
    const {
      registrationNumber,
      brand,
      model,
      year,
      type,
      color,
      seatingCapacity,
      fuelType,
      transmission,
      vehicleImage,
      rcNumber,
      rcDocument,
      rcDocumentFile,
      insuranceNumber,
      insuranceExpiry,
      insuranceDocument,
      insuranceDocumentFile,
      hasAC,
      hasWifi,
      hasCharging,
      basePrice,
      pricePerKm,
    } = form;

    if (!registrationNumber || !brand || !model || !year || !type || !color || !seatingCapacity) {
      showToast('Please complete all required vehicle fields.', 'error');
      return;
    }

    const parsedYear = Number(year);
    const parsedSeatingCapacity = Number(seatingCapacity);
    const parsedBasePrice = basePrice ? parseFloat(basePrice) : undefined;
    const parsedPricePerKm = pricePerKm ? parseFloat(pricePerKm) : undefined;

    if (Number.isNaN(parsedYear) || Number.isNaN(parsedSeatingCapacity)) {
      showToast('Year and seating capacity must be valid numbers.', 'error');
      return;
    }

    if (parsedYear < 1990 || parsedYear > 2030) {
      showToast('Year must be between 1990 and 2030.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalRcDocumentUrl = rcDocument;
      let finalInsuranceDocumentUrl = insuranceDocument;

      if (rcDocumentFile) {
        finalRcDocumentUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(rcDocumentFile);
        });
      }

      if (insuranceDocumentFile) {
        finalInsuranceDocumentUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(insuranceDocumentFile);
        });
      }

      const payload: any = {
        registrationNumber: registrationNumber.trim(),
        brand: brand.trim(),
        model: model.trim(),
        year: parsedYear,
        type,
        color: color.trim(),
        seatingCapacity: parsedSeatingCapacity,
      };

      if (fuelType) payload.fuelType = fuelType;
      if (transmission) payload.transmission = transmission;
      if (vehicleImage) payload.vehicleImage = vehicleImage.trim();
      if (rcNumber) payload.rcNumber = rcNumber.trim();
      if (finalRcDocumentUrl) payload.rcDocument = finalRcDocumentUrl;
      if (insuranceNumber) payload.insuranceNumber = insuranceNumber.trim();
      if (insuranceExpiry) payload.insuranceExpiry = insuranceExpiry;
      if (finalInsuranceDocumentUrl) payload.insuranceDocument = finalInsuranceDocumentUrl;
      payload.hasAC = hasAC;
      payload.hasWifi = hasWifi;
      payload.hasCharging = hasCharging;
      if (parsedBasePrice !== undefined) payload.basePrice = parsedBasePrice;
      if (parsedPricePerKm !== undefined) payload.pricePerKm = parsedPricePerKm;

      await addVehicle(payload);
      await getVehicles();
      await getVehicleStats();

      setIsAddModalOpen(false);
      setForm({
        registrationNumber: '',
        brand: '',
        model: '',
        year: '',
        type: 'sedan',
        color: '',
        seatingCapacity: '',
        fuelType: '',
        transmission: '',
        vehicleImage: '',
        rcNumber: '',
        rcDocument: '',
        rcDocumentFile: null,
        insuranceNumber: '',
        insuranceExpiry: '',
        insuranceDocument: '',
        insuranceDocumentFile: null,
        hasAC: false,
        hasWifi: false,
        hasCharging: false,
        basePrice: '',
        pricePerKm: '',
      });
      showToast('Vehicle submitted. Status is pending approval.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add vehicle.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setEditForm({
      brand: vehicle.brand || vehicle.make || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      seatingCapacity: String(vehicle.seatingCapacity || vehicle.capacity || ''),
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      vehicleImage: vehicle.vehicleImage || '',
      rcNumber: vehicle.rcNumber || '',
      rcDocument: vehicle.rcDocument || '',
      rcDocumentFile: null,
      insuranceNumber: vehicle.insuranceNumber || '',
      insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '',
      insuranceDocument: vehicle.insuranceDocument || '',
      insuranceDocumentFile: null,
      hasAC: !!vehicle.hasAC,
      hasWifi: !!vehicle.hasWifi,
      hasCharging: !!vehicle.hasCharging,
      basePrice: String(vehicle.basePrice || ''),
      pricePerKm: String(vehicle.pricePerKm || ''),
    });
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateVehicle = async () => {
    if (!selectedVehicle) return;

    const {
      brand,
      model,
      color,
      seatingCapacity,
      fuelType,
      transmission,
      vehicleImage,
      rcNumber,
      rcDocument,
      rcDocumentFile,
      insuranceNumber,
      insuranceExpiry,
      insuranceDocument,
      insuranceDocumentFile,
      hasAC,
      hasWifi,
      hasCharging,
      basePrice,
      pricePerKm,
    } = editForm;

    if (!brand || !model || !color || !seatingCapacity) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalRcDocumentUrl = rcDocument;
      let finalInsuranceDocumentUrl = insuranceDocument;

      if (rcDocumentFile) {
        finalRcDocumentUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(rcDocumentFile);
        });
      }

      if (insuranceDocumentFile) {
        finalInsuranceDocumentUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(insuranceDocumentFile);
        });
      }

      const payload: any = {
        brand: brand.trim(),
        model: model.trim(),
        color: color.trim(),
        seatingCapacity: Number(seatingCapacity),
        fuelType,
        transmission,
        vehicleImage,
        rcNumber,
        rcDocument: finalRcDocumentUrl,
        insuranceNumber,
        insuranceExpiry: insuranceExpiry || null,
        insuranceDocument: finalInsuranceDocumentUrl,
        hasAC,
        hasWifi,
        hasCharging,
        basePrice: basePrice ? parseFloat(basePrice) : 0,
        pricePerKm: pricePerKm ? parseFloat(pricePerKm) : 0,
      };

      await updateVehicle(selectedVehicle.id, payload);
      await getVehicles();
      await getVehicleStats();
      setIsEditModalOpen(false);
      showToast('Vehicle updated successfully.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update vehicle.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicleConfirm = async () => {
    if (!selectedVehicle) return;
    setIsSubmitting(true);
    try {
      await deleteVehicle(selectedVehicle.id);
      await getVehicles();
      await getVehicleStats();
      setIsConfirmDeleteOpen(false);
      setIsDetailsModalOpen(false);
      showToast('Vehicle deleted successfully.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete vehicle.';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'approved':
      case 'active':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'suspended':
        return <Badge variant="default">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-blue-600 animate-pulse" />
            Fleet Vehicles
          </h1>
          <p className="text-gray-600 mt-1">Register, configure, and monitor your fleet vehicles.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {!currentFleetId ? (
            <Button type="button" onClick={() => setShowCreateFleetModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Fleet
            </Button>
          ) : (
            <Button type="button" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Register Vehicle
            </Button>
          )}
          <Link href="/dashboard/fleet-owner">
            <Button type="button" variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Vehicles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{vehicleStats?.total ?? vehicles.length}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{vehicleStats?.approved ?? 0}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{vehicleStats?.pending ?? 0}</p>
          </div>
        </Card>
        <Card className="border border-gray-200 shadow-sm bg-white">
          <div className="p-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Rejected / Suspended</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {(vehicleStats?.rejected ?? 0) + (vehicleStats?.suspended ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([
            { id: 'all' as const, label: 'All Vehicles' },
            { id: 'types' as const, label: 'Vehicle Types' },
            { id: 'approval' as const, label: 'Approval Status' },
            { id: 'maintenance' as const, label: 'Maintenance' },
            { id: 'verification' as const, label: 'Verification' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                currentTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {error && (
          <Card className="border border-red-200 bg-red-50 text-red-900 mb-4">
            <div className="p-4">{error}</div>
          </Card>
        )}

        {vehicles.length === 0 ? (
          <EmptyState
            title={!currentFleetId ? 'No fleet found' : 'No vehicles yet'}
            description={!currentFleetId ? 'Create a fleet first before adding vehicles.' : 'Add your first vehicle to start managing your fleet and assigning trips.'}
            customIcon={<Truck className="w-8 h-8 text-gray-400" />}
            action={{
              label: !currentFleetId ? 'Create Fleet' : 'Add Vehicle',
              onClick: () => (!currentFleetId ? setShowCreateFleetModal(true) : setIsAddModalOpen(true)),
            }}
          />
        ) : currentTab === 'types' ? (
          /* ─── Vehicle Types View ─────────────────────────────────── */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicles by Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(() => {
                const grouped: Record<string, any[]> = {};
                vehicles.forEach((v) => {
                  const type = (v.type || 'unknown').toLowerCase();
                  if (!grouped[type]) grouped[type] = [];
                  grouped[type].push(v);
                });
                return Object.entries(grouped).map(([type, typeVehicles]) => {
                  const approved = typeVehicles.filter(v => v.status === 'approved' || v.status === 'active').length;
                  const pending = typeVehicles.filter(v => v.status === 'pending').length;
                  return (
                    <Card key={type} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 capitalize">{type}</h3>
                            <p className="text-xs text-gray-500">{typeVehicles.length} vehicle{typeVehicles.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-900">{typeVehicles.length}</p>
                            <p className="text-[10px] text-gray-500 font-medium">Total</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-green-700">{approved}</p>
                            <p className="text-[10px] text-green-600 font-medium">Active</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-yellow-700">{pending}</p>
                            <p className="text-[10px] text-yellow-600 font-medium">Pending</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="space-y-1.5">
                            {typeVehicles.slice(0, 3).map((v) => (
                              <div key={v.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700 font-medium capitalize">{v.brand || v.make} {v.model}</span>
                                {getStatusBadge(v.status)}
                              </div>
                            ))}
                            {typeVehicles.length > 3 && (
                              <p className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-700" onClick={() => setCurrentTab('all')}>
                                +{typeVehicles.length - 3} more...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                });
              })()}
            </div>
          </div>
        ) : currentTab === 'approval' ? (
          /* ─── Approval Status View ─────────────────────────────── */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Approval Status</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Pending Review', status: 'pending', color: 'yellow' },
                { label: 'Approved', status: 'approved', color: 'green' },
                { label: 'Rejected', status: 'rejected', color: 'red' },
                { label: 'Suspended', status: 'suspended', color: 'orange' },
              ].map(({ label, status, color }) => {
                const count = vehicles.filter(v => (v.status || '').toLowerCase() === status || (status === 'approved' && (v.status || '').toLowerCase() === 'active')).length;
                return (
                  <Card key={status} className={`border bg-${color}-50 border-${color}-200 shadow-sm`}>
                    <div className="p-3 text-center">
                      <p className={`text-2xl font-bold text-${color}-700`}>{count}</p>
                      <p className={`text-xs font-semibold text-${color}-600 mt-1`}>{label}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
            <DataTable
              title="Vehicles by Approval Status"
              columns={[
                {
                  key: 'name',
                  header: 'Vehicle',
                  render: (row: any) => (
                    <div className="font-medium text-gray-900 capitalize">
                      {(row.make ?? row.brand) || row.model} {row.model}
                    </div>
                  ),
                },
                {
                  key: 'registration',
                  header: 'Registration',
                  render: (row: any) => (
                    <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {row.registrationNumber}
                    </span>
                  ),
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (row: any) => <span className="capitalize">{row.type || 'Sedan'}</span>,
                },
                {
                  key: 'status',
                  header: 'Approval Status',
                  render: (row: any) => getStatusBadge(row.status),
                },
                {
                  key: 'rejectionReason',
                  header: 'Reason',
                  render: (row: any) => (
                    <span className="text-xs text-gray-500 truncate max-w-[200px] block">
                      {row.rejectionReason || row.suspensionReason || '—'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row: any) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicle(row);
                        setDetailsTab('status');
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      Review
                    </Button>
                  ),
                },
              ]}
              data={vehicles.sort((a, b) => {
                const order: Record<string, number> = { pending: 0, rejected: 1, suspended: 2, approved: 3, active: 3 };
                return (order[(a.status || '').toLowerCase()] ?? 9) - (order[(b.status || '').toLowerCase()] ?? 9);
              })}
              keyExtractor={(v: any) => v.id}
              isLoading={isLoading}
              totalCount={vehicles.length}
              page={1}
              onPageChange={() => {}}
            />
          </div>
        ) : currentTab === 'maintenance' ? (
          /* ─── Maintenance View ─────────────────────────────────── */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Maintenance</h2>
            <DataTable
              title="Maintenance Overview"
              columns={[
                {
                  key: 'name',
                  header: 'Vehicle',
                  render: (row: any) => (
                    <div className="font-medium text-gray-900 capitalize">
                      {(row.make ?? row.brand) || row.model} {row.model}
                    </div>
                  ),
                },
                {
                  key: 'registration',
                  header: 'Reg. No.',
                  render: (row: any) => (
                    <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {row.registrationNumber}
                    </span>
                  ),
                },
                {
                  key: 'year',
                  header: 'Year',
                  render: (row: any) => <span className="text-gray-700">{row.year || 'N/A'}</span>,
                },
                {
                  key: 'fuelType',
                  header: 'Fuel',
                  render: (row: any) => <span className="text-gray-700 capitalize">{row.fuelType || '—'}</span>,
                },
                {
                  key: 'insuranceExpiry',
                  header: 'Insurance Expiry',
                  render: (row: any) => {
                    if (!row.insuranceExpiry) return <span className="text-gray-400">Not set</span>;
                    const expiry = new Date(row.insuranceExpiry);
                    const now = new Date();
                    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isExpired = daysUntil < 0;
                    const isExpiringSoon = daysUntil >= 0 && daysUntil <= 30;
                    return (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isExpired ? 'bg-red-100 text-red-700' : isExpiringSoon ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isExpired ? `Expired ${Math.abs(daysUntil)}d ago` : isExpiringSoon ? `${daysUntil}d left` : expiry.toLocaleDateString()}
                      </span>
                    );
                  },
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => getStatusBadge(row.status),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row: any) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicle(row);
                        setDetailsTab('docs');
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      Documents
                    </Button>
                  ),
                },
              ]}
              data={vehicles}
              keyExtractor={(v: any) => v.id}
              isLoading={isLoading}
              totalCount={vehicles.length}
              page={1}
              onPageChange={() => {}}
            />
          </div>
        ) : currentTab === 'verification' ? (
          /* ─── Verification View ─────────────────────────────────── */
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Verification</h2>
            <DataTable
              title="Verification Status"
              columns={[
                {
                  key: 'name',
                  header: 'Vehicle',
                  render: (row: any) => (
                    <div className="font-medium text-gray-900 capitalize">
                      {(row.make ?? row.brand) || row.model} {row.model}
                    </div>
                  ),
                },
                {
                  key: 'registration',
                  header: 'Reg. No.',
                  render: (row: any) => (
                    <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      {row.registrationNumber}
                    </span>
                  ),
                },
                {
                  key: 'rcNumber',
                  header: 'RC Number',
                  render: (row: any) => (
                    <span className="text-xs text-gray-700 font-mono">{row.rcNumber || '—'}</span>
                  ),
                },
                {
                  key: 'rcDocument',
                  header: 'RC Doc',
                  render: (row: any) => (
                    row.rcDocument ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="w-3 h-3" /> Missing
                      </span>
                    )
                  ),
                },
                {
                  key: 'insuranceDoc',
                  header: 'Insurance Doc',
                  render: (row: any) => (
                    row.insuranceDocument ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="w-3 h-3" /> Missing
                      </span>
                    )
                  ),
                },
                {
                  key: 'status',
                  header: 'Verification',
                  render: (row: any) => getStatusBadge(row.status),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row: any) => (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(row);
                          setDetailsTab('docs');
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={vehicles}
              keyExtractor={(v: any) => v.id}
              isLoading={isLoading}
              totalCount={vehicles.length}
              page={1}
              onPageChange={() => {}}
            />
          </div>
        ) : (
          /* ─── Default: All Vehicles ────────────────────────────── */
          <DataTable
            title="My Vehicles"
            columns={[
              {
                key: 'name',
                header: 'Vehicle Name',
                render: (row: any) => (
                  <div className="font-medium text-gray-900 capitalize">
                    {(row.make ?? row.brand) || row.model} {row.model}
                  </div>
                ),
              },
              {
                key: 'registration',
                header: 'Registration',
                render: (row: any) => (
                  <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    {row.registrationNumber}
                  </span>
                ),
              },
              {
                key: 'type',
                header: 'Type',
                render: (row: any) => <span className="capitalize">{row.type || 'Sedan'}</span>,
              },
              {
                key: 'driver',
                header: 'Driver',
                render: (row: any) => (
                  <span className="text-gray-500">{row.assignedDriver || 'Unassigned'}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row: any) => getStatusBadge(row.status),
              },
              {
                key: 'createdAt',
                header: 'Created Date',
                render: (row: any) => (
                  <span className="text-gray-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row: any) => (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicle(row);
                        setDetailsTab('info');
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      View
                    </Button>
                    {row.status !== 'suspended' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVehicle(row);
                          handleOpenEdit(row);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicle(row);
                        setDetailsTab('docs');
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      Docs
                    </Button>
                  </div>
                ),
              },
            ]}
            data={vehicles}
            keyExtractor={(v: any) => v.id}
            isLoading={isLoading}
            totalCount={vehicles.length}
            page={1}
            onPageChange={() => {}}
          />
        )}
      </div>

      {/* Details modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedVehicle ? `${selectedVehicle.brand || selectedVehicle.make || ''} ${selectedVehicle.model || ''} details` : 'Vehicle Details'}
        size="lg"
        footer={
          <div className="flex gap-3 w-full justify-between items-center">
            <Button
              type="button"
              variant="danger"
              onClick={() => setIsConfirmDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              {selectedVehicle?.status !== 'suspended' && (
                <Button
                  type="button"
                  onClick={() => handleOpenEdit(selectedVehicle)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit specs
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedVehicle && (
          <div className="space-y-6">
            {/* Tab links */}
            <div className="flex border-b border-gray-200">
              <button
                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${detailsTab === 'info' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setDetailsTab('info')}
              >
                Information
              </button>
              <button
                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${detailsTab === 'docs' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setDetailsTab('docs')}
              >
                Documents
              </button>
              <button
                className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${detailsTab === 'status' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setDetailsTab('status')}
              >
                Approval & Verification
              </button>
            </div>

            {/* Tab panels */}
            {detailsTab === 'info' && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 text-sm border-b pb-1">Core Specifications</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <span className="text-gray-400">Registration Number</span>
                    <span className="font-mono text-gray-900 font-medium">{selectedVehicle.registrationNumber}</span>
                    <span className="text-gray-400">Brand</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.brand || selectedVehicle.make}</span>
                    <span className="text-gray-400">Model</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.model}</span>
                    <span className="text-gray-400">Year</span>
                    <span className="font-medium text-gray-900">{selectedVehicle.year}</span>
                    <span className="text-gray-400">Color</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.color}</span>
                    <span className="text-gray-400">Type</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.type}</span>
                    <span className="text-gray-400">Seating Capacity</span>
                    <span className="font-medium text-gray-900">{selectedVehicle.seatingCapacity || selectedVehicle.capacity} seats</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 text-sm border-b pb-1">Features & Pricing</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <span className="text-gray-400">Fuel Type</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.fuelType || '—'}</span>
                    <span className="text-gray-400">Transmission</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedVehicle.transmission || '—'}</span>
                    <span className="text-gray-400">Base Price</span>
                    <span className="font-bold text-gray-900">₹{Number(selectedVehicle.basePrice || 0).toLocaleString()}</span>
                    <span className="text-gray-400">Price Per Km</span>
                    <span className="font-bold text-gray-900">₹{Number(selectedVehicle.pricePerKm || 0).toFixed(2)}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-400 text-sm block mb-2">Amenities Included</span>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${selectedVehicle.hasAC ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        <Wind className="w-3.5 h-3.5" /> AC
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${selectedVehicle.hasWifi ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        <Wifi className="w-3.5 h-3.5" /> WiFi
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${selectedVehicle.hasCharging ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                        <Zap className="w-3.5 h-3.5" /> Charging
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailsTab === 'docs' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-sm border-b pb-1">Compliance & Documents</h4>
                <div className="grid gap-4">
                  {/* RC Doc */}
                  <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Registration Certificate (RC)</p>
                        <p className="text-xs text-gray-500 font-mono">No: {selectedVehicle.rcNumber || 'Not specified'}</p>
                      </div>
                    </div>
                    {selectedVehicle.rcDocument ? (
                      <a
                        href={selectedVehicle.rcDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View document
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-normal">No document uploaded</span>
                    )}
                  </div>

                  {/* Insurance Doc */}
                  <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Vehicle Insurance</p>
                        <p className="text-xs text-gray-500 font-mono">No: {selectedVehicle.insuranceNumber || 'Not specified'}</p>
                        {selectedVehicle.insuranceExpiry && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Expiry Date: {new Date(selectedVehicle.insuranceExpiry).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedVehicle.insuranceDocument ? (
                      <a
                        href={selectedVehicle.insuranceDocument}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View document
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-normal">No document uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailsTab === 'status' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 text-sm border-b pb-1">Verification Details</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">Current status:</span>
                  {getStatusBadge(selectedVehicle.status)}
                </div>

                {selectedVehicle.status === 'pending' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Review Pending</p>
                      <p className="mt-1">This vehicle is waiting for system administrators to verify the documents and specifications. You will receive a notification once the review is completed.</p>
                    </div>
                  </div>
                )}

                {selectedVehicle.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800 flex gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Rejection Reason</p>
                      <p className="mt-1 italic">&quot;{selectedVehicle.rejectionReason || 'No reason provided'}&quot;</p>
                      <p className="mt-2 text-xs text-red-700">Please edit specifications or re-upload correct documents to seek approval.</p>
                    </div>
                  </div>
                )}

                {selectedVehicle.status === 'suspended' && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-orange-800 flex gap-3">
                    <Ban className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Suspension Reason</p>
                      <p className="mt-1 italic">&quot;{selectedVehicle.suspensionReason || 'No reason provided'}&quot;</p>
                      <p className="mt-2 text-xs text-orange-700">Your vehicle has been suspended. Please contact platform support to reactivate your vehicle.</p>
                    </div>
                  </div>
                )}

                {selectedVehicle.status === 'approved' && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Vehicle Approved</p>
                      <p className="mt-1">This vehicle has been fully approved by the system. It is active and ready to be assigned to trips.</p>
                      {selectedVehicle.approvedAt && (
                        <p className="mt-2 text-xs text-green-700">
                          Approved Date: {new Date(selectedVehicle.approvedAt).toLocaleDateString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add vehicle modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Vehicle"
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={handleAddVehicle} isLoading={isSubmitting} className="flex-1">
              Save Vehicle
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Required Info */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Information</h3>
            <Input
              label="Registration Number"
              value={form.registrationNumber}
              onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
              placeholder="MH12AB1234"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Brand"
                value={form.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Toyota"
                required
              />
              <Input
                label="Model"
                value={form.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Innova Crysta"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Year"
                type="number"
                value={form.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2024"
                required
                min={1990}
                max={2030}
              />
              <Select
                label="Vehicle Type"
                value={form.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                options={vehicleTypeOptions}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Color"
                value={form.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="White"
                required
              />
              <Input
                label="Seating Capacity"
                type="number"
                value={form.seatingCapacity}
                onChange={(e) => handleInputChange('seatingCapacity', e.target.value)}
                placeholder="7"
                required
                min={1}
                max={100}
              />
            </div>
          </div>

          {/* Specs */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Fuel Type"
                value={form.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                options={fuelTypeOptions}
              />
              <Select
                label="Transmission"
                value={form.transmission}
                onChange={(e) => handleInputChange('transmission', e.target.value)}
                options={transmissionOptions}
              />
            </div>
            <Input
              label="Vehicle Image URL"
              value={form.vehicleImage}
              onChange={(e) => handleInputChange('vehicleImage', e.target.value)}
              placeholder="https://example.com/vehicle.jpg"
              className="mt-4"
            />
          </div>

          {/* Amenities */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.hasAC}
                  onChange={(e) => handleInputChange('hasAC', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Air Conditioning (AC)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.hasWifi}
                  onChange={(e) => handleInputChange('hasWifi', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">WiFi</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.hasCharging}
                  onChange={(e) => handleInputChange('hasCharging', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Charging Ports</span>
              </label>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Price (INR)"
                type="number"
                value={form.basePrice}
                onChange={(e) => handleInputChange('basePrice', e.target.value)}
                placeholder="500.00"
                step="0.01"
                min={0}
              />
              <Input
                label="Price Per Km (INR)"
                type="number"
                value={form.pricePerKm}
                onChange={(e) => handleInputChange('pricePerKm', e.target.value)}
                placeholder="15.00"
                step="0.01"
                min={0}
              />
            </div>
          </div>

          {/* Documents */}
          <div className="pb-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Compliance & Documents</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Registration Certificate (RC)</h4>
                <Input
                  label="RC Number"
                  value={form.rcNumber}
                  onChange={(e) => handleInputChange('rcNumber', e.target.value)}
                  placeholder="RC123456789"
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RC Document</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('File size must be less than 5MB', 'error');
                          return;
                        }
                        setForm((prev) => ({ ...prev, rcDocumentFile: file }));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <Input
                  label="RC Document URL (optional)"
                  value={form.rcDocument}
                  onChange={(e) => handleInputChange('rcDocument', e.target.value)}
                  placeholder="https://example.com/rc.pdf"
                  className="mt-3"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Insurance Details</h4>
                <Input
                  label="Insurance Number"
                  value={form.insuranceNumber}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  placeholder="INS123456"
                />
                <Input
                  label="Insurance Expiry Date"
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
                  className="mt-3"
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Document</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('File size must be less than 5MB', 'error');
                          return;
                        }
                        setForm((prev) => ({ ...prev, insuranceDocumentFile: file }));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <Input
                  label="Insurance Document URL (optional)"
                  value={form.insuranceDocument}
                  onChange={(e) => handleInputChange('insuranceDocument', e.target.value)}
                  placeholder="https://example.com/insurance.pdf"
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit vehicle modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Vehicle Specifications"
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateVehicle} isLoading={isSubmitting} className="flex-1">
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Brand"
                value={editForm.brand}
                onChange={(e) => handleEditInputChange('brand', e.target.value)}
                placeholder="Toyota"
                required
              />
              <Input
                label="Model"
                value={editForm.model}
                onChange={(e) => handleEditInputChange('model', e.target.value)}
                placeholder="Innova Crysta"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Color"
                value={editForm.color}
                onChange={(e) => handleEditInputChange('color', e.target.value)}
                placeholder="White"
                required
              />
              <Input
                label="Seating Capacity"
                type="number"
                value={editForm.seatingCapacity}
                onChange={(e) => handleEditInputChange('seatingCapacity', e.target.value)}
                placeholder="7"
                required
                min={1}
                max={100}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Select
                label="Fuel Type"
                value={editForm.fuelType}
                onChange={(e) => handleEditInputChange('fuelType', e.target.value)}
                options={fuelTypeOptions}
              />
              <Select
                label="Transmission"
                value={editForm.transmission}
                onChange={(e) => handleEditInputChange('transmission', e.target.value)}
                options={transmissionOptions}
              />
            </div>
            <Input
              label="Vehicle Image URL"
              value={editForm.vehicleImage}
              onChange={(e) => handleEditInputChange('vehicleImage', e.target.value)}
              placeholder="https://example.com/vehicle.jpg"
              className="mt-4"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editForm.hasAC}
                  onChange={(e) => handleEditInputChange('hasAC', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Air Conditioning (AC)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editForm.hasWifi}
                  onChange={(e) => handleEditInputChange('hasWifi', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">WiFi</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={editForm.hasCharging}
                  onChange={(e) => handleEditInputChange('hasCharging', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Charging Ports</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Price (INR)"
                type="number"
                value={editForm.basePrice}
                onChange={(e) => handleEditInputChange('basePrice', e.target.value)}
                placeholder="500.00"
                step="0.01"
                min={0}
              />
              <Input
                label="Price Per Km (INR)"
                type="number"
                value={editForm.pricePerKm}
                onChange={(e) => handleEditInputChange('pricePerKm', e.target.value)}
                placeholder="15.00"
                step="0.01"
                min={0}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Compliance & Documents</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Registration Certificate (RC)</h4>
                <Input
                  label="RC Number"
                  value={editForm.rcNumber}
                  onChange={(e) => handleEditInputChange('rcNumber', e.target.value)}
                  placeholder="RC123456789"
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RC Document</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('File size must be less than 5MB', 'error');
                          return;
                        }
                        setEditForm((prev) => ({ ...prev, rcDocumentFile: file }));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <Input
                  label="RC Document URL (optional)"
                  value={editForm.rcDocument}
                  onChange={(e) => handleEditInputChange('rcDocument', e.target.value)}
                  placeholder="https://example.com/rc.pdf"
                  className="mt-3"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Insurance Details</h4>
                <Input
                  label="Insurance Number"
                  value={editForm.insuranceNumber}
                  onChange={(e) => handleEditInputChange('insuranceNumber', e.target.value)}
                  placeholder="INS123456"
                />
                <Input
                  label="Insurance Expiry Date"
                  type="date"
                  value={editForm.insuranceExpiry}
                  onChange={(e) => handleEditInputChange('insuranceExpiry', e.target.value)}
                  className="mt-3"
                />
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Document</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showToast('File size must be less than 5MB', 'error');
                          return;
                        }
                        setEditForm((prev) => ({ ...prev, insuranceDocumentFile: file }));
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <Input
                  label="Insurance Document URL (optional)"
                  value={editForm.insuranceDocument}
                  onChange={(e) => handleEditInputChange('insuranceDocument', e.target.value)}
                  placeholder="https://example.com/insurance.pdf"
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Confirm Vehicle Deletion"
        size="md"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteVehicleConfirm}
              isLoading={isSubmitting}
              className="flex-1"
            >
              Confirm Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this vehicle? This action is permanent and cannot be undone.
          </p>
          <div className="p-3 bg-red-50 rounded-lg text-xs text-red-800 font-medium">
            ⚠ Warning: If this vehicle has scheduled trips, deleting it may cause scheduling errors.
          </div>
        </div>
      </Modal>

      {/* Create fleet modal */}
      <Modal
        isOpen={showCreateFleetModal}
        onClose={() => setShowCreateFleetModal(false)}
        title="Create Fleet Company"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Fleet Name"
            value={fleetName}
            onChange={(e) => setFleetName(e.target.value)}
            placeholder="Enter a fleet name"
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateFleetModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateFleet} isLoading={isCreatingFleet} className="flex-1">
              Create Fleet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
