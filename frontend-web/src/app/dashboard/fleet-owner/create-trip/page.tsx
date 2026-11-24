'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/slices/fleetSlice';
import { useAppStore } from '@/store';
import apiClient from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchInput from '@/components/maps/SearchInput';
import { cn } from '@/lib/utils';

const tripTypeOptions = [
  { value: 'one_way', label: 'One Way' },
  { value: 'round_trip', label: 'Round Trip' },
];

export default function FleetOwnerCreateTripPage() {
  const router = useRouter();
  const { currentFleetName, vehicles, getVehicles } = useFleetStore();
  const { showToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    title: '',
    description: '',
    tripType: 'one_way',
    source: '',
    destination: '',
    sourceLat: '',
    sourceLng: '',
    destLat: '',
    destLng: '',
    departureTime: '',
    arrivalTime: '',
    basePrice: '',
    pricePerSeat: '',
    bookingMode: 'SEAT' as 'SEAT' | 'FULL_VEHICLE' | 'BOTH',
    fullVehiclePrice: '',
    isRecurring: false,
    recurrencePattern: 'daily',
    recurrenceEndDate: '',
  });

  const [sourceSelected, setSourceSelected] = useState(false);
  const [destSelected, setDestSelected] = useState(false);

  useEffect(() => {
    getVehicles();
  }, [getVehicles]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!currentFleetName) {
      showToast('Create a fleet first before adding trips.', 'error');
      return;
    }

    if (!form.vehicleId) {
      showToast('Select a vehicle for the trip.', 'error');
      return;
    }

    if (!form.title || !form.source || !form.destination || !form.departureTime) {
      showToast('Enter title, source, destination and departure time.', 'error');
      return;
    }

    if (!form.sourceLat || !form.sourceLng || !form.destLat || !form.destLng) {
      showToast('Enter coordinates for source and destination.', 'error');
      return;
    }

    if (!sourceSelected || !destSelected) {
      showToast('Please select both Source and Destination from the suggestions.', 'error');
      return;
    }

    if (!form.basePrice) {
      showToast('Enter base price.', 'error');
      return;
    }

    if (form.bookingMode === 'SEAT' && !form.pricePerSeat) {
      showToast('Enter price per seat.', 'error');
      return;
    }

    if (form.bookingMode === 'FULL_VEHICLE' && !form.fullVehiclePrice) {
      showToast('Enter complete vehicle booking price.', 'error');
      return;
    }

    if (form.bookingMode === 'BOTH' && (!form.pricePerSeat || !form.fullVehiclePrice)) {
      showToast('Enter both price per seat and complete vehicle price.', 'error');
      return;
    }

    const sourceLat = parseFloat(form.sourceLat);
    const sourceLng = parseFloat(form.sourceLng);
    const destLat = parseFloat(form.destLat);
    const destLng = parseFloat(form.destLng);
    const basePrice = parseFloat(form.basePrice);
    const pricePerSeat = parseFloat(form.pricePerSeat) || 0;
    const fullVehiclePrice = form.fullVehiclePrice ? parseFloat(form.fullVehiclePrice) : undefined;

    if ([sourceLat, sourceLng, destLat, destLng, basePrice].some(Number.isNaN)) {
      showToast('Latitude, longitude and price fields must be valid numbers.', 'error');
      return;
    }

    if (form.isRecurring) {
      if (!form.recurrencePattern) {
        showToast('Please select a recurrence pattern.', 'error');
        return;
      }
      if (!form.recurrenceEndDate) {
        showToast('Please select a recurrence end date.', 'error');
        return;
      }
      const depDate = new Date(form.departureTime);
      const endDate = new Date(form.recurrenceEndDate);
      if (endDate <= depDate) {
        showToast('Recurrence end date must be after the departure date.', 'error');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        vehicleId: form.vehicleId,
        title: form.title,
        description: form.description,
        tripType: form.tripType,
        source: form.source,
        destination: form.destination,
        sourceLat,
        sourceLng,
        destLat,
        destLng,
        departureTime: new Date(form.departureTime).toISOString(),
        arrivalTime: form.arrivalTime ? new Date(form.arrivalTime).toISOString() : undefined,
        basePrice,
        pricePerSeat,
        bookingMode: form.bookingMode,
        fullVehiclePrice,
        isRecurring: form.isRecurring,
        recurrencePattern: form.isRecurring ? form.recurrencePattern : undefined,
        recurrenceEndDate: form.isRecurring && form.recurrenceEndDate ? new Date(`${form.recurrenceEndDate}T23:59:59Z`).toISOString() : undefined,
      } as any;

      // debug: log outgoing payload
      // eslint-disable-next-line no-console
      console.debug('createTrip payload', payload);

      await apiClient.createTrip(payload);

      showToast('Trip created successfully.', 'success');
      router.push('/dashboard/fleet-owner/vehicles');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create trip.';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const noVehicles = !vehicles || vehicles.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Trip</h1>
            <p className="text-gray-600 mt-1">
              Add a new trip for your fleet and make it available for bookings.
            </p>
            {currentFleetName && (
              <p className="text-sm text-gray-500 mt-2">Fleet: {currentFleetName}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/fleet-owner/vehicles">
              <Button variant="secondary">Back to Vehicles</Button>
            </Link>
            <Link href="/dashboard/fleet-owner">
              <Button variant="secondary">Fleet Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {(!currentFleetName || noVehicles) ? (
            <div className="space-y-4">
              {!currentFleetName && (
                <p className="text-sm text-gray-600">
                  You need a fleet before creating trips. Create a fleet first, then add vehicles.
                </p>
              )}
              {currentFleetName && noVehicles && (
                <p className="text-sm text-gray-600">
                  Add a vehicle to your fleet before creating a trip. Then return here.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/fleet-owner/vehicles">
                  <Button>{noVehicles ? 'Manage Fleet Vehicles' : 'Back to Fleet'}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {/* Vehicle Selection & Trip Title */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Select
                  label="Select Vehicle"
                  value={form.vehicleId}
                  onChange={(event) => handleChange('vehicleId', event.target.value)}
                  options={vehicles.map((vehicle) => ({
                    value: vehicle.id,
                    label: `${vehicle.registrationNumber} — ${vehicle.make ?? vehicle.brand ?? ''} ${vehicle.model}`.trim(),
                  }))}
                  placeholder="Choose a vehicle"
                  required
                />
                <Input
                  label="Trip Title"
                  value={form.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  placeholder="e.g. Mumbai to Pune Express"
                  required
                />
              </div>

              {/* Source & Destination Search Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SearchInput
                  label="Source"
                  value={form.source}
                  required
                  isSource
                  onChange={(v) => {
                    handleChange('source', v);
                    setSourceSelected(false);
                    handleChange('sourceLat', '');
                    handleChange('sourceLng', '');
                  }}
                  onPlaceSelect={(address, lat, lng) => {
                    setForm((prev) => ({
                      ...prev,
                      source: address,
                      sourceLat: String(lat),
                      sourceLng: String(lng),
                    }));
                    setSourceSelected(true);
                  }}
                />

                <SearchInput
                  label="Destination"
                  value={form.destination}
                  required
                  onChange={(v) => {
                    handleChange('destination', v);
                    setDestSelected(false);
                    handleChange('destLat', '');
                    handleChange('destLng', '');
                  }}
                  onPlaceSelect={(address, lat, lng) => {
                    setForm((prev) => ({
                      ...prev,
                      destination: address,
                      destLat: String(lat),
                      destLng: String(lng),
                    }));
                    setDestSelected(true);
                  }}
                />
              </div>

              {/* Source Coordinates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label="Source Latitude"
                  type="number"
                  step="0.000001"
                  value={form.sourceLat}
                  onChange={(event) => handleChange('sourceLat', event.target.value)}
                  required
                />
                <Input
                  label="Source Longitude"
                  type="number"
                  step="0.000001"
                  value={form.sourceLng}
                  onChange={(event) => handleChange('sourceLng', event.target.value)}
                  required
                />
              </div>

              {/* Destination Coordinates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label="Destination Latitude"
                  type="number"
                  step="0.000001"
                  value={form.destLat}
                  onChange={(event) => handleChange('destLat', event.target.value)}
                  required
                />
                <Input
                  label="Destination Longitude"
                  type="number"
                  step="0.000001"
                  value={form.destLng}
                  onChange={(event) => handleChange('destLng', event.target.value)}
                  required
                />
              </div>

              {/* Departure & Arrival Times */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label="Departure Time"
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(event) => handleChange('departureTime', event.target.value)}
                  required
                />
                <Input
                  label="Arrival Time (optional)"
                  type="datetime-local"
                  value={form.arrivalTime}
                  onChange={(event) => handleChange('arrivalTime', event.target.value)}
                />
              </div>

              {/* ── Booking Mode (Single Person vs Complete Car) ── */}
              <div className="border-t border-gray-100 pt-5">
                <label className="text-sm font-bold text-gray-900 block mb-1.5">
                  Booking Mode / Option
                </label>
                <p className="text-xs text-gray-500 mb-3.5">
                  Choose whether passengers book individual seats or must book the complete car.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* Option 1: SEAT */}
                  <div
                    onClick={() => {
                      handleChange('bookingMode', 'SEAT');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none',
                      form.bookingMode === 'SEAT'
                        ? 'border-[#4F46E5] bg-indigo-50/40 shadow-2xs ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">Per-Seat (Single)</span>
                      <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', form.bookingMode === 'SEAT' ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-300')}>
                        {form.bookingMode === 'SEAT' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Passengers book individual seats, sharing the vehicle with others.
                    </p>
                  </div>

                  {/* Option 2: FULL_VEHICLE */}
                  <div
                    onClick={() => {
                      handleChange('bookingMode', 'FULL_VEHICLE');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none',
                      form.bookingMode === 'FULL_VEHICLE'
                        ? 'border-[#4F46E5] bg-indigo-50/40 shadow-2xs ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">Complete Car Only</span>
                      <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', form.bookingMode === 'FULL_VEHICLE' ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-300')}>
                        {form.bookingMode === 'FULL_VEHICLE' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Entire car reserved exclusively for 1 customer/group (Private Cab).
                    </p>
                  </div>

                  {/* Option 3: BOTH */}
                  <div
                    onClick={() => {
                      handleChange('bookingMode', 'BOTH');
                    }}
                    className={cn(
                      'p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none',
                      form.bookingMode === 'BOTH'
                        ? 'border-[#4F46E5] bg-indigo-50/40 shadow-2xs ring-1 ring-[#4F46E5]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">Both Options</span>
                      <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', form.bookingMode === 'BOTH' ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-300')}>
                        {form.bookingMode === 'BOTH' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                      Passengers can choose either per-seat or book the whole car.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label="Base Price (₹)"
                  type="number"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(event) => handleChange('basePrice', event.target.value)}
                  placeholder="e.g. 100"
                  required
                />

                {form.bookingMode === 'FULL_VEHICLE' ? (
                  <Input
                    label="Complete Car Booking Price (₹)"
                    type="number"
                    step="0.01"
                    value={form.fullVehiclePrice}
                    onChange={(event) => {
                      handleChange('fullVehiclePrice', event.target.value);
                      const capacity = vehicles.find((v) => v.id === form.vehicleId)?.seatingCapacity || 4;
                      const val = parseFloat(event.target.value);
                      if (!isNaN(val) && val > 0) {
                        handleChange('pricePerSeat', String(Math.round(val / capacity)));
                      }
                    }}
                    placeholder="e.g. 2999 (Entire Vehicle Fare)"
                    required
                  />
                ) : form.bookingMode === 'BOTH' ? (
                  <>
                    <Input
                      label="Price Per Seat (₹)"
                      type="number"
                      step="0.01"
                      value={form.pricePerSeat}
                      onChange={(event) => handleChange('pricePerSeat', event.target.value)}
                      placeholder="e.g. 499"
                      required
                    />
                    <Input
                      label="Complete Car Booking Price (₹)"
                      type="number"
                      step="0.01"
                      value={form.fullVehiclePrice}
                      onChange={(event) => handleChange('fullVehiclePrice', event.target.value)}
                      placeholder="e.g. 2999 (Entire Vehicle Fare)"
                      required
                    />
                  </>
                ) : (
                  <Input
                    label="Price Per Seat (₹)"
                    type="number"
                    step="0.01"
                    value={form.pricePerSeat}
                    onChange={(event) => handleChange('pricePerSeat', event.target.value)}
                    placeholder="e.g. 499"
                    required
                  />
                )}
              </div>

              {/* Trip Type & Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Select
                  label="Trip Type"
                  value={form.tripType}
                  onChange={(event) => handleChange('tripType', event.target.value)}
                  options={tripTypeOptions}
                  required
                />
                <Input
                  label="Description"
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  placeholder="Optional trip description"
                />
              </div>

              {/* Recurrence Settings */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recurrence Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={form.isRecurring}
                      onChange={(e) => handleChange('isRecurring', e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 select-none">
                      Make this a recurring trip (Schedule multiple trips)
                    </label>
                  </div>

                  {form.isRecurring && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Select
                        label="Recurrence Pattern"
                        value={form.recurrencePattern}
                        onChange={(event) => handleChange('recurrencePattern', event.target.value)}
                        options={[
                          { value: 'daily', label: 'Every Day' },
                          { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
                          { value: 'weekly', label: 'Every Week' },
                          { value: 'monthly', label: 'Every Month' },
                        ]}
                        required={form.isRecurring}
                      />
                      <Input
                        label="Recurrence End Date"
                        type="date"
                        value={form.recurrenceEndDate}
                        onChange={(event) => handleChange('recurrenceEndDate', event.target.value)}
                        required={form.isRecurring}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Link href="/dashboard/fleet-owner/vehicles">
                  <Button variant="secondary">Cancel</Button>
                </Link>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Creating…' : 'Create Trip'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
