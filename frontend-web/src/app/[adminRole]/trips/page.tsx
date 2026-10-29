'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAppStore } from '@/store';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Trip } from '@/types/trip';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminTripsPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Loading trips registry..." />}>
      <AdminTripsContent />
    </Suspense>
  );
}

function AdminTripsContent() {
  const { showToast } = useAppStore();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Modal and form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [driversList, setDriversList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    vehicleId: '',
    driverId: '',
    tripType: 'one_way',
    source: '',
    destination: '',
    sourceLat: '19.0760',
    sourceLng: '72.8777',
    destLat: '18.5204',
    destLng: '73.8567',
    departureTime: '',
    arrivalTime: '',
    basePrice: '',
    pricePerSeat: '',
    distanceKm: '',
    estimatedDuration: '',
    isReturnTripAvailable: false,
    returnDepartureTime: '',
    returnArrivalTime: '',
    returnPricePerSeat: '',
  });

  useEffect(() => {
    loadTrips();
  }, [page, statusParam]);

  const loadTrips = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAdminTrips({
        page,
        limit: 10,
        status: statusParam || undefined
      });
      setTrips(response.data.data || response.data);
      setTotalCount(response.data.total || response.data.length);
    } catch (error) {
      showToast('Failed to load trips', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVehiclesAndDrivers = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        apiClient.get('/vehicles', { params: { limit: 100 } }),
        apiClient.get('/users', { params: { userType: 'DRIVER', limit: 100 } }),
      ]);
      
      const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
      const dData = driversRes.data?.data || driversRes.data || [];
      
      setVehiclesList(vData);
      setDriversList(dData);
    } catch (error) {
      console.error('Failed to load vehicles and drivers', error);
      showToast('Failed to load vehicles or drivers selection list', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingTrip(null);
    setForm({
      title: '',
      description: '',
      vehicleId: '',
      driverId: '',
      tripType: 'one_way',
      source: '',
      destination: '',
      sourceLat: '19.0760',
      sourceLng: '72.8777',
      destLat: '18.5204',
      destLng: '73.8567',
      departureTime: '',
      arrivalTime: '',
      basePrice: '',
      pricePerSeat: '',
      distanceKm: '',
      estimatedDuration: '',
      isReturnTripAvailable: false,
      returnDepartureTime: '',
      returnArrivalTime: '',
      returnPricePerSeat: '',
    });
    loadVehiclesAndDrivers();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setForm({
      title: trip.title || '',
      description: trip.description || '',
      vehicleId: trip.vehicleId || '',
      driverId: trip.driverId || '',
      tripType: trip.tripType || 'one_way',
      source: trip.source || '',
      destination: trip.destination || '',
      sourceLat: String(trip.sourceLat ?? '19.0760'),
      sourceLng: String(trip.sourceLng ?? '72.8777'),
      destLat: String(trip.destLat ?? '18.5204'),
      destLng: String(trip.destLng ?? '73.8567'),
      departureTime: trip.departureTime ? new Date(trip.departureTime).toISOString().slice(0, 16) : '',
      arrivalTime: trip.arrivalTime ? new Date(trip.arrivalTime).toISOString().slice(0, 16) : '',
      basePrice: String(trip.basePrice || ''),
      pricePerSeat: String(trip.pricePerSeat || ''),
      distanceKm: String(trip.distanceKm || ''),
      estimatedDuration: String(trip.estimatedDuration || ''),
      isReturnTripAvailable: !!trip.isReturnTripAvailable,
      returnDepartureTime: trip.returnDepartureTime ? new Date(trip.returnDepartureTime).toISOString().slice(0, 16) : '',
      returnArrivalTime: trip.returnArrivalTime ? new Date(trip.returnArrivalTime).toISOString().slice(0, 16) : '',
      returnPricePerSeat: String(trip.returnPricePerSeat || ''),
    });
    loadVehiclesAndDrivers();
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.vehicleId || !form.source || !form.destination || !form.departureTime || !form.basePrice || !form.pricePerSeat) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        vehicleId: form.vehicleId,
        driverId: form.driverId || undefined,
        tripType: form.tripType,
        source: form.source,
        destination: form.destination,
        sourceLat: parseFloat(form.sourceLat),
        sourceLng: parseFloat(form.sourceLng),
        destLat: parseFloat(form.destLat),
        destLng: parseFloat(form.destLng),
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        basePrice: parseFloat(form.basePrice),
        pricePerSeat: parseFloat(form.pricePerSeat),
        distanceKm: form.distanceKm ? parseInt(form.distanceKm, 10) : undefined,
        estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration, 10) : undefined,
        isReturnTripAvailable: form.isReturnTripAvailable,
      };

      if (form.tripType === 'round_trip') {
        payload.returnDepartureTime = form.returnDepartureTime ? new Date(form.returnDepartureTime).toISOString() : undefined;
        payload.returnArrivalTime = form.returnArrivalTime ? new Date(form.returnArrivalTime).toISOString() : undefined;
        payload.returnPricePerSeat = form.returnPricePerSeat ? parseFloat(form.returnPricePerSeat) : undefined;
      }

      if (editingTrip) {
        await apiClient.updateTrip(editingTrip.id, payload);
        showToast('Trip updated successfully', 'success');
      } else {
        await apiClient.createTrip(payload);
        showToast('Trip created successfully', 'success');
      }

      setShowCreateModal(false);
      loadTrips();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operation failed';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    
    try {
      await apiClient.deleteTrip(id);
      showToast('Trip deleted', 'success');
      loadTrips();
    } catch (error) {
      showToast('Failed to delete trip', 'error');
    }
  };

  const columns = [
    {
      key: 'route',
      header: 'Route',
      render: (trip: Trip) => (
        <div>
          <p className="font-medium text-gray-900">{trip.origin || trip.source} → {trip.destination}</p>
          <p className="text-sm text-gray-500">{formatDateTime(trip.departureTime || (trip as any).departureDate)}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (trip: Trip) => (
        <Badge variant="outline">{trip.vehicle?.brand || trip.vehicle?.make || (trip as any).vehicleType || 'Vehicle'}</Badge>
      ),
    },
    {
      key: 'seats',
      header: 'Seats',
      render: (trip: Trip) => (
        <span className="text-sm text-gray-600">
          {trip.availableSeats}/{trip.totalSeats} available
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (trip: Trip) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(Number(trip.pricePerSeat || trip.price || 0), trip.currency || 'INR')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (trip: Trip) => (
        <Badge
          variant={
            (trip.status as any) === 'active' || (trip.status as any) === 'ACTIVE'
              ? 'success'
              : (trip.status as any) === 'scheduled' || (trip.status as any) === 'SCHEDULED'
              ? 'info'
              : (trip.status as any) === 'cancelled' || (trip.status as any) === 'CANCELLED'
              ? 'danger'
              : 'default'
          }
          size="sm"
        >
          {trip.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (trip: Trip) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(trip)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:text-danger-700"
            onClick={() => handleDelete(trip.id)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600 mt-1">Manage platform trips and schedules</p>
        </div>
        <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Trip
        </Button>
      </div>

      <DataTable
        title={statusParam ? `${statusParam.charAt(0).toUpperCase() + statusParam.slice(1)} Trips` : "All Trips"}
        columns={columns}
        data={trips}
        keyExtractor={(trip) => trip.id}
        isLoading={isLoading}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        emptyMessage={statusParam ? `No ${statusParam} trips found.` : "No trips found."}
      />

      {/* Create / Edit Trip Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editingTrip ? 'Edit Trip Specifications' : 'Create New Trip'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {/* Section 1: Trip Info & Route */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Trip Info & Route</h3>
            <Input
              label="Trip Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Mumbai to Pune Daily AC Service"
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g., Comfortable AC sleeper bus"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Origin/Source City"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="e.g., Mumbai"
                required
              />
              <Input
                label="Destination City"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="e.g., Pune"
                required
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input
                label="Source Lat"
                type="number"
                step="any"
                value={form.sourceLat}
                onChange={(e) => setForm({ ...form, sourceLat: e.target.value })}
                required
              />
              <Input
                label="Source Lng"
                type="number"
                step="any"
                value={form.sourceLng}
                onChange={(e) => setForm({ ...form, sourceLng: e.target.value })}
                required
              />
              <Input
                label="Dest Lat"
                type="number"
                step="any"
                value={form.destLat}
                onChange={(e) => setForm({ ...form, destLat: e.target.value })}
                required
              />
              <Input
                label="Dest Lng"
                type="number"
                step="any"
                value={form.destLng}
                onChange={(e) => setForm({ ...form, destLng: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: Vehicle & Driver Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Vehicle & Driver</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Assign Vehicle"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                options={vehiclesList.map((v: any) => ({
                  value: v.id,
                  label: `${v.brand || v.make || ''} ${v.model || ''} (${v.registrationNumber || ''})`
                }))}
                placeholder="Select a vehicle"
                required
              />
              <Select
                label="Assign Driver (Optional)"
                value={form.driverId}
                onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                options={driversList.map((d: any) => ({
                  value: d.driverProfile?.id || d.id,
                  label: `${d.firstName || ''} ${d.lastName || ''} (${d.email || d.phone || ''})`
                }))}
                placeholder="Select a driver"
              />
            </div>
          </div>

          {/* Section 3: Schedule & Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Schedule & Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Departure Time"
                type="datetime-local"
                value={form.departureTime}
                onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                required
              />
              <Input
                label="Arrival Time (Optional)"
                type="datetime-local"
                value={form.arrivalTime}
                onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Price (INR)"
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                placeholder="500.00"
                required
              />
              <Input
                label="Price Per Seat (INR)"
                type="number"
                step="0.01"
                value={form.pricePerSeat}
                onChange={(e) => setForm({ ...form, pricePerSeat: e.target.value })}
                placeholder="100.00"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Trip Type"
                value={form.tripType}
                onChange={(e) => setForm({ ...form, tripType: e.target.value })}
                options={[
                  { value: 'one_way', label: 'One Way' },
                  { value: 'round_trip', label: 'Round Trip' },
                  { value: 'return_only', label: 'Return Only' }
                ]}
              />
              <Input
                label="Distance (km)"
                type="number"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                placeholder="e.g. 150"
              />
              <Input
                label="Est. Duration (mins)"
                type="number"
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                placeholder="e.g. 180"
              />
            </div>
          </div>

          {/* Section 4: Return Trip Options (Conditional) */}
          {form.tripType === 'round_trip' && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-1">Return Trip Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Return Departure Time"
                  type="datetime-local"
                  value={form.returnDepartureTime}
                  onChange={(e) => setForm({ ...form, returnDepartureTime: e.target.value })}
                />
                <Input
                  label="Return Arrival Time"
                  type="datetime-local"
                  value={form.returnArrivalTime}
                  onChange={(e) => setForm({ ...form, returnArrivalTime: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Return Price Per Seat (INR)"
                  type="number"
                  step="0.01"
                  value={form.returnPricePerSeat}
                  onChange={(e) => setForm({ ...form, returnPricePerSeat: e.target.value })}
                  placeholder="100.00"
                />
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form.isReturnTripAvailable}
                      onChange={(e) => setForm({ ...form, isReturnTripAvailable: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Make Return Trip Available Immediately</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {editingTrip ? 'Save Changes' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}