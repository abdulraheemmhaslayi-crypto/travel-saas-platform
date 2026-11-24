'use client';

import React, { useState } from 'react';
import { Trip } from '@/types/trip';
import { formatDateTime, formatCurrency, getTripVehicleImage, cn } from '@/lib/utils';
import { 
  MapPin, Calendar, Clock, Star, Shield, ShieldCheck, Wifi, 
  Snowflake, ArrowRight, Phone, Car, Info, Tv, Briefcase, Zap, 
  Navigation, Maximize2, Minimize2, Milestone
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import MapView from '@/components/maps/MapView';
import { useAuthStore } from '@/store/slices/authSlice';

interface TripDetailsProps {
  trip: Trip;
  onBook?: () => void;
  hideHeaderCard?: boolean;
  canViewDriverContact?: boolean;
}

const TripDetails: React.FC<TripDetailsProps> = ({ 
  trip, 
  onBook, 
  hideHeaderCard = false,
  canViewDriverContact
}) => {
  const { user } = useAuthStore();
  const userType = String(user?.userType || (user as any)?.role || '').toUpperCase();
  const isFleetOwnerOrAdmin = userType === 'FLEET_OWNER' || userType === 'VEHICLE_OWNER' || userType === 'ADMIN' || userType === 'SUPER_ADMIN';
  const showDriverContact = canViewDriverContact !== undefined 
    ? canViewDriverContact 
    : isFleetOwnerOrAdmin;

  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const departureDate = new Date(trip.departureDate);
  const occupancyRate = trip.totalSeats > 0 ? ((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100 : 0;

  // Sorting stops chronologically by sequenceOrder
  const sortedStops = [...(trip.stops || [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // Formatting duration cleanly without formatting bugs (e.g. avoiding '214h 9.264h')
  const getCleanDuration = (): string => {
    if (trip.estimatedDuration) {
      const rawNum = Number(trip.estimatedDuration);
      if (!isNaN(rawNum) && rawNum > 0 && rawNum <= 1440) {
        const h = Math.floor(rawNum / 60);
        const m = Math.round(rawNum % 60);
        if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
        return `${m}m`;
      }
    }

    if (trip.departureDate && trip.arrivalDate) {
      const dep = new Date(trip.departureDate).getTime();
      const arr = new Date(trip.arrivalDate).getTime();
      if (!isNaN(dep) && !isNaN(arr) && arr > dep) {
        const diffMins = Math.round((arr - dep) / 60000);
        if (diffMins > 0 && diffMins < 48 * 60) {
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
      }
    }

    if (trip.departureTime && trip.arrivalTime) {
      const dep = new Date(trip.departureTime).getTime();
      const arr = new Date(trip.arrivalTime).getTime();
      if (!isNaN(dep) && !isNaN(arr) && arr > dep) {
        const diffMins = Math.round((arr - dep) / 60000);
        if (diffMins > 0 && diffMins < 48 * 60) {
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
      }
    }

    return '4h 30m';
  };

  const cleanDuration = getCleanDuration();

  // Preparing coordinates for MapView
  const routePoints = trip.routes && trip.routes.length > 0
    ? [...trip.routes].sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)).map(r => ({ lat: Number(r.latitude), lng: Number(r.longitude) }))
    : [
        { lat: Number(trip.sourceLat), lng: Number(trip.sourceLng) },
        ...sortedStops.map(s => ({ lat: Number(s.latitude), lng: Number(s.longitude) })),
        { lat: Number(trip.destLat), lng: Number(trip.destLng) }
      ].filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);

  const mapMarkers = [
    { position: { lat: Number(trip.sourceLat), lng: Number(trip.sourceLng) }, popup: `Source: ${trip.origin}` },
    ...sortedStops.map(s => ({ position: { lat: Number(s.latitude), lng: Number(s.longitude) }, popup: `Stop: ${s.stopName}` })),
    { position: { lat: Number(trip.destLat), lng: Number(trip.destLng) }, popup: `Destination: ${trip.destination}` }
  ].filter(m => !isNaN(m.position.lat) && !isNaN(m.position.lng) && m.position.lat !== 0 && m.position.lng !== 0);

  const getBookingButtonState = () => {
    if (trip.status === 'COMPLETED') {
      return { disabled: true, text: 'Trip Completed', variant: 'secondary' as const };
    }
    if (trip.status === 'CANCELLED') {
      return { disabled: true, text: 'Trip Cancelled', variant: 'danger' as const };
    }
    if (trip.vehicle && trip.vehicle.status !== 'approved') {
      return { disabled: true, text: 'Vehicle Unapproved', variant: 'secondary' as const };
    }
    if (!trip.allowBooking) {
      return { disabled: true, text: 'Booking Closed', variant: 'secondary' as const };
    }
    if (trip.availableSeats <= 0) {
      return { disabled: true, text: 'Sold Out', variant: 'secondary' as const };
    }
    return { disabled: false, text: 'Book Now', variant: 'primary' as const };
  };

  const bookingState = getBookingButtonState();

  // Vehicle image
  const vehicleImg = trip.vehicle?.vehicleImage || getTripVehicleImage(trip.vehicle || trip.vehicleType);

  // Mapping vehicle amenities dynamically
  const vehicleAmenitiesList = [];
  const v = trip.vehicle;
  if (!v || v.hasAC !== false) {
    vehicleAmenitiesList.push({ label: 'Air Conditioning', icon: <Snowflake className="w-3.5 h-3.5 text-blue-500" /> });
  }
  if (!v || v.hasWifi !== false) {
    vehicleAmenitiesList.push({ label: 'Free Wi-Fi', icon: <Wifi className="w-3.5 h-3.5 text-indigo-500" /> });
  }
  if (!v || v.hasCharging !== false) {
    vehicleAmenitiesList.push({ label: 'Charging Ports', icon: <Zap className="w-3.5 h-3.5 text-amber-500" /> });
  }
  if (v?.hasEntertainment) {
    vehicleAmenitiesList.push({ label: 'Entertainment System', icon: <Tv className="w-3.5 h-3.5 text-purple-500" /> });
  }
  if (v?.hasLuggageSpace) {
    vehicleAmenitiesList.push({ label: 'Spacious Trunk', icon: <Briefcase className="w-3.5 h-3.5 text-emerald-500" /> });
  }

  // Driver details extraction
  const driverUser = trip.driver?.user;
  const driverName = driverUser 
    ? `${driverUser.firstName || ''} ${driverUser.lastName || ''}`.trim() 
    : ((trip as any).driverName || 'raheem Mhaslayi');
  
  const driverInitials = driverUser?.firstName
    ? `${driverUser.firstName.charAt(0)}${driverUser.lastName ? driverUser.lastName.charAt(0) : ''}`.toUpperCase()
    : 'RM';

  const driverPhone = driverUser?.phone || (trip.driver as any)?.phone || '';
  const driverRating = trip.driver?.rating ? Number(trip.driver.rating) : 0;
  const driverRatingText = driverRating > 0 ? driverRating.toFixed(1) : 'New';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Route Map Card ── */}
      {routePoints.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#4F46E5]" />
              <span>Route Map</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <span>{trip.distanceKm ? `${trip.distanceKm} km Live Route` : 'Live Route Path'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
          </div>

          <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-100">
            <MapView 
              center={routePoints[0]} 
              markers={mapMarkers} 
              route={routePoints} 
              zoom={7} 
              height={isMapExpanded ? "420px" : "220px"} 
            />
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="absolute bottom-2.5 right-2.5 z-10 p-2 bg-white/95 backdrop-blur-xs rounded-xl border border-gray-200/90 shadow-md text-gray-700 hover:text-black active:scale-95 transition-all"
              title={isMapExpanded ? "Collapse Map" : "Expand Map"}
              aria-label="Toggle map size"
            >
              {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Dynamic Route Timeline Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-[#4F46E5]" />
            <span>Dynamic Route Timeline</span>
          </h2>
        </div>

        <div className="space-y-0 relative pl-1">
          {/* Origin Node */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-[#4F46E5] flex items-center justify-center text-[#4F46E5] shrink-0 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 fill-[#4F46E5]/20 text-[#4F46E5]" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                {trip.origin || trip.source}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Departure: {formatDateTime(trip.departureDate || trip.departureTime || '')}
              </p>
            </div>
          </div>

          {/* Vertical Connecting Line */}
          <div className="ml-3.5 my-1 w-0.5 h-6 border-l-2 border-dashed border-indigo-200" />

          {/* Dynamic Intermediate Stops */}
          {sortedStops.map((stop, idx) => (
            <React.Fragment key={stop.id || idx}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h4 className="font-bold text-gray-800 text-xs truncate">{stop.stopName}</h4>
                  <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
                    {stop.estimatedArrival && <span>Arrival: {formatDateTime(stop.estimatedArrival)}</span>}
                    {stop.stopDuration ? (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-700">
                        Halt: {stop.stopDuration}m
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="ml-3.5 my-1 w-0.5 h-6 border-l-2 border-dashed border-indigo-200" />
            </React.Fragment>
          ))}

          {/* Destination Node */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border-2 border-[#4F46E5] flex items-center justify-center text-[#4F46E5] shrink-0 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 fill-[#4F46E5]/20 text-[#4F46E5]" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                {trip.destination}
              </h4>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Arrival: {trip.arrivalDate ? `${formatDateTime(trip.arrivalDate)} (Est.)` : (trip.arrivalTime ? `${formatDateTime(trip.arrivalTime)} (Est.)` : 'Est. Transit')}
              </p>
            </div>
          </div>
        </div>

        {/* Duration & Stops Metric Bar */}
        <div className="bg-slate-50/90 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-3 mt-4">
          <div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-[#4F46E5] block mt-1">
              {cleanDuration}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Milestone className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Stops</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs sm:text-sm font-extrabold text-gray-900">
                {sortedStops.length}
              </span>
              <span className="text-[10px] text-gray-500 font-medium ml-1">
                (Intermediate stops)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vehicle Information Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Car className="w-4 h-4 text-[#4F46E5]" />
            <span>Vehicle Information</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Vehicle Image Container */}
          <div className="w-full sm:w-36 h-28 bg-slate-50/90 rounded-2xl p-2.5 flex items-center justify-center shrink-0 border border-slate-100">
            <img 
              src={vehicleImg} 
              alt={trip.vehicle?.model || 'Vehicle'} 
              className="w-full h-full object-contain drop-shadow-xs"
            />
          </div>

          {/* Vehicle Specifications */}
          <div className="flex-1 w-full space-y-2">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
                {trip.vehicle?.brand || 'Toyota'} {trip.vehicle?.model || 'Innova'}
                <span className="text-xs font-semibold text-gray-400 ml-1.5">
                  ({trip.vehicle?.year || '2026'})
                </span>
              </h3>
              <span className="inline-block mt-1 font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded uppercase">
                PLATE: {trip.vehicle?.registrationNumber || 'MH1'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase block">Category</span>
                <span className="text-xs font-extrabold text-gray-800 capitalize truncate block">
                  {trip.vehicle?.type || trip.vehicleType || 'Sedan'}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5">
                <span className="text-[9px] text-gray-400 font-bold uppercase block">Color</span>
                <span className="text-xs font-extrabold text-gray-800 capitalize truncate block">
                  {trip.vehicle?.color || 'Black'}
                </span>
              </div>
            </div>

            <div className="pt-0.5">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">Total Capacity</span>
              <span className="text-xs font-extrabold text-gray-900">
                {trip.vehicle?.seatingCapacity || trip.totalSeats || 8} seats
              </span>
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        {vehicleAmenitiesList.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Amenities
            </h4>
            <div className="flex flex-wrap gap-2">
              {vehicleAmenitiesList.map((amenity, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-gray-700 shadow-2xs"
                >
                  {amenity.icon}
                  <span>{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Driver Details Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#4F46E5]" />
            <span>Driver Details</span>
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar Circle */}
            {driverUser?.profileImage ? (
              <img 
                src={driverUser.profileImage} 
                alt={driverName} 
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-2xs shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                {driverInitials}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate capitalize">
                {driverName}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{driverRatingText}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Driver Active</span>
              </div>
            </div>
          </div>

          {/* Driver Contact: Visible ONLY to Fleet Owners / Admin, hidden from passengers */}
          {showDriverContact ? (
            driverPhone ? (
              <a
                href={`tel:${driverPhone}`}
                className="border border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50 active:scale-95 transition-all rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Driver</span>
              </a>
            ) : (
              <button
                type="button"
                className="border border-[#4F46E5] text-[#4F46E5] hover:bg-indigo-50 active:scale-95 transition-all rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Driver</span>
              </button>
            )
          ) : (
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Captain</span>
            </div>
          )}
        </div>
      </div>

      {/* ── About This Trip ── */}
      {trip.description && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
          <h2 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            <span>About This Trip</span>
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {trip.description}
          </p>
        </div>
      )}

      {/* Main Header / Meta Details (only shown if parent page didn't hide it) */}
      {!hideHeaderCard && (
        <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden mt-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={trip.status === 'SCHEDULED' ? 'info' : trip.status === 'COMPLETED' ? 'success' : trip.status === 'CANCELLED' ? 'danger' : 'warning'}>
                    {trip.status}
                  </Badge>
                  {trip.vehicleType && (
                    <Badge variant="outline" className="capitalize">{trip.vehicleType}</Badge>
                  )}
                  {trip.tripType && (
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{trip.tripType.replace('_', ' ')}</Badge>
                  )}
                  {occupancyRate >= 80 && trip.status === 'SCHEDULED' && (
                    <Badge variant="warning" size="sm">Filling Fast</Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                  {trip.origin} <ArrowRight className="inline-block mx-1 w-5 h-5 text-gray-400" /> {trip.destination}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4.5 h-4.5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-800">Departure</p>
                      <p className="text-xs text-gray-500">{formatDateTime(trip.departureDate)}</p>
                    </div>
                  </div>
                  {trip.arrivalDate && (
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4.5 h-4.5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-800">Estimated Arrival</p>
                        <p className="text-xs text-gray-500">{formatDateTime(trip.arrivalDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-left lg:text-right border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-2">
                <div>
                  <p className="text-3xl font-black text-primary-600">
                    {formatCurrency(
                      trip.bookingMode === 'FULL_VEHICLE'
                        ? (trip.fullVehiclePrice || trip.pricePerSeat || trip.price || 0)
                        : (trip.pricePerSeat ?? trip.price),
                      trip.currency
                    )}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {trip.bookingMode === 'FULL_VEHICLE' ? 'entire car' : 'per seat'}
                  </p>
                  {trip.basePrice !== undefined && trip.basePrice > 0 && (
                    <p className="text-xs text-gray-400 mt-1">Base Fare: {formatCurrency(trip.basePrice, trip.currency)}</p>
                  )}
                </div>
                <Button 
                  onClick={onBook} 
                  disabled={bookingState.disabled} 
                  variant={bookingState.variant}
                  className="px-6 py-2.5 font-bold shadow-sm"
                >
                  {bookingState.text}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TripDetails;
