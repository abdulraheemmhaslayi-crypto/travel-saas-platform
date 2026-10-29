'use client';

import React from 'react';
import { Trip } from '@/types/trip';
import { formatDateTime, formatCurrency, formatDuration } from '@/lib/utils';
import { 
  MapPin, Calendar, Users, Clock, Star, Shield, Wifi, Coffee, 
  Snowflake, ArrowRight, Phone, Car, Info, Tv, Briefcase, Zap, 
  CheckCircle, ShieldAlert, Navigation 
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import MapView from '@/components/maps/MapView';
import { cn } from '@/lib/utils';

interface TripDetailsProps {
  trip: Trip;
  onBook?: () => void;
}

const TripDetails: React.FC<TripDetailsProps> = ({ trip, onBook }) => {
  const departureDate = new Date(trip.departureDate);
  const isUpcoming = departureDate > new Date();
  const occupancyRate = trip.totalSeats > 0 ? ((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100 : 0;

  // Sorting stops chronologically by sequenceOrder
  const sortedStops = [...(trip.stops || [])].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  // Formatting duration
  const tripDuration = trip.estimatedDuration 
    ? `${Math.floor(trip.estimatedDuration / 60)}h ${trip.estimatedDuration % 60}m` 
    : trip.departureTime && trip.arrivalTime
      ? formatDuration(
          Math.abs(new Date(trip.arrivalTime).getTime() - new Date(trip.departureTime).getTime()) / 60000
        )
      : 'N/A';

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

  // Mapping vehicle amenities dynamically
  const vehicleAmenitiesList = [];
  if (trip.vehicle) {
    if (trip.vehicle.hasAC) vehicleAmenitiesList.push({ label: 'Air Conditioning', icon: <Snowflake className="w-4 h-4 text-blue-500" /> });
    if (trip.vehicle.hasWifi) vehicleAmenitiesList.push({ label: 'Free Wi-Fi', icon: <Wifi className="w-4 h-4 text-indigo-500" /> });
    if (trip.vehicle.hasCharging) vehicleAmenitiesList.push({ label: 'Charging Ports', icon: <Zap className="w-4 h-4 text-yellow-500" /> });
    if (trip.vehicle.hasEntertainment) vehicleAmenitiesList.push({ label: 'Entertainment System', icon: <Tv className="w-4 h-4 text-purple-500" /> });
    if (trip.vehicle.hasLuggageSpace) vehicleAmenitiesList.push({ label: 'Spacious Trunk', icon: <Briefcase className="w-4 h-4 text-emerald-500" /> });
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Map Card */}
      {routePoints.length > 0 && (
        <Card className="overflow-hidden border border-gray-200 shadow-sm rounded-2xl">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary-500" /> Route Map
            </h2>
            <span className="text-xs text-gray-500 font-medium">
              {trip.distanceKm ? `${trip.distanceKm} km total` : 'Live Route Path'}
            </span>
          </div>
          <div className="relative z-0">
            <MapView 
              center={routePoints[0]} 
              markers={mapMarkers} 
              route={routePoints} 
              zoom={7} 
              height="350px" 
            />
          </div>
        </Card>
      )}

      {/* Main Header / Meta Details */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
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
                  {formatCurrency(trip.pricePerSeat ?? trip.price, trip.currency)}
                </p>
                <p className="text-xs text-gray-500 font-medium">per seat</p>
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

      {/* Route Stops Timeline */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-500" /> Dynamic Route Timeline
          </h2>
          <div className="relative pl-8 border-l-2 border-dashed border-gray-200 ml-3 space-y-8">
            {/* Start Node */}
            <div className="relative">
              <span className="absolute -left-[41px] top-0.5 bg-white p-1 rounded-full border-2 border-primary-600 text-primary-600 shadow-sm z-10">
                <MapPin className="w-4 h-4 fill-primary-100" />
              </span>
              <div>
                <h4 className="font-semibold text-gray-900 text-base">{trip.origin}</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Departure: {formatDateTime(trip.departureDate)}
                </p>
              </div>
            </div>

            {/* Dynamic Stops */}
            {sortedStops.map((stop, index) => (
              <div key={stop.id || index} className="relative">
                <span className="absolute -left-[37px] top-1 bg-white p-0.5 rounded-full border border-gray-400 text-gray-500 shadow-sm z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">{stop.stopName}</h4>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                    {stop.estimatedArrival && (
                      <span>Arrival: {formatDateTime(stop.estimatedArrival)}</span>
                    )}
                    {stop.stopDuration !== undefined && stop.stopDuration > 0 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                        Halt: {stop.stopDuration} mins
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* End Node */}
            <div className="relative">
              <span className="absolute -left-[41px] top-0.5 bg-white p-1 rounded-full border-2 border-green-600 text-green-600 shadow-sm z-10">
                <CheckCircle className="w-4 h-4 fill-green-100" />
              </span>
              <div>
                <h4 className="font-semibold text-gray-900 text-base">{trip.destination}</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Estimated Arrival: {trip.arrivalDate ? formatDateTime(trip.arrivalDate) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Duration: {tripDuration}</span>
            <span>Total Stops: {sortedStops.length} intermediate stops</span>
          </div>
        </div>
      </Card>

      {/* Dynamic Vehicle Info Section */}
      {trip.vehicle && (
        <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-500" /> Vehicle Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Column */}
              <div className="md:col-span-1">
                {trip.vehicle.vehicleImage ? (
                  <div className="w-full h-40 rounded-xl overflow-hidden border border-gray-200 relative group">
                    <img 
                      src={trip.vehicle.vehicleImage} 
                      alt={`${trip.vehicle.brand} ${trip.vehicle.model}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Car className="w-10 h-10" />
                    <span className="text-xs font-semibold">No Vehicle Image</span>
                  </div>
                )}
              </div>

              {/* Specifications Column */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {trip.vehicle.brand} {trip.vehicle.model}
                    <span className="text-sm font-medium text-gray-500 ml-2">({trip.vehicle.year})</span>
                  </h3>
                  <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide bg-gray-100 inline-block px-2.5 py-0.5 rounded-full">
                    Plate: {trip.vehicle.registrationNumber}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-medium text-gray-600">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Category</span>
                    <span className="text-gray-800 font-bold capitalize">{trip.vehicle.type}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-0.5">Color</span>
                    <span className="text-gray-800 font-bold capitalize">{trip.vehicle.color}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 col-span-2 sm:col-span-1">
                    <span className="text-gray-400 block mb-0.5">Total Capacity</span>
                    <span className="text-gray-800 font-bold">{trip.vehicle.seatingCapacity} seats</span>
                  </div>
                </div>

                {/* Amenities Badges */}
                {vehicleAmenitiesList.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {vehicleAmenitiesList.map((amenity, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 shadow-sm"
                        >
                          {amenity.icon}
                          <span>{amenity.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Dynamic Driver Information Section */}
      {trip.driver && (
        <Card className="border border-gray-200 shadow-sm rounded-2xl">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-500" /> Driver Details
            </h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar
                src={trip.driver.user.profileImage}
                name={`${trip.driver.user.firstName} ${trip.driver.user.lastName}`}
                size="lg"
                className="w-16 h-16 border-2 border-primary-100 shadow-sm"
              />
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-1.5">
                      {trip.driver.user.firstName} {trip.driver.user.lastName}
                      {trip.driver.status === 'approved' && (
                        <span title="Verified Driver">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-sm font-bold text-gray-800">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{trip.driver.rating > 0 ? Number(trip.driver.rating).toFixed(1) : 'New'}</span>
                      {trip.driver.totalRatings > 0 && (
                        <span className="text-xs font-medium text-gray-400 ml-1">
                          ({trip.driver.totalRatings} ratings)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {trip.driver.user.phone && (
                    <a
                      href={`tel:${trip.driver.user.phone}`}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-bold transition-colors shadow-sm self-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Contact Driver
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1 text-xs text-gray-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-green-600" />
                    {trip.driver.status === 'approved' ? 'Verified Driver Profile' : 'Driver Active'}
                  </span>
                  {trip.driver.drivingExperience !== undefined && trip.driver.drivingExperience > 0 && (
                    <>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span>{trip.driver.drivingExperience} years driving experience</span>
                    </>
                  )}
                  {trip.driver.totalTrips > 0 && (
                    <>
                      <span className="text-gray-300 hidden sm:inline">|</span>
                      <span>{trip.driver.totalTrips} total trips driven</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* About Description */}
      {trip.description && (
        <Card className="border border-gray-200 shadow-sm rounded-2xl">
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-gray-500" /> About This Trip
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{trip.description}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TripDetails;